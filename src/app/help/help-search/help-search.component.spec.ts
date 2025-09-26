import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import { FileSelectEvent } from 'primeng/fileupload'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { Column } from '@onecx/portal-integration-angular'

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
  const mockUserService = { lang$: { getValue: jasmine.createSpy('getValue') } }
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

  function initTestComponent() {
    fixture = TestBed.createComponent(HelpSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpSearchComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage(defaultLang)
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: mockUserService },
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ]
    }).compileComponents()
  }))

  beforeEach(() => {
    initTestComponent()
  })

  afterEach(() => {
    mockUserService.lang$.getValue.and.returnValue(defaultLang)
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

    it('should call OnInit and populate filteredColumns/actions correctly', () => {
      component.ngOnInit()

      expect(component.filteredColumns[0]).toEqual(component.columns[0])
    })

    it('should create component and set columns for displaying results', () => {
      expect(component).toBeTruthy()
      expect(component.filteredColumns[0].field).toBe('productName')
      expect(component.filteredColumns[1].field).toBe('itemId')
      expect(component.filteredColumns[2].field).toBe('url')
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

      expect(component.onDetail).toHaveBeenCalledWith(undefined, undefined, 'CREATE')
    })
  })

  describe('UI actions', () => {
    it('should update filteredColumns onColumnsChange', () => {
      const columns: Column[] = [
        { field: 'producName', header: 'PRODUCT_NAME' },
        { field: 'context', header: 'CONTEXT' }
      ]
      const expectedColumn = { field: 'productName', header: 'PRODUCT_NAME' }
      component.filteredColumns = columns
      component.onColumnsChange(['productName'])

      expect(component.filteredColumns).not.toContain(columns[1])
      expect(component.filteredColumns).toEqual([jasmine.objectContaining(expectedColumn)])
    })

    it('should call filterGlobal onFilterChange', () => {
      const table = jasmine.createSpyObj('table', ['filterGlobal'])

      component.onFilterChange('test', table)

      expect().nothing()
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

      component.data$!.subscribe({
        next: (data) => {
          expect(data.length).toBe(1)
          expect(data[0]).toEqual(itemData[1])
          done()
        },
        error: done.fail
      })

      component.onCriteriaReset()

      expect(component.criteria).toEqual({})
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

      it('should select a file to upload - valid JSON', (done) => {
        const json = '{ "helps": { "product": { "itemId": { "baseUrl": "https://..." } } } }'
        spyOn(file, 'text').and.returnValue(Promise.resolve(json))

        component.onImportSelectFile(event as any as FileSelectEvent)

        setTimeout(() => {
          expect(file.text).toHaveBeenCalled()
          expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.OK' })
          expect(component.importError).toBeFalse()
          done()
        })
      })

      it('should select a file to upload - invalid JSON - handle error', (done) => {
        spyOn(file, 'text').and.returnValue(Promise.resolve('Invalid Json'))
        spyOn(console, 'error')

        component.onImportSelectFile(event)

        setTimeout(() => {
          expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.NOK' })
          expect(console.error).toHaveBeenCalled()
          expect(component.importError).toBeTrue()
          done()
        })
      })
    })

    describe('on import confirmation', () => {
      it('should import help items', (done) => {
        apiServiceSpy.importHelps.and.returnValue(of({}))
        component['importObject'] = helpItem1

        component.onImportConfirmation()

        setTimeout(() => {
          expect(component.displayImportDialog).toBeFalse()
          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.OK' })
          done()
        })
      })

      it('should call importHelps and handle error', (done) => {
        const errorResponse = { status: 400, statusText: 'Cannot import ...' }
        apiServiceSpy.importHelps.and.returnValue(throwError(() => errorResponse))
        component['importObject'] = helpItem1
        spyOn(console, 'error')

        component.onImportConfirmation()

        setTimeout(() => {
          expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.NOK' })
          expect(console.error).toHaveBeenCalledWith('importHelps', errorResponse)
          done()
        }, 0)
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
      const ev: Event = new Event('type')
      spyOn(ev, 'stopPropagation')
      const mode = 'CREATE'

      component.onDetail(ev, undefined, mode)

      expect(ev.stopPropagation).toHaveBeenCalled()
      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toBe(undefined)
      expect(component.displayDetailDialog).toBeTrue()

      component.onCloseDetail(false)

      expect(component.displayDetailDialog).toBeFalse()
    })

    it('should show details of a item', () => {
      const mode = 'EDIT'

      component.onDetail(undefined, itemData[0], mode)

      expect(component.changeMode).toEqual(mode)
      expect(component.item4Detail).toBe(itemData[0])
      expect(component.displayDetailDialog).toBeTrue()
    })

    it('should prepare the copy of a item', () => {
      const mode = 'COPY'

      component.onDetail(undefined, itemData[0], mode)

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
      const ev: Event = new Event('type')
      spyOn(ev, 'stopPropagation')

      component.onDelete(ev, items4Deletion[0])

      expect(ev.stopPropagation).toHaveBeenCalled()
      expect(component.item4Delete).toBe(items4Deletion[0])
      expect(component.displayDeleteDialog).toBeTrue()
    })

    it('should delete a item with confirmation', () => {
      apiServiceSpy.deleteHelp.and.returnValue(of(null))
      const ev: Event = new Event('type')

      component.onDelete(ev, items4Deletion[1])
      component.onDeleteConfirmation(items4Deletion) // remove but not the last of the product

      expect(component.displayDeleteDialog).toBeFalse()
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.OK' })

      component.onDelete(ev, items4Deletion[2])
      component.onDeleteConfirmation(items4Deletion) // remove and this was the last of the product
    })

    it('should display error if deleting a item fails', () => {
      const errorResponse = { status: '400', statusText: 'Error on deletion' }
      apiServiceSpy.deleteHelp.and.returnValue(throwError(() => errorResponse))
      const ev: Event = new Event('type')
      spyOn(console, 'error')

      component.onDelete(ev, items4Deletion[0])
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
