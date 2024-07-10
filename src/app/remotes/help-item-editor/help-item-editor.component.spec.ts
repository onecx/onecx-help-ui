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
    'updateHelp',
    'searchProductsByCriteria'
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
    helpApiServiceSpy.searchProductsByCriteria.calls.reset()
    portalDialogServiceSpy.openDialog.calls.reset()
    messageServiceSpy.error.calls.reset()
    messageServiceSpy.info.calls.reset()

    helpApiServiceSpy.searchProductsByCriteria.and.returnValue(of({} as any))
  })

  it('should create', () => {
    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    expect(component).toBeTruthy()
  })

  it('should call ocxInitRemoteComponent with the correct config', () => {
    const mockConfig: RemoteComponentConfig = {
      appId: 'appId',
      productName: 'prodName',
      permissions: ['permission'],
      baseUrl: 'base'
    }
    spyOn(component, 'ocxInitRemoteComponent')

    component.ocxRemoteComponentConfig = mockConfig

    expect(component.ocxInitRemoteComponent).toHaveBeenCalledWith(mockConfig)
  })

  it('should init remote component', (done: DoneFn) => {
    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)

    expect(component.permissions).toEqual(['HELP#EDIT'])
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
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)

    fixture.detectChanges()
    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)

    expect(await oneCXHelpItemEditorHarness.hasHelpEditorIconClass(PrimeIcons.PENCIL)).toBe(true)
  })

  it('should call editHelpPage on enter click', () => {
    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    spyOn(component, 'editHelpPage')
    component.onEnterClick()
    expect(component.editHelpPage).toHaveBeenCalledTimes(1)
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

  it('should contain productName from mfe', (done: DoneFn) => {
    const appStateService = TestBed.inject(AppStateService)
    spyOn(appStateService.currentPage$, 'asObservable').and.returnValue(of({}) as any)

    spyOn(appStateService.currentMfe$, 'asObservable').and.returnValue(
      of({
        remoteBaseUrl: '',
        productName: 'mfe_product_name'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.productName$?.subscribe((id) => {
      expect(id).toEqual('mfe_product_name')
      done()
    })
  })

  it('should map productName to productDisplayName', (done: DoneFn) => {
    helpApiServiceSpy.searchProductsByCriteria.calls.reset()
    helpApiServiceSpy.searchProductsByCriteria.and.returnValue(
      of({
        stream: [
          {
            name: 'prod-1',
            displayName: 'Product 1'
          },
          {
            name: 'my-prod',
            displayName: 'My product'
          }
        ]
      } as any)
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.products$?.subscribe((products) => {
      expect(products['prod-1']).toBe('Product 1')
      expect(products['my-prod']).toBe('My product')
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

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
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

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.helpDataItem$?.subscribe((item) => {
      expect(item).toEqual({} as Help)
      expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledOnceWith({
        helpSearchCriteria: { itemId: 'article_id', productName: 'mfe_product_name' }
      })
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
        productName: 'mfe_product_name'
      }) as any
    )
    helpApiServiceSpy.searchProductsByCriteria.calls.reset()
    helpApiServiceSpy.searchProductsByCriteria.and.returnValue(
      of({
        stream: [
          {
            name: 'mfe_product_name',
            displayName: 'mfe_display_product_name'
          }
        ]
      } as any)
    )
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
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
            productName: 'mfe_product_name',
            itemId: 'article_id'
          },
          productDisplayName: 'mfe_display_product_name'
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
        productName: 'mfe_product_name'
      }) as any
    )
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()
    expect(messageServiceSpy.error).toHaveBeenCalledTimes(1)
    expect(messageServiceSpy.info).toHaveBeenCalledTimes(0)
    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.OPEN_HELP_PAGE_EDITOR_ERROR'
    })
    expect(helpApiServiceSpy.createNewHelp).toHaveBeenCalledTimes(0)
    expect(helpApiServiceSpy.updateHelp).toHaveBeenCalledTimes(0)
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
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()
    expect(messageServiceSpy.error).toHaveBeenCalledTimes(1)
    expect(messageServiceSpy.info).toHaveBeenCalledTimes(0)
    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.OPEN_HELP_PAGE_EDITOR_ERROR'
    })
    expect(helpApiServiceSpy.createNewHelp).toHaveBeenCalledTimes(0)
    expect(helpApiServiceSpy.updateHelp).toHaveBeenCalledTimes(0)
  })

  it('should open help item editor dialog for new item', async () => {
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
    helpApiServiceSpy.searchProductsByCriteria.calls.reset()
    helpApiServiceSpy.searchProductsByCriteria.and.returnValue(
      of({
        stream: [
          {
            name: 'mfe_product_name',
            displayName: 'mfe_display_product_name'
          }
        ]
      } as any)
    )
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
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
            productName: 'mfe_product_name',
            itemId: 'article_id'
          },
          productDisplayName: 'mfe_display_product_name'
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
    helpApiServiceSpy.searchProductsByCriteria.calls.reset()
    helpApiServiceSpy.searchProductsByCriteria.and.returnValue(
      of({
        stream: [
          {
            name: 'mfe_product_name',
            displayName: 'mfe_display_product_name'
          },
          {
            name: 'product_name_1',
            displayName: 'product_name_1_display'
          }
        ]
      } as any)
    )
    // itemId and productName different only for testing purposes
    const helpItem = { id: 'id_1', itemId: 'item_1', productName: 'product_name_1' }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
      } as any)
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
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
          helpItem: helpItem,
          productDisplayName: 'product_name_1_display'
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
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'secondary'
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(helpApiServiceSpy.createNewHelp).toHaveBeenCalledTimes(0)
    expect(helpApiServiceSpy.updateHelp).toHaveBeenCalledTimes(0)
  })

  it('should create new help item on primary button click', async () => {
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
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )

    const dialogResult = {
      productName: 'result_product_name',
      itemId: 'result_item_id',
      resourceUrl: 'result_resource_url'
    }
    portalDialogServiceSpy.openDialog.and.returnValue(
      of({
        button: 'primary',
        result: dialogResult
      }) as any
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
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
    const helpItem = { id: 'id_1', itemId: 'item_1', productName: 'product_name_1', modificationCount: 1 }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
      } as any)
    )

    const dialogResult = {
      id: 'result_id',
      productName: 'result_product_name',
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

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(helpApiServiceSpy.updateHelp).toHaveBeenCalledOnceWith({
      id: 'result_id',
      updateHelp: {
        id: 'result_id',
        productName: 'result_product_name',
        itemId: 'result_item_id',
        resourceUrl: 'result_resource_url',
        modificationCount: 1
      }
    } as any)
    expect(helpApiServiceSpy.createNewHelp).toHaveBeenCalledTimes(0)
  })

  it('should load updated help article and inform about successful update for existing item', async () => {
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
    const helpItem = { id: 'id_1', itemId: 'item_1', productName: 'product_name_1', modificationCount: 1 }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
      } as any)
    )

    const dialogResult = {
      id: 'result_id',
      productName: 'result_product_name',
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

    helpApiServiceSpy.updateHelp.and.returnValue(of({} as any))

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
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
        productName: 'mfe_product_name'
      }
    })
    expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledWith({
      helpSearchCriteria: {
        itemId: 'result_item_id',
        productName: 'result_product_name'
      }
    })
  })

  it('should load updated help article and inform about successful update for new item', async () => {
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
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )

    const dialogResult = {
      id: 'result_id',
      productName: 'result_product_name',
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

    helpApiServiceSpy.createNewHelp.and.returnValue(
      of({
        itemId: 'result_item_id',
        productName: 'result_product_name'
      } as any)
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
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
        productName: 'mfe_product_name'
      }
    })
    expect(helpApiServiceSpy.searchHelps).toHaveBeenCalledWith({
      helpSearchCriteria: {
        itemId: 'result_item_id',
        productName: 'result_product_name'
      }
    })
  })

  it('should display error if new help item creation failed', async () => {
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
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 0,
        stream: []
      } as any)
    )

    const dialogResult = {
      id: 'result_id',
      productName: 'result_product_name',
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

    helpApiServiceSpy.createNewHelp.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404
          })
      )
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.UPDATE_HELP_ARTICLE_ERROR',
      detailKey: `Server error: 404`
    })
  })

  it('should display error if help item update failed', async () => {
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
    const helpItem = { id: 'id_1', itemId: 'item_1', productName: 'product_name_1', modificationCount: 1 }
    helpApiServiceSpy.searchHelps.and.returnValue(
      of({
        totalElements: 1,
        stream: [helpItem]
      } as any)
    )

    const dialogResult = {
      id: 'result_id',
      productName: 'result_product_name',
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

    helpApiServiceSpy.updateHelp.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404
          })
      )
    )

    fixture = TestBed.createComponent(OneCXHelpItemEditorComponent)
    component = fixture.componentInstance
    component.ocxInitRemoteComponent({
      permissions: ['HELP#EDIT'],
      baseUrl: 'base_url'
    } as RemoteComponentConfig)
    fixture.detectChanges()

    oneCXHelpItemEditorHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, OneCXHelpItemEditorHarness)
    await oneCXHelpItemEditorHarness.clickHelpEditorButton()

    expect(messageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.UPDATE_HELP_ARTICLE_ERROR',
      detailKey: `Server error: 404`
    })
  })
})
