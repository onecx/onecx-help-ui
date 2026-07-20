import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Observable } from 'rxjs'

import { FieldsetModule } from 'primeng/fieldset'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult, DialogState } from '@onecx/angular-accelerator'

import { Help } from 'src/app/shared/generated'

@Component({
  selector: 'app-ocx-help-item-editor',
  standalone: true,
  imports: [FieldsetModule, FloatLabelModule, InputTextModule, ReactiveFormsModule, TranslateModule, TooltipModule],
  templateUrl: './help-item-editor-form.component.html',
  styleUrl: './help-item-editor-form.component.scss'
})
export class HelpItemEditorFormComponent
  implements DialogResult<Help>, DialogPrimaryButtonDisabled, DialogButtonClicked, OnChanges
{
  @Input() helpItem: Help | undefined
  @Input() productDisplayName: string | undefined
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public dialogResult!: Help // same type as used in 'DialogResult<Help>'
  public formGroup: FormGroup

  constructor(
    private readonly fb: FormBuilder,
    private readonly portalMessageService: PortalMessageService
  ) {
    this.formGroup = this.fb.group({
      productName: new FormControl({ value: null, disabled: true }, [Validators.required]),
      itemId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      baseUrl: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      resourceUrl: new FormControl(null, [Validators.maxLength(255)]),
      context: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['helpItem'] && this.helpItem) {
      this.dialogResult = {
        ...this.helpItem
      }
      this.formGroup.patchValue({
        itemId: this.dialogResult.itemId,
        baseUrl: this.dialogResult.baseUrl,
        resourceUrl: this.dialogResult.resourceUrl,
        context: this.dialogResult.context
      })
    }
    if (changes['productDisplayName'] && this.productDisplayName) {
      this.formGroup.patchValue({
        productName: this.productDisplayName
      })
    }
  }

  ocxDialogButtonClicked(state: DialogState<Help>): boolean | Observable<boolean> | Promise<boolean> | undefined {
    if (state.button === 'secondary') {
      return true
    }
    if (this.formGroup.valid && this.helpItem) {
      this.dialogResult = {
        ...this.helpItem,
        baseUrl: this.formGroup.value['baseUrl'],
        resourceUrl: this.formGroup.value['resourceUrl'],
        context: this.formGroup.value['context']
      }
      return true
    } else {
      this.portalMessageService.error({ summaryKey: 'HELP_ITEM_EDITOR.SAVE_ERROR' })
      return false
    }
  }

  public onChangeBaseUrl(val: string) {
    this.primaryButtonEnabled.emit(val !== '')
  }
}
