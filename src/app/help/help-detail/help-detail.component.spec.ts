import { NO_ERRORS_SCHEMA, Component } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { Column } from '@onecx/portal-integration-angular'

import { Help, HelpsInternalAPIService, CreateHelp, Product } from 'src/app/shared/generated'
import { HelpDetailComponent } from './help-detail.component'

function convertFormGroupProductToProductName(formGroup: FormGroup) {
  const expectedArgument = formGroup.value
  expectedArgument.productName = expectedArgument.product.name
  delete expectedArgument.product
  return expectedArgument
}

describe('HelpDetailComponent', () => {
  let component: HelpDetailComponent
  let fixture: ComponentFixture<HelpDetailComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = {
    createNewHelp: jasmine.createSpy('createNewHelp').and.returnValue(of({})),
    updateHelp: jasmine.createSpy('updateHelp').and.returnValue(of({}))
  }
  const dummyHelpItem = {
    id: 'dummy',
    product: 'productName',
    itemId: 'itemId',
    baseUrl: 'http://path'
  }

  @Component({
    selector: 'app-help-form',
    template: ''
  })
  class MockHelpFormComponent {
    formGroup = new FormGroup({
      product: new FormControl(''),
      itemId: new FormControl(''),
      baseUrl: new FormControl('')
    })
    changeMode = ''
    helpItem: undefined
    columns!: Column[]
    products: Product[] = []
    productsFiltered: Product[] = []
    filterProducts(event: { query: string }): void {
      console.log('Filtering products with query:', event.query)
    }
    sortProductsByName(a: Product, b: Product): number {
      return a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase())
    }
    // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
    ngOnChanges(): void {
      console.log('On changes')
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpDetailComponent, MockHelpFormComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiServiceSpy.createNewHelp.calls.reset()
    apiServiceSpy.updateHelp.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should create a help item onSave', () => {
    apiServiceSpy.createNewHelp.and.returnValue(of({}))
    component.changeMode = 'CREATE'
    const mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: 'product2',
      itemId: 'itemId2',
      baseUrl: 'base'
    })
    component.helpFormComponent = mockHelpForm
    spyOn(component.searchEmitter, 'emit')

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATION_SUCCESS' })
    expect(component.searchEmitter.emit).toHaveBeenCalled()
    const expectedArgument = convertFormGroupProductToProductName(component.helpFormComponent.formGroup)
    expect(apiServiceSpy.createNewHelp).toHaveBeenCalledWith({
      createHelp: expectedArgument as CreateHelp
    })
  })

  it('should display creation error', () => {
    const mockError = {
      error: {
        key: 'SERVER_ERROR'
      }
    }
    apiServiceSpy.createNewHelp.and.returnValue(throwError(() => mockError))
    component.changeMode = 'CREATE'
    const mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: dummyHelpItem.product,
      itemId: dummyHelpItem.itemId,
      baseUrl: dummyHelpItem.baseUrl
    })
    component.helpItem = dummyHelpItem
    component.helpFormComponent = mockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' })
  })

  it('should display unique constraint creation error', () => {
    const mockError = {
      error: {
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    apiServiceSpy.createNewHelp.and.returnValue(throwError(() => mockError))
    component.changeMode = 'CREATE'
    const mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: dummyHelpItem.product,
      itemId: dummyHelpItem.itemId,
      baseUrl: dummyHelpItem.baseUrl
    })
    component.helpItem = dummyHelpItem
    component.helpFormComponent = mockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
      detailKey: 'VALIDATION.ERRORS.HELP_ITEM.UNIQUE_CONSTRAINT'
    })
  })

  it('should display validation error on invalid creation', () => {
    component.changeMode = 'CREATE'
    const invalidMockHelpForm = new MockHelpFormComponent()
    invalidMockHelpForm.formGroup = new FormGroup({
      product: new FormControl('', Validators.required),
      itemId: new FormControl('', Validators.required),
      baseUrl: new FormControl('', Validators.required)
    })
    component.helpFormComponent = invalidMockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'VALIDATION.ERRORS.HELP_ITEM.FORM_INVALID'
    })
  })

  it('should update help item', () => {
    apiServiceSpy.updateHelp.and.returnValue(of({}))
    component.changeMode = 'EDIT'
    component.helpItem = { modificationCount: 0, ...dummyHelpItem } as Help
    const mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: dummyHelpItem.product,
      itemId: dummyHelpItem.itemId,
      baseUrl: dummyHelpItem.baseUrl
    })
    component.helpFormComponent = mockHelpForm

    spyOn(component.searchEmitter, 'emit')

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.UPDATE_SUCCESSFUL' })
    expect(component.searchEmitter.emit).toHaveBeenCalled()
    const expectedArgument = convertFormGroupProductToProductName(component.helpFormComponent.formGroup)
    expect(apiServiceSpy.updateHelp).toHaveBeenCalledWith({
      id: component.helpItem.id,
      updateHelp: { ...expectedArgument, modificationCount: 0 }
    })
  })

  it('should display update error', () => {
    apiServiceSpy.updateHelp.and.returnValue(throwError(() => new Error()))
    component.changeMode = 'EDIT'
    const mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: dummyHelpItem.product,
      itemId: dummyHelpItem.itemId,
      baseUrl: dummyHelpItem.baseUrl
    })
    component.helpItem = dummyHelpItem
    component.helpFormComponent = mockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.UPDATE_ERROR' })
  })

  it('should display validation error on invalid update', () => {
    component.changeMode = 'EDIT'
    const invalidMockHelpForm = new MockHelpFormComponent()
    invalidMockHelpForm.formGroup = new FormGroup({
      product: new FormControl('', Validators.required),
      itemId: new FormControl('', Validators.required),
      baseUrl: new FormControl('', Validators.required)
    })
    component.helpFormComponent = invalidMockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.ERRORS.HELP_ITEM.FORM_INVALID' })
  })

  it('should emit display change event onDialogHide', () => {
    spyOn(component.displayDetailDialogChange, 'emit')
    component.onDialogHide()

    expect(component.displayDetailDialogChange.emit).toHaveBeenCalledWith(false)
  })
  /*
  it('should update ids OnChanges: itemId in edit mode', () => {
    component.changeMode = 'EDIT'
    component.helpItem = {
      id: 'id',
      itemId: 'itemId'
    }
    component.itemId = 'noId'

    component.ngOnChanges()

    expect(component.itemId).toEqual('id')
  })

  it('should update ids OnChanges: itemId in new mode', () => {
    component.changeMode = 'CREATE'

    component.ngOnChanges()

    expect(component.itemId).toEqual(undefined)
  })
  */
})
