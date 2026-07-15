import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload'
import { FloatLabelModule } from 'primeng/floatlabel'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService } from 'src/app/shared/generated'
import { HelpSnapshot } from 'src/app/types/helpSnapshot'

@Component({
  selector: 'app-help-import',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DialogModule,
    FileUploadModule,
    FloatLabelModule,
    MessageModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-import.component.html'
})
export class HelpImportComponent {
  @Input() visible = false
  @Output() visibleChange = new EventEmitter<boolean>()

  private readonly cd = inject(ChangeDetectorRef)
  private readonly msgService = inject(PortalMessageService)
  private readonly helpApi = inject(HelpsInternalAPIService)

  public importError = false
  private importObject: object | undefined = undefined

  public onImportSelectFile(event: FileSelectEvent): void {
    event.files[0].text().then((text) => {
      this.importError = false
      this.importObject = undefined
      try {
        this.importObject = JSON.parse(text)
        if (this.isHelpImportRequestDTO(this.importObject)) {
          const helpSnapshot = this.importObject as HelpSnapshot
          this.importError = false
          if (helpSnapshot.helps) {
            // const keys: string[] = Object.keys(helpSnapshot.helps)
          }
        } else {
          this.importError = true
        }
        this.cd.markForCheck() // force change detection to update the view with the new properties
      } catch (err: any) {
        this.msgService.error({ summaryKey: 'VALIDATION.ERRORS.IMPORT_PARSE_ERROR' })
        console.error('Help import parse error: ', err)
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

  private isHelpImportRequestDTO(obj: unknown): obj is HelpSnapshot {
    const dto = obj as HelpSnapshot
    return !!(typeof dto === 'object' && dto?.helps)
  }
}
