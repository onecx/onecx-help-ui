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
  templateUrl: './help-item-editor-dialog.component.html',
  styleUrls: ['./help-item-editor-dialog.component.scss'],
  imports: [InputTextModule, ReactiveFormsModule, TranslateModule],
  providers: [PortalMessageService, FormBuilder]
})
export class HelpItemEditorDialogComponent implements DialogResult<Help>, DialogButtonClicked, OnChanges {
  @Input()
  helpItem!: Help
  dialogResult!: Help
  public formGroup!: FormGroup

  constructor(private fb: FormBuilder, private portalMessageService: PortalMessageService) {
    this.formGroup = this.fb.group({
      appId: new FormControl({ value: null, disabled: true }, [Validators.required]),
      helpItemId: new FormControl({ value: null, disabled: true }, [Validators.required]),
      resourceUrl: new FormControl(null, Validators.required)
    })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['helpItem'] && this.helpItem) {
      this.dialogResult = {
        ...this.helpItem
      }
      this.formGroup.patchValue({
        appId: this.dialogResult.appId,
        helpItemId: this.dialogResult.itemId,
        resourceUrl: this.dialogResult.resourceUrl
      })
    }
  }

  ocxDialogButtonClicked(state: DialogState<Help>): boolean | Observable<boolean> | Promise<boolean> | undefined {
    if (state.button === 'secondary') {
      return true
    }

    if (this.formGroup.valid && this.helpItem) {
      this.dialogResult = { ...this.helpItem, resourceUrl: this.formGroup.value['resourceUrl'] }
      return true
    } else {
      this.portalMessageService.error({
        summaryKey: 'HELP_ITEM_EDITOR.SAVE_ERROR'
      })
      return false
    }
  }
}
