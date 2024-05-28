import { ComponentHarness } from '@angular/cdk/testing'

export class HelpItemEditorDialogHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-help-item-editor'

  getHelpItemIdInput = this.locatorFor('#helpItemId')
  getHelpItemIdLabel = this.locatorFor('label[for=helpItemId]')
  getProductNameInput = this.locatorFor('#productName')
  getProductNameLabel = this.locatorFor('label[for=productName]')
  getResourceUrlInput = this.locatorFor('#resourceUrl')
  getResourceUrlLabel = this.locatorFor('label[for=resourceUrl]')

  async getHelpItemIdValue(): Promise<string> {
    return await (await this.getHelpItemIdInput()).getProperty<string>('value')
  }

  async getHelpItemIdLabelText(): Promise<string | undefined> {
    return await (await this.getHelpItemIdLabel())?.text()
  }

  async getProductNameValue(): Promise<string> {
    return await (await this.getProductNameInput()).getProperty<string>('value')
  }

  async getProductNameLabelText(): Promise<string | undefined> {
    return await (await this.getProductNameLabel())?.text()
  }

  async getResourceUrlValue(): Promise<string> {
    return await (await this.getResourceUrlInput()).getProperty<string>('value')
  }

  async getResourceUrlLabelText(): Promise<string | undefined> {
    return await (await this.getResourceUrlLabel())?.text()
  }
}
