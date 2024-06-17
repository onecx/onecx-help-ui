import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient, HttpErrorResponse, HttpEventType, HttpHeaders } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'

import { AppStateService, createTranslateLoader, Column, PortalMessageService } from '@onecx/portal-integration-angular'
import { HelpsInternalAPIService, Help, SearchHelpsRequestParams, Product } from 'src/app/shared/generated'
import { HelpSearchComponent } from './help-search.component'

describe('HelpSearchComponent', () => {
  let component: HelpSearchComponent
  let fixture: ComponentFixture<HelpSearchComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    searchHelps: jasmine.createSpy('searchHelps').and.returnValue(of({})),
    addHelpItem: jasmine.createSpy('addHelpItem').and.returnValue(of({})),
    deleteHelp: jasmine.createSpy('deleteHelp').and.returnValue(of({})),
    searchProductsByCriteria: jasmine.createSpy('searchProductsByCriteria').and.returnValue(of({}))
  }
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])

  const newHelpItemArr: Help[] | undefined = [
    {
      id: 'id',
      productName: 'help-mgmt-ui',
      itemId: 'PAGE_HELP_SEARCH'
    }
  ]

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpSearchComponent],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient, AppStateService]
          }
        })
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
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
  })

  it('should create component and set columns', () => {
    expect(component).toBeTruthy()
    expect(component.filteredColumns[0].field).toBe('productDisplayName')
    expect(component.filteredColumns[1].field).toBe('itemId')
    expect(component.filteredColumns[2].field).toBe('context')
    expect(component.filteredColumns[3].field).toBe('baseUrl')
    expect(component.filteredColumns[4].field).toBe('resourceUrl')
  })

  it('should call search OnInit and populate filteredColumns/actions correctly', () => {
    translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.LABEL': 'Create' }))
    component.columns = [
      {
        field: 'productName',
        header: 'APPLICATION_NAME',
        active: false
      },
      {
        field: 'context',
        header: 'CONTEXT',
        active: true
      }
    ]
    spyOn(component, 'search')

    component.ngOnInit()

    expect(component.search).toHaveBeenCalled()
    expect(component.filteredColumns[0].field).toEqual('context')
    expect(component.actions[0].label).toEqual('ACTIONS.CREATE.LABEL')
  })

  it('should correctly assign results if API call returns some data', () => {
    const helpPageResultMock = {
      totalElements: 0,
      number: 0,
      size: 0,
      totalPages: 0,
      stream: [
        {
          itemId: 'id',
          productName: 'help-mgmt-ui'
        }
      ]
    }
    apiServiceSpy.searchHelps.and.returnValue(of(helpPageResultMock))
    component.products = [
      { name: 'help-mgmt-ui', displayName: 'Help Mgmt UI' },
      { name: '2', displayName: '2dn' }
    ] as Product[]
    component.resultsForDisplay = []

    component.search({})

    expect(component.resultsForDisplay[0].productDisplayName).toEqual('Help Mgmt UI')
    expect(component.resultsForDisplay[0].itemId).toEqual('id')
  })

  it('should handle empty results on search', () => {
    const helpPageResultMock = {
      totalElements: 0,
      number: 0,
      size: 0,
      totalPages: 0,
      stream: []
    }
    apiServiceSpy.searchHelps.and.returnValue(of(helpPageResultMock))
    apiServiceSpy.searchProductsByCriteria.and.returnValue(of(helpPageResultMock))
    component.resultsForDisplay = []

    component.search({})

    expect(component.resultsForDisplay.length).toEqual(0)
    expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'HELP_SEARCH.NO_APPLICATION_AVAILABLE' })
  })

  it('should reuse criteria if reuseCriteria is true', () => {
    apiServiceSpy.searchHelps.and.returnValue(of([]))
    component.criteria = {
      helpSearchCriteria: {
        productName: 'help-mgmt-ui',
        itemId: 'id'
      }
    }
    const newCriteria = {
      helpSearchCriteria: {
        productName: 'ap-mgmt',
        itemId: 'newId'
      }
    }

    const reuseCriteria = true

    component.search(component.criteria.helpSearchCriteria, reuseCriteria)

    expect(component.criteria).not.toBe(newCriteria)
  })

  describe('searchHelps Error', () => {
    it('should handle 401 Exception result on search', () => {
      const helpPageResultMock: HttpErrorResponse = {
        status: 401,
        statusText: 'Not Found',
        name: 'HttpErrorResponse',
        message: '',
        error: undefined,
        ok: false,
        headers: new HttpHeaders(),
        url: null,
        type: HttpEventType.ResponseHeader
      }
      apiServiceSpy.searchHelps.and.returnValue(throwError(() => helpPageResultMock))
      component.resultsForDisplay = []

      component.search({})

      expect(component.exceptionKey).toBeDefined()
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_401.HELP_ITEM')
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'HELP_SEARCH.NO_APPLICATION_AVAILABLE' })
    })

    it('should handle 403 Exception result on search', () => {
      const helpPageResultMock: HttpErrorResponse = {
        status: 403,
        statusText: 'Not Found',
        name: 'HttpErrorResponse',
        message: '',
        error: undefined,
        ok: false,
        headers: new HttpHeaders(),
        url: null,
        type: HttpEventType.ResponseHeader
      }
      apiServiceSpy.searchHelps.and.returnValue(throwError(() => helpPageResultMock))
      component.resultsForDisplay = []

      component.search({})

      expect(component.exceptionKey).toBeDefined()
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_403.HELP_ITEM')
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'HELP_SEARCH.NO_APPLICATION_AVAILABLE' })
    })

    it('should handle 404 Exception result on search', () => {
      const helpPageResultMock: HttpErrorResponse = {
        status: 404,
        statusText: 'Not Found',
        name: 'HttpErrorResponse',
        message: '',
        error: undefined,
        ok: false,
        headers: new HttpHeaders(),
        url: null,
        type: HttpEventType.ResponseHeader
      }
      apiServiceSpy.searchHelps.and.returnValue(throwError(() => helpPageResultMock))
      component.resultsForDisplay = []

      component.search({})

      expect(component.exceptionKey).toBeDefined()
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_404.HELP_ITEM')
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'HELP_SEARCH.NO_APPLICATION_AVAILABLE' })
    })
  })

  it('should handle API call error', () => {
    apiServiceSpy.searchHelps.and.returnValue(throwError(() => new Error()))

    component.search({})

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'GENERAL.SEARCH.MSG_SEARCH_FAILED' })
  })

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
    apiServiceSpy.deleteHelp.and.returnValue(throwError(() => new Error()))
    component.resultsForDisplay = newHelpItemArr
    component.helpItem = {
      id: newHelpItemArr[0].id,
      productName: newHelpItemArr[0].productName,
      itemId: newHelpItemArr[0].itemId
    }

    component.onDeleteConfirmation()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_NOK' })
  })

  it('should set correct values onSearch', () => {
    spyOn(component, 'search')
    component.onSearch()

    expect(component.changeMode).toEqual('NEW')
    expect(component.productsChanged).toBeTrue()
    expect(component.search).toHaveBeenCalled()
  })

  it('should set correct values onCreate', () => {
    component.onCreate()

    expect(component.changeMode).toEqual('NEW')
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
    expect(component.changeMode).toEqual('NEW')
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

  it('should update filteredColumns onColumnsChange', () => {
    const columns: Column[] = [
      {
        field: 'productDisplayName',
        header: 'APPLICATION_NAME'
      },
      {
        field: 'context',
        header: 'CONTEXT'
      }
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

  it('should call onCreate when actionCallback is executed', () => {
    translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.LABEL': 'Create' }))
    spyOn(component, 'onCreate')
    component.ngOnInit()

    const action = component.actions[0]
    action.actionCallback()

    expect(component.onCreate).toHaveBeenCalled()
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
