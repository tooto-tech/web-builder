import type { Editor } from 'grapesjs'
import { injectCanvasStyleOnce } from '../../../injectStyle.js'
import { defineGrapesTraits } from '../../../traitFactory.js'

export const WB_CUSTOM_CODE_TYPE = 'wb-custom-code'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M8 7 3 12l5 5"/>
  <path d="m16 7 5 5-5 5"/>
  <path d="m14 4-4 16"/>
</svg>`

const CUSTOM_CODE_CANVAS_CSS = `
  .wb-custom-code {
    width: 100%;
    min-height: 72px;
    box-sizing: border-box;
  }
  .wb-custom-code__preview {
    width: 100%;
    min-height: 72px;
    box-sizing: border-box;
  }
  .wb-custom-code__placeholder {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    box-sizing: border-box;
    border: 1px dashed #cbd5e1;
    background-color: #f8fafc;
    color: #64748b;
    font-size: 13px;
    line-height: 1.6;
    text-align: center;
  }
  .wb-custom-code__script-note {
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px dashed #f59e0b;
    background-color: #fff7ed;
    color: #9a3412;
    font-size: 12px;
    line-height: 1.5;
  }
`

function sanitizeText(value: any, fallback = ''): string {
  return `${value ?? fallback}`
}

function escapeAttr(value: any): string {
  return `${value ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function styleObjectToString(style: Record<string, any> = {}): string {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== '')
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

function buildExportAttributes(model: any): string {
  const attrs = { ...(model?.getAttributes?.() || {}) }
  const classes = new Set(
    `${attrs.class || ''}`
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean),
  )
  classes.add('wb-custom-code')
  attrs.class = Array.from(classes).join(' ')

  const inlineStyle = styleObjectToString(model?.getStyle?.() || model?.get?.('style') || {})
  if (inlineStyle) {
    attrs.style = attrs.style ? `${attrs.style};${inlineStyle}` : inlineStyle
  }

  return Object.entries(attrs)
    .filter(([key, value]) => key !== 'data-gjs-type' && value !== undefined && value !== null)
    .map(([key, value]) => ` ${key}="${escapeAttr(value)}"`)
    .join('')
}

function containsScriptTag(code: string): boolean {
  return /<script\b/i.test(code)
}

function stripScriptTags(code: string): string {
  return code.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim()
}

function buildPreviewTree(code: string) {
  const rawCode = sanitizeText(code)
  const hasCode = rawCode.trim().length > 0
  const hasScript = containsScriptTag(rawCode)
  const previewMarkup = stripScriptTags(rawCode)

  if (!hasCode) {
    return [
      {
        tagName: 'div',
        selectable: false,
        hoverable: false,
        draggable: false,
        droppable: false,
        layerable: false,
        highlightable: false,
        copyable: false,
        removable: false,
        badgable: false,
        attributes: {
          class: 'wb-custom-code__placeholder',
        },
        content: 'Paste custom HTML/CSS/JS in traits to preview custom code here.',
      },
    ]
  }

  const children: any[] = [
    {
      tagName: 'div',
      selectable: false,
      hoverable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      highlightable: false,
      copyable: false,
      removable: false,
      badgable: false,
      attributes: {
        class: 'wb-custom-code__preview',
        'data-wb-custom-code-preview': 'true',
      },
      components: previewMarkup || '<div></div>',
    },
  ]

  if (hasScript) {
    children.push({
      tagName: 'div',
      selectable: false,
      hoverable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      highlightable: false,
      copyable: false,
      removable: false,
      badgable: false,
      attributes: {
        class: 'wb-custom-code__script-note',
      },
      content: 'Script tags are preserved for export, but are not executed inside the editor canvas.',
    })
  }

  return children
}

export function registerCustomCodeComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CUSTOM_CODE_TYPE)) return

  injectCanvasStyleOnce(editor, WB_CUSTOM_CODE_TYPE, CUSTOM_CODE_CANVAS_CSS)

  domComponents.addType(WB_CUSTOM_CODE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'custom-code'
        ? { type: WB_CUSTOM_CODE_TYPE }
        : false,
    model: {
      defaults: {
        name: '自定义代码',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: false,
        copyable: true,
        attributes: {
          'data-wb-component': 'custom-code',
          class: 'wb-custom-code',
        },
        style: {
          display: 'block',
          width: '100%',
        },
        customCode: '',
        components: buildPreviewTree(''),
        traits: defineGrapesTraits([
          {
            type: 'code-editor',
            label: '代码',
            name: 'customCode',
            changeProp: true,
            language: 'html',
            minHeight: 360,
            placeholder: '<style>.demo{padding:24px;background-color:#f5f7fa;}</style>\n<div class="demo">Hello world</div>\n<script>console.log("hello")</script>',
          },
        ]),
      },
      init(this: any) {
        this.on('change:customCode', this.renderCustomCodePreview)
        this.renderCustomCodePreview()
      },
      renderCustomCodePreview(this: any) {
        const nextChildren = buildPreviewTree(this.get('customCode'))
        const children = this.components?.()
        if (children?.reset) {
          children.reset(nextChildren)
        } else {
          this.components(nextChildren)
        }
      },
      toHTML(this: any) {
        const code = sanitizeText(this.get('customCode')).trim()
        const attrs = buildExportAttributes(this)
        return `<div${attrs}>${code}</div>`
      },
    },
  })

  blockManager?.add(WB_CUSTOM_CODE_TYPE, {
    label: '自定义代码',
    category: 'Interactive',
    content: {
      type: WB_CUSTOM_CODE_TYPE,
      customCode: '',
    },
    media: BLOCK_ICON,
  })
}
