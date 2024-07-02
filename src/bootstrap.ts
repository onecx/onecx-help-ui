import { bootstrap } from '@angular-architects/module-federation-tools'
import { environment } from 'src/environments/environment'
import { OneCXHelpModule } from './app/onecx-help-remote.module'

bootstrap(OneCXHelpModule, {
  production: environment.production,
  appType: 'microfrontend'
})
