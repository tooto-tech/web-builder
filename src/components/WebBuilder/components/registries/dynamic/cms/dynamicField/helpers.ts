/**
 * 动态字段 block 的共享工具与上下文解析。
 */
import {
  DEFAULT_DYNAMIC_CONTEXT,
  DYNAMIC_REPEAT_MAP,
  buildFieldSelectOptions,
  filterFieldsByKind,
  findFieldMeta,
  findRepeatSource,
  getAllRepeatItemFields,
  getPageLevelFields,
  resolveDynamicContext,
  type DynamicContext,
  type DynamicFieldKind,
  type DynamicFieldMeta
} from './bindings'
import { WB_CMS_DYN_REPEAT_TYPE, WB_TEMPLATE_CONTEXT_KEY } from './constants'

/* ──────────────── 页面上下文 ──────────────── */

const normalizeContext = (value: unknown): DynamicContext | null => {
  const s = `${value ?? ''}`.trim()
  if (
    s === 'post-detail' ||
    s === 'media-detail' ||
    s === 'product-detail' ||
    s === 'post-loop-item' ||
    s === 'media-loop-item' ||
    s === 'product-loop-item' ||
    s === 'post-category-item' ||
    s === 'media-category-item' ||
    s === 'product-category-item' ||
    s === 'product-category-faq-loop-item'
  )
    return s
  return null
}

/**
 * 从组件所属页面的 `custom` 字段读取 `wbTemplateContext`。
 * 如果没有，根据全局页面 resourceType 尝试解析；都没有就回退到默认。
 */
export const getDynamicContextFromComponent = (component: any, editor?: any): DynamicContext => {
  try {
    const page = findPageForComponent(component, editor)
    if (page) {
      const custom = page.get?.('custom') ?? page.custom ?? {}
      const direct = normalizeContext(custom?.[WB_TEMPLATE_CONTEXT_KEY])
      if (direct) return direct

      const resourceType = custom?.resourceType
      const fromResource = resolveDynamicContext(resourceType)
      if (fromResource) return fromResource
    }
  } catch {
    // ignore
  }

  return DEFAULT_DYNAMIC_CONTEXT
}

const findPageForComponent = (component: any, editor?: any): any | null => {
  const ed = editor || component?.em?.get?.('Editor') || component?.em
  if (!ed?.Pages) return null
  // 优先使用当前选中页（编辑态下几乎总是正确的）
  const selected = ed.Pages.getSelected?.()
  if (selected) {
    const main = selected.getMainComponent?.()
    if (main && isDescendantOf(component, main)) return selected
  }
  // 兜底遍历（跨页搜索可能发生在脚本性访问或历史撤销时）
  const pages = ed.Pages.getAll?.() || []
  for (const page of pages) {
    const main = page.getMainComponent?.()
    if (main && isDescendantOf(component, main)) return page
  }
  return selected || null
}

const isDescendantOf = (component: any, maybeAncestor: any): boolean => {
  if (!component || !maybeAncestor) return false
  let cur: any = component
  const seen = new Set<any>()
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    if (cur === maybeAncestor) return true
    cur = cur.parent?.()
  }
  return false
}

/* ──────────────── Repeat 作用域解析 ──────────────── */

/**
 * 从组件向上查找最近的 `wb-cms-dynamic-repeat` 父级。
 * 这个父级决定了当前可以 bind 的 item 字段集合。
 */
export const findAncestorRepeat = (component: any): any | null => {
  return findAncestorRepeats(component)[0] || null
}

export const findAncestorRepeats = (component: any): any[] => {
  const repeats: any[] = []
  if (!component) return repeats
  let cur = component.parent?.()
  let steps = 0
  while (cur && steps < 64) {
    if (cur.get?.('type') === WB_CMS_DYN_REPEAT_TYPE) repeats.push(cur)
    cur = cur.parent?.()
    steps += 1
  }
  return repeats
}

/**
 * 根据当前组件所在位置（是否在某个 repeat 内），返回可供 trait 下拉使用的字段列表。
 *
 * - 不在 repeat 内：返回页面级字段（post.*）；
 * - 在 repeat 内：返回该 repeat source 的 itemFields；
 *   若为空（例如 source 还没选），返回当前上下文所有 repeat 的 itemFields 合集做兜底。
 */
