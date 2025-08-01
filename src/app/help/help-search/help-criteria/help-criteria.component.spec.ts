import { NO_ERRORS_SCHEMA, SimpleChange, EventEmitter } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpSearchCriteria, HelpsInternalAPIService, Product } from 'src/app/shared/generated'
import { HelpCriteriaComponent, HelpCriteriaForm } from './help-criteria.component'

describe('HelpDetailComponent', () => {
  let component: HelpCriteriaComponent
  let fixture: ComponentFixture<HelpCriteriaComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error', 'info'])
  const formGroupSpy = jasmine.createSpyObj<FormGroup<HelpCriteriaForm>>('HelpCriteriaGroup', ['reset'])
  const criteriaEmitterSpy = jasmine.createSpyObj<EventEmitter<HelpSearchCriteria>>('EventEmitter', ['emit'])
  const apiServiceSpy = {
    getAllProductsWithHelpItems: jasmine.createSpy('getAllProductsWithHelpItems').and.returnValue(of([]))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpCriteriaComponent],
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
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy }
      ]
    }).compileComponents()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpCriteriaComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should update productNames OnInit', () => {
    component.productsChanged = true
    component.products = [
      { name: '1', displayName: '1dn' },
      { name: '2', displayName: '2dn' }
    ] as Product[]
    const mockHelpProductNames = {
      ProductNames: ['1', '2']
    }
    apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of(mockHelpProductNames))
    component.ngOnInit()

    expect(component.productDisplayNames).toEqual(['1dn', '2dn'])
  })

  it('should update productNames OnChanges if productsChanged', () => {
    component.productsChanged = true
    component.products = [
      { name: '1', displayName: '1dn' },
      { name: '2', displayName: '2dn' }
    ] as Product[]
    const mockHelpProductNames = {
      ProductNames: ['1', '2']
    }
    component.productDisplayNames = []
    apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of(mockHelpProductNames))

    component.ngOnChanges({
      productsChanged: new SimpleChange(false, true, false)
    })

    expect(component.productDisplayNames).toEqual(['1dn', '2dn'])
  })

  it('should filter products', () => {
    const notFiltered: string[] = ['filteredItem', 'unfilteredItem']
    component.productDisplayNames = notFiltered
    const event = { query: 'filteredItem' }

    component.filterProductNames(event)

    expect(component.productDisplayNamesFiltered[0]).toEqual('filteredItem')
  })

  it('should reset criteria', () => {
    component.helpCriteriaGroup = formGroupSpy

    component.resetCriteria()

    expect(component.helpCriteriaGroup.reset).toHaveBeenCalled()
  })

  it('should submit criteria', () => {
    component.criteriaEmitter = criteriaEmitterSpy
    component.helpCriteriaGroup = new FormGroup<HelpCriteriaForm>({
      productName: new FormControl('Help Management UI'),
      itemId: new FormControl('PAGE_HELP_SEARCH')
    })
    component.products = [
      { name: '1', displayName: '1dn' },
      { name: 'help-mgmt-ui', displayName: 'Help Management UI' }
    ] as Product[]

    component.submitCriteria()

    const expectedValue = component.helpCriteriaGroup.value
    expectedValue.productName = 'help-mgmt-ui'
    expect(criteriaEmitterSpy.emit).toHaveBeenCalledWith(component.helpCriteriaGroup.value as HelpSearchCriteria)
  })

  it('should display error on invalid criteria', () => {
    component.helpCriteriaGroup = new FormGroup<HelpCriteriaForm>({
      productName: new FormControl('', Validators.required),
      itemId: new FormControl('', Validators.required)
    })

    component.submitCriteria()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELP_SEARCH.MSG_SEARCH_VALIDATION' })
  })

  it('should display info when no productNames available', () => {
    apiServiceSpy.getAllProductsWithHelpItems.and.returnValue(of([]))

    component.loadAllProductsWithHelpItems()

    expect(msgServiceSpy.info).not.toHaveBeenCalled()
  })
})
