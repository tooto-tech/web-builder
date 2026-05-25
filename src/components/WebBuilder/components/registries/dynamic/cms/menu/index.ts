import type { GrapesEditor } from '../../../../../types/editor'
import { registerCmsComponent, makePreviewHeader } from '@/components/WebBuilder/utils/cmsFactory'
import { WB_CMS_SITE_MENU_TYPE } from '../constants'
import { DEFAULT_SITE_MENU_CODE, resolveSiteMenuAttrs } from './siteMenuAttrs'

export function registerCmsSiteMenu(editor: GrapesEditor) {
  registerCmsComponent(editor, {
    type: WB_CMS_SITE_MENU_TYPE,
    dataWbComponent: 'cms-site-menu',
    dataCmsComponent: 'site-menu',
    name: '站点菜单',
    styleKey: 'wb-site-menu',
    styles: `
      .wb-site-menu {
        width: 100%;
      }
      .wb-site-menu[data-layout="horizontal"] .wb-site-menu__list--depth-0 {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .wb-site-menu__editor-body {
        padding: 16px;
        border: 1px solid #dbe4f0;
        border-radius: 10px;
        background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
      }
      .wb-site-menu__editor-meta {
        margin-bottom: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: #4b5563;
      }
      .wb-site-menu__editor-chip {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 999px;
        background: #fff;
        border: 1px solid #dbe4f0;
      }
      .wb-site-menu__list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .wb-site-menu__list--depth-0 {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .wb-site-menu__item {
        position: relative;
      }
      .wb-site-menu__link,
      .wb-site-menu__label {
        color: #1f2937;
        text-decoration: none;
        font-size: 14px;
        line-height: 1.6;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .wb-site-menu__icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
        flex-shrink: 0;
      }
      .wb-site-menu__text {
        display: inline-block;
      }
      .wb-site-menu__item.is-has-children > .wb-site-menu__label::after,
      .wb-site-menu__item.is-has-children > .wb-site-menu__link::after {
        content: '▾';
        font-size: 10px;
        color: #64748b;
      }
      .wb-site-menu__list--depth-1,
      .wb-site-menu__list--depth-2,
      .wb-site-menu__list--depth-3 {
        margin-top: 10px;
        padding-left: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      @media (max-width: 767px) {
        .wb-site-menu[data-layout="horizontal"] .wb-site-menu__list--depth-0 {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
    defaultAttributes: {
      class: 'wb-site-menu notranslate',
      'data-layout': 'horizontal',
      'data-submenu-trigger': 'hover',
      'data-menu-code': DEFAULT_SITE_MENU_CODE,
      'data-menu-bind-key': 'menu_html_site_menu',
      'data-cms-html': 'menu_html_site_menu',
      'data-wb-i18n-skip': 'true',
      translate: 'no',
    },
    defaultProps: {
      menuCode: DEFAULT_SITE_MENU_CODE,
      menuLayout: 'horizontal',
      submenuTrigger: 'hover',
    },
    traits: [
      {
        type: 'text',
        label: '菜单 Code',
        name: 'menuCode',
        changeProp: true,
        placeholder: 'main-menu',
      },
      {
        type: 'select',
        label: '布局',
        name: 'menuLayout',
        changeProp: true,
        options: [
          { value: 'horizontal', label: '横向' },
          { value: 'vertical', label: '纵向' },
        ],
      },
      {
        type: 'select',
        label: '子菜单触发',
        name: 'submenuTrigger',
        changeProp: true,
        options: [
          { value: 'hover', label: 'Hover' },
          { value: 'click', label: 'Click' },
        ],
      },
    ],
    components: [
      makePreviewHeader('wb-site-menu__editor-header', '🧭 站点菜单 — 发布时由后端展开成最终静态菜单'),
      {
        tagName: 'div',
        attributes: { class: 'wb-site-menu__editor-body' },
        components: [
          {
            tagName: 'div',
            attributes: { class: 'wb-site-menu__editor-meta' },
            components: [
              { tagName: 'span', attributes: { class: 'wb-site-menu__editor-chip' }, content: 'Menu Code: main-menu' },
              { tagName: 'span', attributes: { class: 'wb-site-menu__editor-chip' }, content: 'Layout: horizontal' },
              { tagName: 'span', attributes: { class: 'wb-site-menu__editor-chip' }, content: 'Trigger: hover' },
            ],
          },
          {
            tagName: 'ul',
            attributes: { class: 'wb-site-menu__list wb-site-menu__list--depth-0' },
            components: [
              { tagName: 'li', attributes: { class: 'wb-site-menu__item' }, components: [{ tagName: 'span', attributes: { class: 'wb-site-menu__label' }, content: 'Home' }] },
              { tagName: 'li', attributes: { class: 'wb-site-menu__item is-has-children' }, components: [{ tagName: 'span', attributes: { class: 'wb-site-menu__label' }, content: 'Products' }] },
              { tagName: 'li', attributes: { class: 'wb-site-menu__item' }, components: [{ tagName: 'span', attributes: { class: 'wb-site-menu__label' }, content: 'Contact' }] },
            ],
          },
        ],
      },
    ],
    watchProps: ['menuCode', 'menuLayout', 'submenuTrigger'],
    syncAttrs: resolveSiteMenuAttrs,
  })
}
