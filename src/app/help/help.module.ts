import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { providePermissionService, PortalApiConfiguration } from '@onecx/angular-utils'
import { AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'

import { Configuration } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { HelpSearchComponent } from './help-search/help-search.component'

function apiConfigProvider() {
  return new PortalApiConfiguration(Configuration, environment.apiPrefix)
}

const routes: Routes = [
  {
    path: '',
    component: HelpSearchComponent,
    pathMatch: 'full'
  }
]
@NgModule({
  declarations: [],
  imports: [HelpSearchComponent, RouterModule.forChild(routes)],
  providers: [
    ...providePermissionService(),
    { provide: Configuration, useFactory: apiConfigProvider, deps: [ConfigurationService, AppStateService] }
  ]
})
export class HelpModule {}
