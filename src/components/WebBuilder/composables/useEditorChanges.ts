import { ref } from 'vue'

/**
 * 跟踪编辑器更改状态的 composable
 */
export default function useEditorChanges(grapes: any) {
  const hasChanges = ref(false)
  const initialContent = ref<string>('')
  const isTrackingPaused = ref(false)
  let editorRef: any = null

  const supportsDirtyCount = (editor: any) =>
    editor && typeof editor.getDirtyCount === 'function' && typeof editor.clearDirtyCount === 'function'

  /**
   * 获取编辑器内容的哈希值（用于比较）
   */
  const getContentHash = (editor: any): string => {
    if (!editor) return ''
    try {
      const html = editor.getHtml() || ''
      const css = editor.getCss() || ''
      const js = editor.getJs() || ''
      return `${html}|${css}|${js}`
    } catch {
      return ''
    }
  }

  /**
   * 检查是否有更改
   */
  const checkChanges = () => {
    if (!editorRef || isTrackingPaused.value) return
    if (supportsDirtyCount(editorRef)) {
      hasChanges.value = (editorRef.getDirtyCount?.() ?? 0) > 0
      return
    }

    const currentContent = getContentHash(editorRef)
    hasChanges.value = initialContent.value !== '' && currentContent !== initialContent.value
  }

  /**
   * 标记为已保存（重置更改状态）
   */
  const markAsSaved = () => {
    if (!editorRef) return
    initialContent.value = getContentHash(editorRef)
    editorRef.clearDirtyCount?.()
    hasChanges.value = false
  }

  const markAsChanged = () => {
    hasChanges.value = true
  }

  const pauseTracking = () => {
    isTrackingPaused.value = true
  }

  const resumeTracking = (resetBaseline = false) => {
    if (!editorRef) {
      isTrackingPaused.value = false
      return
    }

    if (resetBaseline) {
      initialContent.value = getContentHash(editorRef)
      editorRef.clearDirtyCount?.()
      hasChanges.value = false
    } else {
      checkChanges()
    }
    isTrackingPaused.value = false
  }

  /**
   * 初始化编辑器监听
   */
  const initEditor = (editor: any) => {
    editorRef = editor
    
    // 保存初始内容
    initialContent.value = getContentHash(editor)
    hasChanges.value = false

    // 监听编辑器加载完成事件（数据加载后重置状态）
    editor.on('load', () => {
      // 延迟检查，确保内容已加载
      setTimeout(() => {
        if (isTrackingPaused.value) return
        initialContent.value = getContentHash(editor)
        editor.clearDirtyCount?.()
        hasChanges.value = false
      }, 200)
    })

    // 监听所有可能触发更改的事件
    const changeEvents = supportsDirtyCount(editor)
      ? ['update']
      : [
          'component:add',
          'component:remove',
          'component:update',
          'component:update:component',
          'component:styleUpdate',
          'component:style:update',
          'style:update',
          'css:update',
          'css:add',
          'css:remove',
          'storage:store',
          'update',
        ]

    // 使用防抖来避免频繁检查
    let checkTimer: ReturnType<typeof setTimeout> | null = null
    const debouncedCheck = () => {
      if (checkTimer) {
        clearTimeout(checkTimer)
      }
      if (isTrackingPaused.value) {
        return
      }
      checkTimer = setTimeout(() => {
        checkChanges()
        checkTimer = null
      }, 300)
    }

    // 监听所有更改事件
    changeEvents.forEach((event) => {
      editor.on(event, debouncedCheck)
    })

    // 清理函数
    return () => {
      if (checkTimer) {
        clearTimeout(checkTimer)
      }
      changeEvents.forEach((event) => {
        editor.off?.(event, debouncedCheck)
      })
    }
  }

  // 如果提供了 grapes，注册初始化回调
  if (grapes) {
    grapes.onInit((editor: any) => {
      initEditor(editor)
    })
  }

  return {
    hasChanges,
    isTrackingPaused,
    markAsChanged,
    markAsSaved,
    checkChanges,
    pauseTracking,
    resumeTracking,
  }
}
