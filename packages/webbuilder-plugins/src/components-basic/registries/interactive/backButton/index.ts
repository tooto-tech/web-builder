import type { Editor } from 'grapesjs'
import { makeLinkTrait, makeTextTrait } from '../../../traitFactory.js'

const TYPE_BACK_BUTTON = 'wb-back-button'

export const WB_BACK_BUTTON_TYPE = TYPE_BACK_BUTTON

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="6" height="11" viewBox="0 0 6 11"><g transform="matrix(0,-1,-1,0,16,16)"><path d="M10.5,16.2071066L15.853554,10.85355341L15.1464462,10.14644659L10.5,14.7928934L5.85355341,10.14644659L5.14644659,10.85355341L10.5,16.2071066Z" fill-rule="evenodd" fill="#1B160C" fill-opacity="1"/></g></svg>`

function buildButtonChildren(text: string) {
  return [
    {
      tagName: 'span',
      classes: ['wb-back-button__icon'],
      selectable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      components: BLOCK_ICON,
    },
    {
      tagName: 'span',
      classes: ['wb-back-button__label'],
      selectable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      components: text,
    },
  ]
}

const backScript = function (this: HTMLElement, props: { fallbackUrl?: string }) {
  const root = this as HTMLElement & { __wbBackInit?: boolean }
  if (root.__wbBackInit) return
  root.__wbBackInit = true

  // 编辑器 canvas 在 iframe 中，避免误触发历史回退导致画布跳转。
  if (window.parent !== window) return

  root.addEventListener('click', (event) => {
    event.preventDefault()

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    const referrer = document.referrer
    if (referrer) {
      try {
        const refUrl = new URL(referrer, window.location.href)
        if (refUrl.origin === window.location.origin) {
          window.location.href = refUrl.href
          return
        }
      } catch (_) {
        // ignore invalid referrer
      }
    }

    const fallbackUrl = `${props?.fallbackUrl || ''}`.trim()
    if (fallbackUrl) {
      window.location.href = fallbackUrl
    }
  })
}

export function registerBackButtonComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(TYPE_BACK_BUTTON)) {
    return
  }

  domComponents.addType(TYPE_BACK_BUTTON, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'back-button') {
        return { type: TYPE_BACK_BUTTON }
      }
      return false
    },
    model: {
      defaults: {
        name: '返回上一页',
        tagName: 'button',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'back-button',
          type: 'button',
        },
        style: {
          display: 'inline-flex',
          'align-items': 'center',
          gap: '8px',
          color: '#111827',
          'font-size': '14px',
          'line-height': '1',
          cursor: 'pointer',
          'box-sizing': 'border-box',
        },
        styles: `
          .wb-back-button {
            transition: transform 0.18s ease, background-color 0.18s ease, color 0.18s ease;
          }
          .wb-back-button__icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            line-height: 1;
          }
          .wb-back-button__label {
            white-space: nowrap;
          }
          @media (max-width: 1023px) {
            .wb-back-button {
              gap: 6px !important;
            }
          }
          @media (max-width: 767px) {
            .wb-back-button {
              gap: 4px !important;
              font-size: 13px !important;
            }
            .wb-back-button__icon svg {
              width: 5px;
              height: 10px;
            }
          }
        `,
        classes: ['wb-back-button'],
        buttonText: 'Back',
        fallbackUrl: '/',
        components: buildButtonChildren('Back'),
        script: backScript,
        'script-export': backScript,
        'script-props': ['fallbackUrl'],
        traits: [
          makeTextTrait('按钮文字', 'buttonText', { placeholder: 'Back' }),
          makeLinkTrait({ label: '无历史时跳转', name: 'fallbackUrl', placeholder: '/' }),
        ],
      },
      init(this: any) {
        this.on('change:buttonText', this.applyButtonText)
        this.applyButtonText()
      },
      applyButtonText(this: any) {
        const text = `${this.get('buttonText') ?? 'Back'}`
        const children = this.components?.()
        if (children?.reset) {
          children.reset(buildButtonChildren(text))
        } else {
          this.components(buildButtonChildren(text))
        }
      },
    },
  })

  editor.BlockManager.add(TYPE_BACK_BUTTON, {
    label: 'Back',
    category: 'Interactive',
    content: { type: TYPE_BACK_BUTTON },
    media: BLOCK_ICON,
  })
}