export const resolveAvailableFields = (
  component: any,
  options?: { kinds?: DynamicFieldKind[]; includeContextFields?: boolean; editor?: any }
): {
  context: DynamicContext
  inRepeat: boolean
  fields: DynamicFieldMeta[]
} => {
  const context = getDynamicContextFromComponent(component, options?.editor)
  const repeatAncestors = findAncestorRepeats(component)
  const repeatAncestor = repeatAncestors[0] || null

  let fields: DynamicFieldMeta[] = []
  if (repeatAncestor) {
    const source = findRepeatSource(context, repeatAncestor.get?.('dynSource'))
    if (source) {
      fields = [...source.itemFields]
    } else {
      fields = getAllRepeatItemFields(context)
    }
    // repeat 内通常也可以访问外层字段（Elementor Pro 也允许），做个可选开关
    if (options?.includeContextFields !== false) {
      const outerFields = repeatAncestors
        .slice(1)
        .map((ancestor) => findRepeatSource(context, ancestor.get?.('dynSource')))
        .filter(Boolean)
        .flatMap((outerSource) => outerSource!.itemFields)
      fields = [...fields, ...outerFields, ...getPageLevelFields(context)]
    }
  } else {
    fields = getPageLevelFields(context)
  }

  if (options?.kinds && options.kinds.length > 0) {
    fields = filterFieldsByKind(fields, options.kinds)
  }

  return {
    context,
    inRepeat: !!repeatAncestor,
    fields
  }
}

export interface DynamicTraitOption {
  id: string
  value: string
  label: string
}

/** 构造 select trait 的 options（GrapesJS 要求 `{ id?, value, label }`） */
export const buildTraitOptions = (
  fields: DynamicFieldMeta[],
  options?: { includeEmpty?: boolean; emptyLabel?: string; emptyValue?: string }
): DynamicTraitOption[] => {
  return buildFieldSelectOptions(fields, options).map((opt) => ({
    id: opt.value || '__empty__',
    value: opt.value,
    label: opt.label
  }))
}

/** 拿到当前上下文下所有可选 repeat 源（供 wb-cms-dynamic-repeat 使用） */
export const getRepeatSourceOptions = (component: any, editor?: any): DynamicTraitOption[] => {
  const context = getDynamicContextFromComponent(component, editor)
  const parentSource = findAncestorRepeat(component)?.get?.('dynSource')
  const allSources = DYNAMIC_REPEAT_MAP[context] || []
  const list = parentSource
    ? allSources.filter((source) => source.parentSource === parentSource)
    : allSources.filter((source) => !source.parentSource)
  return [
    { id: '__empty__', value: '', label: '—（请选择数据源）' },
    ...list.map((source) => ({ id: source.value, value: source.value, label: source.label }))
  ]
}

/** 刷新某个 trait 的 options（编辑器内需要手动触发渲染） */
export const refreshTraitOptions = (
  component: any,
  traitName: string,
  options: DynamicTraitOption[]
): void => {
  const trait = component?.getTrait?.(traitName)
  if (!trait) return
  const current = `${component?.get?.(traitName) ?? ''}`.trim()
  const currentMeta = current ? findFieldMeta(current) : null
  const normalizedOptions = [...options]
  if (current && !normalizedOptions.some((option) => option.value === current)) {
    normalizedOptions.push({
      id: current,
      value: current,
      label: currentMeta ? `当前：${currentMeta.label}` : `当前：${current}`
    })
  }
  try {
    trait.set?.('options', normalizedOptions)
  } catch {
    // older GrapesJS falls back to attributes
  }
  try {
    component?.get?.('traits')?.trigger?.('change')
    component?.trigger?.('change:traits', component)
  } catch {
    // ignore
  }
  // 通知视图刷新
  try {
    component?.em?.trigger?.('component:update:traits', component)
  } catch {
    // ignore
  }
}

export const clearTraitValueIfUnavailable = (
  component: any,
  propName: string,
  fields: DynamicFieldMeta[]
): void => {
  const current = `${component?.get?.(propName) ?? ''}`.trim()
  if (!current) return
  if (fields.some((field) => field.value === current)) return
  // 组件创建/加载时可能先 init 子组件，再挂到 repeat 父级。
  // 此时当前作用域字段列表还不完整，不能把一个全局已知的合法字段清空。
  if (findFieldMeta(current)) return
  component?.set?.(propName, '')
}

/** 把 model 某个 prop 映射成对应 DOM attribute（空值则移除） */
export const applyBindAttribute = (
  model: any,
  attrName: string,
  value: string | undefined | null
): void => {
  const attrs = { ...(model.getAttributes?.() || {}) }
  const normalized = `${value ?? ''}`.trim()
  if (normalized) {
    attrs[attrName] = normalized
  } else {
    delete attrs[attrName]
  }
  model.setAttributes?.(attrs)
}

/** 供 syncAttrs 使用的"只保留非空 data-cms-*"生成器 */
export const buildSparseAttrs = (
  entries: Array<[string, string | undefined | null]>
): Record<string, string> => {
  const out: Record<string, string> = {}
  entries.forEach(([key, value]) => {
    const normalized = `${value ?? ''}`.trim()
    if (normalized) out[key] = normalized
  })
  return out
}

export { DYNAMIC_FIELD_MAP, DYNAMIC_REPEAT_MAP } from './bindings'
