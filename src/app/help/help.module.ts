import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { providePermissionService } from '@onecx/angular-utils'

import { HelpSearchComponent } from './help-search/help-search.component'

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
  providers: [...providePermissionService()]
})
export class HelpModule {}
