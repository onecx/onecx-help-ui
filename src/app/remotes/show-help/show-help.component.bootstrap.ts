import { importProvidersFrom } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'

import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { AngularAuthModule } from '@onecx/angular-auth'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { environment } from 'src/environments/environment'
import { OneCXShowHelpComponent } from './show-help.component'
import {
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { TranslateLoader } from '@ngx-translate/core'
import { ReplaySubject } from 'rxjs'
import { TRANSLATION_PATH, createTranslateLoader, remoteComponentTranslationPathFactory } from '@onecx/angular-utils'

bootstrapRemoteComponent(OneCXShowHelpComponent, 'ocx-show-help-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAuthModule, BrowserAnimationsModule),
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
  }
])
