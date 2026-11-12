import { NgModule } from '@angular/core'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations'
import { RouterModule, Routes } from '@angular/router'
import { provideMissingTranslationHandler, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import { APP_CONFIG } from '@onecx/angular-integration-interface'
import { StandaloneShellModule, provideStandaloneProviders } from '@onecx/angular-standalone-shell'
import {
  MultiLanguageMissingTranslationHandler,
  OnecxTranslateLoader,
  provideTranslationPathFromMeta
} from '@onecx/angular-utils'
import { provideThemeConfig } from '@onecx/angular-utils/theme/primeng'

import { environment } from 'src/environments/environment'
import { AppComponent } from './app.component'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./help/help.module').then((m) => m.HelpModule)
  }
]
@NgModule({
  imports: [
    AppComponent,
    AngularAcceleratorModule,
    AngularAuthModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      enableTracing: true
    }),
    StandaloneShellModule
  ],
  providers: [
    { provide: APP_CONFIG, useValue: environment },
    provideHttpClient(withInterceptorsFromDi()),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateLoader(OnecxTranslateLoader),
      missingTranslationHandler: provideMissingTranslationHandler(MultiLanguageMissingTranslationHandler)
    }),
    provideStandaloneProviders(),
    provideThemeConfig(),
    provideAnimations()
  ]
})
export class AppModule {}
