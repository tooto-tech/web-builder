import type { Editor } from 'grapesjs'
import {
  makeSelectTrait,
  makeTextTrait,
} from '@/components/WebBuilder/utils/traitFactory'
import { getPost, getPostPage } from '@/api/content/post'
import { getSpu, getSpuSimpleList } from '@/api/mall/product/spu'

export const WB_CONTENT_CAROUSEL_TYPE = 'wb-content-carousel'
export const WB_CONTENT_CAROUSEL_ITEM_TYPE = 'wb-content-carousel-item'

type ContentCardType = 'product' | 'post'

type ContentCard = {
  type: ContentCardType
  dataId?: string
  image: string
  title: string
  href: string
}

type TraitOption = {
  value: string
  label: string
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M5 7h10a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z" />
  <path d="M20 9v6" />
  <path d="M7 20h8" />
</svg>`

const SVG_PREV = `<svg class="wb-content-carousel__nav-icon" viewBox="0 0 24 24" fill="none">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const SVG_NEXT = `<svg class="wb-content-carousel__nav-icon" viewBox="0 0 24 24" fill="none">
  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const DEFAULT_CARDS: ContentCard[] = [
  {
    type: 'product',
    image: 'https://placehold.co/420x460/e5e7eb/111827?text=Product',
    title: 'Led Light Anti-Fog Wall Bathroom Vanity Mirror',
    href: '#',
  },
  {
    type: 'product',
    image: 'https://placehold.co/420x460/d7dde4/111827?text=Product',
    title: 'Round Backlit Bathroom Mirror With Touch Switch',
    href: '#',
  },
  {
    type: 'product',
    image: 'https://placehold.co/420x460/cbd5e1/111827?text=Product',
    title: 'Smart LED Mirror Cabinet For Modern Bathrooms',
    href: '#',
  },
  {
    type: 'post',
    image: 'https://placehold.co/420x460/f1f5f9/111827?text=Article',
    title: 'How To Choose The Right Bathroom Mirror',
    href: '#',
  },
  {
    type: 'post',
    image: 'https://placehold.co/420x460/e2e8f0/111827?text=Article',
    title: 'Bathroom Lighting Ideas For Daily Routines',
    href: '#',
  },
]

const CONTENT_CAROUSEL_CSS = `
  .wb-content-carousel {
    width: 100%;
    padding: 48px 0;
    background: #eceef0;
    overflow: hidden;
    box-sizing: border-box;
  }
  .wb-content-carousel,
  .wb-content-carousel *,
  .wb-content-carousel *::before,
  .wb-content-carousel *::after {
    box-sizing: border-box;
  }
  .wb-content-carousel a {
    color: currentColor;
    text-decoration: none;
  }
  .wb-content-carousel__container {
    width: 100%;
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 20px;
  }
  .wb-content-carousel__header {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 48px;
  }
  .wb-content-carousel__title {
    margin: 0;
    color: #000a11;
    font-size: 48px;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: 0;
  }
  .wb-content-carousel__nav {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .wb-content-carousel__nav-btn {
    width: 64px;
    height: 64px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0;
    color: #000a11;
    background: transparent;
    cursor: pointer;
  }
  .wb-content-carousel__nav-icon {
    width: 48px;
    height: 48px;
  }
  .wb-content-carousel__carousel-wrap {
    margin: 0 -20px;
  }
  .wb-content-carousel__track {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: calc((100% - 48px) / 3);
    gap: 24px;
    padding: 0 20px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    scroll-padding-inline: 20px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .wb-content-carousel__track::-webkit-scrollbar {
    display: none;
  }
  .wb-content-carousel__item {
    position: relative;
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 16px;
    scroll-snap-align: center;
  }
  .wb-content-carousel__item:first-child {
    scroll-snap-align: start;
  }
  .wb-content-carousel__item:last-child {
    scroll-snap-align: end;
  }
  .wb-content-carousel__media {
    display: block;
    width: 100%;
    aspect-ratio: 42 / 46;
    overflow: hidden;
    background: #d5dbe1;
  }
  .wb-content-carousel__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 260ms ease;
  }
  .wb-content-carousel__item:hover .wb-content-carousel__img {
    transform: scale(1.04);
  }
  .wb-content-carousel__item-title {
    margin: 0;
    color: #000a11;
    font-size: 20px;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  .wb-content-carousel__link::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  @media (max-width: 767px) {
    .wb-content-carousel {
      padding: 32px 0;
    }
    .wb-content-carousel__header {
      margin-bottom: 24px;
    }
    .wb-content-carousel__title {
      font-size: 24px;
    }
    .wb-content-carousel__nav {
      gap: 8px;
    }
    .wb-content-carousel__nav-btn {
      width: 32px;
      height: 32px;
    }
    .wb-content-carousel__nav-icon {
      width: 24px;
      height: 24px;
    }
    .wb-content-carousel__track {
      grid-auto-columns: calc((100% - 12px) / 1.5);
      gap: 12px;
    }
    .wb-content-carousel__item {
      gap: 8px;
    }
    .wb-content-carousel__item-title {
      font-size: 13px;
    }
  }
`

function nonLayered(extra: Record<string, unknown> = {}) {
  return {
    selectable: false,
    draggable: false,
    droppable: false,
    hoverable: false,
    highlightable: false,
    layerable: false,
    copyable: false,
    removable: false,
    ...extra,
  }
}

function writeText(component: any, value: string): void {
  if (!component) return
  const collection = component.components?.()
  if (collection?.length) collection.reset([])
  component.set?.('content', value)
}

function findChildByClass(model: any, className: string): any {
  const children = model?.components?.()?.models ?? []
  for (const child of children) {
    const attrs = child?.getAttributes?.() || {}
    const classes = String(attrs.class || '').split(/\s+/).filter(Boolean)
    if (classes.includes(className)) return child
    const found = findChildByClass(child, className)
    if (found) return found
  }
  return null
}

function normalizeCardType(type: unknown): ContentCardType {
  return type === 'post' ? 'post' : 'product'
}

function normalizeSiteHref(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw || raw === '#') return ''
  if (
    raw.startsWith('/') ||
    raw.startsWith('#') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:') ||
    /^https?:\/\//i.test(raw) ||
    raw.startsWith('//')
  ) {
    return raw
  }

  return `/${raw.replace(/^\.?\//, '')}`
}

function buildStaticProductUrl(item: any): string {
  const slug = String(item?.slug ?? item?.productSlug ?? '').trim()
  const productId = item?.id ?? item?.spuId
  const identifier = slug || (productId == null ? '' : String(productId).trim())
  const canonicalUrl = identifier ? `/products/${encodeURIComponent(identifier)}.html` : '#'
  const explicitUrl = normalizeSiteHref(item?.url ?? item?.productUrl)
  if (!explicitUrl) return canonicalUrl
  if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?)?\/?products\//i.test(explicitUrl)) return explicitUrl
  return canonicalUrl
}

function buildStaticPostUrl(post: any): string {
  const content = post?.contents?.[0] || {}
  const slug = String(content?.slug || post?.slug || '').trim()
  const id = post?.id == null ? '' : String(post.id).trim()
  if (slug) return `/posts/${encodeURIComponent(slug)}.html`
  if (id) return `/posts/${encodeURIComponent(id)}.html`
  return '#'
}

function getDefaultCard(type: ContentCardType, index = 0): ContentCard {
  if (type === 'post') {
    return {
      type,
      image: 'https://placehold.co/420x460/f1f5f9/111827?text=Article',
      title: `Article Title ${index + 1}`,
      href: '#',
    }
  }

  return {
    type,
    image: 'https://placehold.co/420x460/e5e7eb/111827?text=Product',
    title: `Product Name ${index + 1}`,
    href: '#',
  }
}

async function loadProductOptions(): Promise<TraitOption[]> {
  const list = await getSpuSimpleList()
  if (!Array.isArray(list)) return []

  return list
    .map((item: any) => {
      const id = String(item?.id ?? '').trim()
      const name = String(item?.name ?? '').trim()
      return id ? { value: id, label: name ? `${name} (#${id})` : `#${id}` } : null
    })
    .filter(Boolean) as TraitOption[]
}

async function loadPostOptions(): Promise<TraitOption[]> {
  const data = await getPostPage({ pageNo: 1, pageSize: 100 })
  const list = Array.isArray(data?.list) ? data.list : []

  return list
    .map((item: any) => {
      const content = item?.contents?.[0] || {}
      const id = String(item?.id ?? '').trim()
      const name = String(content?.name || item?.name || '').trim()
      return id ? { value: id, label: name ? `${name} (#${id})` : `#${id}` } : null
    })
    .filter(Boolean) as TraitOption[]
}

async function initItemDataSelectTrait(model: any): Promise<void> {
  const trait = model.getTrait?.('itemDataId')
  if (!trait) return

  const type = normalizeCardType(model.get?.('itemType'))
  const currentValue = String(model.get?.('itemDataId') || '').trim()
  const emptyLabel = type === 'post' ? '请选择文章' : '请选择产品'
  const currentLabel = type === 'post' ? `当前文章 (#${currentValue})` : `当前产品 (#${currentValue})`

  trait.set('label', type === 'post' ? '选择文章' : '选择产品')

  try {
    const loadedOptions = type === 'post' ? await loadPostOptions() : await loadProductOptions()
    const options = [{ value: '', label: emptyLabel }, ...loadedOptions]
    if (currentValue && !options.some((item) => item.value === currentValue)) {
      options.push({ value: currentValue, label: currentLabel })
    }
    trait.set('options', options)
  } catch {
    trait.set('options', [
      { value: '', label: emptyLabel },
      ...(currentValue ? [{ value: currentValue, label: `加载失败，保留 #${currentValue}` }] : []),
    ])
  }
}

async function resolveCardFromSelectedData(model: any): Promise<ContentCard> {
  const type = normalizeCardType(model.get?.('itemType'))
  const dataId = String(model.get?.('itemDataId') || '').trim()
  const fallback = getDefaultCard(type)

  if (!dataId) return { ...fallback, dataId: '' }

  if (type === 'post') {
    const response = await getPost(Number(dataId)).catch(() => null)
    const post = response?.post || response || null
    const content = post?.contents?.[0] || {}
    return post
      ? {
          type,
          dataId,
          image: String(post?.image || fallback.image),
          title: String(content?.name || post?.name || fallback.title),
          href: buildStaticPostUrl(post),
        }
      : { ...fallback, dataId }
  }

  const product = await getSpu(Number(dataId)).catch(() => null)
  return product
    ? {
        type,
        dataId,
        image: String(product?.picUrl || product?.sliderPicUrls?.[0] || fallback.image),
        title: String(product?.name || fallback.title),
        href: buildStaticProductUrl(product),
      }
    : { ...fallback, dataId }
}

function buildItemContent(card: ContentCard) {
  return [
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'wb-content-carousel__media' },
      }),
      components: [
        {
          tagName: 'img',
          ...nonLayered({
            attributes: {
              class: 'wb-content-carousel__img',
              src: card.image,
              alt: card.title,
            },
          }),
        },
      ],
    },
    {
      tagName: 'h5',
      ...nonLayered({
        attributes: { class: 'wb-content-carousel__item-title' },
      }),
      components: [
        {
          tagName: 'a',
          ...nonLayered({
            attributes: {
              class: 'wb-content-carousel__link',
              href: card.href,
              'data-card-type': card.type,
              'data-content-id': card.dataId || '',
            },
          }),
          content: card.title,
        },
      ],
    },
  ]
}

