import { EximHelp } from './eximHelp'

export interface HelpSnapshot {
  /**
   * ID of the request
   */
  id?: string
  created?: string
  helps?: { [key: string]: EximHelp }
}
