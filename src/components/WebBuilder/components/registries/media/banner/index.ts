import {
  makeNumberTrait,
  makeCheckboxTrait,
  makeImagePickerTrait,
  makeTextTrait,
  makeTextareaTrait,
  makeLinkTrait,
  makeLinkTargetTrait,
} from '@/components/WebBuilder/utils/traitFactory'
import type { Editor, Plugin } from 'grapesjs'

export const WB_BANNER_TYPE = 'wb-banner'
export const WB_BANNER_SLIDE_TYPE = 'wb-banner-slide'

export interface BannerPluginOptions {
  category?: string
  label?: string
  addBlock?: boolean
}

const BANNER_ROOT_CLASS = 'wb-banner'

const BANNER_CSS = `
  .wb-banner {
    width: 100%;
    height: 56.25vw;
    max-height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }
  .wb-banner__swiper { width: 100%; height: 100%; }
  .wb-banner__swiper .swiper-wrapper { align-items: stretch; }
  .wb-banner__slide { position: relative; overflow: hidden; }
  .wb-banner__slide .wb-banner__bg {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; z-index: 0;
  }
  .wb-banner__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    z-index: 1;
  }
  .wb-banner__container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  .wb-banner__content {
    max-width: 750px;
    color: #ffffff;
  }
  .wb-banner__title {
    margin-bottom: 20px;
    font-size: 56px;
    font-weight: 600;
    line-height: 1.2;
    white-space: pre-line;
  }
  .wb-banner__desc {
    margin-bottom: 32px;
    font-size: 18px;
    font-weight: 300;
    line-height: 1.6;
    max-width: 560px;
    white-space: pre-line;
  }
  .wb-banner__cta {
    display: inline-flex;
    align-items: center;
    background: #ffffff;
    color: #000000;
    padding: 4px;
    border-radius: 9999px;
    text-decoration: none;
  }
  .wb-banner__cta-label {
    padding: 0 16px;
    font-size: 14px;
    font-weight: 500;
  }
  .wb-banner__cta-icon {
    width: 40px;
    height: 40px;
    background: #041038;
    border-radius: 9999px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-style: normal;
    font-size: 16px;
    flex-shrink: 0;
  }
  .wb-banner__swiper .swiper-button-prev,
  .wb-banner__swiper .swiper-button-next {
    color: #ffffff;
    text-shadow: 0 1px 4px rgba(0,0,0,.4);
  }
  .wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets, 
  .wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-horizontal, 
  .wb-banner__swiper.swiper-horizontal>.swiper-pagination-custom, 
  .wb-banner__swiper.swiper-horizontal>.swiper-pagination-fraction{
    bottom: 5%;
  }
  .wb-banner__swiper .swiper-button-prev::after,
  .wb-banner__swiper .swiper-button-next::after { font-size: 24px; }
  .wb-banner__swiper .swiper-pagination-bullet { background: #fff; opacity: .6; }
  .wb-banner__swiper .swiper-pagination-bullet-active { opacity: 1; }
  .wb-banner__swiper.wb-banner-rect-pagi .swiper-pagination-bullet {
    width: 24px; height: 3px; border-radius: 0;
  }
  .wb-banner__swiper .swiper-button-prev.wb-nav-custom::after,
  .wb-banner__swiper .swiper-button-next.wb-nav-custom::after { display: none; }
  .wb-banner.wb-banner--editing .ani,
  .wb-banner .ani.tooto-selected,
  .wb-banner .tooto-selected .ani,
  .wb-banner .ani[contenteditable="true"],
  .wb-banner [contenteditable="true"] .ani {
    opacity: 1 !important;
    animation: none !important;
  }
  @media (max-width: 1023px) {
    .wb-banner {
      height: 72vw !important;
      min-height: 520px;
      max-height: none !important;
    }
    .wb-banner__overlay {
      align-items: flex-end;
    }
    .wb-banner__container {
      padding: 0 20px 88px !important;
    }
    .wb-banner__content {
      max-width: 620px !important;
    }
    .wb-banner__title {
      font-size: 40px !important;
      margin-bottom: 16px !important;
    }
    .wb-banner__desc {
      font-size: 16px !important;
      margin-bottom: 24px !important;
      max-width: 500px !important;
    }
    .wb-banner__swiper .swiper-button-prev::after,
    .wb-banner__swiper .swiper-button-next::after {
      font-size: 20px;
    }
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets,
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-horizontal,
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-custom,
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-fraction {
      bottom: 32px;
    }
  }
  @media (max-width: 767px) {
    .wb-banner {
      height: 150vw !important;
      min-height: 420px;
    }
    .wb-banner__container {
      padding: 0 16px 72px !important;
    }
    .wb-banner__content {
      max-width: none !important;
    }
    .wb-banner__title {
      font-size: 28px !important;
      line-height: 1.15 !important;
      margin-bottom: 14px !important;
    }
    .wb-banner__desc {
      font-size: 14px !important;
      line-height: 1.6 !important;
      margin-bottom: 18px !important;
      max-width: none !important;
    }
    .wb-banner__cta {
      padding: 3px !important;
    }
    .wb-banner__cta-label {
      padding: 0 14px !important;
      font-size: 13px !important;
    }
    .wb-banner__cta-icon {
      width: 36px !important;
      height: 36px !important;
      font-size: 14px !important;
    }
    .wb-banner__swiper .swiper-button-prev,
    .wb-banner__swiper .swiper-button-next {
      display: none !important;
    }
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets,
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-horizontal,
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-custom,
    .wb-banner__swiper.swiper-horizontal>.swiper-pagination-fraction {
      bottom: 22px;
    }
  }
`

