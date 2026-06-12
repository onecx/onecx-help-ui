import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import FileSaver from 'file-saver'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { Product } from '../help-search/help-search.component'

@Component({
  selector: 'app-help-export',
  templateUrl: './help-export.component.html',
  standalone: true,
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpExportComponent {
  @Input() visible = false
  @Input() usedProducts: Product[] = []
  @Output() visibleChange = new EventEmitter<void>()

  public exportProductList: string[] = []

  constructor(
    private readonly msgService: PortalMessageService,
    private readonly helpApi: HelpsInternalAPIService
  ) {}

  public onExportConfirmation(): void {
    if (this.exportProductList.length === 0) return
    this.helpApi.exportHelps({ exportHelpsRequest: { productNames: this.exportProductList } }).subscribe({
      next: (obj) => {
        const helpsJson = JSON.stringify(obj, null, 2)
        FileSaver.saveAs(
          new Blob([helpsJson], { type: 'text/json' }),
          'onecx-help-items_' + this.getCurrentDateTime() + '.json'
        )
        this.msgService.success({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.OK' })
        this.onCloseDialog()
      },
      error: (err) => {
        this.msgService.error({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.NOK' })
        console.error('exportHelps', err)
      }
    })
  }

  public onCloseDialog(): void {
    this.exportProductList = []
    this.visibleChange.emit()
  }

  private getCurrentDateTime(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}_${hours}${minutes}${seconds}`
  }
}
