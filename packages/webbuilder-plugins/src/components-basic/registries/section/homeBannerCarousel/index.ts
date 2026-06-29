import type { Editor } from 'grapesjs'
import {
  makeCheckboxTrait,
  makeColorPickerTrait,
  makeImagePickerTrait,
  makeLinkTargetTrait,
  makeLinkTrait,
  makeTextareaTrait,
  makeTextTrait,
} from '../../../traitFactory.js'
import { removeUngroupedCssRulesByPrefixes } from '../../../cssScope.js'

export const WB_HOME_BANNER_CAROUSEL_TYPE = 'wb-home-banner-carousel'
export const WB_HOME_BANNER_SLIDE_TYPE = 'wb-home-banner-slide'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="2" y="5" width="20" height="14" rx="2" />
  <circle cx="8" cy="21" r="0.5" fill="currentColor" />
  <circle cx="12" cy="21" r="0.5" fill="currentColor" />
  <circle cx="16" cy="21" r="0.5" fill="currentColor" />
</svg>`

const CHILD_LOCK = {
  selectable: false,
  hoverable: false,
  draggable: false,
  droppable: false,
  layerable: false,
  highlightable: false,
  copyable: false,
  removable: false,
  badgable: false,
} as const

// 可选但不可拖拽 / 删除，用于 slide 内部可编辑样式的结构节点
const CHILD_STYLABLE = {
  selectable: true,
  hoverable: true,
  draggable: false,
  droppable: false,
  layerable: true,
  highlightable: true,
  copyable: false,
  removable: false,
  badgable: true,
  stylable: true,
} as const

const DEFAULT_DESKTOP_IMAGE =
  'https://thb-1374992156.cos.ap-hongkong.myqcloud.com/20260419/slider-1_1776585802257.webp'
const DEFAULT_MOBILE_IMAGE =
  'https://thb-1374992156.cos.ap-hongkong.myqcloud.com/20260419/slider-1-m_1776585801294.webp'

type SlideData = {
  desktopImage: string
  mobileImage: string
  eyebrow: string
  title: string
  desc: string
  primaryBtnText: string
  primaryBtnLink: string
  primaryBtnTarget: string
  secondaryBtnText: string
  secondaryBtnLink: string
  secondaryBtnTarget: string
}

const DEFAULT_SLIDES: SlideData[] = [
  {
    desktopImage: DEFAULT_DESKTOP_IMAGE,
    mobileImage: DEFAULT_MOBILE_IMAGE,
    eyebrow: '',
    title: 'Not Only Bearings. Better Bearing Decisions.',
    desc:
      'Thb Supplies Reliable Bearings And Works With Customers To Make The Right Choices For Real Operating Conditions.',
    primaryBtnText: 'Find Products',
    primaryBtnLink: '#',
    primaryBtnTarget: '_self',
    secondaryBtnText: 'Find Solutions',
    secondaryBtnLink: '#',
    secondaryBtnTarget: '_self',
  },
  {
    desktopImage: DEFAULT_DESKTOP_IMAGE,
    mobileImage: DEFAULT_MOBILE_IMAGE,
    eyebrow: '',
    title: 'Precision. Durability. Delivered.',
    desc:
      'From Specification To On-Site Support, Thb Partners With Engineers To Keep Machines Running.',
    primaryBtnText: 'Find Products',
    primaryBtnLink: '#',
    primaryBtnTarget: '_self',
    secondaryBtnText: 'Find Solutions',
    secondaryBtnLink: '#',
    secondaryBtnTarget: '_self',
  },
]

// ─────────────────────────────────────────────
// 样式属性定义（配合响应式设备切换，读写对应 media 规则）
// ─────────────────────────────────────────────

type StylePropKind = 'length' | 'color' | 'raw'

interface BannerStyleProp {
  name: string
  cssVar: string
  defaultValue: string
  kind: StylePropKind
  label: string
}

const BANNER_STYLE_PROPS: BannerStyleProp[] = [
  // Carousel layout
  { name: 'bannerHeight', cssVar: '--banner-height', defaultValue: 'min(56vw, 100vh)', kind: 'raw', label: '轮播高度' },
  { name: 'bannerBg', cssVar: '--banner-bg', defaultValue: '#111827', kind: 'color', label: '轮播背景色' },
  { name: 'colorSlideBg', cssVar: '--color-slide-bg', defaultValue: '#0b1220', kind: 'color', label: '幻灯片底色' },
  // Slide background
  { name: 'overlayGradient', cssVar: '--overlay-gradient', defaultValue: 'rgba(0, 0, 0, 0)', kind: 'raw', label: '遮罩渐变' },
  { name: 'bgZoom', cssVar: '--bg-zoom', defaultValue: '1.08', kind: 'raw', label: '背景缩放比例' },
  { name: 'transitionBg', cssVar: '--transition-bg', defaultValue: '1.8s ease', kind: 'raw', label: '背景过渡' },
  // Nav buttons
  { name: 'navSize', cssVar: '--nav-size', defaultValue: '52px', kind: 'length', label: '切换按钮尺寸' },
  { name: 'navOffset', cssVar: '--nav-offset', defaultValue: '20px', kind: 'length', label: '切换按钮边距' },
  { name: 'navIconSize', cssVar: '--nav-icon-size', defaultValue: '18px', kind: 'length', label: '切换按钮图标' },
  { name: 'navRadius', cssVar: '--nav-radius', defaultValue: '999px', kind: 'length', label: '切换按钮圆角' },
  { name: 'navColor', cssVar: '--nav-color', defaultValue: '#ffffff', kind: 'color', label: '切换按钮颜色' },
  { name: 'navBg', cssVar: '--nav-bg', defaultValue: 'rgba(255, 255, 255, 0.14)', kind: 'raw', label: '切换按钮背景' },
  { name: 'navBgHover', cssVar: '--nav-bg-hover', defaultValue: 'rgba(255, 255, 255, 0.22)', kind: 'raw', label: '切换按钮悬停背景' },
  { name: 'navBlur', cssVar: '--nav-blur', defaultValue: '8px', kind: 'length', label: '切换按钮模糊' },
  { name: 'navTransition', cssVar: '--nav-transition', defaultValue: '0.25s ease', kind: 'raw', label: '切换按钮过渡' },
  // Pagination
  { name: 'paginationWidth', cssVar: '--pagination-width', defaultValue: '48px', kind: 'length', label: '分页器宽度' },
  { name: 'paginationHeight', cssVar: '--pagination-height', defaultValue: '1px', kind: 'length', label: '分页器高度' },
  { name: 'paginationRadius', cssVar: '--pagination-radius', defaultValue: '0', kind: 'length', label: '分页器圆角' },
  { name: 'paginationBg', cssVar: '--pagination-bg', defaultValue: 'rgba(2, 5, 27, 0.1)', kind: 'raw', label: '分页器底色' },
  { name: 'paginationBottom', cssVar: '--pagination-bottom', defaultValue: '64px', kind: 'length', label: '分页器底部距离' },
  { name: 'thumbBg', cssVar: '--thumb-bg', defaultValue: '#02051B', kind: 'color', label: '分页器滑块色' },
  { name: 'thumbTransition', cssVar: '--thumb-transition', defaultValue: '0.4s ease', kind: 'raw', label: '分页器滑块过渡' },
]

const BANNER_STYLE_DEFAULT_VALUES = BANNER_STYLE_PROPS.reduce((acc, prop) => {
  acc[prop.name] = prop.defaultValue
  return acc
}, {} as Record<string, string>)

function sanitizeText(value: any, fallback = ''): string {
  return `${value ?? fallback}`.trim()
}

function normalizeBannerStyleValue(prop: BannerStyleProp, rawValue: any): string {
  const fallback = prop.defaultValue
  const normalized = sanitizeText(rawValue, fallback)
  if (!normalized) return fallback
  if (prop.kind !== 'length') return normalized
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return normalized === '0' ? '0' : `${normalized}px`
  }
  return normalized
}

function buildBannerStyleVars(model: any): Record<string, string> {
  return BANNER_STYLE_PROPS.reduce((vars, prop) => {
    vars[prop.cssVar] = normalizeBannerStyleValue(prop, model.get?.(prop.name))
    return vars
  }, {} as Record<string, string>)
}

function makeBannerStyleTraits() {
  return BANNER_STYLE_PROPS.map((prop) => {
    if (prop.kind === 'color') return makeColorPickerTrait(prop.label, prop.name)
    return makeTextTrait(prop.label, prop.name, { placeholder: prop.defaultValue })
  })
}

// ─────────────────────────────────────────────
// 设备媒体查询解析（参考 inquiryForm 的实现）
// ─────────────────────────────────────────────

function normalizeMediaQuery(value: string): string {
  const raw = `${value ?? ''}`.trim()
  if (!raw) return ''
  if (raw.startsWith('(') || raw.startsWith('not ') || raw.startsWith('only ')) return raw
  if (raw.includes(':')) return raw
  return `(max-width: ${raw})`
}

function getCurrentDeviceRuleOptions(editor: any):
  { atRuleType: 'media'; atRuleParams: string } | undefined {
  const selectedDevice = editor?.Devices?.getSelected?.()
  if (!selectedDevice || typeof selectedDevice.get !== 'function') return undefined

  const deviceId = `${selectedDevice.get('id') ?? ''}`.trim().toLowerCase()
  if (!deviceId || deviceId === 'desktop') return undefined

  const widthMedia =
    selectedDevice.getWidthMedia?.()
    ?? selectedDevice.get?.('widthMedia')
    ?? selectedDevice.get?.('width')
    ?? ''

  const atRuleParams = normalizeMediaQuery(widthMedia)
  if (!atRuleParams) return undefined

  return { atRuleType: 'media', atRuleParams }
}

function ensureBannerSelector(model: any): string {
  const attrs = { ...(model.getAttributes?.() ?? {}) }
  let id = sanitizeText(attrs.id)
  if (!id) {
    id = `wb-home-banner-${model.cid || Date.now()}`
    model.addAttributes?.({ id })
  }
  return `#${id}`
}

