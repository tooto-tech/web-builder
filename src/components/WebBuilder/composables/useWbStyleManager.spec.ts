import { describe, expect, it } from 'vitest'
import useWbStyleManager from './useWbStyleManager'

const createRule = (
  selector: string,
  style: Record<string, string>,
  options?: { state?: string; mediaText?: string; atRuleType?: string }
) => {
  let currentStyle = { ...style }

  return {
    selector,
    get(key: string) {
      const record: Record<string, any> = {
        style: currentStyle,
        state: options?.state ?? '',
        mediaText: options?.mediaText ?? '',
        atRuleType: options?.atRuleType ?? '',
      }
      return record[key]
    },
    getStyle() {
      return { ...currentStyle }
    },
    setStyle(next: Record<string, string>) {
      currentStyle = { ...next }
    },
    selectorsToString() {
      return selector
    },
  }
}

const createComponent = (id: string, className = '') => ({
  getAttributes() {
    return {
      id,
      class: className,
    }
  },
  getId() {
    return id
  },
  getClasses() {
    return className
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
  },
})

const createEditor = (initialRules: any[]) => {
  const listeners = new Map<string, Array<(...args: any[]) => void>>()
  const rules = [...initialRules]
  let selected: any = null

  const matchesRule = (
    rule: any,
    selector: string,
    options?: { atRuleType: 'media'; atRuleParams: string }
  ) => {
    return (
      rule.selector === selector
      && `${rule.get('state') ?? ''}`.trim() === ''
      && `${rule.get('mediaText') ?? ''}`.trim() === `${options?.atRuleParams ?? ''}`.trim()
      && `${rule.get('atRuleType') ?? ''}`.trim() === `${options?.atRuleType ?? ''}`.trim()
    )
  }

  return {
    Css: {
      getRule(selector: string, options?: { atRuleType: 'media'; atRuleParams: string }) {
        return rules.find((rule) => matchesRule(rule, selector, options))
      },
      getAll() {
        return {
          each(cb: (rule: any) => void) {
            rules.forEach(cb)
          },
        }
      },
      setRule(
        selector: string,
        style: Record<string, string>,
        options?: { atRuleType: 'media'; atRuleParams: string }
      ) {
        const rule = createRule(selector, style, {
          state: '',
          mediaText: options?.atRuleParams ?? '',
          atRuleType: options?.atRuleType ?? '',
        })
        rules.push(rule)
        return rule
      },
      remove(ruleList: any[]) {
        ruleList.forEach((rule) => {
          const index = rules.indexOf(rule)
          if (index >= 0) {
            rules.splice(index, 1)
          }
        })
      },
    },
    Devices: {
      getSelected() {
        return null
      },
    },
    Selectors: {
      getState() {
        return ''
      },
    },
    StyleManager: {
      getSector() {
        return null
      },
      removeSector() {
        return undefined
      },
    },
    on(event: string, cb: (...args: any[]) => void) {
      const next = listeners.get(event) ?? []
      next.push(cb)
      listeners.set(event, next)
    },
    trigger(event: string, ...args: any[]) {
      ;(listeners.get(event) ?? []).forEach((cb) => cb(...args))
    },
    getSelected() {
      return selected
    },
    setSelected(component: any) {
      selected = component
    },
    __rules: rules,
  }
}

const createGrapes = () => {
  const initCallbacks: Array<(editor: any) => void> = []

  return {
    _cache: {},
    initialized: false,
    config: {},
    onInit(cb: (editor: any) => void) {
      initCallbacks.push(cb)
    },
    init(editor: any) {
      initCallbacks.forEach((cb) => cb(editor))
    },
  }
}

describe('useWbStyleManager', () => {
  it('merges duplicate selector rules and writes back to the effective rule', () => {
    const grapes = createGrapes()
    const sm = useWbStyleManager(grapes as any)
    const editor = createEditor([
      createRule('#clone-1', {}),
      createRule('#clone-1', {
        'border-style': 'solid',
        'border-right-width': '1px',
        'border-color': '#111111',
      }),
    ])

    grapes.init(editor)

    const component = createComponent('clone-1')
    editor.setSelected(component)
    editor.trigger('component:selected', component)

    expect(sm.getValue('border-style')).toBe('solid')
    expect(sm.getValue('border-right-width')).toBe('1px')

    sm.setValue('border-right-width', '0px')

    expect(editor.__rules).toHaveLength(1)
    expect(editor.__rules[0].getStyle()).toEqual({
      'border-style': 'solid',
      'border-right-width': '0px',
      'border-color': '#111111',
    })
    expect(sm.getValue('border-right-width')).toBe('0px')
  })

  it('resets class selector targeting when switching to another component', () => {
    const grapes = createGrapes()
    const sm = useWbStyleManager(grapes as any)
    const editor = createEditor([])

    grapes.init(editor)

    const first = createComponent('source-1', 'shared')
    editor.setSelected(first)
    editor.trigger('component:selected', first)
    sm.toggleClassTarget('shared')

    expect(sm.selectedTargetType.value).toBe('class')
    expect(sm.currentSelector.value).toBe('.shared')

    const clone = createComponent('clone-2', 'shared')
    editor.setSelected(clone)
    editor.trigger('component:selected', clone)

    expect(sm.selectedTargetType.value).toBe('id')
    expect(sm.selectedClasses.value).toEqual([])
    expect(sm.currentSelector.value).toBe('#clone-2')
  })
})
