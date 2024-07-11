import { CommonModule, Location } from '@angular/common'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { Component, Inject, Input } from '@angular/core'
import { Router } from '@angular/router'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { Observable, ReplaySubject, catchError, combineLatest, first, map, mergeMap, of } from 'rxjs'

import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  provideTranslateServiceForRoot,
  ocxRemoteWebcomponent
} from '@onecx/angular-remote-components'
import {
  AppStateService,
  DialogState,
  PortalCoreModule,
  PortalDialogService,
  PortalMessageService,
  REMOTE_COMPONENT_ID,
  UserService,
  createRemoteComponentTranslateLoader,
  providePortalDialogService
} from '@onecx/portal-integration-angular'

import { Configuration, Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'

import { HelpItemEditorDialogComponent } from './help-item-editor-dialog/help-item-editor-dialog.component'

@Component({
  selector: 'app-ocx-help-item-editor',
  templateUrl: './help-item-editor.component.html',
  styleUrls: ['./help-item-editor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RippleModule,
    TooltipModule,
    HelpItemEditorDialogComponent,
    TranslateModule,
    SharedModule,
    PortalCoreModule,
    AngularRemoteComponentsModule
  ],
  providers: [
    HelpsInternalAPIService,
    PortalMessageService,
    providePortalDialogService(),
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    {
      provide: REMOTE_COMPONENT_ID,
      useValue: 'ocx-help-item-editor-component'
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL, REMOTE_COMPONENT_ID]
      }
    })
  ]
})
export class OneCXHelpItemEditorComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  helpArticleId$: Observable<string>
  productName$: Observable<string>
  products$: Observable<Record<string, string>>
  helpDataItem$: Observable<Help>

  permissions: string[] = []

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private appStateService: AppStateService,
    private userService: UserService,
    private router: Router,
    private helpDataService: HelpsInternalAPIService,
    private portalMessageService: PortalMessageService,
    private portalDialogService: PortalDialogService,
    private translateService: TranslateService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))
    this.helpArticleId$ = this.appStateService.currentPage$.asObservable().pipe(
      map((page) => {
        if (page?.helpArticleId) return page.helpArticleId
        if (page?.pageName) return page.pageName
        return router.routerState.snapshot.url.split('#')[0]
      })
    )
    this.productName$ = combineLatest([this.appStateService.currentMfe$.asObservable()]).pipe(
      map(([mfe]) => {
        if (mfe.productName) return mfe.productName
        return ''
      })
    )
    this.products$ = this.baseUrl.asObservable().pipe(
      mergeMap(() => {
        return this.helpDataService
          .searchProductsByCriteria({
            productsSearchCriteria: {
              pageNumber: 0,
              pageSize: 1000
            }
          })
          .pipe(
            map((productsPageResult) => {
              productsPageResult.stream = productsPageResult.stream ?? []
              return Object.fromEntries(productsPageResult.stream.map((product) => [product.name, product.displayName]))
            })
          )
      })
    )

    this.helpDataItem$ = combineLatest([this.productName$, this.helpArticleId$]).pipe(
      mergeMap(([productName, helpArticleId]) => {
        if (productName && helpArticleId) return this.loadHelpArticle(productName, helpArticleId)
        return of({} as Help)
      }),
      catchError(() => {
        return of({} as Help)
      })
    )
  }

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.helpDataService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
  }

  private loadHelpArticle(productName: string, helpItemId: string): Observable<Help> {
    return this.helpDataService
      .searchHelps({ helpSearchCriteria: { itemId: helpItemId, productName: productName } })
      .pipe(
        map((helpPageResult) => {
          if (helpPageResult.totalElements !== 1) {
            return {} as Help
          }
          return helpPageResult.stream!.at(0)!
        })
      )
  }

  private openHelpEditorDialog(helpItem: Help, productDisplayName: string): Observable<DialogState<Help>> {
    return this.portalDialogService.openDialog<Help>(
      'HELP_ITEM_EDITOR.HEADER',
      {
        type: HelpItemEditorDialogComponent,
        inputs: {
          helpItem: helpItem,
          productDisplayName: productDisplayName
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
      {
        showXButton: true,
        draggable: true,
        resizable: true,
        width: '500px'
      }
    )
  }

  private udateHelpItem(
    dialogState: DialogState<Help>,
    isNewHelpItem: boolean
  ): Observable<[itemId: string, productName: string]> {
    if (isNewHelpItem) {
      return this.helpDataService
        .createNewHelp({
          createHelp: dialogState.result!
        })
        .pipe(map((help): [string, string] => [help.itemId, help.productName!]))
    }
    return this.helpDataService
      .updateHelp({
        id: dialogState.result!.id!,
        updateHelp: {
          ...dialogState.result!,
          modificationCount: dialogState.result!.modificationCount!
        }
      })
      .pipe(map((): [string, string] => [dialogState.result!.itemId, dialogState.result!.productName!]))
  }

  public onEnterClick() {
    return this.editHelpPage({})
  }

  public editHelpPage(event: any) {
    combineLatest([this.helpArticleId$, this.productName$, this.helpDataItem$, this.products$])
      .pipe(
        first(),
        mergeMap(([helpArticleId, productName, helpDataItem, products]) => {
          let isNewItem = false
          if (helpArticleId && productName) {
            if (!helpDataItem.itemId) {
              helpDataItem.itemId = helpArticleId
              isNewItem = true
            }
            helpDataItem.productName = helpDataItem.productName ?? productName
            return this.openHelpEditorDialog(helpDataItem, products[helpDataItem.productName]).pipe(
              map((dialogState): [DialogState<Help>, boolean] => [dialogState, isNewItem])
            )
          } else {
            this.portalMessageService.error({
              summaryKey: 'HELP_ITEM_EDITOR.OPEN_HELP_PAGE_EDITOR_ERROR'
            })
            return of([])
          }
        }),
        mergeMap(([dialogState, isNewHelpItem]) => {
          if (dialogState?.button === 'primary') {
            return this.udateHelpItem(dialogState, isNewHelpItem)
          }
          return of([])
        })
      )
      .subscribe({
        next: ([itemId, productName]) => {
          if (itemId && productName) {
            this.portalMessageService.info({
              summaryKey: 'OCX_PORTAL_VIEWPORT.UPDATE_HELP_ARTICLE_INFO'
            })
            this.loadHelpArticle(productName, itemId)
          }
        },
        error: (error) => {
          this.portalMessageService.error({
            summaryKey: 'HELP_ITEM_EDITOR.UPDATE_HELP_ARTICLE_ERROR',
            detailKey: `Server error: ${error.status}`
          })
        }
      })
  }
}
