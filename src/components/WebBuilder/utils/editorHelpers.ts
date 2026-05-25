import { removeUngroupedCssRulesByPrefixes } from './cssScope'

const WB_SYMBOL_CSS_CACHE_KEY = '__wbSymbolCssCache'
const WB_LEGACY_GLOBAL_STYLES_CLEANED_KEY = '__wbLegacyGlobalStylesCleaned'
const WB_DUPLICATE_CSS_RULES_CLEANED_KEY = '__wbDuplicateCssRulesCleaned'
const WB_CLONE_CSS_PATCHED_KEY = '__wbCloneCssPatched'
const WB_CLONE_CSS_COPY_DEPTH_KEY = '__wbCloneCssCopyDepth'
const WB_CLONE_CSS_SOURCE_KEY = '__wbCloneCssSource'
const COMPONENT_STYLE_GROUP_PREFIX = 'cmp:'

const LEGACY_GLOBAL_STYLE_PREFIXES = [
  '.gjs-navbar',
  '.gjs-nav-group',
  '.gjs-footer',
  '.wb-btn--',
  '.wb-section',
  '.wb-contact-block',
  '.wb-tmg',
  '.wb-banner__',
  '[data-wb-component="banner"]',
  '.wb-history__',
  '[data-wb-component="history-timeline"]',
  '[data-wb-component="industry-tabs"]',
  '.wb-it__',
  '.wb-carousel',
  '[data-wb-component="marquee"]',
  '.wb-inquiry',
  '[data-wb-component="inquiry-form"]',
  '[data-wb-component="grid"][data-show-outline="true"]',
]

const ZERO_CSS_VALUES = new Set(['0', '0px', '0rem', '0em', '0%', '0vh', '0vw'])
const BODY_MARGIN_KEYS = new Set([
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
])

const getCssComposer = (editor: any) => editor?.CssComposer || editor?.Css

const getComponentsApi = (editor: any) => editor?.Components || editor?.DomComponents

const getComponentTypeStyles = (editor: any, component: any): string | undefined => {
  const instanceStyles = component?.get?.('styles')
  if (typeof instanceStyles === 'string' && instanceStyles.trim()) {
    return instanceStyles
  }

  const type = `${component?.get?.('type') ?? ''}`.trim()
  if (!type) return undefined

  const componentsApi = getComponentsApi(editor)
  const typeDef = componentsApi?.getType?.(type)
  const modelCtor = typeDef?.model
  const defaults =
    modelCtor?.getDefaults?.()
    ?? modelCtor?.prototype?.defaults

  const typeStyles = defaults?.styles
  return typeof typeStyles === 'string' && typeStyles.trim() ? typeStyles : undefined
}

const serializeSelector = (selector: any) => ({
  name: selector?.get?.('name') ?? selector?.name ?? '',
  type: selector?.get?.('type') ?? selector?.type,
  active: selector?.get?.('active') ?? selector?.active ?? true,
  label: selector?.get?.('label') ?? selector?.label ?? '',
})

const serializeRule = (rule: any) => ({
  selectors: (rule?.get?.('selectors') || []).map((selector: any) => serializeSelector(selector)),
  style: { ...(rule?.get?.('style') ?? {}) },
  mediaText: rule?.get?.('mediaText') ?? '',
  state: rule?.get?.('state') ?? '',
  atRuleType: rule?.get?.('atRuleType') ?? '',
})

const normalizeRuleStyle = (styleLike: Record<string, any> = {}) =>
  Object.keys(styleLike)
    .sort()
    .reduce((acc, key) => {
      acc[key] = styleLike[key]
      return acc
    }, {} as Record<string, any>)

const getRuleSignature = (ruleLike: any): string => {
  const data = ruleLike?.get ? serializeRule(ruleLike) : ruleLike
  return JSON.stringify({
    selectors: data.selectors || [],
    mediaText: data.mediaText || '',
    state: data.state || '',
    atRuleType: data.atRuleType || '',
  })
}

const getFullRuleSignature = (ruleLike: any): string => {
  const data = ruleLike?.get ? serializeRule(ruleLike) : ruleLike
  return JSON.stringify({
    selectors: data.selectors || [],
    style: normalizeRuleStyle(data.style || {}),
    mediaText: data.mediaText || '',
    state: data.state || '',
    atRuleType: data.atRuleType || '',
  })
}

