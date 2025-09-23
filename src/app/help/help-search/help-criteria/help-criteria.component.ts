import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/angular-accelerator'

import { HelpSearchCriteria } from 'src/app/shared/generated'
import { Product } from '../help-search.component'

export interface HelpCriteriaForm {
  itemId: FormControl<string | null>
  productName: FormControl<string | null>
}

@Component({
  selector: 'app-help-criteria',
  templateUrl: './help-criteria.component.html',
  styleUrls: ['./help-criteria.component.scss']
})
export class HelpCriteriaComponent implements OnInit {
  @Input() public actions: Action[] = []
  @Input() public productsChanged = false
  @Input() public usedProducts: Product[] = []
  @Output() public criteriaEmitter = new EventEmitter<HelpSearchCriteria>()
  @Output() public searchEmitter = new EventEmitter<HelpSearchCriteria>()
  @Output() public resetSearchEmitter = new EventEmitter<boolean>()

  public displayDetailDialog = false
  public criteriaForm!: FormGroup<HelpCriteriaForm>
  public productDisplayNames: Product[] = []
  public productsFiltered: Product[] = []

  constructor(private msgService: PortalMessageService) {
    this.criteriaForm = new FormGroup<HelpCriteriaForm>({
      itemId: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  public ngOnInit() {
    //this.loadAllProductsWithHelpItems()
  }

  public filterProducts(event: { query: string }) {
    const query = event.query.toLowerCase()
    this.productsFiltered = this.usedProducts.filter((product) => product.displayName?.toLowerCase().includes(query))
  }

  public onResetCriteria() {
    this.criteriaForm.reset()
  }

  public onSearch() {
    if (this.criteriaForm.valid) {
      const searchCriteria = { ...this.criteriaForm.value }
      searchCriteria.productName = this.usedProducts?.find(
        (product) => product.displayName === this.criteriaForm.value.productName
      )?.name
      this.criteriaEmitter.emit(searchCriteria as HelpSearchCriteria)
    } else {
      this.msgService.error({ summaryKey: 'DIALOG.SEARCH.MSG_SEARCH_VALIDATION' })
    }
  }
}
