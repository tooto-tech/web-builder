/**
 * 面包屑导航 block。
 *
 * 输出 `breadcrumb@breadcrumbs` 循环结构，预览和发布由详情模板数据源展开。
 */
import { WB_CMS_DYN_BREADCRUMB_TYPE } from '../constants'
import { registerDynamicFieldBlock } from '../registerBlock'

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

export const registerDynamicBreadcrumbBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_BREADCRUMB_TYPE,
    dynamicKey: 'breadcrumb',
    defaults: {
      tagName: 'nav',
      name: '面包屑导航',
      attributes: {
        class: 'wb-cms-dynamic-breadcrumb',
        'aria-label': 'Breadcrumb',
      },
      droppable: false,
      editable: false,
      components: [
        {
          tagName: 'ol',
          attributes: {
            class: 'wb-cms-dynamic-breadcrumb__list',
          },
          ...LOCKED,
          components: [
            {
              tagName: 'li',
              attributes: {
                class: 'wb-cms-dynamic-breadcrumb__item',
                'data-wb-dynamic': 'repeat-item',
                'data-cms-repeat': 'breadcrumb@breadcrumbs',
                'data-cms-bind-classappend': 'breadcrumb.currentClass',
              },
              ...LOCKED,
              components: [
                {
                  tagName: 'a',
                  attributes: {
                    class: 'wb-cms-dynamic-breadcrumb__link',
                    'data-cms-bind': 'breadcrumb.label',
                    'data-cms-bind-href': 'breadcrumb.url',
                    'data-cms-bind-title': 'breadcrumb.label',
                    'data-cms-bind-aria-current': 'breadcrumb.ariaCurrent',
                    href: '#',
                  },
                  content: 'Breadcrumb',
                  ...LOCKED,
                },
                {
                  tagName: 'span',
                  attributes: {
                    class: 'wb-cms-dynamic-breadcrumb__separator',
                    'aria-hidden': 'true',
                  },
                  content: '/',
                  ...LOCKED,
                },
              ],
            },
          ],
        },
      ],
    },
    watchProps: [],
    syncAttrs: () => ({}),
    traits: [],
  })
}
