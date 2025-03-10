import { importProvidersFrom } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'

import { environment } from 'src/environments/environment'
import { OneCXHelpItemEditorComponent } from './help-item-editor.component'
import { providePortalDialogService } from '@onecx/portal-integration-angular'
import {
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { ReplaySubject } from 'rxjs'
import { TranslateLoader } from '@ngx-translate/core'
import {
  THEME_OVERRIDES,
  TRANSLATION_PATH,
  createTranslateLoader,
  provideThemeConfig,
  remoteComponentTranslationPathFactory
} from '@onecx/angular-utils'

import Nora from '@primeng/themes/nora'

bootstrapRemoteComponent(OneCXHelpItemEditorComponent, 'ocx-help-item-editor-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAuthModule, BrowserAnimationsModule),
  providePortalDialogService(),
  { provide: REMOTE_COMPONENT_CONFIG, useValue: new ReplaySubject<RemoteComponentConfig>(1) },
  provideTranslateServiceForRoot({
    isolate: true,
    loader: {
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
      deps: [HttpClient]
    }
  }),
  {
    provide: TRANSLATION_PATH,
    useFactory: (remoteComponentConfig: ReplaySubject<RemoteComponentConfig>) =>
      remoteComponentTranslationPathFactory('assets/i18n/')(remoteComponentConfig),
    multi: true,
    deps: [REMOTE_COMPONENT_CONFIG]
  },
  provideThemeConfig()
  // {
  //   provide: THEME_OVERRIDES,
  //   useValue: Nora
  // }
])
