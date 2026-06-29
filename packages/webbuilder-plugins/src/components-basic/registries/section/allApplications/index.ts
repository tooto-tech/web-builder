import type { Editor } from 'grapesjs'
import { defineGrapesTraits } from '../../../traitFactory.js'
import { exposeSwiperRuntimeToCanvas } from '../swiperRuntime.js'

export const WB_ALL_APPLICATIONS_TYPE = 'wb-all-applications'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="5" width="5" height="7" rx="1" />
  <rect x="9.5" y="5" width="5" height="7" rx="1" />
  <rect x="16" y="5" width="5" height="7" rx="1" />
  <rect x="4" y="16" width="16" height="3" rx="1.5" />
</svg>`

const ARROW_LEFT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="26.499998092651367" height="70" viewBox="0 0 26.499998092651367 70"><path d="M-0.12199329999999997,32.982742L25.590118,69.786354L26.409878,69.213646L1.1219932400000001,33.017262L26.393368,0.80864343L25.606628,0.19135657L-0.12199329999999997,32.982742Z" fill-rule="evenodd" fill="#000000" fill-opacity="1"/></svg>`

const ARROW_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="26.499998092651367" height="70" viewBox="0 0 26.499998092651367 70"><g transform="matrix(-1,0,0,1,51.999996185302734,0)"><path d="M25.378004792651367,32.982742L51.09011609265137,69.786354L51.909876092651366,69.213646L26.621991332651366,33.017262L51.89336609265136,0.80864343L51.10662609265137,0.19135657L25.378004792651367,32.982742Z" fill-rule="evenodd" fill="#000000" fill-opacity="1"/></g></svg>`

type BearingItem = {
  title: string
  image: string
}

type ApplicationItem = {
  title: string
  image: string
  bearings: BearingItem[]
}

const DEFAULT_APPLICATIONS: ApplicationItem[] = [
  {
    title: 'X-ray Scanning Machine',
    image:
      'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=900&q=80',
    bearings: [
      {
        title: 'Super-precision bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Bearing+1',
      },
      {
        title: 'Pillow Block & Bearing',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Bearing+2',
      },
      {
        title: 'Thin section bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Bearing+3',
      },
    ],
  },
  {
    title: 'Automated Guided Vehicles',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
    bearings: [
      {
        title: 'Deep groove ball bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=AGV+1',
      },
      {
        title: 'Angular contact bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=AGV+2',
      },
      {
        title: 'Track roller bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=AGV+3',
      },
    ],
  },
  {
    title: 'Intelligent Logistics',
    image:
      'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=900&q=80',
    bearings: [
      {
        title: 'Conveyor bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Logistics+1',
      },
      {
        title: 'Roller bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Logistics+2',
      },
      {
        title: 'Insert bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Logistics+3',
      },
    ],
  },
  {
    title: 'Robots Industry',
    image:
      'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?auto=format&fit=crop&w=900&q=80',
    bearings: [
      {
        title: 'Crossed roller bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Robot+1',
      },
      {
        title: 'Harmonic drive bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Robot+2',
      },
      {
        title: 'Precision rotary bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Robot+3',
      },
    ],
  },
  {
    title: 'Aerospace Engines',
    image:
      'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=900&q=80',
    bearings: [
      {
        title: 'High-speed bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Engine+1',
      },
      {
        title: 'Ceramic hybrid bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Engine+2',
      },
      {
        title: 'Turbine shaft bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Engine+3',
      },
    ],
  },
  {
    title: 'Factory Sewing Machine',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    bearings: [
      {
        title: 'Needle roller bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Sewing+1',
      },
      {
        title: 'Miniature bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Sewing+2',
      },
      {
        title: 'Low-noise bearings',
        image: 'https://dummyimage.com/260x220/f7f8fa/111827&text=Sewing+3',
      },
    ],
  },
]

const ALL_APPLICATIONS_CSS = `
  .wb-all-applications {
    width: 100%;
    padding: 80px 0;
    background: #fff;
    color: #080b1d;
    font-family: Poppins, Arial, sans-serif;
    box-sizing: border-box;
  }
  .wb-all-applications,
  .wb-all-applications * {
    box-sizing: border-box;
  }
  .wb-all-applications__title {
    max-width: 1680px;
    margin: 0 auto 62px;
    color: #000;
    font-size: 56px;
    font-weight: 700;
    line-height: 64px;
    letter-spacing: 0;
  }
  .wb-all-applications__carousel-wrap {
    position: relative;
    width: 100%;
    min-width: 0;
    margin: 0 auto;
    --wb-all-applications-progress-x: 0px;
  }
  .wb-all-applications__swiper {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    padding: 4px;
  }
  .wb-all-applications__swiper .swiper-wrapper {
    display: flex;
    align-items: stretch;
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wb-all-applications__app {
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
  }
  .wb-all-applications__image-box {
    width: 100%;
    aspect-ratio: 235 / 302;
    border: 4px solid transparent;
    overflow: hidden;
    transition: border-color 220ms ease;
  }
  .wb-all-applications__app.is-active .wb-all-applications__image-box {
    border-color: #050505;
  }
  .wb-all-applications__image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 320ms ease;
  }
  .wb-all-applications__app:hover .wb-all-applications__image,
  .wb-all-applications__app.is-active .wb-all-applications__image {
    transform: scale(1.035);
  }
  .wb-all-applications__app-title {
    min-height: 54px;
    margin: 18px 0 0;
    color: #000;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
  }
  .wb-all-applications__nav {
    position: absolute;
    top: 42%;
    z-index: 5;
    width: 42px;
    height: 86px;
    border: 0;
    padding: 0;
    background: transparent;
    color: #111;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wb-all-applications__nav--prev {
    left: 0;
    transform: translateX(calc(-100% - 40px));
  }
  .wb-all-applications__nav--next {
    right: 0;
    transform: translateX(calc(100% + 40px));
  }
  .wb-all-applications__nav svg {
    display: block;
    width: 26.5px;
    height: 70px;
    pointer-events: none;
  }
  .wb-all-applications__bearing-groups {
    max-width: 1680px;
    margin: 40px auto 0;
  }
  .wb-all-applications__bearing-grid {
    display: none;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }
  .wb-all-applications__bearing-grid.is-active {
    display: grid;
    animation: wb-all-applications-fade-up 320ms ease both;
  }
  .wb-all-applications__bearing {
    min-height: 232px;
    padding: 32px 20px;
    background: #f7f8fa;
    display: grid;
    grid-template-columns: 150px 1fr;
    align-items: center;
    gap: 28px;
  }
  .wb-all-applications__bearing-media {
    height: 100%;
    display: flex;
    align-items: stretch;
  }
  .wb-all-applications__bearing-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .wb-all-applications__bearing-title {
    margin: 0;
    color: #000;
    font-size: 24px;
    font-weight: 600;
    line-height: 32px;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  @keyframes wb-all-applications-fade-up {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (max-width: 1024px) {
    .wb-all-applications {
      padding: 40px 0;
    }
    .wb-all-applications__title {
      margin-bottom: 40px;
      font-size: 52px;
      line-height: 60px;
    }
    .wb-all-applications__app-title {
      font-size: 14px;
      line-height: 20px;
    }
    .wb-all-applications__bearing-groups {
      margin-top: 40px;
    }
    .wb-all-applications__bearing-grid.is-active {
      grid-template-columns: 1fr;
    }
    .wb-all-applications__bearing-title {
      font-size: 24px;
      line-height: 32px;
    }
  }
  @media (max-width: 767px) {
    .wb-all-applications {
      padding: 40px 0;
    }
    .wb-all-applications__title {
      margin-bottom: 34px;
      font-size: 28px;
      line-height: 36px;
    }
    .wb-all-applications__swiper {
      padding: 0 0 34px;
    }
    .wb-all-applications__image-box {
      aspect-ratio: 670 / 302;
    }
    .wb-all-applications__app.is-active .wb-all-applications__image-box {
      box-shadow: none;
    }
    .wb-all-applications__app-title {
      min-height: 0;
      margin-top: 20px;
      font-size: 13px;
      font-weight: 400;
      line-height: 20px;
    }
    .wb-all-applications__nav {
      display: none;
    }
    .wb-all-applications__carousel-wrap::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 22px;
      width: 106px;
      height: 2px;
      transform: translateX(-50%);
      background:
        linear-gradient(#315cff, #315cff) var(--wb-all-applications-progress-x) 0 / 32px 2px no-repeat,
        #d4d4d4;
    }
    .wb-all-applications__bearing-groups {
      margin-top: 20px;
    }
    .wb-all-applications__bearing-grid {
      gap: 20px;
    }
    .wb-all-applications__bearing {
      grid-template-columns: 75px 1fr;
      gap: 28px;
      padding: 0px 10px;
      min-height: auto;
    }
    .wb-all-applications__bearing-title {
      font-size: 16px;
      line-height: 24px;
    }
  }
`

function makeAllApplicationsScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      _wbAllApplicationsSwiper?: any
      _wbAllApplicationsCleanup?: (() => void) | null
      _wbAllApplicationsNativeSlideTo?: ((index: number) => void) | null
    }
    if (!root) return

    root._wbAllApplicationsCleanup?.()
    root._wbAllApplicationsSwiper?.destroy?.(true, true)
    root._wbAllApplicationsSwiper = null
    root._wbAllApplicationsNativeSlideTo = null
    let autoplayTimer: number | null = null

    const getCards = () =>
      Array.from(root.querySelectorAll('.wb-all-applications__app')) as HTMLElement[]
    const getGroups = () =>
      Array.from(root.querySelectorAll('.wb-all-applications__bearing-grid')) as HTMLElement[]

    const setActive = (index: number) => {
      const cards = getCards()
      const groups = getGroups()
      const normalized = Math.max(0, Math.min(cards.length - 1, Number(index) || 0))
      const carouselWrap = root.querySelector('.wb-all-applications__carousel-wrap') as HTMLElement | null
      const progressMax = 74
      const progressX =
        cards.length > 1 ? (progressMax * normalized) / Math.max(1, cards.length - 1) : 0

      cards.forEach((card, cardIndex) => {
        card.classList.toggle('is-active', cardIndex === normalized)
      })
      groups.forEach((group, groupIndex) => {
        group.classList.toggle('is-active', groupIndex === normalized)
      })
      root.setAttribute('data-active-index', String(normalized))
      carouselWrap?.style.setProperty('--wb-all-applications-progress-x', `${progressX}px`)
    }

    const getAutoplayEnabled = () => root.getAttribute('data-autoplay') === 'true'
    const getActiveIndex = () => Number(root.getAttribute('data-active-index') || 0) || 0

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null
      const card = target?.closest?.('.wb-all-applications__app') as HTMLElement | null
      if (!card || !root.contains(card)) return
      const index = Number(card.getAttribute('data-index') || 0)
      setActive(index)
      root._wbAllApplicationsSwiper?.slideTo?.(index, 560)
    }

    const cleanupFns: Array<() => void> = []
    root.addEventListener('click', onClick)
    cleanupFns.push(() => root.removeEventListener('click', onClick))

    const SwiperCtor = (window as any).Swiper
    const swiperEl = root.querySelector('.wb-all-applications__swiper') as HTMLElement | null
    const prevEl = root.querySelector('.wb-all-applications__nav--prev') as HTMLElement | null
    const nextEl = root.querySelector('.wb-all-applications__nav--next') as HTMLElement | null

    const initNativeCarousel = () => {
      const wrapper = root.querySelector('.swiper-wrapper') as HTMLElement | null
      let offset = 0
      const getVisibleCount = () => {
        if (window.matchMedia('(max-width: 640px)').matches) return 1
        if (window.matchMedia('(max-width: 1024px)').matches) return 2
        return 5
      }
      const syncNative = () => {
        const cards = getCards()
        const visibleCount = getVisibleCount()
        const maxOffset = Math.max(0, cards.length - visibleCount)
        offset = Math.max(0, Math.min(maxOffset, offset))
        const gap = 16

        if (wrapper) {
          wrapper.style.display = 'flex'
          wrapper.style.gap = `${gap}px`
          wrapper.style.transition = 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1)'
          wrapper.style.willChange = 'transform'
        }

        cards.forEach((card) => {
          card.style.display = 'block'
          card.style.flex = `0 0 calc((100% - ${(visibleCount - 1) * gap}px) / ${visibleCount})`
        })
        const target = cards[offset]
        wrapper && (wrapper.style.transform = `translate3d(-${target?.offsetLeft || 0}px, 0, 0)`)
        if (prevEl) prevEl.style.opacity = offset <= 0 ? '.35' : '1'
        if (nextEl) nextEl.style.opacity = offset >= maxOffset ? '.35' : '1'
      }
      const onPrev = () => {
        offset -= 1
        syncNative()
        setActive(offset)
      }
      const onNext = () => {
        offset += 1
        syncNative()
        setActive(offset)
      }
      root._wbAllApplicationsNativeSlideTo = (index: number) => {
        offset = Number(index) || 0
        syncNative()
        setActive(offset)
      }
      prevEl?.addEventListener('click', onPrev)
      nextEl?.addEventListener('click', onNext)
      window.addEventListener('resize', syncNative)
      syncNative()
      cleanupFns.push(() => {
        prevEl?.removeEventListener('click', onPrev)
        nextEl?.removeEventListener('click', onNext)
        window.removeEventListener('resize', syncNative)
      })
    }

    if (SwiperCtor && swiperEl) {
      const swiper = new SwiperCtor(swiperEl, {
        modules: (window as any).__wbSwiperModules?.Navigation
          ? [
              (window as any).__wbSwiperModules.Navigation,
              ...(getAutoplayEnabled() && (window as any).__wbSwiperModules.Autoplay
                ? [(window as any).__wbSwiperModules.Autoplay]
                : []),
            ]
          : undefined,
        slidesPerView: 5,
        spaceBetween: 16,
        speed: 560,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        resizeObserver: true,
        updateOnWindowResize: true,
        navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
        autoplay: getAutoplayEnabled()
          ? {
              delay: 3200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
          : false,
        on: {
          slideChange(swiper: any) {
            setActive(Number(swiper?.realIndex ?? swiper?.activeIndex ?? 0) || 0)
          },
        },
        breakpoints: {
          0: { slidesPerView: 1, spaceBetween: 16 },
          641: { slidesPerView: 2, spaceBetween: 16 },
          1025: { slidesPerView: 5, spaceBetween: 16 },
        },
      })
      root._wbAllApplicationsSwiper = swiper
      window.requestAnimationFrame(() => {
        swiper.update?.()
        const measuredWidth = swiperEl.getBoundingClientRect?.().width || 0
        const viewportWidth = window.innerWidth || 0
        if (viewportWidth > 0 && measuredWidth > viewportWidth * 3) {
          swiper.destroy?.(true, true)
          root._wbAllApplicationsSwiper = null
          initNativeCarousel()
        }
      })
    } else {
      initNativeCarousel()
    }

    const initialIndex = Number(root.getAttribute('data-active-index') || 0) || 0
    setActive(initialIndex)
    if (getAutoplayEnabled() && !root._wbAllApplicationsSwiper) {
      autoplayTimer = window.setInterval(() => {
        const cards = getCards()
        if (!cards.length) return
        const nextIndex = (getActiveIndex() + 1) % cards.length
        root._wbAllApplicationsNativeSlideTo?.(nextIndex)
      }, 3200)
      cleanupFns.push(() => {
        if (autoplayTimer) window.clearInterval(autoplayTimer)
      })
    }
    root._wbAllApplicationsCleanup = () => {
      cleanupFns.forEach((cleanup) => cleanup())
      root._wbAllApplicationsCleanup = null
      root._wbAllApplicationsNativeSlideTo = null
    }
  }
}

function buildApplicationSlide(item: ApplicationItem, index: number) {
  return {
    tagName: 'article',
    selectable: true,
    droppable: false,
    draggable: '.swiper-wrapper',
    attributes: {
      class: `swiper-slide wb-all-applications__app${index === 0 ? ' is-active' : ''}`,
      'data-index': String(index),
    },
    components: [
      {
        tagName: 'div',
        selectable: false,
        droppable: false,
        attributes: { class: 'wb-all-applications__image-box' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            droppable: false,
            attributes: {
              class: 'wb-all-applications__image',
              src: item.image,
              alt: item.title,
            },
          },
        ],
      },
      {
        tagName: 'h3',
        type: 'text',
        selectable: true,
        droppable: false,
        attributes: { class: 'wb-all-applications__app-title' },
        components: item.title,
      },
    ],
  }
}

function buildBearingCard(item: BearingItem) {
  return {
    tagName: 'article',
    selectable: true,
    droppable: true,
    attributes: { class: 'wb-all-applications__bearing' },
    components: [
      {
        tagName: 'div',
        selectable: false,
        droppable: false,
        attributes: { class: 'wb-all-applications__bearing-media' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            droppable: false,
            attributes: {
              class: 'wb-all-applications__bearing-image',
              src: item.image,
              alt: item.title,
            },
          },
        ],
      },
      {
        tagName: 'h3',
        type: 'text',
        selectable: true,
        droppable: false,
        attributes: { class: 'wb-all-applications__bearing-title' },
        components: item.title,
      },
    ],
  }
}

function buildBearingGroup(item: ApplicationItem, index: number) {
  return {
    tagName: 'div',
    selectable: true,
    droppable: true,
    attributes: {
      class: `wb-all-applications__bearing-grid${index === 0 ? ' is-active' : ''}`,
      'data-index': String(index),
    },
    components: item.bearings.map(buildBearingCard),
  }
}

export function registerAllApplicationsComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_ALL_APPLICATIONS_TYPE)) return

  const exposeSwiperToCanvas = () => {
    const canvasWindow = editor.Canvas?.getWindow?.() as any
    exposeSwiperRuntimeToCanvas(canvasWindow, ['Autoplay', 'Navigation'])
  }

  exposeSwiperToCanvas()
  editor.on?.('canvas:frame:load', exposeSwiperToCanvas)

  domComponents.addType(WB_ALL_APPLICATIONS_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'all-applications'
        ? { type: WB_ALL_APPLICATIONS_TYPE }
        : false,

    model: {
      defaults: {
        name: 'All Applications',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'all-applications',
          'data-active-index': '0',
          'data-autoplay': 'false',
          class: 'wb-all-applications',
        },
        autoPlay: false,
        styles: ALL_APPLICATIONS_CSS,
        script: makeAllApplicationsScript(),
        'script-export': makeAllApplicationsScript(),
        traits: defineGrapesTraits([
          {
            type: 'select',
            label: '自动轮播',
            name: 'autoPlay',
            changeProp: true,
            options: [
              { value: 'false', label: '关闭' },
              { value: 'true', label: '开启' },
            ],
          },
        ]),
        components: [
          {
            tagName: 'h2',
            type: 'text',
            selectable: true,
            droppable: false,
            attributes: { class: 'wb-all-applications__title' },
            components: 'All Applications',
          },
          {
            tagName: 'div',
            selectable: false,
            droppable: false,
            attributes: { class: 'wb-all-applications__carousel-wrap' },
            components: [
              {
                tagName: 'button',
                selectable: false,
                droppable: false,
                attributes: {
                  class: 'wb-all-applications__nav wb-all-applications__nav--prev',
                  type: 'button',
                  'aria-label': 'Previous application',
                },
                components: ARROW_LEFT_SVG,
              },
              {
                tagName: 'div',
                selectable: false,
                droppable: false,
                attributes: { class: 'swiper wb-all-applications__swiper' },
                components: [
                  {
                    tagName: 'div',
                    selectable: false,
                    droppable: true,
                    attributes: { class: 'swiper-wrapper' },
                    components: DEFAULT_APPLICATIONS.map(buildApplicationSlide),
                  },
                ],
              },
              {
                tagName: 'button',
                selectable: false,
                droppable: false,
                attributes: {
                  class: 'wb-all-applications__nav wb-all-applications__nav--next',
                  type: 'button',
                  'aria-label': 'Next application',
                },
                components: ARROW_RIGHT_SVG,
              },
            ],
          },
          {
            tagName: 'div',
            selectable: false,
            droppable: true,
            attributes: { class: 'wb-all-applications__bearing-groups' },
            components: DEFAULT_APPLICATIONS.map(buildBearingGroup),
          },
        ],
      },
      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        const savedAutoPlay =
          String(attrs['data-autoplay'] || this.get('autoPlay') || 'false') === 'true'
        this.set('autoPlay', savedAutoPlay, { silent: true })
        this.on('change:autoPlay', this._syncAttrs)
        this._syncAttrs()
      },
      _syncAttrs(this: any) {
        this.addAttributes({
          'data-autoplay': String(this.get('autoPlay') === true || this.get('autoPlay') === 'true'),
        })
      },
    },
  })

  blockManager?.add?.(WB_ALL_APPLICATIONS_TYPE, {
    label: 'All Applications',
    category: 'Section',
    content: { type: WB_ALL_APPLICATIONS_TYPE },
    media: BLOCK_ICON,
  })
}
