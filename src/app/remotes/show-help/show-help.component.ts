import { Component, Inject, Input } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, ReplaySubject, catchError, combineLatest, first, map, mergeMap, of, withLatestFrom } from 'rxjs'

import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'

import { getLocation } from '@onecx/accelerator'
import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import { PortalMessageService, PortalCoreModule } from '@onecx/portal-integration-angular'
import {
  AngularRemoteComponentsModule,
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent
} from '@onecx/angular-remote-components'

import { Configuration, Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { SharedModule } from 'src/app/shared/shared.module'

import { NoHelpItemComponent } from './no-help-item/no-help-item.component'

@Component({
  selector: 'app-ocx-show-help',
  templateUrl: './show-help.component.html',
  styleUrls: ['./show-help.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RippleModule,
    TooltipModule,
    DynamicDialogModule,
    TranslateModule,
    SharedModule,
    PortalCoreModule,
    AngularRemoteComponentsModule
  ],
  providers: [HelpsInternalAPIService, DialogService, PortalMessageService]
})
export class OneCXShowHelpComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  helpArticleId$: Observable<string>
  productName$: Observable<string>
  helpDataItem$: Observable<Help> | undefined

  permissions: string[] = []

  constructor(
    @Inject(REMOTE_COMPONENT_CONFIG) private readonly remoteComponentConfig: ReplaySubject<RemoteComponentConfig>,
    private readonly appStateService: AppStateService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly helpDataService: HelpsInternalAPIService,
    private readonly dialogService: DialogService,
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
    this.loadHelpDataItem()
  }

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.remoteComponentConfig.next(config)
    this.permissions = config.permissions
    this.helpDataService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
  }

  private loadHelpDataItem() {
    this.helpDataItem$ = combineLatest([this.productName$, this.helpArticleId$]).pipe(
      mergeMap(([productName, helpArticleId]) => {
        if (productName && helpArticleId) {
          return this.helpDataService.getHelpByProductNameItemId({
            helpItemId: helpArticleId,
            productName: productName
          })
        } else return of({} as Help)
      }),
      catchError((err) => {
        console.error('getHelpByProductNameItemId', err)
        return of({} as Help)
      })
    )
  }

  public onOpenHelpPage() {
    return this.openHelpPage({})
  }

  public openHelpPage(event: any) {
    this.helpDataItem$?.pipe(withLatestFrom(this.helpArticleId$), first()).subscribe({
      next: ([helpDataItem, helpArticleId]) => {
        if (helpDataItem?.id) {
          if (helpDataItem.baseUrl || helpDataItem.resourceUrl) {
            const currentLocation = getLocation()
            const url = this.constructUrl(
              Location.joinWithSlash(helpDataItem.baseUrl ?? '', helpDataItem.resourceUrl ?? ''),
              currentLocation.origin,
              currentLocation.deploymentPath
            )
            console.log(`navigate to help page: ${url.toString()}`)
            try {
              window.open(url, '_blank')?.focus()
            } catch (e) {
              console.error(`Could not construct help page url ${url.toString()}`, e)
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

  public constructUrl(helpUrl: string, basePath: string, deploymentPath: string): URL {
    const isRelative = new URL(basePath).origin === new URL(helpUrl, basePath).origin
    if (isRelative) return new URL(Location.joinWithSlash(deploymentPath, helpUrl), basePath)
    return new URL(helpUrl)
  }
}
