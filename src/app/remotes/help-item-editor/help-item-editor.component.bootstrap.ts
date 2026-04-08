import { importProvidersFrom } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MissingTranslationHandler, TranslateLoader } from '@ngx-translate/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import {
  createTranslateLoader,
  provideThemeConfig,
  provideTranslationPathFromMeta,
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig
} from '@onecx/angular-utils'

import { environment } from 'src/environments/environment'
import { OneCXHelpItemEditorComponent } from './help-item-editor.component'
import { ReplaySubject } from 'rxjs'
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components'
import { AngularAcceleratorMissingTranslationHandler } from '@onecx/angular-accelerator'

// Double check this stuff
bootstrapRemoteComponent(OneCXHelpItemEditorComponent, 'ocx-help-item-editor-component', environment.production, [
  { provide: REMOTE_COMPONENT_CONFIG, useValue: new ReplaySubject<RemoteComponentConfig>(1) },
  provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
  provideTranslateServiceForRoot({
    isolate: true,
    loader: { provide: TranslateLoader, useFactory: createTranslateLoader, deps: [HttpClient] },
    missingTranslationHandler: {
      provide: MissingTranslationHandler,
      useClass: AngularAcceleratorMissingTranslationHandler
    }
  }),
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAuthModule, BrowserAnimationsModule),
  provideThemeConfig()
])
