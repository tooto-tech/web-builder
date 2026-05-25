import { WB_IMAGE_TYPE } from '@/components/WebBuilder/components/registries/media/image'
import type { Editor } from 'grapesjs'

export const WB_FOCA_HISTORY_TIMELINE_TYPE = 'wb-foca-history-timeline'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 12h16" />
  <circle cx="7" cy="12" r="1.8" />
  <circle cx="12" cy="12" r="1.8" />
  <circle cx="17" cy="12" r="1.8" />
  <path d="M12 4v3" />
  <path d="M12 17v3" />
</svg>`

const SVG_PREV = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M14.78 4.72a.75.75 0 0 1 0 1.06L8.56 12l6.22 6.22a.75.75 0 0 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 0 1 1.06 0" clip-rule="evenodd"/></svg>`
const SVG_NEXT = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M9.22 4.72a.75.75 0 0 1 1.06 0l6.75 6.75a.75.75 0 0 1 0 1.06l-6.75 6.75a.75.75 0 1 1-1.06-1.06L15.44 12L9.22 5.78a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/></svg>`

const CARDS = [
  {
    title: '2025: The Future of AI',
    description:
      'FOCA is no longer limited to hardware sales but provides a full-chain solution of "hardware + cloud services," deeply interconnected with smart home platforms, ushering in an era of proactive services in the bathroom space.',
    image:
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: '2021: Scene Reconstruction',
    description:
      'FOCA rebuilt bathroom scenarios around people and data, making products, control systems, and service response seamlessly connected for a more intuitive daily experience.',
    image:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: '2015: Brand Elevation',
    description:
      'Through design-led upgrades and stronger channel strategy, FOCA established a clear brand language and expanded from product delivery to full-space experience solutions.',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: '2008: National Expansion',
    description:
      'FOCA accelerated nationwide growth with standardized manufacturing and service systems, building a stronger operational backbone for long-term market development.',
    image:
      'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: '1998: The FOCA Beginning',
    description:
      'From its earliest stage, FOCA focused on quality craftsmanship and practical innovation, laying the foundation for becoming a trusted brand in modern bathroom solutions.',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80'
  }
]

const FOCA_HISTORY_CSS_RAW = `
  [data-wb-component="foca-history-timeline"] {
    overflow: hidden;
    box-sizing: border-box;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__inner {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 68px;
    box-sizing: border-box;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__title {
    margin: 0;
    color: #061420;
    font-size: 48px;
    line-height: 130%;
    font-weight: 600;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__controls {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__nav {
    width: 46px;
    height: 46px;
    border: none;
    background: transparent;
    color: #0b496d;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 180ms ease, opacity 180ms ease;
    padding: 0;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__nav.is-disabled,
  [data-wb-component="foca-history-timeline"] .wb-foca-history__nav.swiper-button-disabled {
    opacity: 0.35;
    pointer-events: none;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__swiper {
    margin-top: 42px;
    overflow: visible;
    width: calc(100vw - ((100vw - 100%) / 2));
    max-width: none;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__slide {
    height: auto;
    display: flex;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__card {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__media {
    width: 100%;
    aspect-ratio: 1.45;
    overflow: hidden;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__media [data-wb-component="image"],
  [data-wb-component="foca-history-timeline"] .wb-foca-history__media a,
  [data-wb-component="foca-history-timeline"] .wb-foca-history__media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__body {
    padding: 20px;
    box-sizing: border-box;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__card-title {
    margin: 0;
    color: #061420;
    font-size: 24px;
    line-height: 140%;
    font-weight: 500;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__description {
    margin: 16px 0 0;
    color: #6f7f8b;
    font-size: 14px;
    line-height: 160%;
    font-weight: 400;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__timeline {
    margin-top: 54px;
    position: relative;
    width: calc(100vw - ((100vw - 100%) / 2));
    max-width: none;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__timeline::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 5px;
    height: 2px;
    background: #b7c7d5;
    z-index: 0;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__dots {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 12px;
  }
  [data-wb-component="foca-history-timeline"] .wb-foca-history__dot {
    position: absolute;
    top: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 0;
    background: #003152;
    padding: 0;
    transform: translateX(-50%);
  }
  .wb-foca-history .wb-foca-history__swiper .swiper-wrapper {
    height: auto;  
  }
  @media (max-width: 1439px) {
    [data-wb-component="foca-history-timeline"] .wb-foca-history__inner {
      padding: 0 48px;
    }
  }
  @media (max-width: 1199px) {
    [data-wb-component="foca-history-timeline"] .wb-foca-history__inner {
      padding: 0 32px;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__swiper,
    [data-wb-component="foca-history-timeline"] .wb-foca-history__timeline {
      width: 100%;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__swiper {
      overflow: hidden;
    }
  }
  @media (max-width: 767px) {
    [data-wb-component="foca-history-timeline"] .wb-foca-history__inner {
      padding: 0 16px;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__card-title {
      font-size: 16px;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__controls {
      display: none;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__swiper {
      margin-top: 26px;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__body {
      padding: 16px 12px 12px;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__description {
      margin-top: 12px;
      -webkit-line-clamp: 6;
      font-size: 13px;
    }
    [data-wb-component="foca-history-timeline"] .wb-foca-history__timeline {
      margin-top: 26px;
    }

  }
`

const FOCA_HISTORY_CSS = FOCA_HISTORY_CSS_RAW.replaceAll(
  '[data-wb-component="foca-history-timeline"]',
  '.wb-foca-history'
)

function buildCard(index: number) {
  const card = CARDS[index] ?? CARDS[0]

  return {
    tagName: 'article',
    name: `历史卡片 ${index + 1}`,
    draggable: false,
    droppable: false,
    selectable: true,
    editable: false,
    copyable: false,
    removable: false,
    attributes: { class: 'swiper-slide wb-foca-history__slide' },
    components: [
      {
        tagName: 'div',
        draggable: false,
        droppable: false,
        selectable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-foca-history__card' },
        components: [
          {
            tagName: 'div',
            draggable: false,
            droppable: false,
            selectable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-foca-history__media' },
            components: [
              {
                type: WB_IMAGE_TYPE,
                imageSrc: card.image,
                imageAlt: card.title,
                imageObjectFit: 'cover',
                draggable: false,
                removable: false,
                copyable: false,
                style: {
                  width: '100%',
                  height: '100%',
                  'max-width': 'none',
                  overflow: 'hidden',
                  'margin-left': '0',
                  'margin-right': '0'
                }
              }
            ]
          },
          {
            tagName: 'div',
            draggable: false,
            droppable: true,
            selectable: true,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-foca-history__body' },
            components: [
              {
                tagName: 'h3',
                type: 'text',
                draggable: false,
                droppable: false,
                selectable: true,
                copyable: false,
                removable: false,
                attributes: { class: 'wb-foca-history__card-title' },
                components: card.title
              },
              {
                tagName: 'p',
                type: 'text',
                draggable: false,
                droppable: false,
                selectable: true,
                copyable: false,
                removable: false,
                attributes: { class: 'wb-foca-history__description' },
                components: card.description
              }
            ]
          }
        ]
      }
    ]
  }
}

function makeFocaHistoryScript() {
  return function () {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this as any

    if (root._wbFocaHistoryCleanup) {
      try {
        root._wbFocaHistoryCleanup()
      } catch (_) {}
    }

    let disposed = false
    let observer: MutationObserver | null = null
    let rafId = 0

    function destroySwiper() {
      if (!root._wbFocaHistorySwiper) return
      try {
        root._wbFocaHistorySwiper.destroy(true, true)
      } catch (_) {}
      root._wbFocaHistorySwiper = null
    }

    function ensureAssets() {
      return new Promise<void>((resolve) => {
        const w = window as any
        if (w.Swiper) {
          resolve()
          return
        }

        if (!document.querySelector('link[data-wb-swiper]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
          link.setAttribute('data-wb-swiper', '1')
          document.head.appendChild(link)
        }

        const existing = document.querySelector(
          'script[data-wb-swiper]'
        ) as HTMLScriptElement | null
        if (existing) {
          if ((window as any).Swiper) {
            resolve()
            return
          }
          existing.addEventListener('load', () => resolve(), { once: true })
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
        script.async = true
        script.setAttribute('data-wb-swiper', '1')
        script.onload = () => resolve()
        document.body.appendChild(script)
      })
    }

    function getMaxIndex(swiper: any) {
      const snapCount = Number(swiper?.snapGrid?.length || 1)
      return Math.max(0, snapCount - 1)
    }

    function getCurrentIndex(swiper: any) {
      const active = Number(swiper?.realIndex ?? swiper?.activeIndex ?? 0)
      if (!Number.isFinite(active)) return 0
      const maxIndex = getMaxIndex(swiper)
      return Math.max(0, Math.min(maxIndex, active))
    }

    function getDecorativeDotCount() {
      const totalSlides = root.querySelectorAll('.wb-foca-history__slide').length
      const viewport = window.innerWidth || 1920
      let visibleCount = 1
      if (viewport >= 1200) visibleCount = 3
      else if (viewport >= 768) visibleCount = 2
      return Math.max(1, Math.min(totalSlides, visibleCount))
    }

    function getCurrentSlidesPerView(swiper: any) {
      const parsed = Number(
        swiper?.params?.slidesPerView ?? swiper?.originalParams?.slidesPerView ?? 1
      )
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    }

    function updateControls(swiper: any) {
      const prevBtn = root.querySelector('.wb-foca-history__nav-prev') as HTMLElement | null
      const nextBtn = root.querySelector('.wb-foca-history__nav-next') as HTMLElement | null
      const index = getCurrentIndex(swiper)
      const maxIndex = getMaxIndex(swiper)

      if (prevBtn) {
        const disabled = index <= 0
        prevBtn.classList.toggle('is-disabled', disabled)
        prevBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false')
      }
      if (nextBtn) {
        const disabled = index >= maxIndex
        nextBtn.classList.toggle('is-disabled', disabled)
        nextBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false')
      }
    }

    function renderDots(swiper: any) {
      const dots = root.querySelector('.wb-foca-history__dots') as HTMLElement | null
      if (!dots) {
        updateControls(swiper)
        return
      }

      const count = getDecorativeDotCount()
      dots.innerHTML = ''

      const viewportEl = root.querySelector('.wb-foca-history__swiper') as HTMLElement | null
      const viewportWidth = viewportEl?.clientWidth || 0
      const slidesPerView = getCurrentSlidesPerView(swiper)
      const gap =
        Number(swiper?.params?.spaceBetween ?? swiper?.originalParams?.spaceBetween ?? 0) || 0
      const slideWidth =
        slidesPerView > 0
          ? (viewportWidth - gap * (slidesPerView - 1)) / slidesPerView
          : viewportWidth

      for (let i = 0; i < count; i++) {
        const dot = document.createElement('span')
        dot.className = 'wb-foca-history__dot'
        const center = slideWidth / 2 + i * (slideWidth + gap)
        dot.style.left = `${center}px`
        dots.appendChild(dot)
      }

      updateControls(swiper)
    }

    function initSwiper() {
      const w = window as any
      if (!w.Swiper) return

      const swiperEl = root.querySelector('.wb-foca-history__swiper') as HTMLElement | null
      const prevEl = root.querySelector('.wb-foca-history__nav-prev') as HTMLElement | null
      const nextEl = root.querySelector('.wb-foca-history__nav-next') as HTMLElement | null
      if (!swiperEl) return

      destroySwiper()
      root._wbFocaHistorySwiper = new w.Swiper(swiperEl, {
        slidesPerView: 1.5,
        spaceBetween: 32,
        speed: 520,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        breakpoints: {
          768: {
            slidesPerView: 1.75,
            spaceBetween: 64
          },
          1200: {
            slidesPerView: 2.7,
            spaceBetween: 64
          }
        },
        navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
        on: {
          init: function () {
            renderDots(this)
          },
          slideChange: function () {
            renderDots(this)
          },
          resize: function () {
            renderDots(this)
          },
          breakpoint: function () {
            renderDots(this)
          }
        }
      })

      renderDots(root._wbFocaHistorySwiper)
    }

    function scheduleRefresh() {
      cancelAnimationFrame(rafId)
      rafId = window.requestAnimationFrame(() => {
        if (disposed) return
        initSwiper()
      })
    }

    ensureAssets().then(() => {
      if (disposed) return

      initSwiper()

      const wrapper = root.querySelector(
        '.wb-foca-history__swiper .swiper-wrapper'
      ) as HTMLElement | null
      if (wrapper) {
        observer = new MutationObserver(() => {
          scheduleRefresh()
        })
        observer.observe(wrapper, { childList: true, subtree: false })
      }
    })

    root._wbFocaHistoryCleanup = function () {
      disposed = true
      cancelAnimationFrame(rafId)
      if (observer) observer.disconnect()
      destroySwiper()
      root._wbFocaHistoryCleanup = null
    }
  }
}

export function registerFocaHistoryTimelineComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_FOCA_HISTORY_TIMELINE_TYPE)) {
    return
  }

  const script = makeFocaHistoryScript()

  domComponents.addType(WB_FOCA_HISTORY_TIMELINE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'foca-history-timeline'
        ? { type: WB_FOCA_HISTORY_TIMELINE_TYPE }
        : false,
    model: {
      defaults: {
        name: 'FOCA 历程（固定5卡）',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'foca-history-timeline',
          class: 'wb-foca-history'
        },
        style: {
          padding: '64px 0 56px'
        },
        styles: FOCA_HISTORY_CSS,
        script,
        'script-export': script,
        components: [
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            copyable: false,
            draggable: false,
            highlightable: false,
            attributes: { class: 'wb-foca-history__inner' },
            components: [
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                copyable: false,
                draggable: false,
                highlightable: false,
                attributes: { class: 'wb-foca-history__header' },
                components: [
                  {
                    tagName: 'h2',
                    type: 'text',
                    removable: false,
                    selectable: true,
                    droppable: false,
                    copyable: false,
                    draggable: false,
                    attributes: { class: 'wb-foca-history__title' },
                    components: 'The History of FOCA'
                  },
                  {
                    tagName: 'div',
                    removable: false,
                    selectable: false,
                    droppable: false,
                    copyable: false,
                    draggable: false,
                    highlightable: false,
                    attributes: { class: 'wb-foca-history__controls' },
                    components: [
                      {
                        tagName: 'button',
                        removable: false,
                        selectable: false,
                        droppable: false,
                        copyable: false,
                        draggable: false,
                        highlightable: false,
                        attributes: {
                          class: 'wb-foca-history__nav wb-foca-history__nav-prev',
                          type: 'button',
                          'aria-label': 'Previous card'
                        },
                        components: SVG_PREV
                      },
                      {
                        tagName: 'button',
                        removable: false,
                        selectable: false,
                        droppable: false,
                        copyable: false,
                        draggable: false,
                        highlightable: false,
                        attributes: {
                          class: 'wb-foca-history__nav wb-foca-history__nav-next',
                          type: 'button',
                          'aria-label': 'Next card'
                        },
                        components: SVG_NEXT
                      }
                    ]
                  }
                ]
              },
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                copyable: false,
                draggable: false,
                highlightable: false,
                attributes: { class: 'swiper wb-foca-history__swiper' },
                components: [
                  {
                    tagName: 'div',
                    removable: false,
                    selectable: false,
                    droppable: false,
                    copyable: false,
                    draggable: false,
                    highlightable: false,
                    attributes: { class: 'swiper-wrapper' },
                    components: CARDS.map((_, index) => buildCard(index))
                  }
                ]
              },
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                copyable: false,
                draggable: false,
                highlightable: false,
                attributes: { class: 'wb-foca-history__timeline' },
                components: [
                  {
                    tagName: 'div',
                    removable: false,
                    selectable: false,
                    droppable: false,
                    copyable: false,
                    draggable: false,
                    highlightable: false,
                    attributes: { class: 'wb-foca-history__dots' }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  })

  if (!blockManager?.get?.(WB_FOCA_HISTORY_TIMELINE_TYPE)) {
    blockManager?.add?.(WB_FOCA_HISTORY_TIMELINE_TYPE, {
      label: 'FOCA 历程（固定5卡）',
      category: 'Section',
      content: { type: WB_FOCA_HISTORY_TIMELINE_TYPE },
      media: BLOCK_ICON
    })
  }
}
