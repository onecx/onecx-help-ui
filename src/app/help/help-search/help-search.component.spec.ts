import { NO_ERRORS_SCHEMA } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateModule } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import { take } from 'rxjs/operators'
import { FileSelectEvent } from 'primeng/fileupload'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService, Help } from 'src/app/shared/generated'
import { HelpSearchComponent, Product } from './help-search.component'

const helpItem1: Help = { id: 'id1', itemId: 'itemId1', productName: 'product1', baseUrl: 'baseUrl 1' }
const helpItem2: Help = { id: 'id2', itemId: 'itemId2', productName: 'product2', baseUrl: 'baseUrl 2' }
const helpItem3: Help = { id: 'id3', itemId: 'itemId1', productName: 'product3', baseUrl: 'baseUrl 3' }
const helpItem4: Help = { id: 'id4', itemId: 'itemId2', productName: 'product1', baseUrl: 'baseUrl 4' }
const itemData: Help[] = [helpItem1, helpItem2, helpItem3, helpItem4]
const product1: Product = { name: 'product1', displayName: 'Product 1' }
const product2: Product = { name: 'product2', displayName: 'Product 2' }

describe('HelpSearchComponent', () => {
  let component: HelpSearchComponent
  let fixture: ComponentFixture<HelpSearchComponent>

  const defaultLang = 'en'
  const mockUserService = {
    lang$: { getValue: jasmine.createSpy('getValue') },
    hasPermission: jasmine.createSpy('hasPermission').and.returnValue(Promise.resolve(false))
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    getAllProductsWithHelpItems: jasmine.createSpy('getAllProductsWithHelpItems').and.returnValue(of({})),
    searchHelps: jasmine.createSpy('searchHelps').and.returnValue(of({})),
    addHelpItem: jasmine.createSpy('addHelpItem').and.returnValue(of({})),
    deleteHelp: jasmine.createSpy('deleteHelp').and.returnValue(of({})),
    importHelps: jasmine.createSpy('importHelps').and.returnValue(of({})),
    exportHelps: jasmine.createSpy('exportHelps').and.returnValue(of({}))
  }
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])

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
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: UserService, useValue: mockUserService }]
    })
      .overrideComponent(HelpSearchComponent, {
        set: {
          imports: [CommonModule, TranslateModule],
          schemas: [NO_ERRORS_SCHEMA],
          providers: [
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
    mockUserService.lang$.getValue.and.returnValue(defaultLang)
    mockUserService.hasPermission.and.returnValue(Promise.resolve(false))
    mockUserService.hasPermission.calls.reset()
    // to spy data: reset
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    apiServiceSpy.getAllProductsWithHelpItems.calls.reset()
    apiServiceSpy.searchHelps.calls.reset()
    apiServiceSpy.addHelpItem.calls.reset()
    apiServiceSpy.deleteHelp.calls.reset()
    apiServiceSpy.importHelps.calls.reset()
    apiServiceSpy.exportHelps.calls.reset()
    // to spy data: refill with neutral data
    apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of({}))
    apiServiceSpy.searchHelps.and.returnValue(of({}))
    apiServiceSpy.addHelpItem.and.returnValue(of({}))
    apiServiceSpy.deleteHelp.and.returnValue(of({}))
    apiServiceSpy.importHelps.and.returnValue(of({}))
    apiServiceSpy.exportHelps.and.returnValue(of({}))
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

    it('should hide view action when edit permission exists', async () => {
      mockUserService.hasPermission.and.returnValue(Promise.resolve(true))

      component.ngOnInit()
      await fixture.whenStable()

      expect(mockUserService.hasPermission).toHaveBeenCalledWith('HELP#EDIT')
      expect(component.dataViewEditPermission).toBe('HELP#EDIT')
      expect(component.dataViewViewPermission).toBe('__NO_PERMISSION__')
    })

    it('should show view action when edit permission does not exist', async () => {
      mockUserService.hasPermission.and.returnValue(Promise.resolve(false))

      component.ngOnInit()
      await fixture.whenStable()

      expect(mockUserService.hasPermission).toHaveBeenCalledWith('HELP#EDIT')
      expect(component.dataViewEditPermission).toBe('__NO_PERMISSION__')
      expect(component.dataViewViewPermission).toBe('HELP#VIEW')
    })

    it('should fall back to view permission when hasPermission throws', async () => {
      mockUserService.hasPermission.and.returnValue(Promise.reject(new Error('unexpected')))
      spyOn(console, 'error')

      component.ngOnInit()
      await fixture.whenStable()

      expect(component.dataViewEditPermission).toBe('__NO_PERMISSION__')
      expect(component.dataViewViewPermission).toBe('HELP#VIEW')
      expect(console.error).toHaveBeenCalledWith('configureDataViewActionPermissions', jasmine.any(Error))
    })

    it('should create component and set columns for displaying results', () => {
      expect(component).toBeTruthy()
      expect(component.dataViewColumns[0].id).toBe('productName')
      expect(component.dataViewColumns[1].id).toBe('itemId')
      expect(component.dataViewColumns[2].id).toBe('baseUrl')
    })
  })

  describe('page actions', () => {
    it('should open create dialog', () => {
      spyOn(component, 'onExport')

      component.ngOnInit()

      component.actions$?.subscribe((action) => {
        action[1].actionCallback()
      })

      expect(component.onExport).toHaveBeenCalled()
    })

    it('should open export dialog', () => {
      spyOn(component, 'onImport')

      component.ngOnInit()
      component.actions$?.subscribe((action) => {
        action[2].actionCallback()
      })

      expect(component.onImport).toHaveBeenCalled()
    })

    it('should open import dialog', () => {
      spyOn(component, 'onDetail')

      component.ngOnInit()
      component.actions$?.subscribe((action) => {
        action[0].actionCallback()
      })

      expect(component.onDetail).toHaveBeenCalledWith(undefined, 'CREATE')
    })
  })

  describe('UI actions', () => {
    it('should provide copy additional action', () => {
      expect(component.dataViewAdditionalActions.length).toBe(1)
      expect(component.dataViewAdditionalActions[0].id).toBe('copy')
      expect(component.dataViewAdditionalActions[0].permission).toBe('HELP#EDIT')
    })

    it('should call detail in COPY mode from copy additional action', () => {
      spyOn(component, 'onDetail')

      component.dataViewAdditionalActions[0].callback(itemData[0])

      expect(component.onDetail).toHaveBeenCalledWith(itemData[0], 'COPY')
    })

    it('should call onDetail in VIEW mode from onViewItem', () => {
      spyOn(component, 'onDetail')

      component.onViewItem(itemData[0])

      expect(component.onDetail).toHaveBeenCalledWith(itemData[0], 'VIEW')
    })

    it('should call onDetail in EDIT mode from onEditItem', () => {
      spyOn(component, 'onDetail')

      component.onEditItem(itemData[1])

      expect(component.onDetail).toHaveBeenCalledWith(itemData[1], 'EDIT')
    })

    it('should call onDelete from onDeleteItem', () => {
      spyOn(component, 'onDelete')

      component.onDeleteItem(itemData[2])

      expect(component.onDelete).toHaveBeenCalledWith(itemData[2])
    })

    it('should set tableFilter on onGlobalFilter', () => {
      component.onGlobalFilter('itemId1')

      expect(component.tableFilter).toBe('itemId1')
    })

    it('should filter data by global filter value', (done) => {
      component['rawSearchResults'] = [...itemData]
      component.productData$.next([product1, product2])

      component.onGlobalFilter('itemId1')

      component.data$.subscribe((data) => {
        expect(data.length).toBe(2)
        expect(data).toContain(helpItem1 as any)
        expect(data).toContain(helpItem3 as any)
        done()
      })
    })

    it('should clear tableFilter and restore all results on onClearGlobalFilter', (done) => {
      component['rawSearchResults'] = [...itemData]
      component.tableFilter = 'itemId1'

      component.onClearGlobalFilter()

      expect(component.tableFilter).toBe('')
      component.data$.subscribe((data) => {
        expect(data).toEqual(itemData)
        done()
      })
    })

    it('should clear input element value on onClearGlobalFilter with input', (done) => {
      component['rawSearchResults'] = [...itemData]
      const input = document.createElement('input')
      input.value = 'itemId1'
      component.tableFilter = 'itemId1'

      component.onClearGlobalFilter(input)

      expect(input.value).toBe('')
      expect(component.tableFilter).toBe('')
      component.data$.subscribe((data) => {
        expect(data).toEqual(itemData)
        done()
      })
    })

    it('should restore all results when filter is cleared to empty string', (done) => {
      component['rawSearchResults'] = [...itemData]
      component.tableFilter = ''

      component.onGlobalFilter('')

      component.data$.subscribe((data) => {
        expect(data).toEqual(itemData)
        done()
      })
    })

    it('should filter by productName when no productData is available', (done) => {
      component['rawSearchResults'] = [...itemData]
      component.productData$.next(undefined)

      component.onGlobalFilter('product1')

      component.data$.subscribe((data) => {
        expect(data.length).toBe(2)
        expect(data).toContain(helpItem1 as any)
        expect(data).toContain(helpItem4 as any)
        done()
      })
    })

    it('should default tableFilter to empty string when onGlobalFilter is called with null', () => {
      component.onGlobalFilter(null as any)

      expect(component.tableFilter).toBe('')
    })

    it('should treat undefined productName and itemId as empty string when filtering', (done) => {
      const itemWithoutFields: Help = { id: 'id5', itemId: undefined as any, productName: undefined, baseUrl: '' }
      component['rawSearchResults'] = [itemWithoutFields]
      component.productData$.next(undefined)

      component.onGlobalFilter('nomatch')

      component.data$.subscribe((data) => {
        expect(data.length).toBe(0)
        done()
      })
    })
  })

  describe('search', () => {
    it('should search without search criteria', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: itemData }))

      component.onSearch({})

      component.data$!.subscribe({
        next: (data) => {
          expect(data).toEqual(itemData)
          done()
        },
        error: done.fail
      })
    })

    it('should search and then reset search criteria', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: [itemData[1]] }))
      component.criteria = { productName: itemData[1].productName }

      component.onSearch(component.criteria, true)

      component.data$!.pipe(take(1)).subscribe({
        next: (data) => {
          expect(data.length).toBe(1)
          expect(data[0]).toEqual(itemData[1])

          component.onCriteriaReset()
          expect(component.criteria).toEqual({})
          done()
        },
        error: done.fail
      })
    })

    it('should display an error message if the search fails', (done) => {
      const errorResponse = { status: '403', statusText: 'Not authorized' }
      apiServiceSpy.searchHelps.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.onSearch({})

      component.data$!.subscribe({
        next: (data) => {
          expect(data.length).toBe(0)
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
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: itemData }))
      component.criteria = { itemId: 'A*' }

      component.onSearch(component.criteria, false)

      component.data$!.subscribe({
        next: (data) => {
          expect(data).toEqual(itemData)
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

  describe('export', () => {
    it('should display export dialog', (done) => {
      apiServiceSpy.searchHelps.and.returnValue(of({ stream: itemData }))

      component.onSearch({})

      component.data$!.subscribe({
        next: (data) => {
          expect(data).toEqual(itemData)
          component.onExport()
          expect(component.displayExportDialog).toBeTrue()
          done()
        },
        error: done.fail
      })
    })

    it('should export help items', () => {
      apiServiceSpy.exportHelps.and.returnValue(of(product1))
      component.exportProductList = [product1.name]

      component.onExportConfirmation()

      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.OK' })
    })

    it('should display error message when export fails', () => {
      const errorResponse = { status: 400, statusText: 'Cannot export ...' }
      apiServiceSpy.exportHelps.and.returnValue(throwError(() => errorResponse))
      component.exportProductList = [product1.name, product2.name]
      spyOn(console, 'error')

      component.onExportConfirmation()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.NOK' })
      expect(console.error).toHaveBeenCalledWith('exportHelps', errorResponse)
    })

    it('should reset displayExportDialog, selectedResults, and selectedproductNames', () => {
      component.displayExportDialog = true
      component.exportProductList = [product1.name, product2.name]

      component.onExportCloseDialog()

      expect(component.displayExportDialog).toBeFalse()
      expect(component.exportProductList).toEqual([])
    })
  })

  describe('import', () => {
    it('should display import dialog when import button is clicked', () => {
      component.displayImportDialog = false

      component.onImport()

      expect(component.displayImportDialog).toBeTrue()
    })

    describe('on file select', () => {
      let file: File
      let event: any = {}

      beforeEach(() => {
        translateServiceSpy.get.and.returnValue(of({}))
        file = new File(['file content'], 'test.txt', { type: 'text/plain' })
        const fileList: FileList = {
          0: file,
          length: 1,
          item: (index: number) => file
        }
        event = { files: fileList }
      })

      it('should select a file to upload - valid JSON', async () => {
        const json = '{ "helps": { "product": { "itemId": { "baseUrl": "https://..." } } } }'
        spyOn(file, 'text').and.returnValue(Promise.resolve(json))

        component.onImportSelectFile(event as any as FileSelectEvent)
        await fixture.whenStable()
        fixture.detectChanges()

        expect(file.text).toHaveBeenCalled()
        expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.OK' })
        expect(component.importError).toBeFalse()
      })

      it('should select a file to upload - invalid JSON - handle error', async () => {
        spyOn(file, 'text').and.returnValue(Promise.resolve('Invalid Json'))
        spyOn(console, 'error')

        component.onImportSelectFile(event)
        await fixture.whenStable()
        fixture.detectChanges()

        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.NOK' })
        expect(console.error).toHaveBeenCalled()
        expect(component.importError).toBeTrue()
      })
    })

    describe('on import confirmation', () => {
      it('should import help items', async () => {
        apiServiceSpy.importHelps.and.returnValue(of({}))
        component['importObject'] = helpItem1

        component.onImportConfirmation()
        await fixture.whenStable()
        fixture.detectChanges()

        expect(component.displayImportDialog).toBeFalse()
        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.OK' })
      })

      it('should call importHelps and handle error', async () => {
        const errorResponse = { status: 400, statusText: 'Cannot import ...' }
        apiServiceSpy.importHelps.and.returnValue(throwError(() => errorResponse))
        component['importObject'] = helpItem1
        spyOn(console, 'error')

        component.onImportConfirmation()
        await fixture.whenStable()
        fixture.detectChanges()

        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.NOK' })
        expect(console.error).toHaveBeenCalledWith('importHelps', errorResponse)
      })

      it('should not call importHelps if importHelpItem is not defined', () => {
        component['importObject'] = undefined

        component.onImportConfirmation()

        expect(apiServiceSpy.importHelps).not.toHaveBeenCalled()
      })
    })

    it('should reset import objects when clear button is clicked', () => {
      component.importError = true
      component['importObject'] = helpItem1

      component.onImportClear()

      expect(component.importError).toBeFalse()
      expect(component['importObject']).toBeUndefined()
    })

    it('should close displayImportDialog', () => {
      component.importError = true
      component['importObject'] = helpItem1
      component.displayImportDialog = true

      component.onImportCloseDialog()

      expect(component.displayImportDialog).toBeFalse()
      expect(component.importError).toBeFalse()
      expect(component['importObject']).toBeUndefined()
    })
  })

  describe('detail actions', () => {
    it('should prepare the creation of a new item', () => {
      const mode = 'CREATE'

      component.onDetail(undefined, mode)

      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toBe(undefined)
      expect(component.displayDetailDialog).toBeTrue()

      component.onCloseDetail(false)

      expect(component.displayDetailDialog).toBeFalse()
    })

    it('should show details of a item', () => {
      const mode = 'EDIT'

      component.onDetail(itemData[0], mode)

      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toBe(itemData[0])
      expect(component.displayDetailDialog).toBeTrue()
    })

    it('should prepare the copy of a item', () => {
      const mode = 'COPY'

      component.onDetail(itemData[0], mode)

      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toBe(itemData[0])
      expect(component.displayDetailDialog).toBeTrue()

      component.onCloseDetail(true)

      expect(component.displayDetailDialog).toBeFalse()
    })
  })

  describe('deletion', () => {
    let items4Deletion: any[] = []

    beforeEach(() => {
      items4Deletion = [...itemData]
    })

    it('should prepare the deletion of a item - ok', () => {
      component.onDelete(items4Deletion[0])

      expect(component.item4Delete).toBe(items4Deletion[0])
      expect(component.displayDeleteDialog).toBeTrue()
    })

    it('should delete a item with confirmation', () => {
      apiServiceSpy.deleteHelp.and.returnValue(of(null))
      component['rawSearchResults'] = [...itemData]

      component.onDelete(items4Deletion[1]) // helpItem2: productName 'product2' — helpItem4 also has 'product1', not 'product2', so this is last of product2
      component.onDeleteConfirmation(items4Deletion) // remove and this was the last of the product

      expect(component.displayDeleteDialog).toBeFalse()
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.OK' })

      component['rawSearchResults'] = [...itemData]
      component.onDelete(items4Deletion[0]) // helpItem1: productName 'product1' — helpItem4 also has 'product1', so not last
      component.onDeleteConfirmation(items4Deletion) // remove but not the last of the product
    })

    it('should trigger usedListsTrigger$ when last item of product is deleted', () => {
      apiServiceSpy.deleteHelp.and.returnValue(of(null))
      // only one item with productName 'product2' so deleting it makes it the last
      component['rawSearchResults'] = [helpItem2]
      const triggerSpy = spyOn(component['usedListsTrigger$'], 'next')

      component.onDelete(helpItem2)
      component.onDeleteConfirmation([])

      expect(triggerSpy).toHaveBeenCalled()
    })

    it('should display error if deleting a item fails', () => {
      const errorResponse = { status: '400', statusText: 'Error on deletion' }
      apiServiceSpy.deleteHelp.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onDelete(items4Deletion[0])
      component.onDeleteConfirmation(items4Deletion)

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.NOK' })
      expect(console.error).toHaveBeenCalledWith('deleteHelp', errorResponse)
    })

    it('should reject confirmation if param was not set', () => {
      component.onDeleteConfirmation(items4Deletion)

      expect(apiServiceSpy.deleteHelp).not.toHaveBeenCalled()
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

  describe('formatUploadFileSize', () => {
    it('should format bytes below 1024 as B', () => {
      expect(component.formatUploadFileSize(0)).toBe('0B')
      expect(component.formatUploadFileSize(512)).toBe('512B')
      expect(component.formatUploadFileSize(1023)).toBe('1023B')
    })

    it('should format exactly 1 KB', () => {
      expect(component.formatUploadFileSize(1024)).toBe('1KB')
    })

    it('should format KB with one decimal when size < 10', () => {
      expect(component.formatUploadFileSize(1024 * 5)).toBe('5KB')
      expect(component.formatUploadFileSize(1024 * 9.5)).toBe('9.5KB')
    })

    it('should format large KB without decimal', () => {
      expect(component.formatUploadFileSize(1024 * 512)).toBe('512KB')
    })

    it('should format MB', () => {
      expect(component.formatUploadFileSize(1024 * 1024)).toBe('1MB')
      expect(component.formatUploadFileSize(1024 * 1024 * 5)).toBe('5MB')
      expect(component.formatUploadFileSize(1024 * 1024 * 500)).toBe('500MB')
    })

    it('should format GB', () => {
      expect(component.formatUploadFileSize(1024 * 1024 * 1024)).toBe('1GB')
      expect(component.formatUploadFileSize(1024 * 1024 * 1024 * 2)).toBe('2GB')
    })
  })

  describe('Language tests', () => {
    it('should use default format: English', () => {
      expect(component.dateFormat).toEqual('M/d/yy, h:mm a')
    })

    it('should set German date format', () => {
      mockUserService.lang$.getValue.and.returnValue('de')
      initTestComponent()
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm')
    })
  })
})
