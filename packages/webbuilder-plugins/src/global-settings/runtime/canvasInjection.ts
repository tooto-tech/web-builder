import type { GlobalSettingsSnapshot } from '@toototech/webbuilder/core'

export const GLOBAL_SETTINGS_STYLE_IDS = {
  colors: 'wb-global-colors',
  typography: 'wb-global-font-family',
  customCss: 'wb-global-custom-css',
} as const

const GOOGLE_FONT_ATTR = 'data-wb-gf'
const CUSTOM_CODE_ATTR = 'data-wb-global-custom-code'
const CUSTOM_CODE_POSITION_ATTR = 'data-wb-global-custom-code-position'
const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
const CUSTOM_CODE_POSITIONS = ['head', 'body-start', 'body-end'] as const

type HeadingLevel = (typeof HEADING_LEVELS)[number]
export type GlobalSettingsCustomCodePosition = (typeof CUSTOM_CODE_POSITIONS)[number]

interface GlobalColorLike {
  id?: unknown
  value?: unknown
}

interface GlobalHeadingStyleLike {
  fontFamily?: unknown
  fontSize?: unknown
  lineHeight?: unknown
  fontWeight?: unknown
  textTransform?: unknown
  fontStyle?: unknown
  textDecoration?: unknown
  letterSpacing?: unknown
}

type GlobalHeadingStylesLike = Partial<Record<HeadingLevel, GlobalHeadingStyleLike>>

interface GlobalTypographyLike {
  fontFamily?: unknown
  googleName?: unknown
  headingStyles?: unknown
}

interface CustomCodeSnippetLike {
  position?: unknown
  code?: unknown
  enabled?: unknown
}

