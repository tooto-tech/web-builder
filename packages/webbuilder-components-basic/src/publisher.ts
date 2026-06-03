import type { Editor } from 'grapesjs'

import { registerInquiryFormComponent } from './registries/interactive/inquiryForm/index.js'
import { BASIC_INTERACTIVE_REGISTRIES } from './registries/interactive/index.js'
import { registerKlaviyoSubscribeComponent } from './registries/interactive/klaviyoSubscribe/index.js'
import { LAYOUT_REGISTRIES } from './registries/layout/index.js'
import { BASIC_MEDIA_REGISTRIES } from './registries/media/index.js'
import { BASIC_NAVIGATION_REGISTRIES } from './registries/navigation/index.js'
import { BASIC_SECTION_REGISTRIES } from './registries/section/index.js'
import { TYPOGRAPHY_REGISTRIES } from './registries/typography/index.js'
import type { ComponentRegistryExecutor } from './registries/types.js'

export const BASIC_PUBLISHER_REGISTRIES: ComponentRegistryExecutor[] = [
  ...LAYOUT_REGISTRIES,
  ...TYPOGRAPHY_REGISTRIES,
  ...BASIC_MEDIA_REGISTRIES,
  ...BASIC_INTERACTIVE_REGISTRIES,
  { id: 'inquiryForm', register: registerInquiryFormComponent },
  { id: 'klaviyoSubscribe', register: registerKlaviyoSubscribeComponent },
  ...BASIC_SECTION_REGISTRIES,
  ...BASIC_NAVIGATION_REGISTRIES,
]

export function registerBasicPublisherComponents(editor: Editor): void {
  for (const registry of BASIC_PUBLISHER_REGISTRIES) {
    try {
      registry.register(editor)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[WebBuilder Publisher] Failed to register basic:${registry.id}: ${message}`)
    }
  }
}
