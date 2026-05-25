import { computed, ref, shallowRef, type ComputedRef, type Ref } from 'vue'
import { GRAPESJS_BUILTIN_SECTORS } from '../config/wbStyleSectors'
import { syncLayoutStyleOverride, syncLayoutStyleOverrides } from './useLayoutStyleAdapter'

/**
 * WebBuilder 核心样式管理 composable
 *
 * 读写路径：
 *   - 统一基于当前激活 selector 读写 CSS Rule
 */

export type WbStyleMode = 'component' | 'selector'
export type WbSelectorTargetType = 'id' | 'class'

export interface WbStyleManager {
  hasSelection: ComputedRef<boolean>
  selectedComponent: Ref<any>
  currentStyles: Ref<Record<string, string>>
  styleMode: Ref<WbStyleMode>
  setStyleMode(mode: WbStyleMode): void
  currentSelector: ComputedRef<string>
  availableClasses: ComputedRef<string[]>
  selectedClasses: Ref<string[]>
  selectedTargetType: ComputedRef<WbSelectorTargetType>
  canSelectClasses: ComputedRef<boolean>
  selectIdTarget(): void
  toggleClassTarget(className: string): void
  cssText: ComputedRef<string>
  setCssFromText(text: string): void
  getValue(property: string): string
  setValue(property: string, value: string): void
  setValues(styles: Record<string, string>): void
  clearValue(property: string): void
}

