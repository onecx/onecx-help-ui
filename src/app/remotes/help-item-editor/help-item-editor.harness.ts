import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXHelpItemEditorHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-help-item-editor'

  // PrimeNG buttons embed real HTML buttons, which really are the ones that should be clicked
  getHelpEditorPButton = this.locatorForOptional('#ocx_topbar_action_edit_help_item')
  getHelpEditorButton = this.locatorForOptional('#ocx_topbar_action_edit_help_item button')

  async getHelpEditorButtonId(): Promise<string | null | undefined> {
    return await (await this.getHelpEditorPButton())?.getAttribute('id')
  }

  async clickHelpEditorButton() {
    await (await this.getHelpEditorButton())?.click()
  }
}
