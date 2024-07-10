import { ComponentHarness } from '@angular/cdk/testing'

export class OneCXHelpItemEditorHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-help-item-editor'

  getHelpEditorButton = this.locatorForOptional('#help-item-editor-button')

  // async getHelpButtonEditorTitle(): Promise<string | null | undefined> {
  //   return await (await this.getHelpEditorButton())?.getAttribute('title')
  // }

  async clickHelpEditorButton() {
    await (await this.getHelpEditorButton())?.click()
  }
}
