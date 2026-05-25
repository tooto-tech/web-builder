import { toNumber, toBool } from '@/components/WebBuilder/utils/styleHelpers'
import { makeNumberTrait, makeCheckboxTrait } from '@/components/WebBuilder/utils/traitFactory'
import type { Editor } from 'grapesjs'

export const WB_CAROUSEL_TYPE = 'wb-carousel'

const CAROUSEL_CSS = `
  .wb-carousel.swiper{width:100%;position:relative;overflow:hidden;}
  .wb-carousel .swiper-wrapper{align-items:stretch;}
  .wb-carousel .swiper-slide{
    min-height:120px;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#111827;
    font-size:20px;
    font-weight:600;
    background:#f3f4f6;
    border-radius:8px;
  }
  .wb-carousel .swiper-button-prev,
  .wb-carousel .swiper-button-next{
    width:32px;
    height:32px;
    border-radius:9999px;
    background:rgba(255,255,255,.9);
    box-shadow:0 2px 8px rgba(0,0,0,.12);
  }
  .wb-carousel .swiper-button-prev:after,
  .wb-carousel .swiper-button-next:after{
    font-size:14px;
    font-weight:700;
    color:#111827;
  }
  @media (max-width:1023px){
    .wb-carousel .swiper-slide{
      font-size:18px;
      border-radius:6px;
    }
    .wb-carousel .swiper-button-prev,
    .wb-carousel .swiper-button-next{
      width:28px;
      height:28px;
    }
  }
  @media (max-width:767px){
    .wb-carousel .swiper-slide{
      font-size:16px;
      min-height:100px;
    }
    .wb-carousel .swiper-button-prev,
    .wb-carousel .swiper-button-next{
      display:none;
    }
  }
`

/**
 * 注册轮播组件（基于 Swiper）
 */
