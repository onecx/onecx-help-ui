import { Component, Inject, Input } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, ReplaySubject, catchError, combineLatest, first, map, mergeMap, of, withLatestFrom } from 'rxjs'
import { PrimeIcons } from 'primeng/api'

import { getLocation } from '@onecx/accelerator'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  provideTranslateServiceForRoot,
  ocxRemoteComponent,
  ocxRemoteWebcomponent
} from '@onecx/angular-remote-components'
import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import {
  DialogState,
  PortalCoreModule,
  PortalDialogService,
  providePortalDialogService
} from '@onecx/portal-integration-angular'

import { Configuration, Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { SharedModule } from 'src/app/shared/shared.module'

import { NoHelpItemComponent } from './no-help-item/no-help-item.component'

@Component({
  selector: 'app-ocx-show-help',
  templateUrl: './show-help.component.html',
  styleUrls: ['./show-help.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, SharedModule, PortalCoreModule, AngularRemoteComponentsModule],
  providers: [
    HelpsInternalAPIService,
    PortalMessageService,
    { provide: BASE_URL, useValue: new ReplaySubject<string>(1) },
    providePortalDialogService(),
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
export class OneCXShowHelpComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }
  helpArticleId$: Observable<string>
  productName$: Observable<string>
  helpItem$: Observable<Help> | undefined
  permissions: string[] = []

  constructor(
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly appStateService: AppStateService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly portalDialogService: PortalDialogService,
    private readonly helpApi: HelpsInternalAPIService,
    private readonly portalMessageService: PortalMessageService,
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
    this.helpItem$ = combineLatest([this.productName$, this.helpArticleId$]).pipe(
      mergeMap(([productName, helpArticleId]) => {
        if (productName && helpArticleId) {
          return this.helpApi.getHelpByProductNameItemId({
            helpItemId: helpArticleId,
            productName: productName
          })
        } else return of({} as Help)
      }),
      catchError(() => {
        return of({} as Help)
      })
    )
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.helpApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
  }

  public onOpenHelpPage(ev: Event) {
    ev.stopPropagation()
    this.helpItem$?.pipe(withLatestFrom(this.helpArticleId$), first()).subscribe({
      next: ([helpItem, helpArticleId]) => {
        // if item exists with baseUrl: open URL in new TAB
        if (helpItem?.id && helpItem.baseUrl) {
          const currentLocation = getLocation()
          const url = this.constructUrl(
            this.prepareUrl(helpItem), // complete URL: base/resource#context
            currentLocation.origin,
            currentLocation.deploymentPath
          )
          console.info(`navigate to help page: ${url.toString()}`)
          try {
            window.open(url, '_blank')?.focus()
          } catch (e) {
            this.portalMessageService.error({ summaryKey: 'SHOW_HELP.HELP_PAGE_ERROR' })
          }
        } else {
          this.openNoHelpItemDialog(helpItem, helpArticleId)
        }
      }
    })
  }

  private openNoHelpItemDialog(helpItem: Help, articleId: string) {
    const issueTypeKey = helpItem?.id ? 'MISSING_BASE_URL' : 'NO_HELP_ITEM'
    // call no-help dialog if item is missing or not usable
    this.portalDialogService
      .openDialog<NoHelpItemComponent>(
        'SHOW_HELP.' + issueTypeKey + '.HEADER',
        {
          type: NoHelpItemComponent,
          inputs: { issueTypeKey: issueTypeKey, helpArticleId: articleId }
        },
        {
          id: 'hm_no_help_action_close',
          key: 'ACTIONS.NAVIGATION.CLOSE',
          icon: PrimeIcons.TIMES,
          tooltipKey: 'ACTIONS.NAVIGATION.CLOSE.TOOLTIP',
          tooltipPosition: 'top'
        },
        undefined, // no second button
        {
          width: '450px',
          draggable: true,
          resizable: false,
          showHeader: true,
          showXButton: true, // this does not work: missing second button prevents the x button
          keepInViewport: true,
          closeOnEscape: true,
          closeAriaLabel: 'ACTIONS.NAVIGATION.CLOSE.TOOLTIP'
        }
      )
      .pipe(map((dialogState): [DialogState<NoHelpItemComponent>] => [dialogState]))
      .subscribe()
  }

  private constructUrl(helpUrl: string, basePath: string, deploymentPath: string): URL {
    const isRelative = new URL(basePath).origin === new URL(helpUrl, basePath).origin
    if (isRelative) return new URL(Location.joinWithSlash(deploymentPath, helpUrl), basePath)
    return new URL(helpUrl)
  }

  /* Prepare the final URL as follow (#) = optional:
      1. baseUrl
      2. baseUrl(#)context
      3. baseUrl/resourceUrl
      4. baseUrl/resourceUrl(#)context
  */
  private prepareUrl(help: Help): string {
    let ctx = ''
    if (help.context) {
      ctx = (help.context.startsWith('#') ? '' : '#') + help.context
    }
    if (help.baseUrl && help.resourceUrl) {
      return Location.joinWithSlash(help.baseUrl, help.resourceUrl) + ctx
    } else return (help.baseUrl ?? '') + ctx
  }
}
