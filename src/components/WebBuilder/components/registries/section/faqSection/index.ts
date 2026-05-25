import type { Editor } from 'grapesjs'
import { makeNumberTrait, makeTextTrait, makeSvgIconPickerTrait } from '@/components/WebBuilder/utils/traitFactory'
import { getAllFaqCategoryList } from '@/api/content/faqCategory'
import { registerCmsTypeEntry } from '@/components/WebBuilder/utils/cmsFactory'
import { toNumber } from '@/components/WebBuilder/utils/styleHelpers'

export const WB_FAQ_SECTION_TYPE = 'wb-faq-section'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M5 7.5h14" />
  <path d="M5 12h14" />
  <path d="M5 16.5h14" />
  <path d="M17 5l2 2-2 2" />
  <path d="M17 10l2 2-2 2" />
  <path d="M17 14.5l2 2-2 2" />
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

type FaqCategoryTraitOption = {
  value: string
  label: string
}

let faqCategoryTraitOptionsPromise: Promise<FaqCategoryTraitOption[]> | null = null

async function loadFaqCategoryTraitOptions(): Promise<FaqCategoryTraitOption[]> {
  const list = await getAllFaqCategoryList()
  const normalized = Array.isArray(list) ? list : []

  return normalized
    .filter((item) => item?.id != null && String(item?.name ?? '').trim())
    .sort((a, b) => {
      const sortA = Number(a?.sort ?? 0)
      const sortB = Number(b?.sort ?? 0)
      if (sortA !== sortB) return sortA - sortB
      return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'zh-Hans-CN')
    })
    .map((item) => ({
      value: String(item.id),
      label: String(item.name),
    }))
}

function getFaqCategoryTraitOptions(): Promise<FaqCategoryTraitOption[]> {
  if (!faqCategoryTraitOptionsPromise) {
    faqCategoryTraitOptionsPromise = loadFaqCategoryTraitOptions().catch((error) => {
      faqCategoryTraitOptionsPromise = null
      throw error
    })
  }
  return faqCategoryTraitOptionsPromise
}

function toFaqBoolean(value: unknown, fallback = false): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return fallback
}

async function initFaqCategorySelectTrait(model: any): Promise<void> {
  const trait = model.getTrait?.('cmsCategoryId')
  if (!trait) return

  const currentValue = String(model.get('cmsCategoryId') ?? '').trim()

  try {
    const options = await getFaqCategoryTraitOptions()
    const traitOptions: FaqCategoryTraitOption[] = [
      { value: '', label: '请选择 FAQ 分类' },
      ...options,
    ]

    if (currentValue && !traitOptions.some((item) => item.value === currentValue)) {
      traitOptions.push({
        value: currentValue,
        label: `当前分类 (#${currentValue})`,
      })
    }

    trait.set('options', traitOptions)
  } catch {
    const fallbackOptions: FaqCategoryTraitOption[] = [
      { value: '', label: '请选择 FAQ 分类' },
    ]

    if (currentValue) {
      fallbackOptions.push({
        value: currentValue,
        label: `当前分类 (#${currentValue})`,
      })
    }

    trait.set('options', fallbackOptions)
  }
}

