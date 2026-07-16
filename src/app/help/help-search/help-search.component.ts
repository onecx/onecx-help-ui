import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe, Location, NgTemplateOutlet } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  finalize,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  tap
} from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { FloatLabelModule } from 'primeng/floatlabel'
import { MessageModule } from 'primeng/message'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputTextModule } from 'primeng/inputtext'
import { ToastModule } from 'primeng/toast'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import {
  Action,
  AngularAcceleratorModule,
  ColumnType,
  DataAction,
  DataSortDirection,
  DataTableColumn,
  RowListGridData
} from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'
import { SlotService } from '@onecx/angular-remote-components'

import { Help, HelpsInternalAPIService, HelpSearchCriteria, HelpProductNames } from 'src/app/shared/generated'
import { HelpCriteriaComponent } from './help-criteria/help-criteria.component'
import { HelpDetailComponent } from '../help-detail/help-detail.component'
import { HelpDeleteComponent } from '../help-delete/help-delete.component'
import { HelpExportComponent } from '../help-export/help-export.component'
import { HelpImportComponent } from '../help-import/help-import.component'

export type ChangeMode = 'VIEW' | 'CREATE' | 'COPY' | 'EDIT'
export type ExtendedColumn = {
  field: string
  labelKey: string
  active?: boolean
  tooltipKey?: string
  sortable?: boolean
  filterable?: boolean
  isDate?: boolean
  isDropdown?: boolean
  limit?: boolean
  cssHeader?: string
  cssBody?: string
}
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
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AsyncPipe,
    NgTemplateOutlet,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    ButtonModule,
    FloatLabelModule,
    MessageModule,
    ToastModule,
    TooltipModule,
    TranslateModule,
    // Components
    PortalPageComponent,
    HelpCriteriaComponent,
    HelpDetailComponent,
    HelpDeleteComponent,
    HelpExportComponent,
    HelpImportComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-search.component.html',
  styleUrl: './help-search.component.scss'
})
export class HelpSearchComponent implements OnInit {
  // dialog
  public searching = false
  public exceptionKey: string | undefined
  public loadingMetaData = false
  public changeMode: ChangeMode = 'VIEW'
  public datetimeFormat: string = 'M/d/yy, h:mm a'
  public actions$: Observable<Action[]> | undefined
  public criteria: HelpSearchCriteria = {}
  public displayDeleteDialog = false
  public displayDetailDialog = false
  public displayImportDialog = false
  public displayExportDialog = false
  public usedProducts: Product[] = []
  public sortField = 'startDate'
  public sortDirection = DataSortDirection.DESCENDING

  // data
  private readonly destroyRef = inject(DestroyRef)
  private readonly dataSubject$ = new BehaviorSubject<RowListGridData[]>([])
  public data$: Observable<RowListGridData[] | null> = this.dataSubject$.asObservable()
  private searchSubscription?: Subscription // to cancel ongoing search if new search is triggered
  public filteredData: RowListGridData[] | undefined = undefined
  public globalFilterValue = ''
  public dataAvailable = false
  public metaData$!: Observable<AllMetaData>
  public usedLists$!: Observable<Product[]> // getting data from bff endpoint
  public usedListsTrigger$ = new BehaviorSubject<void>(undefined) // trigger for refresh data
  public item4Detail: Help | undefined // used on detail
  public item4Delete: Help | undefined // used on deletion

  public displayedColumnKeys: string[] = ['productName', 'itemId', 'baseUrl']
  private readonly filteredSearchResults$ = new BehaviorSubject<Help[]>([])
  public dataViewColumns: ExtendedColumn[] = [
    {
      field: 'productName',
      active: true,
      labelKey: 'HELP_ITEM.PRODUCT_NAME',
      tooltipKey: 'HELP_ITEM.TOOLTIPS.PRODUCT_NAME',
      sortable: true,
      filterable: false,
      cssHeader: 'flex flex-row flex-nowrap align-items-center column-gap-2 px-2 sm:px-3 white-space-nowrap',
      cssBody: 'py-0 px-2 sm:px-3'
    },
    {
      field: 'itemId',
      active: true,
      labelKey: 'HELP_ITEM.ID',
      tooltipKey: 'HELP_ITEM.TOOLTIPS.ID',
      sortable: true,
      filterable: false,
      cssHeader: 'flex flex-row flex-nowrap align-items-center column-gap-2 px-2 sm:px-3 white-space-nowrap',
      cssBody: 'py-0 px-2 sm:px-3'
    },
    {
      field: 'baseUrl',
      active: true,
      labelKey: 'HELP_ITEM.URL',
      tooltipKey: 'HELP_ITEM.TOOLTIPS.URL',
      sortable: true,
      filterable: false,
      cssHeader: 'hidden md:flex flex-row flex-nowrap align-items-center column-gap-2 px-3 white-space-nowrap',
      cssBody: 'hidden md:table-cell py-0 px-3'
    }
  ]
  public interactiveColumns: DataTableColumn[] = []
  public interactiveAdditionalActions: DataAction[] = [
    {
      id: 'copy',
      labelKey: 'ACTIONS.COPY.LABEL',
      icon: 'pi pi-copy',
      permission: 'HELP#EDIT',
      classes: ['copyTableRowButton'],
      callback: (item: RowListGridData) => this.onDetail(item, 'COPY')
    }
  ]

