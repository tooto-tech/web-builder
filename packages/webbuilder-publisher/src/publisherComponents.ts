import type { Editor } from 'grapesjs'

import { registerBasicPublisherComponents } from '@tooto-tech/webbuilder-components-basic/publisher'
import { registerCmsPublisherComponents } from '@tooto-tech/webbuilder-components-cms/publisher'

export interface WebBuilderPublisherComponentRegistrar {
  id: string
  register: (editor: Editor) => void
}

export const WEB_BUILDER_PUBLISHER_COMPONENT_REGISTRARS: WebBuilderPublisherComponentRegistrar[] = [
  { id: 'basic', register: registerBasicPublisherComponents },
  { id: 'cms', register: registerCmsPublisherComponents },
]

export function registerWebBuilderPublisherComponents(editor: Editor): void {
  for (const registrar of WEB_BUILDER_PUBLISHER_COMPONENT_REGISTRARS) {
    try {
      registrar.register(editor)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[WebBuilder Publisher] Failed to register ${registrar.id}: ${message}`)
    }
  }
}
