import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXHelpItemEditorHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-help-item-editor'

  getHelpEditorButton = this.locatorForOptional('#ocx_topbar_action_help_edit')

  async getShowHelpButtonEditorId(): Promise<string | null | undefined> {
    return await (await this.getHelpEditorButton())?.getAttribute('id')
  }

  async clickHelpEditorButton() {
    await (await this.getHelpEditorButton())?.click()
  }
}
