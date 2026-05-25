import type { Editor } from 'grapesjs'
import Swiper from 'swiper'
import { Navigation } from 'swiper/modules'
import {
  makeCheckboxTrait,
  makeImagePickerTrait,
  makeLinkTrait,
  makeNumberTrait,
  makeTextareaTrait,
  makeTextTrait,
} from '@/components/WebBuilder/utils/traitFactory'

export const WB_CARD_CAROUSEL_SECTION_TYPE = 'wb-card-carousel-section'
const WB_CARD_CAROUSEL_CARD_TYPE = 'wb-card-carousel-card'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="5" width="5" height="14" rx="1.5" />
  <rect x="9.5" y="5" width="5" height="14" rx="1.5" />
  <rect x="16" y="5" width="5" height="14" rx="1.5" />
  <path d="M5 20h14" />
</svg>`

const ARROW_LEFT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M10.53 5.47a.75.75 0 0 1 0 1.06l-4.72 4.72H20a.75.75 0 0 1 0 1.5H5.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0" clip-rule="evenodd"/></svg>`
const ARROW_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M13.47 5.47a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H4a.75.75 0 0 1 0-1.5h14.19l-4.72-4.72a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/></svg>`

type CardCarouselItem = {
  image: string
  eyebrow: string
  title: string
  description: string
  href: string
}

function makePlaceholderImage(index: number, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="450" viewBox="0 0 640 450"><rect width="640" height="450" fill="#f4f5f7"/><rect x="96" y="92" width="448" height="266" rx="0" fill="#e2e5ea"/><text x="320" y="214" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="28" font-weight="700">Card Image ${index}</text><text x="320" y="252" text-anchor="middle" fill="#667085" font-family="Arial, sans-serif" font-size="18">${label}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const DEFAULT_CARDS: CardCarouselItem[] = [
  {
    image: makePlaceholderImage(1, 'Industry Trends'),
    eyebrow: '[Industry Trends]',
    title: 'Professional Guidelines M2449233',
    description: "Whether it's the design of skyscrapers, the rotation of wind turbine blades, or the operation of various mechanical equipment, eccentric loads are subtly affecting the stability of our projects.",
    href: '#',
  },
  {
    image: makePlaceholderImage(2, 'Reliability Focus'),
    eyebrow: '[Reliability Focus]',
    title: 'Three Professional Guidelines On Slewing Rings',
    description: "Whether it's the design of skyscrapers, the rotation of wind turbine blades, or the operation of various mechanical equipment, eccentric loads are subtly affecting the stability of our projects.",
    href: '#',
  },
  {
    image: makePlaceholderImage(3, 'Reliability Focus'),
    eyebrow: '[Reliability Focus]',
    title: 'Three Professional Guidelines On Slewing Rings',
    description: "Whether it's the design of skyscrapers, the rotation of wind turbine blades, or the operation of various mechanical equipment, eccentric loads are subtly affecting the stability of our projects.",
    href: '#',
  },
  {
    image: makePlaceholderImage(4, 'Technical Notes'),
    eyebrow: '[Technical Notes]',
    title: 'Application Knowledge For Industrial Systems',
    description: 'Cards stay editable after save and can be configured for desktop and mobile carousel layouts.',
    href: '#',
  },
]

const CARD_CAROUSEL_CSS = `
  .wb-card-carousel-section {
    width: 100%;
    padding: 80px 0;
    background: #fff;
    color: #111;
    box-sizing: border-box;
    overflow: hidden;
  }
  .wb-card-carousel-section,
  .wb-card-carousel-section * {
    box-sizing: border-box;
  }
  .wb-card-carousel-section__inner {
    width: 100%;
    margin: 0 auto;
  }
  .wb-card-carousel-section__header {
    margin-bottom: 40px;
  }
  .wb-card-carousel-section__title {
    margin: 0;
    color: #111;
    font-size: 44px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: 0;
  }
  .wb-card-carousel-section__subtitle {
    margin: 12px 0 0;
    color: #667085;
    font-size: 18px;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0;
  }
  .wb-card-carousel-section__shell {
    position: relative;
  }
  .wb-card-carousel-section__swiper {
    width: 100%;
    overflow: hidden;
  }
  .wb-card-carousel-section__wrapper {
    display: flex;
    height: auto !important;
    align-items: stretch;
  }
  .wb-card-carousel-section__card.swiper-slide {
    height: auto;
    flex-shrink: 0;
  }
  .wb-card-carousel-section__card-link {
    display: flex;
    height: 100%;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
    color: inherit;
    text-decoration: none;
  }
  .wb-card-carousel-section__media {
    width: 100%;
    aspect-ratio: 1.42 / 1;
    overflow: hidden;
    background: #eef0f3;
  }
  .wb-card-carousel-section__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .wb-card-carousel-section__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 28px 0 0;
  }
  .wb-card-carousel-section__eyebrow {
    margin: 0 0 8px;
    color: #3C53E8;
    font-size: 14px;
    font-weight: 500;
    line-height: 140%;
    letter-spacing: 0;
  }
  .wb-card-carousel-section__card-title {
    margin: 0;
    color: #111;
    font-size: 24px;
    font-weight: 600;
    line-height: 140%;
    letter-spacing: 0;
  }
  .wb-card-carousel-section__description {
    display: -webkit-box;
    margin: 12px 0 0;
    overflow: hidden;
    color: rgba(0, 0, 0, 0.8);
    font-size: 14px;
    font-weight: normal;
    line-height: 20px;
    letter-spacing: 0.02em;
    text-transform: capitalize;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }
  .wb-card-carousel-section__nav {
    position: absolute;
    top: 50%;
    z-index: 3;
    display: inline-flex;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid rgba(17, 17, 17, 0.14);
    border-radius: 999px;
    background: #fff;
    color: #111;
    cursor: pointer;
    transform: translateY(-50%);
    transition: opacity 180ms ease, background 180ms ease, color 180ms ease;
  }
  .wb-card-carousel-section__nav:hover {
    background: #111;
    color: #fff;
  }
  .wb-card-carousel-section__nav.swiper-button-disabled,
  .wb-card-carousel-section__nav:disabled {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
  }
  .wb-card-carousel-section__nav--prev {
    left: -22px;
  }
  .wb-card-carousel-section__nav--next {
    right: -22px;
  }
  .wb-card-carousel-section__nav svg {
    display: block;
    width: 22px;
    height: 22px;
  }
  .wb-card-carousel-section__progress {
    display: none;
    width: 100%;
    justify-content: center;
    gap: 6px;
    margin-top: 24px;
    overflow: hidden;
  }
  .wb-card-carousel-section__progress-bar {
    display: block;
    width: 16px;
    height: 2px;
    background: #9E9E9E;
    transition: background 220ms ease;
  }
  .wb-card-carousel-section__progress-bar.is-active {
    background: #3C53E8;
  }
  @media (max-width: 767px) {
    .wb-card-carousel-section {
      padding: 56px 0;
    }
    .wb-card-carousel-section__inner {
      width: 100%;
    }
    .wb-card-carousel-section__title {
      font-size: 30px;
      line-height: 1.2;
    }
    .wb-card-carousel-section__subtitle {
      font-size: 15px;
    }
    .wb-card-carousel-section__card-link {
      min-height: 0;
    }
    .wb-card-carousel-section__body {
      padding: 18px 0 0;
    }
    .wb-card-carousel-section__eyebrow {
      font-size: 12px;
    }
    .wb-card-carousel-section__card-title {
      display: -webkit-box;
      min-height: 39.2px;
      overflow: hidden;
      font-size: 14px;
      line-height: 140%;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .wb-card-carousel-section__description {
      -webkit-line-clamp: 2;
    }
    .wb-card-carousel-section__nav {
      display: none;
    }
    .wb-card-carousel-section__progress {
      display: flex;
      gap: 0px;
    }
  }
`

function toFiniteNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return Math.max(min, Math.min(max, toFiniteNumber(value, fallback)))
}

function getDefaultCard(index: number): CardCarouselItem {
  return DEFAULT_CARDS[index % DEFAULT_CARDS.length]
}

function createCardDef(index: number, overrides: Partial<CardCarouselItem> = {}) {
  const item = { ...getDefaultCard(index), ...overrides }

  return {
    type: WB_CARD_CAROUSEL_CARD_TYPE,
    tagName: 'article',
    name: `轮播卡片 ${index + 1}`,
    draggable: '.swiper-wrapper',
    droppable: false,
    selectable: true,
    stylable: true,
    copyable: true,
    removable: true,
    attributes: {
      class: 'swiper-slide wb-card-carousel-section__card',
      'data-card-index': String(index + 1),
    },
    cardImage: item.image,
    cardEyebrow: item.eyebrow,
    cardTitle: item.title,
    cardDescription: item.description,
    cardHref: item.href,
    components: buildCardInner(item),
  }
}

function buildCardInner(item: CardCarouselItem) {
  return [
    {
      tagName: 'a',
      selectable: true,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      stylable: true,
      attributes: {
        class: 'wb-card-carousel-section__card-link',
        href: item.href || '#',
      },
      components: [
        {
          tagName: 'div',
          selectable: true,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          stylable: true,
          attributes: { class: 'wb-card-carousel-section__media' },
          components: [
            {
              tagName: 'img',
              type: 'image',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-card-carousel-section__image',
                src: item.image,
                alt: item.title,
              },
            },
          ],
        },
        {
          tagName: 'div',
          selectable: true,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          stylable: true,
          attributes: { class: 'wb-card-carousel-section__body' },
          components: [
            {
              tagName: 'p',
              type: 'text',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-card-carousel-section__eyebrow' },
              components: item.eyebrow,
            },
            {
              tagName: 'h3',
              type: 'text',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-card-carousel-section__card-title' },
              components: item.title,
            },
            {
              tagName: 'p',
              type: 'text',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-card-carousel-section__description' },
              components: item.description,
            },
          ],
        },
      ],
    },
  ]
}

function buildSectionTree(cardsCount = 4) {
  const cards = Array.from({ length: cardsCount }, (_, index) => createCardDef(index))

  return [
    {
      tagName: 'div',
      selectable: true,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      stylable: true,
      attributes: { class: 'wb-card-carousel-section__inner' },
      components: [
        {
          tagName: 'div',
          selectable: true,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          stylable: true,
          attributes: { class: 'wb-card-carousel-section__header' },
          components: [
            {
              tagName: 'h2',
              type: 'text',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-card-carousel-section__title' },
              components: 'Card Carousel',
            },
            {
              tagName: 'p',
              type: 'text',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-card-carousel-section__subtitle' },
              components: 'A reusable configurable card carousel section.',
            },
          ],
        },
        {
          tagName: 'div',
          selectable: true,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          stylable: true,
          attributes: { class: 'wb-card-carousel-section__shell' },
          components: [
            {
              tagName: 'button',
              type: 'button',
              selectable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-card-carousel-section__nav wb-card-carousel-section__nav--prev',
                type: 'button',
                'aria-label': 'Previous cards',
              },
              components: ARROW_LEFT_SVG,
            },
            {
              tagName: 'div',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              stylable: true,
              attributes: { class: 'swiper wb-card-carousel-section__swiper' },
              components: [
                {
                  tagName: 'div',
                  selectable: true,
                  draggable: false,
                  droppable: true,
                  copyable: false,
                  removable: false,
                  stylable: true,
                  attributes: { class: 'swiper-wrapper wb-card-carousel-section__wrapper' },
                  components: cards,
                },
              ],
            },
            {
              tagName: 'button',
              type: 'button',
              selectable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-card-carousel-section__nav wb-card-carousel-section__nav--next',
                type: 'button',
                'aria-label': 'Next cards',
              },
              components: ARROW_RIGHT_SVG,
            },
            {
              tagName: 'div',
              selectable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-card-carousel-section__progress', 'aria-hidden': 'true' },
              components: [
                {
                  tagName: 'span',
                  selectable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  attributes: { class: 'wb-card-carousel-section__progress-bar' },
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

function makeCardCarouselScript() {
  return function (this: HTMLElement, props: any) {
    const root = this as HTMLElement & {
      __wbCardCarouselCleanup?: (() => void) | null
      __wbCardCarouselSwiper?: any
      __wbCardCarouselOffset?: number
    }
    if (!root) return

    root.__wbCardCarouselCleanup?.()
    root.__wbCardCarouselSwiper?.destroy?.(true, true)
    root.__wbCardCarouselSwiper = null

    const cleanupFns: Array<() => void> = []
    const swiperEl = root.querySelector('.wb-card-carousel-section__swiper') as HTMLElement | null
    const wrapperEl = root.querySelector('.wb-card-carousel-section__wrapper') as HTMLElement | null
    const prevEl = root.querySelector('.wb-card-carousel-section__nav--prev') as HTMLElement | null
    const nextEl = root.querySelector('.wb-card-carousel-section__nav--next') as HTMLElement | null
    const progressEl = root.querySelector('.wb-card-carousel-section__progress') as HTMLElement | null
    const SwiperCtor = (window as any).Swiper

    const toNumber = (value: any, fallback: number) => {
      const numberValue = Number(value)
      return Number.isFinite(numberValue) ? numberValue : fallback
    }
    const clampValue = (value: any, min: number, max: number, fallback: number) =>
      Math.max(min, Math.min(max, toNumber(value, fallback)))
    const readAttr = (name: string) => root.getAttribute(name)
    const desktopSlides = clampValue(props?.desktopSlides ?? readAttr('data-desktop-slides'), 1, 12, 3)
    const mobileSlides = clampValue(props?.mobileSlides ?? readAttr('data-mobile-slides'), 1, 3, 1.3)
    const spaceBetween = clampValue(props?.spaceBetween ?? readAttr('data-space-between'), 0, 80, 24)
    const mobileSpaceBetween = Math.min(spaceBetween, 16)

    const getSlides = () =>
      Array.from(root.querySelectorAll('.wb-card-carousel-section__card')) as HTMLElement[]
    const getPerView = () =>
      window.matchMedia('(max-width: 767px)').matches ? mobileSlides : desktopSlides
    const getGap = () =>
      window.matchMedia('(max-width: 767px)').matches ? mobileSpaceBetween : spaceBetween
    const renderProgress = (slidesCount: number, activeIndex: number) => {
      if (!progressEl) return
      const safeCount = Math.max(0, slidesCount)
      const currentCount = progressEl.querySelectorAll('.wb-card-carousel-section__progress-bar').length
      if (currentCount !== safeCount) {
        progressEl.innerHTML = Array.from({ length: safeCount }, () =>
          '<span class="wb-card-carousel-section__progress-bar"></span>',
        ).join('')
      }
      const bars = Array.from(
        progressEl.querySelectorAll('.wb-card-carousel-section__progress-bar'),
      ) as HTMLElement[]
      bars.forEach((bar, index) => {
        bar.classList.toggle('is-active', index === Math.max(0, Math.min(safeCount - 1, activeIndex)))
      })
    }
    const syncChrome = (activeIndex = 0) => {
      const slides = getSlides()
      const perView = getPerView()
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const canSlide = slides.length > perView
      if (wrapperEl) wrapperEl.style.height = 'auto'
      if (prevEl) prevEl.style.display = canSlide && !isMobile ? '' : 'none'
      if (nextEl) nextEl.style.display = canSlide && !isMobile ? '' : 'none'
      if (progressEl) progressEl.style.display = canSlide && isMobile ? 'flex' : 'none'
      renderProgress(slides.length, activeIndex)
    }

    if (SwiperCtor && swiperEl) {
      root.__wbCardCarouselSwiper = new SwiperCtor(swiperEl, {
        modules: (window as any).__wbSwiperModules?.Navigation
          ? [(window as any).__wbSwiperModules.Navigation]
          : undefined,
        slidesPerView: desktopSlides,
        spaceBetween,
        speed: 520,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        resizeObserver: true,
        updateOnWindowResize: true,
        centeredSlides: false,
        navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
        on: {
          init(swiper: any) {
            syncChrome(Number(swiper?.realIndex ?? swiper?.activeIndex ?? 0))
          },
          slideChange(swiper: any) {
            syncChrome(Number(swiper?.realIndex ?? swiper?.activeIndex ?? 0))
          },
          resize() {
            const swiper = root.__wbCardCarouselSwiper
            syncChrome(Number(swiper?.realIndex ?? swiper?.activeIndex ?? 0))
          },
        },
        breakpoints: {
          0: { slidesPerView: mobileSlides, spaceBetween: mobileSpaceBetween, centeredSlides: true },
          768: { slidesPerView: desktopSlides, spaceBetween, centeredSlides: false },
        },
      })
      window.requestAnimationFrame(() => {
        root.__wbCardCarouselSwiper?.update?.()
        const swiper = root.__wbCardCarouselSwiper
        syncChrome(Number(swiper?.realIndex ?? swiper?.activeIndex ?? 0))
      })
    } else if (wrapperEl) {
      let offset = Number(root.__wbCardCarouselOffset || 0)
      const sync = () => {
        const slides = getSlides()
        const perView = getPerView()
        const gap = getGap()
        const maxOffset = Math.max(0, Math.ceil(slides.length - perView))
        offset = Math.max(0, Math.min(maxOffset, offset))
        root.__wbCardCarouselOffset = offset
        wrapperEl.style.display = 'flex'
        wrapperEl.style.gap = `${gap}px`
        wrapperEl.style.height = 'auto'
        wrapperEl.style.transition = 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)'
        slides.forEach((slide) => {
          slide.style.flex = `0 0 calc((100% - ${(perView - 1) * gap}px) / ${perView})`
        })
        const target = slides[offset]
        const isMobile = window.matchMedia('(max-width: 767px)').matches
        const centeredOffset = target && isMobile
          ? Math.max(0, target.offsetLeft - (wrapperEl.clientWidth - target.offsetWidth) / 2)
          : target?.offsetLeft || 0
        wrapperEl.style.transform = `translate3d(-${centeredOffset}px, 0, 0)`
        syncChrome(offset)
      }
      const onPrev = () => {
        offset -= 1
        sync()
      }
      const onNext = () => {
        offset += 1
        sync()
      }
      prevEl?.addEventListener('click', onPrev)
      nextEl?.addEventListener('click', onNext)
      window.addEventListener('resize', sync)
      cleanupFns.push(() => {
        prevEl?.removeEventListener('click', onPrev)
        nextEl?.removeEventListener('click', onNext)
        window.removeEventListener('resize', sync)
      })
      sync()
    }

    root.__wbCardCarouselCleanup = () => {
      cleanupFns.forEach((fn) => fn())
      root.__wbCardCarouselCleanup = null
    }
  }
}

function registerCardType(editor: Editor) {
  const domComponents = editor.DomComponents
  if (!domComponents || domComponents.getType(WB_CARD_CAROUSEL_CARD_TYPE)) return

  domComponents.addType(WB_CARD_CAROUSEL_CARD_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.classList?.contains('wb-card-carousel-section__card')
        ? { type: WB_CARD_CAROUSEL_CARD_TYPE }
        : false,
    model: {
      defaults: {
        name: '轮播卡片',
        tagName: 'article',
        draggable: '.swiper-wrapper',
        droppable: false,
        selectable: true,
        stylable: true,
        copyable: true,
        removable: true,
        attributes: { class: 'swiper-slide wb-card-carousel-section__card' },
        cardImage: DEFAULT_CARDS[0].image,
        cardEyebrow: DEFAULT_CARDS[0].eyebrow,
        cardTitle: DEFAULT_CARDS[0].title,
        cardDescription: DEFAULT_CARDS[0].description,
        cardHref: DEFAULT_CARDS[0].href,
        traits: [
          makeImagePickerTrait('图片', 'cardImage', { showPreview: true }),
          makeTextTrait('上方文本', 'cardEyebrow', { placeholder: '请输入上方文本' }),
          makeTextTrait('标题', 'cardTitle', { placeholder: '请输入标题' }),
          makeTextareaTrait('描述', 'cardDescription', { rows: 3, placeholder: '请输入描述' }),
          makeLinkTrait({ label: '链接地址', name: 'cardHref', placeholder: '#' }),
        ],
        components: buildCardInner(DEFAULT_CARDS[0]),
      },
      init(this: any) {
        this._hydrateFromDom?.()
        this.on(
          'change:cardImage change:cardEyebrow change:cardTitle change:cardDescription change:cardHref',
          this._syncCard,
        )
        this._syncCard()
      },
      _find(this: any, selector: string) {
        return this.find?.(selector)?.[0] ?? null
      },
      _readText(this: any, component: any): string {
        const children = component?.components?.()?.models || []
        const text = children
          .map((child: any) => child?.get?.('content') ?? child?.toHTML?.() ?? '')
          .join('')
          .trim()
        return text || `${component?.getEl?.()?.textContent || ''}`.trim()
      },
      _hydrateFromDom(this: any) {
        const link = this._find?.('.wb-card-carousel-section__card-link')
        const image = this._find?.('.wb-card-carousel-section__image')
        const eyebrow = this._find?.('.wb-card-carousel-section__eyebrow')
        const title = this._find?.('.wb-card-carousel-section__card-title')
        const description = this._find?.('.wb-card-carousel-section__description')

        if (image?.getAttributes?.()?.src) {
          this.set('cardImage', image.getAttributes().src, { silent: true })
        }
        if (eyebrow) {
          this.set('cardEyebrow', this._readText?.(eyebrow), { silent: true })
        }
        if (title) {
          this.set('cardTitle', this._readText?.(title), { silent: true })
        }
        if (description) {
          this.set('cardDescription', this._readText?.(description), { silent: true })
        }
        if (link?.getAttributes?.()?.href) {
          this.set('cardHref', link.getAttributes().href, { silent: true })
        }
      },
      _syncCard(this: any) {
        const imageSrc = `${this.get('cardImage') || DEFAULT_CARDS[0].image}`.trim()
        const eyebrowText = `${this.get('cardEyebrow') || DEFAULT_CARDS[0].eyebrow}`.trim()
        const titleText = `${this.get('cardTitle') || DEFAULT_CARDS[0].title}`.trim()
        const descriptionText = `${this.get('cardDescription') || DEFAULT_CARDS[0].description}`.trim()
        const href = `${this.get('cardHref') || '#'}`.trim() || '#'

        const link = this._find?.('.wb-card-carousel-section__card-link')
        const image = this._find?.('.wb-card-carousel-section__image')
        const eyebrow = this._find?.('.wb-card-carousel-section__eyebrow')
        const title = this._find?.('.wb-card-carousel-section__card-title')
        const description = this._find?.('.wb-card-carousel-section__description')

        link?.addAttributes?.({ href })
        image?.addAttributes?.({ src: imageSrc, alt: titleText })
        eyebrow?.components?.(eyebrowText)
        title?.components?.(titleText)
        description?.components?.(descriptionText)
      },
    },
  })
}

export function registerCardCarouselSectionComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CARD_CAROUSEL_SECTION_TYPE)) return

  registerCardType(editor)

  const exposeSwiperToCanvas = () => {
    const canvasWindow = editor.Canvas?.getWindow?.() as any
    if (!canvasWindow) return
    canvasWindow.Swiper = Swiper
    canvasWindow.__wbSwiperModules = {
      ...(canvasWindow.__wbSwiperModules || {}),
      Navigation,
    }
  }

  exposeSwiperToCanvas()
  editor.on?.('canvas:frame:load', exposeSwiperToCanvas)

  const carouselScript = makeCardCarouselScript()

  domComponents.addType(WB_CARD_CAROUSEL_SECTION_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'card-carousel-section'
        ? { type: WB_CARD_CAROUSEL_SECTION_TYPE }
        : false,
    model: {
      defaults: {
        name: '通用卡片轮播',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        removable: true,
        attributes: {
          'data-wb-component': 'card-carousel-section',
          'data-desktop-slides': '3',
          'data-mobile-slides': '1.3',
          'data-space-between': '24',
          'data-show-title': 'false',
          'data-show-subtitle': 'false',
          class: 'wb-card-carousel-section',
        },
        styles: CARD_CAROUSEL_CSS,
        sectionTitle: 'Card Carousel',
        sectionSubtitle: 'A reusable configurable card carousel section.',
        showTitle: false,
        showSubtitle: false,
        cardsCount: 4,
        desktopSlides: 3,
        mobileSlides: 1.3,
        spaceBetween: 24,
        'script-props': ['desktopSlides', 'mobileSlides', 'spaceBetween', 'cardsCount'],
        script: carouselScript,
        'script-export': carouselScript,
        traits: [
          makeCheckboxTrait('显示标题', 'showTitle'),
          makeTextTrait('标题', 'sectionTitle', { placeholder: '请输入标题' }),
          makeCheckboxTrait('显示副标题', 'showSubtitle'),
          makeTextTrait('副标题', 'sectionSubtitle', { placeholder: '请输入副标题' }),
          makeNumberTrait('卡片数量', 'cardsCount', { min: 1, max: 12, step: 1 }),
          makeNumberTrait('电脑端显示', 'desktopSlides', { min: 1, max: 12, step: 0.1 }),
          makeNumberTrait('移动端显示', 'mobileSlides', { min: 1, max: 3, step: 0.1 }),
          makeNumberTrait('卡片间距', 'spaceBetween', { min: 0, max: 80, step: 1 }),
        ],
        components: buildSectionTree(4),
      },
      init(this: any) {
        this._hydrateSectionFromDom?.()
        this.on(
          'change:cardsCount change:desktopSlides change:mobileSlides change:spaceBetween change:sectionTitle change:sectionSubtitle change:showTitle change:showSubtitle',
          this.applyConfig,
        )
        this.applyConfig()
      },
      _getHeader(this: any) {
        return this.components?.()?.at?.(0)?.components?.()?.at?.(0) ?? null
      },
      _getTrack(this: any) {
        return this.components?.()?.at?.(0)?.components?.()?.at?.(1)?.components?.()?.at?.(1)?.components?.()?.at?.(0) ?? null
      },
      _readText(this: any, component: any): string {
        const children = component?.components?.()?.models || []
        const text = children
          .map((child: any) => child?.get?.('content') ?? child?.toHTML?.() ?? '')
          .join('')
          .trim()
        return text || `${component?.getEl?.()?.textContent || ''}`.trim()
      },
      _toBoolean(this: any, value: any, fallback: boolean): boolean {
        if (value === undefined || value === null || value === '') return fallback
        return value !== false && value !== 'false'
      },
      _hydrateSectionFromDom(this: any) {
        const attrs = this.getAttributes?.() || {}
        const header = this._getHeader?.()
        const titleEl = header?.components?.()?.at?.(0)
        const subtitleEl = header?.components?.()?.at?.(1)
        const track = this._getTrack?.()
        const cardTotal = track?.components?.()?.length

        if (attrs['data-desktop-slides']) {
          this.set('desktopSlides', attrs['data-desktop-slides'], { silent: true })
        }
        if (attrs['data-mobile-slides']) {
          this.set('mobileSlides', attrs['data-mobile-slides'], { silent: true })
        }
        if (attrs['data-space-between']) {
          this.set('spaceBetween', attrs['data-space-between'], { silent: true })
        }
        if (attrs['data-show-title'] !== undefined) {
          this.set('showTitle', this._toBoolean?.(attrs['data-show-title'], false), { silent: true })
        }
        if (attrs['data-show-subtitle'] !== undefined) {
          this.set('showSubtitle', this._toBoolean?.(attrs['data-show-subtitle'], false), { silent: true })
        }
        if (titleEl) {
          this.set('sectionTitle', this._readText?.(titleEl), { silent: true })
        }
        if (subtitleEl) {
          this.set('sectionSubtitle', this._readText?.(subtitleEl), { silent: true })
        }
        if (Number.isFinite(cardTotal) && cardTotal > 0) {
          this.set('cardsCount', cardTotal, { silent: true })
        }
      },
      _rerunScript(this: any) {
        const el = this.getEl?.()
        const script = this.get?.('script')
        if (!el || typeof script !== 'function') return
        window.setTimeout(() => {
          script.call(el, {
            desktopSlides: this.get('desktopSlides'),
            mobileSlides: this.get('mobileSlides'),
            spaceBetween: this.get('spaceBetween'),
            cardsCount: this.get('cardsCount'),
          })
        }, 60)
      },
      applyConfig(this: any) {
        const cardsCount = Math.round(clamp(this.get('cardsCount'), 1, 12, 4))
        const desktopSlides = clamp(this.get('desktopSlides'), 1, 12, 3)
        const mobileSlides = clamp(this.get('mobileSlides'), 1, 3, 1.3)
        const spaceBetween = clamp(this.get('spaceBetween'), 0, 80, 24)
        const sectionTitle = `${this.get('sectionTitle') || 'Card Carousel'}`.trim()
        const sectionSubtitle = `${this.get('sectionSubtitle') || ''}`.trim()
        const showTitle = this._toBoolean?.(this.get('showTitle'), false)
        const showSubtitle = this._toBoolean?.(this.get('showSubtitle'), false)

        this.set(
          {
            cardsCount,
            desktopSlides,
            mobileSlides,
            spaceBetween,
          },
          { silent: true },
        )
        this.addAttributes?.({
          'data-desktop-slides': String(desktopSlides),
          'data-mobile-slides': String(mobileSlides),
          'data-space-between': String(spaceBetween),
          'data-show-title': String(showTitle),
          'data-show-subtitle': String(showSubtitle),
        })

        const header = this._getHeader?.()
        const titleEl = header?.components?.()?.at?.(0)
        const subtitleEl = header?.components?.()?.at?.(1)
        titleEl?.components?.(sectionTitle || 'Card Carousel')
        subtitleEl?.components?.(sectionSubtitle)
        header?.addStyle?.({ display: showTitle || showSubtitle ? '' : 'none' })
        titleEl?.addStyle?.({ display: showTitle ? '' : 'none' })
        subtitleEl?.addStyle?.({ display: showSubtitle ? '' : 'none' })

        const track = this._getTrack?.()
        const cards = track?.components?.()
        if (cards) {
          const current = cards.length || 0
          if (current < cardsCount) {
            for (let i = current; i < cardsCount; i += 1) {
              cards.add(createCardDef(i))
            }
          } else if (current > cardsCount) {
            for (let i = current - 1; i >= cardsCount; i -= 1) {
              cards.remove(cards.at(i))
            }
          }
        }

        this._rerunScript?.()
      },
    },
  })

  blockManager?.add?.(WB_CARD_CAROUSEL_SECTION_TYPE, {
    label: '通用卡片轮播',
    category: 'Section',
    content: { type: WB_CARD_CAROUSEL_SECTION_TYPE },
    media: BLOCK_ICON,
  })
}
