export function limitText(text: string | null | undefined, limit: number): string {
  if (text) {
    return text.length < limit ? text : text.substring(0, limit) + '...'
  } else {
    return ''
  }
}

export function sortByLocale(a: any, b: any): number {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return 0
  }
  return a.toUpperCase().localeCompare(b.toUpperCase())
}
