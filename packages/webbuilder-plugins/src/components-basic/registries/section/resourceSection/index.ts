import { toNumber } from '../../../styleHelpers.js'
import { makeTextTrait, makeNumberTrait } from '../../../traitFactory.js'
import type { Editor } from 'grapesjs'

export const WB_RESOURCE_SECTION_TYPE = 'wb-resource-section'
const DEFAULT_DESKTOP_SLIDES = 2
const DEFAULT_MOBILE_SLIDES = 1.3

// TODO: 预留 API 数据接口
// 后期可从后端 API 获取资源数据
// interface ResourceCardData {
//   image: string
//   title: string
//   description: string
//   link: string
// }
// interface ResourceSectionData {
//   title: string
//   subtitle: string
//   items: ResourceCardData[]
// }

const RESOURCE_SECTION_CSS = `
  .wb-resource-section {
    width: 100%;
    box-sizing: border-box;
    padding: 80px 0;
  }
  .wb-resource-section__inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .wb-resource-section__header {
    text-align: left;
    margin-bottom: 40px;
  }
  .wb-resource-section__title {
    font-size: 56px;
    font-weight: bold;
    line-height: 140%;
    color: #000;
    margin: 0 0 12px 0;
  }
  .wb-resource-section__subtitle {
    font-size: 16px;
    font-weight: normal;
    line-height: 24px;
    color: #0C1029;
    margin: 0;
  }
  .wb-resource-section__slider {
    position: relative;
    height: max-content;
  }
  .wb-resource-section__swiper {
    width: 100%;
    overflow: hidden;
  }
  .wb-resource-section__swiper .swiper-wrapper {
    align-items: stretch;
    display: flex;
  }
  .wb-resource-section__swiper .swiper-slide {
    height: auto;
  }
  .wb-resource-section__card {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .wb-resource-section__card-image {
    width: 100%;
    height: auto;
    overflow: hidden;
  }
  .wb-resource-section__card-image img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .wb-resource-section__card:hover .wb-resource-section__card-image img {
    transform: scale(1.05);
  }
  .wb-resource-section__card-body {
    display: flex;
    flex-direction: column;
  }
  .wb-resource-section__card-title {
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: #000;
    margin: 0;
    transition: color 0.3s ease;
  }
  .wb-resource-section__card:hover .wb-resource-section__card-title {
    color: var(--resource-primary-color, #3C53E8);
  }
  .wb-resource-section__card-text {
    font-size: 14px;
    font-weight: normal;
    line-height: 20px;
    color: #111;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .wb-resource-section__card-link {
    display: block;
    color: inherit;
    text-decoration: none;
    transition: opacity 0.3s ease;
  }
  .wb-resource-section__card-link:hover {
    opacity: 0.8;
  }
  .wb-resource-section__card-view-more {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: normal;
    line-height: 20px;
    color: var(--resource-primary-color, #3C53E8);
    margin-top: 12px;
  }
  .wb-resource-section__card-view-more svg {
    flex-shrink: 0;
  }
  .wb-resource-section__nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 23px;
    height: 55px;
    border: none;
    background: transparent;
    cursor: pointer;
    z-index: 10;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wb-resource-section__nav-btn--prev {
    left: -52px;
  }
  .wb-resource-section__nav-btn--next {
    right: -52px;
  }
  .wb-resource-section__nav-btn svg {
    width: 100%;
    height: 100%;
  }
  @media (max-width: 767px) {
    .wb-resource-section {
      padding: 40px 0;
    }
    .wb-resource-section__inner {
      padding: 0 16px;
    }
    .wb-resource-section__header {
      margin-bottom: 24px;
    }
    .wb-resource-section__title {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .wb-resource-section__subtitle {
      font-size: 14px;
    }
    .wb-resource-section__card-view-more {
      font-size: 13px;
    }
    .wb-resource-section__nav-btn {
      display: none;
    }
  }
`

