import {
  computed,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
} from 'vue'

export interface WebBuilderGlobalColor {
  id: string
  name: string
  value: string
}

export interface WebBuilderGlobalSettingsControls {
  colors: ComputedRef<WebBuilderGlobalColor[]>
  addColor: (name: string, value: string) => void
}

const WEB_BUILDER_GLOBAL_SETTINGS_CONTROLS:
InjectionKey<WebBuilderGlobalSettingsControls> = Symbol('webbuilder-global-settings-controls')

const emptyGlobalSettingsControls: WebBuilderGlobalSettingsControls = {
  colors: computed(() => []),
  addColor: () => undefined,
}

export const makeGlobalColorVar = (id: string): string => `var(--wb-gc-${id})`

export const parseGlobalColorVar = (cssValue: string | undefined): string | null => {
  const match = cssValue?.match(/^var\(--wb-gc-([^)]+)\)$/)
  return match ? match[1] : null
}

export const provideWebBuilderGlobalSettingsControls = (
  controls: WebBuilderGlobalSettingsControls,
) => {
  provide(WEB_BUILDER_GLOBAL_SETTINGS_CONTROLS, controls)
}

export const useWebBuilderGlobalSettingsControls = (): WebBuilderGlobalSettingsControls =>
  inject(WEB_BUILDER_GLOBAL_SETTINGS_CONTROLS, emptyGlobalSettingsControls)
