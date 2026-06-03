import { buildWidthStyles } from '../../../styleHelpers.js'
import { widthTraits } from '../../shared/sharedTraits.js'
import type { Editor } from 'grapesjs'

export const WB_LAYOUT_BASE_TYPE = 'wb-layout-base'

/**
 * 注册布局基础类型（抽象基类，不直接用于画布）
 * container / grid 通过 extend: 'wb-layout-base' 继承共享的属性默认值与方法
 *
 * 背景和最小高度属性已迁移到 StyleManager（wb-layout / wb-background sector），
 * 此处仅保留宽度相关的 trait 与方法。
 */
export function registerLayoutBase(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_LAYOUT_BASE_TYPE)) return

  domComponents.addType(WB_LAYOUT_BASE_TYPE, {
    model: {
      defaults: {
        tagName: 'div',
        draggable: '*',
        droppable: '*',
        selectable: true,
        stylable: true,
        // 宽度
        contentWidth: 'full',
        boxedWidth: 1280,
        widthValue: 100,
        widthUnit: '%',
        manualMaxWidth: '',
        traits: [...widthTraits],
      },
      handleWidthTraitChange(this: any) {
        if (this.get?.('manualMaxWidth')) {
          this.set?.('manualMaxWidth', '', { silent: true })
        }
        this.applyWidthStyles()
      },
      applyWidthStyles(this: any) {
        this.addStyle(buildWidthStyles(this))
      },
    },
  })
}
