import type { GlobalThemeOverrides } from 'naive-ui'

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

export const createNaiveThemeOverrides = (
  theme: WebBuilderThemeTokens,
): GlobalThemeOverrides => ({
  common: {
    primaryColor: theme['--wb-primary'],
    primaryColorHover: theme['--wb-primary-hover'],
    primaryColorPressed: theme['--wb-primary-hover'],
    primaryColorSuppl: theme['--wb-primary'],
    borderRadius: '6px',
    borderColor: theme['--wb-drop-idle-border'],
    fontSize: '12px',
    textColorBase: theme['--wb-loading-text'],
    textColor1: theme['--wb-loading-text'],
    textColor2: theme['--wb-loading-text'],
    textColor3: theme['--wb-loading-subtext'],
    placeholderColor: theme['--wb-loading-subtext'],
  },
  Button: {
    colorPrimary: theme['--wb-primary'],
    colorHoverPrimary: theme['--wb-primary-hover'],
    colorPressedPrimary: theme['--wb-primary-hover'],
    colorFocusPrimary: theme['--wb-primary'],
    textColorPrimary: '#ffffff',
    textColorHoverPrimary: '#ffffff',
    textColorPressedPrimary: '#ffffff',
    borderRadiusSmall: '5px',
    heightSmall: '28px',
  },
  Checkbox: {
    colorChecked: theme['--wb-primary'],
    borderChecked: `1px solid ${theme['--wb-primary']}`,
  },
  Collapse: {
    titleTextColor: theme['--wb-loading-text'],
    titleTextColorDisabled: theme['--wb-loading-subtext'],
    dividerColor: theme['--wb-drop-idle-border'],
    itemMargin: '0',
  },
  Input: {
    border: `1px solid ${theme['--wb-drop-idle-border']}`,
    borderHover: `1px solid ${theme['--wb-primary-hover']}`,
    borderFocus: `1px solid ${theme['--wb-primary']}`,
    boxShadowFocus: `0 0 0 2px ${theme['--wb-accent-soft-bg']}`,
    heightSmall: '28px',
  },
  InputNumber: {
    border: `1px solid ${theme['--wb-drop-idle-border']}`,
    borderHover: `1px solid ${theme['--wb-primary-hover']}`,
    borderFocus: `1px solid ${theme['--wb-primary']}`,
    boxShadowFocus: `0 0 0 2px ${theme['--wb-accent-soft-bg']}`,
    heightSmall: '28px',
  },
  Popover: {
    color: '#ffffff',
    textColor: theme['--wb-loading-text'],
    borderRadius: '6px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
  },
  Radio: {
    buttonBorderColor: theme['--wb-drop-idle-border'],
    buttonBorderColorActive: theme['--wb-primary'],
    buttonBoxShadowFocus: `0 0 0 2px ${theme['--wb-accent-soft-bg']}`,
    buttonTextColorActive: theme['--wb-primary'],
  },
  Select: {
    peers: {
      InternalSelection: {
        border: `1px solid ${theme['--wb-drop-idle-border']}`,
        borderHover: `1px solid ${theme['--wb-primary-hover']}`,
        borderActive: `1px solid ${theme['--wb-primary']}`,
        boxShadowActive: `0 0 0 2px ${theme['--wb-accent-soft-bg']}`,
        heightSmall: '28px',
      },
    },
  },
  Slider: {
    fillColor: theme['--wb-primary'],
    fillColorHover: theme['--wb-primary-hover'],
    handleColor: '#ffffff',
  },
  Tabs: {
    colorSegment: theme['--wb-accent-soft-bg'],
    tabColorSegment: '#ffffff',
    tabTextColorSegment: theme['--wb-loading-text'],
    tabTextColorActiveSegment: theme['--wb-primary'],
    tabTextColorHoverSegment: theme['--wb-primary-hover'],
    tabTextColorDisabledSegment: theme['--wb-loading-subtext'],
    tabBorderRadius: '5px',
  },
  Tree: {
    nodeColorHover: theme['--wb-accent-soft-bg'],
    nodeColorPressed: theme['--wb-accent-soft-bg'],
    nodeColorActive: theme['--wb-accent-soft-bg'],
    nodeTextColor: theme['--wb-loading-text'],
    nodeTextColorDisabled: theme['--wb-loading-subtext'],
    dropMarkColor: theme['--wb-accent'],
    nodeHeight: '28px',
    nodeBorderRadius: '4px',
  },
})
