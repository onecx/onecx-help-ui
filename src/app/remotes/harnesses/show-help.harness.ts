import { ComponentHarness } from '@angular/cdk/testing'

import { AHarness } from './a.harness'
import { IHarness } from './i.harness'

export class ShowHelpRemoteHarness extends ComponentHarness {
  static hostSelector = 'app-ocx-show-help'

  getHelpButton = this.locatorForOptional(AHarness.with({ id: 'show-help-button' }))
  getHelpIcon = this.locatorForOptional(IHarness.with({ id: 'show-help-button-icon' }))

  async getHelpButtonTitle(): Promise<string | null | undefined> {
    return (await (await this.getHelpButton())?.host())?.getAttribute('title')
  }

  async clickHelpButton() {
    await (await this.getHelpButton())?.click()
  }

  async hasHelpButtonClass(c: string): Promise<boolean | undefined> {
    return (await (await this.getHelpButton())?.getClassList())?.join('').includes(c)
  }

  async hasHelpIconClass(c: string): Promise<boolean | undefined> {
    return (await (await this.getHelpIcon())?.getClassList())?.join(' ').includes(c)
  }
}
