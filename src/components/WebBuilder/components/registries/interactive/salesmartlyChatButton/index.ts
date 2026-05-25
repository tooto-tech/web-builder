import type { Editor } from 'grapesjs'
import { makeTextTrait } from '@/components/WebBuilder/utils/traitFactory'

export const WB_SALESMARTLY_CHAT_BUTTON_TYPE = 'wb-salesmartly-chat-button'

declare global {
  interface Window {
    ssq?: {
      push: (event: string) => void
    }
  }
}

function buildButtonChildren(text: string) {
  return [{ type: 'textnode', content: text }]
}

const salesmartlyChatScript = function (this: HTMLElement) {
  const root = this as HTMLElement & { __wbSalesmartlyChatInit?: boolean }
  if (root.__wbSalesmartlyChatInit) return
  root.__wbSalesmartlyChatInit = true

  root.addEventListener('click', (event) => {
    event.preventDefault()

    if (window.ssq) {
      window.ssq.push('chatOpen')
    }
  })
}

export function registerSalesmartlyChatButtonComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_SALESMARTLY_CHAT_BUTTON_TYPE)) {
    return
  }

  domComponents.addType(WB_SALESMARTLY_CHAT_BUTTON_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'salesmartly-chat-button') {
        return { type: WB_SALESMARTLY_CHAT_BUTTON_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: 'Salesmartly 会话按钮',
        tagName: 'button',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'salesmartly-chat-button',
          type: 'button',
        },
        style: {
          all: 'unset',
          cursor: 'pointer',
        },
        buttonText: 'Chat',
        components: buildButtonChildren('Chat'),
        script: salesmartlyChatScript,
        'script-export': salesmartlyChatScript,
        traits: [
          makeTextTrait('按钮文字', 'buttonText', { placeholder: 'Chat' }),
        ],
      },
      init(this: any) {
        this.on('change:buttonText', this.applyButtonText)
        this.applyButtonText()
      },
      applyButtonText(this: any) {
        const text = `${this.get('buttonText') ?? 'Chat'}`
        const children = this.components?.()
        if (children?.reset) {
          children.reset(buildButtonChildren(text))
        } else {
          this.components(buildButtonChildren(text))
        }
      },
    },
  })
}
