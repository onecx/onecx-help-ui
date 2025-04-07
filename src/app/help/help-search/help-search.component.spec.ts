import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import { FileSelectEvent } from 'primeng/fileupload'

import { createTranslateLoader } from '@onecx/angular-utils'
import { Column, PortalMessageService } from '@onecx/portal-integration-angular'

import { HelpsInternalAPIService, Help, SearchHelpsRequestParams, Product } from 'src/app/shared/generated'
import { HelpSearchComponent } from './help-search.component'

const helpItem: Help = {
  itemId: 'id',
  productName: 'onecx-help',
  baseUrl: 'baseUrl'
}

describe('HelpSearchComponent', () => {
  let component: HelpSearchComponent
  let fixture: ComponentFixture<HelpSearchComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    searchHelps: jasmine.createSpy('searchHelps').and.returnValue(of({})),
    addHelpItem: jasmine.createSpy('addHelpItem').and.returnValue(of({})),
    deleteHelp: jasmine.createSpy('deleteHelp').and.returnValue(of({})),
    importHelps: jasmine.createSpy('importHelps').and.returnValue(of({})),
    exportHelps: jasmine.createSpy('exportHelps').and.returnValue(of({})),
    searchProductsByCriteria: jasmine.createSpy('searchProductsByCriteria').and.returnValue(of({}))
  }
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])

  const newHelpItemArr: Help[] | undefined = [
    {
      id: 'id',
      productName: 'ocx-help-ui',
      itemId: 'PAGE_HELP_SEARCH'
    }
  ]

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpSearchComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpSearchComponent)
    component = fixture.componentInstance
    component.helpItem = { id: '', itemId: '' }
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    apiServiceSpy.searchHelps.calls.reset()
    apiServiceSpy.addHelpItem.calls.reset()
    apiServiceSpy.deleteHelp.calls.reset()
    apiServiceSpy.importHelps.calls.reset()
    apiServiceSpy.exportHelps.calls.reset()
    apiServiceSpy.searchProductsByCriteria.calls.reset()
    // reset response data of used calls
    apiServiceSpy.searchHelps.and.returnValue(of({}))
    apiServiceSpy.deleteHelp.and.returnValue(of({}))
    apiServiceSpy.importHelps.and.returnValue(of({}))
    apiServiceSpy.exportHelps.and.returnValue(of({}))
    apiServiceSpy.searchProductsByCriteria.and.returnValue(of({}))
  })

  it('should create component and set columns for displaying results', () => {
    expect(component).toBeTruthy()
    expect(component.filteredColumns[0].field).toBe('productDisplayName')
    expect(component.filteredColumns[1].field).toBe('itemId')
    expect(component.filteredColumns[2].field).toBe('url')
    //expect(component.filteredColumns[2].field).toBe('baseUrl')
    //expect(component.filteredColumns[3].field).toBe('resourceUrl')
    //expect(component.filteredColumns[4].field).toBe('context')
  })

  describe('ngOnInit', () => {
    it('should call search OnInit and populate filteredColumns/actions correctly', () => {
      translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.LABEL': 'Create' }))
      component.columns = [
        { field: 'productName', header: 'APPLICATION_NAME', active: false },
        { field: 'context', header: 'CONTEXT', active: true }
      ]
      spyOn(component, 'search')

      component.ngOnInit()

      expect(component.search).toHaveBeenCalled()
      expect(component.filteredColumns[0].field).toEqual('context')
    })

    it('should process products onInit', () => {
      const helpPageResultMock = {
        totalElements: 0,
        number: 0,
        size: 0,
        totalPages: 0,
        stream: [
          {
            itemId: 'id',
            productName: 'ocx-help-ui'
          }
        ]
      }
      apiServiceSpy.searchProductsByCriteria.and.returnValue(of(helpPageResultMock))
      component.products = [
        { name: 'ocx-help-ui', displayName: 'OneCX Help UI' },
        { name: '2', displayName: '2dn' }
      ] as Product[]
      spyOn(component, 'search')

      component.ngOnInit()

      expect(component.productsLoaded).toBeTrue()
    })
  })

  describe('search - Success', () => {
    it('should correctly assign results if API call returns some data', () => {
      const helpPageResultMock = {
        totalElements: 0,
        number: 0,
        size: 0,
        totalPages: 0,
        stream: [
          {
            itemId: 'id',
            productName: 'ocx-help-ui'
          }
        ]
      }
      apiServiceSpy.searchHelps.and.returnValue(of(helpPageResultMock))
      component.products = [
        { name: 'ocx-help-ui', displayName: 'OneCX Help UI' },
        { name: '2', displayName: '2dn' }
      ] as Product[]
      component.resultsForDisplay = []

      component.search({})

      expect(component.resultsForDisplay[0].productDisplayName).toEqual('OneCX Help UI')
      expect(component.resultsForDisplay[0].itemId).toEqual('id')
    })

    it('should handle empty results on search', () => {
      const emptyResponse = {
        totalElements: 0,
        number: 0,
        size: 0,
        totalPages: 0,
        stream: []
      }
      apiServiceSpy.searchHelps.and.returnValue(of(emptyResponse))
      apiServiceSpy.searchProductsByCriteria.and.returnValue(of(emptyResponse))
      component.resultsForDisplay = []

      component.search({})

      expect(component.resultsForDisplay.length).toEqual(0)
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
    })

    it('should reuse criteria if reuseCriteria is true', () => {
      apiServiceSpy.searchHelps.and.returnValue(of([]))
      component.criteria = { helpSearchCriteria: { productName: 'ocx-help-ui', itemId: 'id' } }
      const newCriteria = { helpSearchCriteria: { productName: 'ap-mgmt', itemId: 'newId' } }
      const reuseCriteria = true

      component.search(component.criteria.helpSearchCriteria, reuseCriteria)

      expect(component.criteria).not.toBe(newCriteria)
    })

    it('should set productName and itemId as undefined if criteria strings empty', () => {
      const criteria: SearchHelpsRequestParams = {
        helpSearchCriteria: {
          productName: '',
          itemId: ''
        }
      }
      const reuseCriteria = false

      component.search(criteria.helpSearchCriteria, reuseCriteria)

      expect(component.criteria.helpSearchCriteria.productName).not.toBeDefined()
      expect(component.criteria.helpSearchCriteria.itemId).not.toBeDefined()
    })
  })

  describe('search - Error', () => {
    it('should handle 401 Exception result on search', () => {
      const errorResponse = { status: 404, statusText: 'Not Found' }
      apiServiceSpy.searchHelps.and.returnValue(throwError(() => errorResponse))
      component.resultsForDisplay = []
      spyOn(console, 'error')

      component.search({})

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.SEARCH_FAILED' })
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.HELP_ITEM')
      expect(console.error).toHaveBeenCalledWith('searchHelps', errorResponse)
    })
  })

  describe('delete', () => {
    it('should delete help item', () => {
      apiServiceSpy.deleteHelp({ productName: newHelpItemArr[0].productName, itemId: newHelpItemArr[0].id })
      component.resultsForDisplay = newHelpItemArr
      component.helpItem = {
        id: newHelpItemArr[0].id,
        productName: newHelpItemArr[0].productName,
        itemId: newHelpItemArr[0].itemId
      }

      component.onDeleteConfirmation()

      expect(apiServiceSpy.deleteHelp).toHaveBeenCalled()
      expect(component.resultsForDisplay.length).toBe(0)
      expect(component.resultsForDisplay.length).toBe(0)
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_OK' })
    })

    it('should display error on deleteHelpItem failure', () => {
      const errorResponse = { status: 400, statusText: 'Cannot delete ...' }
      apiServiceSpy.deleteHelp.and.returnValue(throwError(() => errorResponse))
      component.resultsForDisplay = newHelpItemArr
      component.helpItem = {
        id: newHelpItemArr[0].id,
        productName: newHelpItemArr[0].productName,
        itemId: newHelpItemArr[0].itemId
      }
      spyOn(console, 'error')

      component.onDeleteConfirmation()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_NOK' })
      expect(console.error).toHaveBeenCalledWith('deleteHelp', errorResponse)
    })
  })

  /*
   * UI ACTIONS
   */
  describe('UI actions', () => {
    it('should set correct values onSearch', () => {
      spyOn(component, 'search')

      component.onSearch()

      expect(component.changeMode).toEqual('CREATE')
      expect(component.productsChanged).toBeTrue()
      expect(component.search).toHaveBeenCalled()
    })

    it('should set correct values onCreate', () => {
      component.onCreate()

      expect(component.changeMode).toEqual('CREATE')
      expect(component.productsChanged).toBeFalse()
      expect(component.helpItem).toBe(undefined)
      expect(component.displayDetailDialog).toBeTrue()
    })

    it('should set correct values onDetail', () => {
      const ev: MouseEvent = new MouseEvent('type')
      spyOn(ev, 'stopPropagation')
      const mode = 'EDIT'
      component.onDetail(ev, newHelpItemArr[0], mode)

      expect(ev.stopPropagation).toHaveBeenCalled()
      expect(component.changeMode).toEqual(mode)
      expect(component.productsChanged).toBeFalse()
      expect(component.helpItem).toBe(newHelpItemArr[0])
      expect(component.displayDetailDialog).toBeTrue()
    })

    it('should set correct values onCopy', () => {
      const ev: MouseEvent = new MouseEvent('type')
      spyOn(ev, 'stopPropagation')
      component.onCopy(ev, newHelpItemArr[0])

      expect(ev.stopPropagation).toHaveBeenCalled()
      expect(component.changeMode).toEqual('CREATE')
      expect(component.productsChanged).toBeFalse()
      expect(component.helpItem).toBe(newHelpItemArr[0])
      expect(component.displayDetailDialog).toBeTrue()
    })

    it('should set correct values onDelete', () => {
      const ev: MouseEvent = new MouseEvent('type')
      spyOn(ev, 'stopPropagation')
      component.onDelete(ev, newHelpItemArr[0])

      expect(ev.stopPropagation).toHaveBeenCalled()
      expect(component.productsChanged).toBeFalse()
      expect(component.helpItem).toBe(newHelpItemArr[0])
      expect(component.displayDeleteDialog).toBeTrue()
    })

    it('should update filteredColumns onColumnsChange', () => {
      const columns: Column[] = [
        { field: 'productDisplayName', header: 'APPLICATION_NAME' },
        { field: 'context', header: 'CONTEXT' }
      ]
      const expectedColumn = { field: 'productDisplayName', header: 'APPLICATION_NAME' }
      component.filteredColumns = columns
      component.onColumnsChange(['productDisplayName'])

      expect(component.filteredColumns).not.toContain(columns[1])
      expect(component.filteredColumns).toEqual([jasmine.objectContaining(expectedColumn)])
    })

    it('should call filterGlobal onFilterChange', () => {
      component.table = jasmine.createSpyObj('table', ['filterGlobal'])
      component.onFilterChange('test')

      expect(component.table.filterGlobal).toHaveBeenCalledWith('test', 'contains')
    })

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
      spyOn(component, 'onCreate')

      component.ngOnInit()
      component.actions$?.subscribe((action) => {
        action[0].actionCallback()
      })

      expect(component.onCreate).toHaveBeenCalled()
    })
  })

  /*
   * IMPORT
   */
  it('should display import dialog when import button is clicked', () => {
    component.displayImportDialog = false

    component.onImport()

    expect(component.displayImportDialog).toBeTrue()
  })

  describe('onSelect', () => {
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

    it('should select a file to upload', (done) => {
      spyOn(file, 'text').and.returnValue(
        Promise.resolve('{ "itemId": "id", "productName": "onecx-help", "baseUrl": "baseUrl" }')
      )

      component.onSelect(event as any as FileSelectEvent)

      setTimeout(() => {
        expect(file.text).toHaveBeenCalled()
        expect(component.importHelpItem).toEqual(helpItem)
        done()
      })
    })

    it('should handle JSON parse error', (done) => {
      spyOn(file, 'text').and.returnValue(Promise.resolve('Invalid Json'))
      spyOn(console, 'error')

      component.onSelect(event)

      setTimeout(() => {
        expect(console.error).toHaveBeenCalled()
        expect(component.importError).toBeTrue()
        expect(component.validationErrorCause).toBe('')
        done()
      })
    })
  })

  it('should reset errors when clear button is clicked', () => {
    component.importError = true
    component.validationErrorCause = 'Some error'

    component.onClear()

    expect(component.importError).toBeFalse()
    expect(component.validationErrorCause).toBe('')
  })

  describe('onImportConfirmation', () => {
    it('should import help items', (done) => {
      apiServiceSpy.importHelps.and.returnValue(of({}))
      component.importHelpItem = helpItem

      component.onImportConfirmation()

      setTimeout(() => {
        expect(component.displayImportDialog).toBeFalse()
        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.HELP_ITEM.IMPORT_OK' })
        done()
      })
    })

    it('should call importHelps and handle error', (done) => {
      const errorResponse = { status: 400, statusText: 'Cannot import ...' }
      apiServiceSpy.importHelps.and.returnValue(throwError(() => errorResponse))
      component.importHelpItem = helpItem
      spyOn(console, 'error')

      component.onImportConfirmation()

      setTimeout(() => {
        expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.HELP_ITEM.IMPORT_NOK' })
        expect(console.error).toHaveBeenCalledWith('importHelps', errorResponse)
        done()
      }, 0)
    })

    it('should not call importHelps if importHelpItem is not defined', () => {
      component.importHelpItem = null

      component.onImportConfirmation()

      expect(apiServiceSpy.importHelps).not.toHaveBeenCalled()
    })
  })

  it('should validate a file', () => {
    component.importError = false

    expect(component.isFileValid()).toBeTrue()
  })

  it('should close displayImportDialog', () => {
    component.displayImportDialog = true

    component.onCloseImportDialog()

    expect(component.displayImportDialog).toBeFalse()
  })

  /*
   * EXPORT
   */
  it('should display export dialog', () => {
    component.resultsForDisplay = [
      { productName: 'B', itemId: '2' },
      { productName: 'A', itemId: '1' }
    ]

    component.onExport()

    expect(component.displayExportDialog).toBeTrue()
  })

  describe('onExportConfirmation', () => {
    it('should export help items', () => {
      apiServiceSpy.exportHelps.and.returnValue(of(helpItem))
      const selectedNames = ['Product1', 'Product2']
      component.selectedProductNames = selectedNames
      component.products = [{ name: 'ocx-help-ui', displayName: 'Product1' }, { name: '2' }] as Product[]

      component.onExportConfirmation()

      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.HELP_ITEM.EXPORT_OK' })
    })

    it('should display error msg when export fails', () => {
      const errorResponse = { status: 400, statusText: 'Cannot export ...' }
      apiServiceSpy.exportHelps.and.returnValue(throwError(() => errorResponse))
      const selectedNames = ['Product1', 'Product2']
      component.selectedProductNames = selectedNames
      spyOn(console, 'error')

      component.onExportConfirmation()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.HELP_ITEM.EXPORT_NOK' })
      expect(console.error).toHaveBeenCalledWith('exportHelps', errorResponse)
    })
  })

  it('should reset displayExportDialog, selectedResults, and selectedProductNames', () => {
    component.displayExportDialog = true
    component.selectedProductNames = ['Product1']

    component.onCloseExportDialog()

    expect(component.displayExportDialog).toBeFalse()
    expect(component.selectedProductNames).toEqual([])
  })

  /*
   * SORTING
   */
  describe('sortHelpItemsByDefault', () => {
    it('should correctly sort productNames using sortHelpItemsByDefault 1', () => {
      component.resultsForDisplay = [
        { productName: 'B', itemId: '2' },
        { productName: 'A', itemId: '1' }
      ]
      component.resultsForDisplay.sort(component['sortHelpItemByDefault'])

      expect(component.resultsForDisplay).toEqual([
        { productName: 'A', itemId: '1' },
        { productName: 'B', itemId: '2' }
      ])
    })

    it('should correctly sort productNames using sortHelpItemsByDefault 2', () => {
      component.resultsForDisplay = [
        { productName: '', itemId: '1' },
        { productName: 'A', itemId: '2' }
      ]
      component.resultsForDisplay.sort(component['sortHelpItemByDefault'])

      expect(component.resultsForDisplay).toEqual([
        { productName: '', itemId: '1' },
        { productName: 'A', itemId: '2' }
      ])
    })

    it('should correctly sort productNames using sortHelpItemsByDefault 3', () => {
      component.resultsForDisplay = [
        { productName: 'A', itemId: '2' },
        { productName: '', itemId: '1' }
      ]
      component.resultsForDisplay.sort(component['sortHelpItemByDefault'])

      expect(component.resultsForDisplay).toEqual([
        { productName: '', itemId: '1' },
        { productName: 'A', itemId: '2' }
      ])
    })

    it('should correctly sort productNames using sortHelpItemsByDefault 4', () => {
      component.resultsForDisplay = [
        { productName: 'A', itemId: '' },
        { productName: 'A', itemId: '2' },
        { productName: 'A', itemId: '1' },
        { productName: '', itemId: '1' },
        { productName: '', itemId: '2' },
        { productName: '', itemId: '' }
      ]
      component.resultsForDisplay.sort(component['sortHelpItemByDefault'])

      expect(component.resultsForDisplay).toEqual([
        { productName: '', itemId: '' },
        { productName: '', itemId: '1' },
        { productName: '', itemId: '2' },
        { productName: 'A', itemId: '' },
        { productName: 'A', itemId: '1' },
        { productName: 'A', itemId: '2' }
      ])
    })

    it('should correctly sort itemIds using sortHelpItemsByDefault', () => {
      component.resultsForDisplay = [
        { productName: 'A', itemId: '2' },
        { productName: 'A', itemId: '1' }
      ]
      component.resultsForDisplay.sort(component['sortHelpItemByDefault'])

      expect(component.resultsForDisplay).toEqual([
        { productName: 'A', itemId: '1' },
        { productName: 'A', itemId: '2' }
      ])
    })
  })

  it('should sort products', () => {
    const products = [{ displayName: 'A' }, { displayName: 'B' }] as Product[]

    expect(component['sortProductsByName'](products[0], products[1])).toBeLessThan(0)
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
})
