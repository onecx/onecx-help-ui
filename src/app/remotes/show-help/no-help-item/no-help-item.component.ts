import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog'

@Component({
  selector: 'app-ocx-no-help-item',
  standalone: true,
  templateUrl: './no-help-item.component.html',
  styleUrls: ['./no-help-item.component.scss'],
  imports: [CommonModule, DynamicDialogModule, TranslateModule]
})
export class NoHelpItemComponent {
  public helpArticleId: string

  constructor(
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef
  ) {
    this.helpArticleId = config.data.helpArticleId
  }
}
