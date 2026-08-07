import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXShowHelpHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-show-help'

  // PrimeNG buttons embed real HTML buttons, which really are the ones that should be clicked
  getShowHelpButton = this.locatorForOptional('#ocx_topbar_action_show_help_item button')
  getShowHelpPButton = this.locatorForOptional('#ocx_topbar_action_show_help_item')

  async getShowHelpButtonId(): Promise<string | null | undefined> {
    return await (await this.getShowHelpPButton())?.getAttribute('id')
  }

  async onClickShowHelpButton() {
    await (await this.getShowHelpButton())?.click()
  }
}
