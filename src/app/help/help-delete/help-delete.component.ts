import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Help, HelpsInternalAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'

@Component({
  selector: 'app-help-delete',
  templateUrl: './help-delete.component.html',
  standalone: true,
  imports: [SharedModule],
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
