import { defineStore } from 'pinia'

export interface CustomCodeSnippet {
  id: string
  label: string
  position: 'head' | 'body-start' | 'body-end'
  code: string
  enabled: boolean
}

let _nextId = 1

export const useGlobalCustomCodeStore = defineStore('globalCustomCode', {
  state: () => ({
    snippets: [] as CustomCodeSnippet[],
  }),
  actions: {
    addSnippet(partial?: Partial<Omit<CustomCodeSnippet, 'id'>>) {
      this.snippets.push({
        id: `cc-${Date.now()}-${_nextId++}`,
        label: partial?.label ?? '',
        position: partial?.position ?? 'head',
        code: partial?.code ?? '',
        enabled: partial?.enabled ?? true,
      })
    },
    removeSnippet(id: string) {
      this.snippets = this.snippets.filter((s) => s.id !== id)
    },
    updateSnippet(id: string, patch: Partial<Omit<CustomCodeSnippet, 'id'>>) {
      const s = this.snippets.find((s) => s.id === id)
      if (s) Object.assign(s, patch)
    },
    setSnippets(list: CustomCodeSnippet[]) {
      this.snippets = list
    },
    reset() {
      this.snippets = []
    },
  },
})

/**
 * 合并指定位置所有已启用的代码片段，返回拼接后的字符串。
 */
export function getCodeByPosition(
  snippets: CustomCodeSnippet[],
  position: CustomCodeSnippet['position'],
): string {
  return snippets
    .filter((s) => s.enabled && s.position === position && s.code.trim())
    .map((s) => s.code)
    .join('\n')
}