function ensureClass(component: any, className: string) {
  if (!component?.addClass) return
  const classList = component.getClasses?.() ?? []
  if (!classList.includes(className)) {
    component.addClass(className)
  }
}

function lockBannerInternalNode(component: any) {
  if (!component?.set) return
  component.set({
    selectable: false,
    droppable: false,
    draggable: false,
    highlightable: false,
    layerable: false,
    editable: false,
  })
}

function migrateBannerStructureClasses(model: any) {
  ensureClass(model, BANNER_ROOT_CLASS)

  const swiper = model.components?.()?.at?.(0)
  ensureClass(swiper, 'wb-banner__swiper')
  swiper?.set?.({
    selectable: false,
    droppable: false,
    draggable: false,
    highlightable: false,
    editable: false,
    layerable: true,
    name: 'Slides',
  })

  const wrapper = swiper?.components?.()?.at?.(0)
  wrapper?.set?.({
    selectable: false,
    droppable: false,
    draggable: false,
    highlightable: false,
    editable: false,
    layerable: true,
    name: 'Slide List',
  })
  const slides = wrapper?.components?.() ?? []
  slides.forEach((slide: any, index: number) => {
    upgradeBannerSlideModel(slide, index)
    ensureClass(slide, 'wb-banner__slide')

    const bg = slide.components?.()?.at?.(0)
    ensureClass(bg, 'wb-banner__bg')
    lockBannerInternalNode(bg)

    const overlay = slide.components?.()?.at?.(1)
    ensureClass(overlay, 'wb-banner__overlay')
    lockBannerInternalNode(overlay)

    const container = overlay?.components?.()?.at?.(0)
    ensureClass(container, 'wb-banner__container')
    lockBannerInternalNode(container)

    const content = container?.components?.()?.at?.(0)
    ensureClass(content, 'wb-banner__content')
    lockBannerInternalNode(content)

    const title = content?.components?.()?.at?.(0)
    ensureClass(title, 'wb-banner__title')
    lockBannerInternalNode(title)

    const desc = content?.components?.()?.at?.(1)
    ensureClass(desc, 'wb-banner__desc')
    lockBannerInternalNode(desc)

    const cta = content?.components?.()?.at?.(2)
    ensureClass(cta, 'wb-banner__cta')
    lockBannerInternalNode(cta)

    const ctaLabel = cta?.components?.()?.at?.(0)
    ensureClass(ctaLabel, 'wb-banner__cta-label')
    lockBannerInternalNode(ctaLabel)

    const ctaIcon = cta?.components?.()?.at?.(1)
    ensureClass(ctaIcon, 'wb-banner__cta-icon')
    lockBannerInternalNode(ctaIcon)
  })

  const pagination = swiper?.components?.()?.find?.((child: any) => child.getClasses?.()?.includes?.('swiper-pagination'))
  lockBannerInternalNode(pagination)
  const prev = swiper?.components?.()?.find?.((child: any) => child.getClasses?.()?.includes?.('swiper-button-prev'))
  lockBannerInternalNode(prev)
  const next = swiper?.components?.()?.find?.((child: any) => child.getClasses?.()?.includes?.('swiper-button-next'))
  lockBannerInternalNode(next)
}

// ── 滑块默认内容 ─────────────────────────────────────────────────

