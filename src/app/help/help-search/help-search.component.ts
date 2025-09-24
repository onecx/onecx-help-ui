import { Component, EventEmitter, OnInit } from '@angular/core'
import { Location } from '@angular/common'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, catchError, combineLatest, finalize, map, Observable, of, switchMap, tap } from 'rxjs'
import { Table } from 'primeng/table'
import { FileSelectEvent } from 'primeng/fileupload'
import FileSaver from 'file-saver'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/angular-accelerator'
import { Column, DataViewControlTranslations } from '@onecx/portal-integration-angular'
import { SlotService } from '@onecx/angular-remote-components'

import { Help, HelpsInternalAPIService, HelpSearchCriteria, HelpProductNames } from 'src/app/shared/generated'

type ExtendedColumn = Column & { css?: string; limit?: boolean }
export type ChangeMode = 'VIEW' | 'CREATE' | 'COPY' | 'EDIT'
export type AllMetaData = {
  allProducts: Product[]
  usedProducts: Product[]
}
// DATA structures of product store response
export type Product = {
  id?: string
  name: string
  version?: string
  description?: string
  imageUrl?: string
  displayName?: string
  classifications?: Array<string>
  undeployed?: boolean
  provider?: string
  applications?: Array<any>
}

@Component({
  selector: 'app-help-search',
  templateUrl: './help-search.component.html',
  styleUrls: ['./help-search.component.scss']
})
export class HelpSearchComponent implements OnInit {
  // dialog
  public loadingMetaData = false
  public searching = false
  public exceptionKey: string | undefined
  public changeMode: ChangeMode = 'VIEW'
  public dateFormat: string
  public actions$: Observable<Action[]> | undefined
  public criteria: HelpSearchCriteria = {}
  public dataViewControlsTranslations: DataViewControlTranslations = {}
  public displayDeleteDialog = false
  public displayDetailDialog = false
  public displayImportDialog = false
  public displayExportDialog = false

  // data
  public data$: Observable<Help[]> | undefined
  public dataAvailable = false
  public metaData$!: Observable<AllMetaData>
  public usedLists$!: Observable<Product[]> // getting data from bff endpoint
  public usedListsTrigger$ = new BehaviorSubject<void>(undefined) // trigger for refresh data
  public item4Detail: Help | undefined // used on detail
  public item4Delete: Help | undefined // used on deletion
  public exportProductList: string[] = []
  public importError = false
  private importObject: object | undefined = undefined

  public products: Product[] = []

