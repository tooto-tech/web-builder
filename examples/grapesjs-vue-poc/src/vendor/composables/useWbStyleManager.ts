/**
 * PoC type shim —— 只保留 WbStyleManager 接口（原文件为 admin 的完整实现，
 * 依赖 useLayoutStyleAdapter / commands 等，PoC 不拷实现）。
 * 接口内容与 b2b-admin composables/useWbStyleManager.ts 逐字一致。
 *
 * PoC 的核心命题：能否用 @tootix/grapesjs-vue 的原语（useEditor / StylesProvider）
 * 实现该接口 —— 见 ../../adapters/useWbStyleManagerAdapter.ts
 */
import type { ComputedRef, Ref } from 'vue'

export type WbStyleMode = 'component' | 'selector'
export type WbSelectorTargetType = 'id' | 'class'

export interface WbStyleManager {
  hasSelection: ComputedRef<boolean>
  selectedComponent: Ref<any>
  currentStyles: Ref<Record<string, string>>
  styleMode: Ref<WbStyleMode>
  setStyleMode(mode: WbStyleMode): void
  currentSelector: ComputedRef<string>
  availableClasses: ComputedRef<string[]>
  selectedClasses: Ref<string[]>
  selectedTargetType: ComputedRef<WbSelectorTargetType>
  canSelectClasses: ComputedRef<boolean>
  selectIdTarget(): void
  toggleClassTarget(className: string): void
  cssText: ComputedRef<string>
  setCssFromText(text: string): void
  getValue(property: string): string
  setValue(property: string, value: string): void
  setValues(styles: Record<string, string>): void
  clearValue(property: string): void
}
