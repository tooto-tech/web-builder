/**
 * 条件容器 block（对标 Elementor Pro Display Conditions）
 *
 * 输出：`<div data-cms-if="post.image">...children...</div>`
 *
 * SSG 渲染器读取 `data-cms-if`：若对应字段为空/假，则移除整个容器。
 * traits：
 *   - whenField：使用哪个字段判断
 *   - mode：truthy（默认）/ falsy / nonEmpty / isEmpty（这些模式在 SSG 侧可扩展）
 *
 * 目前 SSG 只理解"字段非空"，所以我们先实现这一种。其它模式的 Flag 预留在属性上，
 * 后续扩展 SSG 时即可生效。
 */
import { WB_CMS_DYN_IF_TYPE } from '../constants.js'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields
} from '../helpers.js'
import { registerDynamicFieldBlock } from '../registerBlock.js'

const MODE_OPTIONS = [
  { id: 'truthy', value: 'truthy', label: '字段有值时显示' },
  { id: 'falsy', value: 'falsy', label: '字段为空时显示' },
]

export const registerDynamicConditionalBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_IF_TYPE,
    dynamicKey: 'if',
    defaults: {
      tagName: 'div',
      name: '条件显示',
      attributes: {
        class: 'wb-cms-dynamic-if',
      },
      defaultProps: {
        dynField: '',
        dynMode: 'truthy',
      },
      droppable: true,
    },
    watchProps: ['dynField', 'dynMode'],
    syncAttrs: (model) => {
      const field = String(model.get('dynField') ?? '').trim()
      const mode = String(model.get('dynMode') ?? 'truthy').trim()
      return {
        'data-cms-if': field,
        'data-cms-if-mode': field ? mode : '',
      }
    },
    traits: [
      {
        type: 'select',
        label: '依据字段',
        name: 'dynField',
        changeProp: true,
        options: [{ value: '', label: '—（请选择字段）' }],
      },
      {
        type: 'select',
        label: '触发条件',
        name: 'dynMode',
        changeProp: true,
        options: MODE_OPTIONS,
      },
    ],
    refreshTraits: (model) => {
      const { fields } = resolveAvailableFields(model)
      clearTraitValueIfUnavailable(model, 'dynField', fields)
      refreshTraitOptions(
        model,
        'dynField',
        buildTraitOptions(fields, { includeEmpty: true, emptyLabel: '—（请选择字段）' }),
      )
    },
  })
}
