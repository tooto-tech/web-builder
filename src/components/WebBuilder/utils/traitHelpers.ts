/**
 * Trait 相关工具函数
 */

/**
 * 从 ComputedRefImpl 或其他响应式对象中提取值
 */
export function unwrapValue(value: any): any {
  if (value == null) return value
  // 如果是 ComputedRefImpl 或其他有 .value 属性的对象
  if (typeof value === 'object' && 'value' in value) {
    return value.value
  }
  return value
}

/**
 * 获取 trait 的显示名称
 */
export function getTraitLabel(trait: any): string {
  if (!trait) return ''

  // 1. 使用 get 方法获取 label
  if (typeof trait.get === 'function') {
    const label = unwrapValue(trait.get('label'))
    if (label) return String(label)
  }

  // 2. 直接访问 label 属性（可能是 ComputedRefImpl）
  const directLabel = unwrapValue(trait.label)
  if (directLabel) return String(directLabel)

  // 3. 使用 getLabel 方法（如果存在）
  if (typeof trait.getLabel === 'function') {
    const label = unwrapValue(trait.getLabel())
    if (label) return String(label)
  }

  // 4. 使用 get 方法获取 name
  if (typeof trait.get === 'function') {
    const name = unwrapValue(trait.get('name'))
    if (name) return String(name)
  }

  // 5. 直接访问 name 属性（可能是 ComputedRefImpl）
  const directName = unwrapValue(trait.name)
  if (directName) return String(directName)

  // 6. 使用 getName 方法（如果存在）
  if (typeof trait.getName === 'function') {
    const name = unwrapValue(trait.getName())
    if (name) return String(name)
  }

  return ''
}

/**
 * 获取 trait 的类型
 */
export function getTraitType(trait: any): string {
  if (!trait) return 'text'

  // 1. 使用 get 方法获取 type
  if (typeof trait.get === 'function') {
    const type = unwrapValue(trait.get('type'))
    if (type) return String(type)
  }

  // 2. 直接访问 type 属性（可能是 ComputedRefImpl）
  const directType = unwrapValue(trait.type)
  if (directType) return String(directType)

  return 'text'
}

/**
 * 获取 trait 的值
 */
const getTraitName = (trait: any): string => {
  const model = trait?._model ?? trait
  return String(model?.get?.('name') ?? trait?.name ?? '').trim()
}

const getTraitTarget = (trait: any, fallbackTarget?: any): any => {
  const model = trait?._model ?? trait
  return (
    fallbackTarget ||
    model?.target ||
    model?.get?.('target') ||
    trait?.target ||
    trait?.component ||
    null
  )
}

const isChangePropTrait = (trait: any): boolean => {
  const model = trait?._model ?? trait
  return Boolean(model?.get?.('changeProp') ?? trait?.changeProp)
}

const getTraitProp = (trait: any, name: string): any => {
  const model = trait?._model ?? trait
  return model?.get?.(name) ?? trait?.[name]
}

const isCheckboxTrait = (trait: any): boolean => getTraitType(trait) === 'checkbox'

const normalizeCheckboxValue = (trait: any, value: any): boolean => {
  const valueTrue = getTraitProp(trait, 'valueTrue')
  const valueFalse = getTraitProp(trait, 'valueFalse')

  if (valueTrue !== undefined && value === valueTrue) return true
  if (valueFalse !== undefined && value === valueFalse) return false
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false

  // GrapesJS treats an existing empty boolean attribute as checked.
  if (value === '') return true

  return Boolean(value)
}

const formatCheckboxValueForTarget = (trait: any, value: any): any => {
  const checked = normalizeCheckboxValue(trait, value)
  const valueTrue = getTraitProp(trait, 'valueTrue')
  const valueFalse = getTraitProp(trait, 'valueFalse')

  if (checked && valueTrue !== undefined) return valueTrue
  if (!checked && valueFalse !== undefined) return valueFalse
  return checked
}

const readTargetTraitValue = (trait: any, target?: any): any => {
  const name = getTraitName(trait)
  const component = getTraitTarget(trait, target)
  if (!component || !name) return undefined

  if (isChangePropTrait(trait)) {
    const propValue = component.get?.(name)
    if (propValue != null) {
      return isCheckboxTrait(trait) ? normalizeCheckboxValue(trait, propValue) : propValue
    }
  }

  const attrs = component.getAttributes?.() || component.get?.('attributes') || {}
  if (attrs && Object.prototype.hasOwnProperty.call(attrs, name)) {
    return isCheckboxTrait(trait) ? normalizeCheckboxValue(trait, attrs[name]) : attrs[name]
  }

  return undefined
}

