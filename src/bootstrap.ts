import { environment } from 'src/environments/environment'
import { OneCXHelpModule } from './app/onecx-help-remote.module'
import { bootstrapModule } from '@onecx/angular-webcomponents'

bootstrapModule(OneCXHelpModule, 'microfrontend', environment.production)
