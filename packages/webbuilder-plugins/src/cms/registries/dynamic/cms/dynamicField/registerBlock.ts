/**
 * 动态字段 block 公共注册器。
 * 把所有 `wb-cms-dynamic-*` 原子组件共用的 GrapesJS 模板逻辑封装在这里：
 *
 * - `isComponent`：根据根元素上的 `data-wb-dynamic` 标识自动识别；
 * - `init`：监听字段 trait 变更，自动调用 `syncAttrs`；
 * - `init`：当组件被挂进画布（或剪切板/撤销/切 Tab 后）时，主动刷新字段下拉
 *   选项，以反映"是否在 repeat 内""当前页上下文"的动态变化；
 * - `onInitialized`：用户从面板拖入后给出合理默认值。
 *
 * **不**走 `registerCmsComponent`——这些原子 block 没有自己的 publishTemplate、
 * 不需要 innerHTML 替换。它们只是输出带 `data-cms-bind*` 属性的简单 DOM，
 * 由 SSG 渲染器在发布时消化。
 */
import { WB_DYN_MARK_ATTR } from './constants.js'
import { DYNAMIC_FIELD_STYLES } from './styles.js'

export interface DynamicBlockRefreshHook {
  /** 选中或属性变化时，用于刷新 traits 下拉（字段/源 选项） */
  (model: any, editor: any): void
}

export interface DynamicBlockDefaults {
  tagName: string
  /** 组件在画布上显示的名字 */
  name: string
  /** 初始内部内容（可为空字符串） */
  content?: string
  /** 初始子组件定义 */
  components?: any[]
  /** 初始 DOM 属性（class、data-*、src 等） */
  attributes?: Record<string, string>
  /** trait 默认值（初始 prop 值） */
  defaultProps?: Record<string, any>
  /** 是否可拖进来（默认 true） */
  draggable?: boolean | string
  /** 是否可放置子元素（默认 false） */
  droppable?: boolean | string
  /** 是否可编辑内联文字（默认 false，字段值由 traits 控制） */
  editable?: boolean
  /** 是否允许删除（默认 true） */
  removable?: boolean
  /** 是否允许复制（默认 true） */
  copyable?: boolean
  /** 是否在 style manager 可定制（默认 true） */
  stylable?: boolean
  /** 组件类型相关 CSS，必须能随 schema 在发布器中恢复 */
  styles?: string
}

export interface DynamicBlockRegistration {
  /** GrapesJS 组件类型，例如 `wb-cms-dynamic-text` */
  type: string
  /** `data-wb-dynamic` 属性值，用于 isComponent 识别 */
  dynamicKey: string
  /** model defaults（结构化版本） */
  defaults: DynamicBlockDefaults
  /** 需要监听 change 事件的 prop 名单；变更后会触发 `syncAttrs` */
  watchProps: string[]
  /** 根据当前 model 生成要写回的 `data-*` 属性；空字符串会被自动移除 */
  syncAttrs: (model: any) => Record<string, string>
  /** traits 定义（允许函数形式以便在注册时动态获取 editor） */
  traits: any[] | ((editor: any) => any[])
  /**
   * 每次选中 / 挂载 / 结构变化时调用，用于刷新 trait 下拉 options。
   * 实现里通常会：① 根据是否在 repeat 内切换字段集；② 根据当前模板上下文切换字段集。
   */
  refreshTraits?: DynamicBlockRefreshHook
  /** 从已保存的 data-cms-* attributes 回填 changeProp props，保证保存后再次打开能显示选中值 */
  hydrateProps?: (model: any, editor: any) => void
  /** 首次拖入画布后执行（仅运行一次），用于设置合理默认字段值 */
  onFirstAdd?: (model: any, editor: any) => void
  /** init 最后一步额外挂钩（可选） */
  onModelInit?: (model: any, editor: any) => void
}

const FIRST_ADD_FLAG = '__wbDynFirstAddHandled'
const DYNAMIC_KEYS_WITH_PUBLISH_STYLES = new Set([
  'text',
  'html',
  'image',
  'if',
  'repeat',
  'seo-meta',
  'breadcrumb',
  'toc',
])