const syncTargetTraitValue = (trait: any, value: any, target?: any): void => {
  const name = getTraitName(trait)
  const component = getTraitTarget(trait, target)
  if (!component || !name) return

  if (isChangePropTrait(trait)) {
    component.set?.(
      name,
      isCheckboxTrait(trait) ? formatCheckboxValueForTarget(trait, value) : value
    )
    return
  }

  const attrs = { ...(component.getAttributes?.() || {}) }
  delete attrs.__p
  let normalized: any
  if (isCheckboxTrait(trait)) {
    normalized = formatCheckboxValueForTarget(trait, value)
  } else {
    normalized = value == null ? '' : String(value)
  }
  if (normalized) attrs[name] = normalized
  else delete attrs[name]
  component.setAttributes?.(attrs)
}

export function getTraitValue(trait: any, target?: any): any {
  if (!trait) return ''

  const model = trait?._model ?? trait

  const targetValue = readTargetTraitValue(trait, target)
  if (targetValue != null) return targetValue

  // 0. 优先读取可写 computed ref 的当前值（兼容旧桥接层遗留 trait 对象）
  if (trait?.value && typeof trait.value === 'object' && 'value' in trait.value) {
    const computedValue = unwrapValue(trait.value)
    if (computedValue != null) return computedValue
  }

  // 1. 使用 getValue 方法
  if (typeof model?.getValue === 'function') {
    return unwrapValue(model.getValue()) ?? ''
  }

  // 2. 访问 value 属性（可能是 ComputedRefImpl）
  const value = unwrapValue(trait.value)
  if (value != null) return value

  // 3. 使用 get 方法获取 value
  if (typeof model?.get === 'function') {
    return unwrapValue(model.get('value')) ?? ''
  }

  return ''
}

/**
 * 设置 trait 的值
 */
export function setTraitValue(trait: any, value: any, target?: any): void {
  if (!trait) return

  const model = trait?._model ?? trait

  if (isCheckboxTrait(trait) && !isChangePropTrait(trait)) {
    const normalized = formatCheckboxValueForTarget(trait, value)
    syncTargetTraitValue(trait, normalized, target)
    model?.set?.('value', normalizeCheckboxValue(trait, normalized), { fromInput: true })
    model?.trigger?.('change:value', model, normalizeCheckboxValue(trait, normalized))
    return
  }

  let handled = false

  // 1) 优先走 computed ref 赋值（可确保 Vue 层与 GrapesJS 目标同步）
  if (trait?.value && typeof trait.value === 'object' && 'value' in trait.value) {
    trait.value.value = value
    handled = true
  }

  // 2) GrapesJS trait 标准写法（会触发 target 更新）
  if (!handled && typeof model?.setValue === 'function') {
    model.setValue(value, { fromInput: true })
    handled = true
  }

  if (!handled && typeof model?.setTargetValue === 'function') {
    model.setTargetValue(value, { fromInput: true })
    handled = true
  }

  // 3) 兜底
  if (!handled && typeof model?.set === 'function') {
    model.set('value', value)
    if (typeof model.trigger === 'function') {
      model.trigger('change:value', model, value)
    }
  }

  // 自定义 Vue 属性面板拿到的 trait 有时没有正确绑定 target。
  // 对 changeProp trait 显式同步一次当前选中组件，确保字段选择能进入项目 JSON 和导出 HTML。
  syncTargetTraitValue(trait, value, target)
}

/**
 * 获取 trait 的选项（用于 select 类型）
 */
export function getTraitOptions(
  trait: any
): Array<{ value: any; label: string; [key: string]: any }> {
  const options = trait.get?.('options') ?? trait.options ?? []
  if (!Array.isArray(options)) return []

  // 过滤并规范化选项，确保 label 和 value 都是有效值
  const validOptions: Array<{ value: any; label: string; [key: string]: any }> = []

  for (const option of options) {
    if (option == null) continue // 跳过 null 和 undefined

    // 如果 option 是字符串或数字，转换为对象格式
    if (typeof option === 'string' || typeof option === 'number') {
      validOptions.push({ value: option, label: String(option) })
      continue
    }

    // 如果 option 是对象，确保有有效的 label 和 value
    if (typeof option === 'object') {
      const value = option.value ?? option.id ?? option
      const label = option.label ?? option.name ?? String(value ?? '')
      // 如果 label 或 value 是 null/undefined，跳过
      if (value != null && label != null) {
        validOptions.push({
          ...option,
          value,
          label: String(label)
        })
      }
    }
  }

  return validOptions
}

/**
 * 已知的自定义 trait 类型列表
 */
export const CUSTOM_TRAIT_TYPES = new Set([
  'custom-attributes',
  'color-picker',
  'image-picker',
  'icon-radio',
  'svg-icon-picker',
  'inquiry-type-select',
  'menu-tree-select',
  'navbar-menu-select',
  'navbar-thb-menu-select',
  'footer-menu-select',
  'loop-item-template-select',
  'loop-grid-template-select',
  'flipbook-pages',
  'hotspot-showcase-slides',
  'hotspot-showcase-hotspots',
  'apps-carousel-thb-minis',
  'code-editor'
])

/**
 * 检查是否是自定义 trait 类型
 */
export function isCustomTraitType(traitType: string): boolean {
  return CUSTOM_TRAIT_TYPES.has(traitType)
}
