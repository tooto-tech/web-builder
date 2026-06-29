import type { Editor } from 'grapesjs'

import { WB_CMS_MENU_TREE_TYPE } from '../../dynamic/cms/constants.js'
import { DEFAULT_MENU_TREE_CODE } from '../../dynamic/cms/menuTree/menuTreeAttrs.js'
import { navbarThbScript } from './script.js'
import { NAVBAR_THB_STYLES } from './style.js'

export const WB_NAVBAR_THB_TYPE = 'navbar-thb'

const SEARCH_SVG = `<svg viewBox="0 0 1024 1024" width="18" fill="currentColor"><path d="M497.810286 146.249143C303.652571 146.249143 146.285714 300.141714 146.285714 489.947429c0 189.842286 157.366857 343.771429 351.524572 343.771428 83.017143 0 159.305143-28.16 219.428571-75.227428l114.285714 111.433142 3.035429 2.56c10.605714 7.68 25.6 6.802286 35.218286-2.56a26.075429 26.075429 0 0 0-0.036572-37.485714l-112.932571-110.116571a338.358857 338.358857 0 0 0 92.525714-232.374857C849.298286 300.141714 691.931429 146.285714 497.773714 146.285714z m0 52.955428c164.205714 0 297.325714 130.194286 297.325714 290.742858 0 160.621714-133.12 290.816-297.325714 290.816-164.242286 0-297.398857-130.194286-297.398857-290.779429 0-160.621714 133.12-290.779429 297.398857-290.779429z"/></svg>`

const CLEAR_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15"></circle><path d="M9 9L15 15M15 9L9 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>`

const MOBILE_BACK_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>`

function createNavbarMenuTreeHtml(): string {
  return `
    <div
      data-gjs-type="${WB_CMS_MENU_TREE_TYPE}"
      data-wb-component="cms-menu-tree"
      data-cms-component="menu-tree"
      data-menu-code="${DEFAULT_MENU_TREE_CODE}"
      data-render-mode="tree"
      class="wb-menu-tree site-header__nav-list"
    >
      <nav class="wb-menu-tree-nav" aria-label="Primary menu">
        <ul class="wb-menu-tree-list">
          <li class="wb-menu-tree-item" data-cms-repeat="menuItem@menu.items" data-cms-bind-classappend="menuItem.hasChildrenClass">
            <a class="wb-menu-tree-link" href="#" data-cms-bind-href="menuItem.url" data-cms-bind-target="menuItem.target">
              <span data-cms-bind="menuItem.title">Menu Item</span>
              <img class="wb-menu-tree-icon" src="" alt="" data-cms-bind-src="menuItem.icon" data-cms-bind-alt="menuItem.title">
            </a>
            <ul class="wb-menu-tree-submenu" data-cms-if="menuItem.hasChildren">
              <li class="wb-menu-tree-item" data-cms-repeat="child@menuItem.children" data-cms-bind-classappend="child.hasChildrenClass">
                <a class="wb-menu-tree-link" href="#" data-cms-bind-href="child.url" data-cms-bind-target="child.target">
                  <span data-cms-bind="child.title">Sub Menu Item</span>
                  <img class="wb-menu-tree-icon" src="" alt="" data-cms-bind-src="child.icon" data-cms-bind-alt="child.title">
                </a>
                <ul class="wb-menu-tree-submenu" data-cms-if="child.hasChildren">
                  <li class="wb-menu-tree-item" data-cms-repeat="grandchild@child.children">
                    <a class="wb-menu-tree-link" href="#" data-cms-bind-href="grandchild.url" data-cms-bind-target="grandchild.target">
                      <span data-cms-bind="grandchild.title">Sub Menu Item</span>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>`
}

