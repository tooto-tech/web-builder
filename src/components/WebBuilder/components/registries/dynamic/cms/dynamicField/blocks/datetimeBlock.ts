/**
 * 动态日期 block
 *
 * 输出：
 *   `<time datetime=""
 *          data-cms-bind="post.publishTime"
 *          data-cms-bind-datetime="post.publishTime"
 *          data-cms-format="yyyy-MM-dd">2024-01-01</time>`
 *
 * - `data-cms-bind` 用于替换可见文字；
 * - `data-cms-bind-datetime` 用于同步设置 `<time datetime>` 属性（SEO 友好）；
 * - `data-cms-format` 告诉 SSG 渲染器按指定格式化日期。
 */
import { WB_CMS_DYN_DATETIME_TYPE } from '../constants'
import { findFieldMeta } from '../bindings'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields
} from '../helpers'
import { registerDynamicFieldBlock } from '../registerBlock'

const DEFAULT_FORMAT = 'yyyy-MM-dd'

export const registerDynamicDatetimeBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_DATETIME_TYPE,
    dynamicKey: 'datetime',
    defaults: {
      tagName: 'time',
      name: '动态日期',
      content: '2024-01-01',
      defaultProps: {
        dynField: '',
        dynFormat: DEFAULT_FORMAT,
      },
      editable: false,
      droppable: false,
    },
    watchProps: ['dynField', 'dynFormat'],
    syncAttrs: (model) => {
      const field = String(model.get('dynField') ?? '').trim()
      const format = String(model.get('dynFormat') ?? '').trim() || DEFAULT_FORMAT
      return {
        'data-cms-bind': field,
        'data-cms-bind-datetime': field,
        'data-cms-format': field ? format : '',
      }
    },
    hydrateProps: (model) => {
      const attrs = model.getAttributes?.() || {}
      const field = String(attrs['data-cms-bind'] ?? attrs['data-cms-bind-datetime'] ?? '').trim()
      const format = String(attrs['data-cms-format'] ?? '').trim()
      if (field && !model.get('dynField')) model.set('dynField', field, { silent: true })
      if (format && !model.get('dynFormat')) model.set('dynFormat', format, { silent: true })
    },
    traits: [
      {
        type: 'select',
        label: '日期字段',
        name: 'dynField',
        changeProp: true,
        options: [{ value: '', label: '—（请选择字段）' }],
      },
      {
        type: 'text',
        label: '格式',
        name: 'dynFormat',
        changeProp: true,
        placeholder: DEFAULT_FORMAT,
      },
    ],
    refreshTraits: (model) => {
      const { fields } = resolveAvailableFields(model, { kinds: ['datetime'] })
      clearTraitValueIfUnavailable(model, 'dynField', fields)
      refreshTraitOptions(
        model,
        'dynField',
        buildTraitOptions(fields, { includeEmpty: true, emptyLabel: '—（请选择字段）' }),
      )
    },
    onFirstAdd: (model) => {
      const { fields } = resolveAvailableFields(model, { kinds: ['datetime'] })
      if (fields[0] && !model.get('dynField')) {
        model.set('dynField', fields[0].value)
        const meta = findFieldMeta(fields[0].value)
        if (meta?.defaultFormat && !model.get('dynFormat')) model.set('dynFormat', meta.defaultFormat)
      }
    },
  })
}