  // slot configuration: get product data via remote component
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
    this.interactiveColumns = this.createInteractiveColumns()
    this.pdIsComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.pdSlotName)
    this.displayedColumnKeys = this.dataViewColumns.filter((a) => a.active === true).map((col) => col.field)
  }

  public ngOnInit(): void {
    this.user.lang$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (lang: string) => {
        this.datetimeFormat = lang === 'de' ? 'dd.MM.yyyy HH:mm' : this.datetimeFormat
      }
    })
    this.pdSlotEmitter.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(this.productData$)
    this.prepareActionButtons()
    this.loadMetaData()
    this.onSearch({})
  }

  /****************************************************************************
   * DIALOG
   */
  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.CREATE.LABEL',
        'ACTIONS.CREATE.TOOLTIP',
        'ACTIONS.EXPORT.LABEL',
        'ACTIONS.EXPORT.TOOLTIP',
        'DIALOG.IMPORT.LABEL',
        'DIALOG.IMPORT.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.CREATE.LABEL'],
              title: data['ACTIONS.CREATE.TOOLTIP'],
              actionCallback: () => this.onDetail(undefined, 'CREATE'),
              icon: 'pi pi-plus',
              show: 'always',
              permission: 'HELP#CREATE'
            },
            {
              label: data['ACTIONS.EXPORT.LABEL'],
              title: data['ACTIONS.EXPORT.TOOLTIP'],
              actionCallback: () => this.onExport(),
              icon: 'pi pi-download',
              show: 'always',
              permission: 'HELP#EXPORT',
              conditional: true,
              showCondition: this.dataAvailable
            },
            {
              label: data['DIALOG.IMPORT.LABEL'],
              title: data['DIALOG.IMPORT.TOOLTIP'],
              actionCallback: () => this.onImport(),
              icon: 'pi pi-upload',
              show: 'always',
              permission: 'HELP#IMPORT'
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
    this.filteredSearchResults$.next([])
    this.dataAvailable = false
  }

  public onColumnsChange(activeIds: string[]) {
    if (
      activeIds.length === this.displayedColumnKeys.length &&
      activeIds.every((value, index) => value === this.displayedColumnKeys[index])
    ) {
      return
    }
    this.displayedColumnKeys = activeIds
  }

  public onGlobalFilter(value?: string, data?: RowListGridData[]): void {
    if (!data) return
    this.globalFilterValue = value ?? ''
    if (this.globalFilterValue === '') this.filteredData = undefined
    else
      this.filteredData = data?.filter(
        (row) =>
          row['itemId']?.toString().toLowerCase().includes(this.globalFilterValue.toLowerCase()) ||
          row['productName']?.toString().toLowerCase().includes(this.globalFilterValue.toLowerCase()) ||
          row['displayName']?.toString().toLowerCase().includes(this.globalFilterValue.toLowerCase())
      )
  }

  public onClearGlobalFilter(input?: HTMLInputElement): void {
    this.globalFilterValue = ''
    this.filteredData = undefined
    if (input) input.value = ''
  }

  public onSortChange(event: { sortColumn: string; sortDirection: DataSortDirection }): void {
    this.sortField = event.sortColumn
    this.sortDirection = event.sortDirection
  }

  public getDisplayName(name: string | undefined, list: Product[] | undefined, defValue?: string): string | undefined {
    if (name) return list?.find((item) => item.name === name)?.displayName ?? defValue
    return undefined
  }

  /****************************************************************************
   *  DETAIL => CREATE, EDIT, VIEW
   */
  public onDetail(item: RowListGridData | undefined, mode: ChangeMode): void {
    this.changeMode = mode
    this.item4Detail = item as unknown as Help // do not manipulate the item here
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

  /*
   * DELETION confirmed
   */
  // called after successful deletion from AnnouncementDeleteComponent
  public onDeleteConfirmed(deleted: boolean): void {
    if (deleted) {
      const productName = this.item4Delete?.productName
      const data = this.dataSubject$.getValue().filter((d) => d['id'] !== this.item4Delete?.id)
      this.dataSubject$.next(data)
      this.onGlobalFilter(this.globalFilterValue, data) // update filtered data if filter is active
      if (productName && !data.some((d) => d?.['productName'] === productName)) {
        this.usedListsTrigger$.next()
      }
    }
    this.displayDeleteDialog = false
    this.item4Delete = undefined
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
            if (data.productNames) ul = data.productNames.map((s) => ({ displayName: s, name: s }) as Product)
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
      map(([products, usedList]: [Product[] | undefined, Product[]]) => {
        // enrich the used lists with display names taken from master data (allLists)
        if (products) {
          for (const p of usedList) p.displayName = this.getDisplayName(p.name, products, p.name)
          products.sort(this.sortProductsByName)
        }
        usedList.sort(this.sortProductsByName)
        this.loadingMetaData = false
        return {
          allProducts: products ?? usedList,
          usedProducts: usedList
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
    this.searchSubscription?.unsubscribe()
    this.searchSubscription = this.helpApi
      .searchHelps({ helpSearchCriteria: this.criteria })
      .pipe(
        tap((data) => {
          if (data.stream?.length === 0) {
            this.msgService.info({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
            this.dataAvailable = false
          } else this.dataAvailable = true
          this.prepareActionButtons()
        }),
        map((data) => (data.stream as unknown[] as RowListGridData[]) ?? []),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.HELP_ITEM'
          this.msgService.error({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NOK' })
          console.error('searchHelps', err)
          return of([])
        }),
        finalize(() => (this.searching = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => this.dataSubject$.next(data))
  }

  private sortProductsByName(a: Product, b: Product): number {
    return a.displayName!.toUpperCase().localeCompare(b.displayName!.toUpperCase())
  }

  private ensureHasPermission(permission: string, onGranted: () => void): void {
    this.user
      .hasPermission(permission)
      .then((granted) => {
        if (!granted) {
          this.msgService.error({ summaryKey: 'EXCEPTIONS.HTTP_STATUS_403.HELP' })
          return
        }
        onGranted()
      })
      .catch((err) => {
        console.error('hasPermission', err)
        this.msgService.error({ summaryKey: 'EXCEPTIONS.HTTP_STATUS_403.HELP' })
      })
  }

  public onViewFromInteractive(item: RowListGridData): void {
    this.ensureHasPermission('HELP#VIEW', () => this.onDetail(item, 'VIEW'))
  }
  public onCopyFromInteractive(item: RowListGridData): void {
    this.ensureHasPermission('HELP#CREATE', () => this.onDetail(item, 'COPY'))
  }
  public onEditFromInteractive(item: RowListGridData): void {
    this.ensureHasPermission('HELP#EDIT', () => this.onDetail(item, 'EDIT'))
  }
  public onDeleteFromInteractive(item: RowListGridData): void {
    this.ensureHasPermission('HELP#DELETE', () => {
      this.item4Delete = { ...item } as unknown as Help
      this.displayDeleteDialog = true
    })
  }

  // Extend the columns with information for interactive table and special rendering
  private createInteractiveColumns(): DataTableColumn[] {
    return this.dataViewColumns.map((col) => {
      return {
        id: col.field,
        nameKey: col.labelKey,
        tooltipKey: col.tooltipKey,
        columnType: ColumnType.STRING,
        sortable: col.sortable === true,
        filterable: col.filterable === true,
        // extensions for custom rendering:
        cssHeader: col.cssHeader,
        cssBody: col.cssBody
      }
    })
  }

  /****************************************************************************
   *  IMPORT
   */
  public onImport(): void {
    this.displayImportDialog = true
  }
  public onImportDialogVisibleChange(refresh: boolean): void {
    this.displayImportDialog = false
    if (refresh) {
      this.usedListsTrigger$.next()
      this.onSearch({}, true)
    }
  }

  /****************************************************************************
   *  EXPORT
   */
  public onExport(): void {
    this.displayExportDialog = true
  }
  public onExportDialogVisibleChange(): void {
    this.displayExportDialog = false
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
