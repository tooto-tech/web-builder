/**
 * 动态链接 block（对标 Elementor Pro 的 Post Permalink / Taxonomy Link）
 *
 * 输出：
 *   `<a href="#" data-cms-bind-href="post.url" data-cms-bind="post.name" target="_self">链接</a>`
 *   或包裹子组件（如动态图片）作为图片链接。
 *
 * traits：
 *   - hrefField：kind=url 的字段
 *   - textField：可选，若选则链接文字由该文本字段绑定（不选则用户自定义 / 子组件）
 *   - target：_self / _blank
 *   - rel：常见 rel 选项
 */
import { WB_CMS_DYN_LINK_TYPE } from '../constants.js'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields
} from '../helpers.js'
import { registerDynamicFieldBlock } from '../registerBlock.js'

const TARGET_OPTIONS = [
  { id: '_self', value: '_self', label: '当前窗口' },
  { id: '_blank', value: '_blank', label: '新窗口' }
]

const REL_OPTIONS = [
  { id: 'none', value: '', label: '—（不设置）' },
  { id: 'nofollow', value: 'nofollow', label: 'nofollow' },
  { id: 'noopener', value: 'noopener', label: 'noopener' },
  { id: 'noopener-noreferrer', value: 'noopener noreferrer', label: 'noopener noreferrer' }
]

export const registerDynamicLinkBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_LINK_TYPE,
    dynamicKey: 'link',
    defaults: {
      tagName: 'a',
      name: '动态链接',
      content: '动态链接',
      attributes: { href: '#' },
      defaultProps: {
        dynHrefField: '',
        dynHrefTemplate: '',
        dynTextField: '',
        dynTarget: '_self',
        dynRel: ''
      },
      droppable: true
    },
    watchProps: ['dynHrefField', 'dynHrefTemplate', 'dynTextField', 'dynTarget', 'dynRel'],
    syncAttrs: (model) => {
      // target / rel 直接作为静态属性（而不是 bind），所以走 setAttributes
      const target = String(model.get('dynTarget') ?? '').trim()
      const rel = String(model.get('dynRel') ?? '').trim()
      const existing = { ...(model.getAttributes?.() || {}) }
      existing.href = '#'
      if (target) existing.target = target
      else delete existing.target
      if (rel) existing.rel = rel
      else delete existing.rel
      model.setAttributes?.(existing)

      const textField = String(model.get('dynTextField') ?? '').trim()
      if (textField) {
        // 设置文字字段时更新编辑器内文案为字段标签，不再允许用户直接改文字
        const textMeta = resolveAvailableFields(model, {
          kinds: ['text', 'number', 'url']
        }).fields.find((f) => f.value === textField)
        if (textMeta) model.set('content', textMeta.label)
        model.set('editable', false, { silent: true })
      } else {
        model.set('editable', true, { silent: true })
      }
      return {
        'data-cms-bind-href': String(model.get('dynHrefField') ?? '').trim(),
        'data-cms-bind-href-template': String(model.get('dynHrefTemplate') ?? '').trim(),
        'data-cms-bind': textField
      }
    },
    hydrateProps: (model) => {
      const attrs = model.getAttributes?.() || {}
      const hrefField = String(attrs['data-cms-bind-href'] ?? '').trim()
      const hrefTemplate = String(attrs['data-cms-bind-href-template'] ?? '').trim()
      const textField = String(attrs['data-cms-bind'] ?? '').trim()
      const target = String(attrs.target ?? '').trim()
      const rel = String(attrs.rel ?? '').trim()
      if (hrefField && !model.get('dynHrefField')) {
        model.set('dynHrefField', hrefField, { silent: true })
      }
      if (hrefTemplate && !model.get('dynHrefTemplate')) {
        model.set('dynHrefTemplate', hrefTemplate, { silent: true })
      }
      if (textField && !model.get('dynTextField')) {
        model.set('dynTextField', textField, { silent: true })
      }
      if (target && !model.get('dynTarget')) model.set('dynTarget', target, { silent: true })
      if (rel && !model.get('dynRel')) model.set('dynRel', rel, { silent: true })
    },
    traits: [
      {
        type: 'select',
        label: '链接字段',
        name: 'dynHrefField',
        changeProp: true,
        options: [{ value: '', label: '—（请选择字段）' }]
      },
      {
        type: 'text',
        label: '链接拼接模板',
        name: 'dynHrefTemplate',
        changeProp: true,
        placeholder: '/pdf?url={{value}}'
      },
      {
        type: 'select',
        label: '文字字段',
        name: 'dynTextField',
        changeProp: true,
        options: [{ value: '', label: '—（手动编辑或子组件）' }]
      },
      {
        type: 'select',
        label: '打开方式',
        name: 'dynTarget',
        changeProp: true,
        options: TARGET_OPTIONS
      },
      {
        type: 'select',
        label: 'rel',
        name: 'dynRel',
        changeProp: true,
        options: REL_OPTIONS
      }
    ],
    refreshTraits: (model) => {
      const { fields: urlFields } = resolveAvailableFields(model, { kinds: ['url'] })
      const { fields: textFields } = resolveAvailableFields(model, {
        kinds: ['text', 'number', 'url']
      })
      clearTraitValueIfUnavailable(model, 'dynHrefField', urlFields)
      clearTraitValueIfUnavailable(model, 'dynTextField', textFields)
      refreshTraitOptions(
        model,
        'dynHrefField',
        buildTraitOptions(urlFields, { includeEmpty: true, emptyLabel: '—（请选择字段）' })
      )
      refreshTraitOptions(
        model,
        'dynTextField',
        buildTraitOptions(textFields, { includeEmpty: true, emptyLabel: '—（手动编辑或子组件）' })
      )
    },
    onFirstAdd: (model) => {
      const { fields } = resolveAvailableFields(model, { kinds: ['url'] })
      if (fields[0] && !model.get('dynHrefField')) model.set('dynHrefField', fields[0].value)
    },
    onModelInit: (model) => {
      // 历史项目里可能已经把动态链接保存成 div/span；这里在模型层统一纠正，
      // 避免编辑器预览和发布导出时只剩 href 属性但不是语义化 a 标签。
      if (model?.get?.('tagName') !== 'a') {
        model.set?.('tagName', 'a')
      }
    }
  })
}