function buildItemDef(card: ContentCard, index = 0) {
  return {
    type: WB_CONTENT_CAROUSEL_ITEM_TYPE,
    tagName: 'article',
    name: `${card.type === 'post' ? '文章' : '产品'}卡片 · ${card.title}`,
    selectable: true,
    layerable: true,
    draggable: '.wb-content-carousel__track',
    droppable: false,
    copyable: true,
    removable: true,
    itemType: card.type,
    itemDataId: card.dataId || '',
    attributes: {
      class: 'wb-content-carousel__item',
      'data-wb-component': 'content-carousel-item',
      'data-card-type': card.type,
      'data-content-id': card.dataId || '',
      ...(card.type === 'post'
        ? { 'data-post-id': card.dataId || '', 'data-product-id': '' }
        : { 'data-product-id': card.dataId || '', 'data-post-id': '' }),
      'data-card-index': String(index),
    },
    components: buildItemContent(card),
  }
}

function getItemTraits() {
  return [
    makeSelectTrait('卡片类型', 'itemType', [
      { value: 'product', label: '产品' },
      { value: 'post', label: '文章' },
    ]),
    {
      type: 'select',
      label: '选择产品',
      name: 'itemDataId',
      changeProp: true,
      options: [{ value: '', label: '请选择产品' }],
    },
  ]
}

