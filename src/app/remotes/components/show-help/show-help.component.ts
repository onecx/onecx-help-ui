import { Component, Input, OnInit, inject } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, catchError, first, map, mergeMap, of, withLatestFrom } from 'rxjs'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { DialogService } from 'primeng/dynamicdialog'
import { RemoteComponentConfig, ocxRemoteComponent } from '@onecx/angular-remote-components'
import { PortalMessageService } from '@onecx/portal-integration-angular'
import { AppStateService } from '@onecx/angular-integration-interface'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { HelpData } from '../../model/help-data.model'
import { HelpAPIService } from '../../service/help-api-service'
import { NoHelpItemComponent } from '../no-help-item/no-help-item.component'

// TODO: Make sure all dependencies are fullfield in shell
//   imports: [
//     DynamicDialogModule,
//     NoHelpItemComponent,
//     PortalCoreModule
//   ],
// })
@Component({
  selector: 'app-ocx-show-help',
  templateUrl: './show-help.component.html',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RippleModule, TooltipModule, TranslateModule, AngularAcceleratorModule],
  providers: [
    {
      provide: HelpAPIService,
      useFactory: () => new HelpAPIService(inject(HttpClient))
    },
    DialogService
  ]
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
  // applicationId$: Observable<string> | undefined
  helpDataItem$: Observable<HelpData> | undefined
  applicationId: string | undefined
  bffUrl: string = ''
  baseUrl: string = ''
  permissions: string[] = []

  constructor(
    private appStateService: AppStateService,
    private router: Router,
    private helpDataService: HelpAPIService,
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
    // this.applicationId$ = combineLatest([
    //   this.appStateService.currentPage$.asObservable(),
    //   this.appStateService.currentMfe$.asObservable()
    // ]).pipe(
    //   map(([page, mfe]) => {
    //     console.warn('new applicationId data')
    //     console.warn(page, ' ', mfe)
    //     return page?.applicationId ?? mfe.displayName ?? ''
    //   })
    // )
    this.helpDataItem$ = this.helpArticleId$.pipe(
      mergeMap((helpArticleId) => {
        if (this.applicationId && helpArticleId) return this.loadHelpArticle(this.applicationId, helpArticleId)
        return of({})
      }),
      catchError(() => {
        console.log(`Failed to load help article`)
        return of({})
      })
    )
  }

  ngOnInit(): void {
    // TODO: REMOVE (testing purposes)
    // TODO: Write tests
    // TODO: Research CurrentPageTopic -> check portal-page.component.ts -> I think its fine to get helpArticleId from here
    // TODO: Check component in shell
    this.ocxInitRemoteComponent({
      appId: 'my-appId',
      productName: 'my-product',
      // permissions: ['PORTAL_HEADER_GIVE_FEEDBACK#VIEW'],
      permissions: ['PORTAL_HEADER_HELP#VIEW'],
      bffUrl: 'http://onecx-help-bff',
      baseUrl: 'my-base-url'
    })
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.applicationId = config.appId
    this.bffUrl = config.bffUrl
    this.baseUrl = config.baseUrl
    this.permissions = config.permissions
  }

  private loadHelpArticle(appId: string, helpItemId: string) {
    return this.helpDataService.getHelpDataItem(this.bffUrl, this.baseUrl, appId, helpItemId)
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
