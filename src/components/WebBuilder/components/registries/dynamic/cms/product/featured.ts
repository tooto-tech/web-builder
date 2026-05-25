import type { GrapesEditor } from '../../../../../types/editor'
import { getSpu } from '@/api/mall/product/spu'
import { WB_CMS_PRODUCT_FEATURED_TYPE } from '../constants'
import { initPreviewProductTrait } from './previewProductTrait'

const WB_CMS_PRODUCT_FEATURED_CARD_TYPE = 'wb-cms-product-featured-card'

const DEFAULT_PRODUCT = {
  name: 'Led Light Anti-fog Wall Bathroom Vanity Mirror',
  image:
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80',
  url: '/products.html',
}

const FEATURED_PRODUCT_CSS = `
  .wb-cms-product-featured {
    width: 100%;
    background: #ffffff;
    padding: 64px 0 72px;
    box-sizing: border-box;
    overflow: hidden;
  }
  .wb-cms-product-featured__container {
    max-width: 1352px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .wb-cms-product-featured__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 32px;
  }
  .wb-cms-product-featured__title {
    margin: 0;
    color: #000a11;
    font-size: 48px;
    font-weight: 600;
    line-height: 1.2;
  }
  .wb-cms-product-featured__actions {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }
  .wb-cms-product-featured__action {
    min-width: 180px;
    padding: 16px 28px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.2;
    transition: opacity 0.25s ease;
  }
  .wb-cms-product-featured__action:hover {
    opacity: 0.85;
  }
  .wb-cms-product-featured__action--primary {
    background: #ffd600;
    color: #07111c;
    border: none;
  }
  .wb-cms-product-featured__action--secondary {
    background: transparent;
    color: #1e4562;
    border: 1px solid #6f8aa1;
  }
  .wb-cms-product-featured__carousel {
    position: relative;
  }
  .wb-cms-product-featured__viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .wb-cms-product-featured__viewport::-webkit-scrollbar {
    display: none;
  }
  .wb-cms-product-featured__track {
    display: flex;
    align-items: stretch;
    gap: 24px;
  }
  .wb-cms-product-featured__slide {
    flex: 0 0 calc((100% - 48px) / 3);
    min-width: 280px;
    display: flex;
    flex-direction: column;
    scroll-snap-align: start;
  }
  .wb-cms-product-featured__card-link {
    color: inherit;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
    height: 100%;
  }
  .wb-cms-product-featured__media {
    aspect-ratio: 36 / 42;
    overflow: hidden;
    background: #edf0f2;
  }
  .wb-cms-product-featured__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .wb-cms-product-featured__name {
    margin: 0;
    font-size: 16px;
    line-height: 1.45;
    font-weight: 400;
    color: #11161d;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .wb-cms-product-featured__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 44px;
    height: 44px;
    border: none;
    background: rgba(255, 255, 255, 0.92);
    color: #6f8aa1;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .wb-cms-product-featured__nav:hover {
    opacity: 0.86;
  }
  .wb-cms-product-featured__nav:disabled {
    cursor: default;
    opacity: 0.35;
  }
  .wb-cms-product-featured__nav--prev {
    left: -22px;
  }
  .wb-cms-product-featured__nav--next {
    right: -22px;
  }
  .wb-cms-product-featured__nav-icon {
    display: block;
    font-size: 22px;
    line-height: 1;
    font-style: normal;
  }
  @media (max-width: 1199px) {
    .wb-cms-product-featured__slide {
      flex-basis: calc((100% - 24px) / 2);
    }
  }
  @media (max-width: 767px) {
    .wb-cms-product-featured {
      padding: 46px 0 48px;
    }
    .wb-cms-product-featured__header {
      flex-direction: column;
      align-items: stretch;
      gap: 18px;
      margin-bottom: 24px;
    }
    .wb-cms-product-featured__title {
      font-size: 28px;
    }
    .wb-cms-product-featured__actions {
      gap: 12px;
    }
    .wb-cms-product-featured__action {
      min-width: 0;
      flex: 1;
      padding: 15px 16px;
      font-size: 15px;
    }
    .wb-cms-product-featured__slide {
      flex-basis: 76%;
      min-width: 220px;
    }
    .wb-cms-product-featured__track {
      gap: 14px;
    }
    .wb-cms-product-featured__nav {
      display: none;
    }
    .wb-cms-product-featured__name {
      font-size: 12px;
      line-height: 1.35;
    }
  }
`

