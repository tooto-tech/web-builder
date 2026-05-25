import { STATIC_CHILD } from '@/components/WebBuilder/utils/cmsFactory'
import { buildSeoMetaNodes } from '../helpers'
import { WB_PRODUCT_GALLERY_TYPE } from './gallery'
import {
  buildProductDetailBackComponents,
  PRODUCT_DETAIL_BREADCRUMB_BACK_ICON_CLASS,
  PRODUCT_DETAIL_BREADCRUMB_BACK_LABEL_CLASS,
} from './detail.schema'

export const PRODUCT_DETAIL_V2_ROOT_CLASS = 'wb-product-detail-v2'
export const PRODUCT_DETAIL_V2_HEADER_CLASS = 'wb-product-detail-v2__header'
export const PRODUCT_DETAIL_V2_BREADCRUMB_BACK_ICON_CLASS = PRODUCT_DETAIL_BREADCRUMB_BACK_ICON_CLASS
export const PRODUCT_DETAIL_V2_BREADCRUMB_BACK_LABEL_CLASS = PRODUCT_DETAIL_BREADCRUMB_BACK_LABEL_CLASS
export const PRODUCT_DETAIL_V2_HEADER_CONTENT =
  '产品详情模板 V2 - 图库、Tabs、规格选项、Buy Now、关联产品'
export const PRODUCT_DETAIL_V2_BODY_CLASS = 'wb-product-detail-v2__container wb-cms-prod-detail-body'

const PRODUCT_DETAIL_V2_RELATED_PREV = `<svg class="wb-content-carousel__nav-icon" viewBox="0 0 24 24" fill="none">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const PRODUCT_DETAIL_V2_RELATED_NEXT = `<svg class="wb-content-carousel__nav-icon" viewBox="0 0 24 24" fill="none">
  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

