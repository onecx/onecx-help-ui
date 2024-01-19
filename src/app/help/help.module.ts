import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core'

import { MFE_INFO, PortalCoreModule, MyMissingTranslationHandler } from '@onecx/portal-integration-angular'
import { CanActivateGuard } from '../shared/can-active-guard.service'
import { HttpLoaderFactory, SharedModule } from '../shared/shared.module'

import { HelpSearchComponent } from './help-search/help-search.component'
import { HelpCriteriaComponent } from './help-search/help-criteria/help-criteria.component'
import { HelpDetailComponent } from './help-detail/help-detail.component'
import { HelpFormComponent } from './help-form/help-form.component'

const routes: Routes = [
  {
    path: '',
    component: HelpSearchComponent,
    canActivate: [CanActivateGuard],
    pathMatch: 'full'
  }
]
@NgModule({
  declarations: [HelpSearchComponent, HelpDetailComponent, HelpFormComponent, HelpCriteriaComponent],
  imports: [
    FormsModule,
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(routes)],
    SharedModule,
    TranslateModule.forChild({
      isolate: true,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MyMissingTranslationHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, MFE_INFO]
      }
    })
  ],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class HelpModule {
  constructor() {
    console.info('Help Module constructor')
  }
}
