/**
 * 动态文本 block（对标 Elementor Pro 的 Post Title / Post Excerpt / Post Meta）
 *
 * 输出形如：`<h1 data-cms-bind="post.name">文章标题</h1>`
 *   - 字段下拉支持 text / number / url / list 类字段；
 *   - datetime 类字段有独立的 wb-cms-dynamic-datetime block；
 *   - html 类字段有独立的 wb-cms-dynamic-html block；
 *   - list 字段（对象数组）额外提供"列表拼接格式"下拉，
 *     输出 `data-cms-list-format` 属性，由后端模板引擎按格式拼接每项 `.name`。
 *   - 可选 tagName（h1/h2/h3/h4/h5/h6/p/span/div）；
 *   - 可选 fallback 文案（绑定失败或字段为空时编辑器显示用）。
 */
import {
  WB_CMS_DYN_TEXT_TYPE,
} from '../constants'
import type { DynamicFieldMeta } from '../bindings'
import { findFieldMeta } from '../bindings'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields,
} from '../helpers'
import { registerDynamicFieldBlock } from '../registerBlock'

const TAG_OPTIONS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].map((tag) => ({
  id: tag,
  value: tag,
  label: tag.toUpperCase(),
}))

/**
 * list 字段的拼接格式。
 * 后端模板引擎读取 `data-cms-list-format`，对数组字段按规则取 `.name` 后拼接。
 *   - bracket   → `[ai] [design]`
 *   - comma     → `ai, design`
 *   - space     → `ai design`
 *   - pipe      → `ai | design`
 *   - hashtag   → `#ai #design`
 */
const LIST_FORMAT_OPTIONS = [
  { id: 'bracket', value: 'bracket', label: '[item] [item]（方括号）' },
  { id: 'comma', value: 'comma', label: 'item, item（英文逗号）' },
  { id: 'space', value: 'space', label: 'item item（空格）' },
  { id: 'pipe', value: 'pipe', label: 'item | item（竖线）' },
  { id: 'hashtag', value: 'hashtag', label: '#item #item（话题标签）' },
]

const LIST_KINDS = ['text', 'number', 'url', 'list'] as const

/** 编辑器里根据 format 生成展示文本，让用户一眼看出效果 */
const previewListText = (format: string, sample: string[] = ['ai', 'design']): string => {
  switch (format) {
    case 'bracket':
      return sample.map((x) => `[${x}]`).join(' ')
    case 'comma':
      return sample.join(', ')
    case 'space':
      return sample.join(' ')
    case 'pipe':
      return sample.join(' | ')
    case 'hashtag':
      return sample.map((x) => `#${x}`).join(' ')
    default:
      return sample.join(' ')
  }
}

export const registerDynamicTextBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_TEXT_TYPE,
    dynamicKey: 'text',
    defaults: {
      tagName: 'span',
      name: '动态文本',
      content: '动态文本',
      attributes: {},
      defaultProps: {
        dynField: '',
        dynTag: 'span',
        dynFallback: '动态文本',
        dynListFormat: 'bracket',
      },
      editable: false,
      droppable: false,
    },
    watchProps: ['dynField', 'dynTag', 'dynFallback', 'dynListFormat'],
    syncAttrs: (model) => {
      // tagName 可变：changeProp 的 tag 需要调用 set('tagName') 才能生效
      const nextTag = model.get('dynTag') || 'span'
      if (model.get('tagName') !== nextTag) {
        model.set('tagName', nextTag)
      }
      const field = String(model.get('dynField') ?? '').trim()
      const meta = findFieldMeta(field)
      const isList = meta?.kind === 'list'
      const listFormat = isList ? String(model.get('dynListFormat') ?? 'bracket').trim() || 'bracket' : ''

      // list 字段 → 编辑器展示格式化示例；否则沿用 fallback 文案
      const fallback = String(model.get('dynFallback') ?? '').trim()
      if (isList) {
        model.set('content', previewListText(listFormat), { avoidStore: true })
      } else if (fallback) {
        model.set('content', fallback, { avoidStore: false })
      }

      return {
        'data-cms-bind': field,
        'data-cms-list-format': listFormat,
      }
    },
    hydrateProps: (model) => {
      const attrs = model.getAttributes?.() || {}
      const bind = String(attrs['data-cms-bind'] ?? '').trim()
      const listFormat = String(attrs['data-cms-list-format'] ?? '').trim()
      if (bind && !model.get('dynField')) model.set('dynField', bind, { silent: true })
      if (listFormat && !model.get('dynListFormat')) {
        model.set('dynListFormat', listFormat, { silent: true })
      }
      const tagName = String(model.get('tagName') ?? '').trim()
      if (tagName && !model.get('dynTag')) model.set('dynTag', tagName, { silent: true })
      const content = String(model.get('content') ?? '').trim()
      if (content && !model.get('dynFallback')) model.set('dynFallback', content, { silent: true })
    },
    traits: [
      {
        type: 'select',
        label: '字段',
        name: 'dynField',
        changeProp: true,
        options: [{ value: '', label: '—（请选择字段）' }],
      },
      {
        type: 'select',
        label: 'HTML 标签',
        name: 'dynTag',
        changeProp: true,
        options: TAG_OPTIONS,
      },
      {
        type: 'select',
        label: '列表拼接格式',
        name: 'dynListFormat',
        changeProp: true,
        options: LIST_FORMAT_OPTIONS,
      },
      {
        type: 'text',
        label: '占位文案',
        name: 'dynFallback',
        changeProp: true,
        placeholder: '字段为空时显示（list 字段不生效）',
      },
    ],
    refreshTraits: (model) => {
      const { fields } = resolveAvailableFields(model, {
        kinds: [...LIST_KINDS],
      })
      clearTraitValueIfUnavailable(model, 'dynField', fields)
      refreshTraitOptions(
        model,
        'dynField',
        buildTraitOptions(fields, { includeEmpty: true, emptyLabel: '—（请选择字段）' }),
      )
    },
    onFirstAdd: (model) => {
      // 首次拖入：自动选上第一个可用字段（优先非 list 类型以符合老直觉）
      const { fields } = resolveAvailableFields(model, { kinds: [...LIST_KINDS] })
      const prefer =
        fields.find((f) => f.kind !== 'list') || fields[0]
      const first: DynamicFieldMeta | undefined = prefer
      if (first && !model.get('dynField')) {
        model.set('dynField', first.value)
        model.set('dynFallback', first.label, { avoidStore: true })
        model.set('content', first.kind === 'list' ? previewListText('bracket') : first.label)
      }
    },
    onModelInit: (model) => {
      // 防御：datetime / image / html 类字段不应被 text block 选中（旧数据兜底）
      const fieldMeta = findFieldMeta(model.get('dynField'))
      if (fieldMeta && !(LIST_KINDS as readonly string[]).includes(fieldMeta.kind)) {
        model.set('dynField', '')
      }
    },
  })
}
