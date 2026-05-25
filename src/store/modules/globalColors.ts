import { defineStore } from 'pinia'

export interface GlobalColor {
  id: string
  name: string
  value: string // CSS color string (hex / rgba)
}

// ── CSS 变量辅助函数 ───────────────────────────────────────────

/** 颜色对应的 CSS 变量名，例如 `--wb-gc-gc_abc123` */
export function getGlobalColorVarName(id: string): string {
  return `--wb-gc-${id}`
}

/** 颜色对应的 CSS var() 引用，例如 `var(--wb-gc-gc_abc123)` */
export function makeGlobalColorVar(id: string): string {
  return `var(--wb-gc-${id})`
}

/**
 * 如果 cssValue 是全局颜色 var()，返回颜色 id；否则返回 null。
 * 例如 `var(--wb-gc-abc)` → `'abc'`
 */
export function parseGlobalColorVar(cssValue: string | undefined): string | null {
  const match = cssValue?.match(/^var\(--wb-gc-([^)]+)\)$/)
  return match ? match[1] : null
}

/**
 * 将颜色列表构建成 CSS :root 变量块，注入到文档 / 画布使用。
 */
export function buildCssVariables(colors: GlobalColor[]): string {
  if (!colors.length) return ':root {}'
  const vars = colors.map((c) => `  ${getGlobalColorVarName(c.id)}: ${c.value};`).join('\n')
  return `:root {\n${vars}\n}`
}

/**
 * 将颜色变量注入到指定 Document（父页面或 GrapesJS canvas iframe document）。
 */
export function injectCssVariables(doc: Document, colors: GlobalColor[]): void {
  try {
    const id = 'wb-global-colors'
    let el = doc.getElementById(id) as HTMLStyleElement | null
    if (!el) {
      el = doc.createElement('style') as HTMLStyleElement
      el.id = id
      ;(doc.head ?? doc.documentElement).appendChild(el)
    }
    el.textContent = buildCssVariables(colors)
  } catch {
    // iframe 可能还未就绪，忽略
  }
}

export const useGlobalColorsStore = defineStore('webBuilderGlobalColors', {
  state: (): { colors: GlobalColor[] } => ({
    colors: [],
  }),

  actions: {
    addColor(name: string, value: string) {
      const id = `gc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
      this.colors.push({ id, name: name.trim() || value, value })
    },

    updateColor(id: string, patch: Partial<Omit<GlobalColor, 'id'>>) {
      const idx = this.colors.findIndex((c) => c.id === id)
      if (idx >= 0) Object.assign(this.colors[idx], patch)
    },

    removeColor(id: string) {
      this.colors = this.colors.filter((c) => c.id !== id)
    },

    reorder(from: number, to: number) {
      const items = [...this.colors]
      const [moved] = items.splice(from, 1)
      items.splice(to, 0, moved)
      this.colors = items
    },

    reset() {
      this.colors = []
    },
  },

  persist: true,
})
