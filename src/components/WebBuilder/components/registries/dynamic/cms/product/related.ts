import type { GrapesEditor } from '../../../../../types/editor'
import { WB_CMS_PRODUCT_RELATED_TYPE } from '../constants'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="5" width="5" height="14" rx="1.5" />
  <rect x="9.5" y="5" width="5" height="14" rx="1.5" />
  <rect x="16" y="5" width="5" height="14" rx="1.5" />
</svg>`

const SVG_PREV = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="27" height="70" viewBox="0 0 27 70"><path d="M0.38 32.98 26.09 69.79l.82-.58L1.62 33.02 26.89.81 26.11.19 0.38 32.98Z" fill="#777"/></svg>`
const SVG_NEXT = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="27" height="70" viewBox="0 0 27 70"><path d="M26.62 32.98.91 69.79l-.82-.58 25.29-36.19L.11.81.89.19l25.73 32.79Z" fill="#777"/></svg>`

type RelatedProduct = {
  title: string
  description: string
  image: string
  href: string
}

const DEFAULT_PRODUCTS: RelatedProduct[] = [
  {
    title: 'Track Roller',
    description:
      'Regardless of material or machine, the track roller bearing is important for track and rail operations. Regardless of material or machine.',
    image: 'https://dummyimage.com/620x430/f8f8f8/222&text=Track+Roller',
    href: '#',
  },
  {
    title: 'Track Roller',
    description:
      'Regardless of material or machine, the track roller bearing is important for track and rail operations. Regardless of material or machine.',
    image: 'https://dummyimage.com/620x430/f8f8f8/222&text=Bearing',
    href: '#',
  },
  {
    title: 'Track Roller',
    description:
      'Regardless of material or machine, the track roller bearing is important for track and rail operations. Regardless of material or machine.',
    image: 'https://dummyimage.com/620x430/f8f8f8/222&text=Roller+Bearing',
    href: '#',
  },
  {
    title: 'Track Roller',
    description:
      'Regardless of material or machine, the track roller bearing is important for track and rail operations. Regardless of material or machine.',
    image: 'https://dummyimage.com/620x430/f8f8f8/222&text=Product',
    href: '#',
  },
]

const DEFAULT_SECTION_TITLE = 'Popular Models'
const DEFAULT_SECTION_SUBTITLE = 'Other Models Frequently Viewed'
const DEFAULT_LINK_TEXT = 'SEE MORE'
const DEFAULT_BADGE_TEXT = 'Custom'
const DEFAULT_BADGE_BACKGROUND = '#8200DB'

const RELATED_PRODUCTS_CSS = `
  .wb-cms-product-related {
    width: 100%;
    padding: 92px 0 96px;
    background: #fafafa;
    color: #090909;
    box-sizing: border-box;
    overflow: hidden;
  }
  .wb-cms-product-related,
  .wb-cms-product-related * {
    box-sizing: border-box;
  }
  .wb-cms-product-related__container {
    width: 100%;
    margin: 0 auto;
  }
  .wb-cms-product-related__container:not([data-show-badge="true"]) .wb-cms-product-related__badge {
    display: none;
  }
  .wb-cms-product-related__header {
    margin-bottom: 34px;
  }
  .wb-cms-product-related__title {
    margin: 0;
    color: #000;
    font-size: 56px;
    line-height: 1.12;
    font-weight: 800;
    letter-spacing: 0;
  }
  .wb-cms-product-related__subtitle {
    margin: 12px 0 0;
    color: #6f7081;
    font-size: 22px;
    line-height: 1.45;
    font-weight: 400;
  }
  .wb-cms-product-related__carousel {
    position: relative;
  }
  .wb-cms-product-related__viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .wb-cms-product-related__viewport::-webkit-scrollbar {
    display: none;
  }
  .wb-cms-product-related__track {
    display: flex;
    align-items: stretch;
    gap: 24px;
    padding: 0;
  }
  .wb-cms-product-related__card {
    position: relative;
    flex: 0 0 calc((100% - 48px) / 3);
    min-width: 300px;
    min-height: 600px;
    padding: 20px 36px 36px;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 14px;
    scroll-snap-align: start;
  }
  .wb-cms-product-related__card::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -20px;
    width: 287px;
    height: 41px;
    opacity: 0;
    pointer-events: none;
    background: #E4E3E3;
    filter: blur(41px);
    transform: translateX(-50%);
    transition: opacity 240ms ease;
    z-index: -1;
  }
  .wb-cms-product-related__card:hover::after {
    opacity: 1;
  }
  .wb-cms-product-related__badge {
    position: absolute;
    top: 40px;
    right: 40px;
    z-index: 2;
    max-width: calc(100% - 80px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: ${DEFAULT_BADGE_BACKGROUND};
    color: #fff;
    font-size: 24px;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: 0;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .wb-cms-product-related__media {
    width: 100%;
    height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 34px;
  }
  .wb-cms-product-related__image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }
  .wb-cms-product-related__body {
    margin-top: auto;
  }
  .wb-cms-product-related__card-title {
    margin: 0;
    color: #080808;
    font-size: 20px;
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0;
  }
  .wb-cms-product-related__desc {
    margin: 10px 0 0;
    color: #111111;
    font-size: 14px;
    line-height: 20px;
    font-weight: normal;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .wb-cms-product-related__link {
    display: inline-flex;
    margin-top: 24px;
    color: #3C53E8;
    font-size: 14px;
    line-height: 20px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .wb-cms-product-related__nav {
    position: absolute;
    top: 44%;
    z-index: 2;
    width: 46px;
    height: 88px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #777;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .wb-cms-product-related__nav:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .wb-cms-product-related__nav--prev {
    left: -78px;
  }
  .wb-cms-product-related__nav--next {
    right: -78px;
  }
  .wb-cms-product-related__nav svg {
    display: block;
    width: 27px;
    height: 70px;
  }
  @media (max-width: 1439px) {
    .wb-cms-product-related__title {
      font-size: 46px;
    }
    .wb-cms-product-related__subtitle {
      font-size: 18px;
    }
    .wb-cms-product-related__card {
      padding: 20px 36px 36px;
      min-height: 520px;
    }
    .wb-cms-product-related__badge {
      top: 32px;
      right: 32px;
    }
    .wb-cms-product-related__nav--prev {
      left: -54px;
    }
    .wb-cms-product-related__nav--next {
      right: -54px;
    }
  }
  @media (max-width: 1023px) {
    .wb-cms-product-related__card {
      flex-basis: calc((100% - 20px) / 2);
    }
    .wb-cms-product-related__track {
      gap: 20px;
    }
    .wb-cms-product-related__nav {
      display: none;
    }
  }
  @media (max-width: 767px) {
    .wb-cms-product-related {
      padding: 54px 0 60px;
    }
    .wb-cms-product-related__header {
      margin-bottom: 24px;
    }
    .wb-cms-product-related__title {
      font-size: 32px;
      line-height: 1.18;
    }
    .wb-cms-product-related__subtitle {
      margin-top: 8px;
      font-size: 15px;
    }
    .wb-cms-product-related__track {
      gap: 16px;
      padding-bottom: 0;
    }
    .wb-cms-product-related__card {
      flex-basis: 60%;
      min-width: auto;
      min-height: auto;
      padding: 10px 16px 16px;
      border-radius: 10px;
    }
    .wb-cms-product-related__badge {
      top: 18px;
      right: 18px;
      max-width: calc(100% - 36px);
      border-radius: 4px;
    }
    .wb-cms-product-related__media {
      margin-bottom: 26px;
      height: auto;
    }
    .wb-cms-product-related__card-title {
      font-size: 16px;
    }
    .wb-cms-product-related__desc {
      font-size: 14px;
      -webkit-line-clamp: 2;
    }
    .wb-cms-product-related__link {
      font-size: 14px;
      margin-top: 8px;
    }
  }
`

function normalizeLimit(value: any): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return 6
  return Math.max(1, Math.min(12, parsed))
}

function normalizeBooleanString(value: any, fallback = false): 'true' | 'false' {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return 'true'
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return 'false'
  return fallback ? 'true' : 'false'
}

function findComponentByAttr(component: any, attrName: string, attrValue?: string): any {
  if (!component?.getAttributes || !component?.components) return null

  const attrs = component.getAttributes() || {}
  if (
    Object.prototype.hasOwnProperty.call(attrs, attrName) &&
    (attrValue === undefined || String(attrs[attrName]) === attrValue)
  ) {
    return component
  }

  const children = component.components?.().models || []
  for (const child of children) {
    const found = findComponentByAttr(child, attrName, attrValue)
    if (found) return found
  }

  return null
}

function setComponentText(component: any, value: string): void {
  if (!component) return
  if (component.components?.()?.length) component.components().reset([])
  component.set?.('content', value)
}

function getComponentText(component: any): string {
  if (!component) return ''

  const content = component.get?.('content')
  if (typeof content === 'string' && content.trim()) return content.trim()

  const children = component.components?.()
  const models = children?.models || []
  return models.map((child: any) => getComponentText(child)).join('').trim()
}

function restoreFieldsFromCanvas(model: any): void {
  if (!model || model.__wbRelatedSyncing) return
  model.__wbRelatedSyncing = true

  const titleNode = findComponentByAttr(model, 'data-wb-related-slot', 'title')
  const subtitleNode = findComponentByAttr(model, 'data-wb-related-slot', 'subtitle')
  const linkNode = findComponentByAttr(model, 'data-wb-related-slot', 'card-link')

  const titleText = getComponentText(titleNode) || DEFAULT_SECTION_TITLE
  const subtitleText = getComponentText(subtitleNode) || DEFAULT_SECTION_SUBTITLE
  const linkText = getComponentText(linkNode) || DEFAULT_LINK_TEXT

  model.set('sectionTitle', titleText, { silent: true })
  model.set('sectionSubtitle', subtitleText, { silent: true })
  model.set('linkText', linkText, { silent: true })

  model.__wbRelatedSyncing = false
}

function buildBadge(index: number) {
  return {
    tagName: 'div',
    type: 'text',
    selectable: true,
    hoverable: true,
    editable: true,
    draggable: false,
    droppable: false,
    stylable: true,
    attributes: {
      class: 'wb-cms-product-related__badge',
      'data-wb-related-card-slot': 'badge',
      'data-related-placeholder-index': String(index),
    },
    style: {
      'background-color': DEFAULT_BADGE_BACKGROUND,
      color: '#ffffff',
    },
    components: DEFAULT_BADGE_TEXT,
  }
}

function ensureCardBadge(card: any, index: number): void {
  if (!card?.components || findComponentByAttr(card, 'data-wb-related-card-slot', 'badge')) {
    return
  }

  card.components().add(buildBadge(index), { at: 0 })
}

function buildCard(product: RelatedProduct, index: number) {
  return {
    tagName: 'article',
    selectable: true,
    hoverable: true,
    editable: false,
    draggable: '[data-wb-related-track="true"]',
    droppable: false,
    attributes: {
      class: 'wb-cms-product-related__card',
      'data-related-placeholder-index': String(index),
    },
    components: [
      buildBadge(index),
      {
        tagName: 'div',
        selectable: false,
        hoverable: false,
        editable: false,
        draggable: false,
        droppable: false,
        attributes: { class: 'wb-cms-product-related__media' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            hoverable: true,
            editable: false,
            draggable: false,
            droppable: false,
            attributes: {
              class: 'wb-cms-product-related__image',
              src: product.image,
              alt: product.title,
            },
          },
        ],
      },
      {
        tagName: 'div',
        selectable: false,
        hoverable: false,
        editable: false,
        draggable: false,
        droppable: false,
        attributes: { class: 'wb-cms-product-related__body' },
        components: [
          {
            tagName: 'h3',
            type: 'text',
            selectable: true,
            hoverable: true,
            editable: true,
            draggable: false,
            droppable: false,
            attributes: { class: 'wb-cms-product-related__card-title' },
            components: product.title,
          },
          {
            tagName: 'p',
            type: 'text',
            selectable: true,
            hoverable: true,
            editable: true,
            draggable: false,
            droppable: false,
            attributes: { class: 'wb-cms-product-related__desc' },
            components: product.description,
          },
          {
            tagName: 'a',
            type: 'link',
            selectable: true,
            hoverable: true,
            editable: true,
            draggable: false,
            droppable: false,
            attributes: {
              class: 'wb-cms-product-related__link',
              href: product.href,
              'data-wb-related-slot': 'card-link',
            },
            components: 'SEE MORE',
          },
        ],
      },
    ],
  }
}

function buildComponents(props: {
  title: string
  subtitle: string
  linkText: string
  limit: number
  showBadge: 'true' | 'false'
}) {
  const products = Array.from({ length: props.limit }, (_, index) =>
    DEFAULT_PRODUCTS[index % DEFAULT_PRODUCTS.length],
  )

  return [
    {
      tagName: 'div',
      selectable: true,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      attributes: {
        class: 'wb-cms-product-related__container',
        'data-show-badge': props.showBadge,
      },
      components: [
        {
          tagName: 'div',
          selectable: true,
          hoverable: true,
          editable: false,
          draggable: false,
          droppable: true,
          attributes: { class: 'wb-cms-product-related__header' },
          components: [
            {
              tagName: 'h2',
              type: 'text',
              selectable: true,
              hoverable: true,
              editable: true,
              draggable: false,
              droppable: false,
              attributes: {
                class: 'wb-cms-product-related__title',
                'data-wb-related-slot': 'title',
              },
              components: props.title,
            },
            {
              tagName: 'p',
              type: 'text',
              selectable: true,
              hoverable: true,
              editable: true,
              draggable: false,
              droppable: false,
              attributes: {
                class: 'wb-cms-product-related__subtitle',
                'data-wb-related-slot': 'subtitle',
              },
              components: props.subtitle,
            },
          ],
        },
        {
          tagName: 'div',
          selectable: true,
          hoverable: false,
          editable: false,
          draggable: false,
          droppable: false,
          attributes: { class: 'wb-cms-product-related__carousel' },
          components: [
            {
              tagName: 'button',
              selectable: false,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              attributes: {
                class: 'wb-cms-product-related__nav wb-cms-product-related__nav--prev',
                type: 'button',
                'aria-label': 'Previous related products',
              },
              components: SVG_PREV,
            },
            {
              tagName: 'div',
              selectable: true,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              attributes: {
                class: 'wb-cms-product-related__viewport',
                'data-wb-related-viewport': 'true',
              },
              components: [
                {
                  tagName: 'div',
                  selectable: true,
                  hoverable: false,
                  editable: false,
                  draggable: false,
                  droppable: '.wb-cms-product-related__card',
                  attributes: {
                    class: 'wb-cms-product-related__track',
                    'data-wb-related-track': 'true',
                  },
                  components: products.map((product, index) => buildCard(product, index)),
                },
              ],
            },
            {
              tagName: 'button',
              selectable: false,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              attributes: {
                class: 'wb-cms-product-related__nav wb-cms-product-related__nav--next',
                type: 'button',
                'aria-label': 'Next related products',
              },
              components: SVG_NEXT,
            },
          ],
        },
      ],
    },
  ]
}

function makeRelatedProductsScript() {
  return function (this: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this
    root._wbRelatedProductsCleanup?.()

    const viewport = root.querySelector('.wb-cms-product-related__viewport') as HTMLElement | null
    const track = root.querySelector('.wb-cms-product-related__track') as HTMLElement | null
    const prevBtn = root.querySelector('.wb-cms-product-related__nav--prev') as HTMLButtonElement | null
    const nextBtn = root.querySelector('.wb-cms-product-related__nav--next') as HTMLButtonElement | null
    if (!viewport || !track || !prevBtn || !nextBtn) return

    const getStep = () => {
      const firstCard = track.querySelector('.wb-cms-product-related__card') as HTMLElement | null
      if (!firstCard) return Math.max(viewport.clientWidth * 0.8, 260)
      const styles = window.getComputedStyle(track)
      const gap = Number.parseFloat(styles.gap || styles.columnGap || '0') || 0
      return firstCard.getBoundingClientRect().width + gap
    }

    const updateNavState = () => {
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
      const canScroll = maxScroll > 4
      prevBtn.style.display = canScroll ? '' : 'none'
      nextBtn.style.display = canScroll ? '' : 'none'
      prevBtn.disabled = !canScroll || viewport.scrollLeft <= 4
      nextBtn.disabled = !canScroll || viewport.scrollLeft >= maxScroll - 4
    }

    const scrollByStep = (direction: number) => {
      viewport.scrollBy({ left: getStep() * direction, behavior: 'smooth' })
    }

    const onPrev = () => scrollByStep(-1)
    const onNext = () => scrollByStep(1)
    const onRefresh = () => updateNavState()

    prevBtn.addEventListener('click', onPrev)
    nextBtn.addEventListener('click', onNext)
    viewport.addEventListener('scroll', updateNavState, { passive: true })
    root.addEventListener('wb:related-products:refresh', onRefresh)
    window.addEventListener('resize', updateNavState)
    window.requestAnimationFrame(updateNavState)

    root._wbRelatedProductsCleanup = () => {
      prevBtn.removeEventListener('click', onPrev)
      nextBtn.removeEventListener('click', onNext)
      viewport.removeEventListener('scroll', updateNavState)
      root.removeEventListener('wb:related-products:refresh', onRefresh)
      window.removeEventListener('resize', updateNavState)
    }
  }
}

export function registerCmsProductRelated(editor: GrapesEditor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CMS_PRODUCT_RELATED_TYPE)) return

  const baseType = domComponents.getType('default')
  const originalToJSON = baseType?.model?.prototype?.toJSON

  domComponents.addType(WB_CMS_PRODUCT_RELATED_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'cms-product-related'
        ? { type: WB_CMS_PRODUCT_RELATED_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Popular Models',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'cms-product-related',
          'data-cms-component': 'product-related',
          'data-dynamic-status': 'pending',
          class: 'wb-cms-product-related',
        },
        styles: RELATED_PRODUCTS_CSS,
        script: makeRelatedProductsScript(),
        'script-export': makeRelatedProductsScript(),
        sectionTitle: DEFAULT_SECTION_TITLE,
        sectionSubtitle: DEFAULT_SECTION_SUBTITLE,
        linkText: DEFAULT_LINK_TEXT,
        showBadge: 'false',
        limit: 6,
        traits: [
          {
            type: 'text',
            label: '标题',
            name: 'sectionTitle',
            changeProp: true,
            placeholder: DEFAULT_SECTION_TITLE,
          },
          {
            type: 'text',
            label: '副标题',
            name: 'sectionSubtitle',
            changeProp: true,
            placeholder: DEFAULT_SECTION_SUBTITLE,
          },
          {
            type: 'text',
            label: '链接文字',
            name: 'linkText',
            changeProp: true,
            placeholder: DEFAULT_LINK_TEXT,
          },
          {
            type: 'select',
            label: '显示徽章',
            name: 'showBadge',
            changeProp: true,
            options: [
              { value: 'false', label: '隐藏' },
              { value: 'true', label: '显示' },
            ],
          },
          {
            type: 'number',
            label: '占位数量',
            name: 'limit',
            changeProp: true,
            min: 1,
            max: 12,
            step: 1,
          },
        ],
        components: buildComponents({
          title: DEFAULT_SECTION_TITLE,
          subtitle: DEFAULT_SECTION_SUBTITLE,
          linkText: DEFAULT_LINK_TEXT,
          showBadge: 'false',
          limit: 6,
        }),
      },

      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        const track = findComponentByAttr(this, 'data-wb-related-track', 'true')
        const cards = track?.components?.()
        const savedLimit = attrs['data-limit'] || cards?.length || this.get('limit')
        const titleNode = findComponentByAttr(this, 'data-wb-related-slot', 'title')
        const subtitleNode = findComponentByAttr(this, 'data-wb-related-slot', 'subtitle')
        const linkNode = findComponentByAttr(this, 'data-wb-related-slot', 'card-link')
        const containerNode = findComponentByAttr(this, 'class', 'wb-cms-product-related__container')

        // 优先从画布子节点读取文本（因为用户可能在编辑器中直接修改了）
        const canvasTitle = getComponentText(titleNode)
        const canvasSubtitle = getComponentText(subtitleNode)
        const canvasLinkText = getComponentText(linkNode)

        // 只有当画布文本为空或无效时才回退到属性/模型值
        const savedTitle =
          canvasTitle ||
          attrs['data-section-title'] ||
          (this.get('sectionTitle') !== DEFAULT_SECTION_TITLE ? this.get('sectionTitle') : '') ||
          DEFAULT_SECTION_TITLE
        const savedSubtitle =
          canvasSubtitle ||
          attrs['data-section-subtitle'] ||
          (this.get('sectionSubtitle') !== DEFAULT_SECTION_SUBTITLE
            ? this.get('sectionSubtitle')
            : '') ||
          DEFAULT_SECTION_SUBTITLE
        const savedLinkText =
          canvasLinkText ||
          attrs['data-link-text'] ||
          (this.get('linkText') !== DEFAULT_LINK_TEXT ? this.get('linkText') : '') ||
          DEFAULT_LINK_TEXT
        const savedShowBadge = normalizeBooleanString(
          attrs['data-show-badge'] ||
            containerNode?.getAttributes?.()?.['data-show-badge'] ||
            this.get('showBadge'),
          false,
        )

        this.set('limit', normalizeLimit(savedLimit), { silent: true })
        this.set('sectionTitle', String(savedTitle || DEFAULT_SECTION_TITLE), { silent: true })
        this.set('sectionSubtitle', String(savedSubtitle || DEFAULT_SECTION_SUBTITLE), {
          silent: true,
        })
        this.set('linkText', String(savedLinkText || DEFAULT_LINK_TEXT), { silent: true })
        this.set('showBadge', savedShowBadge, { silent: true })
        cards?.models?.forEach((card: any, index: number) => ensureCardBadge(card, index))
        this.on('change:sectionTitle change:sectionSubtitle change:linkText change:showBadge', this._syncContent)
        this.on('change:limit', this._syncLimitCards)
        this._syncContent()
      },

      _syncContent(this: any) {
        const title = String(this.get('sectionTitle') || DEFAULT_SECTION_TITLE)
        const subtitle = String(this.get('sectionSubtitle') || DEFAULT_SECTION_SUBTITLE)
        const linkText = String(this.get('linkText') || DEFAULT_LINK_TEXT)
        const showBadge = normalizeBooleanString(this.get('showBadge'), false)
        const limit = normalizeLimit(this.get('limit'))

        setComponentText(findComponentByAttr(this, 'data-wb-related-slot', 'title'), title)
        setComponentText(findComponentByAttr(this, 'data-wb-related-slot', 'subtitle'), subtitle)

        const links = this.find?.('.wb-cms-product-related__link') || []
        links.forEach((link: any) => setComponentText(link, linkText))

        this.addAttributes({
          'data-limit': String(limit),
          'data-section-title': title,
          'data-section-subtitle': subtitle,
          'data-link-text': linkText,
          'data-show-badge': showBadge,
        })
        findComponentByAttr(this, 'class', 'wb-cms-product-related__container')?.addAttributes?.({
          'data-show-badge': showBadge,
        })

        const el = this.getView?.()?.el as HTMLElement | undefined
        el?.dispatchEvent?.(new CustomEvent('wb:related-products:refresh'))
      },

      _syncLimitCards(this: any) {
        const limit = normalizeLimit(this.get('limit'))
        const track = findComponentByAttr(this, 'data-wb-related-track', 'true')
        const cards = track?.components?.()
        if (!cards) return

        while (cards.length < limit) {
          const index = cards.length
          cards.add(buildCard(DEFAULT_PRODUCTS[index % DEFAULT_PRODUCTS.length], index))
        }

        cards.models?.forEach((card: any, index: number) => ensureCardBadge(card, index))

        while (cards.length > limit) {
          const last = cards.at?.(cards.length - 1)
          if (!last) break
          cards.remove?.(last)
        }

        this.addAttributes({
          'data-limit': String(limit),
        })

        const el = this.getView?.()?.el as HTMLElement | undefined
        el?.dispatchEvent?.(new CustomEvent('wb:related-products:refresh'))
      },

      toJSON(this: any, opts: any) {
        restoreFieldsFromCanvas(this)
        return originalToJSON.call(this, opts)
      },
    },
  })

  blockManager?.add?.(WB_CMS_PRODUCT_RELATED_TYPE, {
    label: 'Popular Models',
    category: 'CMS',
    content: { type: WB_CMS_PRODUCT_RELATED_TYPE },
    media: BLOCK_ICON,
  })

  editor.on('rte:disable', (view: any) => {
    const component = view?.model
    const related = component?.get?.('type') === WB_CMS_PRODUCT_RELATED_TYPE
      ? component
      : component?.closestType?.(WB_CMS_PRODUCT_RELATED_TYPE)
    if (!related || related.get?.('type') !== WB_CMS_PRODUCT_RELATED_TYPE) return
    restoreFieldsFromCanvas(related)
  })
}
