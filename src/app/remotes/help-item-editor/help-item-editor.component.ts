import { CommonModule, Location } from '@angular/common'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { Component, Inject } from '@angular/core'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { PortalCoreModule, UserService, createRemoteComponentTranslateLoader } from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { ReplaySubject } from 'rxjs'
import { Configuration, HelpsInternalAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'

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
    TranslateModule,
    SharedModule,
    PortalCoreModule,
    AngularRemoteComponentsModule
  ],
  providers: [
    HelpsInternalAPIService,
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

  permissions: string[] = []

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private helpDataService: HelpsInternalAPIService,
    private userService: UserService,
    private translateService: TranslateService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.helpDataService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
  }

  // implement open help page editor with portaldialogservice
  public openHelpPageEditor(event: any) {}
}
