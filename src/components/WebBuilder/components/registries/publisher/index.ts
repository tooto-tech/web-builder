import type { Editor } from 'grapesjs'

import { COMPONENT_REGISTRIES } from '..'

export function registerWebBuilderPublisherComponents(editor: Editor): void {
  for (const registry of COMPONENT_REGISTRIES) {
    try {
      registry.register(editor)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[WebBuilder Publisher] Failed to register ${registry.id}: ${message}`)
    }
  }
}
