import { ref, shallowRef } from 'vue'
import { registerAllComponents } from './useComponentRegistration'
import { setupCanvasDropZone } from '../utils/canvasDropZone'
import {
  applyPendingCloneCssRules,
  cleanupRedundantProtectedCssRules,
  ensureComponentStyles,
  installComponentCloneCssPatch,
  restoreSymbolStyles,
  snapshotSymbolStyles,
  syncMountedComponentStyles,
} from '../utils/editorHelpers'
import { useFontManager } from './useFontManager'
import { getEditorRuntime } from './useEditorRuntime'

export interface UseEditorInitOptions {
  grapes: any
  onLoad?: (editor: any) => void | Promise<void>
  onFrameLoad?: () => void
  onComponentDblclick?: (component: any) => void
  setupAssetManager?: (editor: any) => void
}

/**
 * 编辑器初始化 composable
 */
export default function useEditorInit(options: UseEditorInitOptions) {
  const { grapes, onLoad, onFrameLoad, onComponentDblclick, setupAssetManager } = options

  const editorRef = shallowRef<any>(null)
  const isEditorReady = ref(false)
  const hasEditorLoad = ref(false)
  const hasFrameLoad = ref(false)

  
  // Canvas drop zone cleanup 函数
  let dropZoneCleanup: (() => void) | null = null

  // 存储编辑器事件处理函数引用，以便清理
  const editorEventHandlers = {
    load: null as ((...args: any[]) => void) | null,
    canvasFrameLoad: null as ((...args: any[]) => void) | null,
    componentDblclick: null as ((...args: any[]) => void) | null,
    componentAdd: null as ((...args: any[]) => void) | null,
    componentRemoveBefore: null as ((...args: any[]) => void) | null,
    componentRemove: null as ((...args: any[]) => void) | null,
  }

  let pendingSymbolStyleRestore = false
  const pendingAddedComponents = new Set<any>()
  let componentAddFlushQueued = false
  let disposed = false

  // Ready 定时器
  let readyTimer: ReturnType<typeof setTimeout> | null = null

  const READY_DELAY_MS = 150 // 保留轻微缓冲以避免闪烁，但不再人为拉长首屏等待

  const applyCanvasFrameDocumentReset = (editor: any, eventData?: any) => {
    const frame = eventData?.frame ?? eventData
    const frameDoc: Document | null | undefined =
      frame?.view?.el?.contentDocument ??
      frame?.view?.getDocument?.() ??
      editor?.Canvas?.getDocument?.()

    if (!frameDoc) return

    const styleId = 'wb-canvas-frame-reset'
    if (!frameDoc.getElementById(styleId)) {
      const styleEl = frameDoc.createElement('style')
      styleEl.id = styleId
      styleEl.textContent = `
        html {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          scrollbar-gutter: auto;
          scrollbar-width: auto;
          -ms-overflow-style: auto;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100% !important;
          overflow: visible !important;
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          width: auto;
          height: auto;
        }
        html::-webkit-scrollbar-track,
        body::-webkit-scrollbar-track,
        html::-webkit-scrollbar-thumb,
        body::-webkit-scrollbar-thumb {
          background: initial;
        }
      `
      frameDoc.head.appendChild(styleEl)
    }

    const htmlEl = frameDoc.documentElement
    const bodyEl = frameDoc.body

    if (htmlEl) {
      htmlEl.style.margin = '0'
      htmlEl.style.padding = '0'
      htmlEl.style.overflowX = 'hidden'
      htmlEl.style.overflowY = 'auto'
      ;(htmlEl.style as CSSStyleDeclaration).scrollbarGutter = 'auto'
    }

    if (bodyEl) {
      bodyEl.style.margin = '0'
      bodyEl.style.padding = '0'
      bodyEl.style.minHeight = '100%'
      bodyEl.style.overflow = 'visible'
    }
  }

  const walkComponentTree = (component: any, visitor: (component: any) => void) => {
    if (!component) return

    visitor(component)

    const children = component?.components?.()?.models ?? []
    children.forEach((child: any) => walkComponentTree(child, visitor))
  }

  const componentMatchesRoot = (root: any, target: any) => {
    if (!root || !target) return false
    let current = target
    while (current) {
      if (current === root) return true
      current = current?.parent?.()
    }
    return false
  }

  const getPendingAddRoots = (): any[] => {
    const components = Array.from(pendingAddedComponents).filter(Boolean)
    const componentSet = new Set(components)

    return components.filter((component) => {
      let parent = component?.parent?.()
      while (parent) {
        if (componentSet.has(parent)) {
          return false
        }
        parent = parent?.parent?.()
      }
      return true
    })
  }

  const flushPendingComponentAdds = (editor: any) => {
    if (disposed || !editor || editorRef.value !== editor) {
      pendingAddedComponents.clear()
      componentAddFlushQueued = false
      return
    }

    componentAddFlushQueued = false

    if (!pendingAddedComponents.size) return

    const roots = getPendingAddRoots()
    pendingAddedComponents.clear()

    const syncedTypes = new Set<string>()
    let cloneCssApplied = false
    roots.forEach((root) => {
      cloneCssApplied = applyPendingCloneCssRules(editor, root) || cloneCssApplied
      walkComponentTree(root, (component: any) => {
        const type = `${component?.get?.('type') ?? ''}`.trim()
        if (!type || syncedTypes.has(type)) return
        syncedTypes.add(type)
        ensureComponentStyles(editor, component)
      })
    })

    cleanupRedundantProtectedCssRules(editor)
    restoreSymbolStyles(editor)

    if (cloneCssApplied) {
      const selected = editor.getSelected?.()
      const selectedInRoots = selected && roots.some((root) => componentMatchesRoot(root, selected))
      if (selectedInRoots && typeof editor.trigger === 'function') {
        editor.trigger('component:styleUpdate', selected)
      }
    }
  }

  const scheduleComponentAddFlush = (editor: any, component: any) => {
    if (!component) return

    pendingAddedComponents.add(component)
    if (componentAddFlushQueued) return

    componentAddFlushQueued = true
    Promise.resolve().then(() => flushPendingComponentAdds(editor))
  }

  /**
   * 更新编辑器就绪状态
   */
  const updateReady = () => {
    // 只有当数据加载完成且画布加载完成时，才延迟显示编辑器
    if (hasEditorLoad.value && hasFrameLoad.value) {
      // 如果已经就绪，不再重复设置
      if (isEditorReady.value) {
        return
      }
      // 清理之前的定时器
      if (readyTimer) {
        clearTimeout(readyTimer)
        readyTimer = null
      }
      // 确保 isEditorReady 在延迟期间保持为 false（显示 loading）
      isEditorReady.value = false
      // 短暂缓冲后显示编辑器，避免首屏闪烁
      readyTimer = setTimeout(() => {
        isEditorReady.value = true
        readyTimer = null
      }, READY_DELAY_MS)
    }
  }

  /**
   * 初始化编辑器
   */
  const initEditor = () => {
    grapes.onInit((editor: any) => {
      disposed = false
      editorRef.value = editor

      // 禁用 GrapesJS 的默认存储（使用后端接口存储）
      if (editor.Storage) {
        editor.Storage.setCurrent?.('')
      }

      // 注册所有自定义组件类型和 trait 类型
      registerAllComponents(editor)
      installComponentCloneCssPatch(editor)

      // 初始化字体管理器
      const fontManager = useFontManager()
      fontManager.setupEditor(editor)

      // 设置 asset manager 拦截器
      if (setupAssetManager) {
        setupAssetManager(editor)
      }

      // 添加 Poppins 字体
      const fontProp = editor.StyleManager?.getProperty?.('typography', 'font-family')
      if (fontProp?.addOption) {
        const options = fontProp.getOptions?.() ?? []
        const hasPoppins = options.some((opt: any) => {
          const value = fontProp.getOptionId?.(opt) ?? opt?.value ?? opt
          return `${value}`.toLowerCase().includes('poppins')
        })
        if (!hasPoppins) {
          fontProp.addOption({ id: 'Poppins', label: 'Poppins' })
        }
      }

      // 定义事件处理函数
      editorEventHandlers.load = async () => {
        if (disposed || editorRef.value !== editor) return

        // 如果是手动加载项目，跳过自动加载服务器数据
        if (getEditorRuntime(editor).isManualLoad) {
          syncMountedComponentStyles(editor)
          cleanupRedundantProtectedCssRules(editor)
          restoreSymbolStyles(editor)
          hasEditorLoad.value = true
          updateReady()
          return
        }

        // 确保 hasEditorLoad 为 false，表示正在加载数据
        hasEditorLoad.value = false
        
        try {
          // 等待数据加载完成（包括接口调用）
          if (onLoad) {
            await onLoad(editor)
          }
        } catch (error) {
          // 即使加载失败，也继续执行，避免一直 loading
        }

        if (disposed || editorRef.value !== editor) return

        syncMountedComponentStyles(editor)
        cleanupRedundantProtectedCssRules(editor)
        restoreSymbolStyles(editor)

        // 数据加载完成后（无论成功或失败），设置 hasEditorLoad 为 true，触发 updateReady
        hasEditorLoad.value = true
        updateReady()
      }

      editorEventHandlers.canvasFrameLoad = (eventData?: any) => {
        if (disposed || editorRef.value !== editor) return
        hasFrameLoad.value = true
        applyCanvasFrameDocumentReset(editor, eventData)
        // 设置 canvas 内部 drop zone
        dropZoneCleanup?.()
        dropZoneCleanup = setupCanvasDropZone(editor)
        if (onFrameLoad) {
          onFrameLoad()
        }
        // 检查是否可以更新就绪状态
        updateReady()
      }

      editorEventHandlers.componentDblclick = (component: any) => {
        if (disposed || editorRef.value !== editor) return
        if (onComponentDblclick) {
          onComponentDblclick(component)
        }
      }

      editorEventHandlers.componentAdd = (component: any) => {
        if (disposed || editorRef.value !== editor) return
        if (getEditorRuntime(editor).isManualLoad) return
        scheduleComponentAddFlush(editor, component)
      }

      editorEventHandlers.componentRemoveBefore = () => {
        if (disposed || editorRef.value !== editor) return
        if (pendingSymbolStyleRestore) return
        snapshotSymbolStyles(editor)
        pendingSymbolStyleRestore = true
      }

      editorEventHandlers.componentRemove = () => {
        if (disposed || editorRef.value !== editor) return
        if (!pendingSymbolStyleRestore) return

        Promise.resolve().then(() => {
          if (disposed || editorRef.value !== editor) {
            pendingSymbolStyleRestore = false
            return
          }
          syncMountedComponentStyles(editor)
          cleanupRedundantProtectedCssRules(editor)
          restoreSymbolStyles(editor)
          pendingSymbolStyleRestore = false
        })
      }

      // 注册事件监听器
      editor.on('load', editorEventHandlers.load)
      editor.on('canvas:frame:load', editorEventHandlers.canvasFrameLoad)
      editor.on('component:dblclick', editorEventHandlers.componentDblclick)
      editor.on('component:add', editorEventHandlers.componentAdd)
      editor.on('component:remove:before', editorEventHandlers.componentRemoveBefore)
      editor.on('component:remove', editorEventHandlers.componentRemove)
    })
  }

  /**
   * 清理编辑器事件监听器
   */
  const cleanup = () => {
    disposed = true

    // 清理 canvas drop zone
    dropZoneCleanup?.()
    dropZoneCleanup = null

    // 清理 ready 定时器
    if (readyTimer) {
      clearTimeout(readyTimer)
      readyTimer = null
    }

    pendingAddedComponents.clear()
    componentAddFlushQueued = false

    // 清理编辑器事件监听器
    const currentEditor = editorRef.value
    if (currentEditor) {
      getEditorRuntime(currentEditor).cleanup()
    }
    if (currentEditor && typeof currentEditor.off === 'function') {
      try {
        if (editorEventHandlers.load) {
          currentEditor.off('load', editorEventHandlers.load)
        }
        if (editorEventHandlers.canvasFrameLoad) {
          currentEditor.off('canvas:frame:load', editorEventHandlers.canvasFrameLoad)
        }
        if (editorEventHandlers.componentDblclick) {
          currentEditor.off('component:dblclick', editorEventHandlers.componentDblclick)
        }
        if (editorEventHandlers.componentAdd) {
          currentEditor.off('component:add', editorEventHandlers.componentAdd)
        }
        if (editorEventHandlers.componentRemoveBefore) {
          currentEditor.off('component:remove:before', editorEventHandlers.componentRemoveBefore)
        }
        if (editorEventHandlers.componentRemove) {
          currentEditor.off('component:remove', editorEventHandlers.componentRemove)
        }
      } catch (error) {
        // 静默处理
      }
    }

    pendingSymbolStyleRestore = false
    hasEditorLoad.value = false
    hasFrameLoad.value = false
    isEditorReady.value = false
    editorRef.value = null
  }

  // 初始化编辑器
  initEditor()

  return {
    editorRef,
    isEditorReady,
    hasEditorLoad,
    hasFrameLoad,
    cleanup,
  }
}
