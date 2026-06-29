import type { Editor } from 'grapesjs'
import { defineGrapesTraits } from '../../../traitFactory.js'

export const WB_TEXT_EDITOR_TYPE = 'wb-text-editor'

const TEXT_EDITOR_CSS = `
  .wb-text-editor--dropcap > p:first-child::first-letter{
    float:left;
    font-size:3em;
    line-height:1;
    font-weight:700;
    margin-right:8px;
  }
`

/**
 * 注册文本编辑器组件（参考 Elementor Text Editor）
 */
export function registerTextEditorComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_TEXT_EDITOR_TYPE)) {
    return
  }

  domComponents.addType(WB_TEXT_EDITOR_TYPE, {
    extend: 'text',
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'text-editor') {
        return { type: WB_TEXT_EDITOR_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '文本编辑器',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: true,
        stylable: true,
        attributes: {
          'data-wb-component': 'text-editor',
        },
        styles: TEXT_EDITOR_CSS,
        style: {
          color: '#374151',
          'font-size': '16px',
          'line-height': '1.8',
          margin: '0',
        },
        editorContent:
          '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.</p>',
        dropCap: false,
        columnsCount: 1,
        columnGap: 32,
        columnGapUnit: 'px',
        components:
          '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.</p>',
        traits: defineGrapesTraits([
          {
            type: 'textarea',
            label: '文本内容',
            name: 'editorContent',
            changeProp: true,
          },
          {
            type: 'checkbox',
            label: '首字下沉',
            name: 'dropCap',
            changeProp: true,
          },
          {
            type: 'select',
            label: '列数',
            name: 'columnsCount',
            changeProp: true,
            options: [
              { value: 1, label: '默认' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
            ],
          },
          {
            type: 'number',
            label: '列间距',
            name: 'columnGap',
            min: 0,
            max: 200,
            step: 1,
            changeProp: true,
          },
          {
            type: 'select',
            label: '列间距单位',
            name: 'columnGapUnit',
            changeProp: true,
            options: [
              { value: 'px', label: 'px' },
              { value: 'em', label: 'em' },
              { value: 'rem', label: 'rem' },
            ],
          },
        ]),
      },
      init(this: any) {
        this._syncingEditorContent = false
        this.on('change:editorContent', this.applyEditorContent)
        this.on('change:dropCap change:columnsCount change:columnGap change:columnGapUnit', this.applyTextLayoutStyles)
        this.on('change:components', this.syncEditorContentFromCanvas)
        // 以子节点（components）为数据源同步 editorContent，而非反向覆盖子节点。
        // 避免加载时因 editorContent 未被保存（默认值不序列化）而覆盖已正确还原的子节点内容。
        // 新建组件时两者均为默认值，此调用无副作用。
        this.syncEditorContentFromCanvas()
        this.applyTextLayoutStyles()
      },
      getInnerHtml(this: any) {
        const children = this.components?.()
        if (!children?.forEach) return ''
        let html = ''
        children.forEach((child: any) => {
          html += child?.toHTML?.() ?? ''
        })
        return html
      },
      syncEditorContentFromCanvas(this: any) {
        if (this._syncingEditorContent) return
        const html = this.getInnerHtml()
        if (html !== `${this.get('editorContent') ?? ''}`) {
          this._syncingEditorContent = true
          this.set('editorContent', html)
          this._syncingEditorContent = false
        }
      },
      applyEditorContent(this: any) {
        if (this._syncingEditorContent) return
        const nextHtml = `${this.get('editorContent') ?? ''}`
        const currentHtml = this.getInnerHtml()
        if (nextHtml === currentHtml) return

        this._syncingEditorContent = true
        this.components(nextHtml)
        this.view?.render?.()
        this._syncingEditorContent = false
      },
      applyTextLayoutStyles(this: any) {
        const toNumber = (value: unknown, fallback: number) => {
          const num = Number(value)
          return Number.isFinite(num) ? num : fallback
        }
        const columnsCount = Math.max(1, Math.min(4, toNumber(this.get('columnsCount'), 1)))
        const columnGap = Math.max(0, toNumber(this.get('columnGap'), 32))
        const columnGapUnit = `${this.get('columnGapUnit') || 'px'}`
        const dropCap = this.get('dropCap') === true || `${this.get('dropCap')}` === 'true'

        this.addStyle({
          'column-count': `${columnsCount}`,
          'column-gap': `${columnGap}${columnGapUnit}`,
        })

        if (dropCap) {
          this.addClass?.('wb-text-editor--dropcap')
        } else {
          this.removeClass?.('wb-text-editor--dropcap')
        }
      },
    },
  })
}
