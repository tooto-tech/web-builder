import { computed, ref, type ComputedRef, type Ref } from 'vue'

export type WbStateId = '' | 'hover' | 'focus'

export interface WbStyleStateManager {
  currentState: Ref<WbStateId>
  isNormalState: ComputedRef<boolean>
  isHoverState: ComputedRef<boolean>
  isFocusState: ComputedRef<boolean>
  setState(state: WbStateId): void
}

/**
 * 管理 StyleManager 的伪类状态（normal / hover / focus）
 *
 * 与 useWbStyleManager 协同工作：
 * - 切换状态后 GrapesJS 通过 Selectors.setState 将读写路由到对应 CSS Rule
 * - useWbStyleManager 监听的 selector:state 事件会自动触发 currentStyles 重新同步
 *
 * 使用缓存模式保证全局单例，避免多个调用方之间状态不一致。
 */
export default function useWbStyleState(grapes: any): WbStyleStateManager {
  // 缓存命中（热重载 / 多处调用场景）
  if (grapes._cache.wbStyleState) {
    return grapes._cache.wbStyleState
  }

  const currentState = ref<WbStateId>('')

  const isNormalState = computed(() => currentState.value === '')
  const isHoverState  = computed(() => currentState.value === 'hover')
  const isFocusState  = computed(() => currentState.value === 'focus')

  let _editor: any = null

  function syncStyleManagerSelection(state: WbStateId): void {
    if (!_editor) return
    const selected = _editor.getSelected?.()
    if (!selected) return

    try {
      _editor.StyleManager?.select?.(selected, { state })
    } catch {
      // 降级到 SelectorManager 状态同步，避免异常中断编辑。
    }
  }

  /**
   * 切换伪类状态。
   * GrapesJS 会根据当前 state 自动将后续的样式读写路由到对应 CSS Rule。
   * 传空字符串 '' 回到默认（正常）状态。
   */
  function setState(state: WbStateId): void {
    if (!_editor) return
    currentState.value = state
    syncStyleManagerSelection(state)
    _editor.Selectors.setState(state)
  }

  grapes.onInit((editor: any) => {
    _editor = editor

    editor.on('component:selected', () => {
      syncStyleManagerSelection(currentState.value)
    })

    // 同步 GrapesJS 内部状态（撤销/重做、外部代码调用等）
    editor.on('selector:state', () => {
      const state = (editor.Selectors.getState?.() ?? '') as WbStateId
      if (currentState.value !== state) {
        currentState.value = state
      }
      syncStyleManagerSelection(state)
    })
  })

  const result: WbStyleStateManager = (grapes._cache.wbStyleState = {
    currentState,
    isNormalState,
    isHoverState,
    isFocusState,
    setState,
  })

  return result
}
