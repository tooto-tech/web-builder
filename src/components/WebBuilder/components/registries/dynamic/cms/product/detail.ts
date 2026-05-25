import type { GrapesEditor } from '../../../../../types/editor'
import { registerDetailCmsComponent } from '../helpers'
import { PRODUCT_DETAIL_STYLES } from './detail.styles'
import {
  buildProductDetailBackComponents,
  PRODUCT_DETAIL_BREADCRUMB_BACK_ICON_CLASS,
  PRODUCT_DETAIL_BREADCRUMB_BACK_LABEL_CLASS,
  PRODUCT_DETAIL_BODY_CLASS,
  PRODUCT_DETAIL_BODY_COMPONENTS,
  PRODUCT_DETAIL_EXTRA_COMPONENTS,
  PRODUCT_DETAIL_HEADER_CLASS,
  PRODUCT_DETAIL_HEADER_CONTENT,
  PRODUCT_DETAIL_ROOT_CLASS,
} from './detail.schema'
import { initPreviewProductTrait } from './previewProductTrait'

export const WB_CMS_PRODUCT_DETAIL_TYPE = 'wb-cms-product-detail'

const PRODUCT_DETAIL_CLASS_MIGRATION_MAP: Record<string, string> = {
  'wb-pd-header': 'wb-product-detail__header',
  'wb-pd-container': 'wb-product-detail__container',
  'wb-pd-breadcrumb': 'wb-product-detail__breadcrumb',
  'wb-pd-breadcrumb-back': 'wb-product-detail__breadcrumb-back',
  'wb-pd-breadcrumb-name': 'wb-product-detail__breadcrumb-name',
  'wb-pd-hero': 'wb-product-detail__hero',
  'wb-pd-info': 'wb-product-detail__info',
  'wb-pd-name': 'wb-product-detail__name',
  'wb-pd-desc': 'wb-product-detail__desc',
  'wb-pd-accordion': 'wb-product-detail__accordion',
  'wb-pd-accordion-item': 'wb-product-detail__accordion-item',
  'wb-pd-accordion-icon': 'wb-product-detail__accordion-icon',
  'wb-pd-accordion-body': 'wb-product-detail__accordion-body',
  'wb-pd-btn-cta': 'wb-product-detail__cta',
  'pm-gallery-block-wrap': 'pm-gallery-block__wrap',
  'pm-image-block-wrap': 'pm-image-block__wrap',
}

const PRODUCT_DETAIL_LEGACY_BREADCRUMB_CLASSES = new Set([
  'wb-pd-breadcrumb-sep',
  'wb-pd-breadcrumb-cat',
  'wb-pd-breadcrumb-slash',
  'wb-product-detail__breadcrumb-sep',
  'wb-product-detail__breadcrumb-cat',
  'wb-product-detail__breadcrumb-slash',
])

