import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'

import { Action, PortalMessageService } from '@onecx/portal-integration-angular'
import { HelpSearchCriteria, HelpsInternalAPIService } from 'src/app/shared/generated'

export interface HelpCriteriaForm {
  itemId: FormControl<string | null>
  appId: FormControl<string | null>
}

@Component({
  selector: 'app-help-criteria',
  templateUrl: './help-criteria.component.html'
})
export class HelpCriteriaComponent implements OnInit, OnChanges {
  @Input() public actions: Action[] = []
  @Input() public appsChanged = false
  @Output() public criteriaEmitter = new EventEmitter<HelpSearchCriteria>()

  // private translatedData!: Record<string, string>
  public displayDetailDialog = false
  public helpCriteriaGroup!: FormGroup<HelpCriteriaForm>
  public applicationsIds: string[] = []
  public applicationsIdsFiltered: string[] = []

  constructor(private helpInteralAPIService: HelpsInternalAPIService, private msgService: PortalMessageService) {
    this.helpCriteriaGroup = new FormGroup<HelpCriteriaForm>({
      itemId: new FormControl<string | null>(null),
      appId: new FormControl<string | null>(null)
    })
  }

  public ngOnInit() {
    this.loadAllApps()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appsChanged'] && this.appsChanged) {
      this.loadAllApps()
    }
  }

  public filterApplications(event: { query: string }) {
    const query = event.query.toLowerCase()
    this.applicationsIdsFiltered = this.applicationsIds?.filter((app) => app.toLowerCase().includes(query))
  }

  public resetCriteria() {
    this.helpCriteriaGroup.reset()
  }

  public submitCriteria() {
    if (this.helpCriteriaGroup.valid) {
      this.criteriaEmitter.emit(this.helpCriteriaGroup.value as HelpSearchCriteria)
    } else {
      this.msgService.error({ summaryKey: 'HELP_SEARCH.MSG_SEARCH_VALIDATION' })
    }
  }

  public loadAllApps() {
    this.helpInteralAPIService.getAllAppsWithHelpItems().subscribe((ids) => {
      if (ids.appIds == undefined) {
        ids.appIds = []
        this.applicationsIds = ids.appIds
      } else {
        this.applicationsIds = ids.appIds
      }
      if (this.applicationsIds?.length === 0) {
        this.msgService.info({ summaryKey: 'HELP_SEARCH.NO_APP_IDS_AVAILABLE' })
      }
      this.applicationsIds?.unshift('')
    })
  }
}
