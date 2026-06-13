import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'

@Component({
  selector: 'app-help-delete',
  templateUrl: './help-delete.component.html',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, TooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDeleteComponent {
  @Input() helpItem: Help | undefined
  @Input() visible = false
  @Output() visibleChange = new EventEmitter<boolean>()

  constructor(
    private readonly msgService: PortalMessageService,
    private readonly helpApi: HelpsInternalAPIService
  ) {}

  public onDeleteConfirmation(): void {
    if (!this.helpItem?.id) return
    this.helpApi.deleteHelp({ id: this.helpItem.id }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'ACTIONS.DELETE.MESSAGE.OK' })
        this.visibleChange.emit(true)
      },
      error: (err) => {
        this.msgService.error({ summaryKey: 'ACTIONS.DELETE.MESSAGE.NOK' })
        console.error('deleteHelp', err)
      }
    })
  }
}
