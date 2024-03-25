import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing'

export interface AHarnessFilters extends BaseHarnessFilters {
  class?: string
  id?: string
}

export class AHarness extends ComponentHarness {
  static hostSelector = 'a'

  static with(options: AHarnessFilters): HarnessPredicate<AHarness> {
    return new HarnessPredicate(AHarness, options)
      .addOption('class', options.class, (harness, c) => HarnessPredicate.stringMatches(harness.getByClass(c), c))
      .addOption('id', options.id, (harness, id) => HarnessPredicate.stringMatches(harness.hasId(id), id))
  }

  async getByClass(c: string): Promise<string> {
    return (await (await this.host()).hasClass(c)) ? c : ''
  }

  async hasId(id: string): Promise<string> {
    return (await (await this.host()).matchesSelector('#' + id)) ? id : ''
  }

  async checkHasClass(value: string) {
    return await (await this.host()).hasClass(value)
  }

  async getText(): Promise<string> {
    return await (await this.host()).text()
  }

  async click() {
    if (!(await this.isDisabled())) {
      await (await this.host()).click()
    } else {
      console.warn('Anchor cannot be clicked, because it is disabled!')
    }
  }

  async isDisabled(): Promise<boolean> {
    return await (await this.host()).getProperty('disabled')
  }

  async getClassList() {
    const host = await this.host()
    const attributeString = await host.getAttribute('class')
    if (attributeString) {
      return attributeString.trim().split(' ')
    }
    return []
  }
}
