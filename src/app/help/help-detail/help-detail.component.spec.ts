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

const helpItem: Help = {
  id: 'id',
  productName: 'productName',
  itemId: 'itemId',
  baseUrl: 'http://path'
}
const helpItemForm = new FormGroup({
  itemId: new FormControl('title'),
  productName: new FormControl('productName'),
  baseUrl: new FormControl('baseUrl')
})

describe('HelpDetailComponent', () => {
  let component: HelpDetailComponent
  let fixture: ComponentFixture<HelpDetailComponent>

  const defaultLang = 'en'
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = {
    createNewHelp: jasmine.createSpy('createNewHelp').and.returnValue(of({})),
    updateHelp: jasmine.createSpy('updateHelp').and.returnValue(of({}))
  }

  function initTestComponent() {
    fixture = TestBed.createComponent(HelpDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpDetailComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage(defaultLang)
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
    initTestComponent()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiServiceSpy.createNewHelp.calls.reset()
    apiServiceSpy.updateHelp.calls.reset()
  })

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })
  })

  /*

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
      product: helpItem.product,
      itemId: helpItem.itemId,
      baseUrl: helpItem.baseUrl
    })
    component.helpItem = helpItem
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
      product: helpItem.product,
      itemId: helpItem.itemId,
      baseUrl: helpItem.baseUrl
    })
    component.helpItem = helpItem
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
    component.helpItem = { modificationCount: 0, ...helpItem } as Help
    const mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      product: helpItem.product,
      itemId: helpItem.itemId,
      baseUrl: helpItem.baseUrl
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
      product: helpItem.product,
      itemId: helpItem.itemId,
      baseUrl: helpItem.baseUrl
    })
    component.helpItem = helpItem
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
