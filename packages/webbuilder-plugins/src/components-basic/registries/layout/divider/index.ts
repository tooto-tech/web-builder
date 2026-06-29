import type { Editor } from 'grapesjs'
import {
  makeNumberTrait,
  makeSelectTrait,
  makeColorPickerTrait,
} from '../../../traitFactory.js'

export const WB_DIVIDER_TYPE = 'wb-divider'

/**
 * 注册分割线组件（Elementor Divider Widget）
 * 使用 <hr> 标签，通过 traits 控制线条样式、颜色、厚度、宽度和对齐。
 */
export function registerDividerComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_DIVIDER_TYPE)) {
    return
  }

  domComponents.addType(WB_DIVIDER_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'divider') {
        return { type: WB_DIVIDER_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '分割线',
        tagName: 'hr',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        void: true,
        attributes: {
          'data-wb-component': 'divider',
        },
        style: {
          display: 'block',
          width: '100%',
          border: 'none',
          'border-top': '2px solid #e5e7eb',
          margin: '8px auto',
          'box-sizing': 'border-box',
        },
        dividerStyle: 'solid',
        dividerColor: '#e5e7eb',
        dividerThickness: 2,
        dividerWidth: 100,
        dividerAlignment: 'center',
        traits: [
          makeSelectTrait('线条样式', 'dividerStyle', [
            { value: 'solid', label: '实线' },
            { value: 'dashed', label: '虚线' },
            { value: 'dotted', label: '点线' },
            { value: 'double', label: '双线' },
          ]),
          makeColorPickerTrait('线条颜色', 'dividerColor'),
          makeNumberTrait('线条厚度 (px)', 'dividerThickness', { min: 1, max: 20, step: 1 }),
          makeNumberTrait('宽度 (%)', 'dividerWidth', { min: 10, max: 100, step: 1 }),
          makeSelectTrait('对齐方式', 'dividerAlignment', [
            { value: 'left', label: '左对齐' },
            { value: 'center', label: '居中' },
            { value: 'right', label: '右对齐' },
          ]),
        ],
      },
      init(this: any) {
        this.on(
          'change:dividerStyle change:dividerColor change:dividerThickness change:dividerWidth change:dividerAlignment',
          this.applyDividerStyles,
        )
        this.applyDividerStyles()
      },
      applyDividerStyles(this: any) {
        const style = `${this.get('dividerStyle') ?? 'solid'}`
        const color = `${this.get('dividerColor') ?? '#e5e7eb'}`
        const thickness = Math.max(1, Math.min(20, Number(this.get('dividerThickness') ?? 2)))
        const width = Math.max(10, Math.min(100, Number(this.get('dividerWidth') ?? 100)))
        const alignment = `${this.get('dividerAlignment') ?? 'center'}`

        // 通过 margin 实现左/居中/右对齐
        const marginMap: Record<string, string> = {
          left: '8px auto 8px 0',
          center: '8px auto',
          right: '8px 0 8px auto',
        }

        this.addStyle({
          border: 'none',
          'border-top': `${thickness}px ${style} ${color}`,
          width: `${width}%`,
          margin: marginMap[alignment] ?? '8px auto',
          display: 'block',
        })
      },
    },
  })
}
