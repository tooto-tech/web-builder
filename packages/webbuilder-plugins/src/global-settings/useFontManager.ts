import { computed, ref } from 'vue'
import { useGoogleFonts, type GoogleFontItem } from './useGoogleFonts.js'

export interface InstalledFont {
  family: string
  category: string
  cssFamily: string
  googleName: string
  variants: string[]
}

const ALL_VARIANTS = ['100', '200', '300', 'regular', '500', '600', '700', '800', '900']
const DEFAULT_VARIANTS = ['300', 'regular', '500', '600', '700']
const LINK_ATTR = 'data-wb-font-installed'

let _instance: ReturnType<typeof createFontManager> | null = null
let _editorRef: any = null

function createFontManager() {
  const installedFonts = ref<InstalledFont[]>([])
  const googleFonts = useGoogleFonts()

  function buildFontHref(font: InstalledFont): string {
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

  function injectFontLink(doc: Document, font: InstalledFont) {
    const existing = doc.head.querySelector(`link[${LINK_ATTR}="${font.googleName}"]`)
    if (existing) {
      existing.setAttribute('href', buildFontHref(font))
      return
    }
    const link = doc.createElement('link')
    link.rel = 'stylesheet'
    link.setAttribute(LINK_ATTR, font.googleName)
    link.href = buildFontHref(font)
    doc.head.appendChild(link)
  }

  function removeFontLink(doc: Document, googleName: string) {
    doc.head.querySelector(`link[${LINK_ATTR}="${googleName}"]`)?.remove()
  }

  function refreshAllLinks(doc: Document) {
    doc.head.querySelectorAll(`link[${LINK_ATTR}]`).forEach(el => el.remove())
    installedFonts.value.forEach(font => injectFontLink(doc, font))
  }

  function getCanvasDoc(): Document | null {
    try {
      return _editorRef?.Canvas?.getDocument?.() ?? null
    } catch {
      return null
    }
  }

  function injectToAll(font: InstalledFont) {
    injectFontLink(document, font)
    const canvasDoc = getCanvasDoc()
    if (canvasDoc) injectFontLink(canvasDoc, font)
  }

  function removeFromAll(googleName: string) {
    removeFontLink(document, googleName)
    const canvasDoc = getCanvasDoc()
    if (canvasDoc) removeFontLink(canvasDoc, googleName)
  }

  function refreshAll() {
    refreshAllLinks(document)
    const canvasDoc = getCanvasDoc()
    if (canvasDoc) refreshAllLinks(canvasDoc)
  }

  function installFont(fontItem: GoogleFontItem, variants?: string[]) {
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

  function removeFont(family: string) {
    const font = installedFonts.value.find(f => f.family === family)
    if (!font) return

    installedFonts.value = installedFonts.value.filter(f => f.family !== family)
    removeFromAll(font.googleName)
  }

  function updateVariants(family: string, variants: string[]) {
    const idx = installedFonts.value.findIndex(f => f.family === family)
    if (idx < 0) return

    const updated = { ...installedFonts.value[idx], variants: [...variants] }
    const nextFonts = [...installedFonts.value]
    nextFonts[idx] = updated
    installedFonts.value = nextFonts

    injectToAll(updated)
  }

  function restoreFromSaved(saved: any[] | null | undefined) {
    if (!Array.isArray(saved) || saved.length === 0) {
      installedFonts.value = []
      refreshAll()
      return
    }
    installedFonts.value = saved.map((font: any) => ({
      family: font.family ?? '',
      category: font.category ?? 'sans-serif',
      cssFamily: font.cssFamily ?? `"${font.family}", sans-serif`,
      googleName: font.googleName ?? font.family?.replace(/ /g, '+') ?? '',
      variants: Array.isArray(font.variants) ? font.variants : [...DEFAULT_VARIANTS],
    }))
    refreshAll()
  }

  function isInstalled(family: string): boolean {
    return installedFonts.value.some(font => font.family === family)
  }

  function getFontLinks(): string[] {
    return installedFonts.value.map(font => buildFontHref(font))
  }

  function getFontLinksHtml(): string {
    const preconnect = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    const links = installedFonts.value.map(font =>
      `<link href="${buildFontHref(font)}" rel="stylesheet">`
    ).join('\n')
    return links ? `${preconnect}\n${links}` : ''
  }

  function setupEditor(editor: any) {
    _editorRef = editor

    editor.on('canvas:frame:load', () => {
      setTimeout(() => {
        const canvasDoc = getCanvasDoc()
        if (canvasDoc) refreshAllLinks(canvasDoc)
      }, 50)
    })

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

export function useFontManager() {
  if (!_instance) {
    _instance = createFontManager()
  }
  return _instance
}
