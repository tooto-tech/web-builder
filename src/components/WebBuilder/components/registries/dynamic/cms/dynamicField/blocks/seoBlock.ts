/**
 * 动态 SEO Meta block
 *
 * 输出：
 *   `<div data-wb-dynamic="seo-meta" style="display:none">
 *      <title data-cms-bind="post.name"></title>
 *      <meta name="keywords" data-cms-bind-content="post.metaKeywords" />
 *      <meta name="description" data-cms-bind-content="post.metaDescription" />
 *    </div>`
 *
 * SSG 渲染器会用数据替换 title 文本 / meta content 属性。
 */
import { WB_CMS_DYN_SEO_TYPE } from '../constants'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields
} from '../helpers'
import { registerDynamicFieldBlock } from '../registerBlock'

const CHILD_DEFAULTS = { selectable: false, hoverable: false, removable: false, copyable: false }

const buildChildren = () => [
  {
    tagName: 'title',
    content: '页面标题',
    attributes: {},
    ...CHILD_DEFAULTS,
  },
  {
    tagName: 'meta',
    attributes: { name: 'keywords', content: '' },
    ...CHILD_DEFAULTS,
  },
  {
    tagName: 'meta',
    attributes: { name: 'description', content: '' },
    ...CHILD_DEFAULTS,
  },
]

export const registerDynamicSeoBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_SEO_TYPE,
    dynamicKey: 'seo-meta',
    defaults: {
      tagName: 'div',
      name: 'SEO Meta',
      attributes: {
        style: 'display:none',
      },
      components: buildChildren(),
      defaultProps: {
        dynTitleField: '',
        dynKeywordsField: '',
        dynDescriptionField: '',
      },
      droppable: false,
    },
    watchProps: ['dynTitleField', 'dynKeywordsField', 'dynDescriptionField'],
    syncAttrs: (model) => {
      const title = String(model.get('dynTitleField') ?? '').trim()
      const kw = String(model.get('dynKeywordsField') ?? '').trim()
      const desc = String(model.get('dynDescriptionField') ?? '').trim()
      const children = model.components?.()?.models || []

      // 同步到三个 meta 子节点上
      children.forEach((child: any) => {
        const tag = String(child.get?.('tagName') || '').toLowerCase()
        if (tag === 'title') applyOn(child, 'data-cms-bind', title)
        if (tag === 'meta') {
          const attrs = child.getAttributes?.() || {}
          if (attrs.name === 'keywords') applyOn(child, 'data-cms-bind-content', kw)
          if (attrs.name === 'description') applyOn(child, 'data-cms-bind-content', desc)
        }
      })

      // 根节点本身不需要额外属性
      return {}
    },
    traits: [
      {
        type: 'select',
        label: 'Title 字段',
        name: 'dynTitleField',
        changeProp: true,
        options: [{ value: '', label: '—（请选择字段）' }],
      },
      {
        type: 'select',
        label: 'Keywords 字段',
        name: 'dynKeywordsField',
        changeProp: true,
        options: [{ value: '', label: '—（不设置）' }],
      },
      {
        type: 'select',
        label: 'Description 字段',
        name: 'dynDescriptionField',
        changeProp: true,
        options: [{ value: '', label: '—（不设置）' }],
      },
    ],
    refreshTraits: (model) => {
      const { fields } = resolveAvailableFields(model, { kinds: ['text', 'number', 'url'] })
      clearTraitValueIfUnavailable(model, 'dynTitleField', fields)
      clearTraitValueIfUnavailable(model, 'dynKeywordsField', fields)
      clearTraitValueIfUnavailable(model, 'dynDescriptionField', fields)
      const options = buildTraitOptions(fields, { includeEmpty: true })
      refreshTraitOptions(model, 'dynTitleField', options)
      refreshTraitOptions(model, 'dynKeywordsField', options)
      refreshTraitOptions(model, 'dynDescriptionField', options)
    },
    onFirstAdd: (model) => {
      const { fields } = resolveAvailableFields(model, { kinds: ['text', 'number', 'url'] })
      const byName = (suffix: string) =>
        fields.find((f) => new RegExp(`${suffix}$`, 'i').test(f.value))
      if (!model.get('dynTitleField')) model.set('dynTitleField', byName('\\.name')?.value || '')
      if (!model.get('dynKeywordsField'))
        model.set('dynKeywordsField', byName('metaKeywords')?.value || '')
      if (!model.get('dynDescriptionField'))
        model.set('dynDescriptionField', byName('metaDescription')?.value || '')
    },
  })
}

const applyOn = (child: any, attrName: string, value: string) => {
  const current = { ...(child.getAttributes?.() || {}) }
  const normalized = `${value ?? ''}`.trim()
  if (normalized) {
    current[attrName] = normalized
  } else {
    delete current[attrName]
  }
  child.setAttributes?.(current)
}
