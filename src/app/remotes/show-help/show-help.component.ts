import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Inject,
  Input,
  OnDestroy,
  Renderer2,
  ViewChild
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Location } from '@angular/common'
import { Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, ReplaySubject, catchError, combineLatest, first, map, mergeMap, of, withLatestFrom } from 'rxjs'

import { PrimeIcons } from 'primeng/api'
import { ButtonModule } from 'primeng/button'
import { TooltipModule } from 'primeng/tooltip'

import { getLocation } from '@onecx/accelerator'
import {
  AngularRemoteComponentsModule,
  ocxRemoteComponent,
  ocxRemoteWebcomponent
} from '@onecx/angular-remote-components'
import { REMOTE_COMPONENT_CONFIG, RemoteComponentConfig } from '@onecx/angular-utils'
import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import {
  AngularAcceleratorModule,
  PortalDialogService,
  providePortalDialogService,
  DialogState
} from '@onecx/angular-accelerator'

import { Configuration, Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { HelpPanelCoordinatorService } from 'src/app/shared/utils/help-panel-coordinator.service'
import { environment } from 'src/environments/environment'

import { NoHelpItemComponent } from './no-help-item/no-help-item.component'

@Component({
  selector: 'app-ocx-show-help',
  standalone: true,
  imports: [AngularAcceleratorModule, AngularRemoteComponentsModule, ButtonModule, TooltipModule, TranslateModule],
  providers: [HelpsInternalAPIService, PortalMessageService, providePortalDialogService()],
  templateUrl: './show-help.component.html',
  styleUrl: './show-help.component.scss'
})
export class OneCXShowHelpComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, AfterViewInit, OnDestroy {
  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }
  @ViewChild('showHelpHost')
  private readonly showHelpHost!: ElementRef<HTMLElement>
  private readonly destroyRef = inject(DestroyRef)
  private readonly helpArticleId$: Observable<string>
  private readonly productName$: Observable<string>
  private readonly helpItem$: Observable<Help | undefined>
  public permissions: string[] = []
  private removeDocumentClickListener: (() => void) | undefined

  constructor(
    @Inject(REMOTE_COMPONENT_CONFIG) private readonly remoteComponentConfig: ReplaySubject<RemoteComponentConfig>,
    private readonly renderer: Renderer2,
    private readonly appStateService: AppStateService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly portalDialogService: PortalDialogService,
    private readonly helpApi: HelpsInternalAPIService,
    private readonly portalMessageService: PortalMessageService,
    private readonly translateService: TranslateService,
    private readonly helpPanelCoordinatorService: HelpPanelCoordinatorService
  ) {
    this.helpPanelCoordinatorService.register('show', () => {
      this.closeActivePortalDialog()
    })

    this.userService.lang$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => this.translateService.use(lang))
    this.helpArticleId$ = this.appStateService.currentPage$.asObservable().pipe(
      map((page) => {
        if (page?.helpArticleId) return page.helpArticleId
        if (page?.pageName) return page.pageName
        return router.routerState.snapshot.url.split('#')[0]
      })
    )
    this.productName$ = combineLatest([this.appStateService.currentMfe$.asObservable()]).pipe(
      map(([mfe]) => mfe.productName ?? '')
    )
    this.helpItem$ = combineLatest([this.productName$, this.helpArticleId$]).pipe(
      mergeMap(([productName, helpArticleId]) => {
        if (productName && helpArticleId) {
          return this.helpApi.getHelpByProductNameItemId({
            helpItemId: helpArticleId,
            productName: productName
          })
        } else return of(undefined)
      }),
      catchError(() => of(undefined))
    )
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.remoteComponentConfig.next(config)
    this.permissions = config.permissions
    this.helpApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
  }

  ngAfterViewInit(): void {
    this.removeDocumentClickListener = this.renderer.listen('body', 'click', (event: Event) => {
      const target = event.target
      const hostElement = this.showHelpHost?.nativeElement

      if (!(target instanceof Node) || !hostElement) {
        return
      }

      const clickedInsideHost = hostElement.contains(target)
      const clickedInsideDialog = target instanceof Element && !!target.closest('[role="dialog"], .p-dialog')

      if (clickedInsideHost || clickedInsideDialog || !this.helpPanelCoordinatorService.isOpen('show')) {
        return
      }

      this.helpPanelCoordinatorService.close('show')
    })
  }

  ngOnDestroy(): void {
    this.removeDocumentClickListener?.()
  }

  private closeActivePortalDialog(): void {
    const dialogService = (this.portalDialogService as any).dialogService
    if (dialogService?.dialogComponentRefMap) {
      dialogService.dialogComponentRefMap.forEach((_: unknown, dialogRef: { close: () => void }) => {
        dialogRef?.close?.()
      })
    }
  }

  public onOpenHelpPage() {
    if (this.helpPanelCoordinatorService.isOpen('show')) {
      this.helpPanelCoordinatorService.close('show')
      return
    }

    this.helpPanelCoordinatorService.open('show')

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
            console.log('Error opening help page URL', e)
            this.portalMessageService.error({ summaryKey: 'SHOW_HELP.HELP_PAGE_ERROR' })
          }
        } else {
          this.openNoHelpItemDialog(helpItem, helpArticleId)
        }
      }
    })
  }

  private openNoHelpItemDialog(helpItem: Help | undefined, articleId: string) {
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
      .subscribe({
        next: () => {
          this.helpPanelCoordinatorService.close('show')
        },
        error: () => {
          this.helpPanelCoordinatorService.close('show')
        }
      })
  }

  /*
    * Construct URL for help page:
    - If helpUrl is absolute, use it as is
    - If helpUrl is relative, combine it with current basePath and deploymentPath
  */
  private constructUrl(helpUrl: string, basePath: string, deploymentPath: string): URL {
    if (helpUrl.startsWith('http://') || helpUrl.startsWith('https://')) {
      return new URL(helpUrl)
    }
    return new URL(Location.joinWithSlash(deploymentPath, helpUrl), basePath)
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