export const PRODUCT_DETAIL_V2_BODY_COMPONENTS = [
  {
    tagName: 'div',
    ...STATIC_CHILD,
    attributes: { class: 'wb-product-detail-v2__breadcrumb' },
    components: [
      {
        tagName: 'button',
        attributes: {
          class: 'wb-product-detail-v2__breadcrumb-back',
          type: 'button',
          'data-wb-product-detail-back': '',
        },
        components: buildProductDetailBackComponents(),
      },
      {
        tagName: 'span',
        attributes: {
          class: 'wb-product-detail-v2__breadcrumb-name',
          'data-cms-bind': 'product.name',
        },
        content: 'Product Name',
      },
    ],
  },
  {
    tagName: 'section',
    attributes: { class: 'wb-product-detail-v2__hero' },
    components: [
      { type: WB_PRODUCT_GALLERY_TYPE },
      {
        tagName: 'div',
        attributes: { class: 'wb-product-detail-v2__info' },
        components: [
          {
            tagName: 'p',
            attributes: { class: 'wb-product-detail-v2__brand', 'data-cms-bind': 'product.brandName' },
            content: 'Brand Name',
          },
          {
            tagName: 'h1',
            attributes: { class: 'wb-product-detail-v2__name', 'data-cms-bind': 'product.name' },
            content: 'Product Name',
          },
          {
            tagName: 'div',
            attributes: {
              class: 'wb-product-detail-v2__docs',
              'data-cms-if': 'product.documents',
            },
            components: [
              {
                tagName: 'a',
                attributes: {
                  class: 'wb-product-detail-v2__doc-link',
                  'data-cms-repeat': 'doc@product.documents',
                  'data-cms-bind-href': 'doc.url',
                  target: '_blank',
                },
                components: [
                  {
                    tagName: 'span',
                    content:
                      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 16 18"><path d="M6.8571424,0L14.857142,0C15.488325,0,16,0.53725839,16,1.1999999L16,14.400001L2.2857141,14.400001L2.2857141,15.599999L16,15.599999L16,16.799999C16,17.462742,15.488325,18,14.857142,18L1.1428571,18C0.51167464,18,-5.2315846e-7,17.462742,0,16.799999L0,1.1999999C-5.2315846e-7,0.53725839,0.51167417,0,1.1428571,0L2.2857141,0L2.2857141,7.2000003L4.5714288,5.4000001L6.8571424,7.2000003L6.8571424,0Z" fill="currentColor" /></svg>',
                  },
                  { tagName: 'span', attributes: { 'data-cms-bind': 'doc.name' }, content: 'Specs & Install Guide' },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-product-detail-v2__tabs', 'data-wb-tabs': 'true' },
            components: [
              {
                tagName: 'button',
                attributes: {
                  class: 'wb-product-detail-v2__tab is-active',
                  type: 'button',
                  'data-tab-trigger': 'introduction',
                },
                components: [
                  { tagName: 'span', attributes: { class: 'wb-product-detail-v2__tab-text' }, content: 'Introduction' },
                ],
              },
              {
                tagName: 'button',
                attributes: {
                  class: 'wb-product-detail-v2__tab',
                  type: 'button',
                  'data-tab-trigger': 'features',
                },
                components: [
                  { tagName: 'span', attributes: { class: 'wb-product-detail-v2__tab-text' }, content: 'Features' },
                ],
              },
              {
                tagName: 'button',
                attributes: {
                  class: 'wb-product-detail-v2__tab',
                  type: 'button',
                  'data-tab-trigger': 'specifications',
                },
                components: [
                  { tagName: 'span', attributes: { class: 'wb-product-detail-v2__tab-text' }, content: 'Specifications' },
                ],
              },
              {
                tagName: 'button',
                attributes: {
                  class: 'wb-product-detail-v2__tab',
                  type: 'button',
                  'data-tab-trigger': 'faqs',
                },
                components: [
                  { tagName: 'span', attributes: { class: 'wb-product-detail-v2__tab-text' }, content: 'FAQs' },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-product-detail-v2__panel is-active', 'data-tab-panel': 'introduction' },
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-product-detail-v2__intro', 'data-cms-html': 'product.description' },
                content:
                  '<p>Introduction to product description copy content, introduction to product description copy content, introduction to product.</p>',
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-product-detail-v2__panel', 'data-tab-panel': 'features' },
            components: [
              {
                tagName: 'ul',
                attributes: {
                  class: 'wb-product-detail-v2__feature-list',
                  'data-cms-if': 'product.features',
                },
                components: [
                  {
                    tagName: 'li',
                    attributes: { class: 'wb-product-detail-v2__feature-item', 'data-cms-repeat': 'feature@product.features' },
                    components: [
                      {
                        tagName: 'span',
                        attributes: {
                          class: 'wb-product-detail-v2__feature-text',
                          'data-cms-bind': 'feature.text',
                        },
                        content: 'Feature description',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-product-detail-v2__panel', 'data-tab-panel': 'specifications' },
            components: [
              {
                tagName: 'div',
                attributes: {
                  class: 'wb-product-detail-v2__spec-groups',
                  'data-cms-if': 'product.specGroups',
                },
                components: [
                  {
                    tagName: 'div',
                    attributes: { class: 'wb-product-detail-v2__spec-group', 'data-cms-repeat': 'specGroup@product.specGroups' },
                    components: [
                      {
                        tagName: 'h3',
                        attributes: { class: 'wb-product-detail-v2__spec-group-title', 'data-cms-bind': 'specGroup.name' },
                        content: 'Dimensions',
                      },
                      {
                        tagName: 'div',
                        attributes: { class: 'wb-product-detail-v2__spec-list' },
                        components: [
                          {
                            tagName: 'div',
                            attributes: { class: 'wb-product-detail-v2__spec-row', 'data-cms-repeat': 'spec@specGroup.specifications' },
                            components: [
                              { tagName: 'div', attributes: { class: 'wb-product-detail-v2__spec-key', 'data-cms-bind': 'spec.name' }, content: 'Size' },
                              { tagName: 'div', attributes: { class: 'wb-product-detail-v2__spec-value', 'data-cms-html': 'spec.valueHtml' }, content: 'Specification value' },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-product-detail-v2__panel', 'data-tab-panel': 'faqs' },
            components: [
              {
                tagName: 'div',
                attributes: {
                  class: 'wb-product-detail-v2__faq-list',
                  'data-cms-if': 'product.faqs',
                },
                components: [
                  {
                    tagName: 'details',
                    attributes: { class: 'wb-product-detail-v2__faq-item', 'data-cms-repeat': 'faq@product.faqs' },
                    components: [
                      {
                        tagName: 'summary',
                        attributes: { class: 'wb-product-detail-v2__faq-summary' },
                        components: [
                          { tagName: 'span', attributes: { 'data-cms-bind': 'faq.question' }, content: 'FAQ title' },
                          { tagName: 'span', attributes: { class: 'wb-product-detail-v2__faq-icon' }, content: '⌄' },
                        ],
                      },
                      { tagName: 'div', attributes: { class: 'wb-product-detail-v2__faq-answer', 'data-cms-html': 'faq.answerHtml' }, content: '<p>FAQ answer</p>' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            ...STATIC_CHILD,
            attributes: { class: 'wb-product-detail-v2__options', 'data-cms-if': 'product.propertyOptions' },
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-product-detail-v2__option-group', 'data-cms-repeat': 'prop@product.propertyOptions' },
                components: [
                  { tagName: 'h3', attributes: { class: 'wb-product-detail-v2__option-label', 'data-cms-bind': 'prop.propertyName' }, content: 'Color' },
                  {
                    tagName: 'div',
                    attributes: { class: 'wb-product-detail-v2__option-values' },
                    components: [
                      {
                        tagName: 'button',
                        attributes: {
                          class: 'wb-product-detail-v2__option-value',
                          'data-cms-repeat': 'value@prop.values',
                          'data-option-value': 'true',
                          type: 'button',
                        },
                        components: [
                          {
                            tagName: 'span',
                            attributes: {
                              class: 'wb-product-detail-v2__option-swatch',
                              'data-preview-role': 'color-swatch',
                              'data-cms-if': "prop.displayType == 'COLOR' and value.colorCode",
                              'data-cms-bind-style': 'value.colorStyle',
                            },
                          },
                          {
                            tagName: 'img',
                            attributes: {
                              class: 'wb-product-detail-v2__option-image',
                              'data-preview-role': 'image',
                              'data-cms-if': "prop.displayType == 'IMAGE' and value.imageUrl",
                              'data-cms-bind-src': 'value.imageUrl',
                              'data-cms-bind-alt': 'value.valueName',
                              src: 'https://placehold.co/80x80/e5e7eb/64748b?text=IMG',
                              alt: 'Option image',
                            },
                          },
                          {
                            tagName: 'span',
                            attributes: {
                              class: 'wb-product-detail-v2__option-text',
                              'data-cms-bind': 'value.valueName',
                            },
                            content: 'Deep Blue',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            ...STATIC_CHILD,
            attributes: { class: 'wb-product-detail-v2__actions' },
            components: [
              {
                tagName: 'button',
                attributes: {
                  class: 'wb-product-detail-v2__action wb-product-detail-v2__action--primary',
                  type: 'button',
                  'data-product-inquiry-trigger': 'true',
                },
                content: 'Inquiry',
              },
              {
                tagName: 'a',
                attributes: {
                  class: 'wb-product-detail-v2__action',
                  href: '#',
                  'data-preview-role': 'buy-now',
                  'data-cms-if': 'product.buyNowUrl',
                  'data-cms-bind-href': 'product.buyNowUrl',
                  'data-cms-bind-target': 'product.buyNowTarget',
                },
                content: 'Buy Now',
              },
            ],
          },
          {
            tagName: 'div',
            ...STATIC_CHILD,
            attributes: { class: 'wb-product-detail-v2__actions--tips' },
            content: '<span>*The options you have selected will be submitted to us.</span>'
          }
        ],
      },
    ],
  },
  {
    tagName: 'section',
    ...STATIC_CHILD,
    attributes: { class: 'wb-product-detail-v2__related wb-content-carousel', 'data-cms-if': 'product.popularModels' },
    components: [
      {
        tagName: 'div',
        attributes: { class: 'wb-content-carousel__container' },
        components: [
          {
            tagName: 'div',
            attributes: { class: 'wb-content-carousel__header' },
            components: [
              { tagName: 'h2', attributes: { class: 'wb-content-carousel__title' }, content: 'Popular Models' },
              {
                tagName: 'div',
                attributes: { class: 'wb-content-carousel__nav' },
                components: [
                  {
                    tagName: 'button',
                    attributes: {
                      class: 'wb-content-carousel__nav-btn wb-content-carousel__nav-btn--prev',
                      type: 'button',
                      'aria-label': 'Previous item',
                    },
                    content: PRODUCT_DETAIL_V2_RELATED_PREV,
                  },
                  {
                    tagName: 'button',
                    attributes: {
                      class: 'wb-content-carousel__nav-btn wb-content-carousel__nav-btn--next',
                      type: 'button',
                      'aria-label': 'Next item',
                    },
                    content: PRODUCT_DETAIL_V2_RELATED_NEXT,
                  },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-content-carousel__carousel-wrap' },
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-content-carousel__track' },
                components: [
                  {
                    tagName: 'article',
                    attributes: {
                      class: 'wb-content-carousel__item',
                      'data-cms-repeat': 'popular@product.popularModels',
                    },
                    components: [
                      {
                        tagName: 'div',
                        attributes: { class: 'wb-content-carousel__media' },
                        components: [
                          {
                            tagName: 'img',
                            attributes: {
                              class: 'wb-content-carousel__img',
                              'data-cms-bind-src': 'popular.picUrl',
                              'data-cms-bind-alt': 'popular.name',
                              src: 'https://placehold.co/420x460/e5e7eb/111827?text=Product',
                              alt: 'Related product',
                            },
                          },
                        ],
                      },
                      {
                        tagName: 'h5',
                        attributes: { class: 'wb-content-carousel__item-title' },
                        components: [
                          {
                            tagName: 'a',
                            attributes: {
                              class: 'wb-content-carousel__link',
                              href: '#',
                              'data-card-type': 'product',
                              'data-cms-bind-href': 'popular.url',
                            },
                            components: [
                              { tagName: 'span', attributes: { 'data-cms-bind': 'popular.name' }, content: 'Popular model name' },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  ...buildSeoMetaNodes({
    titleBind: 'product.name',
    titleContent: '产品标题',
    descriptionBind: 'product.introduction',
  }),
]

export const PRODUCT_DETAIL_V2_EXTRA_COMPONENTS: any[] = []
