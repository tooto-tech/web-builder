import { ref, watch } from 'vue'
import { useSelectedComponent } from './index'

const SAFE_CLASS_RE = /^[A-Za-z0-9_-]+$/

/**
 * 管理组件类名的 composable
 *
 * 使用本地 ref + GrapesJS 事件双向同步，避免 computed 读取非响应式
 * Backbone 数据导致删除最后一个类名后 UI 回弹的问题。
 */
export default function useComponentClasses(grapes: any) {
  const selected = useSelectedComponent(grapes)
  const classTags = ref<string[]>([])
  const getSelectedComponent = () =>
    selected.getRawComponent?.() ?? (selected.component as any)?._model ?? selected.component

  // ── 从 GrapesJS 组件读取类名 ────────────────────────────────
  function readClasses(comp: any): string[] {
    if (!comp) return []

    // 优先读 attribute class（Tailwind 等场景下比 classes 更可靠）
    const attrClass: unknown =
      comp.getAttributes?.()?.class ?? comp.attributes?.class ?? ''

    if (typeof attrClass === 'string' && attrClass.trim()) {
      return attrClass
        .split(/\s+/)
        .map((n) => n.trim())
        .filter(Boolean)
    }

    // 回退读 GrapesJS Selector 集合
    const classes: any[] = comp.classes ?? []
    return classes
      .map(
        (cls: any) =>
          cls?.get?.('name') ?? cls?.name ?? cls?.getName?.() ?? ''
      )
      .map((name: string) => name.trim())
      .filter(Boolean)
  }

  function syncFromGrapesJS() {
    const comp = getSelectedComponent()
    classTags.value = readClasses(comp)
  }

  // 选中组件变化时同步
  watch(() => selected.component, syncFromGrapesJS, { immediate: true })

  // 监听 GrapesJS 类名 / 属性变更事件
  grapes.onInit((editor: any) => {
    editor.on('component:update:classes', syncFromGrapesJS)
    editor.on('component:update:attributes', syncFromGrapesJS)
    // 切换选中时也重新同步
    editor.on('component:toggled', syncFromGrapesJS)
  })

  // ── 写入 GrapesJS ────────────────────────────────────────────
  function setClasses(next: string[]) {
    const comp = getSelectedComponent()
    if (!comp) return

    const normalized = Array.from(
      new Set(next.map((name) => name.trim()).filter(Boolean))
    )
    const classString = normalized.join(' ')

    // 立即更新本地 ref，保证 UI 不回弹
    classTags.value = normalized

    if (typeof comp.addAttributes === 'function') {
      comp.addAttributes({ class: classString })
    }

    if (typeof comp.setClass === 'function') {
      const safeClasses = normalized.filter((name) =>
        SAFE_CLASS_RE.test(name)
      )
      comp.setClass(safeClasses)
    }
  }

  return {
    classTags,
    setClasses,
  }
}
