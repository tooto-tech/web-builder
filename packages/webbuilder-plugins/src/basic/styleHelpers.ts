/**
 * WebBuilder 样式辅助函数
 *
 * 提取自 container.ts / grid.ts / carousel.ts 中重复定义的工具函数，
 * 供所有 registry 文件统一导入使用。
 *
 * buildBackgroundStyles / buildMinHeightStyles 已移除——
 * 背景和最小高度属性已迁移到 StyleManager（wb-layout / wb-background sector）。
 */

// ─────────────────────────────────────────────
// 基础类型转换
// ─────────────────────────────────────────────

/**
 * 将任意值转为有限数字，无法转换时返回 fallback
 */
export const toNumber = (val: unknown, fallback: number): number => {
  const num = Number(val)
  return Number.isFinite(num) ? num : fallback
}

/**
 * 将任意值转为字符串单位，若不在白名单内则返回 fallback
 */
export const toUnit = (val: unknown, fallback: string, allowed: string[]): string => {
  const unit = `${val || fallback}`
  return allowed.includes(unit) ? unit : fallback
}

/**
 * 将任意值转为布尔值，支持 'true'/'false'/'1'/'0' 字符串形式
 */
export const toBool = (val: unknown, fallback = false): boolean => {
  if (val === true || val === 'true' || val === 1 || val === '1') return true
  if (val === false || val === 'false' || val === 0 || val === '0') return false
  return fallback
}

// ─────────────────────────────────────────────
// 样式对象构建
// ─────────────────────────────────────────────

/**
 * 从 model 读取宽度 / 盒式布局属性，返回对应的 CSS 样式对象。
 *
 * 读取的 model props：
 * - contentWidth（'full' | 'boxed'）
 * - boxedWidth
 */
export function buildWidthStyles(model: any): Record<string, string> {
  const contentWidth = `${model.get('contentWidth') || 'full'}`
  const boxedWidth = toNumber(model.get('boxedWidth'), 1240)
  const manualMaxWidth = `${model.get('manualMaxWidth') || ''}`.trim()
  const isBoxed = contentWidth === 'boxed'

  return {
    'max-width': manualMaxWidth || (isBoxed ? `${Math.max(320, boxedWidth)}px` : 'none'),
    'margin-left': isBoxed ? 'auto' : '0',
    'margin-right': isBoxed ? 'auto' : '0',
  }
}
