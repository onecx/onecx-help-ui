import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'

import { Column } from '@onecx/portal-integration-angular'
import { CreateHelp } from 'src/app/generated'

export interface HelpDetailForm {
  appId: FormControl<string | null>
  itemId: FormControl<string | null>
  context: FormControl<string | null>
  baseUrl: FormControl<string | null>
  resourceUrl: FormControl<string | null>
}

@Component({
  selector: 'hm-help-form',
  templateUrl: './help-form.component.html',
  styleUrls: ['./help-form.component.scss']
})
export class HelpFormComponent implements OnChanges {
  @Input() helpItem: CreateHelp | undefined
  @Input() changeMode = 'NEW'

  public formGroup: FormGroup
  public columns: Column[] = [
    { field: 'appId', header: 'APPLICATION_ID' },
    { field: 'itemId', header: 'HELP_ITEM_ID' },
    { field: 'baseUrl', header: 'BASE_URL' },
    { field: 'context', header: 'CONTEXT' },
    { field: 'resourceUrl', header: 'RESOURCE_URL' }
  ]

  constructor() {
    this.formGroup = new FormGroup<HelpDetailForm>({
      appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      itemId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      context: new FormControl(null, [Validators.maxLength(255)]),
      baseUrl: new FormControl(null, [Validators.maxLength(255)]),
      resourceUrl: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.helpItem)
      this.formGroup.patchValue({
        ...this.helpItem
      })
    else this.formGroup.reset()
  }
}
