import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { AppStateService, createTranslateLoader } from '@onecx/portal-integration-angular'
import { DropdownModule } from 'primeng/dropdown'
import { CalendarModule } from 'primeng/calendar'
import { MessageService } from 'primeng/api'

import { Product } from 'src/app/shared/generated'
import { HelpFormComponent } from './help-form.component'

const mockForm = new FormGroup({
  product: new FormControl(null),
  itemId: new FormControl(null),
  context: new FormControl(null),
  baseUrl: new FormControl(null),
  resourceUrl: new FormControl(null),
  operator: new FormControl(false)
})
const mockHelpItem = {
  itemId: 'id',
  productName: 'name',
  baseUrl: 'base',
  operator: false
}

describe('HelpFormComponent', () => {
  let component: HelpFormComponent
  let fixture: ComponentFixture<HelpFormComponent>

  const formGroupSpy = jasmine.createSpyObj<FormGroup>('FormGroup', ['patchValue', 'reset', 'disable'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpFormComponent],
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        DropdownModule,
        CalendarModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient, AppStateService]
          }
        })
      ],
      providers: [MessageService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpFormComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should patch formGroup OnChanges if helpItem exists', () => {
    component.helpItem = mockHelpItem
    component.formGroup = mockForm

    component.ngOnChanges()

    expect(component.formGroup.controls['itemId'].value).toBe(mockHelpItem.itemId)
  })

  it('should disable formGroup OnChanges if change mode is VIEW', () => {
    component.helpItem = mockHelpItem
    component.formGroup = mockForm
    component.changeMode = 'VIEW'

    component.ngOnChanges()

    expect(component.formGroup.controls['itemId'].value).toBe(mockHelpItem.itemId)
    expect(component.formGroup.disabled).toBeTruthy()
  })

  it('should reset formGroup OnChanges if helpItem does not exist', () => {
    component.helpItem = undefined
    component.formGroup = formGroupSpy

    component.ngOnChanges()

    expect(component.formGroup.reset).toHaveBeenCalled()
  })

  it('should filter products by display names', () => {
    const initialProducts: Product[] = [
      { name: 'onecx-help-ui', displayName: 'OneCx Help UI' },
      { name: 'onecx-tenant-ui', displayName: 'OneCx Tenant UI' }
    ]

    component.products = initialProducts
    const event = { query: 'Tenant' }

    component.filterProducts(event)

    expect(component.productsFiltered[0].displayName).toEqual('OneCx Tenant UI')
  })

  fdescribe('sortProductsByName', () => {
    const p1: Product = { name: 'p1', displayName: 'P1' }
    const p2: Product = { name: 'p2', displayName: 'P2' }

    it('should return 0 when both strings are identical', () => {
      expect(component.sortProductsByName(p1, p1)).toBe(0)
    })

    it('should return -1', () => {
      expect(component.sortProductsByName(p1, p2)).toBe(-1)
    })

    it('should return 1', () => {
      expect(component.sortProductsByName(p2, p1)).toBe(1)
    })
  })
})
