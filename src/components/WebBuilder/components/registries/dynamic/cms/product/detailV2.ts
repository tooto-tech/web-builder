import type { GrapesEditor } from '../../../../../types/editor'
import { registerDetailCmsComponent } from '../helpers'
import { initPreviewProductTrait } from './previewProductTrait'
import { PRODUCT_DETAIL_V2_STYLES } from './detailV2.styles'
import {
  PRODUCT_DETAIL_V2_BODY_CLASS,
  PRODUCT_DETAIL_V2_BODY_COMPONENTS,
  PRODUCT_DETAIL_V2_EXTRA_COMPONENTS,
  PRODUCT_DETAIL_V2_HEADER_CLASS,
  PRODUCT_DETAIL_V2_HEADER_CONTENT,
  PRODUCT_DETAIL_V2_ROOT_CLASS,
} from './detailV2.schema'

export const WB_CMS_PRODUCT_DETAIL_V2_TYPE = 'wb-cms-product-detail-v2'

const productDetailV2Script = function (this: HTMLElement) {
  const root = this as HTMLElement & {
    __wbProductDetailBackInit?: boolean
    __wbProductDetailTabsInit?: boolean
    __wbProductDetailOptionsInit?: boolean
    __wbProductDetailInquiryInit?: boolean
    __wbProductDetailRelatedCarouselRefreshInit?: boolean
    __wbProductDetailRelatedCarouselCleanup?: () => void
  }

  const getLanguagePrefix = () => {
    try {
      const segments = String(window.location.pathname || '/')
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean)
      const first = segments[0] || ''
      return /^[a-z]{2}(?:-[a-z]{2})?$/i.test(first) ? `/${encodeURIComponent(first)}` : ''
    } catch (_) {
      return ''
    }
  }

  const getSelectedOptions = () => {
    const optionGroups = Array.from(
      root.querySelectorAll('.wb-product-detail-v2__option-group'),
    ) as HTMLElement[]

    return optionGroups
      .map((group) => {
        const label = (
          group.querySelector('.wb-product-detail-v2__option-label')?.textContent || ''
        ).trim()
        const activeOption = group.querySelector(
          '[data-option-value="true"].is-active',
        ) as HTMLElement | null
        const value = (
          activeOption?.querySelector('.wb-product-detail-v2__option-text')?.textContent ||
          activeOption?.textContent ||
          ''
        ).trim()

        if (!label || !value) return null
        return { name: label, value }
      })
      .filter(Boolean)
  }

  const getProductName = () =>
    (
      root.querySelector('.wb-product-detail-v2__name')?.textContent ||
      root.querySelector('.wb-product-detail-v2__breadcrumb-name')?.textContent ||
      document.title ||
      ''
    ).trim()

  const buildInquiryUrl = () => {
    const productUrl = new URL(window.location.href)
    productUrl.searchParams.delete('productInquiry')

    const payload = {
      productName: getProductName(),
      productUrl: productUrl.href,
      selectedAttributes: getSelectedOptions(),
    }
    const target = new URL(`${getLanguagePrefix()}/contact-us`, window.location.origin)
    target.searchParams.set('productInquiry', JSON.stringify(payload))
    return target.href
  }

  if (!root.__wbProductDetailBackInit) {
    root.__wbProductDetailBackInit = true

    if (window.parent === window) {
      root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null
        const trigger = target?.closest?.('.wb-product-detail-v2__breadcrumb-back') as HTMLElement | null
        if (!trigger || !root.contains(trigger)) return

        event.preventDefault()
        if (window.history.length > 1) {
          window.history.back()
          return
        }

        const referrer = document.referrer
        if (!referrer) return
        try {
          const refUrl = new URL(referrer, window.location.href)
          if (refUrl.origin === window.location.origin) {
            window.location.href = refUrl.href
          }
        } catch (_) {
          // ignore invalid referrer
        }
      })
    }
  }

  const initOptionSelections = () => {
    const optionGroups = Array.from(
      root.querySelectorAll('.wb-product-detail-v2__option-values'),
    ) as HTMLElement[]

    optionGroups.forEach((group) => {
      const optionValues = Array.from(
        group.querySelectorAll('[data-option-value="true"]'),
      ) as HTMLElement[]

      optionValues.forEach((item) => {
        const hasVisual = !!item.querySelector(
          '.wb-product-detail-v2__option-swatch, .wb-product-detail-v2__option-image',
        )
        item.classList.toggle('is-text-only', !hasVisual)
        item.setAttribute('aria-pressed', item.classList.contains('is-active') ? 'true' : 'false')
      })

      const activeItems = optionValues.filter((item) => item.classList.contains('is-active'))
      activeItems.slice(1).forEach((item) => {
        item.classList.remove('is-active')
        item.setAttribute('aria-pressed', 'false')
      })
    })
  }

  if (!root.__wbProductDetailOptionsInit) {
    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null
      const option = target?.closest?.('[data-option-value="true"]') as HTMLElement | null
      if (!option || !root.contains(option)) return

      const group = option.closest('.wb-product-detail-v2__option-values')
      if (!group) return

      const wasActive = option.classList.contains('is-active')
      Array.from(group.querySelectorAll('[data-option-value="true"]')).forEach((item) => {
        item.classList.remove('is-active')
        item.setAttribute('aria-pressed', 'false')
      })
      if (!wasActive) {
        option.classList.add('is-active')
        option.setAttribute('aria-pressed', 'true')
      }
    })

    root.addEventListener('wb:product-detail-v2:refresh', () => {
      initOptionSelections()
    })

    root.__wbProductDetailOptionsInit = true
  }

  initOptionSelections()

  if (!root.__wbProductDetailInquiryInit) {
    root.__wbProductDetailInquiryInit = true

    if (window.parent === window) {
      root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null
        const trigger = target?.closest?.('[data-product-inquiry-trigger="true"]') as HTMLElement | null
        if (!trigger || !root.contains(trigger)) return

        event.preventDefault()
        window.location.href = buildInquiryUrl()
      })
    }
  }

  const tabButtons = Array.from(root.querySelectorAll('[data-tab-trigger]')) as HTMLButtonElement[]
  const panels = Array.from(root.querySelectorAll('[data-tab-panel]')) as HTMLElement[]
  const initRelatedCarousel = () => {
    root.__wbProductDetailRelatedCarouselCleanup?.()
    root.__wbProductDetailRelatedCarouselCleanup = undefined

    const related = root.querySelector('.wb-product-detail-v2__related') as HTMLElement | null
    const track = related?.querySelector('.wb-content-carousel__track') as HTMLElement | null
    const prev = related?.querySelector('.wb-content-carousel__nav-btn--prev') as HTMLButtonElement | null
    const next = related?.querySelector('.wb-content-carousel__nav-btn--next') as HTMLButtonElement | null
    if (!track || !prev || !next) return

    let currentIndex = 0
    const getItems = () =>
      Array.from(track.querySelectorAll<HTMLElement>('.wb-content-carousel__item'))
        .filter((item) => item.offsetParent !== null && item.getAttribute('data-cms-hidden') === null)

    const scrollToIndex = (index: number) => {
      const items = getItems()
      if (!items.length) return
      const max = items.length - 1
      currentIndex = Math.max(0, Math.min(index, max))
      items[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }

    const onPrev = () => scrollToIndex(currentIndex - 1)
    const onNext = () => scrollToIndex(currentIndex + 1)
    prev.addEventListener('click', onPrev)
    next.addEventListener('click', onNext)
    root.__wbProductDetailRelatedCarouselCleanup = () => {
      prev.removeEventListener('click', onPrev)
      next.removeEventListener('click', onNext)
    }
  }

  if (!root.__wbProductDetailRelatedCarouselRefreshInit) {
    root.__wbProductDetailRelatedCarouselRefreshInit = true
    root.addEventListener('wb:product-detail-v2:refresh', () => {
      requestAnimationFrame(initRelatedCarousel)
    })
  }
  initRelatedCarousel()

  if (!tabButtons.length || !panels.length || root.__wbProductDetailTabsInit) return

  const activateTab = (tabName: string) => {
    tabButtons.forEach((button) => {
      const isActive = button.getAttribute('data-tab-trigger') === tabName
      button.classList.toggle('is-active', isActive)
      if (isActive) {
        button.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        })
      }
    })
    panels.forEach((panel) => {
      const isActive = panel.getAttribute('data-tab-panel') === tabName
      panel.classList.toggle('is-active', isActive)
    })
  }

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    const button = target?.closest?.('[data-tab-trigger]') as HTMLButtonElement | null
    if (!button || !root.contains(button)) return
    activateTab(button.getAttribute('data-tab-trigger') || 'introduction')
  })

  root.__wbProductDetailTabsInit = true
  activateTab(
    tabButtons.find((button) => button.classList.contains('is-active'))?.getAttribute('data-tab-trigger') ||
      tabButtons[0]?.getAttribute('data-tab-trigger') ||
      'introduction',
  )
}

