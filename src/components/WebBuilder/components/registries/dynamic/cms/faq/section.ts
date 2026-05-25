import type { GrapesEditor } from '../../../../../types/editor'
import { getAllFaqCategoryList } from '@/api/content/faqCategory'
import { STATIC_CHILD, registerCmsTypeEntry } from '@/components/WebBuilder/utils/cmsFactory'
import { makeNumberTrait, makeTextTrait } from '@/components/WebBuilder/utils/traitFactory'
import { WB_CMS_FAQ_SECTION_TYPE } from '../constants'

type TraitOption = {
  value: string
  label: string
}

let faqCategoryOptionsPromise: Promise<TraitOption[]> | null = null
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

const FAQ_SECTION_CSS = `
  .wb-cms-faq-section {
    width: 100%;
    padding: 96px 0 104px;
    background: #ffffff;
    box-sizing: border-box;
  }
  .wb-cms-faq-section,
  .wb-cms-faq-section *,
  .wb-cms-faq-section *::before,
  .wb-cms-faq-section *::after {
    box-sizing: border-box;
  }
  .wb-cms-faq-section__inner {
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .wb-cms-faq-section__title {
    margin: 0 0 56px;
    color: #000a11;
    text-align: center;
    font-size: 48px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0;
  }
  .wb-cms-faq-section__list {
    width: 100%;
  }
  .wb-cms-faq-section__item {
    border-bottom: 1px solid #d9dde1;
  }
  .wb-cms-faq-section__item:last-child {
    border-bottom: 0;
  }
  .wb-cms-faq-section__summary {
    width: 100%;
    border: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    cursor: pointer;
    padding: 24px 0;
    text-align: left;
  }
  .wb-cms-faq-section__question {
    margin: 0;
    color: #000a11;
    font-size: 24px;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0;
  }
  .wb-cms-faq-section__icon {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: rotate(0deg);
    transition: transform 240ms ease;
  }
  .wb-cms-faq-section__icon::before {
    content: '';
    width: 10px;
    height: 10px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(45deg) translateY(-1px);
    transform-origin: center;
  }
  .wb-cms-faq-section__item[data-open='true'] .wb-cms-faq-section__icon {
    transform: rotate(180deg);
  }
  .wb-cms-faq-section__answer {
    max-height: 0;
    overflow: hidden;
    padding: 0 24px 0 0;
    color: #768389;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: 0;
    opacity: 0;
    transition:
      max-height 280ms ease,
      opacity 220ms ease,
      padding-bottom 220ms ease;
  }
  .wb-cms-faq-section__item[data-open='true'] .wb-cms-faq-section__answer {
    max-height: 320px;
    padding-bottom: 24px;
    opacity: 1;
  }
  .wb-cms-faq-section__answer > *:first-child {
    margin-top: 0;
  }
  .wb-cms-faq-section__answer > *:last-child {
    margin-bottom: 0;
  }
  .wb-cms-faq-section__answer p {
    margin: 0;
  }
  @media (max-width: 1023px) {
    .wb-cms-faq-section {
      padding: 72px 0 80px;
    }
    .wb-cms-faq-section__inner {
      padding: 0 20px;
    }
    .wb-cms-faq-section__title {
      margin-bottom: 44px;
      font-size: 42px;
    }
    .wb-cms-faq-section__summary {
      padding: 22px 0;
    }
    .wb-cms-faq-section__question {
      font-size: 22px;
    }
    .wb-cms-faq-section__answer {
      padding: 0 24px 0 0;
      font-size: 15px;
      line-height: 1.4;
    }
    .wb-cms-faq-section__item[data-open='true'] .wb-cms-faq-section__answer {
      padding-bottom: 22px;
    }
  }
  @media (max-width: 767px) {
    .wb-cms-faq-section {
      padding: 40px 0 48px;
    }
    .wb-cms-faq-section__inner {
      padding: 0 16px;
    }
    .wb-cms-faq-section__title {
      margin-bottom: 28px;
      font-size: 24px;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    .wb-cms-faq-section__summary {
      gap: 16px;
      padding: 12px 0;
    }
    .wb-cms-faq-section__question {
      font-size: 14px;
      line-height: 1.4;
    }
    .wb-cms-faq-section__icon {
      width: 16px;
      height: 16px;
    }
    .wb-cms-faq-section__icon::before {
      width: 8px;
      height: 8px;
    }
    .wb-cms-faq-section__answer {
      padding: 0 24px 0 0;
      font-size: 13px;
      line-height: 1.4;
    }
    .wb-cms-faq-section__item[data-open='true'] .wb-cms-faq-section__answer {
      padding-bottom: 12px;
    }
  }
`

