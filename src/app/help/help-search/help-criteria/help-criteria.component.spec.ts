import { NO_ERRORS_SCHEMA, SimpleChange, EventEmitter } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { of } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'
import { HelpCriteriaComponent, HelpCriteriaForm } from './help-criteria.component'
import { HelpSearchCriteria, HelpsInternalAPIService } from '../../../generated'

describe('HelpDetailComponent', () => {
  let component: HelpCriteriaComponent
  let fixture: ComponentFixture<HelpCriteriaComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error', 'info'])
  const formGroupSpy = jasmine.createSpyObj<FormGroup<HelpCriteriaForm>>('HelpCriteriaGroup', ['reset'])
  const criteriaEmitterSpy = jasmine.createSpyObj<EventEmitter<HelpSearchCriteria>>('EventEmitter', ['emit'])
  const apiServiceSpy = { getAllAppsWithHelpItems: jasmine.createSpy('getAllAppsWithHelpItem').and.returnValue(of([])) }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpCriteriaComponent],
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
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: HelpsInternalAPIService, useValue: apiServiceSpy }
      ]
    }).compileComponents(),
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

  it('should update appIds OnInit', () => {
    component.appsChanged = true

    const mockHelpAppIds = {
      appIds: ['1', '2']
    }
    component.applicationsIds = []
    apiServiceSpy.getAllAppsWithHelpItems.and.returnValue(of(mockHelpAppIds))
    component.ngOnInit()

    expect(component.applicationsIds).toEqual(['', '1', '2'])
  })

  it('should update appIds OnChanges if appsChanged', () => {
    component.appsChanged = true
    const mockHelpAppIds = {
      appIds: ['1', '2']
    }
    component.applicationsIds = []
    apiServiceSpy.getAllAppsWithHelpItems.and.returnValue(of(mockHelpAppIds))

    component.ngOnChanges({
      appsChanged: new SimpleChange(false, true, false)
    })

    expect(component.applicationsIds).toEqual(['', '1', '2'])
  })

  it('should filter applications', () => {
    const notFiltered: string[] = ['filteredItem', 'unfilteredItem']
    component.applicationsIds = notFiltered
    const event = { query: 'filteredItem' }

    component.filterApplications(event)

    expect(component.applicationsIdsFiltered[0]).toEqual('filteredItem')
  })

  it('should reset criteria', () => {
    component.helpCriteriaGroup = formGroupSpy

    component.resetCriteria()

    expect(component.helpCriteriaGroup.reset).toHaveBeenCalled()
  })

  it('should submit criteria', () => {
    component.criteriaEmitter = criteriaEmitterSpy
    component.helpCriteriaGroup = new FormGroup<HelpCriteriaForm>({
      appId: new FormControl('help-mgmt-ui'),
      itemId: new FormControl('PAGE_HELP_SEARCH')
    })

    component.submitCriteria()

    expect(criteriaEmitterSpy.emit).toHaveBeenCalledWith(component.helpCriteriaGroup.value as HelpSearchCriteria)
  })

  it('should display error on invalid criteria', () => {
    component.helpCriteriaGroup = new FormGroup<HelpCriteriaForm>({
      appId: new FormControl('', Validators.required),
      itemId: new FormControl('', Validators.required)
    })

    component.submitCriteria()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELP_SEARCH.MSG_SEARCH_VALIDATION' })
  })

  it('should display info when no appIds available', () => {
    apiServiceSpy.getAllAppsWithHelpItems.and.returnValue(of([]))

    component.loadAllApps()

    expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'HELP_SEARCH.NO_APP_IDS_AVAILABLE' })
  })
})
