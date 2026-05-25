import type { Editor } from 'grapesjs'
import { makeNumberTrait, makeSelectTrait, UNIT_OPTIONS_PX_VH_REM } from '@/components/WebBuilder/utils/traitFactory'

export const WB_SPACER_TYPE = 'wb-spacer'

/**
 * 注册间距组件（Elementor Spacer Widget）
 * 用于在布局中插入可配置高度的空白区域。
 */
export function registerSpacerComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_SPACER_TYPE)) {
    return
  }

  domComponents.addType(WB_SPACER_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'spacer') {
        return { type: WB_SPACER_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '间距',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'spacer',
        },
        style: {
          display: 'block',
          width: '100%',
          height: '50px',
        },
        spacerHeight: 50,
        spacerHeightUnit: 'px',
        traits: [
          makeNumberTrait('高度', 'spacerHeight', { min: 0, max: 1000, step: 1 }),
          makeSelectTrait('单位', 'spacerHeightUnit', UNIT_OPTIONS_PX_VH_REM),
        ],
      },
      init(this: any) {
        this.on('change:spacerHeight change:spacerHeightUnit', this.applySpacerStyles)
        this.applySpacerStyles()
      },
      applySpacerStyles(this: any) {
        const height = Math.max(0, Number(this.get('spacerHeight') ?? 50))
        const unit = `${this.get('spacerHeightUnit') ?? 'px'}`
        this.addStyle({ height: `${height}${unit}` })
      },
    },
  })
}
