import './style.css'

export { default as DeviceSwitcher } from './DeviceSwitcher.vue'
export { default as FloatingPanelHost } from './FloatingPanelHost.vue'
export { default as PanelRail } from './PanelRail.vue'
export { default as PluginPanelHost } from './PluginPanelHost.vue'
export { default as TopBar } from './TopBar.vue'
export { default as WebBuilder } from './WebBuilder.vue'
export { default as WebBuilderShell } from './WebBuilderShell.vue'
export * from './controllers/index.js'
export * from './controls/index.js'
export * from './panels/index.js'
export { DARK_THEME, DEFAULT_THEME, mergeTheme } from './theme.js'
export {
  DEFAULT_SHELL_LOCALE,
  SHELL_MESSAGES,
  resolveShellMessages,
} from './messages.js'
export type {
  WebBuilderShellMessageKey,
  WebBuilderShellMessages,
} from './messages.js'
export {
  WEB_BUILDER_CONTEXT,
  useWebBuilderContext,
} from './context.js'
export type { WebBuilderContext } from './context.js'
export type {
  ResolvedWebBuilderOptions,
  WebBuilderBrandingOptions,
  WebBuilderCanvasOptions,
  WebBuilderAutosaveOptions,
  WebBuilderDeviceOption,
  WebBuilderI18nOptions,
  WebBuilderOptions,
  WebBuilderThemeTokens,
} from '../core/index.js'
export type {
  WebBuilderPanelContribution,
  WebBuilderPanelLayout,
} from '../core/index.js'