const hasCssRulesByGroup = (cssComposer: any, groupName: string): boolean => {
  if (!cssComposer?.getRules || !groupName) return false

  return (cssComposer.getRules() as any[]).some((rule: any) => {
    const group = `${rule?.get?.('group') ?? ''}`.trim()
    return group === groupName
  })
}

const findMatchingRule = (cssc: any, ruleData: any): any => {
  const expected = getRuleSignature(ruleData)
  let matched: any = null
  cssc?.getAll?.()?.each?.((rule: any) => {
    if (!matched && getRuleSignature(rule) === expected) {
      matched = rule
    }
  })
  return matched
}

const upsertRule = (cssc: any, ruleData: any) => {
  if (!cssc) return
  const existingRule = findMatchingRule(cssc, ruleData)
  if (existingRule?.set) {
    existingRule.set('style', {
      ...(existingRule.get?.('style') ?? {}),
      ...(ruleData.style ?? {}),
    })
    return
  }
  cssc.addCollection?.([ruleData], { avoidUpdateStyle: false })
}

const collectComponentIds = (component: any, bucket = new Set<string>()): Set<string> => {
  const componentId = component?.getId?.()
  if (componentId) {
    bucket.add(componentId)
  }

  const children = component?.components?.()?.models
    ?? component?.get?.('components')?.models
    ?? []

  children.forEach((child: any) => collectComponentIds(child, bucket))
  return bucket
}

const walkComponents = (component: any, visitor: (component: any) => void) => {
  if (!component) return
  visitor(component)

  const children = component?.components?.()?.models
    ?? component?.get?.('components')?.models
    ?? []

  children.forEach((child: any) => walkComponents(child, visitor))
}

const collectComponentTypes = (component: any): Set<string> => {
  const types = new Set<string>()

  walkComponents(component, (item: any) => {
    const type = `${item?.get?.('type') ?? ''}`.trim()
    if (type) {
      types.add(type)
    }
  })

  return types
}

export const getUsedComponentCssRules = (editor: any, component?: any): any[] | undefined => {
  const cssc = getCssComposer(editor)
  if (!cssc?.getRules) return undefined

  const root = component ?? editor?.Pages?.getSelected?.()?.getMainComponent?.() ?? editor?.getWrapper?.()
  const activeTypes = collectComponentTypes(root)

  return (cssc.getRules() as any[]).filter((rule: any) => {
    const group = `${rule?.get?.('group') ?? ''}`.trim()
    if (!group.startsWith(COMPONENT_STYLE_GROUP_PREFIX)) return true

    const type = group.slice(COMPONENT_STYLE_GROUP_PREFIX.length).trim()
    return !!type && activeTypes.has(type)
  })
}

