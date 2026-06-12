import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { FileSelectEvent } from 'primeng/fileupload'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'

@Component({
  selector: 'app-help-import',
  templateUrl: './help-import.component.html',
  standalone: true,
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpImportComponent {
  @Input() visible = false
  @Output() visibleChange = new EventEmitter<boolean>()

  public importError = false
  private importObject: object | undefined = undefined

  constructor(
    private readonly msgService: PortalMessageService,
    private readonly helpApi: HelpsInternalAPIService
  ) {}

  public onImportSelectFile(event: FileSelectEvent): void {
    event.files[0].text().then((text) => {
      this.importError = false
      this.importObject = undefined
      try {
        this.importObject = JSON.parse(text)
        this.msgService.info({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.OK' })
      } catch (err: any) {
        this.msgService.error({ summaryKey: 'ACTIONS.IMPORT.VALIDATION.NOK' })
        console.error('Import parse error', err)
        this.importError = true
      }
    })
  }

  public onImportConfirmation(): void {
    if (!this.importObject) return
    this.helpApi.importHelps({ body: this.importObject }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.OK' })
        this.onImportClear()
        this.visibleChange.emit(true)
      },
      error: (err) => {
        this.msgService.error({ summaryKey: 'ACTIONS.IMPORT.MESSAGE.NOK' })
        console.error('importHelps', err)
      }
    })
  }

  public onCloseDialog(): void {
    this.onImportClear()
    this.visibleChange.emit(false)
  }

  public onImportClear(): void {
    this.importError = false
    this.importObject = undefined
  }

  public formatUploadFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`
    const units = ['KB', 'MB', 'GB', 'TB']
    let size = bytes / 1024
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    const formatted = size < 10 ? Math.round(size * 10) / 10 : Math.round(size)
    return `${formatted}${units[unitIndex]}`
  }
}
