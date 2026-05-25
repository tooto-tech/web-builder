/**
 * 动态循环 block（对标 Elementor Pro Loop Grid / Posts Loop Carousel）
 *
 * 结构：
 *   `<div data-cms-repeat="relatedPost@relatedPosts" data-cms-repeat-container="true" data-wb-dynamic="repeat">
 *      <div data-wb-dynamic="repeat-item"> ...循环模板... </div>
 *   </div>`
 *
 * - `data-cms-repeat` 的值形如 `itemAlias@collection`，SSG 渲染器会复制内部第一个子节点 N 次；
 * - 内部的 `repeat-item` 是一个"模板卡片"，用户可以在里面拖入 `wb-cms-dynamic-text/image/link/datetime`
 *   等原子 block；这些子 block 会自动识别父级 repeat 并把字段下拉切换为当前 source 的 itemFields。
 *
 * traits：
 *   - source：循环数据源（dropdown，来自当前模板上下文的 DYNAMIC_REPEAT_MAP）
 *   - containerTag：包裹 tag（div/ul/ol/nav/section）
 *   - itemTag：每一项 tag（div/li/article）
 *   - layout：container class preset（none / grid / flex-row / flex-col），只是便捷 class
 */
import {
  WB_CMS_DYN_HTML_TYPE,
  WB_CMS_DYN_IMAGE_TYPE,
  WB_CMS_DYN_LINK_TYPE,
  WB_CMS_DYN_REPEAT_ITEM_TYPE,
  WB_CMS_DYN_REPEAT_TYPE,
  WB_CMS_DYN_TEXT_TYPE,
} from '../constants'
import { findRepeatSource } from '../bindings'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  getDynamicContextFromComponent,
  getRepeatSourceOptions,
  refreshTraitOptions,
} from '../helpers'
import { registerDynamicFieldBlock } from '../registerBlock'

const CONTAINER_TAG_OPTIONS = ['div', 'ul', 'ol', 'nav', 'section', 'article'].map((v) => ({
  id: v,
  value: v,
  label: v,
}))
const ITEM_TAG_OPTIONS = ['div', 'li', 'article', 'section'].map((v) => ({
  id: v,
  value: v,
  label: v,
}))
const LAYOUT_OPTIONS = [
  { id: 'none', value: 'none', label: '不修改样式' },
  { id: 'grid-2', value: 'grid-2', label: 'Grid · 2 列' },
  { id: 'grid-3', value: 'grid-3', label: 'Grid · 3 列' },
  { id: 'grid-4', value: 'grid-4', label: 'Grid · 4 列' },
  { id: 'flex-col', value: 'flex-col', label: 'Flex · 纵向' },
  { id: 'flex-row', value: 'flex-row', label: 'Flex · 横向' },
]

const LAYOUT_STYLE: Record<string, string> = {
  'grid-2': 'display:grid;grid-template-columns:repeat(2,1fr);gap:16px;',
  'grid-3': 'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;',
  'grid-4': 'display:grid;grid-template-columns:repeat(4,1fr);gap:16px;',
  'flex-col': 'display:flex;flex-direction:column;gap:12px;',
  'flex-row': 'display:flex;flex-direction:row;gap:12px;flex-wrap:wrap;',
  none: '',
}

const FILTER_OPERATOR_OPTIONS = [
  { id: 'eq', value: 'eq', label: '等于' },
  { id: 'neq', value: 'neq', label: '不等于' },
]

const FILTER_FIELD_KINDS = new Set(['text', 'number', 'url', 'bool'])
const REPEAT_ITEM_MARK = 'repeat-item'
const REPEAT_PLACEHOLDER_TEXT = '在此拖入动态文本 / 图片 / 链接等，构成每一项的模板。'

const getRepeatFilterFields = (model: any, editor?: any) => {
  const ctx = getDynamicContextFromComponent(model, editor)
  const source = findRepeatSource(ctx, model.get?.('dynSource'))
  return (source?.itemFields || []).filter((field) => FILTER_FIELD_KINDS.has(field.kind))
}

