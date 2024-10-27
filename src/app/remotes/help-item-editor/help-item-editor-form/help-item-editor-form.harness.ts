import { ComponentHarness } from '@angular/cdk/testing'

export class HelpItemEditorDialogHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-help-item-editor'

  getHelpItemIdInput = this.locatorFor('#hm_item_editor_field_helpitem_id')
  getHelpItemIdLabel = this.locatorFor('label[for=hm_item_editor_field_helpitem_id]')
  getProductNameInput = this.locatorFor('#hm_item_editor_field_product_name')
  getProductNameLabel = this.locatorFor('label[for=hm_item_editor_field_product_name]')
  getBaseUrlInput = this.locatorFor('#hm_item_editor_field_base_url')
  getBaseUrlLabel = this.locatorFor('label[for=hm_item_editor_field_base_url]')
  getResourceUrlInput = this.locatorFor('#hm_item_editor_field_resource_url')
  getResourceUrlLabel = this.locatorFor('label[for=hm_item_editor_field_resource_url]')

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
