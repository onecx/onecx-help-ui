import { enableProdMode, importProvidersFrom } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'
import { bootstrapApplication } from '@angular/platform-browser'
import { ShowHelpRemoteComponent } from './app/remotes/components/show-help/show-help.component'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { AppStateService, PortalCoreModule, createTranslateLoader } from '@onecx/portal-integration-angular'
import { HttpClient } from '@angular/common/http'

if (environment.production) {
  enableProdMode()
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err))

bootstrapApplication(ShowHelpRemoteComponent, {
  providers: [
    importProvidersFrom(
      TranslateModule.forRoot({
        isolate: true,
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient, AppStateService]
        }
      })
    ),
    importProvidersFrom(PortalCoreModule.forMicroFrontend())
  ]
})
