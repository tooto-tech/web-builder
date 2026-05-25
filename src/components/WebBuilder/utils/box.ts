/**
 * BoxValue - 统一的间距/尺寸数据结构
 * 用于 margin / padding / border-width / border-radius 等所有 spacing 类控件
 */
export type BoxValue = {
  mode: 'linked' | 'unlinked'
  unit: 'px' | '%' | 'em' | 'rem' | 'vw' | 'vh'
  value?: number // linked 模式使用
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/**
 * 默认 BoxValue
 */
export const defaultBoxValue: BoxValue = {
  mode: 'linked',
  unit: 'px',
  value: 0,
}

/**
 * 创建默认 BoxValue
 */
export function createBoxValue(overrides?: Partial<BoxValue>): BoxValue {
  return {
    ...defaultBoxValue,
    ...overrides,
  }
}

/**
 * 格式化数值 + 单位
 */
function formatValue(value: number | undefined, unit: string): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0'
  }
  return `${value}${unit}`
}

/**
 * BoxValue → CSS 对象
 * 
 * @param type - CSS 属性类型：'margin' | 'padding' | 'border-width' | 'border-radius'
 * @param box - BoxValue 数据
 * @returns CSS 样式对象
 * 
 * @example
 * // linked 模式
 * boxToCSS('margin', { mode: 'linked', unit: 'px', value: 10 })
 * // → { margin: '10px' }
 * 
 * // unlinked 模式
 * boxToCSS('margin', { 
 *   mode: 'unlinked', 
 *   unit: 'px', 
 *   top: 10, 
 *   right: 20, 
 *   bottom: 10, 
 *   left: 20 
 * })
 * // → { 
 * //     'margin-top': '10px',
 * //     'margin-right': '20px',
 * //     'margin-bottom': '10px',
 * //     'margin-left': '20px'
 * //   }
 */
export function boxToCSS(
  type: 'margin' | 'padding' | 'border-width' | 'border-radius',
  box: BoxValue
): Record<string, string> {
  const { mode, unit, value, top, right, bottom, left } = box

  if (mode === 'linked') {
    // 联动模式：使用简写属性
    const cssValue = formatValue(value, unit)
    return { [type]: cssValue }
  } else {
    // 独立模式：使用四个方向的属性
    const prefix = type === 'border-radius' ? 'border-' : `${type}-`
    return {
      [`${prefix}top`]: formatValue(top, unit),
      [`${prefix}right`]: formatValue(right, unit),
      [`${prefix}bottom`]: formatValue(bottom, unit),
      [`${prefix}left`]: formatValue(left, unit),
    }
  }
}

/**
 * 解析 CSS 值（提取数值和单位）
 */
function parseCSSValue(value: string): { num: number; unit: BoxValue['unit'] } | null {
  if (!value || typeof value !== 'string') {
    return null
  }

  // 匹配数字和单位，例如: "10px", "20%", "1.5em"
  const match = value.trim().match(/^(-?\d*\.?\d+)(px|%|em|rem|vw|vh)?$/)
  if (!match) {
    return null
  }

  const num = parseFloat(match[1])
  const unitStr = match[2] || 'px'
  const validUnits: BoxValue['unit'][] = ['px', '%', 'em', 'rem', 'vw', 'vh']
  const unit = (validUnits.includes(unitStr as BoxValue['unit']) 
    ? unitStr 
    : 'px') as BoxValue['unit']

  return { num, unit }
}

/**
 * CSS 对象 → BoxValue
 * 
 * @param type - CSS 属性类型：'margin' | 'padding' | 'border-width' | 'border-radius'
 * @param style - CSS 样式对象
 * @returns BoxValue 数据
 * 
 * @example
 * // 简写属性 → linked 模式
 * cssToBox('margin', { margin: '10px' })
 * // → { mode: 'linked', unit: 'px', value: 10 }
 * 
 * // 独立属性 → unlinked 模式
 * cssToBox('margin', { 
 *   'margin-top': '10px',
 *   'margin-right': '20px',
 *   'margin-bottom': '10px',
 *   'margin-left': '20px'
 * })
 * // → { 
 * //     mode: 'unlinked', 
 * //     unit: 'px', 
 * //     top: 10, 
 * //     right: 20, 
 * //     bottom: 10, 
 * //     left: 20 
 * //   }
 */