const placeholderComponent = () => ({
  tagName: 'div',
  content: REPEAT_PLACEHOLDER_TEXT,
  selectable: false,
  hoverable: false,
})

const repeatItemComponent = (components: any[] = [placeholderComponent()]) => ({
  type: WB_CMS_DYN_REPEAT_ITEM_TYPE,
  tagName: 'div',
  attributes: {
    'data-wb-dynamic': REPEAT_ITEM_MARK,
  },
  droppable: true,
  selectable: true,
  hoverable: true,
  components,
})

const textComponent = (field: string, fallback: string, tag = 'span') => ({
  type: WB_CMS_DYN_TEXT_TYPE,
  dynField: field,
  dynTag: tag,
  dynFallback: fallback,
  content: fallback,
  attributes: {
    'data-wb-dynamic': 'text',
    'data-cms-bind': field,
  },
})

const htmlComponent = (field: string, fallback: string) => ({
  type: WB_CMS_DYN_HTML_TYPE,
  dynField: field,
  attributes: {
    'data-wb-dynamic': 'html',
    'data-cms-html': field,
  },
  components: [{ tagName: 'span', content: fallback }],
})

const imageComponent = (srcField: string, altField: string, fallback: string) => ({
  type: WB_CMS_DYN_IMAGE_TYPE,
  dynSrcField: srcField,
  dynAltField: altField,
  attributes: {
    'data-wb-dynamic': 'image',
    src: '',
    alt: fallback,
    style: 'max-width:100%;height:auto;display:block;object-fit:cover;',
    'data-cms-bind-src': srcField,
    'data-cms-bind-alt': altField,
  },
})

const linkComponent = (hrefField: string, textField: string, fallback: string) => ({
  type: WB_CMS_DYN_LINK_TYPE,
  dynHrefField: hrefField,
  dynTextField: textField,
  dynTarget: '_self',
  content: fallback,
  attributes: {
    'data-wb-dynamic': 'link',
    href: '#',
    target: '_self',
    'data-cms-bind-href': hrefField,
    'data-cms-bind': textField,
  },
})

const linkWrapperComponent = (hrefField: string, components: any[]) => ({
  type: WB_CMS_DYN_LINK_TYPE,
  dynHrefField: hrefField,
  dynTarget: '_self',
  attributes: {
    'data-wb-dynamic': 'link',
    href: '#',
    target: '_self',
    'data-cms-bind-href': hrefField,
  },
  components,
})

const specRowComponents = () => [
  textComponent('spec.name', '规格名称', 'span'),
  htmlComponent('spec.valueHtml', '规格值'),
]

const datasheetCellComponents = () => [
  textComponent('cell.label', '字段名', 'span'),
  htmlComponent('cell.valueHtml', '字段值'),
]

const categoryPostComponents = (alias: string, fallback: string) => [
  linkComponent(`${alias}.url`, `${alias}.name`, fallback),
  textComponent(`${alias}.excerpt`, '文章摘要', 'p'),
]

const productSummaryComponents = (alias: string, fallback: string) => [
  linkWrapperComponent(`${alias}.url`, [
    imageComponent(`${alias}.picUrl`, `${alias}.name`, fallback),
  ]),
  linkComponent(`${alias}.url`, `${alias}.name`, fallback),
  textComponent(`${alias}.introduction`, 'Product introduction', 'p'),
]

