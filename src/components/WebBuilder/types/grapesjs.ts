/**
 * GrapesJS 组件 model 方法的 TypeScript 类型定义
 *
 * GrapesJS 基于 Backbone.js，model 方法中的 `this` 是动态绑定的，
 * 无法直接获得类型安全。使用 `this: GjsModelThis` 替换 `this: any`
 * 可在不改变运行时行为的前提下提供编辑器内联提示。
 *
 * 使用方式：
 *   import type { GjsModelThis } from '../../types/grapesjs'
 *   init(this: GjsModelThis) { ... }
 */

// ─────────────────────────────────────────────
// 组件集合
// ─────────────────────────────────────────────

export interface GjsComponents {
  /** 子组件数量 */
  length: number
  /** 按索引获取子组件 */
  at(index: number): GjsModelThis | undefined
  /** 添加子组件 */
  add(def: unknown): GjsModelThis
  /** 移除子组件 */
  remove(model: GjsModelThis): void
  /** 用新定义列表替换所有子组件 */
  reset(defs: unknown[]): void
  /** 遍历子组件 */
  each(fn: (model: GjsModelThis, index: number) => void): void
  /** 获取原始 Backbone models 数组 */
  models?: GjsModelThis[]
}

// ─────────────────────────────────────────────
// Model 方法 this 上下文
// ─────────────────────────────────────────────

export interface GjsModelThis {
  // ── 属性读写 ──
  /** 读取 model prop 值 */
  get(key: string): unknown
  /** 设置 model prop 值 */
  set(key: string, value: unknown): this

  // ── HTML 属性 ──
  /** 读取所有 HTML attributes */
  getAttributes(): Record<string, string>
  /** 合并写入 HTML attributes */
  addAttributes(attrs: Record<string, string>): void

  // ── 内联样式 ──
  /** 合并写入内联样式 */
  addStyle(style: Record<string, string>): void
  /** 移除单个内联样式属性 */
  removeStyle(prop: string): void

  // ── 事件 ──
  /** 监听 Backbone 事件（可用空格分隔多个事件名） */
  on(event: string, handler: (...args: unknown[]) => void): this
  /** 触发 Backbone 事件 */
  trigger(event: string, ...args: unknown[]): void

  // ── 子组件 ──
  /** 获取子组件集合（无参数调用时返回集合对象） */
  components(): GjsComponents
  /** 用字符串或定义列表替换子组件（带参数调用时为 setter） */
  components(value: unknown): void

  // ── 其他常用方法 ──
  /** 获取组件 CSS 选择器 */
  getClasses(): string[]
  /** 添加 CSS class */
  addClass(cls: string): void
  /** 移除 CSS class */
  removeClass(cls: string): void
}

// ─────────────────────────────────────────────
// View 方法 this 上下文
// ─────────────────────────────────────────────

export interface GjsViewThis {
  /** 关联的 model */
  model: GjsModelThis
  /** 组件根 DOM 元素 */
  el: HTMLElement
}

export interface RegistryExecutionAdapter {
  DomComponents?: {
    getType?: (type: string) => unknown
    addType?: (type: string, definition: unknown) => void
  }
  TraitManager?: {
    getType?: (type: string) => unknown
    addType?: (type: string, definition: unknown) => void
  }
  BlockManager?: {
    add?: (id: string, definition: unknown) => void
  }
}

export interface TraitAdapterRuntime {
  openColorPicker?: (options: unknown) => void
  getImageManager?: () => unknown
}
