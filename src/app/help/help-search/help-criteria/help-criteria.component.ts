import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'

import { Action, PortalMessageService } from '@onecx/portal-integration-angular'
import { HelpSearchCriteria, HelpsInternalAPIService, Product } from 'src/app/shared/generated'
import { sortByLocale } from 'src/app/shared/utils'

export interface HelpCriteriaForm {
  itemId: FormControl<string | null>
  productName: FormControl<string | null>
}

@Component({
  selector: 'app-help-criteria',
  templateUrl: './help-criteria.component.html'
})
export class HelpCriteriaComponent implements OnInit, OnChanges {
  @Input() public actions: Action[] = []
  @Input() public productsChanged = false
  @Input() public products: Product[] = []
  @Output() public criteriaEmitter = new EventEmitter<HelpSearchCriteria>()

  // private translatedData!: Record<string, string>
  public displayDetailDialog = false
  public helpCriteriaGroup!: FormGroup<HelpCriteriaForm>
  public productDisplayNames: string[] = []
  public productDisplayNamesFiltered: string[] = []

  constructor(
    private helpInternalAPIService: HelpsInternalAPIService,
    private msgService: PortalMessageService
  ) {
    this.helpCriteriaGroup = new FormGroup<HelpCriteriaForm>({
      itemId: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  public ngOnInit() {
    this.loadAllProductsWithHelpItems()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productsChanged'] && this.productsChanged) {
      this.loadAllProductsWithHelpItems()
    }
  }

  public filterProductNames(event: { query: string }) {
    const query = event.query.toLowerCase()
    this.productDisplayNamesFiltered = this.productDisplayNames?.filter((displayName) =>
      displayName.toLowerCase().includes(query)
    )
  }

  public resetCriteria() {
    this.helpCriteriaGroup.reset()
  }

  public submitCriteria() {
    if (this.helpCriteriaGroup.valid) {
      const searchCriteria = { ...this.helpCriteriaGroup.value }
      searchCriteria.productName = this.products.find(
        (product) => product.displayName === this.helpCriteriaGroup.value.productName
      )?.name
      this.criteriaEmitter.emit(searchCriteria as HelpSearchCriteria)
    } else {
      this.msgService.error({ summaryKey: 'HELP_SEARCH.MSG_SEARCH_VALIDATION' })
    }
  }

  public loadAllProductsWithHelpItems() {
    this.helpInternalAPIService.getAllProductsWithHelpItems().subscribe((productNames) => {
      productNames.ProductNames = productNames.ProductNames ?? []
      this.productDisplayNames = productNames.ProductNames.map((name) => {
        const product = this.products.find((product) => product.name === name)
        if (product) {
          return product.displayName
        } else {
          return name
        }
      })
      if (this.productDisplayNames?.length === 0) {
        this.msgService.info({ summaryKey: 'HELP_SEARCH.NO_APPLICATION_AVAILABLE' })
      }
      this.productDisplayNames = this.productDisplayNames?.filter((productName) => productName !== null)
      this.productDisplayNames.sort(sortByLocale)
    })
  }
}