export function registerCarouselComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_CAROUSEL_TYPE)) {
    return
  }

  domComponents.addType(WB_CAROUSEL_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'carousel') {
        return { type: WB_CAROUSEL_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '轮播',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'carousel',
          class: 'wb-carousel swiper',
          'data-slides-per-view': '1',
          'data-space-between': '16',
          'data-loop': 'true',
          'data-autoplay': 'false',
          'data-autoplay-delay': '3000',
          'data-show-arrows': 'true',
          'data-show-pagination': 'true',
        },
        style: {
          width: '100%',
          height: '320px',
          'box-sizing': 'border-box',
        },
        styles: CAROUSEL_CSS,
        slidesCount: 3,
        slidesPerView: 1,
        spaceBetween: 16,
        height: 320,
        loop: true,
        autoplay: false,
        autoplayDelay: 3000,
        showArrows: true,
        showPagination: true,
        components: [
          {
            tagName: 'div',
            attributes: { class: 'swiper-wrapper' },
            components: [
              { tagName: 'div', attributes: { class: 'swiper-slide' } },
              { tagName: 'div', attributes: { class: 'swiper-slide' } },
              { tagName: 'div', attributes: { class: 'swiper-slide' } },
            ],
          },
          { tagName: 'div', attributes: { class: 'swiper-pagination' } },
          { tagName: 'div', attributes: { class: 'swiper-button-prev' } },
          { tagName: 'div', attributes: { class: 'swiper-button-next' } },
        ],
        script: function () {
          const root = this as any

          const ensureAssets = () =>
            new Promise<void>((resolve) => {
              const run = () => resolve()
              const w = window as any
              if (w.Swiper) {
                run()
                return
              }

              if (!document.querySelector('link[data-wb-swiper]')) {
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
                link.setAttribute('data-wb-swiper', '1')
                document.head.appendChild(link)
              }

              const existingScript = document.querySelector('script[data-wb-swiper]') as HTMLScriptElement | null
              if (existingScript) {
                existingScript.addEventListener('load', () => run(), { once: true })
                return
              }

              const script = document.createElement('script')
              script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
              script.async = true
              script.setAttribute('data-wb-swiper', '1')
              script.onload = () => run()
              document.body.appendChild(script)
            })

          const initSwiper = () => {
            const w = window as any
            if (!w.Swiper) return
            root._wbSwiper?.destroy?.(true, true)

            const getBool = (name: string, fallback: boolean) => {
              const value = `${root.getAttribute(name) || ''}`.trim()
              if (value === '') return fallback
              return value === 'true'
            }
            const getNum = (name: string, fallback: number) => {
              const value = Number(root.getAttribute(name))
              return Number.isFinite(value) ? value : fallback
            }

            const showArrows = getBool('data-show-arrows', true)
            const showPagination = getBool('data-show-pagination', true)
            const autoplay = getBool('data-autoplay', false)

            const paginationEl = root.querySelector('.swiper-pagination') as HTMLElement | null
            const prevEl = root.querySelector('.swiper-button-prev') as HTMLElement | null
            const nextEl = root.querySelector('.swiper-button-next') as HTMLElement | null

            if (paginationEl) paginationEl.style.display = showPagination ? '' : 'none'
            if (prevEl) prevEl.style.display = showArrows ? '' : 'none'
            if (nextEl) nextEl.style.display = showArrows ? '' : 'none'

            root._wbSwiper = new w.Swiper(root, {
              slidesPerView: getNum('data-slides-per-view', 1),
              spaceBetween: getNum('data-space-between', 16),
              loop: getBool('data-loop', true),
              autoplay: autoplay
                ? {
                    delay: getNum('data-autoplay-delay', 3000),
                    disableOnInteraction: false,
                  }
                : false,
              pagination: showPagination && paginationEl ? { el: paginationEl, clickable: true } : false,
              navigation:
                showArrows && prevEl && nextEl
                  ? {
                      prevEl,
                      nextEl,
                    }
                  : false,
            })
          }

          const bootstrap = async () => {
            await ensureAssets()
            initSwiper()
          }

          bootstrap()
        },
        traits: [
          makeNumberTrait('幻灯片数量', 'slidesCount', { min: 1, max: 10, step: 1 }),
          makeNumberTrait('每屏张数', 'slidesPerView', { min: 1, max: 6, step: 1 }),
          makeNumberTrait('间距(px)', 'spaceBetween', { min: 0, max: 120, step: 1 }),
          makeNumberTrait('高度(px)', 'height', { min: 120, max: 1200, step: 1 }),
          makeCheckboxTrait('循环', 'loop'),
          makeCheckboxTrait('自动播放', 'autoplay'),
          makeNumberTrait('自动播放间隔(ms)', 'autoplayDelay', { min: 500, max: 20000, step: 100 }),
          makeCheckboxTrait('显示箭头', 'showArrows'),
          makeCheckboxTrait('显示分页', 'showPagination'),
        ],
      },
      init(this: any) {
        this.on(
          'change:slidesPerView change:spaceBetween change:height change:loop change:autoplay change:autoplayDelay change:showArrows change:showPagination',
          this.applyCarouselConfig
        )
        this.on('change:slidesCount', this.applySlidesCount)
        this.applySlidesCount()
        this.applyCarouselConfig()
      },
      getWrapper(this: any) {
        const children = this.components?.()
        if (!children?.at) return null
        return children.at(0)
      },
      applySlidesCount(this: any) {
        const wrapper = this.getWrapper()
        if (!wrapper) return
        const slides = wrapper.components?.()
        if (!slides) return

        const target = Math.max(1, Math.min(10, Number(this.get('slidesCount')) || 3))
        const current = slides.length || 0

        if (current < target) {
          for (let i = current; i < target; i += 1) {
            slides.add({
              tagName: 'div',
              attributes: { class: 'swiper-slide' },
              components: `Slide ${i + 1}`,
            })
          }
        } else if (current > target) {
          for (let i = current - 1; i >= target; i -= 1) {
            slides.remove(slides.at(i))
          }
        }
      },
      applyCarouselConfig(this: any) {
        this.addStyle({
          height: `${Math.max(120, toNumber(this.get('height'), 320))}px`,
        })

        this.addAttributes({
          'data-slides-per-view': `${Math.max(1, toNumber(this.get('slidesPerView'), 1))}`,
          'data-space-between': `${Math.max(0, toNumber(this.get('spaceBetween'), 16))}`,
          'data-loop': `${toBool(this.get('loop'))}`,
          'data-autoplay': `${toBool(this.get('autoplay'))}`,
          'data-autoplay-delay': `${Math.max(500, toNumber(this.get('autoplayDelay'), 3000))}`,
          'data-show-arrows': `${toBool(this.get('showArrows'))}`,
          'data-show-pagination': `${toBool(this.get('showPagination'))}`,
        })
      },
    },
  })
}
