import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXShowHelpHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-show-help'

  getShowHelpButton = this.locatorForOptional('#ocx_topbar_action_show_help_item')

  async getShowHelpButtonId(): Promise<string | null | undefined> {
    return await (await this.getShowHelpButton())?.getAttribute('id')
  }

  async onClickShowHelpButton() {
    await (await this.getShowHelpButton())?.click()
  }
}