function createNavbarThbHtml(): string {
  return `
<div class="site-header__inner page-width">
  <nav class="site-header__nav" aria-label="Primary navigation">
    <div class="site-header__logo">
      <a class="site-header__logo-link" href="/">
        <img class="site-header__logo-img" src="" alt="Logo" width="120" height="36" data-default-logo="" data-scrolled-logo="">
      </a>
    </div>

    ${createNavbarMenuTreeHtml()}

    <div class="site-header__actions">
      <div class="site-header__search">
        ${SEARCH_SVG}
        <input type="search" name="q" placeholder="Search..." aria-label="Search" autocomplete="off">
      </div>
      <a href="#" class="btn btn--consult">Consult THB</a>
      <button class="site-header__hamburger" type="button" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>

    <button class="site-header__mobile-search" type="button" aria-label="Search" aria-expanded="false">
      ${SEARCH_SVG}
    </button>
  </nav>
</div>

<div class="site-search" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true">
  <div class="site-search__bar">
    <form class="site-search__form" role="search" action="/search" method="get">
      <i class="site-search__icon" aria-hidden="true">${SEARCH_SVG}</i>
      <input class="site-search__input" type="search" name="q" placeholder="Search products, insights..." aria-label="Search query" autocomplete="off">
      <button class="site-search__clear" type="button" aria-label="Clear search" hidden>${CLEAR_SVG}</button>
    </form>
    <button class="site-search__close" type="button" aria-label="Close search">Cancel</button>
  </div>
</div>

<nav class="nav-mobile" aria-label="Mobile navigation" aria-hidden="true">
  <div class="nav-mobile__content">
    <section class="nav-mobile__panel is-active" data-panel="root">
      <h2 class="nav-mobile__heading">Menu</h2>
      <ul class="nav-mobile__list">
        <li data-cms-repeat="menuItem@menu.items" data-cms-bind-classappend="menuItem.hasChildrenClass">
          <a class="nav-mobile__link" href="#" data-cms-bind-href="menuItem.url" data-cms-bind-target="menuItem.target">
            <span data-cms-bind="menuItem.title">Menu Item</span>
          </a>
          <button class="nav-mobile__expand" type="button" data-cms-if="menuItem.hasChildren" aria-label="Open submenu">
            <span class="nav-mobile__entry-icon" aria-hidden="true">+</span>
          </button>
          <section class="nav-mobile__panel" data-cms-if="menuItem.hasChildren">
            <div class="nav-mobile__heading-row">
              <button class="nav-mobile__back" type="button" data-back aria-label="Back">${MOBILE_BACK_SVG}</button>
              <h2 class="nav-mobile__heading" data-cms-bind="menuItem.title">Menu Item</h2>
            </div>
            <ul class="nav-mobile__list">
              <li data-cms-repeat="child@menuItem.children" data-cms-bind-classappend="child.hasChildrenClass">
                <a class="nav-mobile__link" href="#" data-cms-bind-href="child.url" data-cms-bind-target="child.target">
                  <span data-cms-bind="child.title">Sub Menu Item</span>
                </a>
              </li>
            </ul>
            <a class="nav-mobile__viewall" href="#" data-cms-bind-href="menuItem.url" data-cms-bind-target="menuItem.target">View All <span aria-hidden="true">»</span></a>
          </section>
        </li>
      </ul>
    </section>
  </div>
</nav>`
}

function registerMenuTreePublisherComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_CMS_MENU_TREE_TYPE)) return

  domComponents.addType(WB_CMS_MENU_TREE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-cms-component') === 'menu-tree' ||
      el?.getAttribute?.('data-wb-component') === 'cms-menu-tree'
        ? { type: WB_CMS_MENU_TREE_TYPE }
        : false,
    model: {
      defaults: {
        tagName: 'div',
        droppable: true,
        attributes: {
          'data-wb-component': 'cms-menu-tree',
          'data-cms-component': 'menu-tree',
          'data-menu-code': DEFAULT_MENU_TREE_CODE,
          'data-render-mode': 'tree',
          class: 'wb-menu-tree',
        },
      },
    },
  })
}

export function registerNavbarThbPublisherComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_NAVBAR_THB_TYPE)) return

  registerMenuTreePublisherComponent(editor)

  domComponents.addType(WB_NAVBAR_THB_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.tagName === 'HEADER' && el.classList?.contains('site-header')
        ? { type: WB_NAVBAR_THB_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Navbar THB',
        tagName: 'header',
        classes: ['site-header', 'site-header--fixed-transparent'],
        droppable: false,
        draggable: true,
        copyable: false,
        script: navbarThbScript,
        'script-export': navbarThbScript,
        styles: NAVBAR_THB_STYLES,
        components: createNavbarThbHtml(),
      },
    },
  })
}
