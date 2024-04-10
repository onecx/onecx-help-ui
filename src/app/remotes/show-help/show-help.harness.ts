import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXShowHelpHarness extends ComponentHarness {
  static hostSelector = 'app-ocx-show-help'

  getHelpButton = this.locatorForOptional('#show-help-button')
  getHelpIcon = this.locatorForOptional('#show-help-button-icon')

  async getHelpButtonTitle(): Promise<string | null | undefined> {
    return await (await this.getHelpButton())?.getAttribute('title')
  }

  async clickHelpButton() {
    await (await this.getHelpButton())?.click()
  }

  async hasHelpButtonClass(c: string): Promise<boolean | undefined> {
    return (await (await this.getHelpButton())?.getAttribute('class'))?.includes(c)
  }

  async hasHelpIconClass(c: string): Promise<boolean | undefined> {
    return (await (await this.getHelpIcon())?.getAttribute('class'))?.includes(c)
  }
}
