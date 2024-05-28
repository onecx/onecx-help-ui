import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HelpFormComponent } from './help-form.component'
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { DropdownModule } from 'primeng/dropdown'
import { CalendarModule } from 'primeng/calendar'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { HttpClient } from '@angular/common/http'
import { MessageService } from 'primeng/api'
import { Product } from '../../shared/generated'

import { AppStateService, createTranslateLoader } from '@onecx/portal-integration-angular'

describe('HelpFormComponent', () => {
  let component: HelpFormComponent
  let fixture: ComponentFixture<HelpFormComponent>

  let formGroupSpy = jasmine.createSpyObj<FormGroup>('FormGroup', ['patchValue', 'reset'])

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
    const mockHelpItem = {
      itemId: 'id',
      productName: 'name'
    }
    component.helpItem = mockHelpItem
    component.formGroup = formGroupSpy

    component.ngOnChanges({
      helpItem: new SimpleChange(null, mockHelpItem, false)
    })

    expect(formGroupSpy.patchValue).toHaveBeenCalledWith(mockHelpItem)
  })

  it('should reset formGroup OnChanges if helpItem does not exist', () => {
    component.helpItem = undefined
    component.formGroup = formGroupSpy

    component.ngOnChanges({
      helpItem: new SimpleChange(null, null, false)
    })

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
})
