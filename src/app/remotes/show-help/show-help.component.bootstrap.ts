import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { importProvidersFrom } from '@angular/core'
import { OneCXShowHelpComponent } from './show-help.component'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { AngularAuthModule } from '@onecx/angular-auth'
import { environment } from 'src/environments/environment'
import { NoHelpItemComponent, PortalCoreModule } from '@onecx/portal-integration-angular'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { SharedModule } from 'primeng/api'
import { DynamicDialogModule } from 'primeng/dynamicdialog'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'

bootstrapRemoteComponent(OneCXShowHelpComponent, 'ocx-show-help-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(
    AngularAuthModule,
    PortalCoreModule,
    CommonModule,
    HttpClientModule,
    RippleModule,
    TooltipModule,
    DynamicDialogModule,
    NoHelpItemComponent,
    TranslateModule,
    SharedModule
  )
])