export function cssToBox(
  type: 'margin' | 'padding' | 'border-width' | 'border-radius',
  style: Record<string, string>
): BoxValue {
  const prefix = type === 'border-radius' ? 'border-' : `${type}-`
  const shorthand = style[type]
  const topKey = `${prefix}top`
  const rightKey = `${prefix}right`
  const bottomKey = `${prefix}bottom`
  const leftKey = `${prefix}left`

  // 优先检查简写属性（linked 模式）
  if (shorthand) {
    const parsed = parseCSSValue(shorthand)
    if (parsed) {
      return {
        mode: 'linked',
        unit: parsed.unit,
        value: parsed.num,
      }
    }
  }

  // 检查独立属性（unlinked 模式）
  const top = parseCSSValue(style[topKey])
  const right = parseCSSValue(style[rightKey])
  const bottom = parseCSSValue(style[bottomKey])
  const left = parseCSSValue(style[leftKey])

  // 如果至少有一个方向有值，使用 unlinked 模式
  if (top || right || bottom || left) {
    // 统一单位（优先使用第一个有效值的单位）
    const unit: BoxValue['unit'] = (top?.unit || right?.unit || bottom?.unit || left?.unit || 'px') as BoxValue['unit']

    return {
      mode: 'unlinked',
      unit,
      top: top?.num ?? 0,
      right: right?.num ?? 0,
      bottom: bottom?.num ?? 0,
      left: left?.num ?? 0,
    }
  }

  // 默认值
  return defaultBoxValue
}

/**
 * 合并两个 BoxValue（用于切换模式时的数据迁移）
 * 
 * @param from - 源 BoxValue
 * @param to - 目标 BoxValue（目标模式）
 * @returns 合并后的 BoxValue（确保数据结构干净，只包含对应模式的字段）
 */
export function mergeBoxValue(from: BoxValue, to: BoxValue): BoxValue {
  // 如果模式相同，直接返回目标值（但需要清理不需要的字段）
  if (from.mode === to.mode) {
    if (to.mode === 'linked') {
      return {
        mode: 'linked',
        unit: to.unit,
        value: to.value ?? 0,
      }
    } else {
      return {
        mode: 'unlinked',
        unit: to.unit,
        top: to.top ?? 0,
        right: to.right ?? 0,
        bottom: to.bottom ?? 0,
        left: to.left ?? 0,
      }
    }
  }

  // 从 linked 切换到 unlinked
  if (from.mode === 'linked' && to.mode === 'unlinked') {
    const value = from.value ?? 0
    return {
      mode: 'unlinked',
      unit: from.unit,
      top: to.top ?? value,
      right: to.right ?? value,
      bottom: to.bottom ?? value,
      left: to.left ?? value,
    }
  }

  // 从 unlinked 切换到 linked
  if (from.mode === 'unlinked' && to.mode === 'linked') {
    // 使用 top 或 value 作为统一值
    const value = to.value ?? from.top ?? from.value ?? 0
    return {
      mode: 'linked',
      unit: from.unit,
      value,
    }
  }

  // 默认情况：返回清理后的目标值
  if (to.mode === 'linked') {
    return {
      mode: 'linked',
      unit: to.unit,
      value: to.value ?? 0,
    }
  } else {
    return {
      mode: 'unlinked',
      unit: to.unit,
      top: to.top ?? 0,
      right: to.right ?? 0,
      bottom: to.bottom ?? 0,
      left: to.left ?? 0,
    }
  }
}