export function makeFaqSectionScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      __wbFaqBound?: boolean
      __wbFaqObserver?: MutationObserver | null
      __wbFaqAccordionMode?: boolean
    }
    if (!root) return

    const getItems = () => Array.from(root.querySelectorAll('.wb-faq-section__item')) as HTMLElement[]

    const getAccordionMode = () => {
      const mode = root.getAttribute('data-accordion-mode')
      return mode === 'false' ? false : true
    }

    const getInitialExpandedCount = () => {
      const count = parseInt(root.getAttribute('data-initial-expanded') || '1', 10)
      return Math.max(0, count)
    }

    const getShowSeeMore = () => {
      const show = root.getAttribute('data-show-see-more')
      return show === 'true' ? true : false
    }

    const ensureInitialOpen = () => {
      const items = getItems()
      if (!items.length) return

      const accordionMode = getAccordionMode()
      const initialExpandedCount = getInitialExpandedCount()

      const openItems = items.filter((item) => item.getAttribute('data-open') === 'true')
      if (!openItems.length) {
        // 根据初始展开数量设置
        for (let i = 0; i < Math.min(initialExpandedCount, items.length); i++) {
          items[i].setAttribute('data-open', 'true')
        }
        return
      }

      // 如果是手风琴模式且初始展开数量大于1，则允许初始展开数量生效
      // 只有在用户手动交互时才强制手风琴模式
      if (accordionMode && openItems.length > 1 && initialExpandedCount <= 1) {
        openItems.forEach((item, index) => {
          if (index === 0) return
          item.setAttribute('data-open', 'false')
        })
      }
    }

    const setupSeeMore = () => {
      const showSeeMore = getShowSeeMore()
      if (!showSeeMore) return

      const items = getItems()
      items.forEach((item) => {
        const answer = item.querySelector('.wb-faq-section__answer') as HTMLElement | null
        if (!answer) return

        // 移除现有的see more
        const existingSeeMore = answer.querySelector('.wb-faq-section__see-more')
        if (existingSeeMore) {
          existingSeeMore.remove()
        }

        // 检查内容是否需要截断
        const content = answer.innerHTML || ''
        if (content.length < 200) return

        // 创建see more链接
        const seeMore = document.createElement('span')
        seeMore.className = 'wb-faq-section__see-more'
        seeMore.textContent = 'see more'

        seeMore.addEventListener('click', (e) => {
          e.stopPropagation()
          answer.style.maxHeight = 'none'
          answer.style.overflow = 'visible'
          seeMore.remove()
        })

        answer.appendChild(seeMore)
      })
    }

    if (!root.__wbFaqBound) {
      root.__wbFaqBound = true
      root.addEventListener('click', (event) => {
        const trigger = (event.target as HTMLElement | null)?.closest?.('.wb-faq-section__summary') as HTMLElement | null
        if (!trigger) return
        const item = trigger.closest('.wb-faq-section__item') as HTMLElement | null
        if (!item || !root.contains(item)) return

        const accordionMode = getAccordionMode()
        const shouldOpen = item.getAttribute('data-open') !== 'true'

        if (accordionMode) {
          // 手风琴模式：只允许一个展开
          getItems().forEach((detail) => {
            detail.setAttribute('data-open', detail === item && shouldOpen ? 'true' : 'false')
          })
        } else {
          // 多选模式：可以同时展开多个
          item.setAttribute('data-open', shouldOpen ? 'true' : 'false')
        }

        // 展开后设置see more
        if (shouldOpen) {
          setTimeout(() => setupSeeMore(), 300)
        }
      })
    }

    root.__wbFaqObserver?.disconnect?.()

    const observer = new MutationObserver(() => {
      ensureInitialOpen()
      setupSeeMore()
    })

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-open', 'data-accordion-mode', 'data-initial-expanded', 'data-show-see-more'],
    })

    root.__wbFaqObserver = observer
    ensureInitialOpen()
    setupSeeMore()
  }
}

