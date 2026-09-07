// This object encapsulates functions because ...
//  ...Jasmine has problems to spying direct imported functions
export const Utils = {
  mapping_error_status(status: number): number {
    return [400, 401, 403, 404, 500].includes(status) ? status : 0
  },

  limitText(text: string | null | undefined, limit: number): string {
    if (text) {
      return text.length < limit ? text : text.substring(0, limit) + '...'
    } else {
      return ''
    }
  },

  sortByLocale(a: string, b: string): number {
    return a.toUpperCase().localeCompare(b.toUpperCase())
  }
}
