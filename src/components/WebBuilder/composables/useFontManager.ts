import { ref, computed } from 'vue'
import { useGoogleFonts, injectGoogleFontCss, type GoogleFontItem } from './useGoogleFonts'

/**
 * 已安装字体数据结构
 */
export interface InstalledFont {
  family: string        // 字体名，如 "Roboto"
  category: string      // 分类，如 "sans-serif"
  cssFamily: string     // CSS font-family 值
  googleName: string    // URL 编码名
  variants: string[]    // 已选变体列表，如 ["300", "regular", "500", "700"]
}

/** 全部可用变体 */
const ALL_VARIANTS = ['100', '200', '300', 'regular', '500', '600', '700', '800', '900']

/** 默认安装的变体 */
const DEFAULT_VARIANTS = ['300', 'regular', '500', '600', '700']

/** data 属性标记，用于清理 */
const LINK_ATTR = 'data-wb-font-installed'

// ── 模块级单例 ──────────────────────────────────────────────────

let _instance: ReturnType<typeof createFontManager> | null = null
let _editorRef: any = null

function createFontManager() {
  const installedFonts = ref<InstalledFont[]>([])
  const googleFonts = useGoogleFonts()

  // ── 工具函数 ────────────────────────────────────────────────────

  function buildFontHref(font: InstalledFont): string {
    // 将变体转为 Google Fonts CSS2 API 格式
    const weights = font.variants
      .filter(v => v !== 'regular')
      .map(v => parseInt(v))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b)

    if (weights.length === 0) {
      return `https://fonts.googleapis.com/css2?family=${font.googleName}&display=swap`
    }

    const wghtList = weights.map(w => `0,${w}`).join(';')
    return `https://fonts.googleapis.com/css2?family=${font.googleName}:ital,wght@${wghtList}&display=swap`
  }

  /** 向 document head 注入字体 link 标签 */
  function injectFontLink(doc: Document, font: InstalledFont) {
    const existing = doc.head.querySelector(`link[${LINK_ATTR}="${font.googleName}"]`)
    if (existing) {
      // 更新 href（变体可能变了）
      existing.setAttribute('href', buildFontHref(font))
      return
    }
    const link = doc.createElement('link')
    link.rel = 'stylesheet'
    link.setAttribute(LINK_ATTR, font.googleName)
    link.href = buildFontHref(font)
    doc.head.appendChild(link)
  }

  /** 从 document head 移除字体 link 标签 */
  function removeFontLink(doc: Document, googleName: string) {
    doc.head.querySelector(`link[${LINK_ATTR}="${googleName}"]`)?.remove()
  }

  /** 刷新所有已安装字体的 link 标签到目标 document */
  function refreshAllLinks(doc: Document) {
    // 先移除所有旧的
    doc.head.querySelectorAll(`link[${LINK_ATTR}]`).forEach(el => el.remove())
    // 重新注入
    installedFonts.value.forEach(font => injectFontLink(doc, font))
  }

  /** 获取 canvas iframe document */
  function getCanvasDoc(): Document | null {
    try {
      return _editorRef?.Canvas?.getDocument?.() ?? null
    } catch {
      return null
    }
  }

  /** 同时注入到主页面和 canvas */
  function injectToAll(font: InstalledFont) {
    injectFontLink(document, font)
    const canvasDoc = getCanvasDoc()
    if (canvasDoc) injectFontLink(canvasDoc, font)
  }

  /** 从主页面和 canvas 移除 */
  function removeFromAll(googleName: string) {
    removeFontLink(document, googleName)
    const canvasDoc = getCanvasDoc()
    if (canvasDoc) removeFontLink(canvasDoc, googleName)
  }

  /** 刷新主页面和 canvas 的所有字体链接 */
  function refreshAll() {
    refreshAllLinks(document)
    const canvasDoc = getCanvasDoc()
    if (canvasDoc) refreshAllLinks(canvasDoc)
  }

  // ── 核心 API ────────────────────────────────────────────────────

  /** 安装字体 */
  function installFont(fontItem: GoogleFontItem, variants?: string[]) {
    // 检查是否已安装
    if (installedFonts.value.some(f => f.family === fontItem.family)) return

    const font: InstalledFont = {
      family: fontItem.family,
      category: fontItem.category,
      cssFamily: fontItem.cssFamily,
      googleName: fontItem.googleName,
      variants: variants ?? [...DEFAULT_VARIANTS],
    }

    installedFonts.value = [...installedFonts.value, font]
    injectToAll(font)
  }

  /** 卸载字体 */
  function removeFont(family: string) {
    const font = installedFonts.value.find(f => f.family === family)
    if (!font) return

    installedFonts.value = installedFonts.value.filter(f => f.family !== family)
    removeFromAll(font.googleName)
  }

  /** 更新字体变体 */
  function updateVariants(family: string, variants: string[]) {
    const idx = installedFonts.value.findIndex(f => f.family === family)
    if (idx < 0) return

    const updated = { ...installedFonts.value[idx], variants: [...variants] }
    const newList = [...installedFonts.value]
    newList[idx] = updated
    installedFonts.value = newList

    injectToAll(updated) // 更新 link href
  }

  /** 从保存的数据直接恢复已安装字体（由 draftManager 调用） */
  function restoreFromSaved(saved: any[] | null | undefined) {
    if (!Array.isArray(saved) || saved.length === 0) {
      installedFonts.value = []
      refreshAll()
      return
    }
    installedFonts.value = saved.map((f: any) => ({
      family: f.family ?? '',
      category: f.category ?? 'sans-serif',
      cssFamily: f.cssFamily ?? `"${f.family}", sans-serif`,
      googleName: f.googleName ?? f.family?.replace(/ /g, '+') ?? '',
      variants: Array.isArray(f.variants) ? f.variants : [...DEFAULT_VARIANTS],
    }))
    refreshAll()
  }

  /** 检查字体是否已安装 */
  function isInstalled(family: string): boolean {
    return installedFonts.value.some(f => f.family === family)
  }

  // ── 持久化 ──────────────────────────────────────────────────────

  /** 获取发布时需要的 <link> 标签 */
  function getFontLinks(): string[] {
    return installedFonts.value.map(f => buildFontHref(f))
  }

  /** 获取发布时需要的 <link> HTML 字符串 */
  function getFontLinksHtml(): string {
    const preconnect = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    const links = installedFonts.value.map(f =>
      `<link href="${buildFontHref(f)}" rel="stylesheet">`
    ).join('\n')
    return links ? `${preconnect}\n${links}` : ''
  }

  // ── 编辑器集成 ──────────────────────────────────────────────────

  function setupEditor(editor: any) {
    _editorRef = editor

    // canvas iframe 加载后重新注入字体
    editor.on('canvas:frame:load', () => {
      setTimeout(() => {
        const canvasDoc = getCanvasDoc()
        if (canvasDoc) refreshAllLinks(canvasDoc)
      }, 50)
    })

    // 页面切换时重新注入
    editor.on('page', () => {
      setTimeout(() => {
        const canvasDoc = getCanvasDoc()
        if (canvasDoc) refreshAllLinks(canvasDoc)
      }, 100)
    })
  }

  return {
    installedFonts: computed(() => installedFonts.value),
    googleFonts,
    installFont,
    removeFont,
    updateVariants,
    isInstalled,
    restoreFromSaved,
    getFontLinks,
    getFontLinksHtml,
    setupEditor,
    ALL_VARIANTS,
  }
}

/**
 * 字体管理 composable（单例）
 */
export function useFontManager() {
  if (!_instance) {
    _instance = createFontManager()
  }
  return _instance
}
