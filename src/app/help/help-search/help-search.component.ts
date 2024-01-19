import { Component, OnInit, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { finalize, Observable } from 'rxjs'
import { Table } from 'primeng/table'

import { Action, Column, PortalMessageService } from '@onecx/portal-integration-angular'
import { HelpsInternalAPIService, Help, SearchHelpsRequestParams, HelpSearchCriteria } from '../../generated'

type ExtendedColumn = Column & { css?: string; limit?: boolean }
type ChangeMode = 'VIEW' | 'NEW' | 'EDIT'

@Component({
  selector: 'hm-help-search',
  templateUrl: './help-search.component.html',
  styleUrls: ['./help-search.component.scss']
})
export class HelpSearchComponent implements OnInit {
  @ViewChild('table', { static: false }) table!: Table

  public changeMode: ChangeMode = 'NEW'
  public actions: Action[] = []
  public helpItem: Help | undefined
  public results: Help[] = []
  public criteria: SearchHelpsRequestParams = {
    helpSearchCriteria: {}
  }
  public helpSearchCriteria!: HelpSearchCriteria
  public searchInProgress = false
  public loadingResults = false
  public displayDeleteDialog = false
  public displayDetailDialog = false
  public appsChanged = false
  public rowsPerPage = 10
  public rowsPerPageOptions = [10, 20, 50]
  public items$!: Observable<any>

  public filteredColumns: Column[] = []
  public columns: ExtendedColumn[] = [
    {
      field: 'appId',
      header: 'APPLICATION_ID',
      active: true,
      translationPrefix: 'HELP_ITEM',
      css: 'hidden sm:table-cell'
    },
    { field: 'itemId', header: 'HELP_ITEM_ID', active: true, translationPrefix: 'HELP_ITEM' },
    { field: 'context', header: 'CONTEXT', active: true, translationPrefix: 'HELP_ITEM', css: 'hidden xl:table-cell' },
    { field: 'baseUrl', header: 'BASE_URL', active: true, translationPrefix: 'HELP_ITEM', css: 'hidden lg:table-cell' },
    {
      field: 'resourceUrl',
      header: 'RESOURCE_URL',
      active: true,
      translationPrefix: 'HELP_ITEM',
      css: 'hidden xl:table-cell'
    }
  ]

  constructor(
    private helpInternalAPIService: HelpsInternalAPIService,
    private translate: TranslateService,
    private msgService: PortalMessageService
  ) {}

  ngOnInit(): void {
    this.search(this.criteria.helpSearchCriteria)
    this.filteredColumns = this.columns.filter((a) => {
      return a.active === true
    })

    this.translate.get(['ACTIONS.CREATE.LABEL', 'ACTIONS.CREATE.HELP_ITEM.TOOLTIP']).subscribe((data) => {
      this.actions.push({
        label: data['ACTIONS.CREATE.LABEL'],
        title: data['ACTIONS.CREATE.HELP_ITEM.TOOLTIP'],
        actionCallback: () => this.onCreate(),
        icon: 'pi pi-plus',
        show: 'always',
        permission: 'HELP#EDIT'
      })
    })
  }

  /****************************************************************************
   *  SEARCHING
   *    - initial, without any criteria => to be checked again with stakeholder
   *    - user initiated search with criteria
   *    - re-searching (with current criteria) after changes in detail dialog
   */
  public search(criteria: HelpSearchCriteria, reuseCriteria: boolean = false): void {
    var criteriaSearchParams: SearchHelpsRequestParams = {
      helpSearchCriteria: criteria
    }
    if (!reuseCriteria) {
      if (criteriaSearchParams.helpSearchCriteria?.appId === '') criteriaSearchParams.helpSearchCriteria.appId = undefined
      if (criteriaSearchParams.helpSearchCriteria?.itemId === '') criteriaSearchParams.helpSearchCriteria.itemId = undefined
      this.criteria = criteriaSearchParams
    }
    this.searchInProgress = true
    this.helpInternalAPIService
      .searchHelps(this.criteria)
      .pipe(finalize(() => (this.searchInProgress = false)))
      .subscribe({
        next: (data) => {
          if(data.stream !== undefined){
            this.results = data.stream
          }
          this.results?.sort(this.sortHelpItemByDefault)
          if (data.stream?.length === 0) {
            this.msgService.info({ summaryKey: 'GENERAL.SEARCH.MSG_NO_RESULTS' })
          }

          this.appsChanged = false
        },
        error: () => this.msgService.error({ summaryKey: 'GENERAL.SEARCH.MSG_SEARCH_FAILED' })
      })
  }
  public onSearch() {
    this.changeMode = 'NEW'
    this.appsChanged = true
    this.search(this.criteria.helpSearchCriteria, true)
  }

  // default sorting: 1. appId, 2.itemId
  private sortHelpItemByDefault(a: Help, b: Help): number {
    return (
      (a.appId ? (a.appId as string).toUpperCase() : '').localeCompare(
        b.appId ? (b.appId as string).toUpperCase() : ''
      ) ||
      (a.itemId ? (a.itemId as string).toUpperCase() : '').localeCompare(
        b.itemId ? (b.itemId as string).toUpperCase() : ''
      )
    )
  }

  public onColumnsChange(activeIds: string[]) {
    this.filteredColumns = activeIds.map((id) => this.columns.find((col) => col.field === id)) as Column[]
  }
  public onFilterChange(event: string): void {
    this.table.filterGlobal(event, 'contains')
  }

  /****************************************************************************
   *  CHANGES
   */
  public onCreate() {
    this.changeMode = 'NEW'
    this.appsChanged = false
    this.helpItem = undefined
    this.displayDetailDialog = true
  }
  public onDetail(ev: MouseEvent, item: Help, mode: ChangeMode): void {
    ev.stopPropagation()
    this.changeMode = mode
    this.appsChanged = false
    this.helpItem = item
    this.displayDetailDialog = true
  }
  public onCopy(ev: MouseEvent, item: Help) {
    ev.stopPropagation()
    this.changeMode = 'NEW'
    this.appsChanged = false
    this.helpItem = item
    this.displayDetailDialog = true
  }
  public onDelete(ev: MouseEvent, item: Help): void {
    ev.stopPropagation()
    this.helpItem = item
    this.appsChanged = false
    this.displayDeleteDialog = true
  }
  public onDeleteConfirmation(): void {
    if (this.helpItem?.id && typeof this.helpItem.appId === 'string') {

      this.helpInternalAPIService.deleteHelp({id: this.helpItem?.id }).subscribe({
        next: () => {
          this.displayDeleteDialog = false
          this.results = this.results?.filter((a) => a.id !== this.helpItem?.id)
          this.helpItem = undefined
          this.appsChanged = true
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_OK' })
        },
        error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.MESSAGE.HELP_ITEM_NOK' })
      })
    }
  }
}