function makeFaqScript() {
  return function (
    this: HTMLElement & {
      __wbFaqBound?: boolean
      __wbFaqObserver?: MutationObserver | null
    }
  ) {
    if (!this) return

    const getVisibleScope = () =>
      (this.querySelector('[data-cms-preview]') as HTMLElement | null) || this

    const getItems = () =>
      Array.from(getVisibleScope().querySelectorAll('.wb-cms-faq-section__item')) as HTMLElement[]

    const ensureOneOpen = () => {
      const items = getItems()
      if (!items.length) return
      const openItems = items.filter((item) => item.getAttribute('data-open') === 'true')
      if (!openItems.length) {
        items[0].setAttribute('data-open', 'true')
        return
      }
      openItems.forEach((item, index) => {
        if (index === 0) return
        item.setAttribute('data-open', 'false')
      })
    }

    if (!this.__wbFaqBound) {
      this.__wbFaqBound = true
      this.addEventListener('click', (event) => {
        const trigger = (event.target as HTMLElement | null)?.closest?.(
          '.wb-cms-faq-section__summary'
        ) as HTMLElement | null
        if (!trigger) return
        const item = trigger.closest('.wb-cms-faq-section__item') as HTMLElement | null
        if (!item || !this.contains(item)) return

        const shouldOpen = item.getAttribute('data-open') !== 'true'
        getItems().forEach((detail) => {
          detail.setAttribute('data-open', detail === item && shouldOpen ? 'true' : 'false')
        })
      })
    }

    this.__wbFaqObserver?.disconnect?.()
    const observer = new MutationObserver(() => {
      ensureOneOpen()
    })
    observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-open']
    })
    this.__wbFaqObserver = observer
    ensureOneOpen()
  }
}

function createEditableTitleNode(content: string) {
  return {
    tagName: 'h2',
    selectable: true,
    draggable: false,
    droppable: false,
    hoverable: true,
    layerable: true,
    copyable: false,
    removable: false,
    badgable: false,
    highlightable: true,
    stylable: [...TEXT_STYLABLE_PROPS],
    editable: true,
    attributes: { class: 'wb-cms-faq-section__title' },
    style: {
      margin: '0 0 56px',
      color: '#000A11',
      'text-align': 'center',
      'font-size': '48px',
      'font-weight': '600',
      'line-height': '140%',
      'letter-spacing': '0'
    },
    components: content
  }
}

function createFaqTemplateItem() {
  return {
    tagName: 'div',
    ...STATIC_CHILD,
    attributes: {
      class: 'wb-cms-faq-section__item',
      'data-open': 'true'
    },
    components: [
      {
        tagName: 'button',
        ...STATIC_CHILD,
        attributes: {
          class: 'wb-cms-faq-section__summary',
          type: 'button'
        },
        components: [
          {
            tagName: 'span',
            ...STATIC_CHILD,
            attributes: {
              class: 'wb-cms-faq-section__question',
              'data-cms-bind': 'faq.question'
            },
            style: {
              margin: '0',
              color: '#000A11',
              'font-size': '24px',
              'font-weight': '500',
              'line-height': '140%',
              'letter-spacing': '0'
            },
            content: 'Is there any quantity requirement when placing an order?'
          },
          {
            tagName: 'span',
            ...STATIC_CHILD,
            attributes: {
              class: 'wb-cms-faq-section__icon',
              'aria-hidden': 'true'
            }
          }
        ]
      },
      {
        tagName: 'div',
        ...STATIC_CHILD,
        attributes: {
          class: 'wb-cms-faq-section__answer',
          'data-cms-html': 'faq.answerHtml'
        },
        style: {
          color: '#768389',
          'font-size': '16px',
          'font-weight': '400',
          'line-height': '140%',
          'letter-spacing': '0'
        },
        content:
          '<p>Yes. For packaging and production efficiency, the order quantity must be in multiples of 6.</p>'
      }
    ]
  }
}

function buildFaqComponents(title: string) {
  return [
    {
      tagName: 'div',
      ...STATIC_CHILD,
      attributes: {
        class: 'wb-cms-faq-section__inner'
      },
      components: [
        createEditableTitleNode(title),
        {
          tagName: 'div',
          ...STATIC_CHILD,
          attributes: {
            class: 'wb-cms-faq-section__list',
            'data-cms-repeat': 'faq',
            'data-cms-repeat-container': 'true'
          },
          components: [createFaqTemplateItem()]
        }
      ]
    }
  ]
}

