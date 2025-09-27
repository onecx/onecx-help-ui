import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { NoHelpItemComponent } from './no-help-item.component'
import { NoHelpItemHarness } from './no-help-item.harness'

describe('NoHelpItemComponent', () => {
  let component: NoHelpItemComponent
  let fixture: ComponentFixture<NoHelpItemComponent>
  let noHelpItemHarness: NoHelpItemHarness

  function initTestComponent() {
    fixture = TestBed.createComponent(NoHelpItemComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }
  const helpArticleId = 'PAGE_SEARCH'

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        NoHelpItemComponent,
        TranslateTestingModule.withTranslations({
          en: require('../../../../assets/i18n/en.json'),
          de: require('../../../../assets/i18n/de.json')
        })
      ],
      providers: [DynamicDialogConfig, DynamicDialogRef]
    }).compileComponents()

    getTestBed().inject(DynamicDialogConfig).data = { helpArticleId: helpArticleId }
  })

  it('should create', async () => {
    initTestComponent()
    noHelpItemHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, NoHelpItemHarness)

    expect(component).toBeTruthy()
  })

  it('should display and close', async () => {
    const data = { helpArticleId: helpArticleId, issueTypeKey: 'NO_HELP_ITEM' }
    getTestBed().inject(DynamicDialogConfig).data = data

    initTestComponent()
    noHelpItemHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, NoHelpItemHarness)

    expect(await noHelpItemHarness.getContent()).toBe('No Help Item has been defined for this page.')
    expect(await noHelpItemHarness.getHintTitle()).toBe('The Help Item ID for this page is:  ' + data.helpArticleId)
    expect(await noHelpItemHarness.getArticleId()).toBe(helpArticleId)

    component.ocxDialogButtonClicked({
      id: helpArticleId,
      result: true,
      button: 'primary'
    })
  })

  it('should not display hint if helpArticleId is not defined', async () => {
    getTestBed().inject(DynamicDialogConfig).data = {}

    fixture = TestBed.createComponent(NoHelpItemComponent)
    component = fixture.componentInstance

    fixture.detectChanges()

    noHelpItemHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, NoHelpItemHarness)

    expect(await noHelpItemHarness.getContent()).toBe('No Help Item has been defined for this page.')
    expect(await noHelpItemHarness.getHintTitle()).toBeUndefined()
    expect(await noHelpItemHarness.getArticleId()).toBeUndefined()
  })
})
