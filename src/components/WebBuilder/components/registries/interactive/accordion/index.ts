import type { Editor } from 'grapesjs'
import { makeCheckboxTrait, makeNumberTrait } from '@/components/WebBuilder/utils/traitFactory'

export const WB_ACCORDION_TYPE = 'wb-accordion'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 6h16" />
  <path d="M4 12h16" />
  <path d="M4 18h16" />
  <path d="M17 9l3 3-3 3" />
</svg>`

const TEXT_STYLABLE_PROPS = [
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration'
] as const

const ACCORDION_CSS = `
  .wb-accordion {
    width: 100%;
    padding: 32px 0 40px;
    background: #ffffff;
    box-sizing: border-box;
  }
  .wb-accordion,
  .wb-accordion *,
  .wb-accordion *::before,
  .wb-accordion *::after {
    box-sizing: border-box;
  }
  .wb-accordion__inner {
    width: 100%;
  }
  .wb-accordion__list {
    width: 100%;
  }
  .wb-accordion__item {
    border-bottom: 1px solid #cfd4d9;
  }
  .wb-accordion__summary {
    width: 100%;
    min-height: 108px;
    border: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 26px 0;
    color: #111820;
    cursor: pointer;
    text-align: left;
    appearance: none;
  }
  .wb-accordion__summary:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 4px;
  }
  .wb-accordion__question {
    min-width: 0;
    margin: 0;
    color: #111820;
    font-size: 30px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  .wb-accordion__icon {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    color: #111820;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: rotate(0deg);
    transition: transform 220ms ease;
  }
  .wb-accordion__icon::before {
    content: '';
    width: 11px;
    height: 11px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(45deg) translateY(-1px);
    transform-origin: center;
  }
  .wb-accordion__item[data-open='true'] .wb-accordion__icon {
    transform: rotate(180deg);
  }
  .wb-accordion__panel {
    max-height: 0;
    overflow: hidden;
    padding: 0 64px 0 0;
    opacity: 0;
    color: #7d878f;
    transition:
      max-height 280ms ease,
      opacity 220ms ease,
      padding-bottom 220ms ease;
  }
  .wb-accordion__item[data-open='true'] .wb-accordion__panel {
    max-height: 360px;
    padding-bottom: 32px;
    opacity: 1;
  }
  .wb-accordion__answer {
    margin: 0;
    color: #7d878f;
    font-size: 20px;
    font-weight: 400;
    line-height: 1.45;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  @media (max-width: 1023px) {
    .wb-accordion {
      padding: 28px 0 36px;
    }
    .wb-accordion__inner {
      padding: 0 28px;
    }
    .wb-accordion__summary {
      min-height: 92px;
      padding: 22px 0;
      gap: 20px;
    }
    .wb-accordion__question {
      font-size: 24px;
    }
    .wb-accordion__panel {
      padding-right: 48px;
    }
    .wb-accordion__item[data-open='true'] .wb-accordion__panel {
      padding-bottom: 26px;
    }
    .wb-accordion__answer {
      font-size: 17px;
    }
  }
  @media (max-width: 767px) {
    .wb-accordion {
      padding: 20px 0 28px;
    }
    .wb-accordion__inner {
      padding: 0 16px;
    }
    .wb-accordion__summary {
      min-height: 72px;
      padding: 18px 0;
      gap: 16px;
    }
    .wb-accordion__question {
      font-size: 18px;
      line-height: 1.35;
    }
    .wb-accordion__icon {
      width: 18px;
      height: 18px;
    }
    .wb-accordion__icon::before {
      width: 9px;
      height: 9px;
    }
    .wb-accordion__panel {
      padding-right: 28px;
    }
    .wb-accordion__item[data-open='true'] .wb-accordion__panel {
      max-height: 460px;
      padding-bottom: 20px;
    }
    .wb-accordion__answer {
      font-size: 14px;
      line-height: 1.55;
    }
  }
`

function makeAccordionScript() {
  return function (
    this: HTMLElement,
    props: { allowMultiple?: boolean | string; defaultOpenIndex?: number | string }
  ) {
    const root = this as HTMLElement & {
      __wbAccordionBound?: boolean
      __wbAccordionObserver?: MutationObserver | null
    }
    if (!root) return

    function toBool(value: any) {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value === 'true'
      return !!value
    }

    function getDefaultOpenIndex() {
      const parsed = Number(
        props?.defaultOpenIndex ?? root.getAttribute('data-default-open-index') ?? 1
      )
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 1
    }

    function getAllowMultiple() {
      return toBool(props?.allowMultiple ?? root.getAttribute('data-allow-multiple'))
    }

    function getItems() {
      return Array.from(root.querySelectorAll('.wb-accordion__item')) as HTMLElement[]
    }

    function syncA11y() {
      const items = getItems()
      items.forEach((item, index) => {
        const summary = item.querySelector('.wb-accordion__summary') as HTMLElement | null
        const panel = item.querySelector('.wb-accordion__panel') as HTMLElement | null
        const isOpen = item.getAttribute('data-open') === 'true'
        const itemId = item.id || `wb-accordion-item-${Date.now()}-${index + 1}`
        const summaryId = summary?.id || `${itemId}-summary`
        const panelId = panel?.id || `${itemId}-panel`

        item.id = itemId
        if (summary) {
          summary.id = summaryId
          summary.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
          summary.setAttribute('aria-controls', panelId)
        }
        if (panel) {
          panel.id = panelId
          panel.setAttribute('role', 'region')
          panel.setAttribute('aria-labelledby', summaryId)
        }
      })
    }

    function applyInitialState() {
      const items = getItems()
      if (!items.length) return

      const openItems = items.filter((item) => item.getAttribute('data-open') === 'true')
      if (!openItems.length) {
        const defaultIndex = getDefaultOpenIndex()
        if (defaultIndex > 0 && items[defaultIndex - 1]) {
          items[defaultIndex - 1].setAttribute('data-open', 'true')
        }
      }

      if (!getAllowMultiple()) {
        let hasOpen = false
        items.forEach((item) => {
          const isOpen = item.getAttribute('data-open') === 'true'
          if (!isOpen) return
          if (hasOpen) {
            item.setAttribute('data-open', 'false')
            return
          }
          hasOpen = true
        })
      }

      syncA11y()
    }

    if (!root.__wbAccordionBound) {
      root.__wbAccordionBound = true
      root.addEventListener('click', (event) => {
        const summary = (event.target as HTMLElement | null)?.closest?.(
          '.wb-accordion__summary'
        ) as HTMLElement | null
        if (!summary || !root.contains(summary)) return

        const item = summary.closest('.wb-accordion__item') as HTMLElement | null
        if (!item) return

        const shouldOpen = item.getAttribute('data-open') !== 'true'
        if (getAllowMultiple()) {
          item.setAttribute('data-open', shouldOpen ? 'true' : 'false')
        } else {
          getItems().forEach((current) => {
            current.setAttribute('data-open', current === item && shouldOpen ? 'true' : 'false')
          })
        }
        syncA11y()
      })
    }

    root.__wbAccordionObserver?.disconnect?.()
    const observer = new MutationObserver(() => syncA11y())
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-open']
    })
    root.__wbAccordionObserver = observer

    applyInitialState()
  }
}

function createTextNode(tagName: string, className: string, content: string) {
  return {
    tagName,
    type: 'text',
    selectable: true,
    droppable: false,
    draggable: false,
    copyable: false,
    removable: false,
    editable: true,
    stylable: [...TEXT_STYLABLE_PROPS],
    attributes: { class: className },
    components: content
  }
}

function createAccordionItem(question: string, answer: string, open = false) {
  return {
    tagName: 'div',
    name: '手风琴项',
    selectable: true,
    droppable: false,
    draggable: '.wb-accordion__list',
    copyable: true,
    removable: true,
    attributes: {
      class: 'wb-accordion__item',
      'data-open': open ? 'true' : 'false'
    },
    components: [
      {
        tagName: 'button',
        name: '问题',
        selectable: true,
        droppable: false,
        draggable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-accordion__summary', type: 'button' },
        components: [
          createTextNode('span', 'wb-accordion__question', question),
          {
            tagName: 'span',
            selectable: false,
            droppable: false,
            draggable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-accordion__icon', 'aria-hidden': 'true' }
          }
        ]
      },
      {
        tagName: 'div',
        name: '答案',
        selectable: true,
        droppable: true,
        draggable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-accordion__panel' },
        components: [createTextNode('p', 'wb-accordion__answer', answer)]
      }
    ]
  }
}

function buildAccordionTree() {
  return [
    {
      tagName: 'div',
      name: '内容容器',
      selectable: false,
      hoverable: false,
      highlightable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-accordion__inner' },
      components: [
        {
          tagName: 'div',
          name: '手风琴列表',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: '.wb-accordion__item',
          copyable: false,
          removable: false,
          attributes: { class: 'wb-accordion__list' },
          components: [
            createAccordionItem(
              'Is there any quantity requirement when placing an order?',
              'Yes. For packaging and production efficiency, the order quantity must be in multiples of 6 (e.g., 6, 12, 18, 24 pieces, etc.). This ensures optimal use of packaging materials and stable shipment arrangements.',
              true
            ),
            createAccordionItem(
              'What types of helmets do you offer?',
              'We provide full-face, open-face, modular, off-road, and custom helmet options for different markets and applications.'
            ),
            createAccordionItem(
              'Do your helmets meet international safety standards?',
              'Yes. Our helmets can be produced to meet major market requirements, including DOT, ECE, and other applicable certification standards.'
            ),
            createAccordionItem(
              'Can you provide OEM or ODM services?',
              'Yes. We support logo customization, color matching, packaging design, tooling development, and product structure adjustments for OEM and ODM projects.'
            ),
            createAccordionItem(
              'What is your minimum order quantity (MOQ)?',
              'MOQ depends on the model, material, and customization requirements. Contact our team with your target style and market for a precise quotation.'
            ),
            createAccordionItem(
              'How long is your production lead time?',
              'Standard production usually takes 30 to 45 days after sample approval and deposit confirmation. Custom projects may require additional development time.'
            )
          ]
        }
      ]
    }
  ]
}

function resolveAccordionTraitTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_ACCORDION_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_ACCORDION_TYPE) as any
  if (fromSelected?.get?.('type') === WB_ACCORDION_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_ACCORDION_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_ACCORDION_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_ACCORDION_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_ACCORDION_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_ACCORDION_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_ACCORDION_TYPE) return fromTraitTarget

  return null
}

function createAddItemTrait() {
  return {
    type: 'button' as any,
    name: 'add-accordion-item',
    label: false as const,
    text: '+ 添加手风琴项',
    full: true,
    command(this: any, editor: Editor) {
      const accordion = resolveAccordionTraitTarget(editor, this)
      const list = accordion?.find?.('.wb-accordion__list')?.[0]
      const items = list?.components?.()
      if (!items) return

      const created = items.add(
        createAccordionItem('New accordion question', 'Add your answer text here.')
      )
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    }
  }
}

export function registerAccordionComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_ACCORDION_TYPE)) return

  domComponents.addType(WB_ACCORDION_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'accordion' ? { type: WB_ACCORDION_TYPE } : false,

    model: {
      defaults: {
        name: '手风琴',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'accordion',
          'data-allow-multiple': 'false',
          'data-default-open-index': '1',
          class: 'wb-accordion'
        },
        allowMultiple: false,
        defaultOpenIndex: 1,
        styles: ACCORDION_CSS,
        script: makeAccordionScript(),
        'script-export': makeAccordionScript(),
        'script-props': ['allowMultiple', 'defaultOpenIndex'],
        traits: [
          makeCheckboxTrait('允许多项展开', 'allowMultiple'),
          makeNumberTrait('默认展开项', 'defaultOpenIndex', { min: 0, max: 20, step: 1 }),
          createAddItemTrait()
        ],
        components: buildAccordionTree()
      },
      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        const allowMultiple =
          attrs['data-allow-multiple'] === 'true' || this.get('allowMultiple') === true
        const defaultOpenIndex = Math.max(
          0,
          Number(this.get('defaultOpenIndex') || attrs['data-default-open-index'] || 1) || 0
        )

        this.set('allowMultiple', allowMultiple, { silent: true })
        this.set('defaultOpenIndex', defaultOpenIndex, { silent: true })
        this.on('change:allowMultiple change:defaultOpenIndex', this._syncAttrs)
        this.on('change:defaultOpenIndex', this._applyDefaultOpenIndex)
        this._syncAttrs()
      },
      _syncAttrs(this: any) {
        const defaultOpenIndex = Math.max(0, Number(this.get('defaultOpenIndex') || 0) || 0)
        this.addAttributes({
          'data-wb-component': 'accordion',
          'data-allow-multiple': this.get('allowMultiple') ? 'true' : 'false',
          'data-default-open-index': String(defaultOpenIndex)
        })
      },
      _applyDefaultOpenIndex(this: any) {
        const defaultOpenIndex = Math.max(0, Number(this.get('defaultOpenIndex') || 0) || 0)
        const items = this.find?.('.wb-accordion__item') || []
        items.forEach((item: any, index: number) => {
          item.addAttributes?.({
            'data-open': defaultOpenIndex > 0 && index === defaultOpenIndex - 1 ? 'true' : 'false'
          })
        })
      }
    }
  })

  blockManager?.add?.(WB_ACCORDION_TYPE, {
    label: 'Accordion',
    category: 'Interactive',
    content: { type: WB_ACCORDION_TYPE },
    media: BLOCK_ICON
  })
}