const normalizeCssValue = (value: unknown): string =>
  `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')

const isZeroCssValue = (value: unknown): boolean => {
  const normalized = normalizeCssValue(value)
  return ZERO_CSS_VALUES.has(normalized)
}

const isProtectedUniversalRule = (rule: any): boolean => {
  const selector = `${rule?.selectorsToString?.() ?? ''}`.trim()
  const style = rule?.get?.('style') ?? {}
  const keys = Object.keys(style)
  if (selector !== '*' || keys.length !== 1) return false
  return keys[0] === 'box-sizing' && normalizeCssValue(style['box-sizing']) === 'border-box'
}

const isProtectedBodyMarginRule = (rule: any): boolean => {
  const selector = `${rule?.selectorsToString?.() ?? ''}`.trim()
  const style = rule?.get?.('style') ?? {}
  const keys = Object.keys(style)
  if (selector !== 'body' || !keys.length) return false
  if (!keys.every(key => BODY_MARGIN_KEYS.has(key))) return false
  return keys.every(key => isZeroCssValue(style[key]))
}

const isRedundantProtectedCssRule = (rule: any): boolean => {
  const mediaText = `${rule?.get?.('mediaText') ?? ''}`.trim()
  const state = `${rule?.get?.('state') ?? ''}`.trim()
  const atRuleType = `${rule?.get?.('atRuleType') ?? ''}`.trim()
  if (mediaText || state || atRuleType) return false
  return isProtectedUniversalRule(rule) || isProtectedBodyMarginRule(rule)
}

const copyCssRulesForComponent = (editor: any, source: any, target: any): void => {
  try {
    const cssc = getCssComposer(editor)
    const sourceId = source?.getId?.()
    const targetId = target?.getId?.()
    if (!cssc || !sourceId || !targetId || sourceId === targetId) return

    cssc.getAll?.()?.each?.((rule: any) => {
      const selectors = rule?.get?.('selectors')
      if (!selectors?.length) return

      const hasSourceId = selectors.some((selector: any) => {
        const name = selector?.get?.('name') ?? selector?.name ?? ''
        const type = selector?.get?.('type') ?? selector?.type
        return type === 2 && name === sourceId
      })
      if (!hasSourceId) return

      upsertRule(cssc, {
        selectors: selectors.map((selector: any) => {
          const name = selector?.get?.('name') ?? selector?.name ?? ''
          const type = selector?.get?.('type') ?? selector?.type
          if (type === 2 && name === sourceId) {
            return { name: targetId, type: 2, active: true }
          }
          return serializeSelector(selector)
        }),
        style: { ...(rule?.get?.('style') ?? {}) },
        mediaText: rule?.get?.('mediaText') ?? '',
        state: rule?.get?.('state') ?? '',
        atRuleType: rule?.get?.('atRuleType') ?? '',
      })
    })
  } catch {
    // 忽略：不影响页面清空，仅少了 Symbol 样式兜底
  }
}

const copyCssRulesRecursive = (editor: any, source: any, target: any): void => {
  copyCssRulesForComponent(editor, source, target)

  const sourceChildren: any[] = source?.components?.()?.models ?? []
  const targetChildren: any[] = target?.components?.()?.models ?? []
  const len = Math.min(sourceChildren.length, targetChildren.length)

  for (let i = 0; i < len; i++) {
    copyCssRulesRecursive(editor, sourceChildren[i], targetChildren[i])
  }
}

export const installComponentCloneCssPatch = (editor: any): void => {
  if (!editor) return

  const componentsApi = getComponentsApi(editor)
  const types = componentsApi?.getTypes?.() ?? []
  if (!types.length) return

  types.forEach((typeDef: any) => {
    const modelProto = typeDef?.model?.prototype
    if (!modelProto || modelProto[WB_CLONE_CSS_PATCHED_KEY]) return

    const originalClone = modelProto.clone
    if (typeof originalClone !== 'function') return

    modelProto.clone = function (...args: any[]) {
      const depth = Number(editor?.[WB_CLONE_CSS_COPY_DEPTH_KEY] ?? 0)
      editor[WB_CLONE_CSS_COPY_DEPTH_KEY] = depth + 1

      try {
        const cloned = originalClone.apply(this, args)

        if (depth === 0) {
          cloned[WB_CLONE_CSS_SOURCE_KEY] = this
        }

        return cloned
      } finally {
        const nextDepth = Number(editor?.[WB_CLONE_CSS_COPY_DEPTH_KEY] ?? 1) - 1
        if (nextDepth > 0) {
          editor[WB_CLONE_CSS_COPY_DEPTH_KEY] = nextDepth
        } else {
          delete editor[WB_CLONE_CSS_COPY_DEPTH_KEY]
        }
      }
    }

    modelProto[WB_CLONE_CSS_PATCHED_KEY] = true
  })
}

export const applyPendingCloneCssRules = (editor: any, component: any): boolean => {
  const source = component?.[WB_CLONE_CSS_SOURCE_KEY]
  if (!editor || !component || !source) return false

  try {
    copyCssRulesRecursive(editor, source, component)
    return true
  } finally {
    delete component[WB_CLONE_CSS_SOURCE_KEY]
  }
}

const snapshotMainSymbolCssRules = (editor: any): void => {
  try {
    const cssc = getCssComposer(editor)
    const componentsApi = getComponentsApi(editor)
    const symbols = componentsApi?.getSymbols?.() || []
    if (!cssc || !symbols.length) return

    const cache: Record<string, any[]> = {}

    symbols.forEach((mainSymbol: any) => {
      const symbolInfo = componentsApi?.getSymbolInfo?.(mainSymbol)
      const sourceForSnapshot = symbolInfo?.instances?.[0] || mainSymbol

      // 先把当前实例树上的最新 ID 规则同步回 Main Symbol，避免清空后样式丢失。
      if (sourceForSnapshot && sourceForSnapshot !== mainSymbol) {
        copyCssRulesRecursive(editor, sourceForSnapshot, mainSymbol)
      }

      const ids = collectComponentIds(mainSymbol)
      if (!ids.size) return

      const rules: any[] = []
      cssc.getAll?.()?.each?.((rule: any) => {
        const selectors = rule?.get?.('selectors')
        if (!selectors?.length) return

        const belongsToMainSymbol = selectors.some((selector: any) => {
          const name = selector?.get?.('name') ?? selector?.name ?? ''
          const type = selector?.get?.('type') ?? selector?.type
          return type === 2 && ids.has(name)
        })
        if (belongsToMainSymbol) {
          rules.push(serializeRule(rule))
        }
      })

      if (rules.length) {
        cache[mainSymbol.getId?.() || `symbol-${Object.keys(cache).length}`] = rules
      }
    })

    if (Object.keys(cache).length) {
      editor[WB_SYMBOL_CSS_CACHE_KEY] = cache
    }
  } catch {
    // 忽略：缓存失败不应阻断清空或保存
  }
}

const restoreMainSymbolCssRules = (editor: any): void => {
  try {
    const cssc = getCssComposer(editor)
    const componentsApi = getComponentsApi(editor)
    const cache = editor?.[WB_SYMBOL_CSS_CACHE_KEY] as Record<string, any[]> | undefined
    if (!cssc || !cache) return
    const activeSymbolIds = new Set(
      (componentsApi?.getSymbols?.() || [])
        .map((symbol: any) => symbol?.getId?.())
        .filter(Boolean),
    )

    Object.entries(cache).forEach(([symbolId, rules]) => {
      if (activeSymbolIds.size && symbolId && !activeSymbolIds.has(symbolId)) return
      rules.forEach((ruleData) => upsertRule(cssc, ruleData))
    })
  } catch {
    // 忽略：兜底恢复失败不应影响主流程
  }
}

/**
 * 确保组件类型自带的 defaults.styles 始终存在于 CssComposer。
 * GrapesJS 会在最后一个同类型实例删除后回收 `cmp:type` 分组规则，
 * 这里在组件重新添加时显式补回，避免 Navbar/Footer 等基础样式丢失。
 */
export const ensureComponentStyles = (editor: any, component: any): void => {
  try {
    const cssc = getCssComposer(editor)
    const type = component?.get?.('type')
    const styles = getComponentTypeStyles(editor, component)
    if (!cssc || !styles || !type) return

    const groupName = `cmp:${type}`
    if (hasCssRulesByGroup(cssc, groupName)) return

    // 只在缺失时补回，避免打乱已有规则顺序或误删仍然有效的样式组。
    cssc.addCollection?.(styles, { avoidUpdateStyle: true }, { group: groupName })
  } catch {
    // 忽略：样式补回失败不应阻断组件添加
  }
}

export const cleanupLegacyInjectedComponentStyles = (editor: any): void => {
  if (!editor || editor[WB_LEGACY_GLOBAL_STYLES_CLEANED_KEY]) return
  editor[WB_LEGACY_GLOBAL_STYLES_CLEANED_KEY] = true

  try {
    removeUngroupedCssRulesByPrefixes(getCssComposer(editor), LEGACY_GLOBAL_STYLE_PREFIXES)
  } catch {
    // 忽略：迁移清理失败不应阻断编辑器加载
  }
}

export const cleanupRedundantProtectedCssRules = (editor: any): void => {
  const cssc = getCssComposer(editor)
  if (!cssc?.getRules || !cssc?.remove) return

  try {
    const toRemove = (cssc.getRules() as any[]).filter(isRedundantProtectedCssRule)
    if (toRemove.length) {
      cssc.remove(toRemove)
    }
  } catch {
    // 忽略：清理内置 protectedCss 的冗余持久化规则失败，不应阻断编辑器流程
  }
}

export const cleanupDuplicateCssRules = (editor: any): void => {
  if (!editor || editor[WB_DUPLICATE_CSS_RULES_CLEANED_KEY]) return

  const cssc = getCssComposer(editor)
  if (!cssc?.getRules || !cssc?.remove) return

  editor[WB_DUPLICATE_CSS_RULES_CLEANED_KEY] = true

  try {
    const rules = cssc.getRules() as any[]
    const seen = new Set<string>()
    const toRemove: any[] = []

    rules.forEach((rule: any) => {
      const signature = getFullRuleSignature(rule)
      if (seen.has(signature)) {
        toRemove.push(rule)
        return
      }
      seen.add(signature)
    })

    if (toRemove.length) {
      cssc.remove(toRemove)
    }
  } catch {
    // 忽略：去重失败不应阻断编辑器主流程
  }
}

const isEditorUsable = (editor: any): boolean => {
  if (!editor || typeof editor !== 'object') return false
  if (editor.destroyed === true) return false

  if (typeof editor.isDestroyed === 'function') {
    try {
      if (editor.isDestroyed()) {
        return false
      }
    } catch {
      return false
    }
  }

  return true
}

export const syncMountedComponentStyles = (editor: any): void => {
  if (!isEditorUsable(editor)) return

  try {
    const seenTypes = new Set<string>()
    const pages = editor.Pages?.getAll?.() ?? []

    const syncTree = (root: any) => {
      walkComponents(root, (component: any) => {
        const type = `${component?.get?.('type') ?? ''}`.trim()
        const styles = getComponentTypeStyles(editor, component)
        if (!type || !styles || seenTypes.has(type)) return
        seenTypes.add(type)
        ensureComponentStyles(editor, component)
      })
    }

    if (pages.length) {
      pages.forEach((page: any) => syncTree(page?.getMainComponent?.()))
      return
    }

    const wrapper = typeof editor.getWrapper === 'function' ? editor.getWrapper() : null
    if (!wrapper) return
    syncTree(wrapper)
  } catch {
    // 编辑器销毁阶段 GrapesJS 可能已清空内部对象，这里的样式同步不应再抛错
  }
}

/**
 * 在单个组件删除前缓存当前 Main Symbol 的 ID 级样式规则。
 * 用于普通删除流程，和 clearCanvas/save 的保活逻辑保持一致。
 */
export const snapshotSymbolStyles = (editor: any): void => {
  snapshotMainSymbolCssRules(editor)
}

/**
 * 恢复最近一次缓存的 Main Symbol 样式规则。
 */
export const restoreSymbolStyles = (editor: any): void => {
  restoreMainSymbolCssRules(editor)
}

/**
 * 从编辑器获取 schema JSON
 * 如果获取到空或无效数据，抛出异常阻止保存/发布，避免覆盖服务端有效数据。
 */
export const getEditorSchemaJson = (editor: any): string => {
  if (!editor) {
    throw new Error('[getEditorSchemaJson] 编辑器实例不存在，无法获取数据')
  }

  if (typeof editor.getProjectData !== 'function') {
    throw new Error('[getEditorSchemaJson] 编辑器尚未完全初始化（缺少 getProjectData 方法）')
  }

  try {
    // 清空画布会触发 GrapesJS 回收孤立的 ID 级样式规则，这里在序列化前补回 Main Symbol 的缓存样式，
    // 避免保存后全局组件（如 Navbar）丢失样式。
    restoreMainSymbolCssRules(editor)
    cleanupRedundantProtectedCssRules(editor)
    const projectData = editor.getProjectData()

    // 严格校验：projectData 必须是非空对象
    if (!projectData || typeof projectData !== 'object') {
      throw new Error('[getEditorSchemaJson] getProjectData 返回了空值或非对象类型')
    }

    const json = JSON.stringify(projectData)

    // 安全检查：空对象、仅含空数组的对象都视为无效数据
    if (!json || json === '{}' || json.length < 10) {
      throw new Error(
        `[getEditorSchemaJson] 获取到空的 schema（长度=${json?.length}），` +
        '可能编辑器未完全就绪或 getProjectData 失败，拒绝保存以保护现有数据'
      )
    }

    // 额外校验：至少包含 pages 或 styles 或 components 等核心字段之一
    const hasContent = projectData.pages || projectData.styles || projectData.components || projectData.assets
    if (!hasContent) {
      console.warn('[getEditorSchemaJson] schema 缺少核心字段（pages/styles/components），数据可能不完整')
    }

    return json
  } catch (error) {
    console.error('[getEditorSchemaJson] 获取 schema 失败:', error)
    throw error
  }
}

/**
 * 清空画布
 */
export const clearCanvas = (editor: any) => {
  if (!editor) {
    throw new Error('编辑器未就绪')
  }

  // 清空前缓存 Main Symbol 的 CSS 规则，避免 GrapesJS 在移除实例时一并回收全局组件样式。
  snapshotMainSymbolCssRules(editor)

  // 先取消选中当前组件
  editor.select(null)

  // 获取当前页面或主容器
  const page = editor.Pages?.getSelected?.()
  const wrapper = editor.getWrapper?.()
  const target = page?.getMainComponent?.() || wrapper

  if (target) {
    // 清空所有组件
    if (target.components) {
      target.components().reset()
    } else if (target.get) {
      const components = target.get('components')
      if (components && components.reset) {
        components.reset()
      }
    }
  } else {
    // 如果没有找到目标，使用 setComponents 清空
    editor.setComponents?.('')
  }

  // 清空后立即补回缓存的 Main Symbol 样式，保证后续继续保存/添加实例时样式仍然可用。
  restoreMainSymbolCssRules(editor)
}
