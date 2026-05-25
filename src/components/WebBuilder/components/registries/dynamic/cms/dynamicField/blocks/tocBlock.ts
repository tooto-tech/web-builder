/**
 * 文章目录 block（对标 Elementor Pro 的 Table of Contents）
 *
 * 拖入画布后输出如下结构：
 *
 * ```html
 * <nav data-wb-dynamic="toc"
 *      class="wb-cms-dynamic-toc"
 *      data-cms-toc-source="post.content"
 *      data-cms-toc-levels="2"
 *      data-cms-toc-style="bulleted">
 *   <ul class="wb-cms-dynamic-toc__list"
 *        data-cms-repeat="tocItem@tocItems"
 *        data-cms-repeat-container="true">
 *     <li class="wb-cms-dynamic-toc__item" data-wb-dynamic="repeat-item">
 *       <a class="wb-cms-dynamic-toc__link"
 *          data-cms-bind-href="tocItem.href"
 *          data-cms-bind="tocItem.text"
 *          href="#">示例章节</a>
 *     </li>
 *   </ul>
 * </nav>
 * ```
 *
 * 后端依据 `data-cms-toc-source` 指定的字段（默认 post.content）抽取 H2
 * 标题，填充 `tocItems` 集合；`data-cms-toc-levels` 固定为 `2`。
 * 发布 HTML 后，`data-cms-repeat` + `data-cms-bind*` 属性由模板引擎展开，
 * 与现有 TOC repeat 模式完全兼容。
 *
 * 编辑器内的子节点是固定结构，不允许用户直接拖动 / 删除，保持 widget 原子性。
 */
import { WB_CMS_DYN_TOC_TYPE } from '../constants'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields
} from '../helpers'
import { registerDynamicFieldBlock } from '../registerBlock'

const DEFAULT_SOURCE_FIELD = 'post.content'
const DEFAULT_LEVELS = '2'
const TOC_CLASS = 'wb-cms-dynamic-toc'
const TOC_LIST_CLASS = `${TOC_CLASS}__list`
const TOC_ITEM_CLASS = `${TOC_CLASS}__item`
const TOC_LINK_CLASS = `${TOC_CLASS}__link`

/** 统一锁定 widget 内部节点：不可单独选中/拖动/删除，保证结构固定 */
const LOCKED = {
  selectable: false,
  hoverable: false,
  draggable: false,
  droppable: false,
  removable: false,
  copyable: false,
  editable: false,
  highlightable: false,
  layerable: false,
} as const

const resolveRootClass = (model: any): string => {
  const current = String(model.getAttributes?.()?.class ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((className) => className !== TOC_CLASS && !className.startsWith(`${TOC_CLASS}--`))

  return [TOC_CLASS, ...current].join(' ')
}

const replaceClass = (component: any, from: string, to: string): void => {
  const attrs = component?.getAttributes?.()
  if (!attrs?.class) return

  const classes = String(attrs.class)
    .split(/\s+/)
    .filter(Boolean)
    .map((className) => (className === from ? to : className))

  component.setAttributes?.({ ...attrs, class: Array.from(new Set(classes)).join(' ') })
}

const migrateLegacyClasses = (model: any): void => {
  const list = model.components?.()?.at?.(0)
  const item = list?.components?.()?.at?.(0)
  const link = item?.components?.()?.at?.(0)

  replaceClass(list, 'wb-cms-dynamic-toc-list', TOC_LIST_CLASS)
  replaceClass(item, 'wb-cms-dynamic-toc-item', TOC_ITEM_CLASS)
  replaceClass(link, 'wb-cms-dynamic-toc-link', TOC_LINK_CLASS)
}

export const registerDynamicTocBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_TOC_TYPE,
    dynamicKey: 'toc',
    defaults: {
      tagName: 'nav',
      name: '文章目录',
      attributes: { class: 'wb-cms-dynamic-toc' },
      defaultProps: {
        dynSourceField: DEFAULT_SOURCE_FIELD,
      },
      droppable: false,
      editable: false,
      components: [
        {
          tagName: 'ul',
          attributes: {
            class: TOC_LIST_CLASS,
            'data-cms-repeat': 'tocItem@tocItems',
            'data-cms-repeat-container': 'true',
          },
          ...LOCKED,
          components: [
            {
              tagName: 'li',
              attributes: {
                class: TOC_ITEM_CLASS,
                'data-wb-dynamic': 'repeat-item',
              },
              ...LOCKED,
              components: [
                {
                  tagName: 'a',
                  attributes: {
                    class: TOC_LINK_CLASS,
                    'data-cms-bind-href': 'tocItem.href',
                    'data-cms-bind': 'tocItem.text',
                    href: '#',
                  },
                  content: '示例章节（由目录数据填充）',
                  ...LOCKED,
                },
              ],
            },
          ],
        },
      ],
    },
    watchProps: ['dynSourceField'],
    syncAttrs: (model) => {
      const source = String(model.get('dynSourceField') ?? '').trim() || DEFAULT_SOURCE_FIELD
      return {
        class: resolveRootClass(model),
        'data-cms-toc-source': source,
        'data-cms-toc-levels': DEFAULT_LEVELS,
        'data-cms-toc-style': 'bulleted',
      }
    },
    traits: [
      {
        type: 'select',
        label: '内容来源字段',
        name: 'dynSourceField',
        changeProp: true,
        options: [{ value: DEFAULT_SOURCE_FIELD, label: '正文 HTML（post.content）' }],
      },
    ],
    refreshTraits: (model) => {
      const { fields } = resolveAvailableFields(model, {
        kinds: ['html'],
        includeContextFields: false,
      })
      const options = fields.length
        ? buildTraitOptions(fields, { includeEmpty: false })
        : [
            {
              id: DEFAULT_SOURCE_FIELD,
              value: DEFAULT_SOURCE_FIELD,
              label: '正文 HTML（post.content）',
            },
          ]
      if (fields.length) {
        clearTraitValueIfUnavailable(model, 'dynSourceField', fields)
      }
      refreshTraitOptions(model, 'dynSourceField', options)
    },
    onFirstAdd: (model) => {
      if (!model.get('dynSourceField')) {
        const { fields } = resolveAvailableFields(model, { kinds: ['html'] })
        model.set('dynSourceField', fields[0]?.value || DEFAULT_SOURCE_FIELD)
      }
    },
    onModelInit: (model) => {
      migrateLegacyClasses(model)
    },
  })
}
