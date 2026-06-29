import type { Editor } from 'grapesjs'
import { exposeSwiperRuntimeToCanvas } from '../swiperRuntime.js'

export const WB_MORE_CARD_CAROUSEL_TYPE = 'wb-more-card-carousel'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="6" width="7" height="12" rx="1.5" />
  <rect x="14" y="6" width="7" height="12" rx="1.5" />
</svg>`

const ARROW_LEFT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="26.499998092651367" height="70" viewBox="0 0 26.499998092651367 70"><path d="M-0.12199329999999997,32.982742L25.590118,69.786354L26.409878,69.213646L1.1219932400000001,33.017262L26.393368,0.80864343L25.606628,0.19135657L-0.12199329999999997,32.982742Z" fill-rule="evenodd" fill="#000000" fill-opacity="1"/></svg>`

const ARROW_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="26.499998092651367" height="70" viewBox="0 0 26.499998092651367 70"><g transform="matrix(-1,0,0,1,51.999996185302734,0)"><path d="M25.378004792651367,32.982742L51.09011609265137,69.786354L51.909876092651366,69.213646L26.621991332651366,33.017262L51.89336609265136,0.80864343L51.10662609265137,0.19135657L25.378004792651367,32.982742Z" fill-rule="evenodd" fill="#000000" fill-opacity="1"/></g></svg>`

type MoreCardItem = {
  title: string
  subtitle: string
  image: string
  href: string
}

const DEFAULT_CARDS: MoreCardItem[] = [
  {
    title: 'Machine tool industry',
    subtitle: 'Spindle Bearings ｜ Feed System Bearings',
    image: 'https://images.unsplash.com/photo-1572890013112-4f3b6d25b5f8?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Pump Industry',
    subtitle: 'Spindle Bearings ｜ Feed System Bearings',
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Mining machinery',
    subtitle: 'Spindle Bearings ｜ Feed System Bearings',
    image: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Construction machinery',
    subtitle: 'Spindle Bearings ｜ Feed System Bearings',
    image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
]

const MORE_CARD_CAROUSEL_CSS = `
  .wb-more-card-carousel {
    width: 100%;
    padding: 0;
    background: #fff;
    box-sizing: border-box;
    --wb-more-card-gap: 20px;
  }
  .wb-more-card-carousel,
  .wb-more-card-carousel * {
    box-sizing: border-box;
  }
  .wb-more-card-carousel__shell {
    width: 100%;
    position: relative;
    min-width: 0;
  }
  .wb-more-card-carousel__swiper {
    width: 100%;
    overflow: hidden;
    min-width: 0;
  }
  .wb-more-card-carousel__wrapper {
    display: flex;
    align-items: stretch;
  }
  .wb-more-card-carousel__card {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .wb-more-card-carousel__media {
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #f2f3f5;
  }
  .wb-more-card-carousel__image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 320ms ease;
  }
  .wb-more-card-carousel__body {
    padding: 14px 8px 0;
    text-align: center;
  }
  .wb-more-card-carousel__title {
    margin: 0;
    color: #000;
    font-size: 20px;
    font-weight: 500;
    line-height: 20px;
    transition: color 220ms ease;
  }
  .wb-more-card-carousel__subtitle {
    margin: 10px 0 0;
    color: #7e8793;
    font-size: 12px;
    font-weight: 400;
    line-height: 24px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wb-more-card-carousel__link {
    display: inline-block;
    margin-top: 12px;
    color: #1b43ed;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    text-align: center;
    text-transform: capitalize;
    letter-spacing: 0;
    text-decoration: none;
  }
  .wb-more-card-carousel__card:hover .wb-more-card-carousel__image {
    transform: scale(1.05);
  }
  .wb-more-card-carousel__card:hover .wb-more-card-carousel__title {
    color: #315cff;
  }
  .wb-more-card-carousel__nav {
    position: absolute;
    top: 34%;
    z-index: 5;
    width: 42px;
    height: 86px;
    border: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wb-more-card-carousel__nav--prev {
    left: 0;
    transform: translateX(calc(-100% - 16px));
  }
  .wb-more-card-carousel__nav--next {
    right: 0;
    transform: translateX(calc(100% + 16px));
  }
  .wb-more-card-carousel__nav svg {
    display: block;
    width: 26.5px;
    height: 70px;
  }
  @media (max-width: 767px) {
    .wb-more-card-carousel__nav {
      display: none;
    }
    .wb-more-card-carousel__body {
      padding: 12px 4px 0;
    }
  }
`

function createCard(item: MoreCardItem) {
  return {
    tagName: 'article',
    selectable: true,
    hoverable: true,
    draggable: '.wb-more-card-carousel__wrapper',
    droppable: false,
    copyable: true,
    removable: true,
    attributes: {
      class: 'swiper-slide wb-more-card-carousel__card',
    },
    components: [
      {
        tagName: 'div',
        selectable: false,
        droppable: false,
        attributes: { class: 'wb-more-card-carousel__media' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            droppable: false,
            copyable: true,
            removable: true,
            attributes: {
              class: 'wb-more-card-carousel__image',
              src: item.image,
              alt: item.title,
            },
          },
        ],
      },
      {
        tagName: 'div',
        selectable: false,
        droppable: false,
        attributes: { class: 'wb-more-card-carousel__body' },
        components: [
          {
            tagName: 'h3',
            type: 'text',
            selectable: true,
            droppable: false,
            copyable: true,
            removable: true,
            attributes: { class: 'wb-more-card-carousel__title' },
            components: item.title,
          },
          {
            tagName: 'p',
            type: 'text',
            selectable: true,
            droppable: false,
            copyable: true,
            removable: true,
            attributes: { class: 'wb-more-card-carousel__subtitle' },
            components: item.subtitle,
          },
          {
            tagName: 'a',
            type: 'link',
            selectable: true,
            droppable: false,
            copyable: true,
            removable: true,
            attributes: {
              class: 'wb-more-card-carousel__link',
              href: item.href,
            },
            components: 'View Solutions',
          },
        ],
      },
    ],
  }
}

function makeMoreCardScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      __wbMoreCardCleanup?: (() => void) | null
      __wbMoreCardSwiper?: any
    }
    if (!root) return

    root.__wbMoreCardCleanup?.()
    root.__wbMoreCardSwiper?.destroy?.(true, true)
    root.__wbMoreCardSwiper = null

    const cleanupFns: Array<() => void> = []
    const swiperEl = root.querySelector('.wb-more-card-carousel__swiper') as HTMLElement | null
    const prevEl = root.querySelector('.wb-more-card-carousel__nav--prev') as HTMLElement | null
    const nextEl = root.querySelector('.wb-more-card-carousel__nav--next') as HTMLElement | null
    const SwiperCtor = (window as any).Swiper

    if (SwiperCtor && swiperEl) {
      root.__wbMoreCardSwiper = new SwiperCtor(swiperEl, {
        modules: (window as any).__wbSwiperModules?.Navigation
          ? [(window as any).__wbSwiperModules.Navigation]
          : undefined,
        slidesPerView: 4,
        spaceBetween: 20,
        speed: 520,
        watchOverflow: true,
        navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
        breakpoints: {
          0: { slidesPerView: 1.3, spaceBetween: 20 },
          768: { slidesPerView: 4, spaceBetween: 20 },
          1200: { slidesPerView: 4, spaceBetween: 20 },
        },
      })
      window.requestAnimationFrame(() => root.__wbMoreCardSwiper?.update?.())
    } else if (swiperEl) {
      const wrapper = swiperEl.querySelector('.wb-more-card-carousel__wrapper') as HTMLElement | null
      let offset = 0
      const getSlides = () =>
        Array.from(root.querySelectorAll('.wb-more-card-carousel__card')) as HTMLElement[]
      const getPerView = () => {
        if (window.matchMedia('(max-width: 767px)').matches) return 1.3
        return 4
      }
      const sync = () => {
        const slides = getSlides()
        const perView = getPerView()
        const gap = 20
        const maxOffset = Math.max(0, Math.ceil(slides.length - perView))
        offset = Math.max(0, Math.min(maxOffset, offset))
        if (wrapper) {
          wrapper.style.display = 'flex'
          wrapper.style.gap = `${gap}px`
          wrapper.style.transition = 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)'
        }
        slides.forEach((slide) => {
          slide.style.flex = `0 0 calc((100% - ${(perView - 1) * gap}px) / ${perView})`
        })
        const target = slides[offset]
        if (wrapper) {
          wrapper.style.transform = `translate3d(-${target?.offsetLeft || 0}px, 0, 0)`
        }
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

    root.__wbMoreCardCleanup = () => {
      cleanupFns.forEach((fn) => fn())
      root.__wbMoreCardCleanup = null
    }
  }
}

export function registerMoreCardCarouselComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_MORE_CARD_CAROUSEL_TYPE)) return

  const exposeSwiperToCanvas = () => {
    const canvasWindow = editor.Canvas?.getWindow?.() as any
    exposeSwiperRuntimeToCanvas(canvasWindow, ['Navigation'])
  }

  exposeSwiperToCanvas()
  editor.on?.('canvas:frame:load', exposeSwiperToCanvas)

  domComponents.addType(WB_MORE_CARD_CAROUSEL_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'more-card-carousel'
        ? { type: WB_MORE_CARD_CAROUSEL_TYPE }
        : false,

    model: {
      defaults: {
        name: 'More Card 轮播卡片',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        removable: true,
        attributes: {
          'data-wb-component': 'more-card-carousel',
          class: 'wb-more-card-carousel',
        },
        styles: MORE_CARD_CAROUSEL_CSS,
        script: makeMoreCardScript(),
        'script-export': makeMoreCardScript(),
        components: [
          {
            tagName: 'div',
            selectable: false,
            droppable: false,
            attributes: { class: 'wb-more-card-carousel__shell' },
            components: [
              {
                tagName: 'button',
                selectable: false,
                droppable: false,
                attributes: {
                  class: 'wb-more-card-carousel__nav wb-more-card-carousel__nav--prev',
                  type: 'button',
                  'aria-label': 'Previous',
                },
                components: ARROW_LEFT_SVG,
              },
              {
                tagName: 'div',
                selectable: false,
                droppable: false,
                attributes: { class: 'swiper wb-more-card-carousel__swiper' },
                components: [
                  {
                    tagName: 'div',
                    selectable: false,
                    droppable: true,
                    attributes: { class: 'swiper-wrapper wb-more-card-carousel__wrapper' },
                    components: DEFAULT_CARDS.map(createCard),
                  },
                ],
              },
              {
                tagName: 'button',
                selectable: false,
                droppable: false,
                attributes: {
                  class: 'wb-more-card-carousel__nav wb-more-card-carousel__nav--next',
                  type: 'button',
                  'aria-label': 'Next',
                },
                components: ARROW_RIGHT_SVG,
              },
            ],
          },
        ],
      },
      init(this: any) {
        this.on('change:components', this._onComponentsChange)
      },
      _onComponentsChange(this: any) {
        const script = this.get('script')
        if (script && typeof script === 'function') {
          setTimeout(() => {
            const el = this.getEl()
            if (el && script.call) {
              script.call(el)
            }
          }, 60)
        }
      },
    },
  })

  blockManager?.add?.(WB_MORE_CARD_CAROUSEL_TYPE, {
    label: 'More Card 轮播卡片',
    category: 'Section',
    content: { type: WB_MORE_CARD_CAROUSEL_TYPE },
    media: BLOCK_ICON,
  })
}
