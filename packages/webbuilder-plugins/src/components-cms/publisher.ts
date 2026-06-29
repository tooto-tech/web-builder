import type { Editor } from 'grapesjs'

import { registerDynamicBreadcrumbBlock } from './registries/dynamic/cms/dynamicField/blocks/breadcrumbBlock.js'
import { registerDynamicConditionalBlock } from './registries/dynamic/cms/dynamicField/blocks/conditionalBlock.js'
import { registerDynamicDatetimeBlock } from './registries/dynamic/cms/dynamicField/blocks/datetimeBlock.js'
import { registerDynamicHtmlBlock } from './registries/dynamic/cms/dynamicField/blocks/htmlBlock.js'
import { registerDynamicImageBlock } from './registries/dynamic/cms/dynamicField/blocks/imageBlock.js'
import { registerDynamicLinkBlock } from './registries/dynamic/cms/dynamicField/blocks/linkBlock.js'
import { registerDynamicSeoBlock } from './registries/dynamic/cms/dynamicField/blocks/seoBlock.js'
import { registerDynamicTextBlock } from './registries/dynamic/cms/dynamicField/blocks/textBlock.js'
import { registerDynamicTocBlock } from './registries/dynamic/cms/dynamicField/blocks/tocBlock.js'
import { registerLoopGridPublisherComponent } from './registries/dynamic/loopGrid/publisher.js'
import { registerNavbarThbPublisherComponent } from './registries/navigation/navbarThb/index.js'

export interface CmsPublisherRegistryExecutor {
  id: string
  register: (editor: Editor) => void
}

export const CMS_PUBLISHER_REGISTRIES: CmsPublisherRegistryExecutor[] = [
  { id: 'cmsDynamicText', register: registerDynamicTextBlock },
  { id: 'cmsDynamicHtml', register: registerDynamicHtmlBlock },
  { id: 'cmsDynamicImage', register: registerDynamicImageBlock },
  { id: 'cmsDynamicLink', register: registerDynamicLinkBlock },
  { id: 'cmsDynamicDatetime', register: registerDynamicDatetimeBlock },
  { id: 'cmsDynamicConditional', register: registerDynamicConditionalBlock },
  { id: 'cmsDynamicBreadcrumb', register: registerDynamicBreadcrumbBlock },
  { id: 'cmsDynamicToc', register: registerDynamicTocBlock },
  { id: 'cmsDynamicSeo', register: registerDynamicSeoBlock },
  { id: 'loopGrid', register: registerLoopGridPublisherComponent },
  { id: 'navbarThb', register: registerNavbarThbPublisherComponent },
]

export function registerCmsPublisherComponents(editor: Editor): void {
  for (const registry of CMS_PUBLISHER_REGISTRIES) {
    try {
      registry.register(editor)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[WebBuilder Publisher] Failed to register cms:${registry.id}: ${message}`)
    }
  }
}
