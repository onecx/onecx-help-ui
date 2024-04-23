import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NgModule } from '@angular/core'
import { Router } from '@angular/router'
import { AppStateService, PortalMessageService } from '@onecx/angular-integration-interface'
import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { ReplaySubject, of, throwError } from 'rxjs'
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'
import { PrimeIcons } from 'primeng/api'
import { TooltipModule } from 'primeng/tooltip'
import { RippleModule } from 'primeng/ripple'
import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { OneCXHelpItemEditorComponent } from './help-item-editor.component'
import { OneCXHelpItemEditorHarness } from './help-item-editor.harness'
import { IfPermissionDirective } from '@onecx/angular-accelerator'
import { PortalDialogService } from '@onecx/portal-integration-angular'
import { HelpItemEditorDialogComponent } from './help-item-editor-dialog/help-item-editor-dialog.component'

@NgModule({
  imports: [],
  declarations: [IfPermissionDirective],
  exports: [IfPermissionDirective]
})
class PortalDependencyModule {}

describe('OneCXHelpItemEditorComponent', () => {
  let component: OneCXHelpItemEditorComponent
  let fixture: ComponentFixture<OneCXHelpItemEditorComponent>
  let oneCXHelpItemEditorHarness: OneCXHelpItemEditorHarness

  const helpApiServiceSpy = jasmine.createSpyObj<HelpsInternalAPIService>('HelpsInternalAPIService', [
    'searchHelps',
    'createNewHelp',
    'updateHelp'
  ])

  const messageServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error', 'info'])

  const portalDialogServiceSpy = jasmine.createSpyObj<PortalDialogService>('PortalDialogService', ['openDialog'])

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
      .overrideComponent(OneCXHelpItemEditorComponent, {
        set: {
          imports: [PortalDependencyModule, TranslateTestingModule, TooltipModule, RippleModule, DynamicDialogModule],
          providers: [
            DialogService,
            { provide: HelpsInternalAPIService, useValue: helpApiServiceSpy },
            { provide: PortalDialogService, useValue: portalDialogServiceSpy },
            { provide: PortalMessageService, useValue: messageServiceSpy }
          ]
        }
      })
      .compileComponents()

    baseUrlSubject.next('base_url_mock')

    helpApiServiceSpy.searchHelps.calls.reset()
    helpApiServiceSpy.createNewHelp.calls.reset()
    helpApiServiceSpy.updateHelp.calls.reset()
    portalDialogServiceSpy.openDialog.calls.reset()
    messageServiceSpy.error.calls.reset()
    messageServiceSpy.info.calls.reset()
  })

  it('should create', () => {
    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    expect(component).toBeTruthy()
  })

  it('should init remote component', (done: DoneFn) => {
    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)

    expect(component.permissions).toEqual(['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'])
    expect(helpApiServiceSpy.configuration.basePath).toEqual('base_url/bff')
    baseUrlSubject.asObservable().subscribe((item) => {
      console.log(item)
      expect(item).toEqual('base_url')
      done()
    })
  })

  it('should not show button if permissions are not met', async () => {
    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)

    expect(await oneCXHelpItemEditorHarness.getHelpEditorButton()).toBeNull()
    expect(await oneCXHelpItemEditorHarness.getHelpEditorIcon()).toBeNull()
  })

  it('should show button if permissions are met', async () => {
    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)

    fixture.detectChanges()
    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)

    expect(await oneCXHelpItemEditorHarness.getHelpButtonEditorTitle()).toBe('Edit Help for this article')

    expect(await oneCXHelpItemEditorHarness.hasHelpEditorIconClass(PrimeIcons.PENCIL)).toBe(true)
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

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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
        remoteBaseUrl: '',
        app_id: 'mfe_page_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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
        remoteBaseUrl: '',
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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
        remoteBaseUrl: '',
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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

  it('should open help item editor dialog when article and application defined', async () => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()
    expect(portalDialogServiceSpy.openDialog<Help>).toHaveBeenCalledOnceWith(
      'HELP_ITEM_EDITOR.HEADER',
      {
        type: HelpItemEditorDialogComponent,
        inputs: {
          helpItem: {
            appId: 'mfe_app_id',
            itemId: 'article_id'
          }
        }
      },
      {
        key: 'HELP_ITEM_EDITOR.SAVE',
        icon: PrimeIcons.CHECK
      },
      {
        key: 'HELP_ITEM_EDITOR.CANCEL',
        icon: PrimeIcons.TIMES
      },
      false
    )
  })

  it('should be unable to create help item when article not defined', async () => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: ''
      }) as any
    )
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()
    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.OPEN_HELP_PAGE_EDITOR_ERROR'
    })
  })

  it('should be unable to create help item when application not defined', async () => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )
    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: ''
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()
    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.OPEN_HELP_PAGE_EDITOR_ERROR'
    })
  })

  it('should open help item editor dialog for new item', async () => {
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()
    expect(portalDialogServiceSpy.openDialog<Help>).toHaveBeenCalledOnceWith(
      'HELP_ITEM_EDITOR.HEADER',
      {
        type: HelpItemEditorDialogComponent,
        inputs: {
          helpItem: {
            appId: 'mfe_app_id',
            itemId: 'article_id'
          }
        }
      },
      {
        key: 'HELP_ITEM_EDITOR.SAVE',
        icon: PrimeIcons.CHECK
      },
      {
        key: 'HELP_ITEM_EDITOR.CANCEL',
        icon: PrimeIcons.TIMES
      },
      false
    )
  })

  it('should open help item editor dialog for existing item', async () => {
    const helpItem = { id: 'id_1', itemId: 'item_1', appId: 'app_id_1' }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()
    expect(portalDialogServiceSpy.openDialog<Help>).toHaveBeenCalledOnceWith(
      'HELP_ITEM_EDITOR.HEADER',
      {
        type: HelpItemEditorDialogComponent,
        inputs: {
          helpItem: helpItem
        }
      },
      {
        key: 'HELP_ITEM_EDITOR.SAVE',
        icon: PrimeIcons.CHECK
      },
      {
        key: 'HELP_ITEM_EDITOR.CANCEL',
        icon: PrimeIcons.TIMES
      },
      false
    )
  })

  it('should not react to secondary button click', async () => {
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'secondary'
      }) as any
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(helpApiServiceSpy.createNewHelp).toHaveBeenCalledTimes(0)
    expect(helpApiServiceSpy.updateHelp).toHaveBeenCalledTimes(0)
  })

  it('should create new help item on primary button click', async () => {
    const dialogResult = {
      appId: 'result_app_id',
      itemId: 'result_item_id',
      resourceUrl: 'result_resource_url'
    }
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'primary',
        result: dialogResult
      }) as any
    )
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(helpApiServiceSpy.createNewHelp).toHaveBeenCalledOnceWith({
      createHelp: dialogResult
    })
    expect(helpApiServiceSpy.updateHelp).toHaveBeenCalledTimes(0)
  })

  it('should update help item on primary button click', async () => {
    const dialogResult = {
      id: 'result_id',
      appId: 'result_app_id',
      itemId: 'result_item_id',
      resourceUrl: 'result_resource_url',
      modificationCount: 1
    }
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'primary',
        result: dialogResult
      }) as any
    )
    const helpItem = { id: 'id_1', itemId: 'item_1', appId: 'app_id_1', modificationCount: 1 }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(helpApiServiceSpy.updateHelp).toHaveBeenCalledOnceWith({
      id: 'result_id',
      updateHelp: {
        id: 'result_id',
        appId: 'result_app_id',
        itemId: 'result_item_id',
        resourceUrl: 'result_resource_url',
        modificationCount: 1
      }
    } as any)
    expect(helpApiServiceSpy.createNewHelp).toHaveBeenCalledTimes(0)
  })

  it('should load updated help article and inform about successful update', async () => {
    const dialogResult = {
      id: 'result_id',
      appId: 'result_app_id',
      itemId: 'result_item_id',
      resourceUrl: 'result_resource_url',
      modificationCount: 1
    }
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'primary',
        result: dialogResult
      }) as any
    )
    const helpItem = { id: 'id_1', itemId: 'item_1', appId: 'app_id_1', modificationCount: 1 }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
      } as any)
    )
    helpApiServiceSpy.updateHelp.and.returnValue(of({} as any))
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(
      of({
        helpArticleId: 'article_id'
      }) as any
    )

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(messageServiceSpy.info).toHaveBeenCalledOnceWith({
      summaryKey: 'OCX_PORTAL_VIEWPORT.UPDATE_HELP_ARTICLE_INFO'
    })
    expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledWith({
      helpSearchCriteria: {
        itemId: 'article_id',
        appId: 'mfe_app_id'
      }
    })
    expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledWith({
      helpSearchCriteria: {
        itemId: 'result_item_id',
        appId: 'result_app_id'
      }
    })
  })

  it('should display error if new help item creation failed', async () => {
    spyOn(console, 'log')
    const dialogResult = {
      id: 'result_id',
      appId: 'result_app_id',
      itemId: 'result_item_id',
      resourceUrl: 'result_resource_url',
      modificationCount: 1
    }
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'primary',
        result: dialogResult
      }) as any
    )
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )
    helpApiServiceSpy.createNewHelp.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404
          })
      )
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(console.log).toHaveBeenCalledWith(`Could not save help item`)
    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.UPDATE_HELP_ARTICLE_ERROR',
      detailKey: `Server error: 404`
    })
  })

  it('should display error if help item update failed', async () => {
    spyOn(console, 'log')
    const dialogResult = {
      id: 'result_id',
      appId: 'result_app_id',
      itemId: 'result_item_id',
      resourceUrl: 'result_resource_url',
      modificationCount: 1
    }
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'primary',
        result: dialogResult
      }) as any
    )
    const helpItem = { id: 'id_1', itemId: 'item_1', appId: 'app_id_1', modificationCount: 1 }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
      } as any)
    )
    helpApiServiceSpy.updateHelp.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404
          })
      )
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
        appId: 'mfe_app_id'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['PORTAL_HEADER_HELP_ITEM_EDITOR#VIEW'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(console.log).toHaveBeenCalledWith(`Could not save help item`)
    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.UPDATE_HELP_ARTICLE_ERROR',
      detailKey: `Server error: 404`
    })
  })
})
