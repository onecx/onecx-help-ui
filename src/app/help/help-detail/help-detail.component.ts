import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { HelpsInternalAPIService, Help, CreateHelp, Product } from 'src/app/shared/generated'
import { HelpFormComponent } from '../help-form/help-form.component'

@Component({
  selector: 'app-help-detail',
  templateUrl: './help-detail.component.html',
  styleUrls: ['./help-detail.component.scss']
})
export class HelpDetailComponent implements OnChanges {
  @Input() public helpItem: Help | undefined
  @Input() public changeMode = 'CREATE'
  @Input() public displayDetailDialog = false
  @Input() public products: Product[] = []
  @Output() public displayDetailDialogChange = new EventEmitter<boolean>()
  @Output() public searchEmitter = new EventEmitter()

  @ViewChild(HelpFormComponent, { static: false }) helpFormComponent!: HelpFormComponent

  public productName: string | undefined

  constructor(
    private readonly helpApi: HelpsInternalAPIService,
    private readonly msgService: PortalMessageService
  ) {}

  ngOnChanges() {
    if (this.helpItem) {
      this.productName = this.helpItem?.productName
    }
  }

  public onDialogHide() {
    this.displayDetailDialogChange.emit(false)
  }

  /****************************************************************************
   *  SAVING
   */
  public onSave() {
    const helpObject = { ...this.helpFormComponent.formGroup.value }
    helpObject.productName = helpObject.product.name
    delete helpObject.product

    this.changeMode === 'CREATE' ? this.createHelpItem(helpObject) : this.updateHelpItem(helpObject)
  }

  private createHelpItem(helpObject: CreateHelp) {
    if (this.helpFormComponent.formGroup.valid) {
      this.helpApi
        .createNewHelp({
          createHelp: helpObject
        })
        .subscribe({
          next: () => {
            this.searchEmitter.emit()
            this.msgService.success({ summaryKey: 'HELPITEM_CREATION.CREATION_SUCCESS' })
            this.displayDetailDialog = false
          },
          error: (err: { error: { errorCode: string } }) => {
            err.error.errorCode && err.error.errorCode === 'PERSIST_ENTITY_FAILED'
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

  private updateHelpItem(helpObject: CreateHelp): void {
    if (this.helpFormComponent.formGroup.valid && this.helpItem) {
      this.helpApi
        .updateHelp({
          id: this.helpItem.id ?? '',
          updateHelp: { ...helpObject, modificationCount: this.helpItem?.modificationCount ?? 0 }
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
