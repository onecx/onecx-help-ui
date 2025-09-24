import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormGroup, FormControl } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { HelpSearchCriteria } from 'src/app/shared/generated'
import { HelpCriteriaComponent, HelpCriteriaForm } from './help-criteria.component'
import { Product } from '../help-search.component'

const product1: Product = { name: 'product1', displayName: 'Product 1' }
const product2: Product = { name: 'product2', displayName: 'Product 2' }
const products: Product[] = [product1, product2]

describe('HelpDetailComponent', () => {
  let component: HelpCriteriaComponent
  let fixture: ComponentFixture<HelpCriteriaComponent>

  const formGroupSpy = jasmine.createSpyObj<FormGroup<HelpCriteriaForm>>('HelpCriteriaGroup', ['reset'])
  const criteriaEmitterSpy = jasmine.createSpyObj<EventEmitter<HelpSearchCriteria>>('EventEmitter', ['emit'])

  function initTestComponent() {
    fixture = TestBed.createComponent(HelpCriteriaComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
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
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()
  }))

  beforeEach(() => {
    initTestComponent()
  })

  afterEach(() => {})

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })
  })

  describe('page actions', () => {
    it('should submit criteria - item and product', () => {
      component.searchEmitter = criteriaEmitterSpy
      const itemId = 'PAGE_HELP_SEARCH'
      component.criteriaForm = new FormGroup<HelpCriteriaForm>({
        itemId: new FormControl(itemId),
        product: new FormControl(product1)
      })
      const criteria: HelpSearchCriteria = { itemId: itemId, productName: product1.name }

      component.onSearch()

      expect(criteriaEmitterSpy.emit).toHaveBeenCalledWith(criteria)
    })

    it('should submit criteria - item only', () => {
      component.searchEmitter = criteriaEmitterSpy
      const itemId = 'PAGE*'
      component.criteriaForm = new FormGroup<HelpCriteriaForm>({
        itemId: new FormControl(itemId),
        product: new FormControl(null)
      })
      const criteria: HelpSearchCriteria = { itemId: itemId, productName: undefined }

      component.onSearch()

      expect(criteriaEmitterSpy.emit).toHaveBeenCalledWith(criteria)
    })

    it('should reset criteria', () => {
      component.criteriaForm = formGroupSpy

      component.onResetCriteria()

      expect(component.criteriaForm.reset).toHaveBeenCalled()
    })
  })

  it('should filter usedProducts', () => {
    component.usedProducts = products
    const event = { query: 'prod' }

    component.onFilterProducts(event)

    expect(component.productsFiltered).toContain(product1)
  })
})
