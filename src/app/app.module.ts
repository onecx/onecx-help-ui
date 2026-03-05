import { NgModule, inject, provideAppInitializer } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { RouterModule, Routes } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateLoader, TranslateModule, TranslateService, MissingTranslationHandler } from '@ngx-translate/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import { createTranslateLoader, provideTranslationPathFromMeta } from '@onecx/angular-utils'
import { APP_CONFIG, UserService } from '@onecx/angular-integration-interface'
import {
  translateServiceInitializer,
  PortalCoreModule,
  PortalMissingTranslationHandler
} from '@onecx/portal-integration-angular'

import { environment } from 'src/environments/environment'
import { AppComponent } from './app.component'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./help/help.module').then((m) => m.HelpModule)
  }
]
@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    AngularAuthModule,
    PortalCoreModule.forRoot('onecx-help-ui'),
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      enableTracing: true
    }),
    TranslateModule.forRoot({
      isolate: true,
      loader: { provide: TranslateLoader, useFactory: createTranslateLoader, deps: [HttpClient] },
      missingTranslationHandler: { provide: MissingTranslationHandler, useClass: PortalMissingTranslationHandler }
    })
  ],
  providers: [
    { provide: APP_CONFIG, useValue: environment },
    provideAppInitializer(() => {
      const initializerFn = translateServiceInitializer(inject(UserService), inject(TranslateService))
      return initializerFn()
    }),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule {
  constructor() {
    console.info('OneCX Help Module constructor')
  }
}
