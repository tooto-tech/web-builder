import {
  computed,
  inject,
  provide,
  ref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'

export interface WebBuilderFontItem {
  family: string
  googleName: string
  cssFamily: string
}

export interface WebBuilderFontControls {
  installedFonts: ComputedRef<WebBuilderFontItem[]>
  googleFonts: ComputedRef<WebBuilderFontItem[]>
  googleFontsLoading: Ref<boolean> | ComputedRef<boolean>
  loadGoogleFonts: () => Promise<void> | void
  searchGoogleFonts: (query: string) => WebBuilderFontItem[]
  injectGoogleFontCss: (googleName: string, canvasDoc?: Document | null) => void
}

const WEB_BUILDER_FONT_CONTROLS: InjectionKey<WebBuilderFontControls> = Symbol('webbuilder-font-controls')
const emptyInstalledFonts = computed<WebBuilderFontItem[]>(() => [])
const emptyGoogleFonts = computed<WebBuilderFontItem[]>(() => [])
const emptyGoogleFontsLoading = ref(false)

const emptyFontControls: WebBuilderFontControls = {
  installedFonts: emptyInstalledFonts,
  googleFonts: emptyGoogleFonts,
  googleFontsLoading: emptyGoogleFontsLoading,
  loadGoogleFonts: () => undefined,
  searchGoogleFonts: () => [],
  injectGoogleFontCss: () => undefined,
}

export const provideWebBuilderFontControls = (controls: WebBuilderFontControls) => {
  provide(WEB_BUILDER_FONT_CONTROLS, controls)
}

export const useWebBuilderFontControls = (): WebBuilderFontControls =>
  inject(WEB_BUILDER_FONT_CONTROLS, emptyFontControls)
