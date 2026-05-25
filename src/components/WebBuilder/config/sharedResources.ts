import { createDefaultHeadingStyles } from '@/store/modules/globalTypography'
import type { GlobalColor } from '@/store/modules/globalColors'
import type { CustomCodeSnippet } from '@/store/modules/globalCustomCode'
import type { InstalledFont } from '@/components/WebBuilder/composables/useFontManager'

export const SHARED_RESOURCE_SCOPE = 'SHARED'

export const SHARED_RESOURCE_KEYS = {
  colors: 'global.colors',
  typography: 'global.typography',
  customCss: 'global.custom-css',
  customCode: 'global.custom-code',
} as const

export const SHARED_RESOURCE_TYPES = {
  colors: 'GLOBAL_COLORS',
  typography: 'GLOBAL_TYPOGRAPHY',
  customCss: 'GLOBAL_CUSTOM_CSS',
  customCode: 'GLOBAL_CUSTOM_CODE',
} as const

export interface GlobalTypographyPayload {
  version: 1
  fontFamily: string
  googleName: string
  headingStyles: ReturnType<typeof createDefaultHeadingStyles>
  installedFonts: InstalledFont[]
}

export interface GlobalColorsPayload {
  version: 1
  colors: GlobalColor[]
}

export interface GlobalCustomCssPayload {
  version: 1
  css: string
}

export interface GlobalCustomCodePayload {
  version: 1
  snippets: CustomCodeSnippet[]
}

export interface LegacySharedPayloads {
  colors: GlobalColor[] | null
  typography: Omit<GlobalTypographyPayload, 'version'> | null
  customCss: string | null
  customCode: CustomCodeSnippet[] | null
}

export const createDefaultGlobalColorsPayload = (): GlobalColorsPayload => ({
  version: 1,
  colors: [],
})

export const createDefaultGlobalTypographyPayload = (): GlobalTypographyPayload => ({
  version: 1,
  fontFamily: '',
  googleName: '',
  headingStyles: createDefaultHeadingStyles(),
  installedFonts: [],
})

export const createDefaultGlobalCustomCssPayload = (): GlobalCustomCssPayload => ({
  version: 1,
  css: '',
})

export const createDefaultGlobalCustomCodePayload = (): GlobalCustomCodePayload => ({
  version: 1,
  snippets: [],
})

export const extractLegacySharedPayloads = (projectData: Record<string, any> | null | undefined): LegacySharedPayloads => {
  const colors = Array.isArray(projectData?.wbGlobalColors) ? projectData!.wbGlobalColors : null

  const typography =
    typeof projectData?.wbGlobalFontFamily === 'string' ||
    typeof projectData?.wbGlobalFontGoogleName === 'string' ||
    projectData?.wbGlobalHeadingStyles ||
    Array.isArray(projectData?.wbInstalledFonts) ||
    Array.isArray(projectData?.installedFonts)
      ? {
          fontFamily: `${projectData?.wbGlobalFontFamily ?? ''}`.trim(),
          googleName: `${projectData?.wbGlobalFontGoogleName ?? ''}`.trim(),
          headingStyles: projectData?.wbGlobalHeadingStyles ?? createDefaultHeadingStyles(),
          installedFonts: Array.isArray(projectData?.wbInstalledFonts)
            ? projectData!.wbInstalledFonts
            : Array.isArray(projectData?.installedFonts)
              ? projectData!.installedFonts
              : [],
        }
      : null

  const customCss =
    typeof projectData?.wbGlobalCustomCss === 'string' ? projectData.wbGlobalCustomCss : null

  const customCode = Array.isArray(projectData?.wbGlobalCustomCode)
    ? projectData!.wbGlobalCustomCode
    : null

  return {
    colors,
    typography,
    customCss,
    customCode,
  }
}

export const stripLegacySharedFields = (
  projectData: Record<string, any> | null | undefined
): Record<string, any> | null => {
  if (!projectData || typeof projectData !== 'object') {
    return null
  }

  const next = { ...projectData }
  delete next.wbGlobalColors
  delete next.wbGlobalFontFamily
  delete next.wbGlobalFontGoogleName
  delete next.wbGlobalHeadingStyles
  delete next.wbInstalledFonts
  delete next.installedFonts
  delete next.wbGlobalCustomCss
  delete next.wbGlobalCustomCode
  return next
}
