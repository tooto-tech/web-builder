import {
  LOOP_ITEM_RESOURCE_TYPE,
  LOOP_ITEM_TYPE_LABELS,
  getLoopItemType,
  isTempTemplateResourceType,
  type LoopItemType
} from '@/components/WebBuilder/config/templateSharedResources'

const TEMPLATE_COMPONENT_TYPES: Record<string, string> = {
  TEMP_POST_DETAIL: 'wb-cms-post-detail',
  TEMP_POST_CATEGORY_LIST: 'wb-cms-post-list',
  TEMP_MEDIA_DETAIL: 'wb-cms-media-detail',
  TEMP_MEDIA_CATEGORY_LIST: 'wb-cms-media-list',
  TEMP_PRODUCT_DETAIL: 'wb-cms-product-detail',
  TEMP_PRODUCT_CATEGORY_LIST: 'wb-cms-product-list'
}

export const getTemplateMainComponentType = (resourceType?: string | null): string | null => {
  const normalized = `${resourceType ?? ''}`.trim()
  return TEMPLATE_COMPONENT_TYPES[normalized] || null
}

const LOOP_ITEM_REPEAT: Record<LoopItemType, string> = {
  post: 'post',
  postCategory: 'postCategory@postCategories',
  product: 'product',
  productCategory: 'productCategory@productCategories',
  productCategoryFaq: 'faq@productCategory.faqs',
  media: 'media',
  mediaCategory: 'mediaCategory@mediaCategories'
}

const LOOP_ITEM_DEFAULT_FIELDS: Record<
  LoopItemType,
  {
    image?: string
    imageFallback: string
    title: string
    summary?: string
    summaryKind?: 'text' | 'html'
    url?: string
    button?: string
  }
> = {
  post: {
    image: 'post.image',
    imageFallback: 'https://placehold.co/640x420?text=Post',
    title: 'post.name',
    summary: 'post.excerpt',
    url: 'post.url',
    button: 'Read more'
  },
  postCategory: {
    imageFallback: 'https://placehold.co/640x420?text=Category',
    title: 'postCategory.name',
    summary: 'postCategory.description',
    url: 'postCategory.url',
    button: 'View articles'
  },
  product: {
    image: 'product.picUrl',
    imageFallback: 'https://placehold.co/640x420?text=Product',
    title: 'product.name',
    summary: 'product.introduction',
    url: 'product.url',
    button: 'View product'
  },
  productCategory: {
    image: 'productCategory.image',
    imageFallback: 'https://placehold.co/640x420?text=Category',
    title: 'productCategory.name',
    summary: 'productCategory.description',
    url: 'productCategory.url',
    button: 'View category'
  },
  productCategoryFaq: {
    imageFallback: 'https://placehold.co/640x420?text=FAQ',
    title: 'faq.question',
    summary: 'faq.answerHtml',
    summaryKind: 'html'
  },
  media: {
    image: 'media.coverUrl',
    imageFallback: 'https://placehold.co/640x420?text=Media',
    title: 'media.title',
    summary: 'media.description',
    url: 'media.detailUrl',
    button: 'View media'
  },
  mediaCategory: {
    imageFallback: 'https://placehold.co/640x420?text=Category',
    title: 'mediaCategory.name',
    summary: 'mediaCategory.description',
    url: 'mediaCategory.url',
    button: 'View media'
  }
}

const createLoopItemStarterComponent = (extJson?: string | null) => {
  const loopItemType = getLoopItemType(extJson) || 'product'
  const fields = LOOP_ITEM_DEFAULT_FIELDS[loopItemType]
  const components: any[] = []

  if (fields.image && fields.url) {
    components.push({
      tagName: 'a',
      attributes: {
        class: 'wb-loop-item-template__media',
        href: '#',
        'data-cms-bind-href': fields.url
      },
      components: [
        {
          tagName: 'img',
          attributes: {
            class: 'wb-loop-item-template__image',
            src: fields.imageFallback,
            alt: LOOP_ITEM_TYPE_LABELS[loopItemType],
            'data-cms-bind-src': fields.image,
            'data-cms-bind-alt': fields.title
          }
        }
      ]
    })
  }

  components.push({
    tagName: 'div',
    attributes: { class: 'wb-loop-item-template__body' },
    components: [
      {
        tagName: 'h3',
        attributes: {
          class: 'wb-loop-item-template__title',
          'data-cms-bind': fields.title
        },
        content: LOOP_ITEM_TYPE_LABELS[loopItemType]
      },
      ...(fields.summary
        ? [
            {
              tagName: 'p',
              attributes: {
                class: 'wb-loop-item-template__summary',
                [fields.summaryKind === 'html' ? 'data-cms-html' : 'data-cms-bind']: fields.summary
              },
              content: 'Summary'
            }
          ]
        : []),
      ...(fields.url
        ? [
            {
              tagName: 'a',
              attributes: {
                class: 'wb-loop-item-template__link',
                href: '#',
                'data-cms-bind-href': fields.url
              },
              content: fields.button || 'Read more'
            }
          ]
        : [])
    ]
  })

  return {
    tagName: 'article',
    attributes: {
      class: `wb-loop-item-template wb-loop-item-template--${loopItemType}`,
      'data-wb-loop-item-root': '',
      'data-wb-loop-item-type': loopItemType,
      'data-cms-repeat': LOOP_ITEM_REPEAT[loopItemType]
    },
    components
  }
}

const toComponentModelList = (components: any): any[] => {
  if (!components) return []
  if (Array.isArray(components)) return components
  if (Array.isArray(components?.models)) return components.models
  if (typeof components.each === 'function') {
    const result: any[] = []
    components.each((item: any) => result.push(item))
    return result
  }
  return []
}

const isWrapperEmpty = (page: any): boolean => {
  const main = page?.getMainComponent?.()
  if (!main) return true
  const list = toComponentModelList(main.components?.())
  return list.length === 0
}

/**
 * When a freshly-created TEMP_* template opens for the first time the backend
 * only persists an empty wrapper, so the canvas looks blank.  To give users an
 * immediately-useful starting point we insert the main component (matching the
 * template type) whenever the primary content page is still empty.  Returns
 * true when a seed component was actually inserted so callers can keep the
 * dirty-count intact and let the next save persist it.
 */
export const ensureTemplateMainComponent = (
  editor: any,
  resourceType: string | null | undefined,
  page: any,
  extJson?: string | null
): boolean => {
  if (!editor || !page) return false
  if (!isTempTemplateResourceType(`${resourceType ?? ''}`.trim())) return false
  if (`${resourceType ?? ''}`.trim() === LOOP_ITEM_RESOURCE_TYPE) {
    if (!isWrapperEmpty(page)) return false
    const main = page.getMainComponent?.()
    if (!main?.append) return false
    main.append(createLoopItemStarterComponent(extJson))
    return true
  }
  const componentType = getTemplateMainComponentType(resourceType)
  if (!componentType) return false
  if (!isWrapperEmpty(page)) return false

  const main = page.getMainComponent?.()
  if (!main?.append) return false
  main.append({ type: componentType })
  return true
}
