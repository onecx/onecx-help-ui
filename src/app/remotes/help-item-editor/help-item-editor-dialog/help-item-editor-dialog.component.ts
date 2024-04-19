// import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
// import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
// import { PortalMessageService } from '@onecx/angular-integration-interface'
// import { HelpData } from '@onecx/portal-integration-angular/lib/model/help-data'

// @Component({
//   selector: 'app-ocx-help-item-editor',
//   standalone: true,
//   templateUrl: './help-item-editor-dialog.component.html',
//   styleUrls: ['./help-item-editor-dialog.component.scss']
// })
// export class HelpItemEditorDialogComponent implements OnChanges {
//   @Input() public displayDialog = true
//   @Output() public displayDialogChange = new EventEmitter<boolean>()

//   @Input() helpItem!: HelpData | undefined
//   @Output() saveHelpItem = new EventEmitter<HelpData>()

//   public formGroup!: FormGroup
//   constructor(private fb: FormBuilder, private portalMessageService: PortalMessageService) {
//     this.formGroup = this.fb.group({
//       appId: new FormControl({ value: null, disabled: true }, [Validators.required]),
//       helpItemId: new FormControl({ value: null, disabled: true }, [Validators.required]),
//       resourceUrl: new FormControl(null, Validators.required)
//     })
//   }
//   public ngOnChanges(changes: SimpleChanges): void {
//     if (changes['helpItem'] && this.helpItem) {
//       this.formGroup.patchValue({ ...this.helpItem })
//     }
//   }

//   public save() {
//     if (this.formGroup.valid && this.helpItem) {
//       this.helpItem.resourceUrl = this.formGroup.value['resourceUrl']
//       this.saveHelpItem.emit(this.helpItem)
//     } else {
//       this.portalMessageService.error({
//         summaryKey: 'OCX_HELP_ITEM_EDITOR.SAVE_ERROR'
//       })
//     }
//   }

//   public close(): void {
//     this.displayDialogChange.emit(false)
//   }
// }