const runSyncAttrs = (model: any, registration: DynamicBlockRegistration): void => {
  const base = registration.syncAttrs(model) || {}
  const next: Record<string, string> = {
    [WB_DYN_MARK_ATTR]: registration.dynamicKey,
  }
  Object.entries(base).forEach(([key, value]) => {
    const normalized = `${value ?? ''}`.trim()
    if (normalized) {
      next[key] = normalized
    }
  })

  // 先移除所有已存在的 data-cms-bind* / data-cms-if / data-cms-repeat / data-cms-html / data-cms-format
  // 再写入最新值，避免用户切换字段后旧属性残留。
  const current = model.getAttributes?.() || {}
  const toRemove: string[] = []
  Object.keys(current).forEach((key) => {
    if (
      key.startsWith('data-cms-bind')
      || key === 'data-cms-if'
      || key === 'data-cms-repeat'
      || key === 'data-cms-repeat-container'
      || key.startsWith('data-cms-repeat-filter-')
      || key === 'data-cms-html'
      || key === 'data-cms-format'
      || key === 'data-wb-item-alias'
    ) {
      if (!(key in next)) toRemove.push(key)
    }
  })
  if (toRemove.length) {
    const cleaned = { ...current }
    toRemove.forEach((k) => delete cleaned[k])
    model.setAttributes?.({ ...cleaned, ...next })
  } else {
    model.addAttributes?.(next)
  }
}

export const registerDynamicFieldBlock = (
  editor: any,
  registration: DynamicBlockRegistration,
): void => {
  const domComponents = editor?.DomComponents
  if (!domComponents) return
  if (domComponents.getType(registration.type)) return

  const traitsValue =
    typeof registration.traits === 'function' ? registration.traits(editor) : registration.traits

  const {
    tagName,
    name,
    content,
    components,
    attributes,
    defaultProps,
    draggable,
    droppable,
    editable,
    removable,
    copyable,
    stylable,
    styles,
  } = registration.defaults
  const componentStyles = styles ?? (
    DYNAMIC_KEYS_WITH_PUBLISH_STYLES.has(registration.dynamicKey)
      ? DYNAMIC_FIELD_STYLES
      : undefined
  )

  domComponents.addType(registration.type, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.(WB_DYN_MARK_ATTR) === registration.dynamicKey
        ? { type: registration.type }
        : false,

    model: {
      defaults: {
        name,
        tagName,
        draggable: draggable ?? true,
        droppable: droppable ?? false,
        selectable: true,
        hoverable: true,
        editable: editable ?? false,
        removable: removable ?? true,
        copyable: copyable ?? true,
        stylable: stylable ?? true,
        content,
        components,
        attributes: {
          [WB_DYN_MARK_ATTR]: registration.dynamicKey,
          ...(attributes || {}),
        },
        ...(componentStyles ? { styles: componentStyles } : {}),
        ...(defaultProps || {}),
        traits: traitsValue,
      },

      init(this: any) {
        try {
          registration.hydrateProps?.(this, editor)
        } catch {
          // ignore hydrate errors
        }

        const watch = registration.watchProps?.length
          ? registration.watchProps.map((p) => `change:${p}`).join(' ')
          : ''
        if (watch) {
          this.on(watch, () => {
            runSyncAttrs(this, registration)
            try {
              registration.refreshTraits?.(this, editor)
            } catch {
              // ignore refresh errors
            }
          })
        }

        // 首次挂载：写一次属性 + 首次拖入钩子 + 刷新 traits
        runSyncAttrs(this, registration)
        try {
          if (!this.get(FIRST_ADD_FLAG)) {
            this.set(FIRST_ADD_FLAG, true, { silent: true })
            registration.onFirstAdd?.(this, editor)
            runSyncAttrs(this, registration)
          }
        } catch {
          // ignore
        }

        const refresh = () => {
          try {
            registration.refreshTraits?.(this, editor)
          } catch {
            // ignore refresh errors
          }
        }

        // 选中/父级变化时刷新 traits（反映 repeat 作用域变化）
        this.on('component:mount component:selected component:update:parent', refresh)
        try {
          editor?.on?.('component:selected', (selected: any) => {
            if (selected === this) refresh()
          })
        } catch {
          // ignore
        }

        refresh()
        registration.onModelInit?.(this, editor)
      },
    },
  })
}
