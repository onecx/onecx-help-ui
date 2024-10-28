import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { HelpItemEditorFormComponent } from './help-item-editor-form.component'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HelpItemEditorDialogHarness } from './help-item-editor-form.harness'

describe('HelpItemEditorFormComponent', () => {
  let component: HelpItemEditorFormComponent
  let fixture: ComponentFixture<HelpItemEditorFormComponent>
  let helpItemEditorDialogHarness: HelpItemEditorDialogHarness

  const portalMessageServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['error'])

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        HelpItemEditorFormComponent,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateTestingModule.withTranslations({
          en: require('src/assets/i18n/en.json'),
          de: require('src/assets/i18n/de.json')
        })
      ]
    })
      .overrideComponent(HelpItemEditorFormComponent, {
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

    fixture = TestBed.createComponent(HelpItemEditorFormComponent)
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
    expect(await helpItemEditorDialogHarness.getHelpItemIdLabelText()).toEqual('Help Item ID')
    expect(await helpItemEditorDialogHarness.getProductNameLabelText()).toEqual('Application')
    expect(await helpItemEditorDialogHarness.getBaseUrlLabelText()).toEqual('Base URL')
    expect(await helpItemEditorDialogHarness.getResourceUrlLabelText()).toEqual('Resource URL')
  })

  it('should initially have empty values', async () => {
    expect(await helpItemEditorDialogHarness.getHelpItemIdValue()).toEqual('')
    expect(await helpItemEditorDialogHarness.getProductNameValue()).toEqual('')
    expect(await helpItemEditorDialogHarness.getBaseUrlValue()).toEqual('')
    expect(await helpItemEditorDialogHarness.getResourceUrlValue()).toEqual('')
  })

  it('should update form and result on changes', async () => {
    const helpItem = {
      productName: 'new_product_name',
      itemId: 'new_item_id',
      resourceUrl: 'new_resource_url'
    }
    component.helpItem = helpItem
    component.productDisplayName = 'new product display name'
    component.ngOnChanges({
      helpItem: {} as any
    })
    component.ngOnChanges({
      productDisplayName: 'new product display name' as any
    })
    fixture.detectChanges()

    expect(await helpItemEditorDialogHarness.getHelpItemIdValue()).toEqual('new_item_id')
    expect(await helpItemEditorDialogHarness.getProductNameValue()).toEqual('new product display name')
    expect(await helpItemEditorDialogHarness.getResourceUrlValue()).toEqual('new_resource_url')
    expect(component.dialogResult).toEqual(helpItem)
  })

  it('should allow to close dialog if secondary button was clicked', () => {
    expect(component.ocxDialogButtonClicked({ button: 'secondary' } as any)).toBeTrue()
  })

  it('should allow to close dialog and update dialogResult on primary button click if form was valid and helpItem was provided', () => {
    const helpItem = {
      productName: 'new_product_name',
      itemId: 'new_item_id',
      resourceUrl: 'new_resource_url'
    }
    component.helpItem = helpItem
    component.formGroup.patchValue({
      productName: 'form_product_name',
      itemId: 'form_item_id',
      baseUrl: 'form_base_url',
      resourceUrl: 'form_resource_url'
    })

    const result = component.ocxDialogButtonClicked({ button: 'primary' } as any)
    expect(result).toBeTrue()
    expect(component.dialogResult).toEqual({
      productName: 'new_product_name',
      itemId: 'new_item_id',
      baseUrl: 'form_base_url',
      resourceUrl: 'form_resource_url'
    })
  })

  it('should not allow to close dialog display SAVE_ERROR message on primary button click if form was not valid', () => {
    const helpItem = {
      productName: 'new_product_name',
      itemId: 'new_item_id',
      baseUrl: 'new_base_url',
      resourceUrl: 'new_resource_path'
    }
    component.helpItem = helpItem
    fixture.detectChanges()
    component.formGroup.controls['baseUrl'].setValue('')

    const result = component.ocxDialogButtonClicked({ button: 'primary' } as any)
    expect(result).toBeFalse()
    expect(portalMessageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.SAVE_ERROR'
    })
  })

  it('should not allow to close dialog display SAVE_ERROR message on primary button click if helpitem was not provided', () => {
    component.formGroup.controls['helpItemId'].setValue('valid')
    component.formGroup.controls['productName'].setValue('valid')
    component.formGroup.controls['baseUrl'].setValue('valid')

    const result = component.ocxDialogButtonClicked({ button: 'primary' } as any)
    expect(result).toBeFalse()
    expect(portalMessageServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'HELP_ITEM_EDITOR.SAVE_ERROR'
    })
  })
})
