import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core'
import { PortalMessageService } from '@onecx/portal-integration-angular'

import { HelpsInternalAPIService, Help, CreateHelp } from 'src/app/shared/generated'
import { HelpFormComponent } from '../help-form/help-form.component'

@Component({
  selector: 'app-help-detail',
  templateUrl: './help-detail.component.html',
  styleUrls: ['./help-detail.component.scss']
})
export class HelpDetailComponent implements OnChanges {
  @Input() public helpItem: Help | undefined
  @Input() public changeMode = 'NEW'
  @Input() public displayDetailDialog = false
  @Output() public displayDetailDialogChange = new EventEmitter<boolean>()
  @Output() public searchEmitter = new EventEmitter()

  @ViewChild(HelpFormComponent, { static: false }) helpFormComponent!: HelpFormComponent

  public itemId: string | undefined
  public appId: string | undefined

  constructor(private helpApi: HelpsInternalAPIService, private msgService: PortalMessageService) {}

  ngOnChanges() {
    if (this.changeMode === 'EDIT') {
      this.itemId = this.helpItem?.id
      this.appId = this.helpItem?.appId
    }
    if (this.changeMode === 'NEW') {
      this.itemId = undefined
    }
  }

  public onDialogHide() {
    this.displayDetailDialogChange.emit(false)
  }

  /****************************************************************************
   *  SAVING
   */
  public onSave() {
    this.changeMode === 'NEW' ? this.createHelpItem() : this.updateHelpItem()
  }

  private createHelpItem() {
    if (this.helpFormComponent.formGroup.valid) {
      this.helpApi
        .createNewHelp({
          createHelp: this.helpFormComponent.formGroup.value as CreateHelp
        })
        .subscribe({
          next: () => {
            this.searchEmitter.emit()
            this.msgService.success({ summaryKey: 'HELPITEM_CREATION.CREATION_SUCCESS' })
            this.displayDetailDialog = false
          },
          error: (err: { error: { key: string } }) => {
            err.error.key && err.error.key === 'PERSIST_ENTITY_FAILED'
              ? this.msgService.error({
                  summaryKey: 'HELPITEM_CREATION.CREATION_FAILED',
                  detailKey: 'HELPITEM_CREATION.UNIQUE_CONSTRAINT'
                })
              : this.msgService.error({ summaryKey: 'HELPITEM_CREATION.CREATION_FAILED' })
          }
        })
    } else {
      this.msgService.error({ summaryKey: 'HELPITEM_CREATION.VALIDATION_ERROR' })
    }
  }

  private updateHelpItem(): void {
    if (this.helpFormComponent.formGroup.valid && this.appId && this.itemId) {
      this.helpApi
        .updateHelp({
          id: this.itemId,
          updateHelp: { ...this.helpFormComponent.formGroup.value, modificationCount: this.helpItem?.modificationCount }
        })
        .subscribe({
          next: () => {
            this.searchEmitter.emit()
            this.msgService.success({ summaryKey: 'HELP_DETAIL.UPDATE_SUCCESSFUL' })
            this.displayDetailDialog = false
          },
          error: () => {
            this.msgService.error({ summaryKey: 'HELP_DETAIL.UPDATE_ERROR' })
            // console.error(err)
          }
        })
    } else {
      this.msgService.error({ summaryKey: 'HELP_DETAIL.VALIDATION_ERROR' })
    }
  }
}