function syncItemAttrs(model: any): void {
  const type = normalizeCardType(model.get?.('itemType'))
  const dataId = String(model.get?.('itemDataId') || '').trim()
  model.set?.('itemType', type)
  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'wb-content-carousel__item',
    'data-wb-component': 'content-carousel-item',
    'data-card-type': type,
    'data-content-id': dataId,
    ...(type === 'post'
      ? { 'data-post-id': dataId, 'data-product-id': '' }
      : { 'data-product-id': dataId, 'data-post-id': '' }),
  })
}

function syncItemView(model: any, card: ContentCard): void {
  const itemName = `${card.type === 'post' ? '文章' : '产品'}卡片 · ${card.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)

  const image = findChildByClass(model, 'wb-content-carousel__img')
  image?.addAttributes?.({
    class: 'wb-content-carousel__img',
    src: card.image,
    alt: card.title,
  })

  const link = findChildByClass(model, 'wb-content-carousel__link')
  link?.addAttributes?.({
    class: 'wb-content-carousel__link',
    href: card.href,
    'data-card-type': card.type,
    'data-content-id': card.dataId || '',
  })
  writeText(link, card.title)
}

async function syncItemFromData(model: any): Promise<void> {
  syncItemAttrs(model)
  const card = await resolveCardFromSelectedData(model)
  syncItemView(model, card)
}

function syncCarousel(model: any): void {
  const title = String(model.get?.('carouselTitle') || '').trim() || 'Related Products'
  writeText(findChildByClass(model, 'wb-content-carousel__title'), title)
}

function resolveCarouselTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_CONTENT_CAROUSEL_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_CONTENT_CAROUSEL_TYPE) as any
  if (fromSelected?.get?.('type') === WB_CONTENT_CAROUSEL_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_CONTENT_CAROUSEL_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_CONTENT_CAROUSEL_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_CONTENT_CAROUSEL_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_CONTENT_CAROUSEL_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_CONTENT_CAROUSEL_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_CONTENT_CAROUSEL_TYPE) return fromTraitTarget

  return null
}

function createAddCardTrait(type: ContentCardType) {
  return {
    type: 'button' as any,
    name: `add-${type}-card`,
    label: false as const,
    text: type === 'post' ? '+ 添加文章卡片' : '+ 添加产品卡片',
    full: true,
    command(this: any, editor: Editor) {
      const carousel = resolveCarouselTarget(editor, this)
      const track = carousel?._getTrack?.()
      const items = track?.components?.()
      if (!items) return

      const index = items.length || 0
      const created = items.add(buildItemDef(getDefaultCard(type, index), index))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

function buildTree() {
  return [
    {
      tagName: 'div',
      name: '内容容器',
      ...nonLayered({
        selectable: true,
        attributes: { class: 'wb-content-carousel__container' },
      }),
      components: [
        {
          tagName: 'div',
          ...nonLayered({
            attributes: { class: 'wb-content-carousel__header' },
          }),
          components: [
            {
              tagName: 'h2',
              ...nonLayered({
                attributes: { class: 'wb-content-carousel__title' },
              }),
              content: 'Related Products',
            },
            {
              tagName: 'div',
              ...nonLayered({
                attributes: { class: 'wb-content-carousel__nav' },
              }),
              components: [
                {
                  tagName: 'button',
                  ...nonLayered({
                    attributes: {
                      class: 'wb-content-carousel__nav-btn wb-content-carousel__nav-btn--prev',
                      type: 'button',
                      'aria-label': 'Previous item',
                    },
                  }),
                  components: SVG_PREV,
                },
                {
                  tagName: 'button',
                  ...nonLayered({
                    attributes: {
                      class: 'wb-content-carousel__nav-btn wb-content-carousel__nav-btn--next',
                      type: 'button',
                      'aria-label': 'Next item',
                    },
                  }),
                  components: SVG_NEXT,
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          ...nonLayered({
            selectable: true,
            attributes: { class: 'wb-content-carousel__carousel-wrap' },
          }),
          components: [
            {
              tagName: 'div',
              name: '卡片列表',
              ...nonLayered({
                selectable: true,
                droppable: '.wb-content-carousel__item',
                attributes: { class: 'wb-content-carousel__track' },
              }),
              components: DEFAULT_CARDS.map((card, index) => buildItemDef(card, index)),
            },
          ],
        },
      ],
    },
  ]
}

export function registerContentCarouselComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CONTENT_CAROUSEL_TYPE)) return

  domComponents.addType(WB_CONTENT_CAROUSEL_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'content-carousel-item'
      || el?.classList?.contains('wb-content-carousel__item')
        ? { type: WB_CONTENT_CAROUSEL_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '内容卡片',
        tagName: 'article',
        selectable: true,
        layerable: true,
        draggable: '.wb-content-carousel__track',
        droppable: false,
        copyable: true,
        removable: true,
        itemType: 'product',
        itemDataId: '',
        traits: getItemTraits(),
      },
      async init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(buildItemContent(getDefaultCard(normalizeCardType(this.get?.('itemType')))))
        }
        this.listenTo(this, 'change:itemType', async () => {
          this.set?.('itemDataId', '')
          await initItemDataSelectTrait(this)
          await syncItemFromData(this)
        })
        this.listenTo(this, 'change:itemDataId', async () => {
          await syncItemFromData(this)
        })
        syncItemAttrs(this)
        await initItemDataSelectTrait(this)
        await syncItemFromData(this)
      },
    },
  })

  domComponents.addType(WB_CONTENT_CAROUSEL_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'content-carousel'
        ? { type: WB_CONTENT_CAROUSEL_TYPE }
        : false,
    model: {
      defaults: {
        name: '产品/文章轮播',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        carouselTitle: 'Related Products',
        attributes: {
          'data-wb-component': 'content-carousel',
          class: 'wb-content-carousel',
        },
        script: function () {
          const root = this as HTMLElement
          const rootState = root as any
          rootState._wbContentCarouselCleanup?.()

          const track = root.querySelector('.wb-content-carousel__track') as HTMLElement | null
          const prev = root.querySelector('.wb-content-carousel__nav-btn--prev') as HTMLButtonElement | null
          const next = root.querySelector('.wb-content-carousel__nav-btn--next') as HTMLButtonElement | null
          if (!track || !prev || !next) return

          let currentIndex = 0

          const getItems = () =>
            Array.from(track.querySelectorAll<HTMLElement>('.wb-content-carousel__item'))

          const scrollToIndex = (index: number) => {
            const items = getItems()
            if (!items.length) return
            const max = items.length - 1
            currentIndex = Math.max(0, Math.min(index, max))
            items[currentIndex]?.scrollIntoView({
              behavior: 'smooth',
              inline: 'center',
              block: 'nearest',
            })
          }

          const onPrev = () => scrollToIndex(currentIndex - 1)
          const onNext = () => scrollToIndex(currentIndex + 1)

          prev.addEventListener('click', onPrev)
          next.addEventListener('click', onNext)
          rootState._wbContentCarouselCleanup = () => {
            prev.removeEventListener('click', onPrev)
            next.removeEventListener('click', onNext)
          }
        },
        styles: CONTENT_CAROUSEL_CSS,
        traits: [
          makeTextTrait('标题', 'carouselTitle', { placeholder: 'Related Products' }),
          createAddCardTrait('product'),
          createAddCardTrait('post'),
        ],
        components: buildTree(),
      },
      init(this: any) {
        this.listenTo(this, 'change:carouselTitle', () => syncCarousel(this))
        syncCarousel(this)
      },
      _getTrack(this: any) {
        const container = this.components?.()?.at?.(0)
        const wrap = container?.components?.()?.at?.(1)
        return wrap?.components?.()?.at?.(0) ?? null
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_CONTENT_CAROUSEL_TYPE || type === WB_CONTENT_CAROUSEL_ITEM_TYPE) return

    const item = component?.closestType?.(WB_CONTENT_CAROUSEL_ITEM_TYPE)
    if (item?.get?.('type') === WB_CONTENT_CAROUSEL_ITEM_TYPE) {
      editor.select?.(item)
    }
  })

  blockManager?.add?.(WB_CONTENT_CAROUSEL_TYPE, {
    label: '产品/文章轮播',
    category: 'Section',
    content: { type: WB_CONTENT_CAROUSEL_TYPE },
    media: BLOCK_ICON,
  })
}
