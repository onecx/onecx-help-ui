import { Component, Inject } from '@angular/core'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { CommonModule, Location } from '@angular/common'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, ReplaySubject, catchError, combineLatest, first, map, mergeMap, of, withLatestFrom } from 'rxjs'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'
import {
  AngularRemoteComponentsModule,
  RemoteComponentConfig,
  ocxRemoteComponent,
  BASE_URL,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { UserService, AppStateService } from '@onecx/angular-integration-interface'
import { createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { PortalMessageService, PortalCoreModule } from '@onecx/portal-integration-angular'
import { NoHelpItemComponent } from './no-help-item/no-help-item.component'
import { Configuration, Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { SharedModule } from 'src/app/shared/shared.module'
import { Router } from '@angular/router'
import { getLocation } from '@onecx/accelerator'

@Component({
  selector: 'app-ocx-show-help',
  templateUrl: './show-help.component.html',
  styleUrls: ['./show-help.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RippleModule,
    TooltipModule,
    DynamicDialogModule,
    NoHelpItemComponent,
    TranslateModule,
    SharedModule,
    PortalCoreModule,
    AngularRemoteComponentsModule
  ],
  providers: [
    HelpsInternalAPIService,
    DialogService,
    PortalMessageService,
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
export class OneCXShowHelpComponent implements ocxRemoteComponent {
  LABEL_KEY: string = 'SHOW_HELP.LABEL'
  ICON: string = PrimeIcons.QUESTION_CIRCLE

  helpArticleId$: Observable<string>
  productName$: Observable<string>
  helpDataItem$: Observable<Help>

  permissions: string[] = []

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private appStateService: AppStateService,
    private userService: UserService,
    private router: Router,
    private helpDataService: HelpsInternalAPIService,
    private dialogService: DialogService,
    private portalMessageService: PortalMessageService,
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

    this.helpDataItem$ = combineLatest([this.productName$, this.helpArticleId$]).pipe(
      mergeMap(([productName, helpArticleId]) => {
        if (productName && helpArticleId) return this.loadHelpArticle(productName, helpArticleId)
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

  public onEnterClick() {
    return this.openHelpPage({})
  }

  public openHelpPage(event: any) {
    this.helpDataItem$?.pipe(withLatestFrom(this.helpArticleId$), first()).subscribe({
      next: ([helpDataItem, helpArticleId]) => {
        if (helpDataItem && helpDataItem.id) {
          if (helpDataItem.resourceUrl) {
            const currentLocation = getLocation()
            const url = this.constructUrl(
              helpDataItem.resourceUrl,
              currentLocation.origin,
              currentLocation.deploymentPath
            )
            console.log(`navigate to help page: ${url.toString()}`)
            try {
              window.open(url, '_blank')?.focus()
            } catch (e) {
              console.log(`Could not construct help page url ${url.toString()}`, e)
              this.portalMessageService.error({
                summaryKey: 'SHOW_HELP.HELP_PAGE_ERROR'
              })
            }
          }
        } else {
          this.translateService.get('SHOW_HELP.NO_HELP_ITEM.HEADER').subscribe((dialogTitle) => {
            this.dialogService.open(NoHelpItemComponent, {
              header: dialogTitle,
              width: '400px',
              data: {
                helpArticleId: helpArticleId
              }
            })
          })
        }
      }
    })
    event.preventDefault()
  }

  public constructUrl(resourceUrl: string, basePath: string, deploymentPath: string): URL {
    const isRelative = new URL(basePath).origin === new URL(resourceUrl, basePath).origin
    if (isRelative) return new URL(Location.joinWithSlash(deploymentPath, resourceUrl), basePath)
    return new URL(resourceUrl)
  }
}