function normalizeSiteHref(rawValue: any): string {
  const value = String(rawValue ?? '').trim()
  if (!value) return ''
  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    /^https?:\/\//i.test(value) ||
    value.startsWith('//')
  ) {
    return value
  }

  return `/${value.replace(/^\.?\//, '')}`
}

function buildStaticProductUrl(item: any): string {
  const slug = String(item?.slug ?? item?.productSlug ?? '').trim()
  const productId = item?.id ?? item?.spuId
  const identifier = slug || (productId == null ? '' : String(productId).trim())
  const canonicalUrl = identifier ? `/products/${encodeURIComponent(identifier)}.html` : '#'

  const explicitUrl = normalizeSiteHref(item?.url ?? item?.productUrl)
  if (!explicitUrl) return canonicalUrl

  if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?)?\/?products\//i.test(explicitUrl)) {
    return explicitUrl
  }

  return canonicalUrl
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
  const text = String(value ?? '')
  if (component.components?.()?.length) {
    component.components().reset([])
  }
  component.set?.('content', text)
}

function setComponentHref(component: any, value: string): void {
  if (!component?.addAttributes) return
  component.addAttributes({ href: normalizeSiteHref(value) || '#' })
}

function setComponentImage(component: any, src: string, alt: string): void {
  if (!component?.addAttributes) return
  component.addAttributes({
    src: src || DEFAULT_PRODUCT.image,
    alt: alt || DEFAULT_PRODUCT.name,
  })
}

function buildActionDef(text: string, modifier: string, href: string, slot: string) {
  return {
    tagName: 'a',
    selectable: false,
    hoverable: false,
    editable: false,
    draggable: false,
    droppable: false,
    layerable: false,
    attributes: {
      class: `wb-cms-product-featured__action ${modifier}`,
      href: normalizeSiteHref(href) || '#',
      'data-wb-featured-slot': slot,
    },
    content: text,
  }
}

function buildProductCardComponents(product = DEFAULT_PRODUCT) {
  return [
    {
      tagName: 'a',
      selectable: false,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      attributes: {
        class: 'wb-cms-product-featured__card-link',
        href: product.url,
        'data-wb-featured-card-slot': 'link',
      },
      components: [
        {
          tagName: 'div',
          selectable: false,
          hoverable: false,
          editable: false,
          draggable: false,
          droppable: false,
          layerable: false,
          attributes: {
            class: 'wb-cms-product-featured__media',
          },
          components: [
            {
              tagName: 'img',
              selectable: false,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              layerable: false,
              attributes: {
                class: 'wb-cms-product-featured__image',
                src: product.image,
                alt: product.name,
                'data-wb-featured-card-slot': 'image',
              },
            },
          ],
        },
        {
          tagName: 'h3',
          selectable: false,
          hoverable: false,
          editable: false,
          draggable: false,
          droppable: false,
          layerable: false,
          attributes: {
            class: 'wb-cms-product-featured__name',
            'data-wb-featured-card-slot': 'name',
          },
          content: product.name,
        },
      ],
    },
  ]
}

