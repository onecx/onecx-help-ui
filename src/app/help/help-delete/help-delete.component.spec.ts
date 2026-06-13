import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { HelpDeleteComponent } from './help-delete.component'

const helpItem: Help = {
  id: 'item-id',
  itemId: 'PAGE_HELP_SEARCH',
  productName: 'onecx-help-ui',
  baseUrl: 'http://localhost:8080/help'
}

describe('HelpDeleteComponent', () => {
  let component: HelpDeleteComponent
  let fixture: ComponentFixture<HelpDeleteComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = {
    deleteHelp: jasmine.createSpy('deleteHelp').and.returnValue(of({}))
  }

  function initTestComponent() {
    fixture = TestBed.createComponent(HelpDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HelpDeleteComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy }
      ]
    })
      .overrideComponent(HelpDeleteComponent, {
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
    apiServiceSpy.deleteHelp.calls.reset()
    apiServiceSpy.deleteHelp.and.returnValue(of({}))
  })

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })
  })

  describe('onDeleteConfirmation', () => {
    it('should do nothing if helpItem is undefined', () => {
      component.helpItem = undefined

      component.onDeleteConfirmation()

      expect(apiServiceSpy.deleteHelp).not.toHaveBeenCalled()
    })

    it('should do nothing if helpItem has no id', () => {
      component.helpItem = { itemId: 'PAGE_HELP_SEARCH', productName: 'product' } as Help

      component.onDeleteConfirmation()

      expect(apiServiceSpy.deleteHelp).not.toHaveBeenCalled()
    })

    it('should delete the help item and emit true on success', () => {
      apiServiceSpy.deleteHelp.and.returnValue(of({}))
      component.helpItem = { ...helpItem }
      component.visible = true
      const visibleChangeSpy = spyOn(component.visibleChange, 'emit')

      component.onDeleteConfirmation()

      expect(apiServiceSpy.deleteHelp).toHaveBeenCalledWith({ id: helpItem.id })
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.OK' })
      expect(visibleChangeSpy).toHaveBeenCalledWith(true)
    })

    it('should show error message and log on failure', () => {
      const errorResponse = { status: '400', statusText: 'Error on deletion' }
      apiServiceSpy.deleteHelp.and.returnValue(throwError(() => errorResponse))
      component.helpItem = { ...helpItem }
      spyOn(console, 'error')

      component.onDeleteConfirmation()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.NOK' })
      expect(console.error).toHaveBeenCalledWith('deleteHelp', errorResponse)
    })
  })
})
