import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { DialogButtonClicked, DialogResult, DialogState, PortalMessageService } from '@onecx/portal-integration-angular'
import { InputTextModule } from 'primeng/inputtext'
import { Observable } from 'rxjs'
import { Help } from 'src/app/shared/generated'

@Component({
  selector: 'app-ocx-help-item-editor',
  standalone: true,
  styleUrls: ['./help-item-editor-dialog.component.scss'],
  templateUrl: './help-item-editor-dialog.component.html',
  imports: [InputTextModule, ReactiveFormsModule, TranslateModule],
  providers: [PortalMessageService, FormBuilder]
})
export class HelpItemEditorDialogComponent implements DialogResult<Help>, DialogButtonClicked, OnChanges {
  @Input() helpItem!: Help
  @Input() productDisplayName!: string
  dialogResult!: Help
  public formGroup!: FormGroup

  constructor(
    private fb: FormBuilder,
    private portalMessageService: PortalMessageService
  ) {
    this.formGroup = this.fb.group({
      helpItemId: new FormControl({ value: null, disabled: true }, [Validators.required]),
      productName: new FormControl({ value: null, disabled: true }, [Validators.required]),
      baseUrl: new FormControl(null, Validators.required),
      resourceUrl: new FormControl(null)
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
        resourceUrl: this.dialogResult.resourceUrl
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
        resourceUrl: this.formGroup.value['resourceUrl']
      }
      return true
    } else {
      this.portalMessageService.error({
        summaryKey: 'HELP_ITEM_EDITOR.SAVE_ERROR'
      })
      return false
    }
  }
}
