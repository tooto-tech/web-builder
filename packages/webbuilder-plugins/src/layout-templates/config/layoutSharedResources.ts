import {
  createDefaultLayoutSettings,
  normalizeLayoutSettings,
  type LayoutSlotKey,
  type WebBuilderLayoutSettings,
} from '../utils/layoutSettings'

export const LAYOUT_RULES_RESOURCE_SCOPE = 'OWNED'
export const LAYOUT_RULES_RESOURCE_KEY = 'layout.rules'
export const LAYOUT_RULES_RESOURCE_TYPE = 'LAYOUT_RULES'
export const LAYOUT_PAGE_RESOURCE_SCOPE = 'SHARED'

export const LAYOUT_PAGE_RESOURCE_TYPES: Record<LayoutSlotKey, string> = {
  header: 'LAYOUT_PAGE_HEADER',
  footer: 'LAYOUT_PAGE_FOOTER',
}

export const buildLayoutPageResourceKey = (slotKey: LayoutSlotKey, layoutPageId: string) =>
  `layout.${slotKey}.${layoutPageId}`.trim()

export const createDefaultLayoutRulesPayload = (): WebBuilderLayoutSettings =>
  createDefaultLayoutSettings()

export const normalizeLayoutRulesPayload = (
  payload?: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null,
): WebBuilderLayoutSettings => normalizeLayoutSettings(payload)
