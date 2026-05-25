import type { Editor } from 'grapesjs'
import { createContainerBlockContent } from '@/components/WebBuilder/components/registries/layout/container'

export const WB_SECTION_TYPE = 'wb-section'

const SECTION_CSS = `
  .wb-section {
    width: 100%;
    box-sizing: border-box;
  }

  @media (max-width: 767px) {
    .wb-section {
      padding: 50px 0 !important;
    }
  }
`

export function registerSectionComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_SECTION_TYPE)) {
    return
  }

  domComponents.addType(WB_SECTION_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'section') {
        return { type: WB_SECTION_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: 'Section',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        stylable: true,
        copyable: true,
        removable: true,
        attributes: {
          'data-wb-component': 'section',
          class: 'wb-section',
        },
        style: {
          width: '100%',
          'box-sizing': 'border-box',
          padding: '100px 0',
        },
        styles: SECTION_CSS,
        components: [
          createContainerBlockContent(),
        ],
      },
    },
  })
}
