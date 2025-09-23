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
        { provide: PortalMessageService, useValue: msgServiceSpy }
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
    component.usedProducts = [
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
    component.usedProducts = [
      { name: '1', displayName: '1dn' },
      { name: '2', displayName: '2dn' }
    ] as Product[]
    const mockHelpProductNames = {
      ProductNames: ['1', '2']
    }

    component.ngOnChanges({
      productsChanged: new SimpleChange(false, true, false)
    })

    expect(component.productDisplayNames).toEqual(['1dn', '2dn'])
  })

  it('should filter usedProducts', () => {
    const notFiltered: string[] = ['filteredItem', 'unfilteredItem']
    component.productDisplayNames = notFiltered
    const event = { query: 'filteredItem' }

    component.filterProductNames(event)

    expect(component.productDisplayNamesFiltered[0]).toEqual('filteredItem')
  })

  it('should reset criteria', () => {
    component.criteriaForm = formGroupSpy

    component.onResetCriteria()

    expect(component.criteriaForm.reset).toHaveBeenCalled()
  })

  it('should submit criteria', () => {
    component.criteriaEmitter = criteriaEmitterSpy
    component.criteriaForm = new FormGroup<HelpCriteriaForm>({
      productName: new FormControl('Help Management UI'),
      itemId: new FormControl('PAGE_HELP_SEARCH')
    })
    component.usedProducts = [
      { name: '1', displayName: '1dn' },
      { name: 'help-mgmt-ui', displayName: 'Help Management UI' }
    ] as Product[]

    component.onSearch()

    const expectedValue = component.criteriaForm.value
    expectedValue.productName = 'help-mgmt-ui'
    expect(criteriaEmitterSpy.emit).toHaveBeenCalledWith(component.criteriaForm.value as HelpSearchCriteria)
  })

  it('should display error on invalid criteria', () => {
    component.criteriaForm = new FormGroup<HelpCriteriaForm>({
      productName: new FormControl('', Validators.required),
      itemId: new FormControl('', Validators.required)
    })

    component.onSearch()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'DIALOG.SEARCH.MSG_SEARCH_VALIDATION' })
  })
})
