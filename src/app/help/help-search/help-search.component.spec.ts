import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { BehaviorSubject, of, take, throwError } from 'rxjs'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { DataSortDirection, RowListGridData } from '@onecx/angular-accelerator'
import { providePermissionService } from '@onecx/angular-utils'

import { HelpsInternalAPIService, Help } from 'src/app/shared/generated'
import { ExtendedColumn, HelpSearchComponent } from './help-search.component'

const helpItem1: Help = { id: 'id1', itemId: 'itemId1', productName: 'product1', baseUrl: 'baseUrl 1' }
const helpItem2: Help = { id: 'id2', itemId: 'itemId2', productName: 'product2', baseUrl: 'baseUrl 2' }
const helpItem3: Help = { id: 'id3', itemId: 'itemId3', productName: 'product3', baseUrl: 'baseUrl 3' }
const helpItem4: Help = { id: 'id4', itemId: 'itemId4', productName: 'product4', baseUrl: 'baseUrl 4' }

const helpItems: Help[] = [helpItem1, helpItem2, helpItem3, helpItem4]

const rowItem1: RowListGridData = { ...helpItem1 } as unknown as RowListGridData
const rowItem2: RowListGridData = { ...helpItem2 } as unknown as RowListGridData
const rowItem3: RowListGridData = { ...helpItem3 } as unknown as RowListGridData
const rowItem4: RowListGridData = { ...helpItem4 } as unknown as RowListGridData
const rowItems: RowListGridData[] = [rowItem1, rowItem2, rowItem3, rowItem4]

