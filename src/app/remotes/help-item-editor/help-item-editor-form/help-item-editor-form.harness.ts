import { ComponentHarness } from '@angular/cdk/testing'

export class HelpItemEditorDialogHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-help-item-editor'

  getHelpItemIdInput = this.locatorFor('#hm_item_editor_form_helpitem_id')
  getProductNameInput = this.locatorFor('#hm_item_editor_form_product_name')
  getBaseUrlInput = this.locatorFor('#hm_item_editor_form_base_url')
  getResourceUrlInput = this.locatorFor('#hm_item_editor_form_resource_url')
  getContextInput = this.locatorFor('#hm_item_editor_form_context')

  async getHelpItemIdValue(): Promise<string> {
    return await (await this.getHelpItemIdInput()).getProperty<string>('value')
  }

  async getProductNameValue(): Promise<string> {
    return await (await this.getProductNameInput()).getProperty<string>('value')
  }

  async getBaseUrlValue(): Promise<string> {
    return await (await this.getBaseUrlInput()).getProperty<string>('value')
  }

  async getResourceUrlValue(): Promise<string> {
    return await (await this.getResourceUrlInput()).getProperty<string>('value')
  }

  async getContextValue(): Promise<string> {
    return await (await this.getContextInput()).getProperty<string>('value')
  }
}
