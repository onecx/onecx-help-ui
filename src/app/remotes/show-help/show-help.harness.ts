import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXShowHelpHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-show-help'

  getHelpButton = this.locatorForOptional('#show-help-item-button')

  async getHelpButtonId(): Promise<string | null | undefined> {
    return await (await this.getHelpButton())?.getAttribute('id')
  }

  async clickHelpButton() {
    await (await this.getHelpButton())?.click()
  }
}