function readBannerRuleStyle(editor: any, selector: string, ruleOptions?: { atRuleType: 'media'; atRuleParams: string }) {
  return editor?.Css?.getRule?.(selector, ruleOptions)?.getStyle?.() ?? {}
}

function applyBannerStyleVarsToCurrentDevice(editor: any, model: any): void {
  const selector = ensureBannerSelector(model)
  const ruleOptions = getCurrentDeviceRuleOptions(editor)
  const currentRule = editor?.Css?.getRule?.(selector, ruleOptions)
  const nextStyles = {
    ...(currentRule?.getStyle?.() ?? {}),
    ...buildBannerStyleVars(model),
  }
  if (currentRule) {
    currentRule.setStyle?.(nextStyles)
    return
  }
  editor?.Css?.setRule?.(selector, nextStyles, ruleOptions)
}

function syncBannerTraitValuesFromRules(editor: any, model: any): void {
  const selector = ensureBannerSelector(model)
  const baseStyles = readBannerRuleStyle(editor, selector)
  const deviceRuleOptions = getCurrentDeviceRuleOptions(editor)
  const deviceStyles = deviceRuleOptions
    ? readBannerRuleStyle(editor, selector, deviceRuleOptions)
    : {}

  const merged = {
    ...BANNER_STYLE_PROPS.reduce((acc, p) => {
      acc[p.cssVar] = p.defaultValue
      return acc
    }, {} as Record<string, string>),
    ...baseStyles,
    ...deviceStyles,
  } as Record<string, string>

  const next = BANNER_STYLE_PROPS.reduce((acc, prop) => {
    acc[prop.name] = sanitizeText(merged[prop.cssVar], prop.defaultValue) || prop.defaultValue
    return acc
  }, {} as Record<string, string>)

  model.__wbBannerSyncingStyleTraits = true
  model.set(next)
  model.__wbBannerSyncingStyleTraits = false
}

