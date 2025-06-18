import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'

import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { SharedModule } from 'src/app/shared/shared.module'

import { HelpSearchComponent } from './help-search/help-search.component'
import { HelpCriteriaComponent } from './help-search/help-criteria/help-criteria.component'
import { HelpDetailComponent } from './help-detail/help-detail.component'
import { HelpFormComponent } from './help-form/help-form.component'

const routes: Routes = [
  {
    path: '',
    component: HelpSearchComponent,
    pathMatch: 'full'
  }
]
@NgModule({
  declarations: [HelpSearchComponent, HelpDetailComponent, HelpCriteriaComponent, HelpFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(routes)],
    SharedModule
  ],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class HelpModule {
  constructor() {
    console.info('Help Module constructor')
  }
}
