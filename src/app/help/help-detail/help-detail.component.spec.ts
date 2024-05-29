import { NO_ERRORS_SCHEMA, Component, SimpleChanges } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'

import { AppStateService, createTranslateLoader, Column, PortalMessageService } from '@onecx/portal-integration-angular'
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
    product: 'productName',
    itemId: 'itemId'
  }

  @Component({
    selector: 'app-help-form',
    template: ''
  })
  class MockHelpFormComponent {
    formGroup = new FormGroup({
      product: new FormControl(''),
      itemId: new FormControl('')
    })
    changeMode = ''
    helpItem: undefined
    columns!: Column[]
    products: Product[] = []
    productsFiltered: Product[] = []
    filterProducts(event: { query: string }): void {
      console.log('Filtering products with query:', event.query)
    }
    // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
    ngOnChanges(changes: SimpleChanges): void {
      console.log('On changes')
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpDetailComponent, MockHelpFormComponent],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient, AppStateService]
          }
        })
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
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
    component.changeMode = 'NEW'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: 'product2',
      itemId: 'itemId2'
    })
    component.helpFormComponent = mockHelpForm
    spyOn(component.searchEmitter, 'emit')

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'HELPITEM_CREATION.CREATION_SUCCESS' })
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
    component.changeMode = 'NEW'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: 'help-mgmt-ui',
      itemId: 'PAGE_HELP_SEARCH'
    })
    component.helpFormComponent = mockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELPITEM_CREATION.CREATION_FAILED' })
  })

  it('should display unique constraint creation error', () => {
    const mockError = {
      error: {
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    apiServiceSpy.createNewHelp.and.returnValue(throwError(() => mockError))
    component.changeMode = 'NEW'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: 'help-mgmt-ui',
      itemId: 'PAGE_HELP_SEARCH'
    })
    component.helpFormComponent = mockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'HELPITEM_CREATION.CREATION_FAILED',
      detailKey: 'HELPITEM_CREATION.UNIQUE_CONSTRAINT'
    })
  })

  it('should display validation error on invalid creation', () => {
    component.changeMode = 'NEW'
    let invalidMockHelpForm = new MockHelpFormComponent()
    invalidMockHelpForm.formGroup = new FormGroup({
      product: new FormControl('', Validators.required),
      itemId: new FormControl('', Validators.required)
    })
    component.helpFormComponent = invalidMockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELPITEM_CREATION.VALIDATION_ERROR' })
  })

  it('should update help item', () => {
    apiServiceSpy.updateHelp.and.returnValue(of({}))
    component.changeMode = 'EDIT'
    component.helpItem = { modificationCount: 0, ...dummyHelpItem } as Help
    component.productName = dummyHelpItem.product
    component.itemId = dummyHelpItem.itemId
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.patchValue({
      product: dummyHelpItem.product,
      itemId: dummyHelpItem.itemId
    })
    component.helpFormComponent = mockHelpForm

    spyOn(component.searchEmitter, 'emit')

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.UPDATE_SUCCESSFUL' })
    expect(component.searchEmitter.emit).toHaveBeenCalled()
    const expectedArgument = convertFormGroupProductToProductName(component.helpFormComponent.formGroup)
    expect(apiServiceSpy.updateHelp).toHaveBeenCalledWith({
      id: component.itemId,
      updateHelp: { ...expectedArgument, modificationCount: 0 }
    })
  })

  it('should display update error', () => {
    apiServiceSpy.updateHelp.and.returnValue(throwError(() => new Error()))
    component.changeMode = 'EDIT'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: 'help-mgmt-ui',
      itemId: 'PAGE_HELP_SEARCH'
    })
    component.helpFormComponent = mockHelpForm
    component.productName = 'help-mgmt-ui'
    component.itemId = 'PAGE_HELP_SEARCH'

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.UPDATE_ERROR' })
  })

  it('should display validation error on invalid update', () => {
    component.changeMode = 'EDIT'
    let invalidMockHelpForm = new MockHelpFormComponent()
    invalidMockHelpForm.formGroup = new FormGroup({
      product: new FormControl('', Validators.required),
      itemId: new FormControl('', Validators.required)
    })
    component.helpFormComponent = invalidMockHelpForm
    component.productName = undefined
    component.itemId = undefined

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.VALIDATION_ERROR' })
  })

  it('should emit display change event onDialogHide', () => {
    spyOn(component.displayDetailDialogChange, 'emit')
    component.onDialogHide()

    expect(component.displayDetailDialogChange.emit).toHaveBeenCalledWith(false)
  })

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
    component.changeMode = 'NEW'

    component.ngOnChanges()

    expect(component.itemId).toEqual(undefined)
  })
})
