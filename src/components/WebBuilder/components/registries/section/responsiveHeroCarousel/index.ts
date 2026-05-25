import type { Editor } from 'grapesjs'
import {
  makeImagePickerTrait,
  makeTextTrait,
} from '@/components/WebBuilder/utils/traitFactory'

export const WB_RESPONSIVE_HERO_CAROUSEL_TYPE = 'wb-responsive-hero-carousel'
export const WB_RESPONSIVE_HERO_CAROUSEL_ITEM_TYPE = 'wb-responsive-hero-carousel-item'

type HeroSlide = {
  desktopImage: string
  mobileImage: string
  title: string
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="5" width="18" height="14" rx="2" />
  <path d="M8 12h8" />
  <path d="M9 16l-3-3 3-3" />
  <path d="M15 16l3-3-3-3" />
</svg>`

const ARROW_PREV = `<svg class="wb-responsive-hero-carousel__arrow-icon" viewBox="0 0 24 24" fill="none">
  <path d="M15 19L8 12L15 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const ARROW_NEXT = `<svg class="wb-responsive-hero-carousel__arrow-icon" viewBox="0 0 24 24" fill="none">
  <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const DEFAULT_DESKTOP_IMAGE = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=85'
const DEFAULT_MOBILE_IMAGE = 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85'

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    desktopImage: DEFAULT_DESKTOP_IMAGE,
    mobileImage: DEFAULT_MOBILE_IMAGE,
    title: 'Real Application Scenarios',
  },
  {
    desktopImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1800&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1584622781867-f6b72d333171?auto=format&fit=crop&w=1200&q=85',
    title: 'Smart Bathroom Solutions',
  },
  {
    desktopImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=85',
    title: 'Modern Interior Projects',
  },
]

