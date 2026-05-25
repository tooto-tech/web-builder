import { shallowRef } from 'vue'
import {
  cloneLayoutSettings,
  createDefaultLayoutSettings,
  normalizeLayoutSettings,
  type LayoutRule,
  type LayoutSlotKey,
  type LayoutTarget,
  type WebBuilderLayoutSettings,
} from '../utils/layoutSettings'

const sharedLayoutSettings = shallowRef<WebBuilderLayoutSettings>(
  createDefaultLayoutSettings(),
)

export interface UseLayoutSettingsOptions {
  initialValue?: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null
}

export default function useLayoutSettings(
  options: UseLayoutSettingsOptions = {},
) {
  if (options.initialValue) {
    sharedLayoutSettings.value = normalizeLayoutSettings(options.initialValue)
  }

  const hydrate = (
    value?: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null,
  ) => {
    sharedLayoutSettings.value = normalizeLayoutSettings(value)
  }

  const exportSettings = (): WebBuilderLayoutSettings => {
    return cloneLayoutSettings(sharedLayoutSettings.value)
  }

  const updateDefault = (slotKey: LayoutSlotKey, layoutId: LayoutTarget) => {
    const next = cloneLayoutSettings(sharedLayoutSettings.value)
    next[slotKey].defaultLayoutId = layoutId
    sharedLayoutSettings.value = next
    return next[slotKey].defaultLayoutId
  }

  const updateRule = (
    slotKey: LayoutSlotKey,
    rule: Partial<LayoutRule> & Pick<LayoutRule, 'id'>,
  ) => {
    const next = cloneLayoutSettings(sharedLayoutSettings.value)
    const currentRules = next[slotKey].rules
    const currentIndex = currentRules.findIndex((item) => item.id === rule.id)
    const mergedRule = {
      enabled: true,
      ...(currentIndex >= 0 ? currentRules[currentIndex] : {}),
      ...rule,
    }

    const normalizedSlot = normalizeLayoutSettings({
      header: next.header,
      footer: next.footer,
      [slotKey]: {
        defaultLayoutId: null,
        rules: [mergedRule],
      },
    })[slotKey]
    const normalizedRule = normalizedSlot.rules[0]!

    if (currentIndex >= 0) {
      currentRules.splice(currentIndex, 1, normalizedRule)
    } else {
      currentRules.push(normalizedRule)
    }

    sharedLayoutSettings.value = next
    return normalizedRule
  }

  const reset = () => {
    sharedLayoutSettings.value = createDefaultLayoutSettings()
  }

  return {
    layoutSettings: sharedLayoutSettings,
    hydrate,
    export: exportSettings,
    exportSettings,
    updateRule,
    updateDefault,
    reset,
  }
}
