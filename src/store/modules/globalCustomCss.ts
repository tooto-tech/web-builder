import { defineStore } from 'pinia'

export const useGlobalCustomCssStore = defineStore('globalCustomCss', {
  state: () => ({
    css: '' as string,
  }),
  actions: {
    setCss(value: string) {
      this.css = value
    },
    reset() {
      this.css = ''
    },
  },
})

/**
 * 将自定义全局 CSS 注入到指定 document 的 <head> 末尾。
 * 使用固定 id 的 <style> 标签，确保幂等更新。
 */
export function injectGlobalCustomCss(doc: Document, css: string) {
  const STYLE_ID = 'wb-global-custom-css'
  let el = doc.getElementById(STYLE_ID) as HTMLStyleElement | null

  if (!css) {
    el?.remove()
    return
  }

  if (!el) {
    el = doc.createElement('style')
    el.id = STYLE_ID
    doc.head.appendChild(el)
  }

  el.textContent = css
}