function cleanupBannerInstanceCssRules(editor: any, selector: string): void {
  const cssComposer = editor?.Css
  if (!cssComposer?.getRules || !cssComposer?.remove || !selector) return
  const rules = cssComposer.getRules() as any[]
  const toRemove = rules.filter((rule: any) => {
    const ruleSelector = `${rule?.selectorsToString?.() ?? ''}`.trim()
    return ruleSelector === selector
  })
  if (toRemove.length) cssComposer.remove(toRemove)
}

function hasBannerInstances(editor: any): boolean {
  const wrapper = editor?.getWrapper?.()
  if (!wrapper) return false
  const stack = [wrapper]
  while (stack.length) {
    const current = stack.pop()
    if (!current) continue
    const attrs = current.getAttributes?.() ?? {}
    if (`${attrs['data-wb-component'] ?? ''}`.trim() === 'home-banner-carousel') return true
    const children = current.components?.().models ?? []
    children.forEach((child: any) => stack.push(child))
  }
  return false
}

function cleanupUnusedBannerBaseCss(editor: any): void {
  if (hasBannerInstances(editor)) return
  removeUngroupedCssRulesByPrefixes(editor?.Css, ['.wb-home-banner'])
}

// ─────────────────────────────────────────────
// CSS / SVG 资源
// ─────────────────────────────────────────────

const ARROW_PREV_SVG = `<svg viewBox="0 0 24 24" class="wb-home-banner__nav-icon"><path d="M15 18l-6-6 6-6"/></svg>`
const ARROW_NEXT_SVG = `<svg viewBox="0 0 24 24" class="wb-home-banner__nav-icon"><path d="M9 6l6 6-6 6"/></svg>`

