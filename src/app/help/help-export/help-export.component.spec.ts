import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { of, throwError } from 'rxjs'
import FileSaver from 'file-saver'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { provideTranslateTestingService } from '@onecx/angular-testing'

import { HelpsInternalAPIService } from 'src/app/shared/generated'
import { Product } from '../help-search/help-search.component'
import { HelpExportComponent } from './help-export.component'

const product1: Product = { name: 'product1', displayName: 'Product 1' }
const product2: Product = { name: 'product2', displayName: 'Product 2' }

describe('HelpExportComponent', () => {
  let component: HelpExportComponent
  let fixture: ComponentFixture<HelpExportComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = jasmine.createSpyObj<HelpsInternalAPIService>('HelpsInternalAPIService', ['exportHelps'])

  function initTestComponent() {
    fixture = TestBed.createComponent(HelpExportComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HelpExportComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateTestingService({
          de: require('/src/assets/i18n/de.json'),
          en: require('/src/assets/i18n/en.json')
        })
      ]
    })
      .overrideComponent(HelpExportComponent, {
        set: {
          providers: [
            { provide: HelpsInternalAPIService, useValue: apiServiceSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    apiServiceSpy.exportHelps.and.returnValue(of({}) as any)
    initTestComponent()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiServiceSpy.exportHelps.calls.reset()
    apiServiceSpy.exportHelps.and.returnValue(of({}) as any)
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
      apiServiceSpy.exportHelps.and.returnValue(of({}) as any)
      component.exportProductList = [product1.name]
      const visibleChangeSpy = spyOn(component.visibleChange, 'emit')
      const saveAsSpy = spyOn(FileSaver, 'saveAs')

      component.onExportConfirmation()

      expect(apiServiceSpy.exportHelps).toHaveBeenCalledWith({
        exportHelpsRequest: { productNames: [product1.name] }
      })
      expect(saveAsSpy).toHaveBeenCalled()
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.OK' })
      expect(visibleChangeSpy).toHaveBeenCalled()
      expect(component.exportProductList).toEqual([])
    })

    it('should generate the export file name using the current date and time', fakeAsync(() => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date(2025, 0, 2, 3, 4, 5))

      const result = component['getCurrentDateTime']()

      expect(result).toBe('2025-01-02_030405')
      jasmine.clock().uninstall()
    }))

    it('should show error message and log on failure', () => {
      const errorResponse = { status: 400, statusText: 'Cannot export ...' }
      apiServiceSpy.exportHelps.and.returnValue(throwError(() => errorResponse) as any)
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
