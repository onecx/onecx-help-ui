import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { AutoCompleteModule } from 'primeng/autocomplete'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { Action, AngularAcceleratorModule } from '@onecx/angular-accelerator'

import { HelpSearchCriteria } from 'src/app/shared/generated'
import { Product } from '../help-search.component'

export interface HelpCriteriaForm {
  itemId: FormControl<string | null>
  product: FormControl<Product | null>
}

@Component({
  selector: 'app-help-criteria',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    AutoCompleteModule,
    FloatLabelModule,
    InputTextModule,
    TooltipModule,
    AngularAcceleratorModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-criteria.component.html',
  styleUrl: './help-criteria.component.scss'
})
export class HelpCriteriaComponent {
  @Input() public actions: Action[] = []
  @Input() public usedProducts: Product[] = []
  @Output() public searchEmitter = new EventEmitter<HelpSearchCriteria>()
  @Output() public resetSearchEmitter = new EventEmitter<boolean>()

  public criteriaForm: FormGroup<HelpCriteriaForm>
  public productsFiltered: Product[] = []

  constructor() {
    this.criteriaForm = new FormGroup<HelpCriteriaForm>({
      itemId: new FormControl<string | null>(null),
      product: new FormControl<Product | null>(null)
    })
  }

  public onSearch() {
    const criteria = { itemId: this.criteriaForm.get('itemId')?.value, productName: undefined } as HelpSearchCriteria
    if (this.criteriaForm.get('product')?.value) criteria.productName = this.criteriaForm.get('product')?.value?.name
    this.searchEmitter.emit(criteria)
  }

  public onResetCriteria() {
    this.criteriaForm.reset()
  }

  public onFilterProducts(event: { query: string }) {
    const query = event.query.toLowerCase()
    this.productsFiltered = this.usedProducts.filter((product) => product.displayName?.toLowerCase().includes(query))
  }
}
