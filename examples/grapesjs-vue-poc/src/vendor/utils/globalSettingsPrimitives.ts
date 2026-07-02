import { injectGoogleFontCss } from '@toototech/webbuilder-plugins/global-settings'

export interface GlobalColor {
  id: string
  name: string
  value: string
}

export interface CustomCodeSnippet {
  id: string
  label: string
  position: 'head' | 'body-start' | 'body-end'
  code: string
  enabled: boolean
}

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export type FontDelivery = 'remote' | 'local'

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
export type HeadingStyleField = keyof GlobalHeadingStyle

export type ResponsiveHeadingOverrides = Record<
  string,
  Partial<Record<HeadingLevel, Partial<GlobalHeadingStyle>>>
>

export const BASE_DEVICE_ID = 'desktop'

export const RESPONSIVE_DEVICE_MEDIA: Record<string, string> = {
  mobile: '(max-width: 767px)',
}

export const HEADING_LEVELS: HeadingLevel[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

const GLOBAL_FONT_STYLE_ID = 'wb-global-font-family'

const DEFAULT_HEADING_STYLES: GlobalHeadingStyles = {
  h1: { fontFamily: '', fontSize: '48px', lineHeight: '1.15', fontWeight: '700', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h2: { fontFamily: '', fontSize: '40px', lineHeight: '1.18', fontWeight: '700', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h3: { fontFamily: '', fontSize: '32px', lineHeight: '1.22', fontWeight: '700', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h4: { fontFamily: '', fontSize: '24px', lineHeight: '1.28', fontWeight: '600', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h5: { fontFamily: '', fontSize: '20px', lineHeight: '1.35', fontWeight: '600', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
  h6: { fontFamily: '', fontSize: '16px', lineHeight: '1.4', fontWeight: '600', textTransform: 'none', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px' },
}

const cloneHeadingStyle = (style: GlobalHeadingStyle): GlobalHeadingStyle => ({ ...style })

export const createDefaultHeadingStyles = (): GlobalHeadingStyles =>
  HEADING_LEVELS.reduce((acc, level) => {
    acc[level] = cloneHeadingStyle(DEFAULT_HEADING_STYLES[level])
    return acc
  }, {} as GlobalHeadingStyles)

const normalizeCssValue = (value: unknown, fallback: string): string => {
  const normalized = `${value ?? ''}`.trim().replace(/;+/g, '')
  return normalized || fallback
}

export const normalizeGlobalFontFamily = (fontFamily: string | undefined | null): string => {
  const normalized = `${fontFamily ?? ''}`.trim().replace(/;+\s*$/, '')
  if (!normalized) return ''
  if (/\bsans-serif\b/i.test(normalized)) return normalized
  return `${normalized}, sans-serif`
}

export const normalizeFontDelivery = (value: unknown): FontDelivery =>
  `${value ?? ''}`.trim().toLowerCase() === 'local' ? 'local' : 'remote'

export const normalizeHeadingStyles = (value: unknown): GlobalHeadingStyles => {
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

export const getGlobalColorVarName = (id: string): string => `--wb-gc-${id}`

export const makeGlobalColorVar = (id: string): string => `var(--wb-gc-${id})`

export const parseGlobalColorVar = (cssValue: string | undefined): string | null => {
  const match = cssValue?.match(/^var\(--wb-gc-([^)]+)\)$/)
  return match ? match[1] : null
}

export const buildCssVariables = (colors: GlobalColor[]): string => {
  if (!colors.length) return ':root {}'
  const vars = colors.map((color) => `  ${getGlobalColorVarName(color.id)}: ${color.value};`).join('\n')
  return `:root {\n${vars}\n}`
}

export const injectCssVariables = (doc: Document, colors: GlobalColor[]): void => {
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
    // iframe may not be ready yet.
  }
}

export const injectGlobalCustomCss = (doc: Document, css: string): void => {
  const styleId = 'wb-global-custom-css'
  let el = doc.getElementById(styleId) as HTMLStyleElement | null

  if (!css) {
    el?.remove()
    return
  }

  if (!el) {
    el = doc.createElement('style')
    el.id = styleId
    doc.head.appendChild(el)
  }

  el.textContent = css
}

const buildHeadingVariables = (headingStyles: GlobalHeadingStyles): string =>
  HEADING_LEVELS.flatMap((level) => {
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

const fieldToVarSuffix: Record<HeadingStyleField, string> = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  lineHeight: 'line-height',
  fontWeight: 'font-weight',
  textTransform: 'text-transform',
  fontStyle: 'font-style',
  textDecoration: 'text-decoration',
  letterSpacing: 'letter-spacing',
}

const buildDeviceOverrideVariables = (
  deviceOverrides: Partial<Record<HeadingLevel, Partial<GlobalHeadingStyle>>>,
): string => {
  const lines: string[] = []
  HEADING_LEVELS.forEach((level) => {
    const fields = deviceOverrides[level]
    if (!fields) return
    ;(Object.keys(fields) as HeadingStyleField[]).forEach((key) => {
      const value = fields[key]
      if (!value) return
      lines.push(`    --wb-${level}-${fieldToVarSuffix[key]}: ${value};`)
    })
  })
  return lines.join('\n')
}

export const normalizeResponsiveOverrides = (value: unknown): ResponsiveHeadingOverrides => {
  const result: ResponsiveHeadingOverrides = {}
  if (!value || typeof value !== 'object') return result

  Object.entries(value as Record<string, any>).forEach(([deviceId, levels]) => {
    if (!deviceId || deviceId === BASE_DEVICE_ID || !levels || typeof levels !== 'object') return
    const deviceMap: Partial<Record<HeadingLevel, Partial<GlobalHeadingStyle>>> = {}

    HEADING_LEVELS.forEach((level) => {
      const source = (levels as any)[level]
      if (!source || typeof source !== 'object') return
      const fields: Partial<GlobalHeadingStyle> = {}
      ;(Object.keys(source) as HeadingStyleField[]).forEach((key) => {
        const raw = `${source[key] ?? ''}`.trim().replace(/;+\s*$/, '')
        if (!raw) return
        fields[key] = key === 'fontFamily' ? normalizeGlobalFontFamily(raw) : raw
      })
      if (Object.keys(fields).length > 0) deviceMap[level] = fields
    })

    if (Object.keys(deviceMap).length > 0) result[deviceId] = deviceMap
  })

  return result
}

const buildHeadingRules = (): string =>
  HEADING_LEVELS.map((level) => `${level} {
  font-family: var(--wb-${level}-font-family, var(--wb-global-font-family));
  font-size: var(--wb-${level}-font-size);
  line-height: var(--wb-${level}-line-height);
  font-weight: var(--wb-${level}-font-weight);
  text-transform: var(--wb-${level}-text-transform);
  font-style: var(--wb-${level}-font-style);
  text-decoration-line: var(--wb-${level}-text-decoration);
  letter-spacing: var(--wb-${level}-letter-spacing);
}`).join('\n')

export const buildGlobalFontCss = (
  fontFamily: string | undefined | null,
  headingStyles?: unknown,
  responsiveOverrides?: unknown,
): string => {
  const normalized = normalizeGlobalFontFamily(fontFamily)
  const normalizedHeadingStyles = normalizeHeadingStyles(headingStyles)
  const normalizedOverrides = normalizeResponsiveOverrides(responsiveOverrides)

  const mediaBlocks = Object.entries(normalizedOverrides)
    .map(([deviceId, deviceOverrides]) => {
      const media = RESPONSIVE_DEVICE_MEDIA[deviceId]
      if (!media) return ''
      const body = buildDeviceOverrideVariables(deviceOverrides)
      if (!body) return ''
      return `@media ${media} {\n  :root {\n${body}\n  }\n}`
    })
    .filter(Boolean)
    .join('\n')

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
${buildHeadingRules()}${mediaBlocks ? `\n${mediaBlocks}` : ''}`
}

export const injectGlobalFontCss = (
  doc: Document,
  fontFamily: string | undefined | null,
  googleName?: string | null,
  headingStyles?: unknown,
  responsiveOverrides?: unknown,
): void => {
  try {
    if (googleName) {
      injectGoogleFontCss(googleName, doc)
    }

    const cssText = buildGlobalFontCss(fontFamily, headingStyles, responsiveOverrides)
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
    // Canvas iframe can be unavailable.
  }
}
