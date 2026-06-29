import { WB_CONTAINER_TYPE } from '../container/index.js'
import { toNumber } from '../../../styleHelpers.js'
import { injectCanvasStyleOnce } from '../../../injectStyle.js'
import { widthTraits } from '../../shared/sharedTraits.js'
import { WB_LAYOUT_BASE_TYPE } from '../layoutBase/index.js'
import { defineGrapesTraits } from '../../../traitFactory.js'
import type { Editor } from 'grapesjs'

export const WB_GRID_TYPE = 'wb-grid'

/**
 * 注册网格组件（参考 Elementor Grid Container）
 *
 * grid 布局属性（grid-auto-flow、justify-items、align-items、gap）
 * 和背景属性已迁移到 StyleManager（wb-layout / wb-background sector），
 * 初始值通过 defaults.style 提供。
 * Traits 保留：宽度、grid-template 列/行计算、showGridOutline。
 */
export function registerGridComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_GRID_TYPE)) {
    return
  }

  // 注入编辑器辅助线样式（仅在 canvas iframe 内生效，不会输出到导出 HTML）
  injectCanvasStyleOnce(editor, 'wb-grid-outline', `
    [data-wb-component="grid"][data-show-outline="true"] {
      outline: 1px dashed #d8b4fe;
    }
  `)

  domComponents.addType(WB_GRID_TYPE, {
    extend: WB_LAYOUT_BASE_TYPE,
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'grid') {
        return { type: WB_GRID_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '网格',
        tagName: 'div',
        draggable: '*',
        droppable: '*',
        selectable: true,
        stylable: true,
        attributes: {
          'data-wb-component': 'grid',
          'data-show-outline': 'true',
        },
        style: {
          display: 'grid',
          'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
          'column-gap': '16px',
          'row-gap': '16px',
          'min-height': '0',
          width: '100%',
          'box-sizing': 'border-box',
          padding: '0',
          'background-color': '',
        },
        components: [
          {
            type: WB_CONTAINER_TYPE,
            style: {
              padding: '0',
              'min-height': '0',
              'background-color': '',
            },
          },
          {
            type: WB_CONTAINER_TYPE,
            style: {
              padding: '0',
              'min-height': '0',
              'background-color': '',
            },
          },
        ],
        // 网格专属属性
        showGridOutline: true,
        gridColumns: 3,
        gridColumnsUnit: 'fr',
        gridColumnsTemplate: '1fr 1fr 1fr',
        gridRows: 1,
        gridRowsUnit: 'fr',
        gridRowsTemplate: '1fr 1fr',
        manualGridTemplateColumns: '',
        manualGridTemplateRows: '',
        traits: defineGrapesTraits([
          ...widthTraits,
          {
            type: 'select',
            label: '网格模式',
            name: 'gridMode',
            changeProp: true,
            options: [
              { value: 'fixed', label: '固定列' },
              { value: 'auto-fit', label: '自适应列' },
            ],
          },
          {
            type: 'checkbox',
            label: '网格轮廓',
            name: 'showGridOutline',
            changeProp: true,
          },
          {
            type: 'number',
            label: '列数',
            name: 'gridColumns',
            min: 1,
            max: 12,
            step: 1,
            changeProp: true,
            ui: { widget: 'slider', inlineUnit: 'gridColumnsUnit' },
          },
          {
            type: 'select',
            label: '列数单位',
            name: 'gridColumnsUnit',
            changeProp: true,
            options: [
              { value: 'fr', label: 'fr' },
              { value: 'custom', label: '✎' },
            ],
          },
          {
            type: 'text',
            label: '列模板',
            name: 'gridColumnsTemplate',
            changeProp: true,
            placeholder: '例如：1fr 1fr 1fr',
            ui: { inlineUnit: 'gridColumnsUnit' },
          },
          {
            type: 'number',
            label: '行数',
            name: 'gridRows',
            min: 1,
            max: 12,
            step: 1,
            changeProp: true,
            ui: { widget: 'slider', inlineUnit: 'gridRowsUnit' },
          },
          {
            type: 'select',
            label: '行数单位',
            name: 'gridRowsUnit',
            changeProp: true,
            options: [
              { value: 'fr', label: 'fr' },
              { value: 'custom', label: '✎' },
            ],
          },
          {
            type: 'text',
            label: '行模板',
            name: 'gridRowsTemplate',
            changeProp: true,
            placeholder: '例如：auto 1fr',
            ui: { inlineUnit: 'gridRowsUnit' },
          },
        ]),
      },
      init(this: any) {
        this.on(
          'change:contentWidth change:boxedWidth change:widthValue change:widthUnit',
          this.handleWidthTraitChange,
        )
        this.on(
          'change:gridColumns change:gridColumnsUnit change:gridColumnsTemplate',
          this.handleGridColumnsTraitChange,
        )
        this.on(
          'change:gridRows change:gridRowsUnit change:gridRowsTemplate',
          this.handleGridRowsTraitChange,
        )
        this.on(
          'change:showGridOutline',
          this.applyGridStyles,
        )
        this.applyGridStyles()
      },
      handleGridColumnsTraitChange(this: any) {
        if (this.get?.('manualGridTemplateColumns')) {
          this.set?.('manualGridTemplateColumns', '', { silent: true })
        }
        this.applyGridStyles()
      },
      handleGridRowsTraitChange(this: any) {
        if (this.get?.('manualGridTemplateRows')) {
          this.set?.('manualGridTemplateRows', '', { silent: true })
        }
        this.applyGridStyles()
      },
      applyGridStyles(this: any) {
        const gridColumns = Math.max(1, Math.min(12, toNumber(this.get('gridColumns'), 3)))
        const gridColumnsUnit = `${this.get('gridColumnsUnit') || 'fr'}`
        const gridColumnsTemplateInput = `${this.get('gridColumnsTemplate') || ''}`.trim()
        const gridRows = Math.max(1, Math.min(12, toNumber(this.get('gridRows'), 2)))
        const gridRowsUnit = `${this.get('gridRowsUnit') || 'fr'}`
        const gridRowsTemplateInput = `${this.get('gridRowsTemplate') || ''}`.trim()
        const manualGridTemplateColumns = `${this.get('manualGridTemplateColumns') || ''}`.trim()
        const manualGridTemplateRows = `${this.get('manualGridTemplateRows') || ''}`.trim()
        const showGridOutline = `${this.get('showGridOutline')}` === 'true' || this.get('showGridOutline') === true

        const templateColumns =
          manualGridTemplateColumns
            ? manualGridTemplateColumns
            : gridColumnsUnit === 'custom' && gridColumnsTemplateInput
            ? gridColumnsTemplateInput
            : `repeat(${gridColumns}, minmax(0, 1fr))`
        const templateRows =
          manualGridTemplateRows
            ? manualGridTemplateRows
            : gridRowsUnit === 'custom' && gridRowsTemplateInput
            ? gridRowsTemplateInput
            : `repeat(${gridRows}, minmax(0, 1fr))`

        this.addStyle({
          'grid-template-columns': templateColumns,
          'grid-template-rows': templateRows,
        })
        this.applyWidthStyles()
        this.addAttributes({ 'data-show-outline': showGridOutline ? 'true' : 'false' })
      },
    },
  })
}