describe('HelpSearchComponent', () => {
  let component: HelpSearchComponent
  let fixture: ComponentFixture<HelpSearchComponent>

  const defaultLang = 'en'
  const langSubject = new BehaviorSubject<string>(defaultLang)
  const hasPermissionSpy = jasmine.createSpy('hasPermission').and.returnValue(Promise.resolve(true))
  const userServiceSpy = {
    lang$: langSubject.asObservable(),
    hasPermission: hasPermissionSpy
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    getAllProductsWithHelpItems: jasmine.createSpy('getAllProductsWithHelpItems').and.returnValue(of({})),
    searchHelps: jasmine.createSpy('searchHelps').and.returnValue(of({}))
  }

  async function initTestComponent() {
    fixture = TestBed.createComponent(HelpSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HelpSearchComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage(defaultLang)
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        providePermissionService(),
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
      .overrideComponent(HelpSearchComponent, {
        set: {
          providers: [
            { provide: UserService, useValue: userServiceSpy },
            { provide: HelpsInternalAPIService, useValue: apiServiceSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(async () => {
    await initTestComponent()
  })

  afterEach(() => {
    langSubject.next(defaultLang)
    hasPermissionSpy.calls.reset()
    hasPermissionSpy.and.returnValue(Promise.resolve(true))
    userServiceSpy.hasPermission.and.returnValue(Promise.resolve(false))
    userServiceSpy.hasPermission.calls.reset()
    // to spy data: reset
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    apiServiceSpy.getAllProductsWithHelpItems.calls.reset()
    apiServiceSpy.searchHelps.calls.reset()
    // to spy data: refill with neutral data
    apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of({}))
    apiServiceSpy.searchHelps.and.returnValue(of({}))
  })

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should call OnInit and keep default data view columns', () => {
      component.ngOnInit()

      expect(component.dataViewColumns.length).toBe(3)
      expect(component.displayedColumnKeys).toEqual(['productName', 'itemId', 'baseUrl'])
    })

    it('should create component and set columns for displaying results', () => {
      expect(component).toBeTruthy()
      expect(component.dataViewColumns[0].field).toBe('productName')
      expect(component.dataViewColumns[1].field).toBe('itemId')
      expect(component.dataViewColumns[2].field).toBe('baseUrl')
    })
  })

  describe('page actions', () => {
    it('should open create dialog', () => {
      spyOn(component, 'onExport')

      component.ngOnInit()

      component.actions$?.subscribe((action) => {
        action[1].actionCallback!()
      })

      expect(component.onExport).toHaveBeenCalled()
    })

    it('should open export dialog', () => {
      spyOn(component, 'onImport')

      component.ngOnInit()
      component.actions$?.subscribe((action) => {
        action[2].actionCallback!()
      })

      expect(component.onImport).toHaveBeenCalled()
    })

    it('should open import dialog', () => {
      spyOn(component, 'onDetail')

      component.ngOnInit()
      component.actions$?.subscribe((action) => {
        action[0].actionCallback!()
      })

      expect(component.onDetail).toHaveBeenCalledWith(undefined, 'CREATE')
    })
  })

  describe('search', () => {
    it('should search without search criteria', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: helpItems }))

      component.onSearch({})

      component.data$!.subscribe({
        next: (data) => {
          expect(data).toEqual(rowItems)
          done()
        },
        error: done.fail
      })
    })

    it('should search with criteria and then reset search criteria', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: [helpItems[1]] }))
      component.criteria = { productName: helpItems[1].productName }

      component.onSearch(component.criteria, true)

      component.data$!.pipe(take(1)).subscribe({
        next: (data) => {
          if (data) {
            expect(data.length).toBe(1)
            expect(data[0]).toEqual(rowItems[1])
          }
          component.onCriteriaReset()
          expect(component.criteria).toEqual({})
          done()
        },
        error: done.fail
      })
    })

    it('should display an info message if the search has no results', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: [] }))
      component.onSearch({})

      component.data$!.subscribe({
        next: (data) => {
          if (data) expect(data.length).toBe(0)
          done()
        },
        error: done.fail
      })
      expect(component.exceptionKey).toBeUndefined()
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
    })

    it('should display an error message if the search fails', (done) => {
      const errorResponse = { status: '403', statusText: 'Not authorized' }
      apiServiceSpy.searchHelps.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.onSearch({})

      component.data$!.subscribe({
        next: (data) => {
          if (data) expect(data.length).toBe(0)
          done()
        },
        error: done.fail
      })
      expect(console.error).toHaveBeenCalledWith('searchHelps', errorResponse)
      expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.HELP_ITEM')
      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NOK' })
    })

    it('should search with newly defined criteria', () => {
      apiServiceSpy.searchHelps.and.returnValue(of([]))
      component.criteria = { productName: 'product 1', itemId: 'itemId 1' }
      const newCriteria = { productName: 'product 2', itemId: 'itemId 2' }

      component.onSearch(newCriteria, false)

      expect(component.criteria).toEqual(newCriteria)
    })

    it('should search with wildcard * in title', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: helpItems }))
      component.criteria = { itemId: 'A*' }

      component.onSearch(component.criteria, false)

      component.data$!.subscribe({
        next: (data) => {
          expect(data).toEqual(rowItems)
          done()
        },
        error: done.fail
      })
    })

    it('should no display name if no name', () => {
      const dn = component.getDisplayName(undefined, undefined)

      expect(dn).toBeUndefined()
    })
  })

  describe('sort', () => {
    it('should update sort field and direction', () => {
      component.onSortChange({ sortColumn: 'title', sortDirection: DataSortDirection.ASCENDING })

      expect(component.sortField).toBe('title')
      expect(component.sortDirection).toBe(DataSortDirection.ASCENDING)
    })
  })

  describe('META data: load used products', () => {
    it('should get all items assigned to products', (done) => {
      const assignments = { productNames: ['prod1'] }
      apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of(assignments))

      component.ngOnInit()

      component.usedLists$?.subscribe({
        next: (data) => {
          expect(data).toContain({ displayName: 'prod1', name: 'prod1' })
          done()
        }
      })
    })

    it('should get all items assigned to products', (done) => {
      const errorResponse = { status: '404', statusText: 'An error occur' }
      apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnInit()

      component.usedLists$?.subscribe({
        next: (data) => {
          expect(data).toEqual([])
          done()
        },
        error: done.fail
      })
      expect(console.error).toHaveBeenCalledOnceWith('getAllProductsWithHelpItems', errorResponse)
    })
  })

  describe('META data: load all meta data together and check enrichments', () => {
    it('should get all existing products - successful enrichments', (done) => {
      const products = [{ name: 'product', displayName: 'Product' }]
      component.pdSlotEmitter.emit(products)
      // products are used...
      const assignments = { productNames: ['product', 'unknown'] }
      apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of(assignments))

      component.ngOnInit()

      component.metaData$.subscribe({
        next: (meta) => {
          if (meta) {
            expect(meta.allProducts.length).toBe(1)
            expect(meta.usedProducts?.length).toBe(2)
            expect(meta.usedProducts).toEqual([
              { name: 'product', displayName: 'Product' },
              { name: 'unknown', displayName: 'unknown' }
            ])
            done()
          }
        }
      })
    })

    it('should get no existing products - successful but without enrichments', (done) => {
      // product and workspace are used...
      const assignments = { productNames: ['product', 'unknown'] }
      apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of(assignments))

      component.ngOnInit()

      component.metaData$.subscribe({
        next: (meta) => {
          if (meta) {
            expect(meta.allProducts.length).toBe(2) // take over the used products
            expect(meta.usedProducts?.length).toBe(2)
            expect(meta.usedProducts).toEqual([
              { name: 'product', displayName: 'product' },
              { name: 'unknown', displayName: 'unknown' }
            ])
            done()
          }
        }
      })
    })
  })

  describe('UI actions', () => {
    it('should provide copy additional action', () => {
      expect(component.interactiveAdditionalActions.length).toBe(1)
      expect(component.interactiveAdditionalActions[0].id).toBe('copy')
      expect(component.interactiveAdditionalActions[0].permission).toBe('HELP#EDIT')
    })

    it('should call detail in COPY mode from copy additional action', () => {
      spyOn(component, 'onDetail')

      component.interactiveAdditionalActions[0].callback!(rowItems[0])

      expect(component.onDetail).toHaveBeenCalledWith(rowItems[0], 'COPY')
    })

    it('should call detail in COPY mode from copy additional action', async () => {
      userServiceSpy.hasPermission.and.returnValue(Promise.resolve(true))
      spyOn(component, 'onDetail')

      component.onCopyFromInteractive(rowItems[0])
      await fixture.whenStable()

      expect(component.onDetail).toHaveBeenCalledWith(rowItems[0], 'COPY')
    })

    it('should call onDetail in VIEW mode from onViewItem', async () => {
      userServiceSpy.hasPermission.and.returnValue(Promise.resolve(true))
      spyOn(component, 'onDetail')

      component.onViewFromInteractive(rowItems[0])
      await fixture.whenStable()

      expect(component.onDetail).toHaveBeenCalledWith(rowItems[0], 'VIEW')
    })

    it('should call onDetail in EDIT mode from onEditItem', async () => {
      userServiceSpy.hasPermission.and.returnValue(Promise.resolve(true))
      spyOn(component, 'onDetail')

      component.onEditFromInteractive(rowItems[1])
      await fixture.whenStable()

      expect(component.onDetail).toHaveBeenCalledWith(rowItems[1], 'EDIT')
    })

    it('should call onDelete from onDeleteItem', async () => {
      userServiceSpy.hasPermission.and.returnValue(Promise.resolve(true))

      component.onDeleteFromInteractive(rowItems[2])
      await fixture.whenStable()

      expect(component.displayDeleteDialog).toBeTrue()
    })

    it('should prevent call onDelete from onDeleteItem', async () => {
      userServiceSpy.hasPermission.and.returnValue(Promise.resolve(false))

      component.onDeleteFromInteractive(rowItems[2])
      await fixture.whenStable()

      expect(component.displayDeleteDialog).toBeFalse()
    })

    it('should handle permission check errors when deleting from interactive table', async () => {
      const errorResponse = new Error('permission failed')
      hasPermissionSpy.and.returnValue(Promise.reject(errorResponse))
      spyOn(console, 'error')

      component.onDeleteFromInteractive(rowItems[0])
      await Promise.resolve() // 1st flush: propagates rejection through .then() chain, queues .catch() callback
      await Promise.resolve() // 2nd flush: runs .catch() callback (console.error + msgService.error)
      await fixture.whenStable()

      expect(component.displayDeleteDialog).toBeFalse()
      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'EXCEPTIONS.HTTP_STATUS_403.HELP' })
      expect(console.error).toHaveBeenCalledWith('hasPermission', errorResponse)
    })
  })

  describe('detail actions', () => {
    it('should prepare the creation of a new item', () => {
      const mode = 'CREATE'

      component.onDetail(undefined, mode)

      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toBeUndefined()
      expect(component.displayDetailDialog).toBeTrue()

      component.onCloseDetail(false)

      expect(component.displayDetailDialog).toBeFalse()
    })

    it('should show details of a item: EDIT', () => {
      const mode = 'EDIT'

      component.onDetail(rowItems[0], mode)

      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toEqual(helpItems[0])
      expect(component.displayDetailDialog).toBeTrue()
    })

    it('should prepare the copy of a item: COPY', () => {
      const mode = 'COPY'

      component.onDetail(rowItems[0], mode)

      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toEqual(helpItems[0])
      expect(component.displayDetailDialog).toBeTrue()

      component.onCloseDetail(true)

      expect(component.displayDetailDialog).toBeFalse()
    })
  })

  describe('deletion', () => {
    let items4Deletion: any[] = []

    beforeEach(() => {
      items4Deletion = [...helpItems]
    })

    it('should prepare the deletion of a item - ok', async () => {
      userServiceSpy.hasPermission.and.returnValue(Promise.resolve(true))

      component.onDeleteFromInteractive(rowItems[2])
      await fixture.whenStable()

      expect(component.item4Delete).toEqual(items4Deletion[2])
      expect(component.displayDeleteDialog).toBeTrue()
    })

    it('should close delete dialog and clear item on false emit', () => {
      component.item4Delete = helpItem1 as unknown as Help
      component.displayDeleteDialog = true

      component.onDeleteConfirmed(false)

      expect(component.displayDeleteDialog).toBeFalse()
      expect(component.item4Delete).toBeUndefined()
    })

    it('should handle deletion confirmed - remove last item from data', (done) => {
      component.item4Delete = helpItem1
      component['dataSubject$'].next([rowItem1])

      component.onDeleteConfirmed(true)

      expect(component.displayDeleteDialog).toBeFalse()
      expect(component.item4Delete).toBeUndefined()
      component.data$!.subscribe({
        next: (data) => {
          expect(data!.length).toBe(0)
          done()
        },
        error: done.fail
      })
    })

    it('should handle deletion confirmed - trigger usedLists reload when last of product removed', (done) => {
      component.item4Delete = helpItem1 as unknown as Help
      component['dataSubject$'].next(rowItems)
      spyOn(component.usedListsTrigger$, 'next')

      component.onDeleteConfirmed(true)

      expect(component.usedListsTrigger$.next).toHaveBeenCalled()
      expect(component.displayDeleteDialog).toBeFalse()
      expect(component.item4Delete).toBeUndefined()
      component.data$!.subscribe({
        next: (data) => {
          expect(data!.length).toBe(3)
          done()
        },
        error: done.fail
      })
    })
  })

  describe('export', () => {
    it('should display export dialog', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: helpItems }))

      component.onSearch({})

      component.data$!.subscribe({
        next: (data) => {
          expect(data).toEqual(rowItems)
          component.onExport()
          expect(component.displayExportDialog).toBeTrue()
          done()
        },
        error: done.fail
      })
    })

    it('should close export dialog on visibleChange emit', () => {
      component.displayExportDialog = true

      component.onExportDialogVisibleChange()

      expect(component.displayExportDialog).toBeFalse()
    })
  })

  describe('import', () => {
    it('should display import dialog when import button is clicked', () => {
      component.displayImportDialog = false

      component.onImport()

      expect(component.displayImportDialog).toBeTrue()
    })

    it('should close import dialog on false emit and not re-search', () => {
      component.displayImportDialog = true
      spyOn(component, 'onSearch')

      component.onImportDialogVisibleChange(false)

      expect(component.displayImportDialog).toBeFalse()
      expect(component.onSearch).not.toHaveBeenCalled()
    })

    it('should close import dialog on true emit and trigger re-search', () => {
      component.displayImportDialog = true
      spyOn(component, 'onSearch')

      component.onImportDialogVisibleChange(true)

      expect(component.displayImportDialog).toBeFalse()
      expect(component.onSearch).toHaveBeenCalledWith({}, true)
    })
  })

  describe('prepare URL', () => {
    it('should prepare empty url: ', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH'
      }
      const url = component.prepareUrl(help)

      expect(url).toEqual('')
    })

    it('should prepare the url on: base', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help'
      }
      const url = component.prepareUrl(help)

      expect(url).toEqual(help.baseUrl!)
    })

    it('should prepare the url on: base + context', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help',
        context: 'ctx'
      }
      const url = component.prepareUrl(help)

      expect(url).toEqual(help.baseUrl! + '#' + help.context)
    })

    it('should prepare the url on: base + resource', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help',
        resourceUrl: '/search'
      }
      const url = component.prepareUrl(help)

      expect(url).toEqual(help.baseUrl! + help.resourceUrl)
    })

    it('should prepare the url on: base + resource + context', () => {
      const help: Help = {
        id: 'id',
        productName: 'ocx-help-ui',
        itemId: 'PAGE_HELP_SEARCH',
        baseUrl: 'http://localhost:8080/help',
        resourceUrl: '/search',
        context: '#ctx'
      }
      const url = component.prepareUrl(help)

      expect(url).toEqual(help.baseUrl! + help.resourceUrl + help.context)
    })
  })

  describe('filter columns', () => {
    it('should update the columns that are seen in results', () => {
      const columns: ExtendedColumn[] = [
        { field: 'field1', labelKey: 'WORKSPACE', active: true, sortable: true },
        { field: 'field2', labelKey: 'CONTEXT', active: true, sortable: true }
      ]
      component.dataViewColumns = columns

      component.onColumnsChange(['field1'])

      expect(component.displayedColumnKeys).toEqual(['field1'])
    })

    it('should not update columns if activeIds are unchanged', () => {
      component.displayedColumnKeys = ['status', 'title']

      component.onColumnsChange(['status', 'title'])

      expect(component.displayedColumnKeys).toEqual(['status', 'title'])
    })
  })

  describe('filter data', () => {
    it('should return early if data is not provided', () => {
      component.onGlobalFilter('test', undefined)

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData).toBeUndefined()
    })

    it('should set filteredData to full data when value is empty', () => {
      component.onGlobalFilter('', rowItems)

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData).toBeUndefined()
    })

    it('should set filteredData to full data when value is undefined', () => {
      component.onGlobalFilter(undefined, rowItems)

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData).toBeUndefined()
    })

    it('should filter data by title field (case-insensitive)', () => {
      component.onGlobalFilter('1', rowItems)

      expect(component.globalFilterValue).toBe('1')
      expect(component.filteredData?.length).toBe(1)
      expect((component.filteredData?.[0] as any).productName).toBe('product1')
    })

    it('should return empty array when no title matches', () => {
      component.onGlobalFilter('nonexistent', rowItems)

      expect(component.globalFilterValue).toBe('nonexistent')
      expect(component.filteredData?.length).toBe(0)
    })

    it('should clear global filter and reset filteredData', () => {
      component.globalFilterValue = 'some filter'
      component.filteredData = rowItems

      component.onClearGlobalFilter()

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData).toBeUndefined()
    })

    it('should clear global filter and reset input element value', () => {
      component.globalFilterValue = 'some filter'
      component.filteredData = rowItems
      const input = document.createElement('input')
      input.value = 'some filter'

      component.onClearGlobalFilter(input)

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData).toBeUndefined()
      expect(input.value).toBe('')
    })
  })

  describe('Language tests', () => {
    it('should use default format: English', () => {
      expect(component.datetimeFormat).toEqual('M/d/yy, h:mm a')
    })

    it('should set German date format', () => {
      langSubject.next('de')
      initTestComponent()
      expect(component.datetimeFormat).toEqual('dd.MM.yyyy HH:mm')
    })
  })
})
