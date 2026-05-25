import { shallowRef, computed, markRaw, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'

const SYMBOLS_CMD_ADD = 'symbols:add'
const SYMBOLS_CMD_REMOVE = 'symbols:remove'
const SYMBOLS_CMD_CREATE = 'symbols:create'

export interface SymbolInfo {
  component: any // GrapesJS Main Symbol component
  name: string
  instanceCount: number
}

/**
 * 全局组件（Symbol）管理 composable
 * 使用 GrapesJS 官方的 Symbols API
 * 参考: https://grapesjs.com/docs/guides/Symbols.html
 */
export default function useSymbols(grapes: any) {
  const editorRef = shallowRef<any>(null)
  // 响应式触发器，用于强制更新 symbols 列表
  const refreshTrigger = ref(0)

  /**
   * 获取所有 Main Symbols
   */
  const getMainSymbols = (): any[] => {
    if (!editorRef.value || !editorRef.value.Components) {
      return []
    }
    try {
      const symbols = editorRef.value.Components.getSymbols() || []
      return symbols
    } catch (error) {
      console.error('获取 Symbols 失败:', error)
      return []
    }
  }

  /**
   * 获取 Symbol 信息
   */
  const getSymbolInfo = (component: any) => {
    if (!editorRef.value || !editorRef.value.Components) {
      return null
    }
    try {
      return editorRef.value.Components.getSymbolInfo(component)
    } catch (error) {
      console.error('获取 Symbol 信息失败:', error)
      return null
    }
  }

  /**
   * 获取 Symbol 名称
   */
  const getSymbolName = (component: any): string => {
    // 优先使用创建 Symbol 时保存的自定义名称，避免被 GrapesJS 默认组件名覆盖。
    const name = component.get?.('customName') || component.get?.('name') || component.getName?.()
    if (name) {
      return name
    }

    // 如果组件是 Symbol，尝试从 Symbol 信息获取
    const info = getSymbolInfo(component)
    if (info && info.isMain) {
      // 已经是 Main Symbol，返回默认名称
      return 'Untitled Component'
    }

    return 'Untitled Component'
  }

  /**
   * 计算属性：所有 Main Symbols 的列表
   * 使用 refreshTrigger 来强制响应式更新
   */
  const symbols = computed<SymbolInfo[]>(() => {
    // 访问 refreshTrigger 以建立响应式依赖（必须使用值，不能只是访问）
    refreshTrigger.value

    const mainSymbols = getMainSymbols()

    const result = mainSymbols.map((component: any) => {
      const info = getSymbolInfo(component)
      const instanceCount = info?.instances?.length || 0
      const name = getSymbolName(component)
      return {
        component: markRaw(component),
        name,
        instanceCount
      }
    })

    return markRaw(result)
  })

  /**
   * 创建 Symbol（从组件创建）
   */
  const createSymbol = async (component: any, name?: string): Promise<any | null> => {
    if (!editorRef.value || !editorRef.value.Components) {
      ElMessage.error('Editor not ready')
      return null
    }

    if (!component) {
      ElMessage.error('Please select a component to create a symbol')
      return null
    }

    // 检查组件是否已经是 Symbol
    const existingInfo = getSymbolInfo(component)
    if (existingInfo?.isSymbol) {
      if (existingInfo.isMain) {
        ElMessage.warning('This component is already a Main Symbol')
        return component
      } else {
        // 如果是 Instance，获取其 Main Symbol
        ElMessage.info('This component is a Symbol instance, using its Main Symbol')
        return existingInfo.main
      }
    }

    // 获取组件名称
    let symbolName =
      name || component.getName?.() || component.get?.('name') || 'Untitled Component'

    // 如果没有提供名称，提示用户输入
    if (!name) {
      try {
        const result = await ElMessageBox.prompt('Enter symbol name', 'Create Symbol', {
          confirmButtonText: 'Create',
          cancelButtonText: 'Cancel',
          inputValue: symbolName,
          inputValidator: (value) => {
            if (!value || !value.trim()) {
              return 'Name cannot be empty'
            }
            // 检查名称是否已存在
            const existingSymbols = getMainSymbols()
            const nameExists = existingSymbols.some((sym: any) => {
              const symName = getSymbolName(sym)
              return symName === value.trim()
            })
            if (nameExists) {
              return 'This name already exists'
            }
            return true
          }
        })
        symbolName = result.value.trim()
      } catch {
        // 用户取消
        return null
      }
    }

    // 检查名称是否已存在
    const existingSymbols = getMainSymbols()
    const nameExists = existingSymbols.some((sym: any) => {
      const symName = getSymbolName(sym)
      return symName === symbolName
    })
    if (nameExists) {
      ElMessage.error('This name already exists, please use another name')
      return null
    }

    try {
      const commandResult = editorRef.value.runCommand?.(SYMBOLS_CMD_ADD, {
        component,
        label: symbolName,
      })
      const symbolMain = commandResult?.main ?? commandResult

      // 验证 Symbol 是否创建成功
      const symbolInfo = getSymbolInfo(symbolMain)
      if (!symbolInfo || !symbolInfo.isMain) {
        ElMessage.error('Failed to create symbol: Unable to verify Main Symbol')
        return null
      }

      // 设置 Symbol 名称（存储到组件的自定义属性中）
      if (symbolMain.set) {
        symbolMain.set('customName', symbolName)
        symbolMain.set('name', symbolName)
      }

      // 等待一下，确保 GrapesJS 内部状态已更新
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 触发响应式更新
      refreshSymbols()

      ElMessage.success(`Symbol "${symbolName}" created successfully`)
      return symbolMain
    } catch (error) {
      ElMessage.error('Failed to create symbol')
      console.error('创建 Symbol 失败:', error)
      return null
    }
  }

  /**
   * 删除 Symbol（删除 Main Symbol 和所有 Instances）
   */
  const deleteSymbol = async (symbolComponent: any) => {
    if (!editorRef.value || !editorRef.value.Components) {
      return
    }

    const info = getSymbolInfo(symbolComponent)
    if (!info || !info.isMain) {
      ElMessage.error('Only Main Symbol can be deleted')
      return
    }

    const symbolName = getSymbolName(symbolComponent)
    const instanceCount = info.instances?.length || 0

    try {
      await ElMessageBox.confirm(
        `Are you sure you want to delete symbol "${symbolName}"?\nThis will delete the symbol and all ${instanceCount} instance${instanceCount !== 1 ? 's' : ''}.`,
        'Delete Symbol',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      editorRef.value.runCommand?.(SYMBOLS_CMD_REMOVE, {
        symbolId: symbolComponent.getId?.(),
      })

      // 触发响应式更新
      refreshSymbols()

      ElMessage.success('Deleted successfully')
    } catch {
      // 用户取消
    }
  }

  /**
   * 分离 Symbol（将 Instance 转换为普通组件）
   */
  const detachSymbol = (component: any) => {
    if (!editorRef.value || !editorRef.value.Components) {
      return
    }

    const info = getSymbolInfo(component)
    if (!info || !info.isInstance) {
      ElMessage.warning('This component is not a Symbol instance')
      return
    }

    try {
      editorRef.value.Components.detachSymbol(component)
      ElMessage.success('Symbol detached, now you can edit it independently')
    } catch (error) {
      ElMessage.error('Failed to detach symbol')
      console.error('分离 Symbol 失败:', error)
    }
  }

  /**
   * 将 Symbol 添加到编辑器（创建新的 Instance）
   */
  const addSymbolToEditor = (symbolComponent: any) => {
    if (!editorRef.value || !editorRef.value.Components) {
      return
    }

    const info = getSymbolInfo(symbolComponent)
    if (!info || !info.isMain) {
      ElMessage.error('Can only create instances from Main Symbol')
      return
    }

    try {
      const selected = editorRef.value.getSelected?.()
      const page = editorRef.value.Pages?.getSelected?.()
      const rootTarget = page?.getMainComponent?.() || editorRef.value.getWrapper()
      const targetComponent =
        selected && selected.get?.('droppable') !== false && typeof selected.append === 'function'
          ? selected
          : rootTarget

      const targetCollection = targetComponent?.components?.()
      const index = targetCollection?.models?.length ?? 0
      const insertedInstance = editorRef.value.runCommand?.(SYMBOLS_CMD_CREATE, {
        symbol: symbolComponent,
        target: targetComponent,
        pos: { placement: 'inside', index },
      })

      if (insertedInstance) {
        editorRef.value.select?.(insertedInstance)
      }

      refreshSymbols()

      const symbolName = getSymbolName(symbolComponent)
      ElMessage.success(`Added instance of symbol "${symbolName}"`)
    } catch (error) {
      ElMessage.error('Failed to add symbol')
      console.error('添加 Symbol 失败:', error)
    }
  }

  /**
   * 刷新 Symbols 列表（触发响应式更新）
   */
  const refreshSymbols = () => {
    // 更新触发器以强制 computed 重新计算
    refreshTrigger.value++
  }

  /**
   * 初始化编辑器引用
   */
  const initEditor = (editor: any) => {
    editorRef.value = editor

    // 监听 Symbol 相关事件，自动刷新列表
    if (editor && editor.on) {
      // 监听所有 Symbol 相关事件
      const events = [
        'symbol:main:add',
        'symbol:main:update',
        'symbol:main:remove',
        'symbol:instance:remove'
      ]

      events.forEach((event) => {
        editor.on(event, () => {
          // 触发响应式更新
          refreshSymbols()
        })
      })

      editor.on('symbol:instance:add', () => {
        refreshSymbols()
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
    symbols,
    createSymbol,
    deleteSymbol,
    detachSymbol,
    addSymbolToEditor,
    getSymbolInfo,
    getSymbolName,
    refreshSymbols,
    initEditor
  }
}
