import useDesignSystem from './useDesignSystem'

/**
 * 全局自定义 CSS 注入 composable
 *
 * 将全局设置里的自定义 CSS 注入到 GrapesJS 画布 iframe。
 * 需要在始终挂载的 WebBuilder 根组件中调用，避免依赖全局设置面板的渲染状态。
 */
export default function useGlobalCustomCssInjector(grapes: any) {
  return useDesignSystem(grapes)
}
