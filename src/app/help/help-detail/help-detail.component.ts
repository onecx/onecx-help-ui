import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { finalize } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService, Help, CreateHelp } from 'src/app/shared/generated'
import { ChangeMode, Product } from '../help-search/help-search.component'

export interface HelpDetailForm {
  product: FormControl<Product | null>
  productName: FormControl<string | null>
  itemId: FormControl<string | null>
  baseUrl: FormControl<string | null>
  resourceUrl: FormControl<string | null>
  context: FormControl<string | null>
  operator: FormControl<boolean | null>
}

@Component({
  selector: 'app-help-detail',
  templateUrl: './help-detail.component.html',
  styleUrls: ['./help-detail.component.scss']
})
export class HelpDetailComponent implements OnChanges {
  @Input() public displayDialog = false
  @Input() public helpItem: Help | undefined
  @Input() public changeMode: ChangeMode = 'VIEW'
  @Input() public allProducts: Product[] = []
  @Output() public hideDialogAndChanged = new EventEmitter<boolean>()

  @Output() public displayDetailDialogChange = new EventEmitter<boolean>()
  @Output() public searchEmitter = new EventEmitter()

  public loading = false
  public exceptionKey: string | undefined = undefined
  public helpForm: FormGroup
  public productsFiltered: Product[] = []

  constructor(
    private readonly helpApi: HelpsInternalAPIService,
    private readonly msgService: PortalMessageService
  ) {
    this.helpForm = new FormGroup<HelpDetailForm>({
      product: new FormControl(null),
      productName: new FormControl(null, [Validators.required]),
      itemId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      baseUrl: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      resourceUrl: new FormControl(null, [Validators.maxLength(255)]),
      context: new FormControl(null, [Validators.maxLength(255)]),
      operator: new FormControl(false)
    })
  }

  ngOnChanges() {
    if (!this.displayDialog) return
    this.exceptionKey = undefined
    // matching mode and given data?
    if ('CREATE' === this.changeMode && this.helpItem) return
    if (['EDIT', 'VIEW'].includes(this.changeMode)) {
      if (this.helpItem) this.getData(this.helpItem?.id)
    } else this.prepareForm(this.helpItem)
  }

  private prepareForm(data?: Help): void {
    if (data) {
      this.helpForm.patchValue(data)
      this.helpForm.get('product')?.setValue(this.allProducts.find((p) => p.name === data.productName))
    }
    switch (this.changeMode) {
      case 'COPY':
        this.helpForm.enable()
        this.helpForm.get('operator')?.setValue(null)
        break
      case 'CREATE':
        this.helpForm.reset()
        this.helpForm.enable()
        break
      case 'EDIT':
        this.helpForm.enable()
        this.helpForm.get('operator')?.disable()
        break
      case 'VIEW':
        this.helpForm.disable()
        break
    }
  }

  /****************************************************************************
   *  UI Events
   */
  public onDialogHide(changed?: boolean) {
    this.hideDialogAndChanged.emit(changed ?? false)
    this.helpForm.reset()
  }

  /****************************************************************************
   * READING
   */
  private getData(id?: string): void {
    if (!id) return
    this.loading = true
    this.exceptionKey = undefined
    this.helpApi
      .getHelpById({ id: id })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => this.prepareForm(data),
        error: (err) => {
          this.helpForm.reset()
          this.helpForm.disable()
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.HELP_ITEM'
          this.msgService.error({ summaryKey: this.exceptionKey })
          console.error('getHelpById', err)
        }
      })
  }

  /****************************************************************************
   *  SAVING
   */
  public onSave() {
    if (!this.helpForm.valid) {
      this.msgService.error({ summaryKey: 'VALIDATION.ERRORS.HELP_ITEM.FORM_INVALID' })
      return
    }
    const item = { ...this.helpForm.value, product: undefined } as Help
    if (['COPY', 'CREATE'].includes(this.changeMode)) this.createItem(item)
    else this.updateItem(item)
  }

  private createItem(item: CreateHelp) {
    this.helpApi.createNewHelp({ createHelp: item }).subscribe({
      next: () => {
        this.searchEmitter.emit()
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
        this.onDialogHide(true)
      },
      error: (err: any) => {
        console.error('createNewHelp', err)
        err.error?.errorCode && err.error.errorCode === 'PERSIST_ENTITY_FAILED'
          ? this.msgService.error({
              summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
              detailKey: 'VALIDATION.ERRORS.HELP_ITEM.UNIQUE_CONSTRAINT'
            })
          : this.msgService.error({ summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' })
      }
    })
  }

  private updateItem(item: Help): void {
    if (this.helpItem?.id)
      this.helpApi
        .updateHelp({
          id: this.helpItem.id, // the id is not part of the form!
          updateHelp: { ...item, modificationCount: item?.modificationCount ?? 0 }
        })
        .subscribe({
          next: () => {
            this.searchEmitter.emit()
            this.msgService.success({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
            this.onDialogHide(true)
          },
          error: (err) => {
            this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
            console.error('updateHelp', err)
          }
        })
  }

  // update product name in form according to the selected product
  public onChangeProduct(ev: { value: Product }) {
    if (ev.value instanceof Object) this.helpForm.get('productName')?.setValue(ev.value.name)
  }

  public onFilterProducts(event: { query: string }) {
    const query = event.query.toLowerCase()
    this.productsFiltered = this.allProducts?.filter((product) => product.displayName?.toLowerCase().includes(query))
    this.productsFiltered.sort(this.sortProductsByName)
  }

  public sortProductsByName(a: Product, b: Product): number {
    return a.displayName!.toUpperCase().localeCompare(b.displayName!.toUpperCase())
  }
}
