import type { Editor } from 'grapesjs'
import { makeNumberTrait } from '@/components/WebBuilder/utils/traitFactory'
import { toNumber } from '@/components/WebBuilder/utils/styleHelpers'
import {
  FAQ_SECTION_CSS,
  makeFaqSectionScript
} from '@/components/WebBuilder/components/registries/section/faqSection'
import { WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE } from '../constants'

const PRODUCT_CATEGORY_FAQ_BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 5.5h16" />
  <path d="M4 12h10" />
  <path d="M4 18.5h16" />
  <path d="M17 10l3 2-3 2" />
</svg>`

function toFaqBoolean(value: unknown, fallback = false): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return fallback
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
      'data-open': 'true'
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
            components: 'FAQ question'
          },
          {
            tagName: 'span',
            selectable: true,
            droppable: false,
            draggable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-faq-section__icon', 'aria-hidden': 'true' },
            components: ''
          }
        ]
      },
      {
        tagName: 'div',
        selectable: true,
        droppable: true,
        draggable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-faq-section__answer', 'data-cms-html': 'faq.answerHtml' },
        components: '<p>FAQ answer</p>'
      }
    ]
  }
}

function buildProductCategoryFaqTree() {
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
            'data-cms-repeat': 'faq@productCategory.faqs',
            'data-cms-repeat-container': 'true'
          },
          components: [createFaqTemplateItem()]
        }
      ]
    }
  ]
}

export function registerCmsProductCategoryFaq(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE)) return

  domComponents.addType(WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'cms-product-category-faq'
        ? { type: WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Product Category FAQ',
        tagName: 'div',
        draggable: '*',
        droppable: true,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'cms-product-category-faq',
          'data-cms-component': 'product-category-faq',
          'data-cms-if': 'productCategory.faqs',
          'data-context-repeat': 'faq@productCategory.faqs',
          'data-accordion-mode': 'true',
          'data-initial-expanded': '1',
          'data-show-see-more': 'false',
          class: 'wb-faq-section',
          style:
            '--faq-primary-color: #000a11; --faq-border-color: #d9dde1; --faq-answer-color: #768389; --faq-icon-color: #111827; padding: 0;'
        },
        accordionMode: true,
        initialExpandedCount: 1,
        showSeeMore: false,
        primaryColor: '#000a11',
        borderColor: '#d9dde1',
        answerColor: '#768389',
        iconColor: '#111827',
        paddingVertical: 26,
        answerMaxHeight: 320,
        styles: FAQ_SECTION_CSS,
        script: makeFaqSectionScript(),
        'script-export': makeFaqSectionScript(),
        traits: [
          {
            type: 'select',
            label: '展开模式',
            name: 'accordionMode',
            changeProp: true,
            options: [
              { value: 'true', label: '手风琴模式 (仅一个展开)' },
              { value: 'false', label: '多选模式 (可同时展开多个)' }
            ]
          },
          makeNumberTrait('初始展开数量', 'initialExpandedCount', { min: 0, max: 10, step: 1 }),
          {
            type: 'select',
            label: '显示"查看更多"',
            name: 'showSeeMore',
            changeProp: true,
            options: [
              { value: 'false', label: '隐藏' },
              { value: 'true', label: '显示' }
            ]
          },
          { type: 'color', label: '主色调', name: 'primaryColor', changeProp: true },
          { type: 'color', label: '边框颜色', name: 'borderColor', changeProp: true },
          { type: 'color', label: '答案文字颜色', name: 'answerColor', changeProp: true },
          { type: 'color', label: '图标颜色', name: 'iconColor', changeProp: true },
          makeNumberTrait('垂直间距', 'paddingVertical', { min: 10, max: 60, step: 1 }),
          makeNumberTrait('答案最大高度', 'answerMaxHeight', { min: 100, max: 1000, step: 10 })
        ],
        components: buildProductCategoryFaqTree()
      },

      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        const accordionMode =
          attrs['data-accordion-mode'] !== undefined
            ? toFaqBoolean(attrs['data-accordion-mode'], true)
            : toFaqBoolean(this.get('accordionMode'), true)
        const showSeeMore =
          attrs['data-show-see-more'] !== undefined
            ? toFaqBoolean(attrs['data-show-see-more'], false)
            : toFaqBoolean(this.get('showSeeMore'), false)

        this.set({ accordionMode, showSeeMore }, { silent: true })
        this.set('tagName', 'div', { silent: true })
        this.on(
          'change:accordionMode change:initialExpandedCount change:showSeeMore',
          this._syncAttrs
        )
        this.on(
          'change:primaryColor change:borderColor change:answerColor change:iconColor change:paddingVertical change:answerMaxHeight',
          this._syncStyles
        )
        this._removeTitleNode()
        this._syncAttrs()
        this._syncStyles()
      },

      _removeTitleNode(this: any) {
        const inner = this.components?.().at?.(0)
        const children = inner?.components?.()
        if (!children?.forEach) return
        children.forEach((child: any) => {
          const className = String(child.getAttributes?.()?.class || '')
          if (className.split(/\s+/).includes('wb-faq-section__title')) {
            child.remove()
          }
        })
      },

      _syncAttrs(this: any) {
        this.addAttributes({
          'data-cms-component': 'product-category-faq',
          'data-cms-if': 'productCategory.faqs',
          'data-context-repeat': 'faq@productCategory.faqs',
          'data-accordion-mode': String(toFaqBoolean(this.get('accordionMode'), true)),
          'data-initial-expanded': String(Math.max(0, toNumber(this.get('initialExpandedCount'), 1))),
          'data-show-see-more': String(toFaqBoolean(this.get('showSeeMore'), false))
        })
        this.removeAttributes?.(['data-show-title'])
      },

      _syncStyles(this: any) {
        this.addStyle({
          '--faq-primary-color': this.get('primaryColor') || '#000a11',
          '--faq-border-color': this.get('borderColor') || '#d9dde1',
          '--faq-answer-color': this.get('answerColor') || '#768389',
          '--faq-icon-color': this.get('iconColor') || '#111827',
          '--faq-padding-vertical': `${toNumber(this.get('paddingVertical'), 26)}px`,
          '--faq-answer-max-height': `${toNumber(this.get('answerMaxHeight'), 320)}px`,
          padding: '0'
        })
      }
    }
  })

  blockManager?.add?.(WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE, {
    label: 'Product Category FAQ',
    category: 'Dynamic',
    content: { type: WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE },
    media: PRODUCT_CATEGORY_FAQ_BLOCK_ICON
  })
}
