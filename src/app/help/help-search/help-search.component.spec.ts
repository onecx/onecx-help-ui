import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'

import { Column, PortalMessageService } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'
import { HelpSearchComponent } from './help-search.component'
import { HelpsInternalAPIService, Help, SearchHelpsRequestParams } from '../../generated'

describe('HelpSearchComponent', () => {
  let component: HelpSearchComponent
  let fixture: ComponentFixture<HelpSearchComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    getHelpItemsForAllApps: jasmine.createSpy('getHelpItemsForAllApps').and.returnValue(of({})),
    addHelpItem: jasmine.createSpy('addHelpItem').and.returnValue(of({})),
    deleteHelpItemById: jasmine.createSpy('deleteHelpItemById').and.returnValue(of({}))
  }
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])

  const newHelpItemArr: Help[] | undefined = [
    {
      id: 'id',
      appId: 'help-mgmt-ui',
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
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
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
    apiServiceSpy.getHelpItemsForAllApps.calls.reset()
    apiServiceSpy.addHelpItem.calls.reset()
    apiServiceSpy.deleteHelpItemById.calls.reset()
  })

  it('should create component and set columns', () => {
    expect(component).toBeTruthy()
    expect(component.filteredColumns[0].field).toBe('appId')
    expect(component.filteredColumns[1].field).toBe('itemId')
    expect(component.filteredColumns[2].field).toBe('context')
    expect(component.filteredColumns[3].field).toBe('baseUrl')
    expect(component.filteredColumns[4].field).toBe('resourceUrl')
  })

  it('should call search OnInit and populate filteredColumns/actions correctly', () => {
    translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.LABEL': 'Create' }))
    component.columns = [
      {
        field: 'appId',
        header: 'APPLICATION_ID',
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
    apiServiceSpy.getHelpItemsForAllApps.and.returnValue(of([{ appId: 'help-mgmt-ui', itemId: 'id' }]))
    component.results = []

    component.search({
      helpSearchCriteria: {}
    })

    expect(component.results[0]).toEqual({ appId: 'help-mgmt-ui', itemId: 'id' })
  })

  it('should handle empty results on search', () => {
    apiServiceSpy.getHelpItemsForAllApps.and.returnValue(of([]))
    component.results = []

    component.search({
      helpSearchCriteria: {}
    })

    expect(component.results.length).toEqual(0)
    expect(msgServiceSpy.info).toHaveBeenCalledOnceWith({ summaryKey: 'GENERAL.SEARCH.MSG_NO_RESULTS' })
  })

  it('should reuse criteria if reuseCriteria is true', () => {
    apiServiceSpy.getHelpItemsForAllApps.and.returnValue(of([]))
    component.criteria = {
      helpSearchCriteria: {
        appId: 'help-mgmt-ui',
        itemId: 'id'
      }
    }
    const newCriteria = {
      helpSearchCriteria: {
        appId: 'ap-mgmt',
        itemId: 'newId'
      }
    }

    const reuseCriteria = true

    component.search(component.criteria, reuseCriteria)

    expect(component.criteria).not.toBe(newCriteria)
  })

  it('should handle API call error', () => {
    apiServiceSpy.getHelpItemsForAllApps.and.returnValue(throwError(() => new Error()))

    component.search({
      helpSearchCriteria: {}
    })

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'GENERAL.SEARCH.MSG_SEARCH_FAILED' })
  })

  it('should delete help item', () => {
    apiServiceSpy.deleteHelpItemById({ appId: newHelpItemArr[0].appId, itemId: newHelpItemArr[0].id })
    component.results = newHelpItemArr
    component.helpItem = {
      id: newHelpItemArr[0].id,
      appId: newHelpItemArr[0].appId,
      itemId: newHelpItemArr[0].itemId
    }

    component.onDeleteConfirmation()

    expect(apiServiceSpy.deleteHelpItemById).toHaveBeenCalled()
    expect(component.results.length).toBe(0)
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_OK' })
  })

  it('should display error on deleteHelpItem failure', () => {
    apiServiceSpy.deleteHelpItemById.and.returnValue(throwError(() => new Error()))
    component.results = newHelpItemArr
    component.helpItem = {
      id: newHelpItemArr[0].id,
      appId: newHelpItemArr[0].appId,
      itemId: newHelpItemArr[0].itemId
    }

    component.onDeleteConfirmation()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_NOK' })
  })

  it('should set correct values onSearch', () => {
    spyOn(component, 'search')
    component.onSearch()

    expect(component.changeMode).toEqual('NEW')
    expect(component.appsChanged).toBeTrue()
    expect(component.search).toHaveBeenCalled()
  })

  it('should set correct values onCreate', () => {
    component.onCreate()

    expect(component.changeMode).toEqual('NEW')
    expect(component.appsChanged).toBeFalse()
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
    expect(component.appsChanged).toBeFalse()
    expect(component.helpItem).toBe(newHelpItemArr[0])
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should set correct values onCopy', () => {
    const ev: MouseEvent = new MouseEvent('type')
    spyOn(ev, 'stopPropagation')
    component.onCopy(ev, newHelpItemArr[0])

    expect(ev.stopPropagation).toHaveBeenCalled()
    expect(component.changeMode).toEqual('NEW')
    expect(component.appsChanged).toBeFalse()
    expect(component.helpItem).toBe(newHelpItemArr[0])
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should set correct values onDelete', () => {
    const ev: MouseEvent = new MouseEvent('type')
    spyOn(ev, 'stopPropagation')
    component.onDelete(ev, newHelpItemArr[0])

    expect(ev.stopPropagation).toHaveBeenCalled()
    expect(component.appsChanged).toBeFalse()
    expect(component.helpItem).toBe(newHelpItemArr[0])
    expect(component.displayDeleteDialog).toBeTrue()
  })

  it('should correctly sort appIds using sortHelpItemsByDefault', () => {
    component.results = [
      { appId: 'B', itemId: '2' },
      { appId: 'A', itemId: '1' }
    ]
    component.results.sort(component['sortHelpItemByDefault'])

    expect(component.results).toEqual([
      { appId: 'A', itemId: '1' },
      { appId: 'B', itemId: '2' }
    ])
  })

  it('should correctly sort itemIds using sortHelpItemsByDefault', () => {
    component.results = [
      { appId: 'A', itemId: '2' },
      { appId: 'A', itemId: '1' }
    ]
    component.results.sort(component['sortHelpItemByDefault'])

    expect(component.results).toEqual([
      { appId: 'A', itemId: '1' },
      { appId: 'A', itemId: '2' }
    ])
  })

  it('should update filteredColumns onColumnsChange', () => {
    const columns: Column[] = [
      {
        field: 'appId',
        header: 'APPLICATION_ID'
      },
      {
        field: 'context',
        header: 'CONTEXT'
      }
    ]
    const expectedColumn = { field: 'appId', header: 'APPLICATION_ID' }
    component.filteredColumns = columns
    component.onColumnsChange(['appId'])

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

  it('should set appId and itemId as undefined if criteria strings empty', () => {
    const criteria: SearchHelpsRequestParams = {
      helpSearchCriteria: {
        appId: '',
        itemId: ''
      }
    }
    const reuseCriteria = false

    component.search(criteria, reuseCriteria)

    expect(component.criteria.helpSearchCriteria.appId).not.toBeDefined()
    expect(component.criteria.helpSearchCriteria.itemId).not.toBeDefined()
  })
})
