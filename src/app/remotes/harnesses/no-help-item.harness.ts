// import { ComponentHarness } from '@angular/cdk/testing'
// import { SpanHarness } from '@onecx/angular-testing'

// export class NoHelpItemHarness extends ComponentHarness {
//   static hostSelector = 'app-ocx-no-help-item'

//   getContentSpan = this.locatorFor(SpanHarness.with({ id: 'no-help-item-content' }))
//   getHintSpan = this.locatorForOptional(SpanHarness.with({ id: 'no-help-item-hint' }))
//   getHintArticleSpan = this.locatorForOptional(SpanHarness.with({ id: 'no-help-item-hint-article-id' }))

//   async getContent(): Promise<string> {
//     return await (await this.getContentSpan()).getText()
//   }

//   async getHintTitle(): Promise<string | undefined> {
//     return await (await this.getHintSpan())?.getText()
//   }

//   async getArticleId(): Promise<string | undefined> {
//     return await (await this.getHintArticleSpan())?.getText()
//   }
// }