export const buildPresetComponents = (source: string): any[] => {
  if (source === 'doc@product.documents') {
    return [linkComponent('doc.url', 'doc.name', '文档名称')]
  }
  if (source === 'specGroup@product.specGroups') {
    return [
      textComponent('specGroup.name', '规格分组名称', 'h3'),
      {
        type: WB_CMS_DYN_REPEAT_TYPE,
        dynSource: 'spec@specGroup.specifications',
        dynContainerTag: 'div',
        dynItemTag: 'div',
        dynLayout: 'none',
        components: [repeatItemComponent(specRowComponents())],
      },
    ]
  }
  if (source === 'spec@specGroup.specifications' || source === 'spec@product.specifications') {
    return specRowComponents()
  }
  if (source === 'field@datasheetFields') {
    return [textComponent('field.label', 'Datasheet 字段', 'span')]
  }
  if (source === 'product@products') {
    return [
      linkComponent('product.url', 'product.datasheetDesignation', '产品型号'),
      {
        type: WB_CMS_DYN_REPEAT_TYPE,
        dynSource: 'cell@product.datasheetCells',
        dynContainerTag: 'div',
        dynItemTag: 'div',
        dynLayout: 'none',
        components: [repeatItemComponent(datasheetCellComponents())],
      },
    ]
  }
  if (source === 'cell@product.datasheetCells') {
    return datasheetCellComponents()
  }
  if (source === 'faq@productCategory.faqs') {
    return [
      textComponent('faq.question', 'FAQ 问题', 'h3'),
      htmlComponent('faq.answerHtml', 'FAQ 答案'),
    ]
  }
  if (source === 'related@product.relatedProducts') {
    return productSummaryComponents('related', 'Related product')
  }
  if (
    source === 'popular@product.popularModels'
    || source === 'popular@productCategory.popularModels'
  ) {
    return productSummaryComponents('popular', 'Popular model')
  }
  if (source === 'applicationPost@productCategory.applicationPosts') {
    return categoryPostComponents('applicationPost', 'Application 文章')
  }
  if (source === 'engineeringPost@productCategory.engineeringPosts') {
    return categoryPostComponents('engineeringPost', 'Engineering 文章')
  }
  if (source === 'challengePost@productCategory.challengePosts') {
    return categoryPostComponents('challengePost', 'Challenges 文章')
  }
  return [placeholderComponent()]
}

const isRepeatItem = (component: any): boolean => {
  return component?.get?.('type') === WB_CMS_DYN_REPEAT_ITEM_TYPE
    || component?.getAttributes?.()?.['data-wb-dynamic'] === REPEAT_ITEM_MARK
}

const isRepeatComponent = (component: any): boolean =>
  component?.get?.('type') === WB_CMS_DYN_REPEAT_TYPE
  || component?.getAttributes?.()?.['data-wb-dynamic'] === 'repeat'

const findClosestRepeatComponent = (component: any): any | null => {
  const closest = component?.closestType?.(WB_CMS_DYN_REPEAT_TYPE)
  if (closest) return closest

  let current = component?.parent?.()
  while (current) {
    if (isRepeatComponent(current)) return current
    current = current?.parent?.()
  }

  return null
}

const resolveRepeatComponent = (editor: any, component: any): any | null => {
  if (isRepeatComponent(component)) return component

  const closest = findClosestRepeatComponent(component)
  if (closest) return closest

  const selected = editor?.getSelected?.()
  if (isRepeatComponent(selected)) return selected

  return findClosestRepeatComponent(selected)
}

const ensureRepeatItem = (model: any): any | null => {
  const children = model.components?.()
  if (!children) return null
  const first = children.at?.(0)
  if (isRepeatItem(first)) return first

  const item = children.add?.(repeatItemComponent([]), { at: 0 })
  return Array.isArray(item) ? item[0] : item
}

const applyRecommendedTemplate = (model: any): void => {
  const source = String(model?.get?.('dynSource') ?? '').trim()
  const item = ensureRepeatItem(model)
  if (!item) return
  const components = buildPresetComponents(source)
  try {
    item.components?.(components)
  } catch {
    item.components?.()?.reset?.(components)
  }
  try {
    model.em?.trigger?.('component:selected', model)
  } catch {
    // ignore
  }
  try {
    model.trigger?.('component:update:parent', model)
    item.trigger?.('component:update:parent', item)
  } catch {
    // ignore
  }
  bubbleRefreshTraits(item)
}

