import { importProvidersFrom } from '@angular/core'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideMissingTranslationHandler, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core'
import { ReplaySubject } from 'rxjs'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import {
  MultiLanguageMissingTranslationHandler,
  REMOTE_COMPONENT_CONFIG,
  OnecxTranslateLoader,
  RemoteComponentConfig,
  provideTranslationPathFromMeta
} from '@onecx/angular-utils'

import { environment } from 'src/environments/environment'
import { OneCXHelpItemEditorComponent } from './help-item-editor.component'
import { provideThemeConfig } from '@onecx/angular-utils/theme/primeng'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

bootstrapRemoteComponent(OneCXHelpItemEditorComponent, 'ocx-help-item-editor-component', environment.production, [
  { provide: REMOTE_COMPONENT_CONFIG, useValue: new ReplaySubject<RemoteComponentConfig>(1) },
  provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
  provideTranslateService({
    fallbackLang: 'en',
    loader: provideTranslateLoader(OnecxTranslateLoader),
    missingTranslationHandler: provideMissingTranslationHandler(MultiLanguageMissingTranslationHandler)
  }),
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAcceleratorModule, AngularAuthModule, BrowserAnimationsModule),
  provideThemeConfig()
]).catch((err) => console.error(err))
