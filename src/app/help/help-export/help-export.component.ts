import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import FileSaver from 'file-saver'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { ListboxModule } from 'primeng/listbox'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

import { HelpsInternalAPIService } from 'src/app/shared/generated'
import { Product } from '../help-search/help-search.component'

@Component({
  selector: 'app-help-export',
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    ListboxModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-export.component.html'
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
