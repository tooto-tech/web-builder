/*
 * WebBuilder shell theme tokens.
 *
 * Every chrome-level appearance value (top bar, panel rail, shell loading,
 * diagnostics, resize/drop affordances) resolves through these CSS custom
 * properties. Defaults reproduce the legacy hardcoded values exactly so the
 * default appearance stays pixel-identical; hosts override any subset via
 * `options.theme`.
 */

export interface WebBuilderThemeTokens {
  /** Top bar + panel rail background (legacy `editor-panel`). */
  '--wb-topbar-bg': string
  /** Primary action background (legacy `editor-primary`). */
  '--wb-primary': string
  /** Primary action hover background (legacy `hover:bg-blue-600`). */
  '--wb-primary-hover': string
  /** Chrome icon-button hover background (legacy `editor-btn-hover`). */
  '--wb-btn-hover-bg': string
  /** Chrome icon-button active background (legacy `editor-btn-active`). */
  '--wb-btn-active-bg': string
  '--wb-loading-bg': string
  '--wb-loading-text': string
  '--wb-loading-subtext': string
  '--wb-loading-spinner-track': string
  '--wb-loading-spinner-head': string
  '--wb-diagnostic-bg': string
  '--wb-diagnostic-border': string
  '--wb-diagnostic-text': string
  /** Drop-zone active border highlight (legacy `blue-500`). */
  '--wb-accent': string
  /** Drop-zone active text (legacy `blue-600`). */
  '--wb-accent-text': string
  /** Drop-zone active surface (legacy `blue-50`). */
  '--wb-accent-soft-bg': string
  /** Side-panel resize handle hover (legacy `blue-300/70`). */
  '--wb-resize-hover-bg': string
  /** Side-panel resize handle while dragging (legacy `blue-400/80`). */
  '--wb-resize-active-bg': string
  /** Drop-zone idle border (legacy `gray-200`). */
  '--wb-drop-idle-border': string
  /** Drop-zone idle text (legacy `gray-400`). */
  '--wb-drop-idle-text': string
  '--wb-side-panel-width': string
  '--wb-rail-width': string
}

export const DEFAULT_THEME: WebBuilderThemeTokens = {
  '--wb-topbar-bg': '#001533',
  '--wb-primary': '#2251FF',
  '--wb-primary-hover': '#2563eb',
  '--wb-btn-hover-bg': '#ffffff29',
  '--wb-btn-active-bg': '#ffffff29',
  '--wb-loading-bg': '#f0f2f5',
  '--wb-loading-text': '#1f2937',
  '--wb-loading-subtext': '#6b7280',
  '--wb-loading-spinner-track': '#e5e7eb',
  '--wb-loading-spinner-head': '#4b5563',
  '--wb-diagnostic-bg': '#fffbeb',
  '--wb-diagnostic-border': '#f59e0b',
  '--wb-diagnostic-text': '#92400e',
  '--wb-accent': '#3b82f6',
  '--wb-accent-text': '#2563eb',
  '--wb-accent-soft-bg': '#eff6ff',
  '--wb-resize-hover-bg': 'rgb(147 197 253 / 0.7)',
  '--wb-resize-active-bg': 'rgb(96 165 250 / 0.8)',
  '--wb-drop-idle-border': '#e5e7eb',
  '--wb-drop-idle-text': '#9ca3af',
  '--wb-side-panel-width': '280px',
  '--wb-rail-width': '40px',
}

export const DARK_THEME: WebBuilderThemeTokens = {
  ...DEFAULT_THEME,
  '--wb-topbar-bg': '#0b0f19',
  '--wb-primary': '#3b82f6',
  '--wb-primary-hover': '#2563eb',
  '--wb-loading-bg': '#111827',
  '--wb-loading-text': '#e5e7eb',
  '--wb-loading-subtext': '#9ca3af',
  '--wb-loading-spinner-track': '#374151',
  '--wb-loading-spinner-head': '#d1d5db',
}

export const mergeTheme = (
  theme?: Partial<WebBuilderThemeTokens>,
): WebBuilderThemeTokens => ({
  ...DEFAULT_THEME,
  ...theme,
})
