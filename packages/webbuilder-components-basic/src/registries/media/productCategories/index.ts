import type { Editor } from 'grapesjs'
import {
  makeImagePickerTrait,
  makeLinkTrait,
  makeTextTrait,
  makeTextareaTrait,
} from '../../../traitFactory.js'

export const WB_PRODUCT_CATEGORIES_TYPE = 'wb-product-categories'
export const WB_PRODUCT_CATEGORY_ITEM_TYPE = 'wb-product-category-item'

const SUPPLY_ARROW = `
  <svg class="wb-product-categories__arrow-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
    <path d="m359.873 121.377l-22.627 22.627l95.997 95.997H16v32.001h417.24l-95.994 95.994l22.627 22.627L494.498 256z"/>
  </svg>
`

const DEFAULT_ITEMS = [
  {
    label: 'Shower Doors',
    desc: 'A core functional element in the bathroom space.',
    image: 'https://placehold.co/960x900/404040/404040',
  },
  {
    label: 'Bathtub Doors',
    desc: 'Elegant enclosure solutions for every bathtub.',
    image: 'https://placehold.co/960x900/4b4b4b/4b4b4b',
  },
  {
    label: 'Bathroom Mirrors',
    desc: 'Reflective focal points designed for modern interiors.',
    image: 'https://placehold.co/960x900/565656/565656',
  },
  {
    label: 'Medicine Cabinets',
    desc: 'Smart storage for your daily essentials.',
    image: 'https://placehold.co/960x900/626262/626262',
  },
  {
    label: 'Ceiling Fan',
    desc: 'Modern ventilation with refined design.',
    image: 'https://placehold.co/960x900/707070/707070',
  },
  {
    label: 'Chandelier',
    desc: 'Statement lighting for sophisticated spaces.',
    image: 'https://placehold.co/960x900/7b7b7b/7b7b7b',
  },
]

const DEFAULT_SUBTITLE = 'What We Supply'
const DEFAULT_VIEW_ALL_TEXT = 'View All'
const DEFAULT_VIEW_ALL_HREF = '#'

const PRODUCT_CATEGORIES_CSS = `
  .wb-product-categories {
    background: #f4f5f6;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }
  .wb-product-categories__container {
    display: grid;
    grid-template-columns: 1fr 50%;
    min-height: 100vh;
  }
  .wb-product-categories__sidebar {
    display: flex;
    flex-direction: column;
    padding: 80px 20px;
    max-width: calc(1352px / 2);
    width: 100%;
    margin-left: auto;
    box-sizing: border-box;
  }
  .wb-product-categories__label {
    margin: 0 0 120px;
    font-size: 16px;
    line-height: 1.4;
    font-weight: 400;
    color: #003152;
    text-transform: uppercase;
  }
  .wb-product-categories__tabs {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }
  .wb-product-categories__tab {
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    text-align: left;
    font: inherit;
    font-size: 32px;
    line-height: 1.4;
    font-weight: 400;
    color: #959ea4;
    cursor: pointer;
    transition: color 0.3s ease, font-weight 0.3s ease;
  }
  .wb-product-categories__tab.is-active {
    color: #000a11;
    font-weight: 500;
  }
  .wb-product-categories__link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    color: #003152;
    font-size: 16px;
    text-decoration: none;
    border-bottom: 1px solid currentColor;
    width: fit-content;
    transition: gap 0.3s ease;
  }
  .wb-product-categories__link:hover {
    gap: 14px;
  }
  .wb-product-categories__link-arrow,
  .wb-product-categories__slide-link-arrow {
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .wb-product-categories__arrow-svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .wb-product-categories__carousel-wrap {
    position: relative;
    overflow: hidden;
  }
  .wb-product-categories__carousel {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 100%;
    height: 100%;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    scrollbar-width: none;
  }
  .wb-product-categories__carousel::-webkit-scrollbar {
    display: none;
  }
  .wb-product-categories__slide {
    position: relative;
    min-height: 100vh;
    scroll-snap-align: start;
  }
  .wb-product-categories__slide-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .wb-product-categories__slide-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 48px 40px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 100%);
  }
  .wb-product-categories__slide-title {
    margin: 0 0 12px;
    font-size: 40px;
    line-height: 1.2;
    font-weight: 600;
    color: #ffffff;
  }
  .wb-product-categories__slide-desc {
    margin: 0 0 20px;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.8);
  }
  .wb-product-categories__slide-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #ffffff;
    font-size: 16px;
    text-decoration: none;
    transition: gap 0.3s ease;
  }
  .wb-product-categories__slide-link:hover {
    gap: 14px;
  }
  @media (max-width: 767px) {
    .wb-product-categories {
      min-height: auto;
    }
    .wb-product-categories__container {
      grid-template-columns: 1fr;
      min-height: auto;
      aspect-ratio: 750 / 1200;
      position: relative;
    }
    .wb-product-categories__sidebar {
      position: absolute;
      inset: 0 0 auto 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 16px;
      z-index: 10;
      padding: 24px 20px;
      margin-left: 0;
      max-width: none;
      color: #ffffff;
    }
    .wb-product-categories__label {
      margin: 0;
      color: #ffffff;
      font-size: 13px;
      text-transform: capitalize;
      white-space: nowrap;
    }
    .wb-product-categories__tabs {
      display: none;
    }
    .wb-product-categories__link {
      margin-left: auto;
      margin-top: 0;
      color: #ffffff;
      border-bottom: none;
      font-size: 13px;
    }
    .wb-product-categories__link-arrow,
    .wb-product-categories__slide-link-arrow {
      width: 16px;
      height: 16px;
    }
    .wb-product-categories__slide {
      min-height: 100%;
    }
    .wb-product-categories__slide-overlay {
      padding: 64px 20px;
    }
    .wb-product-categories__slide-title {
      font-size: 24px;
    }
    .wb-product-categories__slide-desc {
      font-size: 13px;
    }
  }
`