const HOME_BANNER_CSS = `
  .wb-home-banner {
    --slide-count: 1;
    --slide-index: 0;
    position: relative;
    overflow: hidden;
    background: var(--banner-bg, #111827);
  }
  .wb-home-banner, .wb-home-banner *, .wb-home-banner *::before, .wb-home-banner *::after {
    box-sizing: border-box;
  }
  .wb-home-banner__track {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .wb-home-banner__track::-webkit-scrollbar { display: none; }
  .wb-home-banner__slide {
    position: relative;
    flex: 0 0 100%;
    width: 100%;
    height: var(--banner-height, min(56vw, 100vh));
    overflow: hidden;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    isolation: isolate;
    background: var(--color-slide-bg, #0b1220);
  }
  .wb-home-banner__bg { position: absolute; inset: 0; z-index: 0; }
  .wb-home-banner__bg picture { display: block; width: 100%; height: 100%; }
  .wb-home-banner__bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(var(--bg-zoom, 1.08));
    transition: transform var(--transition-bg, 1.8s ease);
    will-change: transform;
  }
  .wb-home-banner__overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--overlay-gradient, rgba(0,0,0,0));
  }
  .wb-home-banner__inner {
    --content-max: 1240px;
    --gutter: 20px;
    position: relative;
    z-index: 2;
    height: 100%;
    display: grid;
    grid-template-columns:
      minmax(var(--gutter), 1fr)
      minmax(0, var(--content-max))
      minmax(var(--gutter), 1fr);
    align-items: center;
  }
  .wb-home-banner__content { grid-column: 2; max-width: min(640px, 90%); color: #000; }
  .wb-home-banner__eyebrow,
  .wb-home-banner__title,
  .wb-home-banner__desc,
  .wb-home-banner__actions {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.8s ease, transform 0.8s ease;
    will-change: opacity, transform;
  }
  .wb-home-banner__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    padding: 8px 14px;
    border: 1px solid rgba(0, 0, 0, 0.14);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(8px);
    font-size: 13px;
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition-delay: 0s;
  }
  .wb-home-banner__eyebrow[data-empty="true"] { display: none; }
  .wb-home-banner__title {
    margin: 0 0 8px;
    font-size: clamp(38px, 6vw, 64px);
    line-height: 1.125;
    font-weight: 700;
    transition-delay: 0.12s;
  }
  .wb-home-banner__desc {
    max-width: 560px;
    font-size: clamp(15px, 1.8vw, 16px);
    line-height: 1.65;
    font-weight: 300;
    transition-delay: 0.24s;
  }
  .wb-home-banner__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 32px;
    transition-delay: 0.36s;
  }
  .wb-home-banner__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    min-width: 140px;
    height: 40px;
    padding: 0 20px;
    border: 0;
    cursor: pointer;
    transition: transform 0.25s ease, opacity 0.25s ease, background 0.25s ease;
  }
  .wb-home-banner__btn:hover { transform: translateY(-2px); }
  .wb-home-banner__btn[data-empty="true"] { display: none; }
  .wb-home-banner__btn--primary { background: #3C53E8; color: #fff; }
  .wb-home-banner__btn--secondary { background: #fff; color: #000; }
  .wb-home-banner__slide.is-active .wb-home-banner__eyebrow,
  .wb-home-banner__slide.is-active .wb-home-banner__title,
  .wb-home-banner__slide.is-active .wb-home-banner__desc,
  .wb-home-banner__slide.is-active .wb-home-banner__actions {
    opacity: 1;
    transform: translateY(0);
  }
  .wb-home-banner__slide.is-active .wb-home-banner__bg img { transform: scale(1); }
  .wb-home-banner__nav {
    position: absolute;
    top: 50%;
    z-index: 5;
    width: var(--nav-size, 52px);
    height: var(--nav-size, 52px);
    margin-top: calc(var(--nav-size, 52px) / -2);
    border: 0;
    border-radius: var(--nav-radius, 999px);
    background: var(--nav-bg, rgba(255,255,255,0.14));
    color: var(--nav-color, #fff);
    backdrop-filter: blur(var(--nav-blur, 8px));
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background var(--nav-transition, 0.25s ease), transform var(--nav-transition, 0.25s ease);
  }
  .wb-home-banner__nav:hover {
    background: var(--nav-bg-hover, rgba(255,255,255,0.22));
    transform: translateY(-2px);
  }
  .wb-home-banner__nav--prev { left: var(--nav-offset, 20px); }
  .wb-home-banner__nav--next { right: var(--nav-offset, 20px); }
  .wb-home-banner__nav svg {
    width: var(--nav-icon-size, 18px);
    height: var(--nav-icon-size, 18px);
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .wb-home-banner[data-show-nav="false"] .wb-home-banner__nav { display: none; }
  .wb-home-banner__pagination {
    position: absolute;
    left: 50%;
    bottom: var(--pagination-bottom, 64px);
    z-index: 5;
    transform: translateX(-50%);
    width: var(--pagination-width, 48px);
    height: var(--pagination-height, 1px);
    border-radius: var(--pagination-radius, 0);
    background: var(--pagination-bg, rgba(2,5,27,0.1));
    overflow: hidden;
  }
  .wb-home-banner__pagination::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: calc(100% / var(--slide-count));
    border-radius: inherit;
    background: var(--thumb-bg, #02051B);
    transform: translateX(calc(100% * var(--slide-index)));
    transition: transform var(--thumb-transition, 0.4s ease);
    pointer-events: none;
  }
  .wb-home-banner__dot {
    position: absolute;
    top: 50%;
    height: 200%;
    width: calc(100% / var(--slide-count));
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    transform: translateY(-50%);
    -webkit-tap-highlight-color: transparent;
  }
  .wb-home-banner__dot:focus-visible {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
  }
`

// ─────────────────────────────────────────────
// 运行时脚本
// ─────────────────────────────────────────────

function makeBannerScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & { __wbHomeBannerCleanup?: () => void }
    root.__wbHomeBannerCleanup?.()

    const track = root.querySelector('.wb-home-banner__track') as HTMLElement | null
    const prevBtn = root.querySelector('.wb-home-banner__nav--prev') as HTMLButtonElement | null
    const nextBtn = root.querySelector('.wb-home-banner__nav--next') as HTMLButtonElement | null
    const pagination = root.querySelector('.wb-home-banner__pagination') as HTMLElement | null

    if (!track) return
    const trackEl = track

    let current = 0
    let autoplayTimer: any = null
    const autoplayDelay = parseInt(root.getAttribute('data-autoplay-delay') || '6000', 10)
    const autoplayEnabled = root.getAttribute('data-autoplay') !== 'false'

    const getSlides = () => Array.from(trackEl.querySelectorAll<HTMLElement>('.wb-home-banner__slide'))
    const getSlideWidth = () => trackEl.clientWidth

    function updateActive(index: number) {
      const slides = getSlides()
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index))
      if (pagination) {
        pagination.style.setProperty('--slide-index', String(index))
        const dots = pagination.querySelectorAll<HTMLButtonElement>('.wb-home-banner__dot')
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index)
          dot.setAttribute('aria-current', i === index ? 'true' : 'false')
        })
      }
    }

    function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
      const slides = getSlides()
      const total = slides.length
      if (!total) return
      current = ((index % total) + total) % total
      trackEl.scrollTo({ left: current * getSlideWidth(), behavior })
      updateActive(current)
    }

    function buildDots() {
      if (!pagination) return
      pagination.innerHTML = ''
      const slides = getSlides()
      pagination.style.setProperty('--slide-count', String(slides.length || 1))
      slides.forEach((_, index) => {
        const dot = document.createElement('button')
        dot.className = 'wb-home-banner__dot'
        dot.type = 'button'
        dot.style.left = `calc(100% * ${index} / var(--slide-count))`
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`)
        dot.addEventListener('click', () => {
          stopAutoplay()
          scrollToIndex(index)
          startAutoplay()
        })
        pagination.appendChild(dot)
      })
    }

    function debounce<T extends (...args: any[]) => any>(fn: T, delay = 120) {
      let timer: any = null
      return function (this: any, ...args: Parameters<T>) {
        clearTimeout(timer)
        timer = setTimeout(() => fn.apply(this, args), delay)
      }
    }

    const onScrollEnd = debounce(() => {
      const width = getSlideWidth()
      if (!width) return
      current = Math.round(track.scrollLeft / width)
      updateActive(current)
    }, 120)

    function startAutoplay() {
      stopAutoplay()
      if (!autoplayEnabled) return
      autoplayTimer = setInterval(() => scrollToIndex(current + 1), autoplayDelay)
    }
    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer)
        autoplayTimer = null
      }
    }

    const onPrev = () => { stopAutoplay(); scrollToIndex(current - 1); startAutoplay() }
    const onNext = () => { stopAutoplay(); scrollToIndex(current + 1); startAutoplay() }
    const onScroll = () => {
      const width = getSlideWidth()
      if (!width) return
      const index = Math.round(track.scrollLeft / width)
      if (index !== current) {
        current = index
        updateActive(current)
      }
      onScrollEnd()
    }
    const onResize = debounce(() => scrollToIndex(current, 'auto'), 120)
    const onEnter = () => stopAutoplay()
    const onLeave = () => startAutoplay()

    prevBtn?.addEventListener('click', onPrev)
    nextBtn?.addEventListener('click', onNext)
    track.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    root.addEventListener('mouseenter', onEnter)
    root.addEventListener('mouseleave', onLeave)
    root.addEventListener('touchstart', onEnter, { passive: true })
    root.addEventListener('touchend', onLeave)

    buildDots()
    updateActive(0)
    startAutoplay()

    root.__wbHomeBannerCleanup = () => {
      stopAutoplay()
      prevBtn?.removeEventListener('click', onPrev)
      nextBtn?.removeEventListener('click', onNext)
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      root.removeEventListener('mouseenter', onEnter)
      root.removeEventListener('mouseleave', onLeave)
      root.removeEventListener('touchstart', onEnter)
      root.removeEventListener('touchend', onLeave)
    }
  }
}

// ─────────────────────────────────────────────
// Slide 内容构建
// ─────────────────────────────────────────────

function buildSlideContent(slide: SlideData) {
  return [
    {
      tagName: 'div',
      ...CHILD_STYLABLE,
      name: '背景图',
      attributes: { class: 'wb-home-banner__bg' },
      components: [
        {
          tagName: 'picture',
          ...CHILD_LOCK,
          attributes: { class: 'wb-home-banner__picture' },
          components: [
            {
              tagName: 'source',
              ...CHILD_LOCK,
              attributes: {
                class: 'wb-home-banner__source',
                media: '(max-width: 767px)',
                srcset: slide.mobileImage || slide.desktopImage,
              },
            },
            {
              tagName: 'img',
              ...CHILD_LOCK,
              attributes: {
                class: 'wb-home-banner__image',
                src: slide.desktopImage,
                alt: slide.title,
                loading: 'eager',
                fetchpriority: 'high',
                decoding: 'async',
              },
            },
          ],
        },
      ],
    },
    {
      tagName: 'div',
      ...CHILD_STYLABLE,
      name: '遮罩',
      attributes: { class: 'wb-home-banner__overlay' },
    },
    {
      tagName: 'div',
      ...CHILD_STYLABLE,
      name: '内容区',
      attributes: { class: 'wb-home-banner__inner' },
      components: [
        {
          tagName: 'div',
          ...CHILD_STYLABLE,
          name: '文案',
          attributes: { class: 'wb-home-banner__content' },
          components: [
            {
              tagName: 'span',
              ...CHILD_STYLABLE,
              name: 'Eyebrow',
              editable: true,
              attributes: {
                class: 'wb-home-banner__eyebrow',
                'data-empty': slide.eyebrow ? 'false' : 'true',
              },
              content: slide.eyebrow,
            },
            {
              tagName: 'h2',
              ...CHILD_STYLABLE,
              name: '标题',
              editable: true,
              attributes: { class: 'wb-home-banner__title' },
              content: slide.title,
            },
            {
              tagName: 'p',
              ...CHILD_STYLABLE,
              name: '描述',
              editable: true,
              attributes: { class: 'wb-home-banner__desc' },
              content: slide.desc,
            },
            {
              tagName: 'div',
              ...CHILD_STYLABLE,
              name: '按钮组',
              attributes: { class: 'wb-home-banner__actions' },
              components: [
                {
                  tagName: 'a',
                  ...CHILD_STYLABLE,
                  name: '主按钮',
                  editable: true,
                  attributes: {
                    class: 'wb-home-banner__btn wb-home-banner__btn--primary',
                    href: slide.primaryBtnLink || '#',
                    target: slide.primaryBtnTarget || '_self',
                    'data-empty': slide.primaryBtnText ? 'false' : 'true',
                  },
                  content: slide.primaryBtnText,
                },
                {
                  tagName: 'a',
                  ...CHILD_STYLABLE,
                  name: '次按钮',
                  editable: true,
                  attributes: {
                    class: 'wb-home-banner__btn wb-home-banner__btn--secondary',
                    href: slide.secondaryBtnLink || '#',
                    target: slide.secondaryBtnTarget || '_self',
                    'data-empty': slide.secondaryBtnText ? 'false' : 'true',
                  },
                  content: slide.secondaryBtnText,
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

function getSlideData(model: any): SlideData {
  return {
    desktopImage: sanitizeText(model.get?.('desktopImage'), DEFAULT_DESKTOP_IMAGE) || DEFAULT_DESKTOP_IMAGE,
    mobileImage: sanitizeText(model.get?.('mobileImage')) || sanitizeText(model.get?.('desktopImage'), DEFAULT_MOBILE_IMAGE) || DEFAULT_MOBILE_IMAGE,
    eyebrow: sanitizeText(model.get?.('eyebrow')),
    title: sanitizeText(model.get?.('title'), ''),
    desc: sanitizeText(model.get?.('desc'), ''),
    primaryBtnText: sanitizeText(model.get?.('primaryBtnText')),
    primaryBtnLink: sanitizeText(model.get?.('primaryBtnLink'), '#') || '#',
    primaryBtnTarget: sanitizeText(model.get?.('primaryBtnTarget'), '_self') || '_self',
    secondaryBtnText: sanitizeText(model.get?.('secondaryBtnText')),
    secondaryBtnLink: sanitizeText(model.get?.('secondaryBtnLink'), '#') || '#',
    secondaryBtnTarget: sanitizeText(model.get?.('secondaryBtnTarget'), '_self') || '_self',
  }
}

function getSlideTraits() {
  return [
    makeImagePickerTrait('PC 图片', 'desktopImage', { showPreview: true }),
    makeImagePickerTrait('移动端图片', 'mobileImage', { showPreview: true }),
    makeTextTrait('Eyebrow', 'eyebrow', { placeholder: '(可选)' }),
    makeTextTrait('标题', 'title'),
    makeTextareaTrait('描述', 'desc', { rows: 3 }),
    makeTextTrait('主按钮文字', 'primaryBtnText'),
    makeLinkTrait({ label: '主按钮链接', name: 'primaryBtnLink' }),
    makeLinkTargetTrait({ label: '主按钮打开方式', name: 'primaryBtnTarget' }),
    makeTextTrait('次按钮文字', 'secondaryBtnText'),
    makeLinkTrait({ label: '次按钮链接', name: 'secondaryBtnLink' }),
    makeLinkTargetTrait({ label: '次按钮打开方式', name: 'secondaryBtnTarget' }),
  ]
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

function writeText(component: any, value: string): void {
  if (!component) return
  const collection = component.components?.()
  if (collection?.length) collection.reset([])
  component.set?.('content', value)
}

function readText(component: any): string {
  const html = `${component?.toHTML?.() || ''}`.trim()
  if (html) {
    return html.replace(/^<[^>]+>|<\/[^>]+>$/g, '').trim()
  }
  return `${component?.get?.('content') || ''}`.trim()
}

function restoreSlideFieldsFromCanvas(model: any): void {
  if (!model || model.__wbHomeBannerHydrating) return
  model.__wbHomeBannerHydrating = true

  const source = findChildByClass(model, 'wb-home-banner__source')
  const img = findChildByClass(model, 'wb-home-banner__image')
  const eyebrow = findChildByClass(model, 'wb-home-banner__eyebrow')
  const title = findChildByClass(model, 'wb-home-banner__title')
  const desc = findChildByClass(model, 'wb-home-banner__desc')
  const primary = findChildByClass(model, 'wb-home-banner__btn--primary')
  const secondary = findChildByClass(model, 'wb-home-banner__btn--secondary')

  model.set(
    {
      desktopImage:
        `${img?.getAttributes?.()?.src || ''}`.trim()
          || sanitizeText(model.get?.('desktopImage'), DEFAULT_DESKTOP_IMAGE)
          || DEFAULT_DESKTOP_IMAGE,
      mobileImage:
        `${source?.getAttributes?.()?.srcset || ''}`.trim()
          || sanitizeText(model.get?.('mobileImage'))
          || `${img?.getAttributes?.()?.src || ''}`.trim()
          || DEFAULT_MOBILE_IMAGE,
      eyebrow: readText(eyebrow),
      title: readText(title),
      desc: readText(desc),
      primaryBtnText: readText(primary),
      primaryBtnLink:
        `${primary?.getAttributes?.()?.href || ''}`.trim()
          || sanitizeText(model.get?.('primaryBtnLink'), '#')
          || '#',
      primaryBtnTarget:
        `${primary?.getAttributes?.()?.target || ''}`.trim()
          || sanitizeText(model.get?.('primaryBtnTarget'), '_self')
          || '_self',
      secondaryBtnText: readText(secondary),
      secondaryBtnLink:
        `${secondary?.getAttributes?.()?.href || ''}`.trim()
          || sanitizeText(model.get?.('secondaryBtnLink'), '#')
          || '#',
      secondaryBtnTarget:
        `${secondary?.getAttributes?.()?.target || ''}`.trim()
          || sanitizeText(model.get?.('secondaryBtnTarget'), '_self')
          || '_self',
    },
    { silent: true },
  )

  model.__wbHomeBannerHydrating = false
}

function syncSlide(model: any): void {
  const slide = getSlideData(model)
  const nameLabel = slide.title ? `轮播图 · ${slide.title}` : '轮播图'
  if (model.get?.('name') !== nameLabel) model.set?.('name', nameLabel)

  const source = findChildByClass(model, 'wb-home-banner__source')
  source?.addAttributes?.({
    class: 'wb-home-banner__source',
    media: '(max-width: 767px)',
    srcset: slide.mobileImage || slide.desktopImage,
  })

  const img = findChildByClass(model, 'wb-home-banner__image')
  img?.addAttributes?.({
    class: 'wb-home-banner__image',
    src: slide.desktopImage,
    alt: slide.title,
  })

  const eyebrow = findChildByClass(model, 'wb-home-banner__eyebrow')
  eyebrow?.addAttributes?.({
    class: 'wb-home-banner__eyebrow',
    'data-empty': slide.eyebrow ? 'false' : 'true',
  })
  writeText(eyebrow, slide.eyebrow)

  writeText(findChildByClass(model, 'wb-home-banner__title'), slide.title)
  writeText(findChildByClass(model, 'wb-home-banner__desc'), slide.desc)

  const primary = findChildByClass(model, 'wb-home-banner__btn--primary')
  primary?.addAttributes?.({
    class: 'wb-home-banner__btn wb-home-banner__btn--primary',
    href: slide.primaryBtnLink,
    target: slide.primaryBtnTarget,
    'data-empty': slide.primaryBtnText ? 'false' : 'true',
  })
  writeText(primary, slide.primaryBtnText)

  const secondary = findChildByClass(model, 'wb-home-banner__btn--secondary')
  secondary?.addAttributes?.({
    class: 'wb-home-banner__btn wb-home-banner__btn--secondary',
    href: slide.secondaryBtnLink,
    target: slide.secondaryBtnTarget,
    'data-empty': slide.secondaryBtnText ? 'false' : 'true',
  })
  writeText(secondary, slide.secondaryBtnText)
}

// ─────────────────────────────────────────────
// 增删 slide
// ─────────────────────────────────────────────

function resolveCarouselTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_HOME_BANNER_CAROUSEL_TYPE) return selected
  const fromSelected = selected?.closestType?.(WB_HOME_BANNER_CAROUSEL_TYPE) as any
  if (fromSelected?.get?.('type') === WB_HOME_BANNER_CAROUSEL_TYPE) return fromSelected
  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_HOME_BANNER_CAROUSEL_TYPE) return tmTarget
  const fromTmTarget = tmTarget?.closestType?.(WB_HOME_BANNER_CAROUSEL_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_HOME_BANNER_CAROUSEL_TYPE) return fromTmTarget
  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_HOME_BANNER_CAROUSEL_TYPE) return traitTarget
  const fromTraitTarget = traitTarget?.closestType?.(WB_HOME_BANNER_CAROUSEL_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_HOME_BANNER_CAROUSEL_TYPE) return fromTraitTarget
  return null
}

function buildSlideDef(slide: SlideData) {
  return {
    type: WB_HOME_BANNER_SLIDE_TYPE,
    tagName: 'article',
    name: slide.title ? `轮播图 · ${slide.title}` : '轮播图',
    attributes: {
      class: 'wb-home-banner__slide',
      'data-wb-component': 'home-banner-slide',
    },
    ...slide,
    components: buildSlideContent(slide),
  }
}

function createAddSlideTrait() {
  return {
    type: 'button' as any,
    name: 'add-home-banner-slide',
    label: false as const,
    text: '+ 添加轮播图',
    full: true,
    command(this: any, editor: Editor) {
      const carousel = resolveCarouselTarget(editor, this)
      const track = carousel?._getTrack?.()
      const slides = track?.components?.()
      if (!slides) return
      const newSlide: SlideData = {
        desktopImage: DEFAULT_DESKTOP_IMAGE,
        mobileImage: DEFAULT_MOBILE_IMAGE,
        eyebrow: '',
        title: `Slide ${slides.length + 1}`,
        desc: '',
        primaryBtnText: '',
        primaryBtnLink: '#',
        primaryBtnTarget: '_self',
        secondaryBtnText: '',
        secondaryBtnLink: '#',
        secondaryBtnTarget: '_self',
      }
      const created = slides.add(buildSlideDef(newSlide))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

// ─────────────────────────────────────────────
// 主组件树
// ─────────────────────────────────────────────

function buildCarouselTree() {
  return [
    {
      tagName: 'div',
      name: '轮播列表',
      selectable: true,
      hoverable: true,
      draggable: false,
      droppable: `[data-wb-component="home-banner-slide"]`,
      layerable: true,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-home-banner__track' },
      components: DEFAULT_SLIDES.map(buildSlideDef),
    },
    {
      tagName: 'button',
      ...CHILD_LOCK,
      attributes: {
        class: 'wb-home-banner__nav wb-home-banner__nav--prev',
        type: 'button',
        'aria-label': 'Previous slide',
      },
      components: ARROW_PREV_SVG,
    },
    {
      tagName: 'button',
      ...CHILD_LOCK,
      attributes: {
        class: 'wb-home-banner__nav wb-home-banner__nav--next',
        type: 'button',
        'aria-label': 'Next slide',
      },
      components: ARROW_NEXT_SVG,
    },
    {
      tagName: 'div',
      ...CHILD_LOCK,
      attributes: { class: 'wb-home-banner__pagination' },
    },
  ]
}

// ─────────────────────────────────────────────
// 注册
// ─────────────────────────────────────────────

export function registerHomeBannerCarouselComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_HOME_BANNER_CAROUSEL_TYPE)) return
  const baseType = domComponents.getType('default')

  domComponents.addType(WB_HOME_BANNER_SLIDE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'home-banner-slide'
        ? { type: WB_HOME_BANNER_SLIDE_TYPE }
        : false,
    model: {
      defaults: {
        name: '轮播图',
        tagName: 'article',
        selectable: true,
        layerable: true,
        draggable: '.wb-home-banner__track',
        droppable: false,
        copyable: true,
        removable: true,
        ...DEFAULT_SLIDES[0],
        traits: getSlideTraits(),
      },
      init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(buildSlideContent(getSlideData(this)))
        }
        restoreSlideFieldsFromCanvas(this)
        this.listenTo(
          this,
          'change:desktopImage change:mobileImage change:eyebrow change:title change:desc change:primaryBtnText change:primaryBtnLink change:primaryBtnTarget change:secondaryBtnText change:secondaryBtnLink change:secondaryBtnTarget',
          () => syncSlide(this),
        )
        syncSlide(this)
      },
      toJSON(this: any, opts: any) {
        restoreSlideFieldsFromCanvas(this)
        return baseType.model.prototype.toJSON.call(this, opts)
      },
    },
  })

  domComponents.addType(WB_HOME_BANNER_CAROUSEL_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'home-banner-carousel'
        ? { type: WB_HOME_BANNER_CAROUSEL_TYPE }
        : false,
    model: {
      defaults: {
        name: '首页轮播',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'home-banner-carousel',
          class: 'wb-home-banner',
          'data-show-nav': 'false',
          'data-autoplay': 'true',
          'data-autoplay-delay': '6000',
        },
        showNav: false,
        autoplay: true,
        autoplayDelay: 6000,
        ...BANNER_STYLE_DEFAULT_VALUES,
        traits: [
          createAddSlideTrait(),
          makeCheckboxTrait('显示切换按钮', 'showNav'),
          makeCheckboxTrait('自动播放', 'autoplay'),
          makeTextTrait('自动播放间隔(ms)', 'autoplayDelay', { placeholder: '6000' }),
          ...makeBannerStyleTraits(),
        ],
        script: makeBannerScript(),
        'script-export': makeBannerScript(),
        styles: HOME_BANNER_CSS,
        components: buildCarouselTree(),
      },
      init(this: any) {
        this.__wbBannerSyncingStyleTraits = false

        this.on('change:showNav change:autoplay change:autoplayDelay', this.syncRootAttrs)
        this.on(
          BANNER_STYLE_PROPS.map((p) => `change:${p.name}`).join(' '),
          this.applyStyleVars,
        )

        this._wbBannerDeviceSelect = () => {
          syncBannerTraitValuesFromRules(editor, this)
        }
        editor.on?.('device:select', this._wbBannerDeviceSelect)

        this.syncRootAttrs()
        syncBannerTraitValuesFromRules(editor, this)
        this.applyStyleVars()
      },
      syncRootAttrs(this: any) {
        const showNav = this.get('showNav') ? 'true' : 'false'
        const autoplay = this.get('autoplay') === false ? 'false' : 'true'
        const delayRaw = sanitizeText(this.get('autoplayDelay'), '6000')
        const delay = /^\d+$/.test(delayRaw) ? delayRaw : '6000'
        this.addAttributes({
          'data-show-nav': showNav,
          'data-autoplay': autoplay,
          'data-autoplay-delay': delay,
        })
      },
      applyStyleVars(this: any) {
        if (this.__wbBannerSyncingStyleTraits) return
        applyBannerStyleVarsToCurrentDevice(editor, this)
      },
      _getTrack(this: any) {
        return this.components?.()?.at?.(0) ?? null
      },
      removed(this: any) {
        const attrs = this.getAttributes?.() ?? {}
        const id = sanitizeText(attrs.id)
        if (id) cleanupBannerInstanceCssRules(editor, `#${id}`)
        cleanupUnusedBannerBaseCss(editor)
        if (this._wbBannerDeviceSelect) {
          editor.off?.('device:select', this._wbBannerDeviceSelect)
        }
      },
    },
  })

  editor.on('rte:disable', (view: any) => {
    const component = view?.model
    const slide = component?.get?.('type') === WB_HOME_BANNER_SLIDE_TYPE
      ? component
      : component?.closestType?.(WB_HOME_BANNER_SLIDE_TYPE)
    if (!slide || slide.get?.('type') !== WB_HOME_BANNER_SLIDE_TYPE) return
    restoreSlideFieldsFromCanvas(slide)
  })

  blockManager?.add?.(WB_HOME_BANNER_CAROUSEL_TYPE, {
    label: '首页轮播',
    category: 'Section',
    content: { type: WB_HOME_BANNER_CAROUSEL_TYPE },
    media: BLOCK_ICON,
  })
}
