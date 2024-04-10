import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { ReplaySubject, of, throwError } from 'rxjs'
import { DialogService } from 'primeng/dynamicdialog'
import { AppStateService, PortalMessageService } from '@onecx/angular-integration-interface'
import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'
import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { OneCXShowHelpComponent } from './show-help.component'
import { OneCXShowHelpHarness } from './show-help.harness'

describe('OneCXShowHelpComponent', () => {
  let component: OneCXShowHelpComponent
  let fixture: ComponentFixture<OneCXShowHelpComponent>
  let oneCXShowHelpHarness: OneCXShowHelpHarness

  const helpApiServiceSpy = jasmine.createSpyObj<HelpsInternalAPIService>('HelpsInternalAPIService', ['searchHelps'])

  const dialogServiceSpy = jasmine.createSpyObj<DialogService>('DialogService', ['open'])

  const messageServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error'])

  // // Temporary mock until correct module import is implemented
  // class MockUserService {
  //   lang$ = new BehaviorSubject<string>('en')
  //   /* eslint-disable @typescript-eslint/no-unused-vars */
  //   hasPermission(permissionKey: string): boolean {
  //     return true
  //   }
  // }

  class EventMock {
    preventDefault() {}
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OneCXShowHelpComponent],
      providers: [
        // { provide: UserService, useClass: MockUserService },
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BASE_URL,
          useValue: new ReplaySubject<string>(1)
        }
      ]
    })
      .overrideComponent(OneCXShowHelpComponent, {
        set: {
          imports: [PortalCoreModule],
          providers: [
            { provide: HelpsInternalAPIService, useValue: helpApiServiceSpy },
            { provide: DialogService, useValue: dialogServiceSpy },
            { provide: PortalMessageService, useValue: messageServiceSpy }
          ]
        }
      })
      .compileComponents()

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
    const baseUrl = TestBed.inject<ReplaySubject<string>>(BASE_URL)
    baseUrl.subscribe((item) => {
      expect(item).toEqual('base_url')
      done()
    })
  })

  it('should not show button if permissions are not met', async () => {
    // // Temporary solution until correct module import is implemented
    // const userSerivce = TestBed.inject(UserService)
    // spyOn(userSerivce, 'hasPermission').and.returnValue(false)

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)

    expect(await oneCXShowHelpHarness.getHelpButton()).toBeNull()
    expect(await oneCXShowHelpHarness.getHelpIcon()).toBeNull()
  })

  // // Temporary commented out until correct module import is implemented
  // it('should show button if permissions are met', async () => {
  //   fixture = TestBed.createComponent(OneCXShowHelpComponent)
  //   component = fixture.componentInstance
  //   fixture.detectChanges()
  //   oneCXShowHelpHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXShowHelpHarness)
  //   expect(await oneCXShowHelpHarness.getHelpButtonTitle()).toBe('Show Help for this article')

  //   expect(await oneCXShowHelpHarness.hasHelpIconClass(PrimeIcons.QUESTION_CIRCLE)).toBe(true)
  // })

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

  it('should contain applicationId from page', (done: DoneFn) => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        applicationId: 'page_app_id'
      }) as any
    )
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '', // Temporary until correct module import is implemented
        app_id: 'mfe_page_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.applicationId$?.subscribe((id) => {
      expect(id).toEqual('page_app_id')
      done()
    })
  })

  it('should contain applicationId from mfe', (done: DoneFn) => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({}) as any)

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '', // Temporary until correct module import is implemented
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.applicationId$?.subscribe((id) => {
      expect(id).toEqual('mfe_app_id')
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
        remoteBaseUrl: '', // Temporary until correct module import is implemented
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({ id: '1' } as Help)
      expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledOnceWith({
        helpSearchCriteria: { itemId: 'article_id', appId: 'mfe_app_id' }
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
        remoteBaseUrl: '', // Temporary until correct module import is implemented
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({} as Help)
      expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledOnceWith({
        helpSearchCriteria: { itemId: 'article_id', appId: 'mfe_app_id' }
      })
      expect(console.log).toHaveBeenCalledWith('Failed to load help article')
      done()
    })
  })

  it('should open new window with help article', () => {
    spyOn(window, 'open')
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [{ id: '1', resourceUrl: 'http://resource_url' }]
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
        remoteBaseUrl: '', // Temporary until correct module import is implemented
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.openHelpPage(new EventMock())
    expect(window.open).toHaveBeenCalledOnceWith(new URL('http://resource_url'), '_blank')
  })

  it('should display error message on failed window opening', () => {
    spyOn(window, 'open').and.throwError('')
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [{ id: '1', resourceUrl: 'http://resource_url' }]
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
        remoteBaseUrl: '', // Temporary until correct module import is implemented
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXShowHelpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.openHelpPage(new EventMock())
    expect(window.open).toHaveBeenCalledOnceWith(new URL('http://resource_url'), '_blank')
    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'SHOW_HELP.HELP_PAGE_ERROR'
    })
  })

  // test not working because of translateService cannot be spied up on
  // it('should open dialog when help item associated with page is not created', () => {
  //   helpApiServiceSpy.searchHelps.and.returnValue(
  //     of({
  //       totalElements: 0,
  //       stream: []
  //     } as any)
  //   )
  //   const appStateService = TestBed.inject(AppStateService)
  //   spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
  //     of({
  //       helpArticleId: 'article_id'
  //     }) as any
  //   )

  //   spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
  //     of({
  //       remoteBaseUrl: '', // Temporary until correct module import is implemented
  //       appId: 'mfe_app_id'
  //     }) as any
  //   )

  //   fixture = TestBed.createComponent(OneCXShowHelpComponent)
  //   component = fixture.componentInstance
  //   fixture.detectChanges()

  //   // const translateService =
  //   // spyOn(translateService, 'get').and.returnValue(of('header'))

  //   component.openHelpPage(new EventMock())

  //   expect(messageServiceSpy.error).toHaveBeenCalledTimes(0)
  //   expect(dialogServiceSpy.open).toHaveBeenCalledOnceWith(NoHelpItemComponent, {
  //     header: 'header',
  //     width: '400px',
  //     data: {
  //       helpArticleId: 'article_id'
  //     }
  //   })
  // })
})
