import type { ComputedRef, Ref } from 'vue'

export type WbStyleMode = 'component' | 'selector'
export type WbSelectorTargetType = 'id' | 'class'

export interface WbStyleManager {
  hasSelection: ComputedRef<boolean>
  selectedComponent: Ref<unknown>
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
