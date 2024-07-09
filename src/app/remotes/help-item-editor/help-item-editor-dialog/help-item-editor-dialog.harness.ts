import { ComponentHarness } from '@angular/cdk/testing'

export class HelpItemEditorDialogHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-help-item-editor'

  getHelpItemIdInput = this.locatorFor('#help-item-editor-field-helpitem-id')
  getHelpItemIdLabel = this.locatorFor('label[for=help-item-editor-field-helpitem-id]')
  getProductNameInput = this.locatorFor('#help-item-editor-field-product-name')
  getProductNameLabel = this.locatorFor('label[for=help-item-editor-field-product-name]')
  getBaseUrlInput = this.locatorFor('#help-item-editor-field-base-url')
  getBaseUrlLabel = this.locatorFor('label[for=help-item-editor-field-base-url]')
  getResourceUrlInput = this.locatorFor('#help-item-editor-field-resource-url')
  getResourceUrlLabel = this.locatorFor('label[for=help-item-editor-field-resource-url]')

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

  async getBaseUrlValue(): Promise<string> {
    return await (await this.getBaseUrlInput()).getProperty<string>('value')
  }

  async getBaseUrlLabelText(): Promise<string | undefined> {
    return await (await this.getBaseUrlLabel())?.text()
  }

  async getResourceUrlValue(): Promise<string> {
    return await (await this.getResourceUrlInput()).getProperty<string>('value')
  }

  async getResourceUrlLabelText(): Promise<string | undefined> {
    return await (await this.getResourceUrlLabel())?.text()
  }
}
