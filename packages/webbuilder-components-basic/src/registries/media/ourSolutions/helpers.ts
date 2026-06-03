import type { Editor } from 'grapesjs'

export const WB_OUR_SOLUTIONS_TYPE = 'wb-our-solutions'
export const WB_OUR_SOLUTIONS_ITEM_TYPE = 'wb-our-solutions-item'

type SolutionItem = {
  title: string
  image: string
  href?: string
  linkText?: string
}

const DEFAULT_ITEMS: SolutionItem[] = [
  {
    title: 'Public & Commercial Buildings',
    image: 'https://placehold.co/800x528/1a1a1a/1a1a1a',
    href: '#',
    linkText: 'Details',
  },
  {
    title: 'High-end Residences & Real Estate',
    image: 'https://placehold.co/800x528/2a2a2a/2a2a2a',
    href: '#',
    linkText: 'Details',
  },
  {
    title: 'Hospitality & Hotels',
    image: 'https://placehold.co/800x528/3a3a3a/3a3a3a',
    href: '#',
    linkText: 'Details',
  },
  {
    title: 'Healthcare Facilities',
    image: 'https://placehold.co/800x528/4a4a4a/4a4a4a',
    href: '#',
    linkText: 'Details',
  },
]

const NAV_ICON_PREV = `
  <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M302.057301 482.961858L671.812062 1012.234875l45.172662-31.547412L370.587534 484.871596 716.06658 44.529961 672.730206 10.577013 302.057301 482.943495z" fill="currentColor"/>
  </svg>
`

const NAV_ICON_NEXT = `
  <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M721.942699 482.961858L352.187938 1012.234875 307.015276 980.687463l346.39719-495.815867L307.93342 44.529961 351.269794 10.577013 721.942699 482.943495z" fill="currentColor"/>
  </svg>
`

export function getOurSolutionsSlideTraits() {
  return [
    ({ type: 'image-picker', label: '图片', name: 'osImageSrc', changeProp: true, ui: { showPreview: true } } as any),
    { type: 'text', label: '标题', name: 'osTitle', changeProp: true },
    { type: 'text', label: '按钮文案', name: 'osLinkText', changeProp: true },
    { type: 'page-link', label: '链接', name: 'osHref', placeholder: '#', changeProp: true },
  ]
}

export function findChildByClass(model: any, className: string | string[]) {
  const children = model?.components?.()?.models ?? []
  const classNames = Array.isArray(className) ? className : [className]
  return children.find((child: any) => {
    const attrClass = `${child?.getAttributes?.()?.class ?? ''}`.trim()
    const attrClasses = attrClass ? attrClass.split(/\s+/).filter(Boolean) : []
    const selectorClasses = Array.isArray(child?.getClasses?.())
      ? child.getClasses().map((entry: any) => entry?.id ?? entry?.get?.('name') ?? entry?.attributes?.name ?? entry).filter(Boolean)
      : []
    const mergedClasses = new Set<string>([...attrClasses, ...selectorClasses].map(v => `${v}`.trim()).filter(Boolean))
    return classNames.some(name => mergedClasses.has(name))
  }) ?? null
}

export function buildSolutionSlideContent(item: SolutionItem) {
  return [
    {
      tagName: 'img',
      type: 'image',
      selectable: true,
      layerable: false,
      droppable: false,
      attributes: {
        class: 'wb-our-solutions__slide-img',
        src: item.image,
        alt: item.title,
      },
    },
    {
      tagName: 'div',
      selectable: true,
      layerable: false,
      droppable: true,
      attributes: { class: 'wb-our-solutions__slide-overlay' },
      components: [
        {
          tagName: 'h3',
          type: 'text',
          selectable: true,
          layerable: false,
          droppable: true,
          attributes: { class: 'wb-our-solutions__slide-title' },
          components: item.title,
        },
        {
          tagName: 'a',
          selectable: true,
          layerable: false,
          droppable: true,
          attributes: {
            class: 'wb-our-solutions__slide-link',
            href: item.href ?? '#',
          },
          components: item.linkText ?? 'Details',
        },
      ],
    },
  ]
}