export const FAQ_SECTION_CSS = `
  .wb-faq-section {
    width: 100%;
    padding: 96px 0 104px;
    background: #ffffff;
    box-sizing: border-box;
    min-height: 0;
    --faq-primary-color: #000a11;
    --faq-border-color: #d9dde1;
    --faq-answer-color: #768389;
    --faq-icon-color: #111827;
    --faq-question-font-size: 24px;
    --faq-answer-font-size: 16px;
    --faq-padding-vertical: 26px;
    --faq-answer-max-height: 320px;
  }
  .wb-faq-section,
  .wb-faq-section *,
  .wb-faq-section *::before,
  .wb-faq-section *::after {
    box-sizing: border-box;
  }
  .wb-faq-section__inner {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }
  .wb-faq-section__title {
    margin: 0 0 56px;
    color: var(--faq-primary-color, #000a11);
    text-align: center;
    font-size: clamp(42px, 4vw, 64px);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.03em;
  }
  .wb-faq-section__list {
    width: 100%;
  }
  .wb-faq-section__item {
    border-bottom: 1px solid var(--faq-border-color, #d9dde1);
  }
  .wb-faq-section__item:first-child {
    border-top: 0;
  }
  .wb-faq-section__summary {
    width: 100%;
    border: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    cursor: pointer;
    padding: var(--faq-padding-vertical, 26px) 0;
    text-align: left;
  }
  .wb-faq-section__question {
    font-size: 24px;
    font-weight: 600;
    line-height: 140%;
    color: var(--faq-primary-color, #000a11);
    margin: 0;
  }
  .wb-faq-section__icon {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    color: var(--faq-icon-color, #111827);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: rotate(0deg);
    transition: transform 240ms ease;
  }
  .wb-faq-section__icon svg {
    width: 100%;
    height: 100%;
    transition: transform 240ms ease;
  }
  .wb-faq-section__item[data-open='true'] .wb-faq-section__icon svg {
    transform: rotate(180deg);
  }
  .wb-faq-section__icon::before {
    content: '';
    width: 10px;
    height: 10px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(45deg) translateY(-1px);
    transform-origin: center;
    display: none;
  }
  .wb-faq-section__icon:empty::before {
    display: block;
  }
  .wb-faq-section__answer {
    max-height: 0;
    overflow: hidden;
    padding: 0 56px 0 0;
    color: var(--faq-answer-color, #768389);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0;
    opacity: 0;
    transition:
      max-height 280ms ease,
      opacity 220ms ease,
      padding-bottom 220ms ease;
  }
  .wb-faq-section__item[data-open='true'] .wb-faq-section__answer {
    max-height: var(--faq-answer-max-height, 320px);
    padding-bottom: var(--faq-padding-vertical, 26px);
    opacity: 1;
  }
  .wb-faq-section__answer > *:first-child {
    margin-top: 0;
  }
  .wb-faq-section__answer > *:last-child {
    margin-bottom: 0;
  }
  .wb-faq-section__answer p {
    margin: 0;
  }
  .wb-faq-section__see-more {
    color: var(--faq-primary-color, #000a11);
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
    margin-top: 8px;
    display: inline-block;
  }
  @media (max-width: 1023px) {
    .wb-faq-section {
      padding: 72px 0 80px;
    }
    .wb-faq-section__title {
      margin-bottom: 44px;
      font-size: 48px;
    }
    .wb-faq-section__summary {
      padding: 22px 0;
    }
    .wb-faq-section__question {
      font-size: 21px;
    }
    .wb-faq-section__answer {
      padding: 0 40px 22px 0;
      font-size: 15px;
    }
  }
  @media (max-width: 767px) {
    .wb-faq-section {
      padding: 40px 0 48px;
    }
    .wb-faq-section__title {
      margin-bottom: 28px;
      font-size: 24px;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    .wb-faq-section__summary {
      gap: 16px;
      padding: 18px 0;
    }
    .wb-faq-section__question {
      font-size: 16px;
      line-height: 1.45;
    }
    .wb-faq-section__icon {
      width: 16px;
      height: 16px;
    }
    .wb-faq-section__icon::before {
      width: 8px;
      height: 8px;
    }
    .wb-faq-section__answer {
      padding: 0 28px 18px 0;
      font-size: 13px;
      line-height: 1.55;
    }
  }
`

function createTextNode(tagName: string, className: string, content: string, style?: Record<string, string>) {
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
    ...(style ? { style } : {}),
    components: content,
  }
}

function createFaqTemplateItem() {
  return {
        tagName: 'div',
        selectable: true,
        droppable: false,
        draggable: false,
        copyable: false,
        removable: false,
        attributes: {
          class: 'wb-faq-section__item',
          'data-open': 'true',
        },
        components: [
          {
        tagName: 'button',
        selectable: true,
        droppable: false,
        draggable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-faq-section__summary', type: 'button' },
        components: [
          {
            tagName: 'span',
            selectable: true,
            droppable: false,
            draggable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-faq-section__question', 'data-cms-bind': 'faq.question' },
            components: 'Is there any quantity requirement when placing an order?',
          },
          {
            tagName: 'span',
            selectable: true,
            droppable: false,
            draggable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-faq-section__icon', 'aria-hidden': 'true' },
            components: '',
          },
        ],
      },
      {
        tagName: 'div',
        selectable: true,
        droppable: true,
        draggable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-faq-section__answer', 'data-cms-html': 'faq.answerHtml' },
        components:
          '<p>Yes. For packaging and production efficiency, the order quantity must be in multiples of 6.</p>',
      },
    ],
  }
}

function buildFaqSectionTree() {
  return [
    {
      tagName: 'div',
      selectable: false,
      hoverable: false,
      highlightable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-faq-section__inner' },
      components: [
        createTextNode('h2', 'wb-faq-section__title', 'FAQs', {
          margin: '0 0 56px',
          color: '#000A11',
          'text-align': 'center',
          'font-size': '64px',
          'font-weight': '700',
          'line-height': '108%',
          'letter-spacing': '-0.03em',
        }),
        {
          tagName: 'div',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: {
            class: 'wb-faq-section__list',
            'data-cms-repeat': 'faq',
            'data-cms-repeat-container': 'true',
          },
          components: [createFaqTemplateItem()],
        },
      ],
    },
  ]
}

