import { WB_IMAGE_TYPE } from '../../media/image/index.js'
import type { Editor } from 'grapesjs'

export const WB_COMPANY_SCALE_TYPE = 'wb-company-scale'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
  <path d="M3.5 14h17" />
  <path d="M8 9h3" />
  <path d="M13 9h3" />
  <path d="M8 17h3" />
  <path d="M13 17h3" />
</svg>`

const SVG_PREV = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M14.78 4.72a.75.75 0 0 1 0 1.06L8.56 12l6.22 6.22a.75.75 0 0 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 0 1 1.06 0" clip-rule="evenodd"/></svg>`
const SVG_NEXT = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M9.22 4.72a.75.75 0 0 1 1.06 0l6.75 6.75a.75.75 0 0 1 0 1.06l-6.75 6.75a.75.75 0 1 1-1.06-1.06L15.44 12L9.22 5.78a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/></svg>`

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1800&q=80'
]

const COMPANY_SCALE_CSS = `
  .wb-company-scale {
    width: 100%;
    overflow: hidden;
    color: #061420;
    box-sizing: border-box;
    --swiper-pagination-color: #ffffff;
    --swiper-pagination-bullet-inactive-color: rgba(255, 255, 255, 0.35);
    --swiper-pagination-bullet-horizontal-gap: 6px;
    --swiper-pagination-bullet-width: 45px;
    --swiper-pagination-bullet-height: 2px;
    --swiper-pagination-bullet-border-radius: 0;
    --swiper-pagination-bottom: 60px;
    --swiper-pagination-top: auto;
  }
  .wb-company-scale,
  .wb-company-scale *,
  .wb-company-scale *::before,
  .wb-company-scale *::after {
    box-sizing: border-box;
  }
  .wb-company-scale__shell {
    width: 100%;
    display: flex;
    align-items: stretch;
    min-height: min(50vw, 720px);
  }
  .wb-company-scale__panel {
    flex: 1 1 auto;
    min-width: 0;
    position: relative;
    --wb-company-scale-panel-pad-x: clamp(32px, 6vw, 120px);
    --wb-company-scale-content-width: min(540px, 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    padding: clamp(32px, 6vw, 120px) var(--wb-company-scale-panel-pad-x);
    gap: 34px;
  }
  .wb-company-scale__content {
    width: var(--wb-company-scale-content-width);
    max-width: var(--wb-company-scale-content-width);
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .wb-company-scale__title {
    margin: 0;
    font-size: clamp(36px, 4.2vw, 72px);
    line-height: 1.12;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #061420;
  }
  .wb-company-scale__desc {
    margin: 0;
    max-width: 760px;
    font-size: clamp(16px, 1.2vw, 36px);
    line-height: 1.45;
    font-weight: 400;
    color: #73828d;
  }
  .wb-company-scale__nav {
    position: absolute;
    left: calc((100% - var(--wb-company-scale-content-width)) / 2);
    bottom: 100px;
    display: inline-flex;
    align-items: center;
    gap: 24px;
  }
  .wb-company-scale__nav-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    color: #003152;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: opacity 180ms ease;
  }
  .wb-company-scale__nav-btn:hover {
    opacity: 0.82;
  }
  .wb-company-scale__media-wrap {
    flex: 0 0 min(50vw, 720px);
    width: min(50vw, 720px);
    height: min(50vw, 720px);
    max-width: 720px;
    max-height: 720px;
    min-width: 360px;
    min-height: 360px;
    position: relative;
    overflow: hidden;
  }
  .wb-company-scale__swiper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .wb-company-scale__slide {
    width: 100%;
    height: 100%;
  }
  .wb-company-scale__image-shell {
    width: 100%;
    height: 100%;
  }
  .wb-company-scale__image-shell [data-wb-component="image"],
  .wb-company-scale__image-shell a,
  .wb-company-scale__image-shell img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
  .wb-company-scale__pagination {
    position: absolute;
    left: 50% !important;
    right: auto !important;
    width: auto !important;
    bottom: 60px !important;
    transform: translateX(-50%);
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wb-company-scale__pagination .swiper-pagination-bullet {
    width: 45px;
    height: 2px;
    border-top: 2px solid rgba(255, 255, 255, 0.35);
    border-radius: 0;
    opacity: 1;
    margin: 0 !important;
    transition: border-color 180ms ease;
  }
  .wb-company-scale__pagination .swiper-pagination-bullet-active {
    border-top-color: #ffffff;
  }
  @media (max-width: 768px) {
    .wb-company-scale {
      width: 100%;
      max-width: none;
      margin-left: 0;
      margin-right: 0;
      padding: 0 20px;
    }
    .wb-company-scale__shell {
      width: 100%;
      flex-direction: column;
      min-height: 0;
      gap: 32px;
    }
    .wb-company-scale__panel {
      padding: 0px;
      gap: 26px;
      --wb-company-scale-content-width: 100%;
    }
    .wb-company-scale__nav {
      position: static;
      left: auto;
      bottom: auto;
      gap: 0px;
      transform: translateX(-10px);
    }
    .wb-company-scale__content {
      max-width: 100%;
      gap: 14px;
    }
    .wb-company-scale__title {
      font-size: 64px;
      line-height: 1.14;
    }
    .wb-company-scale__desc {
      font-size: 14px;
      line-height: 1.5;
      max-width: 100%;
    }
    .wb-company-scale__media-wrap {
      flex: 0 0 auto;
      width: 100%;
      height: auto;
      min-width: 0;
      min-height: 0;
      max-width: none;
      overflow: visible;
    }
    .wb-company-scale__swiper {
      height: min(calc(100vw - 40px), 720px);
      overflow: visible;
    }
    .wb-company-scale__pagination {
      position: static !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      transform: none !important;
      margin-top: 32px;
    }
    .wb-company-scale__pagination .swiper-pagination-bullet {
      width: 22px;
      border: none;
      border-top: 1px solid rgba(0, 49, 82, 0.28);
      height: 1px;
    }
    .wb-company-scale__pagination .swiper-pagination-bullet-active {
      border-top-color: #003152;
    }
  }
`

function buildImageSlide(imageUrl: string, index: number) {
  return {
    tagName: 'article',
    name: `公司图片 ${index + 1}`,
    selectable: true,
    draggable: '.swiper-wrapper',
    droppable: false,
    copyable: true,
    removable: true,
    attributes: { class: 'swiper-slide wb-company-scale__slide' },
    components: [
      {
        tagName: 'div',
        selectable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-company-scale__image-shell' },
        components: [
          {
            type: WB_IMAGE_TYPE,
            imageSrc: imageUrl,
            imageAlt: `Company scale image ${index + 1}`,
            imageObjectFit: 'cover',
            style: {
              width: '100%',
              height: '100%',
              'max-width': 'none',
              'margin-left': '0',
              'margin-right': '0'
            }
          }
        ]
      }
    ]
  }
}

function makeCompanyScaleScript() {
  return function (this: HTMLElement) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this as any

    if (root.__wbCompanyScaleCleanup) {
      try {
        root.__wbCompanyScaleCleanup()
      } catch (_) {}
    }

    let disposed = false
    let observer: MutationObserver | null = null
    let rafId = 0
    let sourceSlideCount = 0

    function destroySwiper() {
      if (!root.__wbCompanyScaleSwiper) return
      try {
        root.__wbCompanyScaleSwiper.destroy(true, true)
      } catch (_) {}
      root.__wbCompanyScaleSwiper = null
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

    function getSourceSlideCount() {
      const withoutDuplicates = root.querySelectorAll(
        '.wb-company-scale__slide:not(.swiper-slide-duplicate)'
      ).length
      if (withoutDuplicates > 0) return withoutDuplicates
      return root.querySelectorAll('.wb-company-scale__slide').length
    }

    function initSwiper() {
      const w = window as any
      if (!w.Swiper) return

      const swiperEl = root.querySelector('.wb-company-scale__swiper') as HTMLElement | null
      const prevEl = root.querySelector('.wb-company-scale__nav-btn--prev') as HTMLElement | null
      const nextEl = root.querySelector('.wb-company-scale__nav-btn--next') as HTMLElement | null
      const paginationEl = root.querySelector('.wb-company-scale__pagination') as HTMLElement | null
      if (!swiperEl) return

      const slides = Array.from(root.querySelectorAll('.wb-company-scale__slide'))
      sourceSlideCount = getSourceSlideCount()
      // Swiper loop has a minimum slides requirement based on slidesPerView/slidesPerGroup.
      // Mobile uses 1.14 slidesPerView, so we require at least 3 slides to avoid loop warnings.
      const minSlidesForLoop = Math.ceil(1.14 + 1)
      const canLoop = slides.length >= minSlidesForLoop

      destroySwiper()
      root.__wbCompanyScaleSwiper = new w.Swiper(swiperEl, {
        loop: canLoop,
        rewind: !canLoop && slides.length > 1,
        speed: 600,
        slidesPerView: 1.14,
        spaceBetween: 14,
        breakpoints: {
          992: {
            slidesPerView: 1,
            spaceBetween: 0
          }
        },
        // autoplay:
        //   slides.length > 1
        //     ? {
        //         delay: 4300,
        //         disableOnInteraction: false,
        //         pauseOnMouseEnter: false
        //       }
        //     : false,
        navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
        pagination: paginationEl
          ? {
              el: paginationEl,
              clickable: true
            }
          : false
      })
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
        '.wb-company-scale__swiper .swiper-wrapper'
      ) as HTMLElement | null
      if (wrapper) {
        observer = new MutationObserver(() => {
          const nextCount = getSourceSlideCount()
          if (nextCount === sourceSlideCount) return
          sourceSlideCount = nextCount
          scheduleRefresh()
        })
        observer.observe(wrapper, { childList: true })
      }
    })

    root.__wbCompanyScaleCleanup = function () {
      disposed = true
      cancelAnimationFrame(rafId)
      if (observer) observer.disconnect()
      destroySwiper()
      root.__wbCompanyScaleCleanup = null
    }
  }
}

function createAddImageTrait() {
  return {
    type: 'button' as any,
    name: 'add-image-slide',
    label: false as const,
    text: '+ 添加图片',
    full: true,
    command(this: any, editor: Editor) {
      const selected = editor.getSelected?.() as any
      const target = selected?.closestType?.(WB_COMPANY_SCALE_TYPE) || selected
      if (!target || target.get?.('type') !== WB_COMPANY_SCALE_TYPE) return

      const wrapper = target
        .components?.()
        ?.at?.(0)
        ?.components?.()
        ?.at?.(1)
        ?.components?.()
        ?.at?.(0)
      const slides = wrapper?.components?.()
      if (!slides) return

      const created = slides.add(
        buildImageSlide(DEFAULT_IMAGES[slides.length % DEFAULT_IMAGES.length], slides.length || 0)
      )
      const next = Array.isArray(created) ? created[0] : created
      if (next) editor.select?.(next)
    }
  }
}

export function registerCompanyScaleComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_COMPANY_SCALE_TYPE)) {
    return
  }

  const script = makeCompanyScaleScript()

  domComponents.addType(WB_COMPANY_SCALE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'company-scale'
        ? { type: WB_COMPANY_SCALE_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Company Scale',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'company-scale',
          class: 'wb-company-scale'
        },
        style: {
          padding: '0'
        },
        styles: COMPANY_SCALE_CSS,
        script,
        'script-export': script,
        traits: [createAddImageTrait()],
        components: [
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            copyable: false,
            draggable: false,
            highlightable: false,
            attributes: { class: 'wb-company-scale__shell' },
            components: [
              {
                tagName: 'div',
                selectable: true,
                droppable: true,
                draggable: false,
                copyable: false,
                removable: false,
                stylable: true,
                attributes: { class: 'wb-company-scale__panel' },
                components: [
                  {
                    tagName: 'div',
                    selectable: false,
                    droppable: false,
                    draggable: false,
                    copyable: false,
                    removable: false,
                    attributes: { class: 'wb-company-scale__content' },
                    components: [
                      {
                        tagName: 'h2',
                        type: 'text',
                        selectable: true,
                        droppable: false,
                        draggable: false,
                        copyable: false,
                        removable: false,
                        attributes: { class: 'wb-company-scale__title' },
                        components: 'Company Scale'
                      },
                      {
                        tagName: 'p',
                        type: 'text',
                        selectable: true,
                        droppable: false,
                        draggable: false,
                        copyable: false,
                        removable: false,
                        attributes: { class: 'wb-company-scale__desc' },
                        components:
                          'Sustainable by Design, Artisan-Crafted for the Bathroom of Tomorrow. Doing the right thing and acting with common sense has always been our driving force.'
                      }
                    ]
                  },
                  {
                    tagName: 'div',
                    selectable: false,
                    droppable: false,
                    draggable: false,
                    copyable: false,
                    removable: false,
                    attributes: { class: 'wb-company-scale__nav' },
                    components: [
                      {
                        tagName: 'button',
                        selectable: false,
                        droppable: false,
                        draggable: false,
                        copyable: false,
                        removable: false,
                        attributes: {
                          class: 'wb-company-scale__nav-btn wb-company-scale__nav-btn--prev',
                          type: 'button',
                          'aria-label': 'Previous'
                        },
                        components: SVG_PREV
                      },
                      {
                        tagName: 'button',
                        selectable: false,
                        droppable: false,
                        draggable: false,
                        copyable: false,
                        removable: false,
                        attributes: {
                          class: 'wb-company-scale__nav-btn wb-company-scale__nav-btn--next',
                          type: 'button',
                          'aria-label': 'Next'
                        },
                        components: SVG_NEXT
                      }
                    ]
                  }
                ]
              },
              {
                tagName: 'div',
                selectable: false,
                droppable: false,
                draggable: false,
                copyable: false,
                removable: false,
                attributes: { class: 'wb-company-scale__media-wrap' },
                components: [
                  {
                    tagName: 'div',
                    selectable: false,
                    droppable: false,
                    draggable: false,
                    copyable: false,
                    removable: false,
                    attributes: { class: 'swiper wb-company-scale__swiper' },
                    components: [
                      {
                        tagName: 'div',
                        selectable: false,
                        droppable: true,
                        draggable: false,
                        copyable: false,
                        removable: false,
                        attributes: { class: 'swiper-wrapper' },
                        components: DEFAULT_IMAGES.map((src, index) => buildImageSlide(src, index))
                      }
                    ]
                  },
                  {
                    tagName: 'div',
                    selectable: false,
                    droppable: false,
                    draggable: false,
                    copyable: false,
                    removable: false,
                    attributes: { class: 'wb-company-scale__pagination' }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  })

  if (!blockManager?.get?.(WB_COMPANY_SCALE_TYPE)) {
    blockManager?.add?.(WB_COMPANY_SCALE_TYPE, {
      label: 'Company Scale',
      category: 'Section',
      content: { type: WB_COMPANY_SCALE_TYPE },
      media: BLOCK_ICON
    })
  }
}
