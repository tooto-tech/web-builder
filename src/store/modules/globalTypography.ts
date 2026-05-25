import { defineStore } from 'pinia'
import { injectGoogleFontCss } from '@/components/WebBuilder/composables/useGoogleFonts'

const GLOBAL_FONT_STYLE_ID = 'wb-global-font-family'

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface GlobalHeadingStyle {
  fontFamily: string
  fontSize: string
  lineHeight: string
  fontWeight: string
  textTransform: string
  fontStyle: string
  textDecoration: string
  letterSpacing: string
}

export type GlobalHeadingStyles = Record<HeadingLevel, GlobalHeadingStyle>

export const HEADING_LEVELS: HeadingLevel[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

const DEFAULT_HEADING_STYLES: GlobalHeadingStyles = {
  h1: { fontFamily: '', fontSize: '48px', lineHeight: '1.15', fontWeight: '700', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h2: { fontFamily: '', fontSize: '40px', lineHeight: '1.18', fontWeight: '700', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h3: { fontFamily: '', fontSize: '32px', lineHeight: '1.22', fontWeight: '700', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h4: { fontFamily: '', fontSize: '24px', lineHeight: '1.28', fontWeight: '600', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h5: { fontFamily: '', fontSize: '20px', lineHeight: '1.35', fontWeight: '600', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h6: { fontFamily: '', fontSize: '16px', lineHeight: '1.4', fontWeight: '600', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
}

function cloneHeadingStyle(style: GlobalHeadingStyle): GlobalHeadingStyle {
  return { ...style }
}

export function createDefaultHeadingStyles(): GlobalHeadingStyles {
  return HEADING_LEVELS.reduce((acc, level) => {
    acc[level] = cloneHeadingStyle(DEFAULT_HEADING_STYLES[level])
    return acc
  }, {} as GlobalHeadingStyles)
}

function normalizeCssValue(value: unknown, fallback: string): string {
  const normalized = `${value ?? ''}`.trim().replace(/;+/g, '')
  return normalized || fallback
}

export function normalizeHeadingStyles(value: unknown): GlobalHeadingStyles {
  const defaults = createDefaultHeadingStyles()
  if (!value || typeof value !== 'object') return defaults

  HEADING_LEVELS.forEach((level) => {
    const source = (value as Partial<Record<HeadingLevel, Partial<GlobalHeadingStyle>>>)[level]
    if (!source || typeof source !== 'object') return
    defaults[level] = {
      fontFamily: normalizeGlobalFontFamily(source.fontFamily),
      fontSize: normalizeCssValue(source.fontSize, defaults[level].fontSize),
      lineHeight: normalizeCssValue(source.lineHeight, defaults[level].lineHeight),
      fontWeight: normalizeCssValue(source.fontWeight, defaults[level].fontWeight),
      textTransform: normalizeCssValue(source.textTransform, defaults[level].textTransform),
      fontStyle: normalizeCssValue(source.fontStyle, defaults[level].fontStyle),
      textDecoration: normalizeCssValue(source.textDecoration, defaults[level].textDecoration),
      letterSpacing: normalizeCssValue(source.letterSpacing, defaults[level].letterSpacing),
    }
  })

  return defaults
}

export function normalizeGlobalFontFamily(fontFamily: string | undefined | null): string {
  const normalized = `${fontFamily ?? ''}`.trim().replace(/;+\s*$/, '')
  if (!normalized) return ''
  if (/\bsans-serif\b/i.test(normalized)) return normalized
  return `${normalized}, sans-serif`
}

function buildHeadingVariables(headingStyles: GlobalHeadingStyles): string {
  return HEADING_LEVELS.flatMap((level) => {
    const style = headingStyles[level]
    return [
      `  --wb-${level}-font-family: ${style.fontFamily || 'var(--wb-global-font-family)'};`,
      `  --wb-${level}-font-size: ${style.fontSize};`,
      `  --wb-${level}-line-height: ${style.lineHeight};`,
      `  --wb-${level}-font-weight: ${style.fontWeight};`,
      `  --wb-${level}-text-transform: ${style.textTransform};`,
      `  --wb-${level}-font-style: ${style.fontStyle};`,
      `  --wb-${level}-text-decoration: ${style.textDecoration};`,
      `  --wb-${level}-letter-spacing: ${style.letterSpacing};`,
    ]
  }).join('\n')
}

function buildHeadingRules(): string {
  return HEADING_LEVELS.map((level) => `${level} {
  font-family: var(--wb-${level}-font-family, var(--wb-global-font-family));
  font-size: var(--wb-${level}-font-size);
  line-height: var(--wb-${level}-line-height);
  font-weight: var(--wb-${level}-font-weight);
  text-transform: var(--wb-${level}-text-transform);
  font-style: var(--wb-${level}-font-style);
  text-decoration-line: var(--wb-${level}-text-decoration);
  letter-spacing: var(--wb-${level}-letter-spacing);
}`).join('\n')
}

export function buildGlobalFontCss(
  fontFamily: string | undefined | null,
  headingStyles?: unknown,
): string {
  const normalized = normalizeGlobalFontFamily(fontFamily)
  const normalizedHeadingStyles = normalizeHeadingStyles(headingStyles)

  return `:root {
  --wb-global-font-family: ${normalized || 'inherit'};
${buildHeadingVariables(normalizedHeadingStyles)}
}
body,
button,
input,
textarea,
select {
  font-family: var(--wb-global-font-family);
}
${buildHeadingRules()}`
}

export function injectGlobalFontCss(
  doc: Document,
  fontFamily: string | undefined | null,
  googleName?: string | null,
  headingStyles?: unknown,
): void {
  try {
    if (googleName) {
      injectGoogleFontCss(googleName, doc)
    }

    const cssText = buildGlobalFontCss(fontFamily, headingStyles)
    let styleEl = doc.getElementById(GLOBAL_FONT_STYLE_ID) as HTMLStyleElement | null

    if (!cssText) {
      styleEl?.remove()
      return
    }

    if (!styleEl) {
      styleEl = doc.createElement('style')
      styleEl.id = GLOBAL_FONT_STYLE_ID
      ;(doc.head ?? doc.documentElement).appendChild(styleEl)
    }

    styleEl.textContent = cssText
  } catch {
    // canvas iframe 可能尚未就绪，忽略
  }
}

export const useGlobalTypographyStore = defineStore('webBuilderGlobalTypography', {
  state: (): { fontFamily: string; googleName: string; headingStyles: GlobalHeadingStyles } => ({
    fontFamily: '',
    googleName: '',
    headingStyles: createDefaultHeadingStyles(),
  }),

  actions: {
    setGlobalFont(fontFamily: string, googleName = '') {
      this.fontFamily = normalizeGlobalFontFamily(fontFamily)
      this.googleName = googleName.trim()
    },

    resetGlobalFont() {
      this.fontFamily = ''
      this.googleName = ''
    },

    setHeadingStyle(level: HeadingLevel, patch: Partial<GlobalHeadingStyle>) {
      this.headingStyles[level] = {
        ...this.headingStyles[level],
        ...Object.fromEntries(
          Object.entries(patch).map(([key, value]) => [
            key,
            key === 'fontFamily'
              ? normalizeGlobalFontFamily(value as string)
              : normalizeCssValue(value, this.headingStyles[level][key as keyof GlobalHeadingStyle]),
          ]),
        ),
      }
    },

    resetHeadingStyle(level: HeadingLevel) {
      this.headingStyles[level] = cloneHeadingStyle(DEFAULT_HEADING_STYLES[level])
    },

    resetHeadingStyles() {
      this.headingStyles = createDefaultHeadingStyles()
    },

    hydrateHeadingStyles(value: unknown) {
      this.headingStyles = normalizeHeadingStyles(value)
    },
  },
})
