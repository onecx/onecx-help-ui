import { Inject, NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { MFE_INFO, MfeInfo, PortalCoreModule } from '@onecx/portal-integration-angular'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./help/help.module').then((m) => m.HelpModule)
  }
]
@NgModule({
  imports: [PortalCoreModule.forMicroFrontend(), RouterModule.forChild(routes)],
  exports: [],
  providers: [],
  schemas: []
})
export class HelpMgmtModule {
  constructor(@Inject(MFE_INFO) mfeInfo?: MfeInfo) {
    console.info('Help Mgmt Module constructor', mfeInfo)
  }
}