async function loadFaqCategoryOptions(): Promise<TraitOption[]> {
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
      label: String(item.name)
    }))
}

function getFaqCategoryOptions(): Promise<TraitOption[]> {
  if (!faqCategoryOptionsPromise) {
    faqCategoryOptionsPromise = loadFaqCategoryOptions().catch((error) => {
      faqCategoryOptionsPromise = null
      throw error
    })
  }
  return faqCategoryOptionsPromise
}

async function initFaqCategorySelectTrait(model: any): Promise<void> {
  const trait = model.getTrait?.('cmsCategoryId')
  if (!trait) return
  const currentValue = String(model.get('cmsCategoryId') ?? '').trim()
  try {
    const options = await getFaqCategoryOptions()
    const traitOptions: TraitOption[] = [{ value: '', label: '请选择 FAQ 分类' }, ...options]
    if (currentValue && !traitOptions.some((option) => option.value === currentValue)) {
      traitOptions.push({ value: currentValue, label: `当前分类 (#${currentValue})` })
    }
    trait.set('options', traitOptions)
  } catch {
    trait.set(
      currentValue
        ? [
            { value: '', label: '请选择 FAQ 分类' },
            { value: currentValue, label: `当前分类 (#${currentValue})` }
          ]
        : [{ value: '', label: '请选择 FAQ 分类' }]
    )
  }
}

export function registerCmsFaqSection(editor: GrapesEditor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_CMS_FAQ_SECTION_TYPE)) return

  domComponents.addType(WB_CMS_FAQ_SECTION_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'cms-faq-section'
        ? { type: WB_CMS_FAQ_SECTION_TYPE }
        : false,

    model: {
      defaults: {
        name: 'FAQ',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'cms-faq-section',
          'data-cms-component': 'faq-section',
          'data-category-id': '',
          'data-limit': '6',
          class: 'wb-cms-faq-section'
        },
        styles: FAQ_SECTION_CSS,
        script: makeFaqScript(),
        'script-export': makeFaqScript(),
        sectionTitle: 'FAQs',
        cmsCategoryId: '',
        cmsLimit: 6,
        traits: [
          makeTextTrait('标题', 'sectionTitle', { placeholder: 'FAQs' }),
          {
            type: 'select',
            label: 'FAQ 分类',
            name: 'cmsCategoryId',
            changeProp: true,
            options: [{ value: '', label: '请选择 FAQ 分类' }]
          },
          makeNumberTrait('显示数量', 'cmsLimit', { min: 1, max: 20, step: 1 })
        ],
        components: buildFaqComponents('FAQs')
      },

      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        const savedCategoryId = String(
          this.get('cmsCategoryId') || attrs['data-category-id'] || ''
        ).trim()
        const savedLimit = Math.max(
          1,
          Number(this.get('cmsLimit') || attrs['data-limit'] || 6) || 6
        )
        const savedTitle = String(this.get('sectionTitle') || '').trim()

        if (savedCategoryId && !`${this.get('cmsCategoryId') || ''}`.trim()) {
          this.set('cmsCategoryId', savedCategoryId, { silent: true })
        }

        if (!this.get('cmsLimit') && savedLimit) {
          this.set('cmsLimit', savedLimit, { silent: true })
        }

        if (!savedTitle) {
          const titleContent = this.components?.().at?.(0)?.components?.().at?.(0)?.get?.('content')
          if (titleContent) {
            this.set('sectionTitle', titleContent, { silent: true })
          }
        }

        this.on('change:cmsCategoryId change:cmsLimit', this._syncAttrs)
        this.on('change:sectionTitle', this._syncTitle)
        this._syncAttrs()
        this._syncTitle()
        void initFaqCategorySelectTrait(this)
      },

      _syncAttrs(this: any) {
        const limit = parseInt(String(this.get('cmsLimit') ?? '6'), 10)
        this.addAttributes({
          'data-cms-component': 'faq-section',
          'data-wb-instance-id': String(this.getId?.() || this.cid || ''),
          'data-category-id': String(this.get('cmsCategoryId') || '').trim(),
          'data-limit': String(Number.isFinite(limit) && limit > 0 ? limit : 6)
        })
      },

      _syncTitle(this: any) {
        const titleNode = this.components?.().at?.(0)?.components?.().at?.(0)
        if (!titleNode) return
        titleNode.components?.(String(this.get('sectionTitle') || 'FAQs').trim() || 'FAQs')
      }
    }
  })

  registerCmsTypeEntry({
    dataCmsComponent: 'faq-section',
    dataWbComponent: 'cms-faq-section',
    publishTemplate: '',
    dynamicPublish: true
  })
}
