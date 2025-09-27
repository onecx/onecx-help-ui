import { NgModule } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { Router } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { ReplaySubject, of, throwError } from 'rxjs'

import { TooltipModule } from 'primeng/tooltip'
import { RippleModule } from 'primeng/ripple'
import { DynamicDialogModule } from 'primeng/dynamicdialog'

import { IfPermissionDirective } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { AppStateService, PortalMessageService } from '@onecx/angular-integration-interface'
import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'
import { PortalDialogService } from '@onecx/portal-integration-angular'

import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { OneCXShowHelpComponent } from './show-help.component'
import { OneCXShowHelpHarness } from './show-help.harness'

@NgModule({
  imports: [],
  declarations: [IfPermissionDirective],
  exports: [IfPermissionDirective]
})
class PortalDependencyModule {}

describe('OneCXShowHelpComponent', () => {
  let component: OneCXShowHelpComponent
  let fixture: ComponentFixture<OneCXShowHelpComponent>
  let oneCXShowHelpHarness: OneCXShowHelpHarness

  const mockUserService = jasmine.createSpyObj<UserService>('UserService', ['hasPermission'])
  mockUserService.hasPermission.and.callFake((permission: string) => {
    return ['HELP#EDIT', 'HELP#VIEW'].includes(permission)
  })
  const helpApiSpy = jasmine.createSpyObj<HelpsInternalAPIService>('HelpsInternalAPIService', [
    'getHelpByProductNameItemId'
  ])
  const messageServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error'])
  const mockDialogService = { openDialog: jasmine.createSpy('openDialog').and.returnValue(of({})) }

  function initTestComponent(rcc?: RemoteComponentConfig) {
    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    if (rcc) component.ocxInitRemoteComponent(rcc)
    fixture.detectChanges()
  }
  async function initHarness() {
    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
  }
  let baseUrlSubject: ReplaySubject<any>

  beforeEach(() => {
    baseUrlSubject = new ReplaySubject<any>(1)
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        TranslateTestingModule.withTranslations({
          en: require('/src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: BASE_URL, useValue: baseUrlSubject }]
    })
      .overrideComponent(OneCXShowHelpComponent, {
        set: {
          imports: [PortalDependencyModule, TranslateTestingModule, TooltipModule, RippleModule, DynamicDialogModule],
          providers: [
            //{ provide: UserService, useValue: mockUserService },
            { provide: HelpsInternalAPIService, useValue: helpApiSpy },
            { provide: PortalDialogService, useValue: mockDialogService },
            { provide: PortalMessageService, useValue: messageServiceSpy }
          ]
        }
      })
      .compileComponents()
    baseUrlSubject.next('base_url')
  })

  afterEach(() => {
    mockUserService.hasPermission.and.returnValue(true)
    // to spy data: reset
    messageServiceSpy.error.calls.reset()
    helpApiSpy.getHelpByProductNameItemId.calls.reset()
    helpApiSpy.getHelpByProductNameItemId.and.returnValue(of({} as any))
  })

  describe('construction', () => {
    it('should create', () => {
      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      expect(component).toBeTruthy()
    })
  })

  describe('initialize', () => {
    it('should call ocxInitRemoteComponent with the correct config', () => {
      const mockConfig: RemoteComponentConfig = {
        appId: 'appId',
        productName: 'prodName',
        permissions: ['HELP#VIEW'],
        baseUrl: 'base'
      }
      spyOn(component, 'ocxInitRemoteComponent')

      component.ocxRemoteComponentConfig = mockConfig

      expect(component.ocxInitRemoteComponent).toHaveBeenCalledWith(mockConfig)
    })

    it('should init remote component', (done: DoneFn) => {
      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      expect(component.permissions).toEqual(['HELP#VIEW'])
      expect(helpApiSpy.configuration.basePath).toEqual('base_url/bff')
      baseUrlSubject.asObservable().subscribe((item) => {
        expect(item).toEqual('base_url')
        done()
      })
    })
  })

  describe('button permissions', () => {
    it('should not show button if permissions are not met', async () => {
      initTestComponent()
      await initHarness()

      expect(await oneCXShowHelpHarness.getShowHelpButton()).toBeNull()
    })

    it('should show button if permissions are met', async () => {
      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)
      await initHarness()

      expect(await oneCXShowHelpHarness.getShowHelpButton()).toBeDefined()
      expect(await oneCXShowHelpHarness.getShowHelpButtonId()).toBe('ocx_topbar_action_show_help_item')
    })
  })

  describe('get helpArticleId', () => {
    it('should contain helpArticleId from current page help id', (done: DoneFn) => {
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
        of({
          helpArticleId: 'article_id',
          pageName: 'page_name'
        }) as any
      )
      const router = TestBed.inject(Router)
      router.routerState.snapshot.url = 'router_url'

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      component.helpArticleId$?.subscribe((id) => {
        expect(id).toEqual('article_id')
        done()
      })
    })

    it('should contain helpArticleId from current page name', (done: DoneFn) => {
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
        of({
          pageName: 'page_name'
        }) as any
      )
      const router = TestBed.inject(Router)
      router.routerState.snapshot.url = 'router_url'

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      component.helpArticleId$?.subscribe((id) => {
        expect(id).toEqual('page_name')
        done()
      })
    })

    it('should contain helpArticleId from router', (done: DoneFn) => {
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({}) as any)
      const router = TestBed.inject(Router)
      router.routerState.snapshot.url = 'current_url/page'

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      component.helpArticleId$?.subscribe((id) => {
        expect(id).toEqual('current_url/page')
        done()
      })
    })
  })

  describe('open help page', () => {
    it('should open help page on enter click', () => {
      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)
      spyOn(component, 'onOpenHelpPage')

      component.onOpenHelpPage(new MouseEvent('click'))

      expect(component.onOpenHelpPage).toHaveBeenCalledTimes(1)
    })
  })

  describe('open no-help dialog', () => {
    it('should show dialog if help item does not exist - NO_HELP_ITEM', async () => {
      mockDialogService.openDialog.and.returnValue(of({} as any))
      helpApiSpy.getHelpByProductNameItemId.and.returnValue(of({} as any))
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
        of({ remoteBaseUrl: '', productName: 'product_name' }) as any
      )

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)
      oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
      await oneCXShowHelpHarness.onClickShowHelpButton()

      expect(mockDialogService.openDialog).toHaveBeenCalled()
    })

    it('should show dialog if help item baseUrl not exists - MISSING_BASE_URL', async () => {
      // simulate the close event: return the state
      mockDialogService.openDialog.and.returnValue(
        of({ button: 'primary', id: 'PAGE_HELP_SEARCH', result: true } as any)
      )
      const helpItem: Help = {
        id: 'id',
        itemId: 'article_id',
        productName: 'product_name'
      }
      helpApiSpy.getHelpByProductNameItemId.and.returnValue(of(helpItem as any))
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: helpItem.itemId }) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
        of({ remoteBaseUrl: '', productName: 'product_name' }) as any
      )

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)
      oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
      await oneCXShowHelpHarness.onClickShowHelpButton()

      expect(mockDialogService.openDialog).toHaveBeenCalled()
    })
  })

  describe('single data parts', () => {
    it('should get product name from mfe', (done: DoneFn) => {
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({}) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
        of({ remoteBaseUrl: '', productName: 'product_name' }) as any
      )

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      component.productName$?.subscribe((id) => {
        expect(id).toEqual('product_name')
        done()
      })
    })

    it('should get help item when product and help item data are valid', (done: DoneFn) => {
      const helpItem: Help = {
        id: 'id',
        itemId: 'article_id',
        productName: 'product_name',
        baseUrl: 'http://base_url'
      }
      helpApiSpy.getHelpByProductNameItemId.and.returnValue(of(helpItem as any))
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
        of({ remoteBaseUrl: '', productName: 'product_name' }) as any
      )

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      component.helpItem$?.subscribe((item) => {
        expect(item).toEqual(helpItem as Help)
        expect(helpApiSpy.getHelpByProductNameItemId).toHaveBeenCalled()
        done()
      })
    })

    it('should do not get help item if no product name', (done: DoneFn) => {
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(of({}) as any)

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      component.helpItem$?.subscribe((item) => {
        expect(item).toEqual({} as Help)
        expect(helpApiSpy.getHelpByProductNameItemId).toHaveBeenCalledTimes(0)
        done()
      })
    })

    it('should do not get help item on failed load', (done: DoneFn) => {
      const errorResponse = { status: 400, statusText: 'An error occur' }
      helpApiSpy.getHelpByProductNameItemId.and.returnValue(throwError(() => errorResponse))
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
        of({ remoteBaseUrl: '', productName: 'product_name' }) as any
      )

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      component.helpItem$?.subscribe((item) => {
        expect(item).toEqual({} as Help)
        expect(helpApiSpy.getHelpByProductNameItemId).toHaveBeenCalled()
        done()
      })
    })

    it('should open new window with help article', async () => {
      const helpItem: Help = {
        id: 'id',
        itemId: 'article_id',
        productName: 'product_name',
        baseUrl: 'http://base_url',
        resourceUrl: '/search'
      }
      helpApiSpy.getHelpByProductNameItemId.and.returnValue(of(helpItem as any))
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: helpItem.itemId }) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
        of({ remoteBaseUrl: '', productName: 'product_name' }) as any
      )
      spyOn(window, 'open')

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
      await oneCXShowHelpHarness.onClickShowHelpButton()

      expect(window.open).toHaveBeenCalled()
    })

    it('should display error message on failed window opening', async () => {
      spyOn(console, 'error')
      window.open = function () {
        throw new Error()
      }
      const helpItem = { id: 'article_id', baseUrl: 'http://base_url', resourceUrl: '/search' }
      helpApiSpy.getHelpByProductNameItemId.and.returnValue(of(helpItem as any))
      const appStateService = TestBed.inject(AppStateService)
      spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: helpItem.id }) as any)
      spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
        of({ remoteBaseUrl: '', productName: 'product_name' }) as any
      )

      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

      oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
      await oneCXShowHelpHarness.onClickShowHelpButton()

      expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'SHOW_HELP.HELP_PAGE_ERROR' })
    })
  })

  describe('url construction', () => {
    beforeEach(() => {
      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)
    })

    it('should not append origin for external url', () => {
      const url = component['constructUrl']('https://www.google.com/', 'http://localhost:4300', '/shell/')
      expect(url).toEqual(new URL('https://www.google.com/'))
    })

    it('should append origin for relative url', () => {
      const url = component['constructUrl']('/admin/help', 'http://localhost:4300', '/')
      expect(url).toEqual(new URL('http://localhost:4300/admin/help'))
    })

    it('should append origin and deploymentPath for relative url', () => {
      const url = component['constructUrl']('/admin/help', 'http://localhost:4300', '/shell/')
      expect(url).toEqual(new URL('http://localhost:4300/shell/admin/help'))
    })
  })

  describe('prepare URL', () => {
    beforeEach(() => {
      initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)
    })

    it('should prepare empty url: ', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH'
      }
      const url = component['prepareUrl'](help)

      expect(url).toEqual('')
    })

    it('should prepare the url on: base', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help'
      }
      const url = component['prepareUrl'](help)

      expect(url).toEqual(help.baseUrl!)
    })

    it('should prepare the url on: base + context', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help',
        context: 'ctx'
      }
      const url = component['prepareUrl'](help)

      expect(url).toEqual(help.baseUrl! + '#' + help.context)
    })

    it('should prepare the url on: base + resource', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help',
        resourceUrl: '/search'
      }
      const url = component['prepareUrl'](help)

      expect(url).toEqual(help.baseUrl! + help.resourceUrl)
    })

    it('should prepare the url on: base + resource + context', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help',
        resourceUrl: '/search',
        context: '#ctx'
      }
      const url = component['prepareUrl'](help)

      expect(url).toEqual(help.baseUrl! + help.resourceUrl + help.context)
    })
  })
})