export function registerFaqSectionComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_FAQ_SECTION_TYPE)) return

  registerCmsTypeEntry({
    dataCmsComponent: 'faq-section',
    dataWbComponent: 'faq-section',
    publishTemplate: '',
    dynamicPublish: true,
  })

  domComponents.addType(WB_FAQ_SECTION_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'faq-section'
        ? { type: WB_FAQ_SECTION_TYPE }
        : false,

    model: {
      defaults: {
        name: 'FAQ',
        tagName: 'section',
        draggable: '*',
        droppable: true,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'faq-section',
          'data-cms-component': 'faq-section',
          'data-category-id': '',
          'data-limit': '6',
          'data-accordion-mode': 'true',
          'data-initial-expanded': '1',
          'data-show-see-more': 'false',
          class: 'wb-faq-section',
          style: '--faq-primary-color: #000a11; --faq-border-color: #d9dde1; --faq-answer-color: #768389; --faq-icon-color: #111827;',
        },
        cmsCategoryId: '',
        cmsLimit: 6,
        accordionMode: true,
        initialExpandedCount: 1,
        showTitle: true,
        primaryColor: '#000a11',
        borderColor: '#d9dde1',
        answerColor: '#768389',
        iconColor: '#111827',
        paddingVertical: 26,
        answerMaxHeight: 320,
        expandIconSource: '',
        expandIcon: '',
        collapseIconSource: '',
        collapseIcon: '',
        showSeeMore: false,
        styles: FAQ_SECTION_CSS,
        script: makeFaqSectionScript(),
        'script-export': makeFaqSectionScript(),
        traits: [
          {
            type: 'select',
            label: 'FAQ 分类',
            name: 'cmsCategoryId',
            changeProp: true,
            options: [{ value: '', label: '请选择 FAQ 分类' }],
          },
          makeNumberTrait('显示数量', 'cmsLimit', { min: 1, max: 20, step: 1 }),
          makeTextTrait('组件标题', 'faqTitle', { placeholder: 'FAQs' }),
          {
            type: 'select',
            label: '显示标题',
            name: 'showTitle',
            changeProp: true,
            options: [
              { value: 'true', label: '显示' },
              { value: 'false', label: '隐藏' },
            ],
          },
          {
            type: 'select',
            label: '展开模式',
            name: 'accordionMode',
            changeProp: true,
            options: [
              { value: 'true', label: '手风琴模式 (仅一个展开)' },
              { value: 'false', label: '多选模式 (可同时展开多个)' },
            ],
          },
          makeNumberTrait('初始展开数量', 'initialExpandedCount', { min: 0, max: 10, step: 1 }),
          {
            type: 'color',
            label: '主色调',
            name: 'primaryColor',
            changeProp: true,
          },
          {
            type: 'color',
            label: '边框颜色',
            name: 'borderColor',
            changeProp: true,
          },
          {
            type: 'color',
            label: '答案文字颜色',
            name: 'answerColor',
            changeProp: true,
          },
          {
            type: 'color',
            label: '图标颜色',
            name: 'iconColor',
            changeProp: true,
          },
          makeNumberTrait('垂直间距', 'paddingVertical', { min: 10, max: 60, step: 1 }),
          makeNumberTrait('答案最大高度', 'answerMaxHeight', { min: 100, max: 1000, step: 10 }),
          makeSvgIconPickerTrait('展开图标', 'expandIcon', { sourceName: 'expandIconSource' }),
          makeSvgIconPickerTrait('收起图标', 'collapseIcon', { sourceName: 'collapseIconSource' }),
          {
            type: 'select',
            label: '显示"查看更多"',
            name: 'showSeeMore',
            changeProp: true,
            options: [
              { value: 'false', label: '隐藏' },
              { value: 'true', label: '显示' },
            ],
          },
        ],
        faqTitle: 'FAQs',
        components: buildFaqSectionTree(),
      },
      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        const categoryId = String(this.get('cmsCategoryId') || attrs['data-category-id'] || '').trim()
        const limit = Math.max(1, Number(this.get('cmsLimit') || attrs['data-limit'] || 6) || 6)
        const showTitle = attrs['data-show-title'] !== undefined
          ? toFaqBoolean(attrs['data-show-title'], true)
          : toFaqBoolean(this.get('showTitle'), true)
        const accordionMode = attrs['data-accordion-mode'] !== undefined
          ? toFaqBoolean(attrs['data-accordion-mode'], true)
          : toFaqBoolean(this.get('accordionMode'), true)
        const showSeeMore = attrs['data-show-see-more'] !== undefined
          ? toFaqBoolean(attrs['data-show-see-more'], false)
          : toFaqBoolean(this.get('showSeeMore'), false)
        const title = String(this.get('faqTitle') || '').trim()
        if (categoryId && !`${this.get('cmsCategoryId') || ''}`.trim()) {
          this.set('cmsCategoryId', categoryId, { silent: true })
        }
        if (!this.get('cmsLimit') && limit) {
          this.set('cmsLimit', limit, { silent: true })
        }
        this.set({
          showTitle,
          accordionMode,
          showSeeMore,
        }, { silent: true })
        if (!title) {
          const savedTitle = this.components?.().at?.(0)?.components?.().at?.(0)?.get?.('content')
          if (savedTitle) {
            this.set('faqTitle', savedTitle, { silent: true })
          }
        }
        this.on('change:cmsCategoryId change:cmsLimit change:faqTitle change:accordionMode change:initialExpandedCount change:showTitle', this._syncAttrs)
        this.on('change:faqTitle', this._syncTitle)
        this.on('change:showTitle', this._syncTitleVisibility)
        this.on('change:primaryColor change:borderColor change:answerColor change:iconColor change:paddingVertical change:answerMaxHeight', this._syncStyles)
        this.on('change:expandIcon change:collapseIcon', this._syncIcons)
        this.on('change:components', this._onComponentsChange)
        initFaqCategorySelectTrait(this)
        this._syncAttrs()
        this._syncTitle()
        this._syncTitleVisibility()
        this._syncStyles()
        this._syncIcons()
      },
      _onComponentsChange(this: any) {
        // 当组件结构变化时，重新初始化脚本
        const script = this.get('script')
        if (script && typeof script === 'function') {
          setTimeout(() => {
            const el = this.getEl()
            if (el && script.call) {
              script.call(el)
            }
          }, 100)
        }
      },
      _syncAttrs(this: any) {
        this.addAttributes({
          'data-cms-component': 'faq-section',
          'data-category-id': String(this.get('cmsCategoryId') || '').trim(),
          'data-limit': String(Math.max(1, Number(this.get('cmsLimit') || 6) || 6)),
          'data-accordion-mode': String(toFaqBoolean(this.get('accordionMode'), true)),
          'data-initial-expanded': String(Math.max(0, toNumber(this.get('initialExpandedCount'), 1))),
          'data-show-see-more': String(toFaqBoolean(this.get('showSeeMore'), false)),
          'data-show-title': String(toFaqBoolean(this.get('showTitle'), true)),
        })
      },
      _syncTitle(this: any) {
        const titleNode = this.components?.().at?.(0)?.components?.().at?.(0)
        if (!titleNode) return
        const title = String(this.get('faqTitle') || '').trim() || 'FAQs'
        titleNode.components?.(title)
      },
      _syncTitleVisibility(this: any) {
        const showTitle = toFaqBoolean(this.get('showTitle'), true)
        const titleNode = this.components?.().at?.(0)?.components?.().at?.(0)
        if (!titleNode) return

        if (showTitle) {
          titleNode.addStyle({ display: 'block' })
        } else {
          titleNode.addStyle({ display: 'none' })
        }
      },
      _syncStyles(this: any) {
        const primaryColor = this.get('primaryColor') || '#000a11'
        const borderColor = this.get('borderColor') || '#d9dde1'
        const answerColor = this.get('answerColor') || '#768389'
        const iconColor = this.get('iconColor') || '#111827'
        const paddingVertical = toNumber(this.get('paddingVertical'), 26)
        const answerMaxHeight = toNumber(this.get('answerMaxHeight'), 320)

        this.addStyle({
          '--faq-primary-color': primaryColor,
          '--faq-border-color': borderColor,
          '--faq-answer-color': answerColor,
          '--faq-icon-color': iconColor,
          '--faq-padding-vertical': `${paddingVertical}px`,
          '--faq-answer-max-height': `${answerMaxHeight}px`,
        })
      },
      _syncIcons(this: any) {
        const expandIcon = String(this.get('expandIcon') || '').trim()
        const collapseIcon = String(this.get('collapseIcon') || '').trim()
        const list = this.components?.().at?.(0)?.components?.().at?.(1)
        if (!list) return

        const items = list.components?.()
        if (!items) return

        items.forEach((item: any) => {
          const summary = item.components?.().at?.(0)
          if (!summary) return
          const iconSpan = summary.components?.().at?.(1)
          if (!iconSpan) return

          // 如果有自定义图标，使用自定义图标
          if (expandIcon && collapseIcon) {
            // 这里可以根据展开状态切换图标
            iconSpan.components(expandIcon)
          } else {
            // 使用默认的CSS箭头
            iconSpan.components('')
          }
        })
      },
    },
  })

  blockManager?.add?.(WB_FAQ_SECTION_TYPE, {
    label: 'FAQ',
    category: 'Section',
    content: { type: WB_FAQ_SECTION_TYPE },
    media: BLOCK_ICON,
  })
}
