import { DoBootstrap, Injector, NgModule, inject, provideAppInitializer } from '@angular/core'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterModule, Routes, Router } from '@angular/router'
import { provideMissingTranslationHandler, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import {
  MultiLanguageMissingTranslationHandler,
  OnecxTranslateLoader,
  PortalApiConfiguration,
  provideTranslationPathFromMeta
} from '@onecx/angular-utils'
import { createAppEntrypoint, initializeRouter, startsWith } from '@onecx/angular-webcomponents'
import { AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'

import { environment } from 'src/environments/environment'
import { AppEntrypointComponent } from './app-entrypoint.component'
import { Configuration } from './shared/generated'
import { provideThemeConfig } from '@onecx/angular-utils/theme/primeng'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

function apiConfigProvider() {
  return new PortalApiConfiguration(Configuration, environment.apiPrefix)
}

const routes: Routes = [
  {
    matcher: startsWith(''),
    loadChildren: () => import('./help/help.module').then((m) => m.HelpModule)
  }
]
@NgModule({
  imports: [
    AppEntrypointComponent,
    AngularAcceleratorModule,
    AngularAuthModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    ConfigurationService,
    { provide: Configuration, useFactory: apiConfigProvider },
    provideAppInitializer(() => {
      const initializerFn = initializeRouter(inject(Router), inject(AppStateService))
      return initializerFn()
    }),
    provideHttpClient(withInterceptorsFromDi()),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateLoader(OnecxTranslateLoader),
      missingTranslationHandler: provideMissingTranslationHandler(MultiLanguageMissingTranslationHandler)
    }),
    provideThemeConfig()
  ]
})
export class OneCXHelpModule implements DoBootstrap {
  private readonly injector = inject(Injector)

  ngDoBootstrap(): void {
    createAppEntrypoint(AppEntrypointComponent, 'ocx-help-component', this.injector)
  }
}
