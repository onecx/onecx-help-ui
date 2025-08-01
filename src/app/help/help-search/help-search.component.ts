import { Component, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { TranslateService } from '@ngx-translate/core'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { Table } from 'primeng/table'
import { FileSelectEvent } from 'primeng/fileupload'
import FileSaver from 'file-saver'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/angular-accelerator'
import { Column } from '@onecx/portal-integration-angular'

import {
  Help,
  HelpsInternalAPIService,
  HelpPageResult,
  HelpSearchCriteria,
  Product,
  ProductsPageResult,
  SearchHelpsRequestParams,
  SearchProductsByCriteriaRequestParams
} from 'src/app/shared/generated'

type ExtendedColumn = Column & { css?: string; limit?: boolean }
type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT'
export type HelpForDisplay = Help & { productDisplayName?: string; product?: { name?: string; displayName?: string } }

@Component({
  selector: 'app-help-search',
  templateUrl: './help-search.component.html',
  styleUrls: ['./help-search.component.scss']
})
export class HelpSearchComponent implements OnInit {
  @ViewChild('table', { static: false }) table!: Table

  public exceptionKey: string | undefined
  public changeMode: ChangeMode = 'CREATE'
  public actions$: Observable<Action[]> | undefined
  public helpItem: Help | undefined
  public resultsForDisplay: HelpForDisplay[] = []
  public assignedProductNames: string[] = []
  public products: Product[] = []
  public productsLoaded: boolean = false
  public criteria: SearchHelpsRequestParams = { helpSearchCriteria: {} }
  public helpSearchCriteria!: HelpSearchCriteria
  public searchInProgress = false
  public loadingResults = false
  public displayDeleteDialog = false
  public displayDetailDialog = false
  public displayImportDialog = false
  public displayExportDialog = false
  public productsChanged = false
  public rowsPerPage = 10
  public rowsPerPageOptions = [10, 20, 50]

  importHelpItem: Help | null = null
  public importError = false
  public validationErrorCause: string
  public selectedProductNames: string[] = []

  public filteredColumns: Column[] = []
  public columns: ExtendedColumn[] = [
    {
      field: 'productDisplayName',
      header: 'APPLICATION_NAME',
      active: true,
      translationPrefix: 'HELP_ITEM',
      css: 'px-2 py-1 sm:py-2'
    },
    {
      field: 'itemId',
      header: 'HELP_ITEM_ID',
      active: true,
      translationPrefix: 'HELP_ITEM',
      css: 'px-2 py-1 sm:py-2'
    },
    {
      field: 'url',
      header: 'URL',
      active: true,
      translationPrefix: 'HELP_ITEM',
      css: 'px-2 py-1 sm:py-2'
    }
  ]

  constructor(
    private readonly helpInternalAPIService: HelpsInternalAPIService,
    private readonly translate: TranslateService,
    private readonly msgService: PortalMessageService
  ) {
    this.validationErrorCause = ''
  }

  ngOnInit(): void {
    this.filteredColumns = this.columns.filter((a) => {
      return a.active === true
    })
    this.prepareDialogTranslations()
    this.loadData()
  }

  private loadData() {
    const criteria: SearchProductsByCriteriaRequestParams = {
      productsSearchCriteria: { pageNumber: 0, pageSize: 1000 }
    }
    this.helpInternalAPIService
      .searchProductsByCriteria(criteria)
      .subscribe((productsPageResult: ProductsPageResult) => {
        this.products = productsPageResult.stream ?? []
        this.products.sort(this.sortProductsByName)
        this.productsLoaded = true
        this.search(this.criteria.helpSearchCriteria)
      })
  }

  /****************************************************************************
   *  SEARCHING
   *    - initial, without any criteria => to be checked again with stakeholder
   *    - user initiated search with criteria
   *    - re-searching (with current criteria) after changes in detail dialog
   */
  public search(criteria: HelpSearchCriteria, reuseCriteria: boolean = false): void {
    const criteriaSearchParams: SearchHelpsRequestParams = {
      helpSearchCriteria: criteria
    }
    if (!reuseCriteria) {
      if (criteriaSearchParams.helpSearchCriteria?.productName === '')
        criteriaSearchParams.helpSearchCriteria.productName = undefined
      if (criteriaSearchParams.helpSearchCriteria?.itemId === '')
        criteriaSearchParams.helpSearchCriteria.itemId = undefined
      this.criteria = criteriaSearchParams
    }
    this.searchInProgress = true
    this.helpInternalAPIService
      .searchHelps(this.criteria)
      .pipe(
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.HELP_ITEM'
          console.error('searchHelps', err)
          this.msgService.error({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.SEARCH_FAILED' })
          return of({ stream: [] } as HelpPageResult)
        }),
        finalize(() => (this.searchInProgress = false))
      )
      .subscribe({
        next: (data) => {
          if (data.stream !== undefined) {
            if (data.stream?.length === 0) {
              this.msgService.info({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
            } else {
              data.stream?.sort(this.sortHelpItemByDefault)
              this.resultsForDisplay = data.stream.map((result) => {
                const resultForDisplay = { ...result } as HelpForDisplay
                resultForDisplay['productName'] = result.productName
                const product = this.products.find((product) => product.name === result.productName)
                resultForDisplay['productDisplayName'] = product?.displayName
                resultForDisplay['product'] = {
                  name: result.productName,
                  displayName: this.products.find((product) => product.name === result.productName)?.displayName
                }
                return resultForDisplay
              })
              this.prepareDialogTranslations()
            }
          }
          this.productsChanged = false
        }
      })
  }
  public onSearch() {
    this.changeMode = 'CREATE'
    this.productsChanged = true
    this.search(this.criteria.helpSearchCriteria, true)
  }

  // default sorting: 1. productName, 2.itemId
  private sortHelpItemByDefault(a: Help, b: Help): number {
    return (
      (a.productName ? a.productName.toUpperCase() : '').localeCompare(
        b.productName ? b.productName.toUpperCase() : ''
      ) || (a.itemId ? a.itemId.toUpperCase() : '').localeCompare(b.itemId ? b.itemId.toUpperCase() : '')
    )
  }
  private sortProductsByName(a: Product, b: Product): number {
    return a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase())
  }

  public onColumnsChange(activeIds: string[]) {
    this.filteredColumns = activeIds.map((id) => this.columns.find((col) => col.field === id)) as Column[]
  }
  public onFilterChange(event: string): void {
    this.table.filterGlobal(event, 'contains')
  }

  /****************************************************************************
   *  CHANGES
   */
  public onCreate() {
    this.changeMode = 'CREATE'
    this.productsChanged = false
    this.helpItem = undefined
    this.displayDetailDialog = true
  }
  public onDetail(ev: MouseEvent, item: Help, mode: ChangeMode): void {
    ev.stopPropagation()
    this.changeMode = mode
    this.productsChanged = false
    this.helpItem = item
    this.displayDetailDialog = true
  }
  public onCopy(ev: MouseEvent, item: Help) {
    ev.stopPropagation()
    this.changeMode = 'CREATE'
    this.productsChanged = false
    this.helpItem = item
    this.displayDetailDialog = true
  }
  public onDelete(ev: MouseEvent, item: Help): void {
    ev.stopPropagation()
    this.helpItem = item
    this.productsChanged = false
    this.displayDeleteDialog = true
  }
  public onDeleteConfirmation(): void {
    if (this.helpItem?.id && typeof this.helpItem.productName === 'string') {
      this.helpInternalAPIService.deleteHelp({ id: this.helpItem?.id }).subscribe({
        next: () => {
          this.displayDeleteDialog = false
          this.resultsForDisplay = this.resultsForDisplay?.filter((a) => a.id !== this.helpItem?.id)
          this.helpItem = undefined
          this.productsChanged = true
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_OK' })
        },
        error: (err) => {
          this.msgService.error({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_NOK' })
          console.error('deleteHelp', err)
        }
      })
    }
  }

  /****************************************************************************
   *  IMPORT
   */
  public onImport(): void {
    this.displayImportDialog = true
  }
  public onSelect(event: FileSelectEvent): void {
    event.files[0].text().then((text) => {
      this.importError = false
      this.validationErrorCause = ''

      this.translate.get(['IMPORT.VALIDATION_RESULT']).subscribe((data) => {
        try {
          const importHelp = JSON.parse(text)
          this.importHelpItem = importHelp
        } catch (err) {
          console.error('Import Error', err)
          this.importError = true
        }
      })
    })
  }
  public onImportConfirmation(): void {
    if (this.importHelpItem) {
      this.helpInternalAPIService.importHelps({ body: this.importHelpItem }).subscribe({
        next: () => {
          this.displayImportDialog = false
          this.productsChanged = true
          this.msgService.success({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.HELP_ITEM.IMPORT_OK' })
        },
        error: (err) => {
          this.msgService.error({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.HELP_ITEM.IMPORT_NOK' })
          console.error('importHelps', err)
        }
      })
      this.loadData()
    }
  }
  public isFileValid(): boolean {
    return !this.importError
  }
  public onCloseImportDialog(): void {
    this.displayImportDialog = false
  }
  public onClear(): void {
    this.importError = false
    this.validationErrorCause = ''
  }

  /****************************************************************************
   *  EXPORT
   */
  public onExport(): void {
    this.assignedProductNames = Array.from(new Set(this.resultsForDisplay.map((item) => item.productDisplayName!)))
    this.displayExportDialog = true
  }
  public onExportConfirmation(): void {
    if (this.selectedProductNames.length > 0) {
      const names = this.selectedProductNames.map((item) => this.getProductNameFromDisplayName(item))
      this.helpInternalAPIService.exportHelps({ exportHelpsRequest: { productNames: names } }).subscribe({
        next: (item) => {
          const helpsJson = JSON.stringify(item, null, 2)
          FileSaver.saveAs(
            new Blob([helpsJson], { type: 'text/json' }),
            'onecx-help-items_' + this.getCurrentDateTime() + '.json'
          )
          this.msgService.success({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.HELP_ITEM.EXPORT_OK' })
          this.displayExportDialog = false
          this.selectedProductNames = []
        },
        error: (err) => {
          this.msgService.error({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.HELP_ITEM.EXPORT_NOK' })
          console.error('exportHelps', err)
        }
      })
    }
  }
  public onCloseExportDialog(): void {
    this.displayExportDialog = false
    this.selectedProductNames = []
  }

  private prepareDialogTranslations() {
    this.actions$ = this.translate
      .get([
        'ACTIONS.CREATE.LABEL',
        'ACTIONS.CREATE.HELP_ITEM.TOOLTIP',
        'ACTIONS.IMPORT.LABEL',
        'ACTIONS.IMPORT.HELP_ITEM.TOOLTIP',
        'ACTIONS.EXPORT.LABEL',
        'ACTIONS.EXPORT.HELP_ITEM.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.CREATE.LABEL'],
              title: data['ACTIONS.CREATE.HELP_ITEM.TOOLTIP'],
              actionCallback: () => this.onCreate(),
              icon: 'pi pi-plus',
              show: 'always',
              permission: 'HELP#EDIT'
            },
            {
              label: data['ACTIONS.EXPORT.LABEL'],
              title: data['ACTIONS.EXPORT.HELP_ITEM.TOOLTIP'],
              actionCallback: () => this.onExport(),
              icon: 'pi pi-download',
              show: 'always',
              permission: 'HELP#EDIT',
              conditional: true,
              showCondition: this.resultsForDisplay.length > 0
            },
            {
              label: data['ACTIONS.IMPORT.LABEL'],
              title: data['ACTIONS.IMPORT.HELP_ITEM.TOOLTIP'],
              actionCallback: () => this.onImport(),
              icon: 'pi pi-upload',
              show: 'always',
              permission: 'HELP#EDIT'
            }
          ]
        })
      )
  }

  private getCurrentDateTime(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}_${hours}${minutes}${seconds}`
  }

  private getProductNameFromDisplayName(displayName: string): string {
    const product = this.products.find((item) => item.displayName === displayName)
    if (product) return product.name
    else return displayName
  }

  /* Prepare the final URL as follow (#) = optional:
      1. baseUrl
      2. baseUrl(#)context
      3. baseUrl/resourceUrl
      4. baseUrl/resourceUrl(#)context
  */
  public prepareUrl(help: Help): string {
    let ctx = ''
    if (help.context) {
      ctx = (help.context.startsWith('#') ? '' : '#') + help.context
    }
    if (help.baseUrl && help.resourceUrl) {
      return Location.joinWithSlash(help.baseUrl, help.resourceUrl) + ctx
    } else return (help.baseUrl ?? '') + ctx
  }
}
