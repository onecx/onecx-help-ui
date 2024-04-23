import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { HelpItemEditorDialogComponent } from './help-item-editor-dialog.component'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HelpItemEditorDialogHarness } from './help-item-editor-dialog.harness'

describe('HelpItemEditorDialogComponent', () => {
  let component: HelpItemEditorDialogComponent
  let fixture: ComponentFixture<HelpItemEditorDialogComponent>
  let helpItemEditorDialogHarness: HelpItemEditorDialogHarness

  let portalMessageServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error'])

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        HelpItemEditorDialogComponent,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateTestingModule.withTranslations({
          en: require('../../../../assets/i18n/en.json'),
          de: require('../../../../assets/i18n/de.json')
        })
      ]
    })
      .overrideComponent(HelpItemEditorDialogComponent, {
        set: {
          providers: [
            {
              provide: PortalMessageService,
              useValue: portalMessageServiceSpy
            }
          ]
        }
      })
      .compileComponents()

    portalMessageServiceSpy.error.calls.reset()

    fixture = TestBed.createComponent(HelpItemEditorDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    helpItemEditorDialogHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      HelpItemEditorDialogHarness
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct labels', async () => {
    expect(await helpItemEditorDialogHarness.getHelpItemIdLabelText()).toEqual('Help Item Id')
    expect(await helpItemEditorDialogHarness.getAppIdLabelText()).toEqual('Applicaiton Id')
    expect(await helpItemEditorDialogHarness.getResourceUrlLabelText()).toEqual('URL')
  })

  it('should initially have empty values', async () => {
    expect(await helpItemEditorDialogHarness.getHelpItemIdValue()).toEqual('')
    expect(await helpItemEditorDialogHarness.getAppIdValue()).toEqual('')
    expect(await helpItemEditorDialogHarness.getResourceUrlValue()).toEqual('')
  })

  it('should update form and result on changes', async () => {
    const helpItem = {
      appId: 'new_app_id',
      itemId: 'new_item_id',
      resourceUrl: 'new_resource_url'
    }
    component.helpItem = helpItem
    component.ngOnChanges({
      helpItem: {} as any
    })
    fixture.detectChanges()

    expect(await helpItemEditorDialogHarness.getHelpItemIdValue()).toEqual('new_item_id')
    expect(await helpItemEditorDialogHarness.getAppIdValue()).toEqual('new_app_id')
    expect(await helpItemEditorDialogHarness.getResourceUrlValue()).toEqual('new_resource_url')
    expect(component.dialogResult).toEqual(helpItem)
  })

  it('should allow to close dialog if secondary button was clicked', () => {
    expect(component.ocxDialogButtonClicked({ button: 'secondary' } as any)).toBeTrue()
  })

  it('should allow to close dialog and update dialogResult on primary button click if form was valid and helpItem was provided', () => {
    const helpItem = {
      appId: 'new_app_id',
      itemId: 'new_item_id',
      resourceUrl: 'new_resource_url'
    }
    component.helpItem = helpItem
    component.formGroup.patchValue({
      appId: 'form_app_id',
      itemId: 'form_item_id',
      resourceUrl: 'form_resource_url'
    })

    const result = component.ocxDialogButtonClicked({ button: 'primary' } as any)
    expect(result).toBeTrue()
    expect(component.dialogResult).toEqual({
      appId: 'new_app_id',
      itemId: 'new_item_id',
      resourceUrl: 'form_resource_url'
    })
  })

  it('should not allow to close dialog display SAVE_ERROR message on primary button click if form was not valid', () => {
    const helpItem = {
      appId: 'new_app_id',
      itemId: 'new_item_id',
      resourceUrl: 'new_resource_url'
    }
    component.helpItem = helpItem
    fixture.detectChanges()
    component.formGroup.controls['resourceUrl'].setValue('')

    const result = component.ocxDialogButtonClicked({ button: 'primary' } as any)
    expect(result).toBeFalse()
    expect(portalMessageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.SAVE_ERROR'
    })
  })

  it('should not allow to close dialog display SAVE_ERROR message on primary button click if helpitem was not provided', () => {
    component.formGroup.controls['resourceUrl'].setValue('valid')
    component.formGroup.controls['appId'].setValue('valid')
    component.formGroup.controls['helpItemId'].setValue('valid')

    const result = component.ocxDialogButtonClicked({ button: 'primary' } as any)
    expect(result).toBeFalse()
    expect(portalMessageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.SAVE_ERROR'
    })
  })
})
