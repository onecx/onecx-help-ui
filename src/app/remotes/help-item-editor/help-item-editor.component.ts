import { CommonModule, Location } from '@angular/common'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { Component, Inject } from '@angular/core'
import { Router } from '@angular/router'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import {
  AppStateService,
  DialogState,
  PortalCoreModule,
  PortalDialogService,
  PortalMessageService,
  UserService,
  createRemoteComponentTranslateLoader
} from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { Observable, ReplaySubject, catchError, combineLatest, first, map, mergeMap, of } from 'rxjs'
import { Configuration, Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'
import { HelpItemEditorDialogComponent } from './help-item-editor-dialog/help-item-editor-dialog.component'
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'

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
    DynamicDialogModule,
    HelpItemEditorDialogComponent,
    TranslateModule,
    SharedModule,
    PortalCoreModule,
    AngularRemoteComponentsModule
  ],
  providers: [
    HelpsInternalAPIService,
    PortalMessageService,
    DialogService,
    PortalDialogService,
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
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
export class OneCXHelpItemEditorComponent implements ocxRemoteComponent {
  ICON: string = PrimeIcons.PENCIL

  helpArticleId$: Observable<string>
  applicationId$: Observable<string>
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
        return page?.helpArticleId
          ? page?.helpArticleId
          : page?.pageName
          ? page?.pageName
          : router.routerState.snapshot.url.split('#')[0]
      })
    )
    this.applicationId$ = combineLatest([
      this.appStateService.currentPage$.asObservable(),
      this.appStateService.currentMfe$.asObservable()
    ]).pipe(
      map(([page, mfe]) => {
        return page?.applicationId ? page.applicationId : mfe.appId ? mfe.appId : ''
      })
    )

    this.helpDataItem$ = combineLatest([this.applicationId$, this.helpArticleId$]).pipe(
      mergeMap(([applicationId, helpArticleId]) => {
        if (applicationId && helpArticleId) return this.loadHelpArticle(applicationId, helpArticleId)
        return of({} as Help)
      }),
      catchError(() => {
        console.log(`Failed to load help article`)
        return of({} as Help)
      })
    )
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.helpDataService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
  }

  private loadHelpArticle(appId: string, helpItemId: string): Observable<Help> {
    return this.helpDataService.searchHelps({ helpSearchCriteria: { itemId: helpItemId, appId: appId } }).pipe(
      map((helpPageResult) => {
        if (helpPageResult.totalElements !== 1) {
          return {} as Help
        }
        return helpPageResult.stream!.at(0)!
      })
    )
  }

  public editHelpPage(event: any) {
    combineLatest([this.helpArticleId$, this.applicationId$, this.helpDataItem$])
      .pipe(
        first(),
        mergeMap(([helpArticleId, applicationId, helpDataItem]) => {
          let isNewItem = false
          if (helpArticleId && applicationId) {
            if (!helpDataItem!.itemId) {
              helpDataItem = { appId: applicationId, itemId: helpArticleId }
              isNewItem = true
            }
            return this.portalDialogService
              .openDialog<Help>(
                'HELP_ITEM_EDITOR.HEADER',
                {
                  type: HelpItemEditorDialogComponent,
                  inputs: {
                    helpItem: helpDataItem
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
              .pipe(map((dialogState): [DialogState<Help>, boolean] => [dialogState, isNewItem]))
          } else {
            this.portalMessageService.error({
              summaryKey: 'HELP_ITEM_EDITOR.OPEN_HELP_PAGE_EDITOR_ERROR'
            })
            return of([])
          }
        }),
        mergeMap(([dialogState, isNewHelpItem]) => {
          if (dialogState?.button === 'primary') {
            if (isNewHelpItem) {
              return this.helpDataService
                .createNewHelp({
                  createHelp: dialogState.result!
                })
                .pipe(map((help): [string, string] => [help.itemId, help.appId!]))
            }
            return this.helpDataService
              .updateHelp({
                id: dialogState.result!.id!,
                updateHelp: {
                  ...dialogState.result!,
                  modificationCount: dialogState.result!.modificationCount!
                }
              })
              .pipe(map((): [string, string] => [dialogState.result!.itemId, dialogState.result!.appId!]))
          }
          return of([])
        })
      )
      .subscribe({
        next: ([itemId, applicationId]) => {
          if (itemId && applicationId) {
            this.portalMessageService.info({
              summaryKey: 'OCX_PORTAL_VIEWPORT.UPDATE_HELP_ARTICLE_INFO'
            })
            this.loadHelpArticle(applicationId, itemId)
          }
        },
        error: (error) => {
          console.log(`Could not save help item`)
          this.portalMessageService.error({
            summaryKey: 'HELP_ITEM_EDITOR.UPDATE_HELP_ARTICLE_ERROR',
            detailKey: `Server error: ${error.status}`
          })
        }
      })
  }
}
