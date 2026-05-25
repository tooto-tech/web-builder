import type { GrapesEditor } from '../../../../types/editor'

export const WB_SSG_FIELD_TYPE = 'wb-ssg-field'

export function registerSsgFieldComponent(editor: GrapesEditor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_SSG_FIELD_TYPE)) return

  if (!(editor as any)._wbSsgFieldStyleInjected) {
    editor.addStyle?.(`
      [data-wb-component="ssg-field"] {
        display: inline-block;
        background: #eff6ff;
        border: 1px dashed #93c5fd;
        border-radius: 3px;
        padding: 2px 8px;
        color: #3b82f6;
        font-size: 12px;
        font-family: monospace;
        min-width: 60px;
        min-height: 1em;
        cursor: default;
        user-select: none;
      }
      [data-wb-component="ssg-field"][data-ssg-format="image"] {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 80px;
        background: #f0f9ff;
      }
    `)
    ;(editor as any)._wbSsgFieldStyleInjected = true
  }

  domComponents.addType(WB_SSG_FIELD_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'ssg-field'
        ? { type: WB_SSG_FIELD_TYPE }
        : false,

    model: {
      defaults: {
        name: '数据字段',
        tagName: 'span',
        draggable: true,
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'ssg-field',
          'data-ssg-field': '',
          'data-ssg-format': 'text',
        },

        // 模型属性
        fieldName: '',
        format: 'text',

        traits: [
          {
            type: 'text',
            label: '字段名',
            name: 'fieldName',
            changeProp: true,
            placeholder: '如: title, cover_url, created_at',
          },
          {
            type: 'select',
            label: '渲染格式',
            name: 'format',
            changeProp: true,
            options: [
              { value: 'text', label: '文本 (text)' },
              { value: 'html', label: 'HTML 富文本' },
              { value: 'image', label: '图片 (img src)' },
              { value: 'date', label: '日期格式化' },
              { value: 'link', label: '链接地址 (href)' },
            ],
          },
        ],
      },

      init(this: any) {
        this.on('change:fieldName change:format', this._syncDisplay)
        this._syncDisplay()
      },

      _syncDisplay(this: any) {
        const fieldName = this.get('fieldName') || ''
        const format = this.get('format') || 'text'
        const label = fieldName ? `{{ ${fieldName} }}` : '{{ 字段名 }}'

        this.addAttributes({ 'data-ssg-field': fieldName, 'data-ssg-format': format })

        if (format === 'image') {
          this.set('tagName', 'div')
          this.set('content', `🖼 ${label}`)
        } else {
          this.set('tagName', 'span')
          this.set('content', label)
        }
      },
    },
  })
}
