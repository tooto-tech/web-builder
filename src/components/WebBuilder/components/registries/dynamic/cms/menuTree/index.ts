import type { GrapesEditor } from '../../../../../types/editor'
import { registerCmsComponent } from '@/components/WebBuilder/utils/cmsFactory'
import { WB_CMS_MENU_TREE_TYPE } from '../constants'
import { DEFAULT_MENU_TREE_CODE, resolveMenuTreeAttrs } from './menuTreeAttrs'

const menuLink = (alias: string, fallback: string) => ({
  tagName: 'a',
  attributes: {
    class: 'wb-menu-tree-link',
    href: '#',
    'data-menu-role': 'link',
    'data-cms-bind-href': `${alias}.url`,
    'data-cms-bind-target': `${alias}.target`,
  },
  components: [
    {
      tagName: 'img',
      attributes: {
        class: 'wb-menu-tree-icon',
        src: '',
        alt: '',
        'data-cms-if': `${alias}.icon`,
        'data-cms-bind-src': `${alias}.icon`,
        'data-cms-bind-alt': `${alias}.title`,
      },
    },
    {
      tagName: 'span',
      attributes: {
        class: 'wb-menu-tree-text',
        'data-cms-bind': `${alias}.title`,
      },
      content: fallback,
    },
  ],
})

const menuListItem = (
  alias: string,
  repeat: string,
  level: number,
  children: any[] = [],
) => ({
  tagName: 'li',
  attributes: {
    class: 'wb-menu-tree-item',
    'data-menu-role': 'item',
    'data-menu-level': String(level),
    'data-cms-repeat': repeat,
    'data-cms-bind-classappend': `${alias}.hasChildrenClass`,
  },
  components: [menuLink(alias, level === 0 ? 'Menu Item' : 'Sub Menu Item'), ...children],
})

function syncNavbarMobileMenuTreeAttrs(model: any) {
  const classes = model?.getClasses?.() || []
  if (!classes.includes('site-header__nav-list')) return

  const navbar = model.closestType?.('navbar-thb')
  const mobileMenu = navbar?.find?.('.nav-mobile')?.[0]
  if (!mobileMenu) return

  const menuCode = String(model.get?.('menuCode') ?? model.getAttributes?.()?.['data-menu-code'] ?? DEFAULT_MENU_TREE_CODE)
  const menuDataKey = String(model.get?.('menuDataKey') ?? model.getAttributes?.()?.['data-menu-data-key'] ?? '')
  mobileMenu.set?.('menuCode', menuCode)
  mobileMenu.set?.('menuDataKey', menuDataKey)
  mobileMenu.addAttributes?.({
    'data-menu-code': menuCode,
    'data-menu-data-key': menuDataKey,
  })
}

export function registerCmsMenuTree(editor: GrapesEditor) {
  registerCmsComponent(editor, {
    type: WB_CMS_MENU_TREE_TYPE,
    dataWbComponent: 'cms-menu-tree',
    dataCmsComponent: 'menu-tree',
    name: '菜单树',
    styleKey: 'wb-menu-tree',
    styles: `
      .wb-menu-tree {
        display: block;
        width: 100%;
      }
      .wb-menu-tree-nav {
        width: 100%;
      }
      .wb-menu-tree-list,
      .wb-menu-tree-submenu {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .wb-menu-tree-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .wb-menu-tree-submenu {
        margin-top: 8px;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .wb-menu-tree-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: inherit;
        text-decoration: none;
        line-height: 1.6;
      }
      .wb-menu-tree-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
        flex-shrink: 0;
      }
      .wb-menu-tree-text {
        min-width: 0;
      }
      .wb-menu-tree-item.is-has-children > .wb-menu-tree-link::after {
        content: '▾';
        font-size: 10px;
        color: currentColor;
        opacity: 0.65;
      }
    `,
    defaultStyle: {},
    defaultAttributes: {
      class: 'wb-menu-tree notranslate',
      'data-menu-code': DEFAULT_MENU_TREE_CODE,
      'data-menu-data-key': '',
      'data-wb-i18n-skip': 'true',
      translate: 'no',
    },
    defaultProps: {
      menuCode: DEFAULT_MENU_TREE_CODE,
      menuDataKey: '',
    },
    traits: [
      {
        type: 'menu-tree-select',
        label: '菜单',
        name: 'menuCode',
        changeProp: true,
      },
      {
        type: 'text',
        label: '数据 Key',
        name: 'menuDataKey',
        changeProp: true,
        placeholder: '留空=当前组件实例自动隔离',
      },
    ],
    components: [
      {
        tagName: 'nav',
        attributes: {
          class: 'wb-menu-tree-nav',
          'data-menu-role': 'root',
        },
        components: [
          {
            tagName: 'ul',
            attributes: {
              class: 'wb-menu-tree-list',
              'data-menu-role': 'list',
              'data-menu-level': '0',
            },
            components: [
              menuListItem('menuItem', 'menuItem@menuItems', 0, [
                {
                  tagName: 'ul',
                  attributes: {
                    class: 'wb-menu-tree-submenu',
                    'data-menu-role': 'list',
                    'data-menu-level': '1',
                    'data-cms-if': 'menuItem.hasChildren',
                  },
                  components: [
                    menuListItem('child', 'child@menuItem.children', 1, [
                      {
                        tagName: 'ul',
                        attributes: {
                          class: 'wb-menu-tree-submenu',
                          'data-menu-role': 'list',
                          'data-menu-level': '2',
                          'data-cms-if': 'child.hasChildren',
                        },
                        components: [menuListItem('grandchild', 'grandchild@child.children', 2)],
                      },
                    ]),
                  ],
                },
              ]),
            ],
          },
        ],
      },
    ],
    watchProps: ['menuCode', 'menuDataKey'],
    syncAttrs: resolveMenuTreeAttrs,
    publishStartIndex: 0,
    dynamicPublish: true,
    droppable: true,
    onModelInit(model: any) {
      syncNavbarMobileMenuTreeAttrs(model)
      model.on?.('change:menuCode change:menuDataKey change:attributes', () => {
        syncNavbarMobileMenuTreeAttrs(model)
      })
    },
  })
}
