import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ShowHelpRemoteComponent } from './show-help.component'
import { ShowHelpRemoteHarness } from '../../harnesses/show-help.harness'
import { importProvidersFrom } from '@angular/core'
import { PrimeIcons } from 'primeng/api'

fdescribe('ShowHelpRemoteComponent', () => {
  let component: ShowHelpRemoteComponent
  let fixture: ComponentFixture<ShowHelpRemoteComponent>
  let showHelpRemoteHarness: ShowHelpRemoteHarness

  //   const helpApiServiceSpy = jasmine.createSpyObj<HelpAPIService>('HelpAPIService', ['getHelpDataItem'])

  beforeEach(async () => {
    // await TestBed.configureTestingModule({
    //   declarations: [IfPermissionDirective],
    //   imports: [
    //     CommonModule,
    //     HttpClientTestingModule,
    //     RippleModule,
    //     TooltipModule,
    //     DynamicDialogModule,
    //     ShowHelpRemoteComponent,
    //     NoHelpItemComponent,
    //     TranslateTestingModule.withTranslations({
    //       en: require('../../../../assets/i18n/en.json'),
    //       de: require('../../../../assets/i18n/de.json')
    //     }),
    //     PortalCoreModule
    //   ],
    //   providers: [{ provide: HelpAPIService, useValue: helpApiServiceSpy }, DialogService]
    // }).compileComponents()
    await TestBed.configureTestingModule({
      declarations: [],
      //   imports: [
      //     ShowHelpRemoteComponent
      //     // CommonModule,
      //     // HttpClientTestingModule,
      //     // RippleModule,
      //     // TooltipModule,
      //     // DynamicDialogModule,
      //     // NoHelpItemComponent,
      //     // PortalCoreModule
      //   ],
      providers: [
        //     // { provide: HelpAPIService, useValue: helpApiServiceSpy },
        //     // DialogService
        //     provideHttpClientTesting(),
        importProvidersFrom(
          TranslateTestingModule.withTranslations({
            en: require('../../../../assets/i18n/en.json'),
            de: require('../../../../assets/i18n/de.json')
          })
        )
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ShowHelpRemoteComponent)
    component = fixture.componentInstance

    fixture.detectChanges()

    showHelpRemoteHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, ShowHelpRemoteHarness)
  })

  //   afterEach(() => {
  //     helpApiServiceSpy.getHelpDataItem.calls.reset()
  //   })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  //   it('should not show button if permissions are not met', async () => {
  //     expect(await showHelpRemoteHarness.getHelpButtonTitle()).toBeUndefined()
  //   })

  it('should show button if permissions are met', async () => {
    //   component.permissions = ['PORTAL_HEADER_HELP#VIEW']

    //   fixture.detectChanges()

    expect(await showHelpRemoteHarness.getHelpButtonTitle()).toBe('Show Help for this article')

    expect(await showHelpRemoteHarness.hasHelpIconClass(PrimeIcons.QUESTION_CIRCLE)).toBe(true)
  })

  it('should apply correct linkItem class', async () => {
    expect(await showHelpRemoteHarness.hasHelpButtonClass('testLinkItemClass')).toBe(false)

    component.linkItemClass = 'testLinkItemClass'

    expect(await showHelpRemoteHarness.hasHelpButtonClass('testLinkItemClass')).toBe(true)
  })

  it('should apply correct iconItem class', async () => {
    expect(await showHelpRemoteHarness.hasHelpIconClass('testIconItemClass')).toBe(false)

    component.iconItemClass = 'testIconItemClass'

    expect(await showHelpRemoteHarness.hasHelpIconClass('testIconItemClass')).toBe(true)
  })

  it('should apply correct labelKey', async () => {
    expect(await showHelpRemoteHarness.getHelpButtonTitle()).toBe('Show Help for this article')

    component.labelKey = 'non-translatable-key'

    expect(await showHelpRemoteHarness.getHelpButtonTitle()).toBe('non-translatable-key')
  })

  it('should apply correct icon', async () => {
    expect(await showHelpRemoteHarness.hasHelpIconClass(PrimeIcons.QUESTION_CIRCLE)).toBe(true)

    component.icon = PrimeIcons.HOME

    expect(await showHelpRemoteHarness.hasHelpIconClass(PrimeIcons.HOME)).toBe(true)
  })

  it('should open help page on click if helpData was successfully fetched', async () => {
    const spy = spyOn(component, 'openHelpPage')

    await showHelpRemoteHarness.clickHelpButton()

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