function buildTabDef(label: string, index: number) {
  return {
    tagName: 'button',
    selectable: false,
    layerable: false,
    droppable: false,
    draggable: false,
    copyable: false,
    removable: false,
    attributes: {
      class: `wb-product-categories__tab${index === 0 ? ' is-active' : ''}`,
      type: 'button',
    },
    components: label,
  }
}

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

function buildSlideContent(item: { label: string; desc: string; image: string; href?: string }) {
  return [
    {
      tagName: 'img',
      ...nonLayered({
        attributes: {
          class: 'wb-product-categories__slide-img',
          src: item.image,
          alt: item.label,
        },
      }),
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'wb-product-categories__slide-overlay' },
      }),
      components: [
        {
          tagName: 'h3',
          ...nonLayered({
            attributes: { class: 'wb-product-categories__slide-title' },
          }),
          content: item.label,
        },
        {
          tagName: 'p',
          ...nonLayered({
            attributes: { class: 'wb-product-categories__slide-desc' },
          }),
          content: item.desc,
        },
        {
          tagName: 'a',
          ...nonLayered({
            attributes: {
              class: 'wb-product-categories__slide-link',
              href: item.href ?? '#',
            },
          }),
          components: [
            { type: 'textnode', content: 'View Products' },
            {
              tagName: 'span',
              ...nonLayered({
                attributes: { class: 'wb-product-categories__slide-link-arrow' },
              }),
              components: SUPPLY_ARROW,
            },
          ],
        },
      ],
    },
  ]
}

function buildSlideDef(item: { label: string; desc: string; image: string; href?: string }) {
  return {
    type: WB_PRODUCT_CATEGORY_ITEM_TYPE,
    tagName: 'div',
    name: `分类项 · ${item.label}`,
    selectable: true,
    layerable: true,
    droppable: false,
    draggable: '.wb-product-categories__carousel',
    copyable: true,
    removable: true,
    attributes: {
      class: 'wb-product-categories__slide',
      'data-wb-component': 'product-category-item',
    },
    pcTitle: item.label,
    pcDesc: item.desc,
    pcHref: item.href ?? '#',
    pcImageSrc: item.image,
    components: buildSlideContent(item),
  }
}

