import { hasInjectionContext, inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { InstalledFont } from '@toototech/webbuilder-plugins/global-settings'
import {
  BASE_DEVICE_ID,
  createDefaultHeadingStyles,
  normalizeHeadingStyles,
  type CustomCodeSnippet,
  type FontDelivery,
  type GlobalColor,
  type GlobalHeadingStyle,
  type GlobalHeadingStyles,
  type HeadingLevel,
  type HeadingStyleField,
  type ResponsiveHeadingOverrides,
} from './globalSettingsPrimitives'

export interface GlobalSettingsHostDeps {
  colors: Readonly<Ref<GlobalColor[]>>
  fontFamily: Readonly<Ref<string>>
  googleName: Readonly<Ref<string>>
  fontDelivery: Readonly<Ref<FontDelivery>>
  headingStyles: Readonly<Ref<GlobalHeadingStyles>>
  responsiveHeadingOverrides: Readonly<Ref<ResponsiveHeadingOverrides>>
  installedFonts: Readonly<Ref<InstalledFont[]>>
  customCss: Readonly<Ref<string>>
  customCode: Readonly<Ref<CustomCodeSnippet[]>>
  setColors: (colors: GlobalColor[]) => void
  addColor: (name: string, value: string) => void
  updateColor: (id: string, patch: Partial<Omit<GlobalColor, 'id'>>) => void
  removeColor: (id: string) => void
  reorderColors: (from: number, to: number) => void
  setGlobalFont: (fontFamily: string, googleName?: string) => void
  resetGlobalFont: () => void
  setFontDelivery: (value: FontDelivery) => void
  setHeadingStyle: (
    level: HeadingLevel,
    patch: Partial<GlobalHeadingStyle>,
    deviceId?: string,
  ) => void
  resetHeadingStyle: (level: HeadingLevel, deviceId?: string) => void
  resetHeadingStyles: (deviceId?: string) => void
  hydrateHeadingStyles: (value: unknown, overrides?: unknown) => void
  getEffectiveHeadingStyle: (level: HeadingLevel, deviceId?: string) => GlobalHeadingStyle
  isHeadingFieldOverridden: (
    level: HeadingLevel,
    field: HeadingStyleField,
    deviceId: string,
  ) => boolean
  setCustomCss: (value: string) => void
  addCustomCodeSnippet: (partial?: Partial<Omit<CustomCodeSnippet, 'id'>>) => void
  updateCustomCodeSnippet: (
    id: string,
    patch: Partial<Omit<CustomCodeSnippet, 'id'>>,
  ) => void
  removeCustomCodeSnippet: (id: string) => void
  setCustomCodeSnippets: (list: CustomCodeSnippet[]) => void
  restoreInstalledFonts: (fonts: InstalledFont[]) => void
}

const globalSettingsHostDepsKey: InjectionKey<GlobalSettingsHostDeps> =
  Symbol('webBuilderGlobalSettingsHostDeps')

let fallbackDeps: GlobalSettingsHostDeps | null = null
let defaultDeps: GlobalSettingsHostDeps | null = null

const cloneHeadingStyle = (style: GlobalHeadingStyle): GlobalHeadingStyle => ({ ...style })

const createFallbackGlobalSettingsHostDeps = (): GlobalSettingsHostDeps => {
  const colors = ref<GlobalColor[]>([])
  const fontFamily = ref('')
  const googleName = ref('')
  const fontDelivery = ref<FontDelivery>('remote')
  const headingStyles = ref(createDefaultHeadingStyles()) as Ref<GlobalHeadingStyles>
  const responsiveHeadingOverrides = ref({}) as Ref<ResponsiveHeadingOverrides>
  const installedFonts = ref<InstalledFont[]>([])
  const customCss = ref('')
  const customCode = ref<CustomCodeSnippet[]>([])

  return {
    colors,
    fontFamily,
    googleName,
    fontDelivery,
    headingStyles,
    responsiveHeadingOverrides,
    installedFonts,
    customCss,
    customCode,
    setColors(nextColors) {
      colors.value = nextColors.map(color => ({ ...color }))
    },
    addColor(name, value) {
      const id = `gc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
      colors.value.push({ id, name: name.trim() || value, value })
    },
    updateColor(id, patch) {
      const index = colors.value.findIndex((color) => color.id === id)
      if (index >= 0) colors.value[index] = { ...colors.value[index], ...patch }
    },
    removeColor(id) {
      colors.value = colors.value.filter((color) => color.id !== id)
    },
    reorderColors(from, to) {
      const items = [...colors.value]
      const [moved] = items.splice(from, 1)
      if (!moved) return
      items.splice(to, 0, moved)
      colors.value = items
    },
    setGlobalFont(nextFontFamily, nextGoogleName = '') {
      fontFamily.value = nextFontFamily
      googleName.value = nextGoogleName
    },
    resetGlobalFont() {
      fontFamily.value = ''
      googleName.value = ''
    },
    setFontDelivery(value) {
      fontDelivery.value = value
    },
    setHeadingStyle(level, patch, deviceId = BASE_DEVICE_ID) {
      if (!deviceId || deviceId === BASE_DEVICE_ID) {
        headingStyles.value[level] = { ...headingStyles.value[level], ...patch }
        return
      }
      const next = { ...responsiveHeadingOverrides.value }
      next[deviceId] = {
        ...(next[deviceId] ?? {}),
        [level]: {
          ...(next[deviceId]?.[level] ?? {}),
          ...patch,
        },
      }
      responsiveHeadingOverrides.value = next
    },
    resetHeadingStyle(level, deviceId = BASE_DEVICE_ID) {
      if (!deviceId || deviceId === BASE_DEVICE_ID) {
        headingStyles.value[level] = cloneHeadingStyle(createDefaultHeadingStyles()[level])
        return
      }
      const next = { ...responsiveHeadingOverrides.value }
      delete next[deviceId]?.[level]
      responsiveHeadingOverrides.value = next
    },
    resetHeadingStyles(deviceId) {
      if (!deviceId || deviceId === BASE_DEVICE_ID) {
        headingStyles.value = createDefaultHeadingStyles()
        responsiveHeadingOverrides.value = {}
        return
      }
      const next = { ...responsiveHeadingOverrides.value }
      delete next[deviceId]
      responsiveHeadingOverrides.value = next
    },
    hydrateHeadingStyles(value, overrides) {
      headingStyles.value = normalizeHeadingStyles(value)
      responsiveHeadingOverrides.value = (overrides && typeof overrides === 'object'
        ? overrides
        : {}) as ResponsiveHeadingOverrides
    },
    getEffectiveHeadingStyle(level, deviceId = BASE_DEVICE_ID) {
      const base = headingStyles.value[level]
      if (!deviceId || deviceId === BASE_DEVICE_ID) return { ...base }
      return { ...base, ...(responsiveHeadingOverrides.value[deviceId]?.[level] ?? {}) }
    },
    isHeadingFieldOverridden(level, field, deviceId) {
      if (!deviceId || deviceId === BASE_DEVICE_ID) return false
      const value = responsiveHeadingOverrides.value[deviceId]?.[level]?.[field]
      return typeof value === 'string' && value.trim() !== ''
    },
    setCustomCss(value) {
      customCss.value = value
    },
    addCustomCodeSnippet(partial) {
      customCode.value.push({
        id: `cc-${Date.now()}-${customCode.value.length + 1}`,
        label: partial?.label ?? '',
        position: partial?.position ?? 'head',
        code: partial?.code ?? '',
        enabled: partial?.enabled ?? true,
      })
    },
    updateCustomCodeSnippet(id, patch) {
      const index = customCode.value.findIndex((snippet) => snippet.id === id)
      if (index >= 0) customCode.value[index] = { ...customCode.value[index], ...patch }
    },
    removeCustomCodeSnippet(id) {
      customCode.value = customCode.value.filter((snippet) => snippet.id !== id)
    },
    setCustomCodeSnippets(list) {
      customCode.value = list
    },
    restoreInstalledFonts(fonts) {
      installedFonts.value = fonts
    },
  }
}

export const provideGlobalSettingsHostDeps = (deps: GlobalSettingsHostDeps): void => {
  defaultDeps = deps
  provide(globalSettingsHostDepsKey, deps)
}

export const setDefaultGlobalSettingsHostDeps = (deps: GlobalSettingsHostDeps): void => {
  defaultDeps = deps
}

export const useGlobalSettingsHostDeps = (): GlobalSettingsHostDeps => {
  const injected = hasInjectionContext() ? inject(globalSettingsHostDepsKey, null) : null
  if (injected) return injected
  if (defaultDeps) return defaultDeps
  fallbackDeps ??= createFallbackGlobalSettingsHostDeps()
  return fallbackDeps
}
