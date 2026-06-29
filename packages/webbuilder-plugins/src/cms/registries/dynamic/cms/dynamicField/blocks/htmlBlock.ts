/**
 * 动态 HTML block（对标 Elementor Pro 的 Post Content）
 *
 * 输出：`<div data-cms-html="post.content">占位正文 HTML</div>`
 * 可绑定 HTML 字段，也可绑定动态文本同一组纯文本字段。
 */
import { findFieldMeta } from '../bindings.js'
import { WB_CMS_DYN_HTML_TYPE } from '../constants.js'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields
} from '../helpers.js'
import { registerDynamicFieldBlock } from '../registerBlock.js'

const DEFAULT_PLACEHOLDER_HTML = `
<h2>示例标题（H2）</h2>
<p>动态正文 HTML 将在发布时由 CMS 数据替换。这里保留后台富文本自身的字号 / 粗细 / 段落 margin / 列表缩进等样式。</p>
<h3>次级标题（H3）</h3>
<p>支持富文本内容：<strong>加粗</strong>、<em>斜体</em>、<a href="#">链接</a>、列表、引用、代码块等。</p>
<ul>
  <li>列表项 A</li>
  <li>列表项 B</li>
</ul>
<blockquote>引用段落的默认样式也会保留。</blockquote>
`.trim()

const HTML_FIELD_KINDS = ['html', 'text', 'number', 'url', 'list'] as const

export const registerDynamicHtmlBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_HTML_TYPE,
    dynamicKey: 'html',
    defaults: {
      tagName: 'div',
      name: '动态 HTML',
      components: [{ tagName: 'div', content: DEFAULT_PLACEHOLDER_HTML, selectable: false, hoverable: false }],
      attributes: { class: 'wb-cms-dynamic-html' },
      defaultProps: {
        dynField: '',
      },
      droppable: false,
      editable: false,
    },
    watchProps: ['dynField'],
    syncAttrs: (model) => {
      const field = String(model.get('dynField') ?? '').trim()
      return { 'data-cms-html': field }
    },
    hydrateProps: (model) => {
      const attrs = model.getAttributes?.() || {}
      const field = String(attrs['data-cms-html'] ?? '').trim()
      if (field && !model.get('dynField')) model.set('dynField', field, { silent: true })
    },
    traits: [
      {
        type: 'select',
        label: '字段',
        name: 'dynField',
        changeProp: true,
        options: [{ value: '', label: '—（请选择字段）' }],
      },
    ],
    refreshTraits: (model) => {
      const { fields } = resolveAvailableFields(model, { kinds: [...HTML_FIELD_KINDS] })
      clearTraitValueIfUnavailable(model, 'dynField', fields)
      refreshTraitOptions(
        model,
        'dynField',
        buildTraitOptions(fields, { includeEmpty: true, emptyLabel: '—（请选择字段）' }),
      )
    },
    onFirstAdd: (model) => {
      const { fields } = resolveAvailableFields(model, { kinds: [...HTML_FIELD_KINDS] })
      if (fields[0] && !model.get('dynField')) model.set('dynField', fields[0].value)
    },
    onModelInit: (model) => {
      const fieldMeta = findFieldMeta(model.get('dynField'))
      if (fieldMeta && !(HTML_FIELD_KINDS as readonly string[]).includes(fieldMeta.kind)) {
        model.set('dynField', '')
      }
    },
  })
}