function buildProductCategoriesTree() {
  return [
    {
      tagName: 'div',
      selectable: true,
      layerable: false,
      droppable: false,
      attributes: { class: 'wb-product-categories__container' },
      components: [
        {
          tagName: 'div',
          ...nonLayered({
            selectable: true,
            droppable: false,
          }),
          attributes: { class: 'wb-product-categories__sidebar' },
          components: [
            {
              tagName: 'h2',
              ...nonLayered({
                attributes: { class: 'wb-product-categories__label' },
              }),
              content: DEFAULT_SUBTITLE,
            },
            {
              tagName: 'div',
              ...nonLayered({
                attributes: { class: 'wb-product-categories__tabs' },
              }),
              components: DEFAULT_ITEMS.map((item, index) => buildTabDef(item.label, index)),
            },
            {
              tagName: 'a',
              ...nonLayered({
                attributes: {
                  class: 'wb-product-categories__link',
                  href: DEFAULT_VIEW_ALL_HREF,
                },
              }),
              components: [
                { type: 'textnode', content: DEFAULT_VIEW_ALL_TEXT },
                {
                  tagName: 'span',
                  ...nonLayered({
                    attributes: { class: 'wb-product-categories__link-arrow' },
                  }),
                  components: SUPPLY_ARROW,
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          ...nonLayered({
            selectable: true,
            droppable: '.wb-product-categories__slide',
            attributes: { class: 'wb-product-categories__carousel-wrap' },
          }),
          components: [
            {
              tagName: 'div',
              ...nonLayered({
                selectable: true,
                droppable: '.wb-product-categories__slide',
                attributes: { class: 'wb-product-categories__carousel' },
              }),
              components: DEFAULT_ITEMS.map(buildSlideDef),
            },
          ],
        },
      ],
    },
  ]
}

function resolveRoot(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_PRODUCT_CATEGORIES_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_PRODUCT_CATEGORIES_TYPE) as any
  if (fromSelected?.get?.('type') === WB_PRODUCT_CATEGORIES_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_PRODUCT_CATEGORIES_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_PRODUCT_CATEGORIES_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_PRODUCT_CATEGORIES_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_PRODUCT_CATEGORIES_TYPE) return traitTarget

  return traitTarget?.closestType?.(WB_PRODUCT_CATEGORIES_TYPE) ?? null
}

function findChildByClass(model: any, className: string) {
  const children = model?.components?.()?.models ?? []
  return children.find((child: any) => {
    const classes = child?.getClasses?.() ?? []
    return Array.isArray(classes) && classes.includes(className)
  }) ?? null
}

function getTabsAndSlides(root: any) {
  const container = root?.components?.()?.at?.(0)
  const sidebar = container?.components?.()?.at?.(0)
  const carouselWrap = container?.components?.()?.at?.(1)
  const tabs = findChildByClass(sidebar, 'wb-product-categories__tabs')
  const carousel = findChildByClass(carouselWrap, 'wb-product-categories__carousel')
  return {
    tabs,
    carousel,
  }
}

function findDescendantByClass(model: any, className: string): any {
  const children = model?.components?.()?.models ?? []
  for (const child of children) {
    const classes = child?.getClasses?.() ?? []
    if (Array.isArray(classes) && classes.includes(className)) return child
    const found = findDescendantByClass(child, className)
    if (found) return found
  }
  return null
}

function writeText(component: any, value: string) {
  if (!component) return
  const collection = component.components?.()
  if (collection?.length) collection.reset([])
  component.set?.('content', value)
}

function writeFirstText(component: any, value: string) {
  const collection = component?.components?.()
  const first = collection?.at?.(0)
  if (!first) return
  if (first.get?.('type') === 'textnode') {
    first.set?.('content', value)
    return
  }
  first.components?.(value)
}

function syncCategoryItem(model: any) {
  const title = `${model.get?.('pcTitle') ?? ''}`.trim() || 'Category'
  const desc = `${model.get?.('pcDesc') ?? ''}`.trim()
  const href = `${model.get?.('pcHref') ?? '#'}`.trim() || '#'
  const imageSrc = `${model.get?.('pcImageSrc') ?? ''}`.trim() || 'https://placehold.co/960x900/5b6470/5b6470'

  model.set?.('name', `分类项 · ${title}`)
  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'wb-product-categories__slide',
    'data-wb-component': 'product-category-item',
  })

  const image = findDescendantByClass(model, 'wb-product-categories__slide-img')
  image?.addAttributes?.({
    class: 'wb-product-categories__slide-img',
    src: imageSrc,
    alt: title,
  })

  const link = findDescendantByClass(model, 'wb-product-categories__slide-link')
  link?.addAttributes?.({
    ...(link.getAttributes?.() || {}),
    class: 'wb-product-categories__slide-link',
    href,
  })

  writeText(findDescendantByClass(model, 'wb-product-categories__slide-title'), title)
  writeText(findDescendantByClass(model, 'wb-product-categories__slide-desc'), desc)
  syncProductCategoriesRoot(model.closestType?.(WB_PRODUCT_CATEGORIES_TYPE))
}

function syncProductCategoriesRoot(root: any) {
  if (!root?.get) return

  const subtitle = `${root.get('pcSubtitle') ?? ''}`.trim() || DEFAULT_SUBTITLE
  const viewAllText = `${root.get('pcViewAllText') ?? ''}`.trim() || DEFAULT_VIEW_ALL_TEXT
  const viewAllHref = `${root.get('pcViewAllHref') ?? ''}`.trim() || DEFAULT_VIEW_ALL_HREF
  const container = root.components?.()?.at?.(0)
  const sidebar = container?.components?.()?.at?.(0)
  const label = findChildByClass(sidebar, 'wb-product-categories__label')
  const viewAllLink = findChildByClass(sidebar, 'wb-product-categories__link')
  const { tabs, carousel } = getTabsAndSlides(root)
  const items = carousel?.components?.()?.models ?? []

  writeText(label, subtitle)
  viewAllLink?.addAttributes?.({
    ...(viewAllLink.getAttributes?.() || {}),
    class: 'wb-product-categories__link',
    href: viewAllHref,
  })
  writeFirstText(viewAllLink, viewAllText)

  tabs?.components?.()?.reset?.(
    items.map((item: any, index: number) => {
      const title = `${item.get?.('pcTitle') ?? ''}`.trim() || `Category ${index + 1}`
      return buildTabDef(title, index)
    }),
  )
}

function addCategoryItem(root: any, editor?: Editor) {
  const { carousel } = getTabsAndSlides(root)
  const items = carousel?.components?.()
  if (!items) return

  const nextIndex = items.length || 0
  const nextLabel = `Category ${nextIndex + 1}`
  const slide = buildSlideDef({
    label: nextLabel,
    desc: 'Describe this category here.',
    image: 'https://placehold.co/960x900/5b6470/5b6470',
  })

  const createdSlide = items.add?.(slide)
  syncProductCategoriesRoot(root)

  const target = Array.isArray(createdSlide) ? createdSlide[0] : createdSlide
  if (target) {
    syncCategoryItem(target)
    editor?.select?.(target)
  }
}

function createAddCategoryItemTrait() {
  return {
    type: 'button' as any,
    name: 'add-product-category-item',
    label: false as const,
    text: '+ 添加分类项',
    full: true,
    command(this: any, editor: Editor) {
      const root = resolveRoot(editor, this)
      if (!root) return
      addCategoryItem(root, editor)
    },
  }
}

function getRootTraits() {
  return [
    makeTextTrait('小标题', 'pcSubtitle', { placeholder: DEFAULT_SUBTITLE }),
    makeTextTrait('View All 按钮文字', 'pcViewAllText', { placeholder: DEFAULT_VIEW_ALL_TEXT }),
    makeLinkTrait({ label: 'View All 跳转链接', name: 'pcViewAllHref', placeholder: '#' }),
    createAddCategoryItemTrait(),
  ]
}

export function registerProductCategoriesComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_PRODUCT_CATEGORIES_TYPE)) return

  domComponents.addType(WB_PRODUCT_CATEGORY_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'product-category-item' ||
      el?.classList?.contains('wb-product-categories__slide')
        ? { type: WB_PRODUCT_CATEGORY_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '分类项',
        tagName: 'div',
        draggable: '.wb-product-categories__carousel',
        droppable: false,
        selectable: true,
        layerable: true,
        copyable: true,
        removable: true,
        pcTitle: 'Category',
        pcDesc: '',
        pcHref: '#',
        pcImageSrc: '',
        traits: [
          makeImagePickerTrait('图片', 'pcImageSrc', { showPreview: true }),
          makeTextTrait('标题', 'pcTitle', { placeholder: 'Category title' }),
          makeTextareaTrait('描述', 'pcDesc', { placeholder: 'Category description', rows: 4 }),
          makeLinkTrait({ label: '跳转链接', name: 'pcHref', placeholder: '#' }),
        ],
      },
      init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(
            buildSlideContent({
              label: `${this.get?.('pcTitle') ?? ''}`.trim() || 'Category',
              desc: `${this.get?.('pcDesc') ?? ''}`.trim(),
              href: `${this.get?.('pcHref') ?? '#'}`.trim() || '#',
              image: `${this.get?.('pcImageSrc') ?? ''}`.trim() || 'https://placehold.co/960x900/5b6470/5b6470',
            }),
          )
        }
        this.listenTo(this, 'change:pcTitle change:pcDesc change:pcHref change:pcImageSrc', () => syncCategoryItem(this))
        syncCategoryItem(this)
      },
    },
  })

  domComponents.addType(WB_PRODUCT_CATEGORIES_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'product-categories' ||
      el?.classList?.contains('wb-product-categories')
        ? { type: WB_PRODUCT_CATEGORIES_TYPE }
        : false,
    model: {
      defaults: {
        name: '产品分类展示',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        pcSubtitle: DEFAULT_SUBTITLE,
        pcViewAllText: DEFAULT_VIEW_ALL_TEXT,
        pcViewAllHref: DEFAULT_VIEW_ALL_HREF,
        attributes: {
          class: 'wb-product-categories',
          'data-wb-component': 'product-categories',
        },
        styles: PRODUCT_CATEGORIES_CSS,
        traits: getRootTraits(),
        script: function (this: HTMLElement) {
          const root = this as HTMLElement & {
            __wbSupplyInit?: boolean
            __wbSupplyObserver?: IntersectionObserver | null
          }

          if (root.__wbSupplyInit) return
          root.__wbSupplyInit = true

          const carousel = root.querySelector('.wb-product-categories__carousel') as HTMLElement | null
          const tabs = Array.from(root.querySelectorAll('.wb-product-categories__tab')) as HTMLElement[]
          const slides = Array.from(root.querySelectorAll('.wb-product-categories__slide')) as HTMLElement[]
          if (!carousel || !tabs.length || !slides.length) return

          let isScrolling = false

          const getTabs = () => Array.from(root.querySelectorAll('.wb-product-categories__tab')) as HTMLElement[]
          const getSlides = () => Array.from(root.querySelectorAll('.wb-product-categories__slide')) as HTMLElement[]

          const updateActiveTab = (index: number) => {
            getTabs().forEach((tab, tabIndex) => {
              tab.classList.toggle('is-active', tabIndex === index)
            })
          }

          const scrollToSlide = (index: number) => {
            const currentSlides = getSlides()
            if (index < 0 || index >= currentSlides.length) return
            isScrolling = true
            carousel.scrollTo({
              left: currentSlides[index].offsetLeft,
              behavior: 'smooth',
            })
            updateActiveTab(index)
            window.setTimeout(() => {
              isScrolling = false
            }, 650)
          }

          root.addEventListener('mouseenter', (event) => {
            const tab = (event.target as Element | null)?.closest?.('.wb-product-categories__tab') as HTMLElement | null
            if (!tab || !root.contains(tab)) return
            const index = getTabs().indexOf(tab)
            if (index >= 0) scrollToSlide(index)
          }, true)

          root.addEventListener('click', (event) => {
            const tab = (event.target as Element | null)?.closest?.('.wb-product-categories__tab') as HTMLElement | null
            if (!tab || !root.contains(tab)) return
            const index = getTabs().indexOf(tab)
            if (index >= 0) scrollToSlide(index)
          })

          if (typeof window.IntersectionObserver === 'function') {
            root.__wbSupplyObserver?.disconnect?.()
            root.__wbSupplyObserver = new window.IntersectionObserver((entries) => {
              if (isScrolling) return
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const index = getSlides().indexOf(entry.target as HTMLElement)
                  if (index >= 0) updateActiveTab(index)
                }
              })
            }, { root: carousel, threshold: 0.5 })

            getSlides().forEach((slide) => root.__wbSupplyObserver?.observe(slide))
          }

          updateActiveTab(0)
        },
        components: buildProductCategoriesTree(),
      },
      init(this: any) {
        const traits = this.get?.('traits')
        const hasLegacyItemsTrait = traits?.models?.some?.((trait: any) => trait?.get?.('type') === 'product-categories-items')
        if (hasLegacyItemsTrait) {
          this.set?.('traits', getRootTraits())
        }
        this.listenTo(this, 'change:pcSubtitle change:pcViewAllText change:pcViewAllHref', () => syncProductCategoriesRoot(this))
        syncProductCategoriesRoot(this)

        const carousel = getTabsAndSlides(this).carousel
        const items = carousel?.components?.()
        items?.on?.('add remove reset', () => syncProductCategoriesRoot(this))
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_PRODUCT_CATEGORIES_TYPE || type === WB_PRODUCT_CATEGORY_ITEM_TYPE) return

    const item = component?.closestType?.(WB_PRODUCT_CATEGORY_ITEM_TYPE)
    if (item?.get?.('type') === WB_PRODUCT_CATEGORY_ITEM_TYPE) {
      editor.select?.(item)
      return
    }

    const root = component?.closestType?.(WB_PRODUCT_CATEGORIES_TYPE)
    if (root?.get?.('type') === WB_PRODUCT_CATEGORIES_TYPE) {
      editor.select?.(root)
    }
  })
}