function ensureRootClass(model: any): void {
  const attrs = model.getAttributes?.() || {}
  const classNames = String(attrs.class || '')
    .split(/\s+/)
    .map((item: string) => item.trim())
    .filter(Boolean)

  if (classNames.includes(PRODUCT_DETAIL_V2_ROOT_CLASS)) return
  model.addAttributes({
    class: [PRODUCT_DETAIL_V2_ROOT_CLASS, ...classNames].join(' ').trim(),
  })
}

async function initProductDetailV2Model(model: any): Promise<void> {
  ensureRootClass(model)
  model.on('change:attributes', () => ensureRootClass(model))
  await initPreviewProductTrait(model)
}

export function registerCmsProductDetailV2(editor: GrapesEditor) {
  registerDetailCmsComponent(editor, {
    type: WB_CMS_PRODUCT_DETAIL_V2_TYPE,
    dataWbComponent: 'cms-product-detail-v2',
    dataCmsComponent: 'product-detail',
    name: '产品详情 V2',
    dynamicPublish: true,
    styleKey: 'wb-cms-product-detail-v2',
    styles: PRODUCT_DETAIL_V2_STYLES,
    headerClass: PRODUCT_DETAIL_V2_HEADER_CLASS,
    headerContent: PRODUCT_DETAIL_V2_HEADER_CONTENT,
    bodyClass: PRODUCT_DETAIL_V2_BODY_CLASS,
    bodyComponents: PRODUCT_DETAIL_V2_BODY_COMPONENTS,
    extraComponents: PRODUCT_DETAIL_V2_EXTRA_COMPONENTS,
    defaultAttributes: {
      class: PRODUCT_DETAIL_V2_ROOT_CLASS,
      'data-category-id': '',
      'data-product-id': '',
    },
    defaultProps: {
      cmsCategoryId: '',
      cmsPreviewProductId: '',
    },
    traits: [
      { type: 'text', label: '分类 ID', name: 'cmsCategoryId', changeProp: true, placeholder: '产品分类 ID（留空=全部）' },
      {
        type: 'select',
        label: '预览产品',
        name: 'cmsPreviewProductId',
        changeProp: true,
        options: [{ value: '', label: '未选择（显示占位模板）' }],
      },
    ],
    watchProps: ['cmsCategoryId', 'cmsPreviewProductId'],
    script: productDetailV2Script,
    scriptExport: productDetailV2Script,
    syncAttrs: (model) => ({
      'data-category-id': model.get('cmsCategoryId') || '',
      'data-product-id': model.get('cmsPreviewProductId') || '',
    }),
    onModelInit: initProductDetailV2Model,
  })
}
