import { describe, expect, it } from 'vitest'
import {
  applyPendingCloneCssRules,
  installComponentCloneCssPatch,
  syncMountedComponentStyles,
} from './editorHelpers'

const createSelector = (name: string, type = 2) => ({
  get(key: string) {
    const record: Record<string, any> = { name, type, active: true, label: '' }
    return record[key]
  },
  name,
  type,
})

const createRule = (selectorName: string, style: Record<string, string>) => ({
  get(key: string) {
    const record: Record<string, any> = {
      selectors: [createSelector(selectorName)],
      style,
      mediaText: '',
      state: '',
      atRuleType: '',
    }
    return record[key]
  },
})

class FakeComponent {
  id: string

  constructor(id: string) {
    this.id = id
  }

  getId() {
    return this.id
  }

  clone() {
    return new FakeComponent(`${this.id}-clone-temp`)
  }

  components() {
    return { models: [] as FakeComponent[] }
  }
}

describe('installComponentCloneCssPatch', () => {
  it('uses the clone final id when copying id-scoped css rules', () => {
    const addedRules: any[] = []
    const rules = [createRule('source-id', { border: '1px solid #111111' })]
    const editor = {
      CssComposer: {
        getAll() {
          return {
            each(cb: (rule: any) => void) {
              rules.forEach(cb)
            },
          }
        },
        addCollection(ruleList: any[]) {
          addedRules.push(...ruleList)
        },
      },
      Components: {
        getTypes() {
          return [{ model: FakeComponent }]
        },
      },
    }

    installComponentCloneCssPatch(editor)

    const source = new FakeComponent('source-id')
    const clone = source.clone()

    expect(addedRules).toHaveLength(0)

    clone.id = 'clone-final-id'
    applyPendingCloneCssRules(editor, clone)

    expect(addedRules).toHaveLength(1)
    expect(addedRules[0].selectors).toEqual([
      { name: 'clone-final-id', type: 2, active: true },
    ])
    expect(addedRules[0].style).toEqual({ border: '1px solid #111111' })

    applyPendingCloneCssRules(editor, clone)
    expect(addedRules).toHaveLength(1)
  })
})

describe('syncMountedComponentStyles', () => {
  it('returns quietly when editor has been destroyed', () => {
    expect(() =>
      syncMountedComponentStyles({
        destroyed: true,
        getWrapper() {
          throw new Error('should not read wrapper after destroy')
        },
      }),
    ).not.toThrow()
  })

  it('returns quietly when wrapper is unavailable', () => {
    expect(() =>
      syncMountedComponentStyles({
        Pages: {
          getAll() {
            return []
          },
        },
      }),
    ).not.toThrow()
  })
})
