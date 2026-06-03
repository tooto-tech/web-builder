import { computed, ref } from 'vue'

export interface GoogleFontItem {
  family: string
  category: string
  cssFamily: string
  googleName: string
}

let _cache: GoogleFontItem[] | null = null
let _fetchPromise: Promise<GoogleFontItem[]> | null = null

const CATEGORY_MAP: Record<string, string> = {
  'sans-serif': 'sans-serif',
  'serif': 'serif',
  'display': 'cursive',
  'handwriting': 'cursive',
  'monospace': 'monospace',
}

function buildCssFamily(family: string, category: string): string {
  const fallback = CATEGORY_MAP[category] ?? 'sans-serif'
  return `"${family}", ${fallback}`
}

const getGoogleFontsApiKey = (): string => {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> }
  return meta.env?.VITE_GOOGLE_FONTS_API_KEY?.trim() || ''
}

async function fetchAllFonts(): Promise<GoogleFontItem[]> {
  if (_cache) return _cache
  if (_fetchPromise) return _fetchPromise

  const apiKey = getGoogleFontsApiKey()

  _fetchPromise = (async () => {
    try {
      let fonts: GoogleFontItem[] = []

      if (apiKey) {
        const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Google Fonts API error: ${res.status}`)
        const data = await res.json()
        fonts = (data.items as any[]).map(item => ({
          family: item.family,
          category: item.category,
          cssFamily: buildCssFamily(item.family, item.category),
          googleName: item.family.replace(/ /g, '+'),
        }))
      } else {
        fonts = BUILTIN_FONTS
      }

      _cache = fonts
      return fonts
    } catch (error) {
      console.warn('[useGoogleFonts] Failed to load font list, using builtin:', error)
      _cache = BUILTIN_FONTS
      return BUILTIN_FONTS
    } finally {
      _fetchPromise = null
    }
  })()

  return _fetchPromise
}

const BUILTIN_FONTS: GoogleFontItem[] = [
  { family: 'Inter', category: 'sans-serif', cssFamily: '"Inter", sans-serif', googleName: 'Inter' },
  { family: 'Roboto', category: 'sans-serif', cssFamily: '"Roboto", sans-serif', googleName: 'Roboto' },
  { family: 'Open Sans', category: 'sans-serif', cssFamily: '"Open Sans", sans-serif', googleName: 'Open+Sans' },
  { family: 'Lato', category: 'sans-serif', cssFamily: '"Lato", sans-serif', googleName: 'Lato' },
  { family: 'Montserrat', category: 'sans-serif', cssFamily: '"Montserrat", sans-serif', googleName: 'Montserrat' },
  { family: 'Poppins', category: 'sans-serif', cssFamily: '"Poppins", sans-serif', googleName: 'Poppins' },
  { family: 'Nunito', category: 'sans-serif', cssFamily: '"Nunito", sans-serif', googleName: 'Nunito' },
  { family: 'Raleway', category: 'sans-serif', cssFamily: '"Raleway", sans-serif', googleName: 'Raleway' },
  { family: 'Ubuntu', category: 'sans-serif', cssFamily: '"Ubuntu", sans-serif', googleName: 'Ubuntu' },
  { family: 'Outfit', category: 'sans-serif', cssFamily: '"Outfit", sans-serif', googleName: 'Outfit' },
  { family: 'DM Sans', category: 'sans-serif', cssFamily: '"DM Sans", sans-serif', googleName: 'DM+Sans' },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', cssFamily: '"Plus Jakarta Sans", sans-serif', googleName: 'Plus+Jakarta+Sans' },
  { family: 'Manrope', category: 'sans-serif', cssFamily: '"Manrope", sans-serif', googleName: 'Manrope' },
  { family: 'Work Sans', category: 'sans-serif', cssFamily: '"Work Sans", sans-serif', googleName: 'Work+Sans' },
  { family: 'Rubik', category: 'sans-serif', cssFamily: '"Rubik", sans-serif', googleName: 'Rubik' },
  { family: 'Mulish', category: 'sans-serif', cssFamily: '"Mulish", sans-serif', googleName: 'Mulish' },
  { family: 'Source Sans 3', category: 'sans-serif', cssFamily: '"Source Sans 3", sans-serif', googleName: 'Source+Sans+3' },
  { family: 'Noto Sans', category: 'sans-serif', cssFamily: '"Noto Sans", sans-serif', googleName: 'Noto+Sans' },
  { family: 'Oswald', category: 'sans-serif', cssFamily: '"Oswald", sans-serif', googleName: 'Oswald' },
  { family: 'Figtree', category: 'sans-serif', cssFamily: '"Figtree", sans-serif', googleName: 'Figtree' },
  { family: 'Playfair Display', category: 'serif', cssFamily: '"Playfair Display", serif', googleName: 'Playfair+Display' },
  { family: 'Merriweather', category: 'serif', cssFamily: '"Merriweather", serif', googleName: 'Merriweather' },
  { family: 'Lora', category: 'serif', cssFamily: '"Lora", serif', googleName: 'Lora' },
  { family: 'EB Garamond', category: 'serif', cssFamily: '"EB Garamond", serif', googleName: 'EB+Garamond' },
  { family: 'Cormorant Garamond', category: 'serif', cssFamily: '"Cormorant Garamond", serif', googleName: 'Cormorant+Garamond' },
  { family: 'Bebas Neue', category: 'display', cssFamily: '"Bebas Neue", cursive', googleName: 'Bebas+Neue' },
  { family: 'Abril Fatface', category: 'display', cssFamily: '"Abril Fatface", cursive', googleName: 'Abril+Fatface' },
  { family: 'JetBrains Mono', category: 'monospace', cssFamily: '"JetBrains Mono", monospace', googleName: 'JetBrains+Mono' },
  { family: 'Fira Code', category: 'monospace', cssFamily: '"Fira Code", monospace', googleName: 'Fira+Code' },
  { family: 'Space Mono', category: 'monospace', cssFamily: '"Space Mono", monospace', googleName: 'Space+Mono' },
  { family: 'Noto Sans SC', category: 'sans-serif', cssFamily: '"Noto Sans SC", sans-serif', googleName: 'Noto+Sans+SC' },
  { family: 'Noto Serif SC', category: 'serif', cssFamily: '"Noto Serif SC", serif', googleName: 'Noto+Serif+SC' },
  { family: 'ZCOOL QingKe HuangYou', category: 'display', cssFamily: '"ZCOOL QingKe HuangYou", cursive', googleName: 'ZCOOL+QingKe+HuangYou' },
  { family: 'Ma Shan Zheng', category: 'handwriting', cssFamily: '"Ma Shan Zheng", cursive', googleName: 'Ma+Shan+Zheng' },
]

const _injectedMain = new Set<string>()
const _injectedCanvas = new WeakMap<Document, Set<string>>()

export function injectGoogleFontCss(googleName: string, canvasDoc?: Document | null) {
  const href = `https://fonts.googleapis.com/css2?family=${googleName}:wght@300;400;500;600;700&display=swap`

  if (!_injectedMain.has(googleName)) {
    _injectedMain.add(googleName)
    if (!document.head.querySelector(`link[data-wb-gf="${googleName}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.setAttribute('data-wb-gf', googleName)
      link.href = href
      document.head.appendChild(link)
    }
  }

  if (canvasDoc) {
    let canvasSet = _injectedCanvas.get(canvasDoc)
    if (!canvasSet) {
      canvasSet = new Set()
      _injectedCanvas.set(canvasDoc, canvasSet)
    }
    if (!canvasSet.has(googleName)) {
      canvasSet.add(googleName)
      try {
        if (!canvasDoc.head.querySelector(`link[data-wb-gf="${googleName}"]`)) {
          const link = canvasDoc.createElement('link')
          link.rel = 'stylesheet'
          link.setAttribute('data-wb-gf', googleName)
          link.href = href
          canvasDoc.head.appendChild(link)
        }
      } catch {
        /* ignore */
      }
    }
  }
}

export function useGoogleFonts() {
  const allFonts = ref<GoogleFontItem[]>([])
  const loading = ref(false)
  const hasApiKey = Boolean(getGoogleFontsApiKey())

  async function load() {
    if (allFonts.value.length > 0) return
    loading.value = true
    try {
      allFonts.value = await fetchAllFonts()
    } finally {
      loading.value = false
    }
  }

  function search(query: string): GoogleFontItem[] {
    if (!query) return allFonts.value
    const q = query.toLowerCase()
    return allFonts.value.filter(f =>
      f.family.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    )
  }

  return { allFonts: computed(() => allFonts.value), loading, hasApiKey, load, search }
}

export function extractGoogleFontLinks(cssOrHtml: string): string[] {
  const quoted = /font-family\s*:\s*["']([^"']+)["']/gi
  const families = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = quoted.exec(cssOrHtml)) !== null) {
    families.add(match[1].trim())
  }

  const fontList = _cache ?? BUILTIN_FONTS
  const links: string[] = []

  for (const family of families) {
    const found = fontList.find(f => f.family === family)
    if (found) {
      links.push(
        `https://fonts.googleapis.com/css2?family=${found.googleName}:wght@300;400;500;600;700&display=swap`
      )
    }
  }

  return links
}