const DEFAULT_HEADING_STYLES: Record<HeadingLevel, Required<GlobalHeadingStyleLike>> = {
  h1: {
    fontFamily: '',
    fontSize: '48px',
    lineHeight: '1.15',
    fontWeight: '700',
    textTransform: 'none',
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: '0px',
  },
  h2: {
    fontFamily: '',
    fontSize: '40px',
    lineHeight: '1.18',
    fontWeight: '700',
    textTransform: 'none',
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: '0px',
  },
  h3: {
    fontFamily: '',
    fontSize: '32px',
    lineHeight: '1.22',
    fontWeight: '700',
    textTransform: 'none',
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: '0px',
  },
  h4: {
    fontFamily: '',
    fontSize: '24px',
    lineHeight: '1.28',
    fontWeight: '600',
    textTransform: 'none',
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: '0px',
  },
  h5: {
    fontFamily: '',
    fontSize: '20px',
    lineHeight: '1.35',
    fontWeight: '600',
    textTransform: 'none',
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: '0px',
  },
  h6: {
    fontFamily: '',
    fontSize: '16px',
    lineHeight: '1.4',
    fontWeight: '600',
    textTransform: 'none',
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: '0px',
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const isPresent = <T>(value: T | null | undefined): value is T => Boolean(value)

const toCssText = (value: unknown, fallback = '') =>
  `${value ?? ''}`.trim().replace(/;+/g, '') || fallback

const normalizeGlobalFontFamily = (fontFamily: unknown) => {
  const normalized = toCssText(fontFamily)
  if (!normalized) return ''
  if (/\bsans-serif\b/i.test(normalized)) return normalized
  return `${normalized}, sans-serif`
}

const getTypography = (snapshot: GlobalSettingsSnapshot): GlobalTypographyLike =>
  isRecord(snapshot.typography) ? snapshot.typography : {}

const normalizeHeadingStyles = (headingStyles: unknown) => {
  const source = isRecord(headingStyles) ? (headingStyles as GlobalHeadingStylesLike) : {}

  return HEADING_LEVELS.reduce((result, level) => {
    const defaults = DEFAULT_HEADING_STYLES[level]
    const style: GlobalHeadingStyleLike = isRecord(source[level])
      ? source[level] as GlobalHeadingStyleLike
      : {}
    result[level] = {
      fontFamily: normalizeGlobalFontFamily(style.fontFamily),
      fontSize: toCssText(style.fontSize, String(defaults.fontSize)),
      lineHeight: toCssText(style.lineHeight, String(defaults.lineHeight)),
      fontWeight: toCssText(style.fontWeight, String(defaults.fontWeight)),
      textTransform: toCssText(style.textTransform, String(defaults.textTransform)),
      fontStyle: toCssText(style.fontStyle, String(defaults.fontStyle)),
      textDecoration: toCssText(style.textDecoration, String(defaults.textDecoration)),
      letterSpacing: toCssText(style.letterSpacing, String(defaults.letterSpacing)),
    }
    return result
  }, {} as Record<HeadingLevel, Record<keyof GlobalHeadingStyleLike, string>>)
}

const getOrCreateStyleElement = (doc: Document, id: string) => {
  let element = doc.getElementById(id) as HTMLStyleElement | null
  if (!element) {
    element = doc.createElement('style')
    element.id = id
    ;(doc.head ?? doc.documentElement).appendChild(element)
  }
  return element
}

const setStyleText = (doc: Document, id: string, cssText: string) => {
  const existing = doc.getElementById(id)
  if (!cssText) {
    existing?.remove()
    return null
  }

  const element = getOrCreateStyleElement(doc, id)
  element.textContent = cssText
  return element
}

const buildColorVariables = (colors: unknown[]) => {
  const variables = colors
    .filter(isRecord)
    .map((color) => {
      const id = `${(color as GlobalColorLike).id ?? ''}`.trim()
      const value = toCssText((color as GlobalColorLike).value)
      if (!id || !value || /[^a-zA-Z0-9_-]/.test(id)) return ''
      return `  --wb-gc-${id}: ${value};`
    })
    .filter(Boolean)

  return variables.length ? `:root {\n${variables.join('\n')}\n}` : ':root {}'
}

const buildTypographyCss = (typography: GlobalTypographyLike) => {
  const fontFamily = normalizeGlobalFontFamily(typography.fontFamily)
  const headingStyles = normalizeHeadingStyles(typography.headingStyles)
  const headingVariables = HEADING_LEVELS.flatMap((level) => {
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
  const headingRules = HEADING_LEVELS.map((level) => `${level} {
  font-family: var(--wb-${level}-font-family, var(--wb-global-font-family));
  font-size: var(--wb-${level}-font-size);
  line-height: var(--wb-${level}-line-height);
  font-weight: var(--wb-${level}-font-weight);
  text-transform: var(--wb-${level}-text-transform);
  font-style: var(--wb-${level}-font-style);
  text-decoration-line: var(--wb-${level}-text-decoration);
  letter-spacing: var(--wb-${level}-letter-spacing);
}`).join('\n')

  return `:root {
  --wb-global-font-family: ${fontFamily || 'inherit'};
${headingVariables}
}
body,
button,
input,
textarea,
select {
  font-family: var(--wb-global-font-family);
}
${headingRules}`
}

export const buildGlobalSettingsCss = (snapshot: GlobalSettingsSnapshot) => {
  const typography = getTypography(snapshot)
  return [
    buildColorVariables(snapshot.colors),
    buildTypographyCss(typography),
    `${snapshot.customCss ?? ''}`.trim(),
  ].filter(Boolean).join('\n')
}

export const getGlobalSettingsGoogleFontName = (
  snapshot: GlobalSettingsSnapshot
) => `${getTypography(snapshot).googleName ?? ''}`.trim()

const injectGoogleFontLink = (doc: Document, googleName: unknown) => {
  const normalized = `${googleName ?? ''}`.trim()
  if (!normalized) return null

  const existing = doc.head?.querySelector?.(
    `link[${GOOGLE_FONT_ATTR}="${normalized}"]`
  ) as HTMLLinkElement | null
  if (existing) return existing

  const link = doc.createElement('link')
  link.rel = 'stylesheet'
  link.setAttribute(GOOGLE_FONT_ATTR, normalized)
  link.href = `https://fonts.googleapis.com/css2?family=${normalized}:wght@300;400;500;600;700&display=swap`
  ;(doc.head ?? doc.documentElement).appendChild(link)
  return link
}

const isCustomCodePosition = (
  value: unknown
): value is GlobalSettingsCustomCodePosition =>
  CUSTOM_CODE_POSITIONS.includes(value as GlobalSettingsCustomCodePosition)

const getEnabledCustomCodeByPosition = (
  customCode: unknown[],
  position: GlobalSettingsCustomCodePosition
) =>
  customCode
    .filter(isRecord)
    .filter((snippet) => {
      const customSnippet = snippet as CustomCodeSnippetLike
      return (
        customSnippet.enabled === true &&
        isCustomCodePosition(customSnippet.position) &&
        customSnippet.position === position
      )
    })
    .map(snippet => `${(snippet as CustomCodeSnippetLike).code ?? ''}`.trim())
    .filter(Boolean)
    .join('\n')

export const getEnabledGlobalCustomCode = (
  snapshot: GlobalSettingsSnapshot,
  position: GlobalSettingsCustomCodePosition
) => getEnabledCustomCodeByPosition(snapshot.customCode, position)

const createCustomCodeTemplate = (
  doc: Document,
  position: GlobalSettingsCustomCodePosition,
  code: string
) => {
  if (!code) return null

  const target =
    position === 'head'
      ? (doc.head ?? doc.documentElement)
      : (doc.body ?? doc.documentElement)
  const existing = target.querySelector?.(
    `template[${CUSTOM_CODE_POSITION_ATTR}="${position}"]`
  ) as HTMLElement | null
  existing?.remove()

  const template = doc.createElement('template')
  template.setAttribute(CUSTOM_CODE_ATTR, 'true')
  template.setAttribute(CUSTOM_CODE_POSITION_ATTR, position)
  template.textContent = code

  if (position === 'head') {
    target.appendChild(template)
    return template
  }

  if (position === 'body-start') {
    target.insertBefore(template, target.firstChild)
    return template
  }

  target.appendChild(template)
  return template
}

const injectCustomCodeTemplates = (doc: Document, customCode: unknown[]) =>
  CUSTOM_CODE_POSITIONS.map(position =>
    createCustomCodeTemplate(
      doc,
      position,
      getEnabledCustomCodeByPosition(customCode, position)
    )
  ).filter(isPresent)

export const injectGlobalSettingsIntoDocument = (
  doc: Document,
  snapshot: GlobalSettingsSnapshot
) => {
  const typography = getTypography(snapshot)
  const injectedNodes = [
    setStyleText(doc, GLOBAL_SETTINGS_STYLE_IDS.colors, buildColorVariables(snapshot.colors)),
    setStyleText(doc, GLOBAL_SETTINGS_STYLE_IDS.typography, buildTypographyCss(typography)),
    setStyleText(doc, GLOBAL_SETTINGS_STYLE_IDS.customCss, `${snapshot.customCss ?? ''}`.trim()),
    injectGoogleFontLink(doc, typography.googleName),
    ...injectCustomCodeTemplates(doc, snapshot.customCode),
  ].filter(isPresent)

  return () => {
    injectedNodes.forEach(node => node.remove())
  }
}
