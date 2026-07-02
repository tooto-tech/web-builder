/**
 * PoC 核心验证：用 @tootix/grapesjs-vue 的 useEditor() 实现 admin 的
 * WbStyleManager 接口（WbCtrl* 控件的数据契约）。
 *
 * 只完整实现 WbCtrl 控件实际消费的成员（selectedComponent / currentStyles /
 * getValue / setValue / setValues / clearValue / hasSelection）；
 * selector/class 模式给最小占位（P2 再补全）。
 */
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useEditor } from '@tootix/grapesjs-vue'
import type { WbStyleManager, WbStyleMode } from '../vendor/composables/useWbStyleManager'

const SYNC_EVENTS = [
  'component:selected',
  'component:deselected',
  'component:toggled',
  'component:styleUpdate',
  'style:target',
  'undo',
  'redo',
].join(' ')

export function useWbStyleManagerAdapter(): WbStyleManager {
  const editor = useEditor()

  const selectedComponent = shallowRef<any>(null)
  const currentStyles = ref<Record<string, string>>({})
  const styleMode = ref<WbStyleMode>('component')
  const selectedClasses = ref<string[]>([])

  const refresh = () => {
    const selected = editor.getSelected() ?? null
    selectedComponent.value = selected
    currentStyles.value = selected
      ? { ...(selected.getStyle() as Record<string, string>) }
      : {}
  }

  editor.on(SYNC_EVENTS, refresh)
  onBeforeUnmount(() => editor.off(SYNC_EVENTS, refresh))
  refresh()

  const setValues = (styles: Record<string, string>) => {
    const selected = editor.getSelected()
    if (!selected) return
    const next = { ...(selected.getStyle() as Record<string, string>) }
    for (const [prop, value] of Object.entries(styles)) {
      if (value === '') delete next[prop]
      else next[prop] = value
    }
    selected.setStyle(next)
    refresh()
  }

  return {
    hasSelection: computed(() => Boolean(selectedComponent.value)),
    selectedComponent,
    currentStyles,
    styleMode,
    setStyleMode: (mode) => { styleMode.value = mode },
    currentSelector: computed(() => ''),
    availableClasses: computed(() => []),
    selectedClasses,
    selectedTargetType: computed(() => 'id' as const),
    canSelectClasses: computed(() => false),
    selectIdTarget: () => {},
    toggleClassTarget: () => {},
    cssText: computed(() => ''),
    setCssFromText: () => {},
    getValue: (property) => currentStyles.value[property] ?? '',
    setValue: (property, value) => setValues({ [property]: value }),
    setValues,
    clearValue: (property) => setValues({ [property]: '' }),
  }
}
