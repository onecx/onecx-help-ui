import { importProvidersFrom } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'

import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { AngularAuthModule } from '@onecx/angular-auth'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { environment } from 'src/environments/environment'
import { OneCXShowHelpComponent } from './show-help.component'
import { BASE_URL, provideTranslateServiceForRoot } from '@onecx/angular-remote-components'
import { TranslateLoader } from '@ngx-translate/core'
import { createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { ReplaySubject } from 'rxjs'

bootstrapRemoteComponent(OneCXShowHelpComponent, 'ocx-show-help-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAuthModule, BrowserAnimationsModule),
  { provide: BASE_URL, useValue: new ReplaySubject<string>(1) },
  provideTranslateServiceForRoot({
    isolate: true,
    loader: {
      provide: TranslateLoader,
      useFactory: createRemoteComponentTranslateLoader,
      deps: [HttpClient, BASE_URL]
    }
  })
])