function buildResourceCard(index: number) {
  return {
    tagName: 'div',
    name: `资源卡片 ${index + 1}`,
    draggable: false,
    droppable: false,
    selectable: true,
    stylable: true,
    copyable: true,
    removable: true,
    attributes: { class: 'wb-resource-section__card swiper-slide' },
    components: [
      {
        tagName: 'a',
        selectable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: {
          class: 'wb-resource-section__card-link',
          href: '#',
        },
        components: [
          {
            tagName: 'div',
            selectable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-resource-section__card-image' },
            components: [
              {
                tagName: 'img',
                selectable: true,
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                attributes: {
                  src: 'https://placehold.co/600x370',
                  alt: `Resource ${index + 1}`,
                },
              },
            ],
          },
          {
            tagName: 'div',
            selectable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-resource-section__card-body' },
            components: [
              {
                tagName: 'h3',
                type: 'text',
                selectable: true,
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                attributes: { class: 'wb-resource-section__card-title' },
                components: index === 0 ? 'Installation & Maintenance' : 'Technical Documentation',
              },
              {
                tagName: 'p',
                type: 'text',
                selectable: true,
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                attributes: { class: 'wb-resource-section__card-text' },
                components:
                  'Regardless of material or machine, the track roller bearing is important for track and rail operations.',
              },
              {
                tagName: 'span',
                selectable: true,
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                attributes: { class: 'wb-resource-section__card-view-more' },
                components: [
                  'View More',
                  {
                    tagName: 'svg',
                    attributes: {
                      xmlns: 'http://www.w3.org/2000/svg',
                      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
                      version: '1.1',
                      width: '12',
                      height: '10',
                      viewBox: '0 0 12 10',
                    },
                    components: [
                      {
                        tagName: 'path',
                        attributes: {
                          d: 'M12,4.9999957L6.3874512,0L5.1087112,1.1391882L9.4425211,4.9999957L5.1087112,8.8608189L6.3874512,10L12,4.9999957ZM6.8912802,4.9999957L1.2787489,0L0,1.1391882L4.3337989,4.9999957L0,8.8608189L1.2787489,10L6.8912802,4.9999957Z',
                          fill: 'var(--resource-primary-color, #3C53E8)',
                          'fill-opacity': '1',
                          style: 'mix-blend-mode:passthrough',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
}

function buildResourceSectionTree(cardsCount: number = 2) {
  const cards: any[] = []
  for (let i = 0; i < cardsCount; i++) {
    cards.push(buildResourceCard(i))
  }

  return [
    {
      tagName: 'div',
      name: '内容容器',
      selectable: false,
      hoverable: false,
      highlightable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-resource-section__inner' },
      components: [
        {
          tagName: 'div',
          name: '标题区域',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-resource-section__header' },
          components: [
            {
              tagName: 'h2',
              type: 'text',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-resource-section__title' },
              components: 'Resource',
            },
            {
              tagName: 'p',
              type: 'text',
              selectable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-resource-section__subtitle' },
              components: 'To Help You Find The Right Bearing Solution',
            },
          ],
        },
        {
          tagName: 'div',
          name: '轮播区域',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-resource-section__slider' },
          components: [
            {
              tagName: 'div',
              attributes: { class: 'wb-resource-section__swiper swiper' },
              components: [
                {
                  tagName: 'div',
                  attributes: { class: 'swiper-wrapper' },
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
                class: 'wb-resource-section__nav-btn wb-resource-section__nav-btn--prev',
                type: 'button',
                'aria-label': 'Previous resources',
              },
              components: `<svg xmlns="http://www.w3.org/2000/svg" width="23" height="55" viewBox="0 0 23 55"><path d="M-0.3931918999999999,25.939648L20.286785,54.382107L22.713215,52.617893L3.3931915,26.045868L22.661854,2.44873297L20.338146,0.55126703L-0.3931918999999999,25.939648Z" fill="#878787"/></svg>`,
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
                class: 'wb-resource-section__nav-btn wb-resource-section__nav-btn--next',
                type: 'button',
                'aria-label': 'Next resources',
              },
              components: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="23.106407165527344" height="53.830841064453125" viewBox="0 0 23.106407165527344 53.830841064453125"><path d="M23.106407165527344,25.38838L43.786384165527345,53.830841L46.21281416552735,52.066628L26.892791765527342,25.4946L46.16145316552735,1.8974658L43.83774616552734,0L23.106407165527344,25.38838Z" fill-rule="evenodd" fill="#878787" fill-opacity="1" style="mix-blend-mode:passthrough" transform="matrix(-1,0,0,1,46.21281433105469,0)"></path></svg>`,
            },
          ],
        },
      ],
    },
  ]
}

function normalizeSlidesPerView(value: any, fallback: number, max: number): number {
  const parsed = toNumber(value, fallback)
  return Math.max(1, Math.min(max, parsed))
}

function resourceSectionScript(
  this: any,
  props?: { desktopSlides?: number | string; mobileSlides?: number | string },
) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const root = this as any
  root._wbResourceCleanup?.()

  const toSafeNumber = (value: any, fallback: number, max: number) => {
    const parsed = Number.parseFloat(String(value ?? ''))
    if (!Number.isFinite(parsed)) return fallback
    return Math.max(1, Math.min(max, parsed))
  }

  const getDesktopSlides = () =>
    toSafeNumber(root.getAttribute('data-desktop-slides') ?? props?.desktopSlides, 2, 6)
  const getMobileSlides = () =>
    toSafeNumber(root.getAttribute('data-mobile-slides') ?? props?.mobileSlides, 1.3, 3)

  const ensureAssets = () =>
    new Promise<void>((resolve) => {
      const run = () => resolve()
      const w = window as any
      if (w.Swiper) {
        run()
        return
      }

      if (!document.querySelector('link[data-wb-resource-swiper]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
        link.setAttribute('data-wb-resource-swiper', '1')
        document.head.appendChild(link)
      }

      const existingScript = document.querySelector(
        'script[data-wb-resource-swiper]',
      ) as HTMLScriptElement | null
      if (existingScript) {
        existingScript.addEventListener('load', () => run(), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
      script.async = true
      script.setAttribute('data-wb-resource-swiper', '1')
      script.onload = () => run()
      document.body.appendChild(script)
    })

  const initSwiper = () => {
    const w = window as any
    if (!w.Swiper) return
    root._wbSwiper?.destroy?.(true, true)

    const swiperEl = root.querySelector('.wb-resource-section__swiper') as HTMLElement | null
    if (!swiperEl) return

    const prevBtn = root.querySelector(
      '.wb-resource-section__nav-btn--prev',
    ) as HTMLElement | null
    const nextBtn = root.querySelector(
      '.wb-resource-section__nav-btn--next',
    ) as HTMLElement | null
    const isMobile = window.innerWidth < 768
    const desktopSlides = getDesktopSlides()
    const mobileSlides = getMobileSlides()

    root._wbSwiper = new w.Swiper(swiperEl, {
      slidesPerView: isMobile ? mobileSlides : desktopSlides,
      spaceBetween: isMobile ? 12 : 32,
      loop: false,
      centeredSlides: false,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
      navigation: prevBtn && nextBtn ? { prevEl: prevBtn, nextEl: nextBtn } : false,
      breakpoints: {
        0: { slidesPerView: mobileSlides, spaceBetween: 12 },
        768: { slidesPerView: desktopSlides, spaceBetween: 32 },
      },
    })

    if (prevBtn) {
      prevBtn.onclick = () => {
        root._wbSwiper?.slidePrev?.()
      }
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        root._wbSwiper?.slideNext?.()
      }
    }
  }

  const onRefresh = () => {
    requestAnimationFrame(initSwiper)
  }

  const onResize = () => {
    root._wbSwiper?.update?.()
  }

  root.addEventListener('wb:resource-section:refresh', onRefresh)
  window.addEventListener('resize', onResize)
  root._wbResourceCleanup = () => {
    root.removeEventListener('wb:resource-section:refresh', onRefresh)
    window.removeEventListener('resize', onResize)
    root._wbSwiper?.destroy?.(true, true)
    root._wbSwiper = null
  }

  ensureAssets().then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(initSwiper)
    })
  })
}

/**
 * 注册 Resource Section 组件
 */
export function registerResourceSectionComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_RESOURCE_SECTION_TYPE)) return

  domComponents.addType(WB_RESOURCE_SECTION_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'resource-section'
        ? { type: WB_RESOURCE_SECTION_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Resource Section',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: RESOURCE_SECTION_CSS,
        attributes: {
          'data-wb-component': 'resource-section',
          'data-desktop-slides': String(DEFAULT_DESKTOP_SLIDES),
          'data-mobile-slides': String(DEFAULT_MOBILE_SLIDES),
          class: 'wb-resource-section',
          style: '--resource-primary-color: #3C53E8;',
        },
        cardsCount: 3,
        desktopSlides: DEFAULT_DESKTOP_SLIDES,
        mobileSlides: DEFAULT_MOBILE_SLIDES,
        primaryColor: '#3C53E8',
        sectionTitle: 'Resource',
        sectionSubtitle: 'To Help You Find The Right Bearing Solution',
        prevArrow: '<svg xmlns="http://www.w3.org/2000/svg" width="23" height="55" viewBox="0 0 23 55"><path d="M-0.3931918999999999,25.939648L20.286785,54.382107L22.713215,52.617893L3.3931915,26.045868L22.661854,2.44873297L20.338146,0.55126703L-0.3931918999999999,25.939648Z" fill="#878787"/></svg>',
        nextArrow: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="23.106407165527344" height="53.830841064453125" viewBox="0 0 23.106407165527344 53.830841064453125"><path d="M23.106407165527344,25.38838L43.786384165527345,53.830841L46.21281416552735,52.066628L26.892791765527342,25.4946L46.16145316552735,1.8974658L43.83774616552734,0L23.106407165527344,25.38838Z" fill-rule="evenodd" fill="#878787" fill-opacity="1" style="mix-blend-mode:passthrough" transform="matrix(-1,0,0,1,46.21281433105469,0)"></path></svg>',
        traits: [
          makeTextTrait('标题', 'sectionTitle', { placeholder: '请输入标题' }),
          makeTextTrait('副标题', 'sectionSubtitle', { placeholder: '请输入副标题' }),
          makeNumberTrait('卡片数量', 'cardsCount', { min: 1, max: 10, step: 1 }),
          makeNumberTrait('电脑端每屏显示', 'desktopSlides', { min: 1, max: 6, step: 0.1 }),
          makeNumberTrait('移动端每屏显示', 'mobileSlides', { min: 1, max: 3, step: 0.1 }),
          {
            type: 'color',
            label: '主色调',
            name: 'primaryColor',
            changeProp: true,
          },
          makeTextTrait('左箭头 SVG', 'prevArrow', { placeholder: '输入左箭头 SVG 代码' }),
          makeTextTrait('右箭头 SVG', 'nextArrow', { placeholder: '输入右箭头 SVG 代码' }),
        ],
        components: buildResourceSectionTree(3),
        'script-props': ['desktopSlides', 'mobileSlides'],
        script: resourceSectionScript,
        'script-export': resourceSectionScript,
      },
      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        if (attrs['data-desktop-slides']) {
          this.set('desktopSlides', attrs['data-desktop-slides'], { silent: true })
        }
        if (attrs['data-mobile-slides']) {
          this.set('mobileSlides', attrs['data-mobile-slides'], { silent: true })
        }

        this.on(
          'change:cardsCount change:desktopSlides change:mobileSlides change:primaryColor change:sectionTitle change:sectionSubtitle',
          this.applyConfig,
        )
        if (
          typeof window === 'undefined' ||
          typeof document === 'undefined' ||
          (window as any).__WB_PUBLISHER_HEADLESS__
        ) {
          return
        }

        // 立即初始化 Swiper
        setTimeout(() => {
          const root = this.getView?.()?.el as any
          if (!root) return
          const w = window as any
          if (w.Swiper) {
            const swiperEl = root.querySelector('.wb-resource-section__swiper') as HTMLElement | null
            if (swiperEl && !root._wbSwiper) {
              const prevBtn = root.querySelector('.wb-resource-section__nav-btn--prev') as HTMLElement | null
              const nextBtn = root.querySelector('.wb-resource-section__nav-btn--next') as HTMLElement | null
              const isMobile = window.innerWidth < 768
              root._wbSwiper = new w.Swiper(swiperEl, {
                slidesPerView: isMobile
                  ? normalizeSlidesPerView(this.get('mobileSlides'), DEFAULT_MOBILE_SLIDES, 3)
                  : normalizeSlidesPerView(this.get('desktopSlides'), DEFAULT_DESKTOP_SLIDES, 6),
                spaceBetween: isMobile ? 12 : 32,
                loop: false,
                centeredSlides: false,
                slidesOffsetBefore: 0,
                slidesOffsetAfter: 0,
                navigation: prevBtn && nextBtn ? { prevEl: prevBtn, nextEl: nextBtn } : false,
              })
            }
          }
        }, 100)
      },

      _getWrapper(this: any) {
        const slider = this.components?.()?.at?.(0)?.components?.()?.at?.(1)
        if (!slider) return null
        const swiperContainer = slider.components?.()?.at?.(0)
        if (!swiperContainer) return null
        return swiperContainer.components?.()?.at?.(0)
      },
      _getGrid(this: any) {
        const wrapper = this._getWrapper?.()
        if (!wrapper) return null
        return wrapper.components?.()
      },
      applyConfig(this: any) {
        const cardsCount = Math.max(1, Math.min(10, toNumber(this.get('cardsCount'), 2)))
        const desktopSlides = normalizeSlidesPerView(
          this.get('desktopSlides'),
          DEFAULT_DESKTOP_SLIDES,
          6,
        )
        const mobileSlides = normalizeSlidesPerView(
          this.get('mobileSlides'),
          DEFAULT_MOBILE_SLIDES,
          3,
        )
        const primaryColor = this.get('primaryColor') || '#3C53E8'
        const sectionTitle = this.get('sectionTitle') || 'Resource'
        const sectionSubtitle = this.get('sectionSubtitle') || 'To Help You Find The Right Bearing Solution'

        // 更新 CSS 变量
        this.addStyle({
          '--resource-primary-color': primaryColor,
        })
        this.set(
          {
            desktopSlides,
            mobileSlides,
          },
          { silent: true },
        )
        this.addAttributes({
          'data-desktop-slides': String(desktopSlides),
          'data-mobile-slides': String(mobileSlides),
        })

        // 更新标题文字
        const header = this.components?.()?.at?.(0)?.components?.()?.at?.(0)
        if (header) {
          const titleEl = header.components?.()?.at?.(0)
          const subtitleEl = header.components?.()?.at?.(1)
          if (titleEl && titleEl.components) {
            titleEl.components(sectionTitle)
          }
          if (subtitleEl && subtitleEl.components) {
            subtitleEl.components(sectionSubtitle)
          }
        }

        // 更新卡片数量
        const wrapper = this._getWrapper?.()
        const cards = wrapper?.components?.()
        if (!cards) return

        const target = cardsCount
        const current = cards.length || 0
        // 只有当数量不一致时才调整
        if (current !== target) {
          if (current < target) {
            for (let i = current; i < target; i += 1) {
              cards.add(buildResourceCard(i))
            }
          } else if (current > target) {
            for (let i = current - 1; i >= target; i -= 1) {
              cards.remove(cards.at(i))
            }
          }
        }

        // 重新初始化 Swiper
        if (this._wbSwiper) {
          this._wbSwiper.update()
        }

        const el = this.getView?.()?.el as HTMLElement | undefined
        el?.dispatchEvent?.(new CustomEvent('wb:resource-section:refresh'))
      },
    },
  })

  blockManager?.add?.(WB_RESOURCE_SECTION_TYPE, {
    label: '资源展示区块',
    category: 'Section',
    content: { type: WB_RESOURCE_SECTION_TYPE },
  })
}
