import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService } from 'src/app/shared/generated'
import { Product } from '../help-search/help-search.component'
import { HelpExportComponent } from './help-export.component'

const product1: Product = { name: 'product1', displayName: 'Product 1' }
const product2: Product = { name: 'product2', displayName: 'Product 2' }

describe('HelpExportComponent', () => {
  let component: HelpExportComponent
  let fixture: ComponentFixture<HelpExportComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = {
    exportHelps: jasmine.createSpy('exportHelps').and.returnValue(of({}))
  }

  function initTestComponent() {
    fixture = TestBed.createComponent(HelpExportComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HelpExportComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy }
      ]
    })
      .overrideComponent(HelpExportComponent, {
        set: {
          template: '',
          imports: []
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    initTestComponent()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiServiceSpy.exportHelps.calls.reset()
    apiServiceSpy.exportHelps.and.returnValue(of({}))
  })

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })
  })

  describe('onExportConfirmation', () => {
    it('should do nothing if exportProductList is empty', () => {
      component.exportProductList = []

      component.onExportConfirmation()

      expect(apiServiceSpy.exportHelps).not.toHaveBeenCalled()
    })

    it('should export help items, reset list and emit visibleChange on success', () => {
      apiServiceSpy.exportHelps.and.returnValue(of({}))
      component.exportProductList = [product1.name]
      const visibleChangeSpy = spyOn(component.visibleChange, 'emit')

      component.onExportConfirmation()

      expect(apiServiceSpy.exportHelps).toHaveBeenCalledWith({
        exportHelpsRequest: { productNames: [product1.name] }
      })
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.OK' })
      expect(visibleChangeSpy).toHaveBeenCalled()
      expect(component.exportProductList).toEqual([])
    })

    it('should show error message and log on failure', () => {
      const errorResponse = { status: 400, statusText: 'Cannot export ...' }
      apiServiceSpy.exportHelps.and.returnValue(throwError(() => errorResponse))
      component.exportProductList = [product1.name, product2.name]
      spyOn(console, 'error')

      component.onExportConfirmation()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.NOK' })
      expect(console.error).toHaveBeenCalledWith('exportHelps', errorResponse)
    })
  })

  describe('onCloseDialog', () => {
    it('should reset exportProductList and emit visibleChange', () => {
      component.exportProductList = [product1.name, product2.name]
      const visibleChangeSpy = spyOn(component.visibleChange, 'emit')

      component.onCloseDialog()

      expect(component.exportProductList).toEqual([])
      expect(visibleChangeSpy).toHaveBeenCalled()
    })
  })
})
