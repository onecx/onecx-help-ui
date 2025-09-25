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
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'

import { IfPermissionDirective } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { AppStateService, PortalMessageService } from '@onecx/angular-integration-interface'
import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'

import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { OneCXShowHelpComponent } from './show-help.component'
import { OneCXShowHelpHarness } from './show-help.harness'
// import { NoHelpItemComponent } from './no-help-item/no-help-item.component'

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

  const mockUserService = jasmine.createSpyObj('UserService', ['hasPermission'])
  mockUserService.hasPermission.and.callFake((permission: string) => {
    return ['HELP#EDIT', 'HELP#VIEW'].includes(permission)
  })
  const helpApiServiceSpy = jasmine.createSpyObj<HelpsInternalAPIService>('HelpsInternalAPIService', [
    'getHelpByProductNameItemId'
  ])
  const dialogServiceSpy = jasmine.createSpyObj<DialogService>('DialogService', ['open'])
  const messageServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error'])

  function initTestComponent(rcc?: RemoteComponentConfig) {
    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    if (rcc) component.ocxInitRemoteComponent(rcc)
    fixture.detectChanges()
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
            { provide: HelpsInternalAPIService, useValue: helpApiServiceSpy },
            { provide: DialogService, useValue: dialogServiceSpy },
            { provide: PortalMessageService, useValue: messageServiceSpy }
          ]
        }
      })
      .compileComponents()
    baseUrlSubject.next('base_url_mock')

    helpApiServiceSpy.getHelpByProductNameItemId.calls.reset()
    dialogServiceSpy.open.calls.reset()
    messageServiceSpy.error.calls.reset()
    helpApiServiceSpy.getHelpByProductNameItemId.and.returnValue(of({} as any))
  })

  it('should create', () => {
    initTestComponent()

    expect(component).toBeTruthy()
  })

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
    expect(helpApiServiceSpy.configuration.basePath).toEqual('base_url/bff')
    baseUrlSubject.asObservable().subscribe((item) => {
      expect(item).toEqual('base_url')
      done()
    })
  })

  it('should not show button if permissions are not met', async () => {
    initTestComponent()
    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)

    expect(await oneCXShowHelpHarness.getShowHelpButton()).toBeNull()
  })

  it('should show button if permissions are met', async () => {
    initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)

    expect(await oneCXShowHelpHarness.getShowHelpButtonId()).toBe('ocx_topbar_action_show_help_item')
  })

  it('should call openHelpPage on enter click', () => {
    initTestComponent()
    spyOn(component, 'openHelpPage')

    component.onOpenHelpPage()

    expect(component.openHelpPage).toHaveBeenCalledTimes(1)
  })

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

    initTestComponent()

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

    initTestComponent()

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

    initTestComponent()

    component.helpArticleId$?.subscribe((id) => {
      expect(id).toEqual('current_url/page')
      done()
    })
  })

  it('should contain productName from mfe', (done: DoneFn) => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({}) as any)

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    initTestComponent()

    component.productName$?.subscribe((id) => {
      expect(id).toEqual('mfe_product_name')
      done()
    })
  })

  it('should load help article when application and help item data are valid', (done: DoneFn) => {
    helpApiServiceSpy.getHelpByProductNameItemId.and.returnValue(of({ totalElements: 1, stream: [{ id: '1' }] } as any))
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({ remoteBaseUrl: '', productName: 'mfe_product_name' }) as any
    )
    initTestComponent()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({ totalElements: 1, stream: [{ id: '1' }] } as any)
      expect(helpApiServiceSpy.getHelpByProductNameItemId).toHaveBeenCalled()
      done()
    })
  })

  it('should return empty object when application or help item data are invalid', (done: DoneFn) => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(of({}) as any)
    initTestComponent()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({} as Help)
      expect(helpApiServiceSpy.getHelpByProductNameItemId).toHaveBeenCalledTimes(0)
      done()
    })
  })

  it('should return empty object on failed article load', (done: DoneFn) => {
    const errorResponse = { status: 400, statusText: 'An error occur' }
    helpApiServiceSpy.getHelpByProductNameItemId.and.returnValue(throwError(() => errorResponse))
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({ remoteBaseUrl: '', productName: 'mfe_product_name' }) as any
    )
    spyOn(console, 'error')

    initTestComponent()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({} as Help)
      expect(helpApiServiceSpy.getHelpByProductNameItemId).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith('getHelpByProductNameItemId', errorResponse)
      done()
    })
  })

  it('should open new window with help article', async () => {
    spyOn(window, 'open')
    const helpItem = { id: 'article_id', baseUrl: 'http://base_url', resourceUrl: '/search' }
    helpApiServiceSpy.getHelpByProductNameItemId.and.returnValue(of(helpItem as any))
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({ remoteBaseUrl: '', productName: 'mfe_product_name' }) as any
    )
    initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.onClickShowHelpButton()

    expect(window.open).toHaveBeenCalled()
  })

  it('should open new window with help article with relativeUrl', async () => {
    helpApiServiceSpy.getHelpByProductNameItemId.and.returnValue(
      of({ totalElements: 1, stream: [{ id: '1', resourceUrl: '/admin/helpItem' }] } as any)
    )
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({ remoteBaseUrl: '', productName: 'mfe_product_name' }) as any
    )

    initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.onClickShowHelpButton()

    expect(dialogServiceSpy.open).toHaveBeenCalled()
  })

  it('should do nothing when resourceUrl is not defined', async () => {
    spyOn(window, 'open')
    const helpItem = { id: 'article_id', baseUrl: undefined, resourceUrl: undefined }

    helpApiServiceSpy.getHelpByProductNameItemId.and.returnValue(of(helpItem as any))
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({ remoteBaseUrl: '', productName: 'mfe_product_name' }) as any
    )

    initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.onClickShowHelpButton()

    expect(window.open).toHaveBeenCalledTimes(0)
    expect(messageServiceSpy.error).toHaveBeenCalledTimes(0)
  })

  it('should display error message on failed window opening', async () => {
    spyOn(console, 'error')
    window.open = function () {
      throw new Error()
    }
    const helpItem = { id: 'article_id', baseUrl: 'http://base_url', resourceUrl: '/search' }
    helpApiServiceSpy.getHelpByProductNameItemId.and.returnValue(of(helpItem as any))
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({ helpArticleId: 'article_id' }) as any)
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({ remoteBaseUrl: '', productName: 'mfe_product_name' }) as any
    )

    initTestComponent({ permissions: ['HELP#VIEW'], baseUrl: 'base_url' } as RemoteComponentConfig)

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.onClickShowHelpButton()

    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'SHOW_HELP.HELP_PAGE_ERROR' })
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  describe('url construction', () => {
    beforeEach(() => {
      initTestComponent()
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
