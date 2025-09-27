import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { DialogButtonClicked, DialogResult, DialogState } from '@onecx/portal-integration-angular'
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-ocx-no-help-item',
  standalone: true,
  templateUrl: './no-help-item.component.html',
  styleUrls: ['./no-help-item.component.scss'],
  imports: [CommonModule, DynamicDialogModule, TranslateModule]
})
export class NoHelpItemComponent implements DialogResult<NoHelpItemComponent>, DialogButtonClicked {
  @Input() helpArticleId!: string
  @Input() issueTypeKey: string = 'NO_HELP_ITEM'

  dialogResult!: NoHelpItemComponent

  constructor(
    public readonly config: DynamicDialogConfig,
    public readonly ref: DynamicDialogRef
  ) {
    this.helpArticleId = config.data.helpArticleId // to be displayed
    this.issueTypeKey = config.data.issueTypeKey ?? 'NO_HELP_ITEM' // to be displayed
  }

  // make dialog result available on caller
  public ocxDialogButtonClicked(
    state: DialogState<boolean>
  ): boolean | Observable<boolean> | Promise<boolean> | undefined {
    state.id = this.helpArticleId
    state.result = true
    return true // button: 'primary'
  }
}
