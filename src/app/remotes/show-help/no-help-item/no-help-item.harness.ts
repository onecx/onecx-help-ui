import { ComponentHarness } from '@angular/cdk/testing'

export class NoHelpItemHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-no-help-item'

  getHintElement = this.locatorForOptional('#hm_no_help_item_hint')
  getContentElement = this.locatorFor('#hm_no_help_item_text')
  getHintArticleElement = this.locatorForOptional('#hm_no_help_item_hint_article_id')

  async getHintTitle(): Promise<string | undefined> {
    return await (await this.getHintElement())?.text()
  }

  async getContent(): Promise<string> {
    return await (await this.getContentElement()).text()
  }

  async getArticleId(): Promise<string | undefined> {
    return await (await this.getHintArticleElement())?.text()
  }
}