export default function useWbStyleManager(grapes: any): WbStyleManager {
  if (grapes._cache.wbStyleManager) {
    return grapes._cache.wbStyleManager
  }

  if (grapes.initialized) {
    throw new Error(
      'useWbStyleManager must be called before GrapesJS is initialized (before onMount)'
    )
  }

  if (!grapes.config.styleManager) grapes.config.styleManager = {}
  grapes.config.styleManager.custom = true

  const selectedComponent = shallowRef<any>(null)
  const currentStyles = ref<Record<string, string>>({})
  const styleMode = ref<WbStyleMode>('selector')
  const currentState = ref('')
  const componentClasses = ref<string[]>([])
  const selectedClasses = ref<string[]>([])

  const hasSelection = computed(() => selectedComponent.value !== null)
  const availableClasses = computed(() => componentClasses.value)
  const canSelectClasses = computed(() => availableClasses.value.length > 0)
  const selectedTargetType = computed<WbSelectorTargetType>(() => {
    return selectedClasses.value.length > 0 ? 'class' : 'id'
  })

  let _editor: any = null

  const normalizeMediaQuery = (value: string): string => {
    const raw = `${value ?? ''}`.trim()
    if (!raw) return ''
    if (raw.startsWith('(') || raw.startsWith('not ') || raw.startsWith('only ')) return raw
    if (raw.includes(':')) return raw
    return `(max-width: ${raw})`
  }

  const getCurrentDeviceRuleOptions = (): { atRuleType: 'media'; atRuleParams: string } | undefined => {
    if (!_editor) return undefined

    const selectedDevice = _editor.Devices?.getSelected?.()
    if (!selectedDevice || typeof selectedDevice.get !== 'function') return undefined

    const deviceId = `${selectedDevice.get('id') ?? ''}`.trim().toLowerCase()
    if (!deviceId || deviceId === 'desktop') return undefined

    const widthMedia =
      selectedDevice.getWidthMedia?.()
      ?? selectedDevice.get?.('widthMedia')
      ?? selectedDevice.get?.('width')
      ?? ''

    const atRuleParams = normalizeMediaQuery(widthMedia)
    if (!atRuleParams) return undefined

    return {
      atRuleType: 'media',
      atRuleParams,
    }
  }

  const extractDeclarationText = (text: string): string => {
    const source = `${text ?? ''}`.trim()
    if (!source) return ''

    const blocks = Array.from(source.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    if (blocks.length > 0) {
      return `${blocks[blocks.length - 1]?.[2] ?? ''}`.trim()
    }

    return source
  }

  const getCurrentState = (): string => {
    return currentState.value
  }

  const getStateSuffix = (): string => {
    const state = getCurrentState()
    return state ? `:${state}` : ''
  }

  const findRulesBySelectorFallback = (
    selector: string,
    ruleOptions?: { atRuleType: 'media'; atRuleParams: string }
  ) => {
    if (!_editor?.Css?.getAll || !selector) return [] as any[]

    const matched: any[] = []
    _editor.Css.getAll()?.each?.((rule: any) => {
      const mediaText = `${rule?.get?.('mediaText') ?? ''}`.trim()
      const state = `${rule?.get?.('state') ?? ''}`.trim()
      const atRuleType = `${rule?.get?.('atRuleType') ?? ''}`.trim()
      const selectorsText = `${rule?.selectorsToString?.() ?? ''}`.trim()
      const fullSelector = `${selectorsText}${state ? `:${state}` : ''}`

      if (fullSelector !== selector) return
      if ((ruleOptions?.atRuleParams ?? '') !== mediaText) return
      if ((ruleOptions?.atRuleType ?? '') !== atRuleType) return

      matched.push(rule)
    })

    return matched
  }

  const dedupeRules = (rules: any[]): any[] => {
    const seen = new Set<any>()
    const result: any[] = []

    rules.forEach((rule) => {
      if (!rule || seen.has(rule)) return
      seen.add(rule)
      result.push(rule)
    })

    return result
  }

  const mergeRuleStyles = (rules: any[]): Record<string, string> => {
    return rules.reduce((acc, rule) => {
      return {
        ...acc,
        ...(rule?.getStyle?.() ?? {}),
      }
    }, {} as Record<string, string>)
  }

  const getComponentClasses = (comp: any): string[] => {
    const attrClass: unknown = comp?.getAttributes?.()?.class ?? comp?.attributes?.class ?? ''
    if (typeof attrClass === 'string' && attrClass.trim()) {
      return Array.from(new Set(
        attrClass
          .split(/\s+/)
          .map((name) => name.trim())
          .filter(Boolean)
      ))
    }

    const classes = comp?.getClasses?.()
    if (Array.isArray(classes)) return classes.filter(Boolean)

    return (comp?.classes ?? [])
      .map((item: any) => item?.get?.('name') ?? item?.name ?? '')
      .filter(Boolean)
  }

  const buildTargetSelector = (comp: any): string => {
    if (!comp) return ''

    const stateSuffix = getStateSuffix()
    const id = comp.getAttributes?.()?.id ?? comp.getId?.()
    if (selectedClasses.value.length === 0) {
      if (id) return `#${id}${stateSuffix}`
      const tagName = comp.get?.('tagName') || comp.tagName || 'element'
      return `${tagName}${stateSuffix}`
    }

    return `${selectedClasses.value.map((name) => `.${name}`).join('')}${stateSuffix}`
  }

  const getStyleTargetsForSelector = (
    selector: string,
    ruleOptions?: { atRuleType: 'media'; atRuleParams: string }
  ): any[] => {
    if (!_editor || !selector) return []

    const directRule = _editor.Css?.getRule?.(selector, ruleOptions)
    const fallbackRules = findRulesBySelectorFallback(selector, ruleOptions)
    return dedupeRules([
      ...fallbackRules,
      directRule,
    ])
  }

  const getStyleTargets = (): any[] => {
    if (!_editor) return []
    const comp = selectedComponent.value
    if (!comp) return []
    const ruleOptions = getCurrentDeviceRuleOptions()
    const selector = buildTargetSelector(comp)
    return getStyleTargetsForSelector(selector, ruleOptions)
  }

  const shouldUseSymbolComponentStyle = (
    comp: any,
    ruleOptions?: { atRuleType: 'media'; atRuleParams: string }
  ): boolean => {
    if (!comp || ruleOptions || selectedClasses.value.length > 0 || getCurrentState()) return false
    return !!_editor?.Components?.getSymbolInfo?.(comp)?.isSymbol
  }

  const normalizeStyleTargets = (
    selector: string,
    ruleOptions?: { atRuleType: 'media'; atRuleParams: string }
  ) => {
    const targets = getStyleTargetsForSelector(selector, ruleOptions)
    const primary = targets[targets.length - 1] ?? null
    if (!primary) return null

    if (targets.length <= 1) {
      return primary
    }

    const mergedStyle = mergeRuleStyles(targets)
    primary.setStyle?.(mergedStyle)

    const redundantTargets = targets.slice(0, -1)
    if (redundantTargets.length > 0) {
      if (typeof _editor?.Css?.remove === 'function') {
        _editor.Css.remove(redundantTargets)
      } else {
        redundantTargets.forEach((rule) => rule?.setStyle?.({}))
      }
    }

    return primary
  }

  const syncStyles = () => {
    const targets = getStyleTargets()
    if (!targets.length) {
      const comp = selectedComponent.value
      const ruleOptions = getCurrentDeviceRuleOptions()
      currentStyles.value = shouldUseSymbolComponentStyle(comp, ruleOptions)
        ? { ...(comp?.getStyle?.() ?? {}) }
        : {}
      return
    }
    currentStyles.value = mergeRuleStyles(targets)
  }

  const setStyleMode = (_mode: WbStyleMode) => {
    styleMode.value = 'selector'
    syncStyles()
  }

  const syncSelectorTarget = (comp: any) => {
    const nextClasses = getComponentClasses(comp)
    componentClasses.value = nextClasses
    const validSelected = selectedClasses.value.filter(name => nextClasses.includes(name))
    selectedClasses.value = validSelected

    if (nextClasses.length === 0 || validSelected.length === 0) {
      selectedClasses.value = []
    }
  }

  const selectIdTarget = () => {
    selectedClasses.value = []
    syncStyles()
  }

  const toggleClassTarget = (className: string) => {
    const normalized = `${className ?? ''}`.trim()
    if (!normalized) return
    if (!availableClasses.value.includes(normalized)) return

    const current = new Set(selectedClasses.value)
    if (current.has(normalized)) {
      current.delete(normalized)
    } else {
      current.add(normalized)
    }

    selectedClasses.value = availableClasses.value.filter(name => current.has(name))
    syncStyles()
  }

  const currentSelector = computed(() => {
    const comp = selectedComponent.value
    if (!comp || !_editor) return ''

    return buildTargetSelector(comp)
  })

  const cssText = computed(() => {
    const styles = currentStyles.value
    const entries = Object.entries(styles)
    const sel = currentSelector.value || 'element'
    const ruleOptions = getCurrentDeviceRuleOptions()
    const wrapCss = (body: string) =>
      ruleOptions
        ? `@${ruleOptions.atRuleType} ${ruleOptions.atRuleParams} {\n  ${body.replace(/\n/g, '\n  ')}\n}`
        : body

    if (entries.length === 0) return wrapCss(`${sel} {\n\n}`)
    const props = entries.map(([k, v]) => `  ${k}: ${v};`).join('\n')
    return wrapCss(`${sel} {\n${props}\n}`)
  })

  const setCssFromText = (text: string) => {
    const comp = selectedComponent.value
    if (!comp || !_editor) return

    const propsText = extractDeclarationText(text)

    const newStyles: Record<string, string> = {}
    propsText.split(';').forEach(line => {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) return
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim()
      if (key && val) newStyles[key] = val
    })

    const selector = buildTargetSelector(comp)
    if (!selector) return

    const ruleOptions = getCurrentDeviceRuleOptions()
    if (shouldUseSymbolComponentStyle(comp, ruleOptions)) {
      comp.setStyle?.(newStyles)
      syncStyles()
      return
    }

    const rule = normalizeStyleTargets(selector, ruleOptions)
    if (rule) {
      rule.setStyle?.(newStyles)
    } else {
      _editor.Css?.setRule?.(selector, newStyles, ruleOptions)
    }
    syncStyles()
  }

  const getValue = (property: string): string => {
    return currentStyles.value[property] ?? ''
  }

  const setValue = (property: string, value: string): void => {
    if (!_editor) return

    const comp = selectedComponent.value
    if (!comp) return

    const selector = buildTargetSelector(comp)
    if (!selector) return

    const ruleOptions = getCurrentDeviceRuleOptions()
    if (shouldUseSymbolComponentStyle(comp, ruleOptions)) {
      const nextStyles = { ...(comp.getStyle?.() ?? {}) }
      if (value === '' || value == null) {
        delete nextStyles[property]
      } else {
        nextStyles[property] = value
      }
      comp.setStyle?.(nextStyles)

      syncLayoutStyleOverride(comp, property, value)

      syncStyles()
      return
    }

    const rule = normalizeStyleTargets(selector, ruleOptions)
    const nextStyles = rule ? mergeRuleStyles([rule]) : {}
    if (value === '' || value == null) {
      if (!rule) return
      delete nextStyles[property]
      rule.setStyle?.(nextStyles)
    } else {
      if (rule) {
        nextStyles[property] = value
        rule.setStyle?.(nextStyles)
      } else {
        _editor.Css?.setRule?.(selector, { [property]: value }, ruleOptions)
      }
    }

    syncLayoutStyleOverride(comp, property, value)

    syncStyles()
  }

  const setValues = (styles: Record<string, string>): void => {
    if (!_editor) return
    const comp = selectedComponent.value
    if (!comp) return

    const selector = buildTargetSelector(comp)
    if (!selector) return

    const ruleOptions = getCurrentDeviceRuleOptions()
    if (shouldUseSymbolComponentStyle(comp, ruleOptions)) {
      const nextStyles = { ...(comp.getStyle?.() ?? {}) } as Record<string, string>

      for (const [prop, val] of Object.entries(styles)) {
        if (val === '' || val == null) {
          delete nextStyles[prop]
        } else {
          nextStyles[prop] = val
        }
      }

      comp.setStyle?.(nextStyles)

      syncLayoutStyleOverrides(comp, styles)

      syncStyles()
      return
    }

    const currentRule = normalizeStyleTargets(selector, ruleOptions)
    const nextStyles = mergeRuleStyles(currentRule ? [currentRule] : []) as Record<string, string>

    for (const [prop, val] of Object.entries(styles)) {
      if (val === '' || val == null) {
        delete nextStyles[prop]
      } else {
        nextStyles[prop] = val
      }
    }

    if (currentRule) {
      currentRule.setStyle?.(nextStyles)
    } else if (Object.keys(nextStyles).length > 0) {
      _editor.Css?.setRule?.(selector, nextStyles, ruleOptions)
    }

    syncLayoutStyleOverrides(comp, styles)

    syncStyles()
  }

  const clearValue = (property: string): void => {
    setValue(property, '')
  }

  const manager: WbStyleManager = (grapes._cache.wbStyleManager = {
    hasSelection,
    selectedComponent,
    currentStyles,
    styleMode,
    setStyleMode,
    currentSelector,
    availableClasses,
    selectedClasses,
    selectedTargetType,
    canSelectClasses,
    selectIdTarget,
    toggleClassTarget,
    cssText,
    setCssFromText,
    getValue,
    setValue,
    setValues,
    clearValue,
  })

  grapes.onInit((editor: any) => {
    _editor = editor

    editor.on('load', () => {
      currentState.value = editor.Selectors?.getState?.() ?? ''
      GRAPESJS_BUILTIN_SECTORS.forEach(id => {
        try {
          if (editor.StyleManager.getSector?.(id)) {
            editor.StyleManager.removeSector?.(id)
          }
        } catch {
          // 静默忽略
        }
      })
    })

    const syncSelectedComponent = (comp: any) => {
      const normalizedComp = comp ?? null
      const selectionChanged = selectedComponent.value !== normalizedComp
      selectedComponent.value = normalizedComp
      if (selectionChanged) {
        selectedClasses.value = []
      }
      syncSelectorTarget(comp)
      syncStyles()
    }

    editor.on('style:custom', () => {
      syncSelectedComponent(editor.getSelected?.() ?? null)
    })

    editor.on('component:selected', (comp: any) => {
      syncSelectedComponent(comp)
    })

    editor.on('component:deselected', () => {
      selectedComponent.value = null
      componentClasses.value = []
      selectedClasses.value = []
      currentStyles.value = {}
    })

    editor.on('component:update:classes', (_comp: any) => {
      if (selectedComponent.value) {
        syncSelectorTarget(selectedComponent.value)
        syncStyles()
      }
    })

    editor.on('component:update:attributes', (_comp: any) => {
      if (selectedComponent.value) {
        syncSelectorTarget(selectedComponent.value)
        syncStyles()
      }
    })

    editor.on('selector:state', () => {
      currentState.value = editor.Selectors?.getState?.() ?? ''
      syncStyles()
    })

    editor.on('selector:custom', () => {
      syncStyles()
    })

    editor.on('device:select', () => {
      syncStyles()
    })

    editor.on('component:styleUpdate', () => {
      syncStyles()
    })
  })

  return manager
}
