import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Observable } from 'rxjs'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'
import { FieldsetModule } from 'primeng/fieldset'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import {
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult,
  DialogState
} from '@onecx/portal-integration-angular'

import { Help } from 'src/app/shared/generated'

@Component({
  selector: 'app-ocx-help-item-editor',
  standalone: true,
  styleUrls: ['./help-item-editor-form.component.scss'],
  templateUrl: './help-item-editor-form.component.html',
  imports: [InputTextModule, ReactiveFormsModule, TranslateModule, TooltipModule, FieldsetModule],
  providers: [PortalMessageService, FormBuilder]
})
export class HelpItemEditorFormComponent
  implements DialogResult<Help>, DialogPrimaryButtonDisabled, DialogButtonClicked, OnChanges
{
  @Input() helpItem!: Help
  @Input() productDisplayName!: string
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  dialogResult!: Help
  public formGroup!: FormGroup

  constructor(
    private readonly fb: FormBuilder,
    private readonly portalMessageService: PortalMessageService
  ) {
    this.formGroup = this.fb.group({
      helpItemId: new FormControl({ value: null, disabled: true }, [Validators.required]),
      productName: new FormControl({ value: null, disabled: true }, [Validators.required]),
      baseUrl: new FormControl(null, Validators.required),
      resourceUrl: new FormControl(null),
      context: new FormControl(null)
    })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['helpItem'] && this.helpItem) {
      this.dialogResult = {
        ...this.helpItem
      }
      this.formGroup.patchValue({
        helpItemId: this.dialogResult.itemId,
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