const registerRepeatItemType = (editor: any) => {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_CMS_DYN_REPEAT_ITEM_TYPE)) return

  domComponents.addType(WB_CMS_DYN_REPEAT_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-dynamic') === REPEAT_ITEM_MARK
        ? { type: WB_CMS_DYN_REPEAT_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '循环体模板',
        tagName: 'div',
        draggable: `[data-wb-dynamic="repeat"]`,
        droppable: true,
        selectable: true,
        hoverable: true,
        attributes: {
          'data-wb-dynamic': REPEAT_ITEM_MARK,
        },
        traits: [],
      },
    },
  })
}

export const registerDynamicRepeatBlock = (editor: any) => {
  registerRepeatItemType(editor)

  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_REPEAT_TYPE,
    dynamicKey: 'repeat',
    defaults: {
      tagName: 'div',
      name: '动态循环',
      attributes: {
        'data-cms-repeat-container': 'true',
      },
      components: [
        repeatItemComponent(),
      ],
      defaultProps: {
        // 之所以叫 dynSource 而不是 dynField，是为了与"字段"区分，
        // helpers.findAncestorRepeat 也是读的 dynSource
        dynSource: '',
        dynContainerTag: 'div',
        dynItemTag: 'div',
        dynLayout: 'none',
        dynFilterField: '',
        dynFilterOperator: 'eq',
        dynFilterValue: '',
      },
      droppable: false,
    },
    watchProps: [
      'dynSource',
      'dynContainerTag',
      'dynItemTag',
      'dynLayout',
      'dynFilterField',
      'dynFilterOperator',
      'dynFilterValue',
    ],
    syncAttrs: (model) => {
      const source = String(model.get('dynSource') ?? '').trim()
      const containerTag = String(model.get('dynContainerTag') ?? 'div').trim() || 'div'
      const itemTag = String(model.get('dynItemTag') ?? 'div').trim() || 'div'
      const layout = String(model.get('dynLayout') ?? 'none').trim() || 'none'
      const filterField = String(model.get('dynFilterField') ?? '').trim()
      const filterOperator = String(model.get('dynFilterOperator') ?? 'eq').trim() || 'eq'
      const filterValue = String(model.get('dynFilterValue') ?? '').trim()
      const ctx = getDynamicContextFromComponent(model, editor)
      const sourceMeta = findRepeatSource(ctx, source)

      if (model.get('tagName') !== containerTag) model.set('tagName', containerTag)

      // 顶部 layout 样式直接写到 style attribute（作为便捷预设，用户还能手改）
      const currentAttrs = { ...(model.getAttributes?.() || {}) }
      const layoutStyle = LAYOUT_STYLE[layout] || ''
      if (layoutStyle) currentAttrs.style = layoutStyle
      else delete currentAttrs.style
      model.setAttributes?.(currentAttrs)

      // 同步 item 容器 tag：仅改第一个 children（模板卡片）
      const firstChild = model.components?.()?.at?.(0)
      if (firstChild && firstChild.get?.('tagName') !== itemTag) {
        firstChild.set('tagName', itemTag)
      }

      // 触发子组件刷新其 traits（因为 source 切换导致可选字段集合变化）
      try {
        const children = model.components?.().models || []
        children.forEach((child: any) => bubbleRefreshTraits(child))
      } catch {
        // ignore
      }

      return {
        'data-cms-repeat': source,
        'data-cms-repeat-container': source ? 'true' : '',
        'data-cms-repeat-filter-field': filterField && filterValue ? filterField : '',
        'data-cms-repeat-filter-operator': filterField && filterValue ? filterOperator : '',
        'data-cms-repeat-filter-value': filterField && filterValue ? filterValue : '',
        'data-wb-item-alias': sourceMeta?.itemAlias || '',
      }
    },
    hydrateProps: (model) => {
      const attrs = model.getAttributes?.() || {}
      const source = String(attrs['data-cms-repeat'] ?? '').trim()
      const filterField = String(attrs['data-cms-repeat-filter-field'] ?? '').trim()
      const filterOperator = String(attrs['data-cms-repeat-filter-operator'] ?? '').trim()
      const filterValue = String(attrs['data-cms-repeat-filter-value'] ?? '').trim()
      const tagName = String(model.get('tagName') ?? '').trim()
      if (source && !model.get('dynSource')) model.set('dynSource', source, { silent: true })
      if (filterField && !model.get('dynFilterField')) {
        model.set('dynFilterField', filterField, { silent: true })
      }
      if (filterOperator && !model.get('dynFilterOperator')) {
        model.set('dynFilterOperator', filterOperator, { silent: true })
      }
      if (filterValue && !model.get('dynFilterValue')) {
        model.set('dynFilterValue', filterValue, { silent: true })
      }
      if (tagName && !model.get('dynContainerTag')) {
        model.set('dynContainerTag', tagName, { silent: true })
      }
      const firstChild = model.components?.()?.at?.(0)
      const itemTagName = String(firstChild?.get?.('tagName') ?? '').trim()
      if (itemTagName && !model.get('dynItemTag')) {
        model.set('dynItemTag', itemTagName, { silent: true })
      }
    },
    traits: [
      {
        type: 'select',
        label: '数据源',
        name: 'dynSource',
        changeProp: true,
        options: [{ value: '', label: '—（请选择数据源）' }],
      },
      {
        type: 'select',
        label: '容器标签',
        name: 'dynContainerTag',
        changeProp: true,
        options: CONTAINER_TAG_OPTIONS,
      },
      {
        type: 'select',
        label: '条目标签',
        name: 'dynItemTag',
        changeProp: true,
        options: ITEM_TAG_OPTIONS,
      },
      {
        type: 'select',
        label: '布局预设',
        name: 'dynLayout',
        changeProp: true,
        options: LAYOUT_OPTIONS,
      },
      {
        type: 'select',
        label: '过滤字段',
        name: 'dynFilterField',
        changeProp: true,
        options: [{ value: '', label: '—（不过滤）' }],
      },
      {
        type: 'select',
        label: '过滤条件',
        name: 'dynFilterOperator',
        changeProp: true,
        options: FILTER_OPERATOR_OPTIONS,
      },
      {
        type: 'text',
        label: '过滤值',
        name: 'dynFilterValue',
        changeProp: true,
        placeholder: '例如 dimensions',
      },
      {
        type: 'button',
        label: '循环体模板',
        text: '生成推荐模板',
        full: true,
        command: (currentEditor: any, ctx: any) => {
          applyRecommendedTemplate(resolveRepeatComponent(currentEditor, ctx?.component))
        },
      },
    ],
    refreshTraits: (model) => {
      const sourceOptions = getRepeatSourceOptions(model)
      refreshTraitOptions(model, 'dynSource', sourceOptions)

      const filterFields = getRepeatFilterFields(model)
      clearTraitValueIfUnavailable(model, 'dynFilterField', filterFields)
      refreshTraitOptions(
        model,
        'dynFilterField',
        buildTraitOptions(filterFields, { includeEmpty: true, emptyLabel: '—（不过滤）' }),
      )
    },
    onFirstAdd: (model) => {
      const ctx = getDynamicContextFromComponent(model, editor)
      const options = getRepeatSourceOptions(model)
      // 选第一个非空项
      const first = options.find((o) => o.value)
      if (first && !model.get('dynSource')) model.set('dynSource', first.value)
      if (first) {
        const source = findRepeatSource(ctx, first.value)
        // 记录 itemAlias 到组件数据，便于 SSG 侧调试（可选）
        if (source) {
          const existing = { ...(model.getAttributes?.() || {}) }
          existing['data-wb-item-alias'] = source.itemAlias
          model.setAttributes?.(existing)
        }
      }
    },
  })
}

/** 触发子组件刷新 traits（repeat source 切换后其下字段集合会变） */
const bubbleRefreshTraits = (component: any): void => {
  if (!component) return
  // 每个动态组件在 init 里都挂了 component:update:parent 监听，
  // 这里手动触发一次"伪属性变更"事件让它重算。
  try {
    component.trigger?.('component:update:parent', component)
  } catch {
    // ignore
  }
  const children = component.components?.()?.models || []
  children.forEach((c: any) => bubbleRefreshTraits(c))
}
