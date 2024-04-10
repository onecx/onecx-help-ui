// import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing'
// import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
// import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'
// import { TranslateTestingModule } from 'ngx-translate-testing'

// import { NoHelpItemComponent } from './no-help-item.component'
// import { NoHelpItemHarness } from '../../harnesses/no-help-item.harness'

// describe('NoHelpItemComponent', () => {
//   let component: NoHelpItemComponent
//   let fixture: ComponentFixture<NoHelpItemComponent>
//   let noHelpItemHarness: NoHelpItemHarness

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       declarations: [],
//       imports: [
//         NoHelpItemComponent,
//         TranslateTestingModule.withTranslations({
//           en: require('../../../../assets/i18n/en.json'),
//           de: require('../../../../assets/i18n/de.json')
//         })
//       ],
//       providers: [DynamicDialogConfig, DynamicDialogRef]
//     }).compileComponents()

//     getTestBed().inject(DynamicDialogConfig).data = { helpArticleId: 'help-article-id' }

//     fixture = TestBed.createComponent(NoHelpItemComponent)
//     component = fixture.componentInstance

//     fixture.detectChanges()

//     noHelpItemHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, NoHelpItemHarness)
//   })

//   it('should create', () => {
//     expect(component).toBeTruthy()
//   })

//   it('should display translated content and hint from dialog config', async () => {
//     getTestBed().inject(DynamicDialogConfig).data = { helpArticleId: 'help-article-id' }

//     fixture = TestBed.createComponent(NoHelpItemComponent)
//     component = fixture.componentInstance

//     fixture.detectChanges()

//     noHelpItemHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, NoHelpItemHarness)

//     expect(await noHelpItemHarness.getContent()).toBe(
//       'No help items were found for this page. Please ask your system administrator to add it.'
//     )
//     expect(await noHelpItemHarness.getHintTitle()).toBe('The help Item ID for this page is:')
//     expect(await noHelpItemHarness.getArticleId()).toBe('help-article-id')
//   })

//   it('should not display hint if helpArticleId is not defined', async () => {
//     getTestBed().inject(DynamicDialogConfig).data = {}

//     fixture = TestBed.createComponent(NoHelpItemComponent)
//     component = fixture.componentInstance

//     fixture.detectChanges()

//     noHelpItemHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, NoHelpItemHarness)

//     expect(await noHelpItemHarness.getContent()).toBe(
//       'No help items were found for this page. Please ask your system administrator to add it.'
//     )
//     expect(await noHelpItemHarness.getHintTitle()).toBeUndefined()
//     expect(await noHelpItemHarness.getArticleId()).toBeUndefined()
//   })
// })
