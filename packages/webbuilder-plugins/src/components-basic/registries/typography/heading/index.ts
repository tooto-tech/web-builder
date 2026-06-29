import type { Editor } from 'grapesjs'
import { makeSelectTrait } from '../../../traitFactory.js'

export const WB_HEADING_TYPE = 'wb-heading'

/**
 * 注册标题组件
 * - 继承 GrapesJS 内置 text 类型，支持双击直接在画布内联编辑文本
 * - 属性面板只保留 HTML 标签（H1-H6）选择，不再有文本内容 trait
 */
export function registerHeadingComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_HEADING_TYPE)) {
    return
  }

  domComponents.addType(WB_HEADING_TYPE, {
    extend: 'text',
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'heading') {
        return { type: WB_HEADING_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '标题',
        tagName: 'h2',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: true,
        stylable: true,
        attributes: {
          'data-wb-component': 'heading',
        },
        style: {
          margin: '0 0 0 0',
        },
        headingTag: 'h2',
        components: 'Heading',
        traits: [
          makeSelectTrait('HTML 标签', 'headingTag', [
            { value: 'h1', label: 'H1' },
            { value: 'h2', label: 'H2' },
            { value: 'h3', label: 'H3' },
            { value: 'h4', label: 'H4' },
            { value: 'h5', label: 'H5' },
            { value: 'h6', label: 'H6' },
          ]),
        ],
      },
      init(this: any) {
        this.on('change:headingTag', this.applyHeadingTag)
        this.applyHeadingTag()
      },
      applyHeadingTag(this: any) {
        const nextTag = `${this.get('headingTag') || 'h2'}`.toLowerCase()
        if (this.get('tagName') !== nextTag) {
          this.set('tagName', nextTag)
        }
      },
    },
  })
}
