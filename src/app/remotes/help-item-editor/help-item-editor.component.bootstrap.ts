import { importProvidersFrom } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'

import { environment } from 'src/environments/environment'
import { OneCXHelpItemEditorComponent } from './help-item-editor.component'
import { createRemoteComponentTranslateLoader, providePortalDialogService } from '@onecx/portal-integration-angular'
import { BASE_URL, provideTranslateServiceForRoot } from '@onecx/angular-remote-components'
import { ReplaySubject } from 'rxjs'
import { TranslateLoader } from '@ngx-translate/core'

bootstrapRemoteComponent(OneCXHelpItemEditorComponent, 'ocx-help-item-editor-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAuthModule, BrowserAnimationsModule),
  providePortalDialogService(),
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