const RESPONSIVE_HERO_CAROUSEL_CSS = `
  .wb-responsive-hero-carousel {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 1;
    max-height: 100vh;
    overflow: hidden;
    background: #111111;
    color: #ffffff;
    box-sizing: border-box;
  }
  .wb-responsive-hero-carousel,
  .wb-responsive-hero-carousel *,
  .wb-responsive-hero-carousel *::before,
  .wb-responsive-hero-carousel *::after {
    box-sizing: border-box;
  }
  .wb-responsive-hero-carousel__track {
    position: relative;
    display: grid;
    width: 100%;
    height: 100%;
  }
  .wb-responsive-hero-carousel__item {
    position: relative;
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 420ms ease;
  }
  .wb-responsive-hero-carousel__item.is-active {
    opacity: 1;
    pointer-events: auto;
  }
  .wb-responsive-hero-carousel__picture,
  .wb-responsive-hero-carousel__image {
    display: block;
    width: 100%;
    height: 100%;
  }
  .wb-responsive-hero-carousel__image {
    object-fit: cover;
  }
  .wb-responsive-hero-carousel__shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.18) 48%, rgba(0, 0, 0, 0.34) 100%);
    pointer-events: none;
  }
  .wb-responsive-hero-carousel__title {
    position: absolute;
    left: 7%;
    bottom: 14%;
    margin: 0;
    max-width: 520px;
    color: #ffffff;
    font-size: 34px;
    line-height: 1.22;
    font-weight: 700;
    letter-spacing: 0;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
    overflow-wrap: anywhere;
  }
  .wb-responsive-hero-carousel__nav {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
  }
  .wb-responsive-hero-carousel__arrow {
    position: absolute;
    top: 50%;
    width: 64px;
    height: 64px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    transform: translateY(-50%);
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .wb-responsive-hero-carousel__arrow--prev {
    left: 32px;
  }
  .wb-responsive-hero-carousel__arrow--next {
    right: 32px;
  }
  .wb-responsive-hero-carousel__arrow-icon {
    width: 54px;
    height: 54px;
  }
  .wb-responsive-hero-carousel__dots {
    position: absolute;
    left: 50%;
    bottom: 24px;
    z-index: 5;
    display: none;
    width: 144px;
    height: 2px;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.38);
  }
  .wb-responsive-hero-carousel__dot {
    height: 2px;
    flex: 1 1 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    cursor: pointer;
  }
  .wb-responsive-hero-carousel__dot.is-active {
    background: #ffffff;
  }
  @media (max-width: 767px) {
    .wb-responsive-hero-carousel {
      aspect-ratio: 15 / 16;
      max-height: none;
    }
    .wb-responsive-hero-carousel__shade {
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 32%, rgba(0, 0, 0, 0.58) 100%);
    }
    .wb-responsive-hero-carousel__title {
      left: 8%;
      right: 8%;
      bottom: 14%;
      max-width: 420px;
      font-size: 36px;
      line-height: 1.18;
    }
    .wb-responsive-hero-carousel__nav {
      display: none;
    }
    .wb-responsive-hero-carousel__dots {
      display: flex;
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

function getSlideData(model: any): HeroSlide {
  return {
    desktopImage: String(model.get?.('desktopImage') || '').trim() || DEFAULT_DESKTOP_IMAGE,
    mobileImage: String(model.get?.('mobileImage') || '').trim() || String(model.get?.('desktopImage') || '').trim() || DEFAULT_MOBILE_IMAGE,
    title: String(model.get?.('slideTitle') || '').trim() || 'Real Application Scenarios',
  }
}

function buildSlideContent(slide: HeroSlide) {
  return [
    {
      tagName: 'picture',
      ...nonLayered({
        attributes: { class: 'wb-responsive-hero-carousel__picture' },
      }),
      components: [
        {
          tagName: 'source',
          ...nonLayered({
            attributes: {
              class: 'wb-responsive-hero-carousel__source',
              media: '(max-width: 767px)',
              srcset: slide.mobileImage || slide.desktopImage,
            },
          }),
        },
        {
          tagName: 'img',
          ...nonLayered({
            attributes: {
              class: 'wb-responsive-hero-carousel__image',
              src: slide.desktopImage,
              alt: slide.title,
            },
          }),
        },
      ],
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'wb-responsive-hero-carousel__shade' },
      }),
    },
    {
      tagName: 'h2',
      ...nonLayered({
        attributes: { class: 'wb-responsive-hero-carousel__title' },
      }),
      content: slide.title,
    },
  ]
}

function buildSlideDef(slide: HeroSlide, index = 0) {
  return {
    type: WB_RESPONSIVE_HERO_CAROUSEL_ITEM_TYPE,
    tagName: 'article',
    name: `轮播图 · ${slide.title}`,
    selectable: true,
    layerable: true,
    draggable: '.wb-responsive-hero-carousel__track',
    droppable: false,
    copyable: true,
    removable: true,
    desktopImage: slide.desktopImage,
    mobileImage: slide.mobileImage,
    slideTitle: slide.title,
    attributes: {
      class: `wb-responsive-hero-carousel__item${index === 0 ? ' is-active' : ''}`,
      'data-wb-component': 'responsive-hero-carousel-item',
      'data-slide-index': String(index),
    },
    components: buildSlideContent(slide),
  }
}

function getSlideTraits() {
  return [
    makeImagePickerTrait('PC 图片', 'desktopImage', { showPreview: true }),
    makeImagePickerTrait('移动端图片', 'mobileImage', { showPreview: true }),
    makeTextTrait('标题', 'slideTitle', { placeholder: 'Real Application Scenarios' }),
  ]
}

function syncSlide(model: any): void {
  const slide = getSlideData(model)
  const itemName = `轮播图 · ${slide.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)

  const attrs = model.getAttributes?.() || {}
  const existingClasses = String(attrs.class || '')
    .split(/\s+/)
    .filter((item: string) => item && item !== 'wb-responsive-hero-carousel__item')

  model.addAttributes?.({
    ...attrs,
    class: ['wb-responsive-hero-carousel__item', ...existingClasses].join(' '),
    'data-wb-component': 'responsive-hero-carousel-item',
  })

  const source = findChildByClass(model, 'wb-responsive-hero-carousel__source')
  source?.addAttributes?.({
    class: 'wb-responsive-hero-carousel__source',
    media: '(max-width: 767px)',
    srcset: slide.mobileImage || slide.desktopImage,
  })

  const image = findChildByClass(model, 'wb-responsive-hero-carousel__image')
  image?.addAttributes?.({
    class: 'wb-responsive-hero-carousel__image',
    src: slide.desktopImage,
    alt: slide.title,
  })

  writeText(findChildByClass(model, 'wb-responsive-hero-carousel__title'), slide.title)
}

function resolveCarouselTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_RESPONSIVE_HERO_CAROUSEL_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_RESPONSIVE_HERO_CAROUSEL_TYPE) as any
  if (fromSelected?.get?.('type') === WB_RESPONSIVE_HERO_CAROUSEL_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_RESPONSIVE_HERO_CAROUSEL_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_RESPONSIVE_HERO_CAROUSEL_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_RESPONSIVE_HERO_CAROUSEL_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_RESPONSIVE_HERO_CAROUSEL_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_RESPONSIVE_HERO_CAROUSEL_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_RESPONSIVE_HERO_CAROUSEL_TYPE) return fromTraitTarget

  return null
}

function createAddSlideTrait() {
  return {
    type: 'button' as any,
    name: 'add-hero-slide',
    label: false as const,
    text: '+ 添加轮播图',
    full: true,
    command(this: any, editor: Editor) {
      const carousel = resolveCarouselTarget(editor, this)
      const track = carousel?._getTrack?.()
      const slides = track?.components?.()
      if (!slides) return

      const index = slides.length || 0
      const created = slides.add(buildSlideDef({
        desktopImage: DEFAULT_DESKTOP_IMAGE,
        mobileImage: DEFAULT_MOBILE_IMAGE,
        title: `Slide ${index + 1}`,
      }, index))
      const target = Array.isArray(created) ? created[0] : created
      const carouselEl = carousel?.getView?.()?.el as HTMLElement | undefined
      carouselEl?.dispatchEvent?.(new CustomEvent('wb:responsive-hero-carousel:refresh'))
      if (target) editor.select?.(target)
    },
  }
}

function buildTree() {
  return [
    {
      tagName: 'div',
      name: '轮播图列表',
      ...nonLayered({
        selectable: true,
        droppable: '.wb-responsive-hero-carousel__item',
        attributes: { class: 'wb-responsive-hero-carousel__track' },
      }),
      components: DEFAULT_SLIDES.map((slide, index) => buildSlideDef(slide, index)),
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'wb-responsive-hero-carousel__nav' },
      }),
      components: [
        {
          tagName: 'button',
          ...nonLayered({
            attributes: {
              class: 'wb-responsive-hero-carousel__arrow wb-responsive-hero-carousel__arrow--prev',
              type: 'button',
              'aria-label': 'Previous slide',
            },
          }),
          components: ARROW_PREV,
        },
        {
          tagName: 'button',
          ...nonLayered({
            attributes: {
              class: 'wb-responsive-hero-carousel__arrow wb-responsive-hero-carousel__arrow--next',
              type: 'button',
              'aria-label': 'Next slide',
            },
          }),
          components: ARROW_NEXT,
        },
      ],
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: {
          class: 'wb-responsive-hero-carousel__dots',
          'aria-label': 'Slide navigation',
        },
      }),
    },
  ]
}

export function registerResponsiveHeroCarouselComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_RESPONSIVE_HERO_CAROUSEL_TYPE)) return

  domComponents.addType(WB_RESPONSIVE_HERO_CAROUSEL_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'responsive-hero-carousel-item'
      || el?.classList?.contains('wb-responsive-hero-carousel__item')
        ? { type: WB_RESPONSIVE_HERO_CAROUSEL_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '轮播图',
        tagName: 'article',
        selectable: true,
        layerable: true,
        draggable: '.wb-responsive-hero-carousel__track',
        droppable: false,
        copyable: true,
        removable: true,
        desktopImage: DEFAULT_DESKTOP_IMAGE,
        mobileImage: DEFAULT_MOBILE_IMAGE,
        slideTitle: 'Real Application Scenarios',
        traits: getSlideTraits(),
      },
      init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(buildSlideContent(getSlideData(this)))
        }
        this.listenTo(this, 'change:desktopImage change:mobileImage change:slideTitle', () => syncSlide(this))
        syncSlide(this)
      },
    },
  })

  domComponents.addType(WB_RESPONSIVE_HERO_CAROUSEL_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'responsive-hero-carousel'
        ? { type: WB_RESPONSIVE_HERO_CAROUSEL_TYPE }
        : false,
    model: {
      defaults: {
        name: '全宽响应式轮播',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'responsive-hero-carousel',
          class: 'wb-responsive-hero-carousel',
        },
        script: function () {
          const root = this as HTMLElement
          const state = root as any
          state._wbResponsiveHeroCarouselCleanup?.()

          const getSlides = () =>
            Array.from(root.querySelectorAll<HTMLElement>('.wb-responsive-hero-carousel__item'))
          const prev = root.querySelector<HTMLButtonElement>('.wb-responsive-hero-carousel__arrow--prev')
          const next = root.querySelector<HTMLButtonElement>('.wb-responsive-hero-carousel__arrow--next')
          const dots = root.querySelector<HTMLElement>('.wb-responsive-hero-carousel__dots')
          let currentIndex = 0
          let touchStartX = 0
          let touchStartY = 0
          let touchActive = false

          const renderDots = () => {
            if (!dots) return []
            const slides = getSlides()
            dots.innerHTML = ''
            return slides.map((_, index) => {
              const dot = document.createElement('button')
              dot.type = 'button'
              dot.className = 'wb-responsive-hero-carousel__dot'
              dot.setAttribute('aria-label', `Go to slide ${index + 1}`)
              dot.addEventListener('click', () => activate(index))
              dots.appendChild(dot)
              return dot
            })
          }

          let dotEls: HTMLButtonElement[] = []

          const activate = (index: number) => {
            const slides = getSlides()
            if (!slides.length) return
            const max = slides.length - 1
            currentIndex = Math.max(0, Math.min(index, max))
            slides.forEach((slide, slideIndex) => {
              slide.classList.toggle('is-active', slideIndex === currentIndex)
            })
            dotEls.forEach((dot, dotIndex) => {
              dot.classList.toggle('is-active', dotIndex === currentIndex)
              dot.setAttribute('aria-current', dotIndex === currentIndex ? 'true' : 'false')
            })
          }

          const onPrev = () => {
            const slides = getSlides()
            if (!slides.length) return
            activate((currentIndex - 1 + slides.length) % slides.length)
          }
          const onNext = () => {
            const slides = getSlides()
            if (!slides.length) return
            activate((currentIndex + 1) % slides.length)
          }
          const onTouchStart = (event: TouchEvent) => {
            const touch = event.touches[0]
            if (!touch) return
            touchStartX = touch.clientX
            touchStartY = touch.clientY
            touchActive = true
          }
          const onTouchEnd = (event: TouchEvent) => {
            if (!touchActive) return
            touchActive = false

            const touch = event.changedTouches[0]
            if (!touch) return

            const deltaX = touch.clientX - touchStartX
            const deltaY = touch.clientY - touchStartY
            if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return

            if (deltaX < 0) onNext()
            else onPrev()
          }
          const onRefresh = () => {
            dotEls = renderDots()
            activate(currentIndex)
          }

          dotEls = renderDots()
          prev?.addEventListener('click', onPrev)
          next?.addEventListener('click', onNext)
          root.addEventListener('touchstart', onTouchStart, { passive: true })
          root.addEventListener('touchend', onTouchEnd, { passive: true })
          root.addEventListener('wb:responsive-hero-carousel:refresh', onRefresh)
          activate(0)

          state._wbResponsiveHeroCarouselCleanup = () => {
            prev?.removeEventListener('click', onPrev)
            next?.removeEventListener('click', onNext)
            root.removeEventListener('touchstart', onTouchStart)
            root.removeEventListener('touchend', onTouchEnd)
            root.removeEventListener('wb:responsive-hero-carousel:refresh', onRefresh)
            dotEls.forEach((dot) => dot.replaceWith(dot.cloneNode(true)))
          }
        },
        styles: RESPONSIVE_HERO_CAROUSEL_CSS,
        traits: [createAddSlideTrait()],
        components: buildTree(),
      },
      _getTrack(this: any) {
        return this.components?.()?.at?.(0) ?? null
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (
      type === WB_RESPONSIVE_HERO_CAROUSEL_TYPE
      || type === WB_RESPONSIVE_HERO_CAROUSEL_ITEM_TYPE
    ) return

    const item = component?.closestType?.(WB_RESPONSIVE_HERO_CAROUSEL_ITEM_TYPE)
    if (item?.get?.('type') === WB_RESPONSIVE_HERO_CAROUSEL_ITEM_TYPE) {
      editor.select?.(item)
    }
  })

  blockManager?.add?.(WB_RESPONSIVE_HERO_CAROUSEL_TYPE, {
    label: '全宽响应式轮播',
    category: 'Section',
    content: { type: WB_RESPONSIVE_HERO_CAROUSEL_TYPE },
    media: BLOCK_ICON,
  })
}
