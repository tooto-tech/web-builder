import { watch, nextTick, onBeforeUnmount } from 'vue'
import { useSelectedComponent } from './index'
import { getTraitType } from '../utils/traitHelpers'

/**
 * 管理自定义 traits 渲染的 composable
 */
export default function useCustomTraits(grapes: any, editorRef: any) {
  const selected = useSelectedComponent(grapes)
  const customTraitRefs = new Map<any, HTMLElement>() // 存储自定义trait的容器引用
  const getSelectedComponent = () =>
    selected.getRawComponent?.() ?? selected.component?._model ?? selected.component
  const getSelectedCid = () => {
    const comp = getSelectedComponent()
    return comp?.cid ?? null
  }

  /**
   * 设置自定义 Trait（使用 GrapesJS 的 TraitManager 渲染）
   */
  const setupCustomTrait = async (el: any, trait: any) => {
    if (!el || !trait || !editorRef.value) return

    await nextTick()

    const component = getSelectedComponent()
    if (!component) return

    // 如果已经设置过，先清理
    if (customTraitRefs.has(trait)) {
      const oldEl = customTraitRefs.get(trait)
      if (oldEl && oldEl.parentNode) {
        oldEl.innerHTML = ''
      }
    }

    customTraitRefs.set(trait, el)

    try {
      const traitType = getTraitType(trait)
      
      // 优先检查 TraitManager 中是否有我们注册的自定义类型
      const tm = editorRef.value.TraitManager
      if (!tm) {
        console.error('[CustomTrait] TraitManager not available')
        return
      }
      
      const traitTypeDef = tm.getType(traitType)
      
      // 尝试从 traitTypeDef 获取 createInput
      // 注意：tm.getType() 返回的可能是 TraitView 类，而不是我们注册的对象
      // 我们需要检查它是否有我们需要的静态方法，或者尝试实例化
      let createInputFn: (() => HTMLElement) | undefined
      let onUpdateFn: ((params: any) => void) | undefined

      if (traitTypeDef) {
        // 检查 traitTypeDef 是否有 createInput（可能是静态方法或 prototype 上的方法）
        if (typeof traitTypeDef === 'function') {
          // GrapesJS tm.getType() 返回 Backbone View 类，方法在 prototype 上
          if (typeof traitTypeDef.prototype?.createInput === 'function') {
            createInputFn = traitTypeDef.prototype.createInput
            onUpdateFn = traitTypeDef.prototype.onUpdate
          } else if (typeof (traitTypeDef as any).createInput === 'function') {
            createInputFn = (traitTypeDef as any).createInput
            onUpdateFn = (traitTypeDef as any).onUpdate
          }
        } else if (typeof traitTypeDef === 'object') {
          // 如果是对象，直接访问
          if (typeof traitTypeDef.createInput === 'function') {
            createInputFn = traitTypeDef.createInput
            onUpdateFn = traitTypeDef.onUpdate
          }
        }
      }

      const traitTypeContext =
        traitTypeDef && typeof traitTypeDef === 'object'
          ? traitTypeDef
          : typeof traitTypeDef === 'function'
            ? traitTypeDef.prototype
            : undefined

      // 如果找到了 createInput 函数，使用它
      if (createInputFn) {
        try {
          // 调用 createInput 创建输入元素
          const createInputParams = {
            trait,
            component,
          }
          const inputEl = traitTypeContext
            ? createInputFn.call(traitTypeContext, createInputParams)
            : createInputFn(createInputParams)
          
          if (inputEl && inputEl.nodeType === Node.ELEMENT_NODE) {
            // 清空容器并添加输入元素
            el.innerHTML = ''
            el.appendChild(inputEl)

            // 调用 onUpdate 初始化
            if (onUpdateFn && typeof onUpdateFn === 'function') {
              try {
                const updateParams = {
                  elInput: inputEl,
                  component,
                  trait,
                }
                // 确保 onUpdate 方法能够访问 traitTypeDef 的上下文
                if (traitTypeContext) onUpdateFn.call(traitTypeContext, updateParams)
                else onUpdateFn(updateParams)
              } catch (updateError) {
                console.warn('[CustomTrait] onUpdate failed:', updateError)
                if (process.env.NODE_ENV === 'development') {
                  console.error('[CustomTrait] onUpdate error details:', updateError)
                }
              }
            }
          } else {
            console.warn(`[CustomTrait] createInput did not return a valid element for trait type "${traitType}"`)
            if (process.env.NODE_ENV === 'development') {
              console.log('[CustomTrait] createInputFn result:', inputEl)
              console.log('[CustomTrait] inputEl type:', typeof inputEl)
            }
          }
        } catch (createError) {
          console.error('[CustomTrait] createInput failed:', createError)
          if (process.env.NODE_ENV === 'development') {
            console.error('[CustomTrait] createInput error details:', createError)
          }
        }
      } else {
        // 如果找不到 createInput，尝试使用 trait 的 view（如果存在）
        const traitModel = trait._model ?? trait
        const traitView = traitModel.view ?? trait.view
        
        if (traitView) {
          // 如果 view 已经有 el，直接使用
          if (traitView.el) {
            if (traitView.el.parentNode && traitView.el.parentNode !== el) {
              traitView.el.parentNode.removeChild(traitView.el)
            }
            if (traitView.el.parentNode !== el) {
              el.innerHTML = ''
              el.appendChild(traitView.el)
            }
            return
          }
          
          // 如果 view 有 render 方法，调用它来创建 el
          if (typeof traitView.render === 'function') {
            el.innerHTML = ''
            try {
              traitView.render()
              if (traitView.el) {
                el.appendChild(traitView.el)
              }
            } catch (renderError) {
              console.warn('[CustomTrait] View render failed:', renderError)
            }
            return
          }
        }
        
        console.warn(`[CustomTrait] Could not find createInput method for trait type "${traitType}"`)
        if (process.env.NODE_ENV === 'development') {
          console.log('[CustomTrait] TraitTypeDef:', traitTypeDef)
          console.log('[CustomTrait] TraitTypeDef type:', typeof traitTypeDef)
          console.log('[CustomTrait] TraitTypeDef keys:', Object.keys(traitTypeDef || {}))
          console.log('[CustomTrait] Trait:', trait)
        }
      }
    } catch (error) {
      console.error('[CustomTrait] Failed to setup custom trait:', error)
      if (process.env.NODE_ENV === 'development') {
        console.error('[CustomTrait] Error details:', {
          traitType: getTraitType(trait),
          trait: trait,
          error: error
        })
      }
      el.innerHTML = '<div style="text-align: center; color: #dc2626; padding: 20px; font-size: 12px;">Error loading trait</div>'
    }
  }

  // 监听组件变化，重新渲染自定义 traits
  watch(
    getSelectedCid,
    async () => {
      await nextTick()
      // 重新渲染所有自定义 traits
      for (const [trait, el] of customTraitRefs.entries()) {
        if (el && el.parentNode) {
          setupCustomTrait(el, trait)
        }
      }
    },
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    customTraitRefs.clear()
  })

  return {
    setupCustomTrait,
  }
}
