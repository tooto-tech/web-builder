import useDesignSystem from './useDesignSystem'

/**
 * 全局颜色 CSS 变量注入 composable
 *
 * 将全局颜色以 CSS 变量形式注入到主文档和画布 iframe 中。
 * 必须在始终挂载的组件中调用（如 index.vue），
 * 而不是条件渲染的面板中，以确保变量始终可用。
 */
export default function useGlobalColorsInjector(grapes: any) {
  return useDesignSystem(grapes)
}
