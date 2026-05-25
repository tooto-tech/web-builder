import { ref, shallowRef, markRaw } from 'vue'

export interface UseImageManagerOptions {
  getEditor: () => any
}

/**
 * 图片资源管理 composable
 */
export default function useImageManager(options: UseImageManagerOptions) {
  const { getEditor } = options

  const showAssetsDialog = ref(false)
  const imageReplacementTarget = shallowRef<any>(null)

  /**
   * 处理图片选择
   */
  const handleImageSelected = (imageUrl: string) => {
    const target = imageReplacementTarget.value

    // 检查是否是 slide 图片选择（来自 Slides Manager）
    if (target && typeof target === 'object' && target.isSlideImage && typeof target.selectCallback === 'function') {
      // 调用 slide 图片选择回调
      try {
        target.selectCallback(imageUrl)
      } catch (error) {
        console.error('[ImageManager] Error calling slide image selectCallback:', error)
      }
      imageReplacementTarget.value = null
      showAssetsDialog.value = false
      return
    }

    // 检查是否有 selectCallback（来自 image-picker trait、StylePropField 等）
    // 统一用 selectCallback 回调传递结果，不区分 isStyleProp
    if (target && typeof target === 'object' && !target.isSlideImage && typeof target.selectCallback === 'function') {
      const asset = { src: imageUrl, getSrc: () => imageUrl }
      try {
        target.selectCallback(asset)
      } catch (error) {
        console.error('[ImageManager] Error calling selectCallback:', error)
      }
      imageReplacementTarget.value = null
      showAssetsDialog.value = false
      return
    }

    if (!target) {
      // 如果没有替换目标，直接插入新图片
      const editor = getEditor()
      if (!editor) return

      try {
        const component = editor.addComponent({
          type: 'image',
          src: imageUrl,
          style: {
            width: '100%',
            height: 'auto',
          },
        })
        editor.select(component)
        showAssetsDialog.value = false
      } catch (error) {
        // 静默处理错误
      }
    } else {
      // 替换现有 GrapesJS 组件的 src 属性
      try {
        const component = target
        if (typeof component.addAttributes === 'function') {
          // 推荐方式：GrapesJS 会自动触发视图更新
          component.addAttributes({ src: imageUrl })
        } else if (typeof component.set === 'function') {
          component.set('attributes', { ...component.get?.('attributes'), src: imageUrl })
        }
        imageReplacementTarget.value = null
        showAssetsDialog.value = false
      } catch (error) {
        imageReplacementTarget.value = null
      }
    }
  }

  /**
   * 打开资源对话框（用于替换图片）
   */
  const openAssetsDialog = (target?: any) => {
    if (!target) return
    imageReplacementTarget.value = markRaw(target)
    showAssetsDialog.value = true
  }

  /**
   * 设置图片替换目标
   */
  const setImageReplacementTarget = (target: any) => {
    imageReplacementTarget.value = markRaw(target)
  }

  /**
   * 打开资源对话框并设置替换目标
   */
  const openAssetsDialogWithTarget = (target: any) => {
    imageReplacementTarget.value = markRaw(target)
    showAssetsDialog.value = true
  }

  /**
   * 关闭资源对话框
   */
  const closeAssetsDialog = () => {
    showAssetsDialog.value = false
    imageReplacementTarget.value = null
  }

  /**
   * 拦截 asset manager 的打开事件
   */
  const setupAssetManagerInterceptor = (editor: any) => {
    if (editor.AssetManager) {
      editor.AssetManager.open = (options: any) => {
        // 如果是在样式面板中打开的（通过 StylePropField），需要找到当前选中的组件
        const selected = editor.getSelected()
        if (selected) {
          const tagName = selected.get?.('tagName') || selected.tagName
          const type = selected.get?.('type') || selected.type
          if (tagName === 'img' || type === 'image') {
            // 设置替换目标
            imageReplacementTarget.value = markRaw(selected)
          } else if (options?.select) {
            // 如果不是图片组件，但需要选择图片（比如在样式面板中选择背景图）
            // 存储选择回调，在 AssetsModal 中选择图片后调用
            ;(imageReplacementTarget.value as any) = {
              isStyleProp: true,
              selectCallback: options.select,
            }
          }
        } else if (options?.select) {
          // 没有选中组件，但需要选择图片（比如在样式面板中选择背景图）
          ;(imageReplacementTarget.value as any) = {
            isStyleProp: true,
            selectCallback: options.select,
          }
        }
        // 打开 Assets 弹窗
        showAssetsDialog.value = true
        // 不调用原始的 open 方法，阻止默认的模态框
      }
    }
  }

  /**
   * 处理组件双击事件（用于图片替换）
   * wb-image 已在 view 的 dblclick 中通过 model.openAssetsDialog() 处理，不在此重复处理
   */
  const handleComponentDblclick = (component: any) => {
    const tagName = component.get?.('tagName') || component.tagName
    const type = component.get?.('type') || component.type
    // wb-image 自己处理 dblclick（view.onDblClick → model.openAssetsDialog），跳过
    if (type === 'wb-image') return
    if (tagName === 'img' || type === 'image') {
      imageReplacementTarget.value = markRaw(component)
      showAssetsDialog.value = true
    }
  }

  /**
   * 判断 GrapesJS 组件是否为图片组件
   */
  const isImageComponent = (component: any): boolean => {
    if (!component) return false
    const type = component.get?.('type') || component.type
    const tagName = component.get?.('tagName') || component.tagName
    return type === 'wb-image' || type === 'image' || tagName === 'img'
  }

  /**
   * 以当前选中的图片组件为目标打开 Assets 对话框
   */
  const openAssetsDialogForSelected = (getEditor: () => any) => {
    const editor = getEditor()
    if (editor) {
      const selected = editor.getSelected?.()
      if (selected && isImageComponent(selected)) {
        imageReplacementTarget.value = markRaw(selected)
        showAssetsDialog.value = true
      }
    }
  }

  return {
    showAssetsDialog,
    imageReplacementTarget,
    handleImageSelected,
    openAssetsDialog,
    closeAssetsDialog,
    setupAssetManagerInterceptor,
    handleComponentDblclick,
    setImageReplacementTarget,
    openAssetsDialogWithTarget,
    openAssetsDialogForSelected
  }
}
