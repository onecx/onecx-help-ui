import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { HelpDetailComponent } from './help-detail.component'
import { Product } from '../help-search/help-search.component'

const product1: Product = { name: 'product1', displayName: 'Product 1' }
const product2: Product = { name: 'product2', displayName: 'Product 2' }
const products = [product1, product2]
const helpItem: Help = {
  id: 'id',
  productName: product1.name,
  itemId: 'itemId',
  baseUrl: 'http://path'
}
const helpForm = new FormGroup({
  itemId: new FormControl('itemId'),
  productName: new FormControl(product1.name),
  product: new FormControl(product1),
  baseUrl: new FormControl('baseUrl')
})

describe('HelpDetailComponent', () => {
  let component: HelpDetailComponent
  let fixture: ComponentFixture<HelpDetailComponent>

  const defaultLang = 'en'
  const mockUserService = { lang$: { getValue: jasmine.createSpy('getValue') } }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = {
    getHelpById: jasmine.createSpy('getHelpById').and.returnValue(of({})),
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
        { provide: UserService, useValue: mockUserService },
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ]
    }).compileComponents()
  }))

  beforeEach(() => {
    initTestComponent()
  })

  afterEach(() => {
    component.helpForm.reset()
    mockUserService.lang$.getValue.and.returnValue(defaultLang)
    // to spy data: reset
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiServiceSpy.createNewHelp.calls.reset()
    apiServiceSpy.updateHelp.calls.reset()
    apiServiceSpy.getHelpById.calls.reset()
  })

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should reject working if dialog is not open', () => {
      apiServiceSpy.getHelpById.and.returnValue(of(helpItem))
      component.helpItem = helpItem
      component.changeMode = 'VIEW'

      component.ngOnChanges()

      expect(apiServiceSpy.getHelpById).not.toHaveBeenCalled()
    })
  })

  describe('ngOnChange - mode:', () => {
    beforeEach(() => {
      component.displayDialog = true
      component.allProducts = products
    })

    describe('VIEW', () => {
      it('should viewing an item - successful', () => {
        apiServiceSpy.getHelpById.and.returnValue(of(helpItem))
        component.helpItem = helpItem
        component.changeMode = 'VIEW'

        component.ngOnChanges()

        expect(apiServiceSpy.getHelpById).toHaveBeenCalled()
        expect(component.loading).toBeFalse()
        expect(component.helpForm.disabled).toBeTrue()
        expect(component.helpForm.controls['itemId'].value).toBe(helpItem.itemId)
      })

      it('should viewing an item - failed: no data', () => {
        spyOn<any>(component, 'getData')
        component.helpItem = undefined
        component.changeMode = 'VIEW'
        component.displayDialog = true

        component.ngOnChanges()

        expect(component['getData']).not.toHaveBeenCalled()
      })

      it('should viewing an item - failed: missing id', () => {
        apiServiceSpy.getHelpById.and.returnValue(of(helpItem))
        component.helpItem = { ...helpItem, id: undefined }
        component.changeMode = 'VIEW'

        component.ngOnChanges()

        expect(apiServiceSpy.getHelpById).not.toHaveBeenCalled()
      })

      it('should prepare viewing an item - failed: missing permissions', () => {
        const errorResponse = { status: 403, statusText: 'No permissions' }
        apiServiceSpy.getHelpById.and.returnValue(throwError(() => errorResponse))
        component.helpItem = helpItem
        component.changeMode = 'VIEW'
        spyOn(component.helpForm, 'reset')
        spyOn(console, 'error')

        component.ngOnChanges()

        expect(apiServiceSpy.getHelpById).toHaveBeenCalled()
        expect(component.helpForm.reset).toHaveBeenCalled()
        expect(component.helpForm.disabled).toBeTrue()
        expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.HELP_ITEM')
        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: component.exceptionKey })
        expect(console.error).toHaveBeenCalledWith('getHelpById', errorResponse)
      })
    })

    describe('EDIT', () => {
      it('should prepare editing an item - successful', () => {
        apiServiceSpy.getHelpById.and.returnValue(of(helpItem))
        component.changeMode = 'EDIT'
        component.helpItem = helpItem

        component.ngOnChanges()

        expect(apiServiceSpy.getHelpById).toHaveBeenCalled()
        expect(component.loading).toBeFalse()
        expect(component.helpForm.enabled).toBeTrue()
        expect(component.helpForm.controls['itemId'].value).toEqual(helpItem.itemId)
        expect(component.helpForm.controls['baseUrl'].value).toEqual(helpItem.baseUrl)
      })

      it('should prepare editing an item - failed: id missed', () => {
        component.changeMode = 'EDIT'
        component.helpItem = { ...helpItem, id: undefined }

        component.ngOnChanges()

        expect(apiServiceSpy.getHelpById).not.toHaveBeenCalled()
      })

      it('should display error if getting the item fails', () => {
        const errorResponse = { status: 404, statusText: 'Not Found' }
        apiServiceSpy.getHelpById.and.returnValue(throwError(() => errorResponse))
        component.changeMode = 'EDIT'
        component.helpItem = helpItem
        spyOn(console, 'error')

        component.ngOnChanges()

        expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.HELP_ITEM')
        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: component.exceptionKey })
        expect(console.error).toHaveBeenCalledWith('getHelpById', errorResponse)
      })
    })

    describe('CREATE', () => {
      it('should prepare creat an item - start with data from other item', () => {
        component.changeMode = 'CREATE'
        component.helpItem = helpItem // will be rejected due to filled

        component.ngOnChanges()

        expect(apiServiceSpy.getHelpById).not.toHaveBeenCalled()

        component.helpItem = undefined // correct

        component.ngOnChanges()

        expect(component.helpForm.enabled).toBeTrue()
        expect(component.helpForm.controls['itemId'].value).toEqual(null)
      })

      it('should prepare creating an item - start with empty form', () => {
        component.changeMode = 'CREATE'
        spyOn(component.helpForm, 'reset')

        component.ngOnChanges()

        expect(component.helpForm.reset).toHaveBeenCalled()
        expect(component.helpForm.enabled).toBeTrue()
        expect(component.helpForm.controls['itemId'].value).toBe(null)
      })
    })

    describe('COPY', () => {
      it('should prepare copying an item - use data from other item', () => {
        component.changeMode = 'COPY'
        component.helpItem = helpItem

        component.ngOnChanges()

        expect(apiServiceSpy.getHelpById).not.toHaveBeenCalled()
        expect(component.helpForm.enabled).toBeTrue()
        expect(component.helpForm.controls['itemId'].value).toBe(helpItem.itemId)
      })
    })
  })

  describe('onSave', () => {
    describe('CREATE', () => {
      it('should create an item - successful', () => {
        apiServiceSpy.createNewHelp.and.returnValue(of({}))
        component.changeMode = 'CREATE'
        spyOn(component.hideDialogAndChanged, 'emit')
        component.helpForm = helpForm

        component.onSave()

        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
        expect(component.hideDialogAndChanged.emit).toHaveBeenCalledWith(true)
      })

      it('should create an item - failed: form invalid', () => {
        apiServiceSpy.createNewHelp.and.returnValue(of({}))
        spyOn(console, 'error')
        component.changeMode = 'CREATE'
        component.helpForm = helpForm
        component.helpForm.get('itemId')?.setValue(null) // make the form invalid
        component.helpForm.controls['itemId'].markAsTouched()
        component.helpForm.controls['itemId'].setErrors({ required: true })

        component.onSave()

        expect(component.helpForm.valid).toBeFalse()
        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.ERRORS.HELP_ITEM.FORM_INVALID' })
      })

      it('should create an item - failed with error message', () => {
        const errorResponse = { status: 400, statusText: 'Could not create ...', error: { errorCode: 'some error' } }
        apiServiceSpy.createNewHelp.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.changeMode = 'CREATE'
        component.helpForm = helpForm

        component.onSave()

        expect(component.helpForm.valid).toBeTrue()
        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' })
        expect(console.error).toHaveBeenCalledWith('createNewHelp', errorResponse)
      })

      it('should create an item - failed: constraint violation ', () => {
        const errorResponse = {
          status: 400,
          statusText: 'Could not create ...',
          error: { errorCode: 'PERSIST_ENTITY_FAILED' }
        }
        apiServiceSpy.createNewHelp.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.changeMode = 'CREATE'
        component.helpForm = helpForm

        component.onSave()

        expect(component.helpForm.valid).toBeTrue()
        expect(msgServiceSpy.error).toHaveBeenCalledWith({
          summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
          detailKey: 'VALIDATION.ERRORS.HELP_ITEM.UNIQUE_CONSTRAINT'
        })
        expect(console.error).toHaveBeenCalledWith('createNewHelp', errorResponse)
      })
    })

    describe('COPY', () => {
      it('should create an item based on another', () => {
        apiServiceSpy.createNewHelp.and.returnValue(of({}))
        component.changeMode = 'COPY'
        spyOn(component.hideDialogAndChanged, 'emit')
        component.helpForm = helpForm

        component.onSave()

        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
        expect(component.hideDialogAndChanged.emit).toHaveBeenCalledWith(true)
      })
    })

    describe('EDIT', () => {
      it('should update an item - successful', () => {
        apiServiceSpy.updateHelp.and.returnValue(of({}))
        component.changeMode = 'EDIT'
        component.helpItem = helpItem
        component.helpForm = helpForm

        spyOn(component.hideDialogAndChanged, 'emit')

        component.onSave()

        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
        expect(component.hideDialogAndChanged.emit).toHaveBeenCalledWith(true)
      })

      it('should display error if update fails', () => {
        const errorResponse = { status: 400, statusText: 'Could not update ...' }
        apiServiceSpy.updateHelp.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.changeMode = 'EDIT'
        component.helpItem = helpItem
        component.helpForm = helpForm

        component.onSave()

        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
        expect(console.error).toHaveBeenCalledWith('updateHelp', errorResponse)
      })
    })
  })

  describe('UI actions', () => {
    describe('Closing dialog', () => {
      it('should close the dialog if user triggers hiding', () => {
        spyOn(component.hideDialogAndChanged, 'emit')
        component.onDialogHide()

        expect(component.hideDialogAndChanged.emit).toHaveBeenCalledWith(false)
      })

      it('should close the dialog if user triggers hiding', () => {
        spyOn(component.hideDialogAndChanged, 'emit')
        component.onDialogHide(true)

        expect(component.hideDialogAndChanged.emit).toHaveBeenCalledWith(true)
      })
    })

    describe('product selection', () => {
      it('should fill the product name of selected product in form', () => {
        component.allProducts = products
        const event = { value: product1 }

        component.onChangeProduct(event)

        expect(component.helpForm.get('productName')?.value).toContain(product1.name)
      })

      it('should filter products', () => {
        component.allProducts = products
        const event = { query: 'prod' }

        component.onFilterProducts(event)

        expect(component.productsFiltered).toContain(product1)
      })
    })
  })
})
