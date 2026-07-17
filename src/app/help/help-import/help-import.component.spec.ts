import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import { FileSelectEvent } from 'primeng/fileupload'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService } from 'src/app/shared/generated'
import { HelpImportComponent } from './help-import.component'

describe('HelpImportComponent', () => {
  let component: HelpImportComponent
  let fixture: ComponentFixture<HelpImportComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    importHelps: jasmine.createSpy('importHelps').and.returnValue(of({}))
  }

  function initTestComponent() {
    fixture = TestBed.createComponent(HelpImportComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HelpImportComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: []
    })
      .overrideComponent(HelpImportComponent, {
        add: {
          providers: [
            { provide: HelpsInternalAPIService, useValue: apiServiceSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
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
    msgServiceSpy.info.calls.reset()
    apiServiceSpy.importHelps.calls.reset()
    apiServiceSpy.importHelps.and.returnValue(of({}))
  })

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })
  })

  describe('select', () => {
    let file: File
    let event: FileSelectEvent

    beforeEach(() => {
      file = new File(['file content'], 'test.json', { type: 'application/json' })
      event = { files: [file] } as FileSelectEvent
    })

    it('should parse valid JSON and show info message', async () => {
      const json = '{ "helps": { "product": { "itemId": { "baseUrl": "https://..." } } } }'
      spyOn(file, 'text').and.returnValue(Promise.resolve(json))

      component.onImportSelectFile(event)
      await fixture.whenStable()

      expect(component.importError()).toBe('NONE')
    })

    it('should parse valid JSON but non-expected content', async () => {
      const json = '{ "any-other-thing": { "product": {} } }'
      spyOn(file, 'text').and.returnValue(Promise.resolve(json))

      component.onImportSelectFile(event)
      await fixture.whenStable()

      expect(component.importError()).toBe('CONTENT')
    })

    it('should set importError and show error on invalid JSON', async () => {
      spyOn(file, 'text').and.returnValue(Promise.resolve('Invalid Json'))
      spyOn(console, 'error')

      component.onImportSelectFile(event)
      await fixture.whenStable()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.ERRORS.IMPORT_PARSE_ERROR' })
      expect(console.error).toHaveBeenCalled()
      expect(component.importError()).toBe('GENERAL')
    })
  })

  describe('import', () => {
    it('should do nothing if importObject is undefined', () => {
      component.helpSnapshot = null

      component.onImportConfirmation()

      expect(apiServiceSpy.importHelps).not.toHaveBeenCalled()
    })

    it('should import and emit true on success', async () => {
      apiServiceSpy.importHelps.and.returnValue(of({}))
      component.helpSnapshot = { helps: {} }
      const visibleChangeSpy = spyOn(component.visibleChange, 'emit')

      component.onImportConfirmation()
      await fixture.whenStable()

      expect(apiServiceSpy.importHelps).toHaveBeenCalledWith({ body: { helps: {} } })
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'DIALOG.IMPORT.MESSAGE.OK' })
      expect(component.importError()).toBe('NONE')
      expect(component.helpSnapshot).toBeNull()
      expect(visibleChangeSpy).toHaveBeenCalledWith(true)
    })

    it('should show error message and log on failure', async () => {
      const errorResponse = { status: 400, statusText: 'Cannot import ...' }
      apiServiceSpy.importHelps.and.returnValue(throwError(() => errorResponse))
      component.helpSnapshot = { helps: {} }
      spyOn(console, 'error')

      component.onImportConfirmation()
      await fixture.whenStable()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'DIALOG.IMPORT.MESSAGE.NOK' })
      expect(console.error).toHaveBeenCalledWith('importHelps', errorResponse)
    })
  })

  describe('onCloseDialog', () => {
    it('should clear import state and emit false', () => {
      component.importError.set('GENERAL')
      component.helpSnapshot = { helps: {} }
      const visibleChangeSpy = spyOn(component.visibleChange, 'emit')

      component.onCloseDialog()

      expect(component.importError()).toBe('NONE')
      expect(component.helpSnapshot).toBeNull()
      expect(visibleChangeSpy).toHaveBeenCalledWith(false)
    })
  })

  describe('onChanges', () => {
    it('should reset importError and helpSnapshot', () => {
      component.importError.set('GENERAL')
      component.helpSnapshot = { helps: {} }

      component.ngOnChanges()

      expect(component.importError()).toBe('NONE')
      expect(component.helpSnapshot).toBeNull()
    })
  })

  describe('formatUploadFileSize', () => {
    it('should format bytes below 1024 as B', () => {
      expect(component.formatUploadFileSize(0)).toBe('0B')
      expect(component.formatUploadFileSize(512)).toBe('512B')
      expect(component.formatUploadFileSize(1023)).toBe('1023B')
    })

    it('should format exactly 1 KB', () => {
      expect(component.formatUploadFileSize(1024)).toBe('1KB')
    })

    it('should format KB with one decimal when size < 10', () => {
      expect(component.formatUploadFileSize(1024 * 5)).toBe('5KB')
      expect(component.formatUploadFileSize(1024 * 9.5)).toBe('9.5KB')
    })

    it('should format large KB without decimal', () => {
      expect(component.formatUploadFileSize(1024 * 512)).toBe('512KB')
    })

    it('should format MB', () => {
      expect(component.formatUploadFileSize(1024 * 1024)).toBe('1MB')
      expect(component.formatUploadFileSize(1024 * 1024 * 5)).toBe('5MB')
      expect(component.formatUploadFileSize(1024 * 1024 * 500)).toBe('500MB')
    })

    it('should format GB', () => {
      expect(component.formatUploadFileSize(1024 * 1024 * 1024)).toBe('1GB')
      expect(component.formatUploadFileSize(1024 * 1024 * 1024 * 2)).toBe('2GB')
    })
  })
})