function buildFeaturedComponents(props: {
  title: string
  primaryButtonText: string
  primaryButtonHref: string
  secondaryButtonText: string
  secondaryButtonHref: string
}) {
  return [
    {
      tagName: 'div',
      selectable: true,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      attributes: {
        class: 'wb-cms-product-featured__container',
      },
      components: [
        {
          tagName: 'div',
          selectable: true,
          hoverable: false,
          editable: false,
          draggable: false,
          droppable: false,
          layerable: false,
          attributes: {
            class: 'wb-cms-product-featured__header',
          },
          components: [
            {
              tagName: 'h2',
              selectable: false,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              layerable: false,
              attributes: {
                class: 'wb-cms-product-featured__title',
                'data-wb-featured-slot': 'title',
              },
              content: props.title,
            },
            {
              tagName: 'div',
              selectable: false,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              layerable: false,
              attributes: {
                class: 'wb-cms-product-featured__actions',
              },
              components: [
                buildActionDef(
                  props.primaryButtonText,
                  'wb-cms-product-featured__action--primary',
                  props.primaryButtonHref,
                  'primary-action',
                ),
                buildActionDef(
                  props.secondaryButtonText,
                  'wb-cms-product-featured__action--secondary',
                  props.secondaryButtonHref,
                  'secondary-action',
                ),
              ],
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
          layerable: false,
          attributes: {
            class: 'wb-cms-product-featured__carousel',
          },
          components: [
            {
              tagName: 'button',
              selectable: false,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              layerable: false,
              attributes: {
                class: 'wb-cms-product-featured__nav wb-cms-product-featured__nav--prev',
                type: 'button',
                'aria-label': 'Previous products',
              },
              components: '<i class="wb-cms-product-featured__nav-icon">‹</i>',
            },
            {
              tagName: 'div',
              selectable: true,
              hoverable: false,
              editable: false,
              draggable: false,
              droppable: false,
              layerable: false,
              attributes: {
                class: 'wb-cms-product-featured__viewport',
                'data-wb-featured-viewport': 'true',
              },
              components: [
                {
                  tagName: 'div',
                  selectable: true,
                  hoverable: false,
                  editable: false,
                  draggable: false,
                  droppable: `[data-wb-component="cms-featured-product-card"]`,
                  layerable: false,
                  attributes: {
                    class: 'wb-cms-product-featured__track',
                    'data-wb-featured-track': 'true',
                  },
                  components: [{ type: WB_CMS_PRODUCT_FEATURED_CARD_TYPE }],
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
              layerable: false,
              attributes: {
                class: 'wb-cms-product-featured__nav wb-cms-product-featured__nav--next',
                type: 'button',
                'aria-label': 'Next products',
              },
              components: '<i class="wb-cms-product-featured__nav-icon">›</i>',
            },
          ],
        },
      ],
    },
  ]
}

function makeFeaturedCarouselScript() {
  return function (this: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this

    if (root._wbFeaturedScrollCleanup) {
      try {
        root._wbFeaturedScrollCleanup()
      } catch (_) {
        // noop
      }
    }

    const viewport = root.querySelector('.wb-cms-product-featured__viewport') as HTMLElement | null
    const track = root.querySelector('.wb-cms-product-featured__track') as HTMLElement | null
    const prevBtn = root.querySelector('.wb-cms-product-featured__nav--prev') as HTMLButtonElement | null
    const nextBtn = root.querySelector('.wb-cms-product-featured__nav--next') as HTMLButtonElement | null
    if (!viewport || !track || !prevBtn || !nextBtn) return

    const getStep = function () {
      const firstCard = track.querySelector('.wb-cms-product-featured__slide') as HTMLElement | null
      if (!firstCard) return Math.max(viewport.clientWidth * 0.8, 240)

      const styles = window.getComputedStyle(track)
      const gap = parseFloat(styles.gap || styles.columnGap || '0') || 0
      return firstCard.getBoundingClientRect().width + gap
    }

    const updateNavState = function () {
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
      const canScroll = maxScroll > 4

      prevBtn.style.display = canScroll ? '' : 'none'
      nextBtn.style.display = canScroll ? '' : 'none'

      prevBtn.disabled = !canScroll || viewport.scrollLeft <= 4
      nextBtn.disabled = !canScroll || viewport.scrollLeft >= maxScroll - 4
    }

    const scrollByStep = function (direction: number) {
      viewport.scrollBy({
        left: getStep() * direction,
        behavior: 'smooth',
      })
    }

    const handlePrev = function () { scrollByStep(-1) }
    const handleNext = function () { scrollByStep(1) }
    const handleResize = function () { updateNavState() }
    const handleScroll = function () { updateNavState() }
    const handleRefresh = function () { updateNavState() }

    prevBtn.addEventListener('click', handlePrev)
    nextBtn.addEventListener('click', handleNext)
    viewport.addEventListener('scroll', handleScroll, { passive: true })
    root.addEventListener('wb:featured-products:refresh', handleRefresh)
    window.addEventListener('resize', handleResize)
    window.requestAnimationFrame(updateNavState)

    root._wbFeaturedRefresh = updateNavState
    root._wbFeaturedScrollCleanup = function () {
      prevBtn.removeEventListener('click', handlePrev)
      nextBtn.removeEventListener('click', handleNext)
      viewport.removeEventListener('scroll', handleScroll)
      root.removeEventListener('wb:featured-products:refresh', handleRefresh)
      window.removeEventListener('resize', handleResize)
    }
  }
}

function resolveFeaturedTarget(editor: any, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_CMS_PRODUCT_FEATURED_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_CMS_PRODUCT_FEATURED_TYPE) as any
  if (fromSelected?.get?.('type') === WB_CMS_PRODUCT_FEATURED_TYPE) return fromSelected

  const tmTarget = editor.TraitManager?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_CMS_PRODUCT_FEATURED_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_CMS_PRODUCT_FEATURED_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_CMS_PRODUCT_FEATURED_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_CMS_PRODUCT_FEATURED_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_CMS_PRODUCT_FEATURED_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_CMS_PRODUCT_FEATURED_TYPE) return fromTraitTarget

  return null
}

function createAddProductCardTrait() {
  return {
    type: 'button' as any,
    name: 'add-product-card',
    label: false as const,
    text: '+ 添加产品卡片',
    full: true,
    command(this: any, editor: any) {
      const featured = resolveFeaturedTarget(editor, this)
      const created = featured?.addProductCard?.()
      const target = Array.isArray(created) ? created[0] : created
      if (target) {
        editor.select?.(target)
      }
    },
  }
}

async function syncProductCardData(model: any): Promise<void> {
  const productId = String(model.get('productId') || '').trim()
  const product = productId ? await getSpu(Number(productId)).catch(() => null) : null
  const data = product
    ? {
        name: String(product?.name || DEFAULT_PRODUCT.name),
        image: String(product?.picUrl || product?.sliderPicUrls?.[0] || DEFAULT_PRODUCT.image),
        url: buildStaticProductUrl(product),
      }
    : DEFAULT_PRODUCT

  const link = findComponentByAttr(model, 'data-wb-featured-card-slot', 'link')
  const image = findComponentByAttr(model, 'data-wb-featured-card-slot', 'image')
  const name = findComponentByAttr(model, 'data-wb-featured-card-slot', 'name')

  setComponentHref(link, data.url)
  setComponentImage(image, data.image, data.name)
  setComponentText(name, data.name)
}

export function registerCmsProductFeatured(editor: GrapesEditor) {
  const domComponents = editor?.DomComponents
  if (!domComponents) return

  if (!domComponents.getType(WB_CMS_PRODUCT_FEATURED_CARD_TYPE)) {
    domComponents.addType(WB_CMS_PRODUCT_FEATURED_CARD_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-featured-product-card'
          ? { type: WB_CMS_PRODUCT_FEATURED_CARD_TYPE }
          : false,

      model: {
        defaults: {
          name: '产品卡片',
          tagName: 'article',
          draggable: '[data-wb-featured-track="true"]',
          droppable: false,
          selectable: true,
          editable: false,
          stylable: true,
          attributes: {
            'data-wb-component': 'cms-featured-product-card',
            'data-product-id': '',
            class: 'wb-cms-product-featured__slide',
          },
          productId: '',
          traits: [
            {
              type: 'select',
              label: '选择产品',
              name: 'productId',
              changeProp: true,
              options: [{ value: '', label: '未选择产品（显示占位）' }],
            },
          ],
          components: buildProductCardComponents(),
        },

        async init(this: any) {
          this.on('change:productId', this._syncProductAttrs)
          this.on('change:productId', this._loadProductData)
          this._syncProductAttrs()
          await initPreviewProductTrait(this, {
            traitName: 'productId',
            emptyLabel: '未选择产品（显示占位）',
          })
          await this._loadProductData()
        },

        _syncProductAttrs(this: any) {
          this.addAttributes({
            'data-product-id': String(this.get('productId') || ''),
          })
        },

        async _loadProductData(this: any) {
          await syncProductCardData(this)
          const featured = this.closestType?.(WB_CMS_PRODUCT_FEATURED_TYPE)
          const featuredEl = featured?.getView?.()?.el as HTMLElement | undefined
          featuredEl?.dispatchEvent?.(new CustomEvent('wb:featured-products:refresh'))
        },
      },
    })
  }

  if (domComponents.getType(WB_CMS_PRODUCT_FEATURED_TYPE)) return

  domComponents.addType(WB_CMS_PRODUCT_FEATURED_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'cms-product-featured'
        ? { type: WB_CMS_PRODUCT_FEATURED_TYPE }
        : false,

    model: {
      defaults: {
        name: '产品精选轮播',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'cms-product-featured',
          class: 'wb-cms-product-featured',
        },
        styles: FEATURED_PRODUCT_CSS,
        script: makeFeaturedCarouselScript(),
        'script-export': makeFeaturedCarouselScript(),
        sectionTitle: 'Our Featured Products',
        primaryButtonText: 'Inquiry Now',
        primaryButtonHref: '#inquiry',
        secondaryButtonText: 'View All',
        secondaryButtonHref: '/products.html',
        traits: [
          {
            type: 'text',
            label: '标题',
            name: 'sectionTitle',
            changeProp: true,
            placeholder: 'Our Featured Products',
          },
          {
            type: 'text',
            label: '主要按钮文字',
            name: 'primaryButtonText',
            changeProp: true,
            placeholder: 'Inquiry Now',
          },
          {
            type: 'text',
            label: '主要按钮链接',
            name: 'primaryButtonHref',
            changeProp: true,
            placeholder: '#inquiry',
          },
          {
            type: 'text',
            label: '次要按钮文字',
            name: 'secondaryButtonText',
            changeProp: true,
            placeholder: 'View All',
          },
          {
            type: 'text',
            label: '次要按钮链接',
            name: 'secondaryButtonHref',
            changeProp: true,
            placeholder: '/products.html',
          },
          createAddProductCardTrait(),
        ],
        components: buildFeaturedComponents({
          title: 'Our Featured Products',
          primaryButtonText: 'Inquiry Now',
          primaryButtonHref: '#inquiry',
          secondaryButtonText: 'View All',
          secondaryButtonHref: '/products.html',
        }),
      },

      init(this: any) {
        this._migrateLegacyFeatured()
        this.on(
          'change:sectionTitle change:primaryButtonText change:primaryButtonHref change:secondaryButtonText change:secondaryButtonHref',
          this._syncContent,
        )
        this._syncContent()
      },

      _migrateLegacyFeatured(this: any) {
        const attrs = { ...(this.getAttributes?.() || {}) }
        const nextAttrs = { ...attrs }

        delete nextAttrs['data-cms-component']
        delete nextAttrs['data-category-id']
        delete nextAttrs['data-limit']

        if (!this.get('primaryButtonHref') && this.get('inquiryHref')) {
          this.set('primaryButtonHref', this.get('inquiryHref'))
        }
        if (!this.get('secondaryButtonHref') && this.get('viewAllHref')) {
          this.set('secondaryButtonHref', this.get('viewAllHref'))
        }
        if (!this.get('primaryButtonHref') && attrs['data-inquiry-href']) {
          this.set('primaryButtonHref', attrs['data-inquiry-href'])
        }
        if (!this.get('secondaryButtonHref') && attrs['data-view-all-href']) {
          this.set('secondaryButtonHref', attrs['data-view-all-href'])
        }

        this.addAttributes(nextAttrs)

        const track = findComponentByAttr(this, 'data-wb-featured-track', 'true')
        if (!track) {
          this.components().reset(
            buildFeaturedComponents({
              title: String(this.get('sectionTitle') || 'Our Featured Products'),
              primaryButtonText: String(this.get('primaryButtonText') || 'Inquiry Now'),
              primaryButtonHref: String(this.get('primaryButtonHref') || '#inquiry'),
              secondaryButtonText: String(this.get('secondaryButtonText') || 'View All'),
              secondaryButtonHref: String(this.get('secondaryButtonHref') || '/products.html'),
            }),
          )
        }
      },

      _getTrack(this: any) {
        return findComponentByAttr(this, 'data-wb-featured-track', 'true')
      },

      addProductCard(this: any) {
        const track = this._getTrack?.()
        const cards = track?.components?.()
        if (!cards) return null
        return cards.add({ type: WB_CMS_PRODUCT_FEATURED_CARD_TYPE })
      },

      _syncContent(this: any) {
        const title = findComponentByAttr(this, 'data-wb-featured-slot', 'title')
        const primaryAction = findComponentByAttr(this, 'data-wb-featured-slot', 'primary-action')
        const secondaryAction = findComponentByAttr(this, 'data-wb-featured-slot', 'secondary-action')

        setComponentText(title, String(this.get('sectionTitle') || 'Our Featured Products'))
        setComponentText(primaryAction, String(this.get('primaryButtonText') || 'Inquiry Now'))
        setComponentHref(primaryAction, String(this.get('primaryButtonHref') || '#inquiry'))
        setComponentText(secondaryAction, String(this.get('secondaryButtonText') || 'View All'))
        setComponentHref(secondaryAction, String(this.get('secondaryButtonHref') || '/products.html'))

        const viewEl = this.getView?.()?.el as HTMLElement | undefined
        viewEl?.dispatchEvent?.(new CustomEvent('wb:featured-products:refresh'))
      },
    },
  })
}