const productDetailBackScript = function (this: HTMLElement) {
  const root = this as HTMLElement & { __wbProductDetailBackInit?: boolean }
  if (root.__wbProductDetailBackInit) return
  root.__wbProductDetailBackInit = true

  if (window.parent !== window) return

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    const trigger = target?.closest?.('.wb-product-detail__breadcrumb-back') as HTMLElement | null
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

function migrateProductDetailClasses(component: any): void {
  if (!component?.getAttributes || !component?.components) return

  const attrs = component.getAttributes() || {}
  const tagName = String(component.get?.('tagName') || component.getName?.() || '').toLowerCase()
  const classNames = String(attrs.class || '')
    .split(/\s+/)
    .map((item: string) => item.trim())
    .filter(Boolean)

  const nextClassNames = classNames.map((className: string) => PRODUCT_DETAIL_CLASS_MIGRATION_MAP[className] || className)

  const hasClass = (className: string) => nextClassNames.includes(className)
  const addClass = (className: string) => {
    if (!className || hasClass(className)) return
    nextClassNames.push(className)
  }

  if (tagName === 'summary' && component.parent?.()?.getAttributes) {
    const parentClasses = String(component.parent().getAttributes()?.class || '')
    if (parentClasses.includes('wb-product-detail__accordion-item')) {
      addClass('wb-product-detail__accordion-summary')
    }
  }

  if (tagName === 'span' && component.parent?.()?.getAttributes) {
    const parentClasses = String(component.parent().getAttributes()?.class || '')
    if (parentClasses.includes('wb-product-detail__accordion-summary')) {
      const siblings = component.parent().components?.().models || []
      const siblingIndex = siblings.indexOf(component)
      if (siblingIndex === 0) addClass('wb-product-detail__accordion-title')
    }
  }

  if (tagName === 'a' && component.parent?.()?.parent?.()?.getAttributes) {
    const ancestorClasses = String(component.parent().parent().getAttributes()?.class || '')
    if (ancestorClasses.includes('pm-doc-block')) {
      addClass('pm-doc-block__link')
    }
  }

  if ((tagName === 'h3' || tagName === 'p') && component.parent?.()?.getAttributes) {
    const parentClasses = String(component.parent().getAttributes()?.class || '')
    if (parentClasses.includes('pm-gallery-block__wrap')) {
      addClass(tagName === 'h3' ? 'pm-gallery-block__title' : 'pm-gallery-block__desc')
    }
    if (parentClasses.includes('pm-image-block__wrap')) {
      addClass(tagName === 'h3' ? 'pm-image-block__title' : 'pm-image-block__desc')
    }
  }

  if (tagName === 'img' && component.parent?.()?.getAttributes) {
    const parentClasses = String(component.parent().getAttributes()?.class || '')
    if (parentClasses.includes('pm-image-block__wrap')) {
      addClass('pm-image-block__image')
    }
  }

  if (hasClass('wb-product-detail__breadcrumb-back')) {
    const currentLabel = String(component.get?.('content') || '').trim() || 'Back'
    const childrenCollection = component.components?.()
    const childModels = childrenCollection?.models || []
    const hasBackIcon = childModels.some((child: any) => {
      const childClasses = String(child.getAttributes?.()?.class || '')
        .split(/\s+/)
        .map((item: string) => item.trim())
        .filter(Boolean)
      return childClasses.includes(PRODUCT_DETAIL_BREADCRUMB_BACK_ICON_CLASS)
    })

    if (!hasBackIcon) {
      component.set?.('content', '')
      if (childrenCollection?.reset) {
        childrenCollection.reset(buildProductDetailBackComponents(currentLabel))
      } else {
        component.components(buildProductDetailBackComponents(currentLabel))
      }
    } else {
      childModels.forEach((child: any) => {
        const childClasses = String(child.getAttributes?.()?.class || '')
          .split(/\s+/)
          .map((item: string) => item.trim())
          .filter(Boolean)
        if (childClasses.includes(PRODUCT_DETAIL_BREADCRUMB_BACK_LABEL_CLASS) && currentLabel) {
          child.set?.('content', currentLabel)
        }
      })
    }

    component.addAttributes({
      ...attrs,
      class: nextClassNames.join(' ').trim(),
      'data-wb-product-detail-back': '',
    })
  }

  const nextClassValue = nextClassNames.join(' ').trim()
  if (nextClassValue !== String(attrs.class || '').trim() && !hasClass('wb-product-detail__breadcrumb-back')) {
    component.addAttributes({ class: nextClassValue })
  }

  if (hasClass('wb-product-detail__breadcrumb')) {
    const childrenCollection = component.components?.()
    const children = childrenCollection?.models || []

    children
      .filter((child: any) => {
        const childClasses = String(child.getAttributes?.()?.class || '')
          .split(/\s+/)
          .map((item: string) => item.trim())
          .filter(Boolean)
        return childClasses.some((className: string) => PRODUCT_DETAIL_LEGACY_BREADCRUMB_CLASSES.has(className))
      })
      .forEach((child: any) => child.remove?.())
  }

  const children = component.components?.().models || []
  children.forEach((child: any) => migrateProductDetailClasses(child))
}

function ensureProductDetailRootClass(model: any): void {
  const attrs = model.getAttributes?.() || {}
  const classNames = String(attrs.class || '')
    .split(/\s+/)
    .map((item: string) => item.trim())
    .filter(Boolean)

  if (classNames.includes(PRODUCT_DETAIL_ROOT_CLASS)) return

  model.addAttributes({
    class: [PRODUCT_DETAIL_ROOT_CLASS, ...classNames].join(' '),
  })
}

async function initProductDetailModel(model: any): Promise<void> {
  ensureProductDetailRootClass(model)
  migrateProductDetailClasses(model)
  model.on('change:attributes', () => ensureProductDetailRootClass(model))
  await initPreviewProductTrait(model)
}

export function registerCmsProductDetail(editor: GrapesEditor) {
  registerDetailCmsComponent(editor, {
    type: WB_CMS_PRODUCT_DETAIL_TYPE,
    dataWbComponent: 'cms-product-detail',
    dataCmsComponent: 'product-detail',
    name: '产品详情',
    dynamicPublish: true,
    styleKey: 'wb-cms-product-detail',
    styles: PRODUCT_DETAIL_STYLES,
    headerClass: PRODUCT_DETAIL_HEADER_CLASS,
    headerContent: PRODUCT_DETAIL_HEADER_CONTENT,
    bodyClass: PRODUCT_DETAIL_BODY_CLASS,
    bodyComponents: PRODUCT_DETAIL_BODY_COMPONENTS,
    extraComponents: PRODUCT_DETAIL_EXTRA_COMPONENTS,
    defaultAttributes: {
      class: PRODUCT_DETAIL_ROOT_CLASS,
      'data-category-id': '',
      'data-product-id': '',
    },
    defaultProps: { cmsCategoryId: '', cmsPreviewProductId: '' },
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
    script: productDetailBackScript,
    scriptExport: productDetailBackScript,
    syncAttrs: (m) => ({
      'data-category-id': m.get('cmsCategoryId') || '',
      'data-product-id': m.get('cmsPreviewProductId') || '',
    }),
    onModelInit: initProductDetailModel,
  })
}