export function buildSolutionSlideDef(item: SolutionItem) {
  return {
    type: WB_OUR_SOLUTIONS_ITEM_TYPE,
    tagName: 'div',
    selectable: true,
    layerable: true,
    droppable: false,
    osTitle: item.title,
    osImageSrc: item.image,
    osHref: item.href ?? '#',
    osLinkText: item.linkText ?? 'Details',
    attributes: {
      class: 'swiper-slide wb-our-solutions__slide',
      'data-title': item.title,
      'data-link-href': item.href ?? '#',
      'data-link-text': item.linkText ?? 'Details',
    },
    components: buildSolutionSlideContent(item),
  }
}

export function buildOurSolutionsTree() {
  return [
    {
      tagName: 'div',
      selectable: true,
      layerable: false,
      droppable: false,
      attributes: { class: 'wb-our-solutions__container' },
      components: [
        {
          tagName: 'h2',
          type: 'text',
          selectable: true,
          layerable: false,
          droppable: true,
          attributes: { class: 'wb-our-solutions__title' },
          components: 'Our Solutions',
        },
        {
          tagName: 'div',
          selectable: true,
          layerable: false,
          droppable: true,
          attributes: { class: 'wb-our-solutions__actions' },
          components: [
            {
              tagName: 'a',
              selectable: true,
              layerable: false,
              droppable: true,
              attributes: { class: 'wb-our-solutions__btn wb-our-solutions__btn--primary', href: '#' },
              components: 'Inquiry Now',
            },
            {
              tagName: 'a',
              selectable: true,
              layerable: false,
              droppable: true,
              attributes: { class: 'wb-our-solutions__btn wb-our-solutions__btn--outline', href: '#' },
              components: 'View All',
            },
          ],
        },
        {
          tagName: 'div',
          selectable: true,
          layerable: false,
          droppable: true,
          attributes: { class: 'wb-our-solutions__carousel-wrap' },
          components: [
            {
              tagName: 'div',
              selectable: true,
              layerable: false,
              droppable: true,
              attributes: { class: 'swiper wb-our-solutions__swiper' },
              components: [
                {
                  tagName: 'div',
                  selectable: true,
                  layerable: false,
                  droppable: true,
                  attributes: { class: 'swiper-wrapper' },
                  components: DEFAULT_ITEMS.map(buildSolutionSlideDef),
                },
              ],
            },
            {
              tagName: 'div',
              selectable: false,
              layerable: false,
              droppable: false,
              attributes: { class: 'wb-our-solutions__nav-prev' },
              components: [{
                tagName: 'span',
                selectable: false,
                layerable: false,
                droppable: false,
                attributes: { class: 'wb-our-solutions__nav-icon' },
                components: NAV_ICON_PREV,
              }],
            },
            {
              tagName: 'div',
              selectable: false,
              layerable: false,
              droppable: false,
              attributes: { class: 'wb-our-solutions__nav-next' },
              components: [{
                tagName: 'span',
                selectable: false,
                layerable: false,
                droppable: false,
                attributes: { class: 'wb-our-solutions__nav-icon' },
                components: NAV_ICON_NEXT,
              }],
            },
            {
              tagName: 'div',
              selectable: false,
              layerable: false,
              droppable: false,
              attributes: { class: 'swiper-pagination wb-our-solutions__pagination' },
            },
          ],
        },
      ],
    },
  ]
}

