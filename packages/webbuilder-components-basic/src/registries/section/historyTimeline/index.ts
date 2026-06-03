import { WB_IMAGE_TYPE } from '../../media/image/index.js'
import { makeNumberTrait, makeTextTrait } from '../../../traitFactory.js'
import type { Editor } from 'grapesjs'

export const WB_HISTORY_TIMELINE_TYPE = 'wb-history-timeline'

const WB_HISTORY_TIMELINE_SLIDE_TYPE = 'wb-history-timeline-slide'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3.5" y="5.5" width="17" height="10" rx="2" />
  <path d="M5 19.5h14" />
  <path d="M7 19.5v-2.5" />
  <path d="M12 19.5v-2.5" />
  <path d="M17 19.5v-2.5" />
</svg>`

const DEFAULT_YEARS = ['1993', '2005', '2015', '2022']
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80',
]
const DEFAULT_COPY =
  'With years of expertise in polymer coloring and modification, we focus on delivering stable, high-performing masterbatch solutions that help our customers improve.'

const HISTORY_TIMELINE_CSS = `
  [data-wb-component="history-timeline"] {
    background: #f4f7fb;
  }
  [data-wb-component="history-timeline"] .wb-history__inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  [data-wb-component="history-timeline"] .wb-history__swiper {
    overflow: visible;
  }
  [data-wb-component="history-timeline"] .wb-history__slide {
    height: auto;
    display: flex;
    align-items: stretch;
  }
  [data-wb-component="history-timeline"] .wb-history__card {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.14);
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
  }
  [data-wb-component="history-timeline"] .wb-history__media {
    aspect-ratio: 1.34;
    overflow: hidden;
    background: linear-gradient(135deg, #dfe7f2 0%, #eef3fb 100%);
  }
  [data-wb-component="history-timeline"] .wb-history__media [data-wb-component="image"],
  [data-wb-component="history-timeline"] .wb-history__media a,
  [data-wb-component="history-timeline"] .wb-history__media img {
    width: 100%;
    height: 100%;
    display: block;
  }
  [data-wb-component="history-timeline"] .wb-history__body {
    padding: 24px 24px 22px;
  }
  [data-wb-component="history-timeline"] .wb-history__description {
    color: #5b6779;
  }
  [data-wb-component="history-timeline"] .wb-history__timeline {
    margin-top: 24px;
    padding-top: 4px;
  }
  [data-wb-component="history-timeline"] .wb-history__timeline-nav {
    display: flex;
    gap: 28px;
    align-items: stretch;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  [data-wb-component="history-timeline"] .wb-history__timeline-nav::-webkit-scrollbar {
    display: none;
  }
  [data-wb-component="history-timeline"] .wb-history__year {
    position: relative;
    flex: 1 1 0;
    min-width: 120px;
    border: none;
    background: transparent;
    padding: 18px 0 0;
    color: #9aa7b5;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.1;
    text-align: left;
    cursor: pointer;
    transition: color 0.2s ease;
    white-space: nowrap;
  }
  [data-wb-component="history-timeline"] .wb-history__year::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    border-radius: 999px;
    background: #d6e0ec;
    transition: background-color 0.2s ease;
  }
  [data-wb-component="history-timeline"] .wb-history__year.is-active {
    color: #10203a;
  }
  [data-wb-component="history-timeline"] .wb-history__year.is-active::before {
    background: #2b62e8;
  }
  @media (max-width: 1023px) {
    [data-wb-component="history-timeline"] .wb-history__inner {
      padding: 0 20px;
    }
    [data-wb-component="history-timeline"] .wb-history__body {
      padding: 20px 20px 22px;
    }
    [data-wb-component="history-timeline"] .wb-history__timeline-nav {
      gap: 20px;
    }
    [data-wb-component="history-timeline"] .wb-history__year {
      font-size: 24px;
    }
  }
  @media (max-width: 767px) {
    [data-wb-component="history-timeline"] .wb-history__inner {
      padding: 0 16px;
    }
    [data-wb-component="history-timeline"] .wb-history__body {
      padding: 18px 18px 20px;
    }
    [data-wb-component="history-timeline"] .wb-history__description {
      font-size: 15px !important;
      line-height: 1.65 !important;
    }
    [data-wb-component="history-timeline"] .wb-history__timeline {
      margin-top: 18px;
    }
    [data-wb-component="history-timeline"] .wb-history__timeline-nav {
      gap: 14px;
    }
    [data-wb-component="history-timeline"] .wb-history__year {
      flex: 0 0 auto;
      min-width: 92px;
      font-size: 18px;
      padding-top: 14px;
    }
  }
`

function buildSlideContent(index: number, year: string) {
  return [
    {
      tagName: 'div',
      attributes: { class: 'wb-history__card' },
      selectable: false,
      droppable: false,
      copyable: false,
      removable: false,
      draggable: false,
      highlightable: false,
      components: [
        {
          tagName: 'div',
          attributes: { class: 'wb-history__media' },
          selectable: false,
          droppable: false,
          copyable: false,
          removable: false,
          draggable: false,
          highlightable: false,
          components: [
            {
              type: WB_IMAGE_TYPE,
              imageSrc: DEFAULT_IMAGES[index % DEFAULT_IMAGES.length],
              imageAlt: `History image ${year}`,
              imageObjectFit: 'cover',
              style: {
                width: '100%',
                height: '100%',
                'max-width': 'none',
                'margin-left': '0',
                'margin-right': '0',
                overflow: 'hidden',
              },
            },
          ],
        },
        {
          tagName: 'div',
          attributes: { class: 'wb-history__body' },
          selectable: true,
          droppable: true,
          components: [
            {
              tagName: 'p',
              type: 'text',
              attributes: { class: 'wb-history__description' },
              style: {
                margin: '0',
                color: '#516073',
                'font-size': '17px',
                'line-height': '1.75',
                'font-weight': '500',
              },
              components: DEFAULT_COPY,
            },
          ],
        },
      ],
    },
  ]
}

function buildSlideDef(index: number) {
  const year = DEFAULT_YEARS[index] ?? `${1993 + index * 5}`
  return {
    type: WB_HISTORY_TIMELINE_SLIDE_TYPE,
    historyYear: year,
    components: buildSlideContent(index, year),
  }
}

function resolveTimelineTraitTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_HISTORY_TIMELINE_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_HISTORY_TIMELINE_TYPE) as any
  if (fromSelected?.get?.('type') === WB_HISTORY_TIMELINE_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_HISTORY_TIMELINE_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_HISTORY_TIMELINE_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_HISTORY_TIMELINE_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_HISTORY_TIMELINE_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_HISTORY_TIMELINE_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_HISTORY_TIMELINE_TYPE) return fromTraitTarget

  return null
}

function createAddSlideTrait() {
  return {
    type: 'button' as any,
    name: 'add-slide',
    label: false as const,
    text: '+ 添加卡片',
    full: true,
    command(this: any, editor: Editor) {
      const timeline = resolveTimelineTraitTarget(editor, this)
      const wrapper = timeline?._getWrapper?.()
      const slides = wrapper?.components?.()
      if (!slides) return

      const created = slides.add(buildSlideDef(slides.length || 0))
      timeline?.set?.('slidesVersion', Number(timeline?.get?.('slidesVersion')) + 1 || 1)
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

function makeTimelineScript() {
  return function (this: any, props: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this

    if (root._wbHistoryCleanup) {
      try { root._wbHistoryCleanup() } catch (_) {}
    }

    let disposed = false
    let rafId = 0
    let observer: MutationObserver | null = null
    let resizeHandler: (() => void) | null = null

    function clamp(value: any, min: number, max: number, fallback: number) {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return fallback
      return Math.min(max, Math.max(min, parsed))
    }

    function destroySwiper() {
      if (!root._wbHistorySwiper) return
      try { root._wbHistorySwiper.destroy(true, true) } catch (_) {}
      root._wbHistorySwiper = null
    }

    function ensureSwiper() {
      return new Promise(function (resolve: any) {
        const w = window as any
        if (w.Swiper) {
          resolve()
          return
        }

        if (!document.querySelector('link[data-wb-swiper]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.setAttribute('data-wb-swiper', '1')
          link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
          document.head.appendChild(link)
        }

        const existing = document.querySelector('script[data-wb-swiper]') as HTMLScriptElement | null
        if (existing) {
          if ((window as any).Swiper) {
            resolve()
            return
          }
          existing.addEventListener('load', resolve, { once: true })
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
        script.async = true
        script.setAttribute('data-wb-swiper', '1')
        script.onload = resolve
        document.body.appendChild(script)
      })
    }

    function getSlides() {
      return Array.from(
        root.querySelectorAll('.wb-history__swiper .swiper-wrapper > .wb-history__slide'),
      ) as HTMLElement[]
    }

    function updateActiveYear(swiper: any) {
      const buttons = Array.from(root.querySelectorAll('.wb-history__year')) as HTMLElement[]
      if (!buttons.length) return

      const activeIndex = Math.max(
        0,
        Math.min(buttons.length - 1, Number(swiper?.realIndex ?? swiper?.activeIndex ?? 0) || 0),
      )

      buttons.forEach(function (button, index) {
        const isActive = index === activeIndex
        button.classList.toggle('is-active', isActive)
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
      })

      const activeButton = buttons[activeIndex]
      if (activeButton && window.innerWidth < 768) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }

    function renderYears(swiper: any) {
      const nav = root.querySelector('.wb-history__timeline-nav') as HTMLElement | null
      if (!nav) return

      const slides = getSlides()
      nav.innerHTML = ''

      slides.forEach(function (slide, index) {
        const label = `${slide.getAttribute('data-year') || (1993 + index * 5)}`
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'wb-history__year'
        button.textContent = label
        button.setAttribute('aria-label', `Go to year ${label}`)
        button.addEventListener('click', function () {
          swiper?.slideTo?.(index)
        })
        nav.appendChild(button)
      })

      updateActiveYear(swiper)
    }

    function initSwiper() {
      const w = window as any
      if (!w.Swiper) return

      const swiperEl = root.querySelector('.wb-history__swiper') as HTMLElement | null
      if (!swiperEl) return

      destroySwiper()

      root._wbHistorySwiper = new w.Swiper(swiperEl, {
        slidesPerView: clamp(props?.mobileSlides, 1, 2.2, 1.08),
        spaceBetween: clamp(props?.spaceBetween, 0, 48, 16),
        speed: clamp(props?.speed, 100, 2000, 550),
        watchOverflow: true,
        observer: true,
        observeParents: true,
        breakpoints: {
          768: {
            slidesPerView: clamp(props?.tabletSlides, 1, 3.2, 2.1),
            spaceBetween: clamp(props?.spaceBetween, 0, 64, 18),
          },
          1200: {
            slidesPerView: clamp(props?.desktopSlides, 1, 4.5, 3.15),
            spaceBetween: clamp(props?.spaceBetween, 0, 72, 24),
          },
        },
        on: {
          init: function () {
            renderYears(this)
          },
          slideChange: function () {
            updateActiveYear(this)
          },
          resize: function () {
            updateActiveYear(this)
          },
        },
      })

      renderYears(root._wbHistorySwiper)
    }

    function scheduleRefresh() {
      cancelAnimationFrame(rafId)
      rafId = window.requestAnimationFrame(function () {
        if (disposed) return
        initSwiper()
      })
    }

    ensureSwiper().then(function () {
      if (disposed) return

      initSwiper()

      const wrapper = root.querySelector('.wb-history__swiper .swiper-wrapper') as HTMLElement | null
      if (wrapper) {
        observer = new MutationObserver(function (mutations) {
          const needsRefresh = mutations.some(function (mutation) {
            return mutation.type === 'childList' || mutation.attributeName === 'data-year'
          })
          if (needsRefresh) {
            scheduleRefresh()
          }
        })

        observer.observe(wrapper, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-year'],
        })
      }

      resizeHandler = function () {
        updateActiveYear(root._wbHistorySwiper)
      }
      window.addEventListener('resize', resizeHandler)
    })

    root._wbHistoryCleanup = function () {
      disposed = true
      cancelAnimationFrame(rafId)
      if (observer) observer.disconnect()
      if (resizeHandler) window.removeEventListener('resize', resizeHandler)
      destroySwiper()
      root._wbHistoryCleanup = null
    }
  }
}

export function registerHistoryTimelineComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_HISTORY_TIMELINE_TYPE)) {
    return
  }

  domComponents.addType(WB_HISTORY_TIMELINE_SLIDE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.classList?.contains('wb-history__slide')
        ? { type: WB_HISTORY_TIMELINE_SLIDE_TYPE }
        : false,
    model: {
      defaults: {
        name: '历程卡片',
        tagName: 'article',
        draggable: '.swiper-wrapper',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          class: 'swiper-slide wb-history__slide',
          'data-year': '1993',
        },
        historyYear: '1993',
        components: buildSlideContent(0, '1993'),
        traits: [
          makeTextTrait('年份', 'historyYear', { placeholder: '1993' }),
        ],
      },
      init(this: any) {
        this.on('change:historyYear', this.syncHistoryYear)
        this.syncHistoryYear()
      },
      syncHistoryYear(this: any) {
        this.addAttributes({
          'data-year': `${this.get('historyYear') || '1993'}`,
        })
      },
    },
  })

  const timelineScript = makeTimelineScript()

  domComponents.addType(WB_HISTORY_TIMELINE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'history-timeline'
        ? { type: WB_HISTORY_TIMELINE_TYPE }
        : false,
    model: {
      defaults: {
        name: '发展历程轮播',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'history-timeline',
        },
        style: {
          padding: '64px 0 56px',
          background: '#f4f7fb',
          overflow: 'hidden',
        },
        desktopSlides: 3.15,
        tabletSlides: 2.1,
        mobileSlides: 1.08,
        spaceBetween: 20,
        speed: 550,
        slidesVersion: 0,
        'script-props': [
          'desktopSlides',
          'tabletSlides',
          'mobileSlides',
          'spaceBetween',
          'speed',
          'slidesVersion',
        ],
        styles: HISTORY_TIMELINE_CSS,
        script: timelineScript,
        'script-export': timelineScript,
        traits: [
          createAddSlideTrait(),
          makeNumberTrait('桌面列数', 'desktopSlides', { min: 1, max: 4.5, step: 0.1 }),
          makeNumberTrait('平板列数', 'tabletSlides', { min: 1, max: 3.5, step: 0.1 }),
          makeNumberTrait('手机列数', 'mobileSlides', { min: 1, max: 2.2, step: 0.1 }),
          makeNumberTrait('卡片间距(px)', 'spaceBetween', { min: 0, max: 48, step: 1 }),
          makeNumberTrait('切换速度(ms)', 'speed', { min: 100, max: 2000, step: 50 }),
        ],
        components: [
          {
            tagName: 'div',
            attributes: { class: 'wb-history__inner' },
            removable: false,
            selectable: false,
            droppable: false,
            copyable: false,
            draggable: false,
            highlightable: false,
            components: [
              {
                tagName: 'div',
                attributes: { class: 'swiper wb-history__swiper' },
                removable: false,
                selectable: false,
                droppable: false,
                copyable: false,
                draggable: false,
                highlightable: false,
                components: [
                  {
                    tagName: 'div',
                    attributes: { class: 'swiper-wrapper' },
                    removable: false,
                    selectable: false,
                    droppable: false,
                    copyable: false,
                    draggable: false,
                    highlightable: false,
                    components: Array.from({ length: 4 }, (_, index) => buildSlideDef(index)),
                  },
                ],
              },
              {
                tagName: 'div',
                attributes: { class: 'wb-history__timeline' },
                removable: false,
                selectable: false,
                droppable: false,
                copyable: false,
                draggable: false,
                highlightable: false,
                components: [
                  {
                    tagName: 'div',
                    attributes: { class: 'wb-history__timeline-nav' },
                    removable: false,
                    selectable: false,
                    droppable: false,
                    copyable: false,
                    draggable: false,
                    highlightable: false,
                  },
                ],
              },
            ],
          },
        ],
      },
      _getWrapper(this: any) {
        const inner = this.components?.()?.at?.(0)
        const swiper = inner?.components?.()?.at?.(0)
        return swiper?.components?.()?.at?.(0) ?? null
      },
    },
  })

  if (!blockManager?.get?.(WB_HISTORY_TIMELINE_TYPE)) {
    blockManager?.add?.(WB_HISTORY_TIMELINE_TYPE, {
      label: '发展历程轮播',
      category: 'Section',
      content: { type: WB_HISTORY_TIMELINE_TYPE },
      media: BLOCK_ICON,
    })
  }
}
