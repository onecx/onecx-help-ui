import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NgModule } from '@angular/core'
import { Router } from '@angular/router'
import { AppStateService, PortalMessageService } from '@onecx/angular-integration-interface'
import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { ReplaySubject, of, throwError } from 'rxjs'
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'
import { TooltipModule } from 'primeng/tooltip'
import { RippleModule } from 'primeng/ripple'
import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { OneCXShowHelpComponent } from './show-help.component'
import { OneCXShowHelpHarness } from './show-help.harness'
import { NoHelpItemComponent } from './no-help-item/no-help-item.component'
import { IfPermissionDirective } from '@onecx/angular-accelerator'

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

  const helpApiServiceSpy = jasmine.createSpyObj<HelpsInternalAPIService>('HelpsInternalAPIService', ['searchHelps'])

  const dialogServiceSpy = jasmine.createSpyObj<DialogService>('DialogService', ['open'])

  const messageServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error'])

  let baseUrlSubject: ReplaySubject<any>

  beforeEach(() => {
    baseUrlSubject = new ReplaySubject<any>(1)
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        TranslateTestingModule.withTranslations({
          en: require('../../../assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BASE_URL,
          useValue: baseUrlSubject
        }
      ]
    })
      .overrideComponent(OneCXShowHelpComponent, {
        set: {
          imports: [PortalDependencyModule, TranslateTestingModule, TooltipModule, RippleModule, DynamicDialogModule],
          providers: [
            { provide: HelpsInternalAPIService, useValue: helpApiServiceSpy },
            { provide: DialogService, useValue: dialogServiceSpy },
            { provide: PortalMessageService, useValue: messageServiceSpy }
          ]
        }
      })
      .compileComponents()

    baseUrlSubject.next('base_url_mock')

    helpApiServiceSpy.searchHelps.calls.reset()
    dialogServiceSpy.open.calls.reset()
    messageServiceSpy.error.calls.reset()
  })

  it('should create', () => {
    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    expect(component).toBeTruthy()
  })

  it('should init remote component', (done: DoneFn) => {
    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.ocxInitRemoteComponent({
      permissions: ['HELP#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)

    expect(component.permissions).toEqual(['HELP#VIEW'])
    expect(helpApiServiceSpy.configuration.basePath).toEqual('base_url/bff')
    baseUrlSubject.asObservable().subscribe((item) => {
      console.log(item)
      expect(item).toEqual('base_url')
      done()
    })
  })

  it('should not show button if permissions are not met', async () => {
    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)

    expect(await oneCXShowHelpHarness.getHelpButton()).toBeNull()
  })

  it('should show button if permissions are met', async () => {
    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)

    fixture.detectChanges()
    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)

    expect(await oneCXShowHelpHarness.getHelpButtonId()).toBe('show-help-item-button')
  })

  it('should call openHelpPage on enter click', () => {
    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    spyOn(component, 'openHelpPage')
    component.onEnterClick()
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

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

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

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

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

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

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

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.productName$?.subscribe((id) => {
      expect(id).toEqual('mfe_product_name')
      done()
    })
  })

  it('should load help article when application and help item data are valid', (done: DoneFn) => {
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [{ id: '1' }]
      } as any)
    )
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({ id: '1' } as Help)
      expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledOnceWith({
        helpSearchCriteria: { itemId: 'article_id', productName: 'mfe_product_name' }
      })
      done()
    })
  })

  it('should return empty object when application or help item data are invalid', (done: DoneFn) => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(of({}) as any)

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({} as Help)
      expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledTimes(0)
      done()
    })
  })

  it('should return empty object on failed article load', (done: DoneFn) => {
    spyOn(console, 'log')
    helpApiServiceSpy.searchHelps.and.returnValue(throwError(() => {}))

    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({} as Help)
      expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledOnceWith({
        helpSearchCriteria: { itemId: 'article_id', productName: 'mfe_product_name' }
      })
      expect(console.log).toHaveBeenCalledWith('Failed to load help article')
      done()
    })
  })

  it('should open new window with help article', async () => {
    spyOn(window, 'open')
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [{ id: 'article_id', baseUrl: 'http://base_url', resourceUrl: '/search' }]
      } as any)
    )
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.clickHelpButton()
    expect(window.open).toHaveBeenCalledOnceWith(new URL('http://base_url/search'), '_blank')
  })

  it('should open new window with help article with relativeUrl', async () => {
    spyOn(window, 'open')
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [{ id: '1', resourceUrl: '/admin/helpItem' }]
      } as any)
    )
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.clickHelpButton()

    expect(window.open).toHaveBeenCalledOnceWith(new URL(window.location.origin + '/admin/helpItem'), '_blank')
  })

  it('should do nothing when resourceUrl is not defined', async () => {
    spyOn(window, 'open')
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [{ id: '1' }]
      } as any)
    )
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.clickHelpButton()

    expect(window.open).toHaveBeenCalledTimes(0)
    expect(messageServiceSpy.error).toHaveBeenCalledTimes(0)
    expect(dialogServiceSpy.open).toHaveBeenCalledTimes(0)
  })

  it('should display error message on failed window opening', async () => {
    spyOn(window, 'open').and.throwError('')
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [{ id: '1', resourceUrl: '/admin/helpItem' }]
      } as any)
    )
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.clickHelpButton()

    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'SHOW_HELP.HELP_PAGE_ERROR'
    })
  })

  it('should open no help dialog when help item associated with page does not exist', async () => {
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
    await oneCXShowHelpHarness.clickHelpButton()

    expect(messageServiceSpy.error).toHaveBeenCalledTimes(0)
    expect(dialogServiceSpy.open).toHaveBeenCalledOnceWith(NoHelpItemComponent, {
      header: 'Help Item missing',
      width: '400px',
      data: {
        helpArticleId: 'article_id'
      }
    })
  })

  describe('url construction', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OneCXShowHelpComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
    it('should not append origin for external url', () => {
      const url = component.constructUrl('https://www.google.com/', 'http://localhost:4300', '/shell/')
      console.log(url.toString())
      expect(url).toEqual(new URL('https://www.google.com/'))
    })

    it('should append origin for relative url', () => {
      const url = component.constructUrl('/admin/help', 'http://localhost:4300', '/')
      console.log(url.toString())
      expect(url).toEqual(new URL('http://localhost:4300/admin/help'))
    })

    it('should append origin and deploymentPath for relative url', () => {
      const url = component.constructUrl('/admin/help', 'http://localhost:4300', '/shell/')
      console.log(url.toString())
      expect(url).toEqual(new URL('http://localhost:4300/shell/admin/help'))
    })
  })
})
