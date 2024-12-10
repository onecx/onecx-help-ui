import { bootstrapModule } from '@onecx/angular-webcomponents'

import { environment } from 'src/environments/environment'
import { OneCXHelpModule } from './app/onecx-help-remote.module'

bootstrapModule(OneCXHelpModule, 'microfrontend', environment.production)
