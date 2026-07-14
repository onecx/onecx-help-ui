interface Help {
  itemId: { [key: string]: HelpContent }
}
interface HelpContent {
  context?: string
  baseUrl?: string
  resourceUrl?: string
}
export interface EximHelp {
  productName?: { [key: string]: Help }
}
