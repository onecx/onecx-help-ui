import { NO_ERRORS_SCHEMA, Component, SimpleChanges } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'

import { PortalMessageService, Column } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'

import { HelpDetailComponent } from './help-detail.component'
import { HelpsInternalAPIService, CreateHelp } from 'src/app/generated'

describe('HelpDetailComponent', () => {
  let component: HelpDetailComponent
  let fixture: ComponentFixture<HelpDetailComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = {
    addHelpItem: jasmine.createSpy('addHelpItem').and.returnValue(of({})),
    updateHelpItemById: jasmine.createSpy('updateHelpItemById').and.returnValue(of({}))
  }

  @Component({
    selector: 'hm-help-form',
    template: ''
  })
  class MockHelpFormComponent {
    formGroup = new FormGroup({
      appId: new FormControl(''),
      helpItemId: new FormControl('')
    })
    changeMode = ''
    helpItem: undefined
    columns!: Column[]
    // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
    ngOnChanges(changes: SimpleChanges): void {
      console.log('On changes')
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpDetailComponent, MockHelpFormComponent],
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
    fixture = TestBed.createComponent(HelpDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiServiceSpy.addHelpItem.calls.reset()
    apiServiceSpy.updateHelpItemById.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should create a help item onSave', () => {
    apiServiceSpy.addHelpItem.and.returnValue(of({}))
    component.changeMode = 'NEW'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      appId: 'value',
      helpItemId: 'value2'
    })
    component.helpFormComponent = mockHelpForm
    spyOn(component.searchEmitter, 'emit')

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'HELPITEM_CREATION.CREATION_SUCCESS' })
    expect(component.searchEmitter.emit).toHaveBeenCalled()
    expect(apiServiceSpy.addHelpItem).toHaveBeenCalledWith({
      appId: component.helpFormComponent.formGroup.value['appId'],
      creatHelp: component.helpFormComponent.formGroup.value as CreateHelp
    })
  })

  it('should display creation error', () => {
    const mockError = {
      error: {
        key: 'SERVER_ERROR'
      }
    }
    apiServiceSpy.addHelpItem.and.returnValue(throwError(() => mockError))
    component.changeMode = 'NEW'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      appId: 'help-mgmt-ui',
      helpItemId: 'PAGE_HELP_SEARCH'
    })
    component.helpFormComponent = mockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELPITEM_CREATION.CREATION_FAILED' })
  })

  it('should display unique constraint creation error', () => {
    const mockError = {
      error: {
        key: 'PERSIST_ENTITY_FAILED'
      }
    }
    apiServiceSpy.addHelpItem.and.returnValue(throwError(() => mockError))
    component.changeMode = 'NEW'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      appId: 'help-mgmt-ui',
      helpItemId: 'PAGE_HELP_SEARCH'
    })
    component.helpFormComponent = mockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'HELPITEM_CREATION.CREATION_FAILED',
      detailKey: 'HELPITEM_CREATION.UNIQUE_CONSTRAINT'
    })
  })

  it('should display validation error on invalid creation', () => {
    component.changeMode = 'NEW'
    let invalidMockHelpForm = new MockHelpFormComponent()
    invalidMockHelpForm.formGroup = new FormGroup({
      appId: new FormControl('', Validators.required),
      helpItemId: new FormControl('', Validators.required)
    })
    component.helpFormComponent = invalidMockHelpForm

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELPITEM_CREATION.VALIDATION_ERROR' })
  })

  it('should update help item', () => {
    apiServiceSpy.updateHelpItemById.and.returnValue(of({}))
    component.changeMode = 'EDIT'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      appId: 'help-mgmt-ui',
      helpItemId: 'PAGE_HELP_SEARCH'
    })
    component.helpFormComponent = mockHelpForm
    component.appId = 'help-mgmt-ui'
    component.helpItemId = 'PAGE_HELP_SEARCH'
    spyOn(component.searchEmitter, 'emit')

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.UPDATE_SUCCESSFUL' })
    expect(component.searchEmitter.emit).toHaveBeenCalled()
    expect(apiServiceSpy.updateHelpItemById).toHaveBeenCalledWith({
      id: component.helpItemId,
      appId: component.appId,
      helpItemDetailDTO: component.helpFormComponent.formGroup.value
    })
  })

  it('should display update error', () => {
    apiServiceSpy.updateHelpItemById.and.returnValue(throwError(() => new Error()))
    component.changeMode = 'EDIT'
    let mockHelpForm = new MockHelpFormComponent()
    mockHelpForm.formGroup.setValue({
      appId: 'help-mgmt-ui',
      helpItemId: 'PAGE_HELP_SEARCH'
    })
    component.helpFormComponent = mockHelpForm
    component.appId = 'help-mgmt-ui'
    component.helpItemId = 'PAGE_HELP_SEARCH'

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.UPDATE_ERROR' })
  })

  it('should display validation error on invalid update', () => {
    component.changeMode = 'EDIT'
    let invalidMockHelpForm = new MockHelpFormComponent()
    invalidMockHelpForm.formGroup = new FormGroup({
      appId: new FormControl('', Validators.required),
      helpItemId: new FormControl('', Validators.required)
    })
    component.helpFormComponent = invalidMockHelpForm
    component.appId = undefined
    component.helpItemId = undefined

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'HELP_DETAIL.VALIDATION_ERROR' })
  })

  it('should emit display change event onDialogHide', () => {
    spyOn(component.displayDetailDialogChange, 'emit')
    component.onDialogHide()

    expect(component.displayDetailDialogChange.emit).toHaveBeenCalledWith(false)
  })

  it('should update ids OnChanges: helpItemId in edit mode', () => {
    component.changeMode = 'EDIT'
    component.helpItem = {
      id: 'id',
      itemId: 'itemId'
    }
    component.helpItemId = 'noId'

    component.ngOnChanges()

    expect(component.helpItemId).toEqual('id')
  })

  it('should update ids OnChanges: helpItemId in new mode', () => {
    component.changeMode = 'NEW'

    component.ngOnChanges()

    expect(component.helpItemId).toEqual(undefined)
  })
})
