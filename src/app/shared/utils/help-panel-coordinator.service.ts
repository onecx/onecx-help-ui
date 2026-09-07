import { Injectable } from '@angular/core'

export type HelpPanelType = 'editor' | 'show'

@Injectable({ providedIn: 'root' })
export class HelpPanelCoordinatorService {
  private currentPanel: HelpPanelType | null = null
  private readonly closeHandlers = new Map<HelpPanelType, () => void>()

  public register(panel: HelpPanelType, closeHandler: () => void): void {
    this.closeHandlers.set(panel, closeHandler)
  }

  public open(panel: HelpPanelType): void {
    this.currentPanel = panel
  }

  public close(panel: HelpPanelType): void {
    if (this.currentPanel === panel) {
      this.closeHandlers.get(panel)?.()
      this.currentPanel = null
    }
  }

  public isOpen(panel: HelpPanelType): boolean {
    return this.currentPanel === panel
  }
}