function buildSlideDef(index: number) {
  return {
    type: WB_BANNER_SLIDE_TYPE,
    tagName: 'div',
    name: `Banner Slide ${index + 1}`,
    removable: true,
    copyable: true,
    selectable: true,
    droppable: false,
    highlightable: true,
    draggable: '.swiper-wrapper',
    attributes: { class: 'swiper-slide wb-banner__slide' },
    slideImage: 'https://placehold.co/1920x1080/1a1a2e/ffffff',
    slideImageAlt: '',
    slideTitle: `Banner Title ${index + 1}`,
    slideDescription: 'Your subtitle text goes here. Describe your product or service.',
    slideButtonText: 'CONTACT NOW',
    slideLinkUrl: '#',
    slideLinkTarget: '_self',
    components: [
      {
        tagName: 'img',
        removable: false,
        copyable: false,
        selectable: false,
        droppable: false,
        draggable: false,
        highlightable: false,
        layerable: false,
        editable: false,
        attributes: {
          class: 'wb-banner__bg',
          src: 'https://placehold.co/1920x1080/1a1a2e/ffffff',
          alt: '',
        },
      },
      {
        tagName: 'div',
        selectable: false,
        droppable: false,
        draggable: false,
        highlightable: false,
        layerable: false,
        editable: false,
        attributes: { class: 'wb-banner__overlay' },
        components: [
          {
            tagName: 'div',
            selectable: false,
            droppable: false,
            draggable: false,
            highlightable: false,
            layerable: false,
            editable: false,
            attributes: { class: 'wb-banner__container' },
            components: [
              {
                tagName: 'div',
                selectable: false,
                droppable: false,
                draggable: false,
                highlightable: false,
                layerable: false,
                editable: false,
                attributes: { class: 'wb-banner__content' },
                components: [
                  {
                    tagName: 'h2',
                    type: 'text',
                    selectable: false,
                    droppable: false,
                    draggable: false,
                    highlightable: false,
                    layerable: false,
                    editable: false,
                    attributes: {
                      class: 'ani wb-banner__title',
                      'swiper-animate-effect': 'fadeInUp',
                      'swiper-animate-duration': '0.5s',
                    },
                    components: `Banner Title ${index + 1}`,
                  },
                  {
                    tagName: 'p',
                    type: 'text',
                    selectable: false,
                    droppable: false,
                    draggable: false,
                    highlightable: false,
                    layerable: false,
                    editable: false,
                    attributes: {
                      class: 'ani wb-banner__desc',
                      'swiper-animate-effect': 'fadeInUp',
                      'swiper-animate-duration': '0.5s',
                      'swiper-animate-delay': '0.2s',
                    },
                    components: 'Your subtitle text goes here. Describe your product or service.',
                  },
                  {
                    tagName: 'a',
                    selectable: false,
                    droppable: false,
                    draggable: false,
                    highlightable: false,
                    layerable: false,
                    editable: false,
                    attributes: {
                      class: 'ani wb-banner__cta',
                      href: '#',
                      target: '_self',
                      'swiper-animate-effect': 'fadeInUp',
                      'swiper-animate-duration': '0.5s',
                      'swiper-animate-delay': '0.4s',
                    },
                    components: [
                      {
                        tagName: 'span',
                        type: 'text',
                        selectable: false,
                        droppable: false,
                        draggable: false,
                        highlightable: false,
                        layerable: false,
                        editable: false,
                        attributes: { class: 'wb-banner__cta-label' },
                        components: 'CONTACT NOW',
                      },
                      {
                        tagName: 'i',
                        type: 'text',
                        selectable: false,
                        droppable: false,
                        draggable: false,
                        highlightable: false,
                        layerable: false,
                        editable: false,
                        attributes: { class: 'wb-banner__cta-icon' },
                        components: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="7.545314788818359" height="13.798747062683105" viewBox="0 0 7.545314788818359 13.798747062683105"><path d="M0.19408162,1.1325252L5.989419,6.866704L0.23158942,12.685846C-0.02397071,12.941384,-0.02306027,13.356615,0.23356543,13.61324C0.49021322,13.869889,0.90542096,13.870777,1.160848,13.549639L7.3029509,7.4075375C7.3858061,7.3148007,7.4810295,7.2052526,7.4968181,7.1461372C7.5938425,6.9049888,7.5452747,6.6087008,7.3511844,6.3651543L1.1232733,0.13724433C0.86555904,-0.054758705,0.44844228,-0.05575816,0.19179367,0.20089003C-0.064810015,0.4575386,-0.06381055,0.87463331,0.19408162,1.1325252Z" fill="#FFFFFF" fill-opacity="1" style="mix-blend-mode:passthrough"/></svg>',
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

function getSlideNodeAtPath(slide: any, path: number[]) {
  let current = slide
  for (const index of path) {
    current = current?.components?.()?.at?.(index)
    if (!current) return null
  }
  return current
}

function getBannerSlideTraits() {
  return [
    makeImagePickerTrait('背景图片', 'slideImage', { showPreview: true }),
    makeTextTrait('图片替代文字', 'slideImageAlt', { placeholder: 'Banner image alt' }),
    makeTextareaTrait('标题', 'slideTitle', { placeholder: 'Banner Title', rows: 3 }),
    makeTextareaTrait('内容', 'slideDescription', { placeholder: 'Banner description', rows: 4 }),
    makeTextTrait('按钮文字', 'slideButtonText', { placeholder: 'CONTACT NOW' }),
    makeLinkTrait({ label: '按钮链接', name: 'slideLinkUrl', placeholder: 'https://' }),
    makeLinkTargetTrait({ label: '按钮打开方式', name: 'slideLinkTarget' }),
  ]
}

function syncBannerSlideContent(slide: any) {
  const bg = getSlideNodeAtPath(slide, [0])
  bg?.addAttributes?.({
    src: slide.get?.('slideImage') || 'https://placehold.co/1920x1080/1a1a2e/ffffff',
    alt: slide.get?.('slideImageAlt') || '',
  })

  const title = getSlideNodeAtPath(slide, [1, 0, 0, 0])
  if (title) title.components?.(slide.get?.('slideTitle') || '')

  const desc = getSlideNodeAtPath(slide, [1, 0, 0, 1])
  if (desc) desc.components?.(slide.get?.('slideDescription') || '')

  const cta = getSlideNodeAtPath(slide, [1, 0, 0, 2])
  cta?.addAttributes?.({
    href: slide.get?.('slideLinkUrl') || '#',
    target: slide.get?.('slideLinkTarget') || '_self',
  })

  const ctaLabel = getSlideNodeAtPath(slide, [1, 0, 0, 2, 0])
  if (ctaLabel) ctaLabel.components?.(slide.get?.('slideButtonText') || '')
}

function restoreBannerSlideContent(slide: any, fallbackIndex = 0) {
  const bg = getSlideNodeAtPath(slide, [0])
  const title = getSlideNodeAtPath(slide, [1, 0, 0, 0])
  const desc = getSlideNodeAtPath(slide, [1, 0, 0, 1])
  const cta = getSlideNodeAtPath(slide, [1, 0, 0, 2])
  const ctaLabel = getSlideNodeAtPath(slide, [1, 0, 0, 2, 0])

  slide.set('slideImage', bg?.getAttributes?.()?.src || 'https://placehold.co/1920x1080/1a1a2e/ffffff', { silent: true })
  slide.set('slideImageAlt', bg?.getAttributes?.()?.alt || '', { silent: true })
  slide.set('slideTitle', title?.toHTML?.()?.replace(/^<[^>]+>|<\/[^>]+>$/g, '') || title?.get?.('content') || `Banner Title ${fallbackIndex + 1}`, { silent: true })
  slide.set('slideDescription', desc?.toHTML?.()?.replace(/^<[^>]+>|<\/[^>]+>$/g, '') || desc?.get?.('content') || 'Your subtitle text goes here. Describe your product or service.', { silent: true })
  slide.set('slideButtonText', ctaLabel?.toHTML?.()?.replace(/^<[^>]+>|<\/[^>]+>$/g, '') || ctaLabel?.get?.('content') || 'CONTACT NOW', { silent: true })
  slide.set('slideLinkUrl', cta?.getAttributes?.()?.href || '#', { silent: true })
  slide.set('slideLinkTarget', cta?.getAttributes?.()?.target || '_self', { silent: true })
}

function upgradeBannerSlideModel(slide: any, index: number) {
  if (!slide?.set) return

  slide.set({
    name: `Banner Slide ${index + 1}`,
    draggable: '.swiper-wrapper',
    droppable: false,
    selectable: true,
    editable: false,
    stylable: true,
    traits: getBannerSlideTraits(),
  })

  if (!slide.__wbBannerSlideBound) {
    slide.on(
      'change:slideImage change:slideImageAlt change:slideTitle change:slideDescription ' +
      'change:slideButtonText change:slideLinkUrl change:slideLinkTarget',
      () => syncBannerSlideContent(slide),
    )
    slide.__wbBannerSlideBound = true
  }

  restoreBannerSlideContent(slide, index)
  syncBannerSlideContent(slide)
}

function resolveBannerTraitTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_BANNER_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_BANNER_TYPE) as any
  if (fromSelected?.get?.('type') === WB_BANNER_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_BANNER_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_BANNER_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_BANNER_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_BANNER_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_BANNER_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_BANNER_TYPE) return fromTraitTarget

  return null
}

function createAddSlideTrait() {
  return {
    type: 'button' as any,
    name: 'add-slide',
    // GrapesJS：label 为 false 表示不显示 trait 标签；需字面量 false，避免被推断为 boolean
    label: false as const,
    text: '+ 添加 slide',
    full: true,
    command(this: any, editor: Editor) {
      const banner = resolveBannerTraitTarget(editor, this)
      const wrapper = banner?._getWrapper?.()
      const slides = wrapper?.components?.()
      if (!slides) return

      const created = slides.add(buildSlideDef(slides.length || 0))
      banner?.set?.('slidesVersion', Number(banner?.get?.('slidesVersion')) + 1 || 1)
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

// ── 共享 initSwiper 逻辑字符串（script 与 script-export 完全相同）─────
// 注意：GrapesJS 会将 script/script-export 序列化为字符串，函数体必须是纯 JS，
// 不能引用模块作用域的变量。使用工厂函数返回函数体，保证两处同步。

function makeBannerScript() {
  return function (this: any, props: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this

    // script-props 通过 data-* 传递，值可能是字符串 "true"/"false"
    function toBool(v: any) {
      if (typeof v === 'boolean') return v
      if (typeof v === 'string') return v === 'true'
      return !!v
    }

    // 注入 banner 主样式 + 动画 keyframes（合并为一个 style 标签）
    if (!document.getElementById('wb-banner-css')) {
      const s = document.createElement('style')
      s.id = 'wb-banner-css'
      s.textContent =
        '.wb-banner{width:100%;height:56.25vw;max-height:100vh;box-sizing:border-box;overflow:hidden;position:relative}' +
        '.wb-banner__swiper{width:100%;height:100%}' +
        '.wb-banner__swiper .swiper-wrapper{align-items:stretch}' +
        '.wb-banner__slide{position:relative;overflow:hidden}' +
        '.wb-banner__slide .wb-banner__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}' +
        '.wb-banner__overlay{position:absolute;inset:0;display:flex;align-items:center;z-index:1}' +
        '.wb-banner__container{width:100%;max-width:1280px;margin:0 auto;padding:0 24px;box-sizing:border-box}' +
        '.wb-banner__content{max-width:750px;color:#fff}' +
        '.wb-banner__title{margin-bottom:20px;font-size:56px;font-weight:600;line-height:1.2}' +
        '.wb-banner__desc{margin-bottom:32px;font-size:18px;font-weight:300;line-height:1.6;max-width:560px}' +
        '.wb-banner__cta{display:inline-flex;align-items:center;background:#fff;color:#000;padding:4px;border-radius:9999px;text-decoration:none}' +
        '.wb-banner__cta-label{padding:0 16px;font-size:14px;font-weight:500}' +
        '.wb-banner__cta-icon{width:40px;height:40px;background:#041038;border-radius:9999px;color:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:16px;flex-shrink:0}' +
        '.wb-banner__swiper .swiper-button-prev,.wb-banner__swiper .swiper-button-next{color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.4)}' +
        '.wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-horizontal,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-custom,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-fraction{bottom:5%}' +
        '.wb-banner__swiper .swiper-button-prev::after,.wb-banner__swiper .swiper-button-next::after{font-size:24px}' +
        '.wb-banner__swiper .swiper-pagination-bullet{background:#fff;opacity:.6}' +
        '.wb-banner__swiper .swiper-pagination-bullet-active{opacity:1}' +
        '.wb-banner__swiper.wb-banner-rect-pagi .swiper-pagination-bullet{width:24px;height:3px;border-radius:0}' +
        '.wb-banner__swiper .swiper-button-prev.wb-nav-custom::after,.wb-banner__swiper .swiper-button-next.wb-nav-custom::after{display:none}' +
        '@media(max-width:1023px){' +
          '.wb-banner{height:72vw!important;min-height:520px;max-height:none!important}' +
          '.wb-banner__overlay{align-items:flex-end}' +
          '.wb-banner__container{padding:0 20px 88px!important}' +
          '.wb-banner__content{max-width:620px!important}' +
          '.wb-banner__title{font-size:40px!important;margin-bottom:16px!important}' +
          '.wb-banner__desc{font-size:16px!important;margin-bottom:24px!important;max-width:500px!important}' +
          '.wb-banner__swiper .swiper-button-prev::after,.wb-banner__swiper .swiper-button-next::after{font-size:20px}' +
          '.wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-horizontal,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-custom,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-fraction{bottom:32px}' +
        '}' +
        '@media(max-width:767px){' +
          '.wb-banner{height:150vw!important;min-height:420px}' +
          '.wb-banner__container{padding:0 16px 72px!important}' +
          '.wb-banner__content{max-width:none!important}' +
          '.wb-banner__title{font-size:28px!important;line-height:1.15!important;margin-bottom:14px!important}' +
          '.wb-banner__desc{font-size:14px!important;line-height:1.6!important;margin-bottom:18px!important;max-width:none!important}' +
          '.wb-banner__cta{padding:3px!important}' +
          '.wb-banner__cta-label{padding:0 14px!important;font-size:13px!important}' +
          '.wb-banner__cta-icon{width:36px!important;height:36px!important;font-size:14px!important}' +
          '.wb-banner__swiper .swiper-button-prev,.wb-banner__swiper .swiper-button-next{display:none!important}' +
          '.wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-horizontal,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-custom,.wb-banner__swiper.swiper-horizontal>.swiper-pagination-fraction{bottom:22px}' +
        '}' +
        '@keyframes fadeInUp{from{opacity:0;transform:translate3d(0,40px,0)}to{opacity:1;transform:none}}' +
        '@keyframes fadeIn{from{opacity:0}to{opacity:1}}' +
        '@keyframes fadeInLeft{from{opacity:0;transform:translate3d(-40px,0,0)}to{opacity:1;transform:none}}' +
        '@keyframes fadeInRight{from{opacity:0;transform:translate3d(40px,0,0)}to{opacity:1;transform:none}}' +
        '@keyframes zoomIn{from{opacity:0;transform:scale3d(.3,.3,.3)}50%{opacity:1}}' +
        '.ani{opacity:0;}'
      document.head.appendChild(s)
    }

    function resetAni(container: any) {
      container.querySelectorAll('.ani').forEach(function (node: any) {
        node.style.animationName = 'none'
        node.style.opacity = '0'
      })
    }

    function runAni(swiper: any) {
      resetAni(swiper.el)
      const activeSlide = swiper.el.querySelector('.swiper-slide-active')
      if (!activeSlide) return
      activeSlide.querySelectorAll('.ani').forEach(function (node: any) {
        const effect = node.getAttribute('swiper-animate-effect') || 'fadeIn'
        const duration = node.getAttribute('swiper-animate-duration') || '0.5s'
        const delay = node.getAttribute('swiper-animate-delay') || '0s'
        void node.offsetHeight
        node.style.animationDuration = duration
        node.style.animationDelay = delay
        node.style.animationFillMode = 'both'
        node.style.animationName = effect
        node.style.opacity = '1'
      })
    }

    function ensureSwiper() {
      return new Promise(function (resolve: any, reject: any) {
        const w = window as any
        if (w.Swiper) { resolve(); return }

        // 超时保护：10 秒后仍未加载则 reject
        const timer = setTimeout(function () { reject(new Error('Swiper load timeout')) }, 10000)

        if (!document.querySelector('link[data-wb-swiper]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.setAttribute('data-wb-swiper', '1')
          link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
          document.head.appendChild(link)
        }

        const existing = document.querySelector('script[data-wb-swiper]') as any
        if (existing) {
          if ((window as any).Swiper) { clearTimeout(timer); resolve(); return }
          const done = function () { clearTimeout(timer); resolve() }
          existing.addEventListener('load', done, { once: true })
          existing.addEventListener('error', function () { clearTimeout(timer); reject(new Error('Swiper script failed')) }, { once: true })
          return
        }

        const sc = document.createElement('script')
        sc.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
        sc.setAttribute('data-wb-swiper', '1')
        sc.onload = function () { clearTimeout(timer); resolve() }
        sc.onerror = function () { clearTimeout(timer); reject(new Error('Swiper script failed')) }
        document.body.appendChild(sc)
      })
    }

    function setArrowImg(el: any, src: string) {
      if (!el) return
      let img = el.querySelector('img.wb-nav-img')
      if (src) {
        if (!img) {
          img = document.createElement('img')
          img.className = 'wb-nav-img'
          img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;position:absolute;inset:0;'
          el.style.position = 'relative'
          el.appendChild(img)
        }
        img.src = src
        el.classList.add('wb-nav-custom')
      } else {
        if (img) img.remove()
        el.classList.remove('wb-nav-custom')
      }
    }

    function initSwiper() {
      const w = window as any
      if (!w.Swiper) return
      if (root._wbBannerSwiper) {
        try { root._wbBannerSwiper.destroy(true, true) } catch (_) {}
      }

      const paginationStyle = props.paginationStyle || 'dots'
      const showPagination = paginationStyle !== 'none'
      const showArrows = toBool(props.showArrows)
      const prevArrowSrc = props.prevArrowSrc || ''
      const nextArrowSrc = props.nextArrowSrc || ''
      const autoplay = toBool(props.autoplay)
      const loop = toBool(props.loop)
      const speed = Math.max(100, Number(props.speed) || 600)

      const swiperEl = root.querySelector('.swiper')
      if (!swiperEl) return

      const paginationEl = swiperEl.querySelector('.swiper-pagination')
      const prevEl = swiperEl.querySelector('.swiper-button-prev')
      const nextEl = swiperEl.querySelector('.swiper-button-next')
      const slideCount = swiperEl.querySelectorAll('.swiper-wrapper > .swiper-slide').length
      const safeLoop = loop && slideCount >= 2

      // 显示/隐藏控件
      if (paginationEl) paginationEl.style.display = showPagination ? '' : 'none'
      if (prevEl) prevEl.style.display = showArrows ? '' : 'none'
      if (nextEl) nextEl.style.display = showArrows ? '' : 'none'

      // 矩形分页样式
      if (paginationStyle === 'rect') {
        swiperEl.classList.add('wb-banner-rect-pagi')
      } else {
        swiperEl.classList.remove('wb-banner-rect-pagi')
      }

      // 自定义箭头图片
      setArrowImg(prevEl, prevArrowSrc)
      setArrowImg(nextEl, nextArrowSrc)

      // 分页配置
      let paginationConfig: any = false
      if (showPagination && paginationEl) {
        if (paginationStyle === 'number') {
          paginationConfig = { el: paginationEl, type: 'fraction' }
        } else {
          paginationConfig = { el: paginationEl, clickable: true, type: 'bullets' }
        }
      }

      root._wbBannerSwiper = new w.Swiper(swiperEl, {
        loop: safeLoop,
        speed,
        pagination: paginationConfig,
        navigation: showArrows && prevEl && nextEl
          ? { prevEl, nextEl }
          : false,
        autoplay: autoplay
          ? { delay: Math.max(500, Number(props.autoplayDelay) || 4000), disableOnInteraction: false }
          : false,
        on: {
          slideChangeTransitionEnd: function (swiper: any) { runAni(swiper) },
        },
      })

      ;(function (sw: any) {
        requestAnimationFrame(function () { runAni(sw) })
      })(root._wbBannerSwiper)
    }

    // 降级保护：5 秒内 Swiper 未就绪则强制显示所有动画元素
    const aniFallback = setTimeout(function () {
      root.querySelectorAll('.ani').forEach(function (n: any) { n.style.opacity = '1' })
    }, 5000)

    ensureSwiper().then(function () {
      clearTimeout(aniFallback)
      initSwiper()
    }).catch(function () {
      clearTimeout(aniFallback)
      // Swiper 加载失败，强制显示所有内容
      root.querySelectorAll('.ani').forEach(function (n: any) { n.style.opacity = '1' })
    })
  }
}

// ── 注册 ─────────────────────────────────────────────────────────

export function registerBannerComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_BANNER_TYPE)) return

  const bannerScript = makeBannerScript()

  const getBannerRoot = (component: any) => {
    if (!component) return null
    if (component.get?.('type') === WB_BANNER_TYPE) return component
    return component.closestType?.(WB_BANNER_TYPE) ?? null
  }

  const getBannerSlideRoot = (component: any) => {
    if (!component) return null
    if (component.get?.('type') === WB_BANNER_SLIDE_TYPE) return component
    const slide = component.closestType?.(WB_BANNER_SLIDE_TYPE)
    if (slide?.get?.('type') === WB_BANNER_SLIDE_TYPE) return slide
    return null
  }

  const clearBannerEditingState = () => {
    const doc = (editor as any).Canvas?.getDocument?.()
    doc?.querySelectorAll?.('.wb-banner.wb-banner--editing')?.forEach?.((el: Element) => {
      el.classList.remove('wb-banner--editing')
    })
  }

  const syncBannerEditingState = (component?: any) => {
    clearBannerEditingState()
    const banner = getBannerRoot(component ?? editor.getSelected?.())
    const el = banner?.getEl?.()
    if (el?.classList) {
      el.classList.add('wb-banner--editing')
    }
  }

  domComponents.addType(WB_BANNER_SLIDE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.classList?.contains('wb-banner__slide')
        ? { type: WB_BANNER_SLIDE_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Banner Slide',
        tagName: 'div',
        draggable: '.swiper-wrapper',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: { class: 'swiper-slide wb-banner__slide' },
        slideImage: 'https://placehold.co/1920x1080/1a1a2e/ffffff',
        slideImageAlt: '',
        slideTitle: 'Banner Title',
        slideDescription: 'Your subtitle text goes here. Describe your product or service.',
        slideButtonText: 'CONTACT NOW',
        slideLinkUrl: '#',
        slideLinkTarget: '_self',
        traits: getBannerSlideTraits(),
      },
      init(this: any) {
        const fallbackIndex = Math.max(0, this.parent?.()?.indexOf?.(this) ?? 0)
        restoreBannerSlideContent(this, fallbackIndex)
        this.on(
          'change:slideImage change:slideImageAlt change:slideTitle change:slideDescription ' +
          'change:slideButtonText change:slideLinkUrl change:slideLinkTarget',
          this.syncSlideContent,
        )
        this.syncSlideContent()
      },
      syncSlideContent(this: any) {
        syncBannerSlideContent(this)
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type !== WB_BANNER_TYPE && type !== WB_BANNER_SLIDE_TYPE) {
      const slide = getBannerSlideRoot(component)
      if (slide && slide !== component) {
        editor.select?.(slide)
        return
      }
    }
    syncBannerEditingState(component)
  })

  editor.on('component:deselected', () => {
    syncBannerEditingState()
  })

  editor.on('rte:enable', (view: any) => {
    const slide = getBannerSlideRoot(view?.model)
    if (slide) {
      editor.select?.(slide)
      return
    }
    syncBannerEditingState(view?.model)
  })

  editor.on('rte:disable', () => {
    syncBannerEditingState()
  })

  domComponents.addType(WB_BANNER_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'banner') {
        return { type: WB_BANNER_TYPE }
      }
      return false
    },

    model: {
      defaults: {
        name: 'Banner 轮播',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        classes: [BANNER_ROOT_CLASS],
        attributes: {
          'data-wb-component': 'banner',
          'data-loop': 'true',
          'data-autoplay': 'false',
          'data-autoplay-delay': '4000',
          'data-speed': '600',
          'data-show-arrows': 'true',
          'data-pagination-style': 'dots',
          'data-prev-arrow-src': '',
          'data-next-arrow-src': '',
        },
        // 模型属性
        loop: true,
        autoplay: false,
        autoplayDelay: 4000,
        speed: 600,
        showArrows: true,
        paginationStyle: 'dots',
        prevArrowSrc: '',
        nextArrowSrc: '',
        slidesVersion: 0,

        'script-props': [
          'loop', 'autoplay', 'autoplayDelay', 'speed',
          'showArrows', 'paginationStyle', 'prevArrowSrc', 'nextArrowSrc', 'slidesVersion',
        ],

        components: [
          {
            tagName: 'div',
            removable: false,
            copyable: false,
            selectable: false,
            droppable: false,
            attributes: { class: 'swiper wb-banner__swiper' },
            style: { width: '100%', height: '100%' },
            components: [
              {
                tagName: 'div',
                removable: false,
                copyable: false,
                selectable: false,
                droppable: false,
                attributes: { class: 'swiper-wrapper' },
                components: [
                  buildSlideDef(0),
                  buildSlideDef(1),
                ],
              },
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                attributes: { class: 'swiper-pagination' },
              },
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                attributes: { class: 'swiper-button-prev' },
              },
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                attributes: { class: 'swiper-button-next' },
              },
            ],
          },
        ],

        script: bannerScript,
        'script-export': bannerScript,

        traits: [
          createAddSlideTrait(),
          makeCheckboxTrait('循环', 'loop'),
          makeCheckboxTrait('自动播放', 'autoplay'),
          makeNumberTrait('自动播放间隔(ms)', 'autoplayDelay', { min: 500, max: 20000, step: 100 }),
          makeNumberTrait('切换速度(ms)', 'speed', { min: 100, max: 2000, step: 100 }),
          makeCheckboxTrait('显示箭头', 'showArrows'),
          makeImagePickerTrait('上一张箭头图片', 'prevArrowSrc', { showPreview: false }),
          makeImagePickerTrait('下一张箭头图片', 'nextArrowSrc', { showPreview: false }),
          {
            type: 'select',
            label: '分页点样式',
            name: 'paginationStyle',
            changeProp: true,
            options: [
              { id: 'dots', label: 'Dots（圆点）' },
              { id: 'rect', label: 'Rect（矩形）' },
              { id: 'number', label: 'Number（数字）' },
              { id: 'none', label: '无' },
            ],
          },
        ],
      },

      init(this: any) {
        this._restoreFromAttrs()
        this._ensureStructure()
        migrateBannerStructureClasses(this)
        this._getWrapper?.()?.components?.()?.forEach?.((slide: any, index: number) => {
          upgradeBannerSlideModel(slide, index)
        })
        this.on(
          'change:loop change:autoplay change:autoplayDelay change:speed ' +
          'change:showArrows change:paginationStyle change:prevArrowSrc change:nextArrowSrc',
          this.applyBannerConfig,
        )
        this.applyBannerConfig()
      },

      /**
       * 验证并修复组件树结构。
       * 保存/加载后内部元素（pagination、nav buttons）可能跑到 swiper 容器外面。
       */
      _ensureStructure(this: any) {
        const children = this.components?.()
        if (!children || children.length === 0) return

        // 找到 swiper 容器
        let swiperComp: any = null
        const orphans: any[] = []

        children.forEach((c: any) => {
          const cls = c.getClasses?.() ?? []
          if (cls.includes('wb-banner__swiper') || cls.includes('swiper')) {
            swiperComp = c
          } else {
            // 非 swiper 容器的直接子元素是孤儿（可能是被序列化错位的 pagination/nav）
            orphans.push(c)
          }
        })

        if (!swiperComp) return

        // 把跑到外面的孤儿元素移回 swiper 容器内
        for (const orphan of orphans) {
          const cls = orphan.getClasses?.() ?? []
          const isControl =
            cls.includes('swiper-pagination') ||
            cls.includes('swiper-button-prev') ||
            cls.includes('swiper-button-next')
          if (isControl) {
            const def = orphan.toJSON()
            orphan.remove()
            swiperComp.components().add(def)
          }
        }

        // 确保 swiper 内部有 pagination 和 nav buttons
        const swiperChildren = swiperComp.components?.()
        if (!swiperChildren) return

        const has = (cls: string) =>
          swiperChildren.find((c: any) => c.getClasses?.()?.includes?.(cls))

        if (!has('swiper-pagination')) {
          const pagination = swiperChildren.add({
            tagName: 'div', removable: false, selectable: false, droppable: false,
            layerable: false, draggable: false, highlightable: false, editable: false,
            attributes: { class: 'swiper-pagination' },
          })
          const target = Array.isArray(pagination) ? pagination[0] : pagination
          lockBannerInternalNode(target)
        }
        if (!has('swiper-button-prev')) {
          const prev = swiperChildren.add({
            tagName: 'div', removable: false, selectable: false, droppable: false,
            layerable: false, draggable: false, highlightable: false, editable: false,
            attributes: { class: 'swiper-button-prev' },
          })
          const target = Array.isArray(prev) ? prev[0] : prev
          lockBannerInternalNode(target)
        }
        if (!has('swiper-button-next')) {
          const next = swiperChildren.add({
            tagName: 'div', removable: false, selectable: false, droppable: false,
            layerable: false, draggable: false, highlightable: false, editable: false,
            attributes: { class: 'swiper-button-next' },
          })
          const target = Array.isArray(next) ? next[0] : next
          lockBannerInternalNode(target)
        }
      },

      /**
       * 从 data-* 属性反向恢复模型属性（安全网）。
       * 处理从已保存 HTML 加载时模型属性可能未正确恢复的情况。
       */
      _restoreFromAttrs(this: any) {
        const attrs = this.getAttributes() || {}
        const toBool = (v: any) => v === true || v === 'true'
        const mapping: Record<string, [string, (v: any) => any]> = {
          'data-loop': ['loop', toBool],
          'data-autoplay': ['autoplay', toBool],
          'data-autoplay-delay': ['autoplayDelay', (v: any) => Number(v) || 4000],
          'data-speed': ['speed', (v: any) => Number(v) || 600],
          'data-show-arrows': ['showArrows', toBool],
          'data-pagination-style': ['paginationStyle', (v: any) => v || 'dots'],
          'data-prev-arrow-src': ['prevArrowSrc', (v: any) => v || ''],
          'data-next-arrow-src': ['nextArrowSrc', (v: any) => v || ''],
        }
        for (const [attr, [prop, parse]] of Object.entries(mapping)) {
          if (attrs[attr] !== undefined) {
            this.set(prop, parse(attrs[attr]), { silent: true })
          }
        }
      },

      _getWrapper(this: any) {
        const swiperDiv = this.components?.()?.at?.(0)
        if (!swiperDiv) return null
        return swiperDiv.components?.()?.at?.(0) ?? null
      },

      applyBannerConfig(this: any) {
        this.addAttributes({
          'data-loop': `${!!this.get('loop')}`,
          'data-autoplay': `${!!this.get('autoplay')}`,
          'data-autoplay-delay': `${Math.max(500, Number(this.get('autoplayDelay')) || 4000)}`,
          'data-speed': `${Math.max(100, Number(this.get('speed')) || 600)}`,
          'data-show-arrows': `${!!this.get('showArrows')}`,
          'data-pagination-style': this.get('paginationStyle') || 'dots',
          'data-prev-arrow-src': this.get('prevArrowSrc') || '',
          'data-next-arrow-src': this.get('nextArrowSrc') || '',
        })
      },
    },
  })
}

function registerBannerBlock(editor: Editor, options: BannerPluginOptions) {
  if (editor.BlockManager.get(WB_BANNER_TYPE)) return

  editor.BlockManager.add(WB_BANNER_TYPE, {
    label: options.label ?? 'Banner 轮播',
    category: options.category ?? 'Media',
    content: { type: WB_BANNER_TYPE },
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M6 16l3-3 2.5 2 3.5-4 3 5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
    </svg>`,
  })
}

const gjsBanner: Plugin<BannerPluginOptions> = (editor, opts = {}) => {
  const options: BannerPluginOptions = {
    category: 'Media',
    label: 'Banner 轮播',
    addBlock: true,
    ...opts,
  }

  registerBannerComponent(editor)

  // 将 Banner CSS 注入到画布 iframe（补充 script 内注入，避免首帧竞态）
  function injectBannerCss(doc: Document) {
    try {
      if (doc.getElementById('wb-banner-css')) return
      const s = doc.createElement('style')
      s.id = 'wb-banner-css'
      s.textContent = BANNER_CSS
      ;(doc.head ?? doc.documentElement).appendChild(s)
    } catch { /* iframe 未就绪 */ }
  }

  editor.on('canvas:frame:load', (eventData: any) => {
    const frame = (eventData as any)?.frame ?? eventData
    const doc = frame?.view?.el?.contentDocument ?? frame?.view?.getDocument?.()
    if (doc) injectBannerCss(doc)
  })

  // 尝试注入到已有 frame
  try {
    const doc = (editor as any).Canvas?.getDocument?.()
    if (doc) injectBannerCss(doc)
  } catch { /* 可能尚未初始化 */ }

  if (options.addBlock !== false) {
    registerBannerBlock(editor, options)
  }
}

export default gjsBanner
