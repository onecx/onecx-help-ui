import { Component, inject, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog'
import { Observable } from 'rxjs'

import { DialogButtonClicked, DialogResult, DialogState } from '@onecx/angular-accelerator'

@Component({
  selector: 'app-ocx-no-help-item',
  standalone: true,
  imports: [DynamicDialogModule, TranslateModule],
  templateUrl: './no-help-item.component.html',
  styleUrl: './no-help-item.component.scss'
})
export class NoHelpItemComponent implements DialogResult<NoHelpItemComponent>, DialogButtonClicked {
  private readonly config = inject(DynamicDialogConfig)
  public readonly ref = inject(DynamicDialogRef)

  @Input() helpArticleId: string = this.config.data.helpArticleId
  @Input() issueTypeKey: string = this.config.data.issueTypeKey ?? 'NO_HELP_ITEM'

  public dialogResult!: NoHelpItemComponent

  // make dialog result available on caller
  public ocxDialogButtonClicked(
    state: DialogState<boolean>
  ): boolean | Observable<boolean> | Promise<boolean> | undefined {
    state.id = this.helpArticleId
    state.result = true
    return true // button: 'primary'
  }
}