  public filteredColumns: Column[] = []
  public columns: ExtendedColumn[] = [
    {
      field: 'productName',
      header: 'PRODUCT_NAME',
      active: true,
      translationPrefix: 'HELP_ITEM',
      css: 'px-2 py-1 sm:py-2'
    },
    {
      field: 'itemId',
      header: 'ID',
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
  // slot configuration: get product infos via remote component
  public pdSlotName = 'onecx-product-data'
  public pdIsComponentDefined$: Observable<boolean> | undefined // check
  public productData$ = new BehaviorSubject<Product[] | undefined>(undefined) // product infos
  public pdSlotEmitter = new EventEmitter<Product[]>()

  constructor(
    private readonly user: UserService,
    private readonly slotService: SlotService,
    private readonly translate: TranslateService,
    private readonly msgService: PortalMessageService,
    private readonly helpApi: HelpsInternalAPIService
  ) {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm' : 'M/d/yy, h:mm a'
    this.pdIsComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.pdSlotName)
    this.filteredColumns = this.columns.filter((a) => a.active === true)
  }

  public ngOnInit(): void {
    this.prepareActionButtons()
    this.prepareDialogTranslations()
    this.pdSlotEmitter.subscribe(this.productData$)
    this.loadMetaData()
    this.onSearch({})
  }

  /****************************************************************************
   * DIALOG
   */
  private prepareDialogTranslations(): void {
    this.translate
      .get(['DIALOG.DATAVIEW.FILTER', 'DIALOG.DATAVIEW.FILTER_BY', 'HELP_ITEM.ID', 'HELP_ITEM.PRODUCT_NAME'])
      .pipe(
        map((data) => {
          this.dataViewControlsTranslations = {
            filterInputPlaceholder: data['DIALOG.DATAVIEW.FILTER'],
            filterInputTooltip:
              data['DIALOG.DATAVIEW.FILTER_BY'] + data['HELP_ITEM.ID'] + ', ' + data['HELP_ITEM.PRODUCT_NAME']
          }
        })
      )
      .subscribe()
  }
  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.CREATE.LABEL',
        'ACTIONS.CREATE.TOOLTIP',
        'ACTIONS.IMPORT.LABEL',
        'ACTIONS.IMPORT.TOOLTIP',
        'ACTIONS.EXPORT.LABEL',
        'ACTIONS.EXPORT.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.CREATE.LABEL'],
              title: data['ACTIONS.CREATE.TOOLTIP'],
              actionCallback: () => this.onDetail(undefined, undefined, 'CREATE'),
              icon: 'pi pi-plus',
              show: 'always',
              permission: 'HELP#EDIT'
            },
            {
              label: data['ACTIONS.EXPORT.LABEL'],
              title: data['ACTIONS.EXPORT.TOOLTIP'],
              actionCallback: () => this.onExport(),
              icon: 'pi pi-download',
              show: 'always',
              permission: 'HELP#EDIT',
              conditional: true,
              showCondition: this.dataAvailable
            },
            {
              label: data['ACTIONS.IMPORT.LABEL'],
              title: data['ACTIONS.IMPORT.TOOLTIP'],
              actionCallback: () => this.onImport(),
              icon: 'pi pi-upload',
              show: 'always',
              permission: 'HELP#EDIT'
            }
          ]
        })
      )
  }

  /****************************************************************************
   *  UI Events
   */
  public onCriteriaReset(): void {
    this.criteria = {}
  }
  public onColumnsChange(activeIds: string[]) {
    this.filteredColumns = activeIds.map((id) => this.columns.find((col) => col.field === id)) as Column[]
  }
  public onFilterChange(event: string, dataTable: Table): void {
    dataTable?.filterGlobal(event, 'contains')
  }

  public getDisplayName(name: string | undefined, list: Product[] | undefined, defValue?: string): string | undefined {
    if (name) return list?.find((item) => item.name === name)?.displayName ?? defValue
    return undefined
  }

  /****************************************************************************
   *  DETAIL => CREATE, COPY, EDIT, VIEW
   */
  public onDetail(ev: Event | undefined, item: Help | undefined, mode: ChangeMode): void {
    ev?.stopPropagation()
    this.changeMode = mode
    this.item4Detail = item // do not manipulate the item here
    this.displayDetailDialog = true
  }
  public onCloseDetail(refresh: boolean): void {
    this.displayDetailDialog = false
    this.item4Detail = undefined
    if (refresh) {
      this.usedListsTrigger$.next() // trigger getting data
      this.onSearch({}, true)
    }
  }

  /****************************************************************************
   *  DELETE => Ask for confirmation
   */
  public onDelete(ev: Event, item: Help): void {
    ev.stopPropagation()
    this.item4Delete = item
    this.displayDeleteDialog = true
  }
  public onDeleteConfirmation(data: Help[]): void {
    if (this.item4Delete?.id && typeof this.item4Delete.productName === 'string') {
      this.helpApi.deleteHelp({ id: this.item4Delete.id }).subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.MESSAGE.OK' })
          data = data?.filter((d) => d.id !== this.item4Delete?.id)
          this.data$ = of(data)
          // check remaining data: if product still exists - if not then trigger reload
          if (!data?.find((d) => d.productName === this.item4Delete?.productName)) {
            this.usedListsTrigger$.next() // trigger getting data
          }
          this.displayDeleteDialog = false
          this.item4Delete = undefined
        },
        error: (err) => {
          this.msgService.error({ summaryKey: 'ACTIONS.DELETE.MESSAGE.NOK' })
          console.error('deleteHelp', err)
        }
      })
    }
  }

  /****************************************************************************
   *  LOAD meta data
   *    declare the requests to getting meta data...
   *    ...to fill drop down lists => products, workspaces
   */
  private loadMetaData(): void {
    // declare search for used products/workspaces (used === assigned to announcement)
    // hereby SelectItem[] are prepared without displayName (updated later by combineLatest)
    this.usedLists$ = this.usedListsTrigger$.pipe(
      switchMap(() =>
        this.helpApi.getAllProductsWithHelpItems().pipe(
          map((data: HelpProductNames) => {
            let ul: Product[] = []
            if (data.ProductNames) ul = data.ProductNames.map((s) => ({ displayName: s, name: s }) as Product)
            return ul
          }),
          catchError((err) => {
            this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.ASSIGNMENTS'
            console.error('getAllProductsWithHelpItems', err)
            return of([])
          })
        )
      )
    )

    // combine master data (slots) with used data (enrich them with correct display names)
    this.loadingMetaData = true
    this.metaData$ = combineLatest([this.productData$, this.usedLists$]).pipe(
      map(([products, usedLists]: [Product[] | undefined, Product[]]) => {
        // enrich the used lists with display names taken from master data (allLists)
        const allProducts = products
        if (products) {
          usedLists.forEach((p) => (p.displayName = this.getDisplayName(p.name, allProducts, p.name)))
        }
        this.loadingMetaData = false
        return {
          allProducts: allProducts ?? usedLists,
          usedProducts: usedLists
        }
      })
    )
  }

  /****************************************************************************
   *  SEARCHING
   *    - initial, without any criteria => to be checked again with stakeholder
   *    - user initiated search with criteria
   *    - re-searching (with current criteria) after changes in detail dialog
   */
  public onSearch(criteria: HelpSearchCriteria, reuseCriteria = false): void {
    if (!reuseCriteria) this.criteria = criteria
    this.searching = true
    this.exceptionKey = undefined
    this.data$ = this.helpApi.searchHelps({ helpSearchCriteria: this.criteria }).pipe(
      tap((data) => {
        this.dataAvailable = (data.stream && data.stream.length > 0) ?? false
        if (!this.dataAvailable) this.msgService.info({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
        this.prepareActionButtons()
      }),
      map((data) => data.stream?.sort(this.sortHelpItemByDefault) ?? []),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.HELP_ITEM'
        this.msgService.error({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NOK' })
        console.error('searchHelps', err)
        return of([])
      }),
      finalize(() => (this.searching = false))
    )
  }

  // default sorting: 1. productName, 2.itemId
  private sortHelpItemByDefault(a: Help, b: Help): number {
    return (
      a.productName!.toUpperCase().localeCompare(b.productName!.toUpperCase()) ||
      a.itemId.toUpperCase().localeCompare(b.itemId.toUpperCase())
    )
  }
  /*
  private sortProductsByName(a: Product, b: Product): number {
    return a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase())
  }*/

  /****************************************************************************
   *  IMPORT
   */
  public onImport(): void {
    this.displayImportDialog = true
  }
  public onImportSelectFile(event: FileSelectEvent): void {
    event.files[0].text().then((text) => {
      this.importError = false
      this.importObject = undefined
      try {
        this.importObject = JSON.parse(text)
        this.msgService.info({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.OK' })
      } catch (err: any) {
        this.msgService.error({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.NOK' })
        console.error('Import parse error', err)
        this.importError = true
      }
    })
  }
  public onImportConfirmation(): void {
    if (this.importObject) {
      this.helpApi.importHelps({ body: this.importObject }).subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.OK' })
          this.usedListsTrigger$.next() // trigger getting data
          this.onImportCloseDialog()
        },
        error: (err) => {
          this.msgService.error({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.NOK' })
          console.error('importHelps', err)
        }
      })
      this.onSearch({}, true)
    }
  }
  public onImportCloseDialog(): void {
    this.displayImportDialog = false
    this.onImportClear()
  }
  public onImportClear(): void {
    this.importError = false
    this.importObject = undefined
  }

  /****************************************************************************
   *  EXPORT
   */
  public onExport(): void {
    this.displayExportDialog = true
  }
  public onExportConfirmation(): void {
    if (this.exportProductList.length > 0) {
      this.helpApi.exportHelps({ exportHelpsRequest: { productNames: this.exportProductList } }).subscribe({
        next: (obj) => {
          const helpsJson = JSON.stringify(obj, null, 2)
          FileSaver.saveAs(
            new Blob([helpsJson], { type: 'text/json' }),
            'onecx-help-items_' + this.getCurrentDateTime() + '.json'
          )
          this.msgService.success({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.OK' })
          this.displayExportDialog = false
          this.exportProductList = []
        },
        error: (err) => {
          this.msgService.error({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.NOK' })
          console.error('exportHelps', err)
        }
      })
    }
  }
  public onExportCloseDialog(): void {
    this.displayExportDialog = false
    this.exportProductList = []
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
