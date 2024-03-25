import { Component, Input, OnInit } from '@angular/core'
import { HttpClientModule } from '@angular/common/http'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, Observable, catchError, first, map, mergeMap, of, withLatestFrom } from 'rxjs'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'
import { RemoteComponentConfig, ocxRemoteComponent } from '@onecx/angular-remote-components'
import { PortalCoreModule, PortalMessageService } from '@onecx/portal-integration-angular'
import { AppStateService } from '@onecx/angular-integration-interface'
import { NoHelpItemComponent } from '../no-help-item/no-help-item.component'
import { Help } from 'src/app/shared/generated'
import { HelpsRemoteAPIService } from '../../service/helpsRemote.service'

@Component({
  selector: 'app-ocx-show-help',
  templateUrl: './show-help.component.html',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RippleModule,
    TooltipModule,
    DynamicDialogModule,
    TranslateModule,
    PortalCoreModule,
    NoHelpItemComponent
  ],
  providers: [HelpsRemoteAPIService, DialogService]
})
export class ShowHelpRemoteComponent implements OnInit, ocxRemoteComponent {
  @Input()
  labelKey: string = 'SHOW_HELP.LABEL'
  @Input()
  icon: string = PrimeIcons.QUESTION_CIRCLE
  @Input()
  linkItemClass: string = ''
  @Input()
  iconItemClass: string = ''

  helpArticleId$: Observable<string> | undefined
  helpDataItem$: Observable<Help> | undefined

  private bffSubject = new BehaviorSubject<string | undefined>(undefined)
  bff$ = this.bffSubject.asObservable()
  permissions: string[] = []
  applicationId: string | undefined

  constructor(
    private appStateService: AppStateService,
    // private router: Router,
    private helpDataService: HelpsRemoteAPIService,
    private dialogService: DialogService,
    private portalMessageService: PortalMessageService,
    private translateService: TranslateService
  ) {
    // TODO: Figure out router
    // this.helpArticleId$ = combineLatest([
    //   this.appStateService.currentPage$.asObservable(),
    //   this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
    // ]).pipe(
    //   map(([page, routerEvent]) => {
    //     console.warn('new helpArticleId')
    //     console.warn(page, ' ', routerEvent)
    //     return (
    //       page?.helpArticleId ??
    //       page?.pageName ??
    //       (routerEvent instanceof NavigationEnd ? routerEvent.url.split('#')[0] : '')
    //     )
    //   })
    // )
    this.helpArticleId$ = this.appStateService.currentPage$.asObservable().pipe(
      map((page) => {
        return page?.helpArticleId ?? page?.pageName ?? ''
      })
    )
    this.helpDataItem$ = this.helpArticleId$.pipe(
      mergeMap((helpArticleId) => {
        if (helpArticleId && this.applicationId) return this.loadHelpArticle(helpArticleId)
        return of({} as Help)
      }),
      catchError(() => {
        console.log(`Failed to load help article`)
        return of({} as Help)
      })
    )
    this.helpDataService.setBasePath(this.bff$)
  }

  ngOnInit(): void {
    // TODO: REMOVE (testing purposes)
    // TODO: Write tests
    // TODO: Check component in shell
    this.ocxInitRemoteComponent({
      appId: 'my-appId',
      productName: 'my-product',
      // permissions: ['PORTAL_HEADER_GIVE_FEEDBACK#VIEW'],
      permissions: ['PORTAL_HEADER_HELP#VIEW'],
      // bffUrl: 'http://localhost:8080',
      bffUrl: '/bff',
      baseUrl: 'my-base-url'
    })
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.bffSubject.next(config.bffUrl)
    this.permissions = config.permissions
    this.applicationId = config.appId
  }

  private loadHelpArticle(helpItemId: string): Observable<Help> {
    return this.helpDataService
      .searchHelps({ helpSearchCriteria: { itemId: helpItemId, appId: this.applicationId } })
      .pipe(
        map((helpPageResult) => {
          if (helpPageResult.totalElements !== 1) {
            return {} as Help
          }
          return helpPageResult.stream!.at(0)!
        })
      )
  }

  public openHelpPage(event: any) {
    this.helpDataItem$?.pipe(withLatestFrom(this.helpArticleId$ ?? of()), first()).subscribe({
      next: ([helpDataItem, helpArticleId]) => {
        if (helpDataItem && helpDataItem.id) {
          const url = helpDataItem.resourceUrl
          if (url) {
            console.log(`navigate to help page: ${url}`)
            try {
              window.open(new URL(url), '_blank')?.focus
            } catch (e) {
              console.log(`Error constructing help page URL`, e)
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
}
