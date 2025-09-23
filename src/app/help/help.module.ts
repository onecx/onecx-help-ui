import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'

import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { addInitializeModuleGuard, InitializeModuleGuard } from '@onecx/angular-integration-interface'
import { SharedModule } from 'src/app/shared/shared.module'

import { HelpSearchComponent } from './help-search/help-search.component'
import { HelpCriteriaComponent } from './help-search/help-criteria/help-criteria.component'
import { HelpDetailComponent } from './help-detail/help-detail.component'

const routes: Routes = [
  {
    path: '',
    component: HelpSearchComponent,
    pathMatch: 'full'
  }
]
@NgModule({
  declarations: [HelpSearchComponent, HelpDetailComponent, HelpCriteriaComponent],
  imports: [
    CommonModule,
    FormsModule,
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(addInitializeModuleGuard(routes))],
    SharedModule
  ],
  providers: [InitializeModuleGuard]
})
export class HelpModule {
  constructor() {
    console.info('Help Module constructor')
  }
}
