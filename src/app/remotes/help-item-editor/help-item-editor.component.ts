import { Component, Inject, Input } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { TranslateLoader, TranslateService } from '@ngx-translate/core'
import { Observable, ReplaySubject, catchError, combineLatest, first, map, mergeMap, of } from 'rxjs'
import { PrimeIcons } from 'primeng/api'

import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import {
  DialogState,
  PortalCoreModule,
  PortalDialogService,
  createRemoteComponentTranslateLoader,
  providePortalDialogService
} from '@onecx/portal-integration-angular'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  provideTranslateServiceForRoot,
  ocxRemoteWebcomponent
} from '@onecx/angular-remote-components'

import { Configuration, Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'

import { HelpItemEditorFormComponent } from './help-item-editor-form/help-item-editor-form.component'

@Component({
  selector: 'app-ocx-help-item-editor',
  templateUrl: './help-item-editor.component.html',
  styleUrls: ['./help-item-editor.component.scss'],
  standalone: true,
  imports: [CommonModule, SharedModule, PortalCoreModule, AngularRemoteComponentsModule],
  providers: [
    HelpsInternalAPIService,
    PortalMessageService,
    providePortalDialogService(),
    { provide: BASE_URL, useValue: new ReplaySubject<string>(1) },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    })
  ]
})
export class OneCXHelpItemEditorComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }
  helpArticleId$: Observable<string>
  productName$: Observable<string>
  products$: Observable<Record<string, string>>
  helpDataItem$: Observable<Help>

  permissions: string[] = []

  constructor(
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly router: Router,
    private readonly appStateService: AppStateService,
    private readonly userService: UserService,
    private readonly helpDataService: HelpsInternalAPIService,
    private readonly portalMessageService: PortalMessageService,
    private readonly portalDialogService: PortalDialogService,
    private readonly translateService: TranslateService
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

  public ocxInitRemoteComponent(config: RemoteComponentConfig): void {
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
          return helpPageResult.stream![0]!
        })
      )
  }

  private openHelpEditorDialog(helpItem: Help, productDisplayName: string): Observable<DialogState<Help>> {
    return this.portalDialogService.openDialog<Help>(
      'HELP_ITEM_EDITOR.HEADER',
      {
        type: HelpItemEditorFormComponent,
        inputs: { helpItem: helpItem, productDisplayName: productDisplayName }
      },
      { key: 'ACTIONS.SAVE', icon: PrimeIcons.CHECK },
      { key: 'ACTIONS.CANCEL', icon: PrimeIcons.TIMES },
      { showXButton: true, draggable: true, resizable: true, width: '550px' }
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
    return this.onEditHelpItem({})
  }

  public onEditHelpItem(event: any) {
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
