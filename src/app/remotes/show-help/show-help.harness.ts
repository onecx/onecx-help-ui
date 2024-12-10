import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXShowHelpHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-show-help'

  getShowHelpButton = this.locatorForOptional('#hm_show_help_item_action')

  async getShowHelpButtonId(): Promise<string | null | undefined> {
    return await (await this.getShowHelpButton())?.getAttribute('id')
  }

  async onClickShowHelpButton() {
    await (await this.getShowHelpButton())?.click()
  }
}