export function resolveRoot(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_OUR_SOLUTIONS_TYPE) return selected
  const fromSelected = selected?.closestType?.(WB_OUR_SOLUTIONS_TYPE) as any
  if (fromSelected?.get?.('type') === WB_OUR_SOLUTIONS_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_OUR_SOLUTIONS_TYPE) return tmTarget
  const fromTmTarget = tmTarget?.closestType?.(WB_OUR_SOLUTIONS_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_OUR_SOLUTIONS_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_OUR_SOLUTIONS_TYPE) return traitTarget
  return traitTarget?.closestType?.(WB_OUR_SOLUTIONS_TYPE) ?? null
}

export function writeText(component: any, value: string) {
  const collection = component?.components?.()
  const first = collection?.at?.(0)
  if (!first) return
  if (first.get?.('type') === 'textnode') first.set?.('content', value)
  else first.components?.(value)
}

export function getSlides(root: any): any[] {
  const container = root?.components?.()?.at?.(0)
  const carouselWrap = container?.components?.()?.at?.(2)
  const swiper = findChildByClass(carouselWrap, 'wb-our-solutions__swiper')
  const wrapper = findChildByClass(swiper, 'swiper-wrapper')
  return wrapper?.components?.()?.models ?? []
}

export function syncRootContent(model: any) {
  const container = model?.components?.()?.at?.(0)
  const titleEl = container?.components?.()?.at?.(0)
  const actions = container?.components?.()?.at?.(1)
  const primary = actions?.components?.()?.at?.(0)
  const secondary = actions?.components?.()?.at?.(1)

  writeText(titleEl, `${model.get?.('solTitle') ?? 'Our Solutions'}`)
  writeText(primary, `${model.get?.('solPrimaryText') ?? 'Inquiry Now'}`)
  writeText(secondary, `${model.get?.('solSecondaryText') ?? 'View All'}`)
  primary?.addAttributes?.({ href: `${model.get?.('solPrimaryHref') ?? '#'}` || '#' })
  secondary?.addAttributes?.({ href: `${model.get?.('solSecondaryHref') ?? '#'}` || '#' })
}

export function syncSolutionItem(model: any) {
  const title = `${model.get?.('osTitle') ?? model.getAttributes?.()?.['data-title'] ?? ''}`.trim() || 'Solution'
  const href = `${model.get?.('osHref') ?? model.getAttributes?.()?.['data-link-href'] ?? '#'}`.trim() || '#'
  const linkText = `${model.get?.('osLinkText') ?? model.getAttributes?.()?.['data-link-text'] ?? 'Details'}`.trim() || 'Details'
  const imageSrc = `${model.get?.('osImageSrc') ?? ''}`.trim() || 'https://placehold.co/800x528/5b6470/5b6470'
  const itemName = `轮播项 · ${title}`

  if (model.get?.('name') !== itemName) {
    model.set?.('name', itemName)
  }

  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: model.getAttributes?.()?.class || 'swiper-slide wb-our-solutions__slide',
    'data-title': title,
    'data-link-href': href,
    'data-link-text': linkText,
  })
  model.components?.(buildSolutionSlideContent({
    title,
    image: imageSrc,
    href,
    linkText,
  }))
}

export function addSolutionItem(root: any) {
  const slides = getSlides(root)
  const title = `Solution ${slides.length + 1}`
  const wrapper = slides[0]?.parent?.()
  const created = wrapper?.add?.(buildSolutionSlideDef({
    title,
    image: 'https://placehold.co/800x528/5b6470/5b6470',
    href: '#',
    linkText: 'Details',
  }))
  const target = Array.isArray(created) ? created[0] : created
  if (target) syncSolutionItem(target)
}

export function removeSolutionItem(root: any, index: number) {
  getSlides(root)?.[index]?.remove?.()
}

export function getOurSolutionsSlideRoot(component: any) {
  if (!component) return null
  if (component.get?.('type') === WB_OUR_SOLUTIONS_ITEM_TYPE) return component
  const slide = component.closestType?.(WB_OUR_SOLUTIONS_ITEM_TYPE)
  if (slide?.get?.('type') === WB_OUR_SOLUTIONS_ITEM_TYPE) return slide
  return null
}
