import { ComponentHarness } from '@angular/cdk/testing'

export class NoHelpItemHarness extends ComponentHarness {
  static hostSelector = 'app-ocx-no-help-item'

  getContentSpan = this.locatorFor('#no-help-item-content')
  getHintSpan = this.locatorForOptional('#no-help-item-hint')
  getHintArticleSpan = this.locatorForOptional('#no-help-item-hint-article-id')

  async getContent(): Promise<string> {
    return await (await this.getContentSpan()).text()
  }

  async getHintTitle(): Promise<string | undefined> {
    return await (await this.getHintSpan())?.text()
  }

  async getArticleId(): Promise<string | undefined> {
    return await (await this.getHintArticleSpan())?.text()
  }
}
