import type { Editor } from 'grapesjs'
import { navbarThbScript } from './script'
import { NAVBAR_THB_STYLES } from './style'
import { applyStyleVars, toPx } from '../navbar/helpers'
import { WB_CMS_MENU_TREE_TYPE } from '../../dynamic/cms/constants'
import { DEFAULT_MENU_TREE_CODE } from '../../dynamic/cms/menuTree/menuTreeAttrs'
import {
  makeTHBDropdown,
  makeTHBDropdownLink,
  makeTHBMega,
  makeTHBMegaItem,
  makeTHBNavGroup,
  makeTHBNavItem,
  type ThbNavItem,
} from './factories'

export const WB_NAVBAR_THB_TYPE = 'navbar-thb'
export const TYPE_THB_NAV_LIST = 'navbar-thb-nav-list'
export const TYPE_THB_NAV_ITEM = 'navbar-thb-nav-item'
export const TYPE_THB_NAV_GROUP = 'navbar-thb-nav-group'
export const TYPE_THB_DROPDOWN = 'navbar-thb-dropdown'
export const TYPE_THB_DROPDOWN_LINK = 'navbar-thb-dropdown-link'
export const TYPE_THB_MEGA = 'navbar-thb-mega'
export const TYPE_THB_MEGA_COL = 'navbar-thb-mega-col'
export const TYPE_THB_MEGA_ITEM = 'navbar-thb-mega-item'

const SEARCH_SVG = `<svg viewBox="0 0 1024 1024" width="18" fill="currentColor"><path d="M497.810286 146.249143C303.652571 146.249143 146.285714 300.141714 146.285714 489.947429c0 189.842286 157.366857 343.771429 351.524572 343.771428 83.017143 0 159.305143-28.16 219.428571-75.227428l114.285714 111.433142 3.035429 2.56c10.605714 7.68 25.6 6.802286 35.218286-2.56a26.075429 26.075429 0 0 0-0.036572-37.485714l-112.932571-110.116571a338.358857 338.358857 0 0 0 92.525714-232.374857C849.298286 300.141714 691.931429 146.285714 497.773714 146.285714z m0 52.955428c164.205714 0 297.325714 130.194286 297.325714 290.742858 0 160.621714-133.12 290.816-297.325714 290.816-164.242286 0-297.398857-130.194286-297.398857-290.779429 0-160.621714 133.12-290.779429 297.398857-290.779429z"/></svg>`

const CLEAR_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15"></circle><path d="M9 9L15 15M15 9L9 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>`

const MOBILE_BACK_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>`

const THB_NAVBAR_MODE_OPTIONS = [
  { id: 'transparent-fixed', name: '透明吸顶' },
  { id: 'sticky', name: '普通吸顶' },
]

const THB_MENU_ALIGN_OPTIONS = [
  { id: 'left', name: '左对齐' },
  { id: 'center', name: '居中' },
  { id: 'right', name: '右对齐' },
]

// ── Helper: find first immediate child with a given class ──────────────────
function findChildByClass(model: any, className: string): any | null {
  const comps = model?.components?.() as any
  let found: any = null
  comps?.each?.((c: any) => {
    if (!found && c?.getClasses?.()?.includes?.(className)) found = c
  })
  return found
}

function readFirstTextnodeContent(model: any): string {
  let text = ''
  model?.components?.()?.each?.((c: any) => {
    if (!text && c?.get?.('type') === 'textnode') text = `${c.get('content') ?? ''}`
  })
  return text
}

function getFirst(model: any, selector: string): any | null {
  return model?.find?.(selector)?.[0] ?? null
}

function setTextContent(model: any, value: string) {
  let touched = false
  model?.components?.()?.each?.((c: any) => {
    if (c?.get?.('type') === 'textnode') {
      touched = true
      if (`${c.get?.('content') ?? ''}` !== value) c.set('content', value)
    }
  })
  if (!touched && value) model?.components?.(value)
}

function applyTHBMode(model: any, mode: string) {
  const value = mode || 'transparent-fixed'
  model.removeClass?.('site-header--sticky')
  model.removeClass?.('site-header--fixed-transparent')
  model.addClass?.(value === 'sticky' ? 'site-header--sticky' : 'site-header--fixed-transparent')
}

function applyTHBMenuAlign(model: any, align: string) {
  const value = align || 'center'
  model.removeClass?.('site-header--menu-left')
  model.removeClass?.('site-header--menu-right')
  if (value === 'left') model.addClass?.('site-header--menu-left')
  if (value === 'right') model.addClass?.('site-header--menu-right')
}

function applyTHBLogo(model: any) {
  const defaultLogo = ((model.get('thbLogoDefault') as string) || '').trim()
  const scrolledLogo = ((model.get('thbLogoScrolled') as string) || '').trim()
  const href = ((model.get('thbLogoHref') as string) || '/').trim() || '/'
  const alt = ((model.get('thbLogoAlt') as string) || 'Logo').trim() || 'Logo'
  const logoLink = getFirst(model, '.site-header__logo-link') || getFirst(model, '.site-header__logo a')
  const logoImg = getFirst(model, '.site-header__logo-img') || getFirst(model, '.site-header__logo img')

  logoLink?.addClass?.('site-header__logo-link')
  logoLink?.addAttributes?.({ href })
  if (logoImg) {
    logoImg.addClass?.('site-header__logo-img')
    const nextSrc = defaultLogo || scrolledLogo
    const nextAttrs: Record<string, string> = {
      src: nextSrc,
      alt,
      'data-default-logo': defaultLogo,
      'data-scrolled-logo': scrolledLogo,
    }
    logoImg.addAttributes?.(nextAttrs)
  }
}

function applyTHBRootTraits(model: any) {
  const bg = ((model.get('thbBg') as string) || '').trim()
  const scrollBg = ((model.get('thbScrollBg') as string) || '').trim()
  const color = ((model.get('thbColor') as string) || '').trim()
  const scrollColor = ((model.get('thbScrollColor') as string) || '').trim()
  const primary = ((model.get('thbPrimaryColor') as string) || '').trim()
  const ctaText = ((model.get('thbCtaText') as string) || 'Consult THB').trim() || 'Consult THB'
  const ctaHref = ((model.get('thbCtaHref') as string) || '#').trim() || '#'

  applyTHBMode(model, (model.get('thbMode') as string) || 'transparent-fixed')
  applyTHBMenuAlign(model, (model.get('thbMenuAlign') as string) || 'center')
  applyTHBLogo(model)
  applyStyleVars(model, {
    '--primary-blue': primary || '#3C53E8',
    '--thb-header-bg': bg || 'transparent',
    '--thb-header-scroll-bg': scrollBg || '#ffffff',
    '--thb-header-link-color': color || '#0C1029',
    '--thb-header-scroll-link-color': scrollColor || color || '#0C1029',
    '--header-height': toPx(model.get('thbHeight') as string | number | undefined, 64),
    '--thb-mobile-header-height': toPx(model.get('thbMobileHeight') as string | number | undefined, 60),
    '--thb-gutter': toPx(model.get('thbGutter') as string | number | undefined, 40),
    '--thb-mobile-gutter': toPx(model.get('thbMobileGutter') as string | number | undefined, 20),
    '--thb-nav-gap': toPx(model.get('thbNavGap') as string | number | undefined, 40),
    '--thb-logo-height': toPx(model.get('thbLogoHeight') as string | number | undefined, 36),
    '--thb-mobile-logo-height': toPx(model.get('thbLogoMobileHeight') as string | number | undefined, 32),
  })

  const ctaEl = getFirst(model, '.btn--consult')
  if (ctaEl) {
    ctaEl.addAttributes?.({ href: ctaHref })
    setTextContent(ctaEl, ctaText)
  }
}

// ── Type-switch logic for nav group ───────────────────────────────────────

function extractTHBDropdownItems(dropdownWrapComp: any): ThbNavItem[] {
  const items: ThbNavItem[] = []
  const inner = findChildByClass(dropdownWrapComp, 'site-header__dropdown')
  inner?.components?.()?.each?.((c: any) => {
    if (c?.getClasses?.()?.includes?.('site-header__dropdown-link')) {
      const text = readFirstTextnodeContent(c).trim()
      const href = String(c?.getAttributes?.()?.href || '#')
      if (text) items.push({ text, href })
    }
  })
  return items
}

function extractTHBMegaItems(dropdownWrapComp: any): ThbNavItem[] {
  const items: ThbNavItem[] = []
  // dropdown-wrap > dropdown--mega > mega > first mega-col > mega-list > mega-item
  const dropdown = findChildByClass(dropdownWrapComp, 'site-header__dropdown')
  const mega = findChildByClass(dropdown, 'site-header__mega')
  const firstCol = mega?.components?.()?.at?.(0)
  const megaList = findChildByClass(firstCol, 'site-header__mega-list')
  megaList?.components?.()?.each?.((c: any) => {
    if (c?.getClasses?.()?.includes?.('site-header__mega-item')) {
      const text = readFirstTextnodeContent(c).trim()
      const href = String(c?.getAttributes?.()?.href || '#')
      if (text) items.push({ text, href })
    }
  })
  return items
}

function applyTHBNavGroupType(model: any) {
  const menuType = model.get('thbNgType') as 'dropdown' | 'mega'
  const components = model.components() as any
  let panelComp: any = null

  components?.each?.((c: any) => {
    if (c?.getClasses?.()?.includes?.('site-header__dropdown-wrap')) panelComp = c
  })

  if (!panelComp) return

  const isMega = !!(
    findChildByClass(panelComp, 'site-header__dropdown--mega')
    || panelComp?.find?.('.site-header__dropdown--mega')?.length
  )
  const panelMatchesExpected = menuType === 'mega' ? isMega : !isMega

  if (!panelMatchesExpected) {
    let newPanel: any
    if (menuType === 'mega') {
      const existingItems = extractTHBDropdownItems(panelComp)
      newPanel = makeTHBMega(existingItems)
    } else {
      const existingItems = extractTHBMegaItems(panelComp)
      newPanel = makeTHBDropdown(existingItems)
    }
    panelComp.remove?.()
    components.add?.(newPanel)
  }
}

function applyTHBNavGroupLabel(model: any) {
  const label = (model.get('thbNgLabel') as string) || ''
  if (!label) return
  const link = findChildByClass(model, 'site-header__nav-link')
  link?.components?.()?.each?.((c: any) => {
    if (c?.get?.('type') === 'textnode' && `${c.get('content') ?? ''}` !== label) {
      c.set('content', label)
    }
  })
}

function applyTHBNavGroupHref(model: any) {
  const href = (model.get('thbNgHref') as string) || '#'
  const link = findChildByClass(model, 'site-header__nav-link')
  if (link) {
    const attrs = link.getAttributes?.() ?? {}
    if (attrs.href !== href) link.addAttributes?.({ href })
  }
}

// ── HTML template for the initial block content ────────────────────────────

function createNavbarMenuTreeHtml(): string {
  return `
    <div
      data-gjs-type="${WB_CMS_MENU_TREE_TYPE}"
      data-wb-component="cms-menu-tree"
      data-cms-component="menu-tree"
      data-menu-code="${DEFAULT_MENU_TREE_CODE}"
      data-menu-data-key=""
      class="wb-menu-tree site-header__nav-list"
      style="display:flex;gap:var(--thb-nav-gap);list-style:none;margin:0;padding:0;width:auto"
    >
      <nav class="wb-menu-tree-nav" data-menu-role="root">
        <ul class="wb-menu-tree-list" data-menu-role="list" data-menu-level="0">
          <li class="wb-menu-tree-item" data-menu-role="item" data-menu-level="0" data-cms-repeat="menuItem@menuItems" data-cms-bind-classappend="menuItem.hasChildrenClass">
            <a class="wb-menu-tree-link" href="#" data-menu-role="link" data-cms-bind-href="menuItem.url" data-cms-bind-target="menuItem.target">
              <img class="wb-menu-tree-icon" src="" alt="" data-cms-if="menuItem.icon" data-cms-bind-src="menuItem.icon" data-cms-bind-alt="menuItem.title">
              <span class="wb-menu-tree-text" data-cms-bind="menuItem.title">Menu Item</span>
            </a>
            <ul class="wb-menu-tree-submenu" data-menu-role="list" data-menu-level="1" data-cms-if="menuItem.hasChildren">
              <li class="wb-menu-tree-item" data-menu-role="item" data-menu-level="1" data-cms-repeat="child@menuItem.children" data-cms-bind-classappend="child.hasChildrenClass">
                <a class="wb-menu-tree-link" href="#" data-menu-role="link" data-cms-bind-href="child.url" data-cms-bind-target="child.target">
                  <img class="wb-menu-tree-icon" src="" alt="" data-cms-if="child.icon" data-cms-bind-src="child.icon" data-cms-bind-alt="child.title">
                  <span class="wb-menu-tree-text" data-cms-bind="child.title">Sub Menu Item</span>
                </a>
                <ul class="wb-menu-tree-submenu" data-menu-role="list" data-menu-level="2" data-cms-if="child.hasChildren">
                  <li class="wb-menu-tree-item" data-menu-role="item" data-menu-level="2" data-cms-repeat="grandchild@child.children" data-cms-bind-classappend="grandchild.hasChildrenClass">
                    <a class="wb-menu-tree-link" href="#" data-menu-role="link" data-cms-bind-href="grandchild.url" data-cms-bind-target="grandchild.target">
                      <img class="wb-menu-tree-icon" src="" alt="" data-cms-if="grandchild.icon" data-cms-bind-src="grandchild.icon" data-cms-bind-alt="grandchild.title">
                      <span class="wb-menu-tree-text" data-cms-bind="grandchild.title">Sub Menu Item</span>
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

function createNavbarMobileMenuTreeHtml(): string {
  return `
<nav
  class="nav-mobile"
  aria-hidden="true"
  data-gjs-type="${WB_CMS_MENU_TREE_TYPE}"
  data-wb-component="cms-menu-tree"
  data-cms-component="menu-tree"
  data-menu-code="${DEFAULT_MENU_TREE_CODE}"
  data-menu-data-key=""
>
  <div class="nav-mobile__content">
    <section class="nav-mobile__panel is-active" data-panel="root">
      <h2 class="nav-mobile__heading">Menu</h2>
      <ul class="nav-mobile__list">
        <li data-cms-repeat="menuItem@menuItems" data-cms-bind-classappend="menuItem.hasChildrenClass">
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
                <button class="nav-mobile__expand" type="button" data-cms-if="child.hasChildren" aria-label="Open submenu">
                  <span class="nav-mobile__entry-icon" aria-hidden="true">+</span>
                </button>
                <section class="nav-mobile__panel" data-cms-if="child.hasChildren">
                  <div class="nav-mobile__heading-row">
                    <button class="nav-mobile__back" type="button" data-back aria-label="Back">${MOBILE_BACK_SVG}</button>
                    <h2 class="nav-mobile__heading" data-cms-bind="child.title">Sub Menu Item</h2>
                  </div>
                  <ul class="nav-mobile__list">
                    <li data-cms-repeat="grandchild@child.children" data-cms-bind-classappend="grandchild.hasChildrenClass">
                      <a class="nav-mobile__link" href="#" data-cms-bind-href="grandchild.url" data-cms-bind-target="grandchild.target">
                        <span data-cms-bind="grandchild.title">Sub Menu Item</span>
                      </a>
                    </li>
                  </ul>
                  <a class="nav-mobile__viewall" href="#" data-cms-bind-href="child.url" data-cms-bind-target="child.target">View All <span aria-hidden="true">»</span></a>
                </section>
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
      <svg viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor"><path d="M497.810286 146.249143C303.652571 146.249143 146.285714 300.141714 146.285714 489.947429c0 189.842286 157.366857 343.771429 351.524572 343.771428 83.017143 0 159.305143-28.16 219.428571-75.227428l114.285714 111.433142 3.035429 2.56c10.605714 7.68 25.6 6.802286 35.218286-2.56a26.075429 26.075429 0 0 0-0.036572-37.485714l-112.932571-110.116571a338.358857 338.358857 0 0 0 92.525714-232.374857C849.298286 300.141714 691.931429 146.285714 497.773714 146.285714z m0 52.955428c164.205714 0 297.325714 130.194286 297.325714 290.742858 0 160.621714-133.12 290.816-297.325714 290.816-164.242286 0-297.398857-130.194286-297.398857-290.779429 0-160.621714 133.12-290.779429 297.398857-290.779429z"/></svg>
    </button>
  </nav>
</div>

<div class="site-search" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true">
  <div class="site-search__bar">
    <form class="site-search__form" role="search" action="/search" method="get">
      <i class="site-search__icon" aria-hidden="true">${SEARCH_SVG}</i>
      <input class="site-search__input" type="search" name="q" placeholder="Search products, insights…" aria-label="Search query" autocomplete="off">
      <button class="site-search__clear" type="button" aria-label="Clear search" hidden>${CLEAR_SVG}</button>
    </form>
    <button class="site-search__close" type="button" aria-label="Close search">Cancel</button>
  </div>
  <div class="site-search__body" aria-live="polite"></div>
</div>

${createNavbarMobileMenuTreeHtml()}
`
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="2" y="3" width="20" height="5" rx="1"/>
  <line x1="4" y1="5.5" x2="7" y2="5.5" stroke-width="2"/>
  <line x1="9" y1="5.5" x2="12" y2="5.5"/>
  <line x1="14" y1="5.5" x2="16" y2="5.5"/>
  <circle cx="19" cy="5.5" r="1.5" fill="currentColor" stroke="none"/>
  <line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="3 2"/>
  <line x1="2" y1="16" x2="14" y2="16"/>
  <line x1="2" y1="20" x2="10" y2="20"/>
</svg>`

function hasClass(el: HTMLElement, className: string): boolean {
  return Boolean(el.classList?.contains(className))
}

export function registerNavbarThbComponent(editor: Editor): void {
  const { DomComponents, BlockManager } = editor

  if (!(editor as any)._wbNavbarThbStyleInjected) {
    editor.addStyle?.(NAVBAR_THB_STYLES)
    ;(editor as any)._wbNavbarThbStyleInjected = true
  }

  // ── Leaf types ────────────────────────────────────────────────────────

  DomComponents.addType(TYPE_THB_DROPDOWN, {
    isComponent: (el: HTMLElement) =>
      hasClass(el, 'site-header__dropdown-wrap') && !el.querySelector('.site-header__dropdown--mega')
        ? { type: TYPE_THB_DROPDOWN }
        : undefined,
    model: {
      defaults: {
        name: 'Dropdown Panel',
        tagName: 'div',
        classes: ['site-header__dropdown-wrap'],
        attributes: { 'aria-hidden': 'true' },
        selectable: false,
        hoverable: false,
        layerable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
      },
    },
  })

  DomComponents.addType(TYPE_THB_MEGA, {
    isComponent: (el: HTMLElement) =>
      hasClass(el, 'site-header__dropdown-wrap') && !!el.querySelector('.site-header__dropdown--mega')
        ? { type: TYPE_THB_MEGA }
        : undefined,
    model: {
      defaults: {
        name: 'Mega Panel',
        tagName: 'div',
        classes: ['site-header__dropdown-wrap'],
        attributes: { 'aria-hidden': 'true' },
        selectable: false,
        hoverable: false,
        layerable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
      },
    },
  })

  DomComponents.addType(TYPE_THB_DROPDOWN_LINK, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'A' && hasClass(el, 'site-header__dropdown-link')
        ? { type: TYPE_THB_DROPDOWN_LINK }
        : undefined,
    extend: 'link',
    model: {
      defaults: {
        name: 'Dropdown Link',
        tagName: 'a',
        draggable: true,
        droppable: false,
        copyable: true,
        removable: true,
        traits: [
          { type: 'text', label: 'Label', name: 'content', changeProp: true },
          { type: 'page-link', label: 'Href', name: 'href', placeholder: '#' },
          { type: 'select', label: 'Target', name: 'target', options: [{ id: '', name: 'Same tab' }, { id: '_blank', name: 'New tab' }] },
        ],
      },
    },
  })

  DomComponents.addType(TYPE_THB_MEGA_ITEM, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'A' && hasClass(el, 'site-header__mega-item')
        ? { type: TYPE_THB_MEGA_ITEM }
        : undefined,
    extend: 'link',
    model: {
      defaults: {
        name: 'Mega Item',
        tagName: 'a',
        draggable: true,
        droppable: false,
        copyable: true,
        removable: true,
        traits: [
          { type: 'text', label: 'Label', name: 'content', changeProp: true },
          { type: 'page-link', label: 'Href', name: 'href', placeholder: '#' },
          { type: 'select', label: 'Target', name: 'target', options: [{ id: '', name: 'Same tab' }, { id: '_blank', name: 'New tab' }] },
        ],
      },
    },
  })

  // ── Mega col ──────────────────────────────────────────────────────────

  DomComponents.addType(TYPE_THB_MEGA_COL, {
    isComponent: (el: HTMLElement) =>
      hasClass(el, 'site-header__mega-col') && !hasClass(el, 'site-header__mega-col--right')
        ? { type: TYPE_THB_MEGA_COL }
        : undefined,
    model: {
      defaults: {
        name: 'Mega Column',
        tagName: 'div',
        draggable: true,
        droppable: false,
        copyable: true,
        removable: true,
        traits: [
          {
            type: 'button' as any,
            name: 'add-mega-item',
            label: false as const,
            text: '+ Add Item',
            full: true,
            command(this: any, currentEditor: Editor) {
              const target = currentEditor.getSelected?.()?.closestType?.(TYPE_THB_MEGA_COL)
                ?? currentEditor.getSelected?.()
              if (!target) return
              const list = findChildByClass(target, 'site-header__mega-list')
              if (list) {
                const created = (list.components() as any).add(makeTHBMegaItem('New Item'))
                if (created) currentEditor.select(created)
              }
            },
          },
        ],
      },
    },
  })

  // ── Nav group ─────────────────────────────────────────────────────────

  DomComponents.addType(TYPE_THB_NAV_GROUP, {
    isComponent: (el: HTMLElement) => {
      if (el.tagName !== 'LI' || !hasClass(el, 'site-header__nav-item--has-dropdown')) {
        return undefined
      }
      const isMega = !!el.querySelector('.site-header__dropdown--mega')
      return { type: TYPE_THB_NAV_GROUP, thbNgType: isMega ? 'mega' : 'dropdown' }
    },
    model: {
      defaults: {
        name: 'Nav Group',
        tagName: 'li',
        draggable: `[data-gjs-type="${TYPE_THB_NAV_LIST}"]`,
        droppable: false,
        copyable: true,
        removable: true,
        thbNgLabel: '',
        thbNgHref: '#',
        thbNgType: 'dropdown',
        traits: [
          { type: 'text', label: 'Label', name: 'thbNgLabel', changeProp: true },
          { type: 'page-link', label: 'Href', name: 'thbNgHref', changeProp: true },
          {
            type: 'select',
            label: '菜单类型',
            name: 'thbNgType',
            changeProp: true,
            options: [
              { id: 'dropdown', name: '普通下拉' },
              { id: 'mega', name: '超级菜单' },
            ],
          },
          {
            type: 'button' as any,
            name: 'add-dropdown-item',
            label: false as const,
            text: '+ Add Item',
            full: true,
            command(this: any, currentEditor: Editor) {
              const target = currentEditor.getSelected?.()?.closestType?.(TYPE_THB_NAV_GROUP)
                ?? currentEditor.getSelected?.()
              if (!target) return
              const comps = target.components() as any
              let dropdownWrap: any = null
              comps?.each?.((c: any) => {
                if (!dropdownWrap && c?.getClasses?.()?.includes?.('site-header__dropdown-wrap')) {
                  dropdownWrap = c
                }
              })
              if (!dropdownWrap) return
              const dropdown = findChildByClass(dropdownWrap, 'site-header__dropdown')
              if (dropdown) {
                const created = (dropdown.components() as any).add(makeTHBDropdownLink('New Item'))
                if (created) currentEditor.select(created)
              }
            },
          },
        ],
      },
      init(this: any) {
        // Infer type from existing DOM structure
        const inferredType = this.get('thbNgType') as string
        // Sync label from child link if not already set
        if (!this.get('thbNgLabel')) {
          const link = findChildByClass(this, 'site-header__nav-link')
          const text = link ? readFirstTextnodeContent(link).trim() : ''
          if (text) this.set('thbNgLabel', text, { silent: true })
        }
        if (!this.get('thbNgHref') || this.get('thbNgHref') === '#') {
          const link = findChildByClass(this, 'site-header__nav-link')
          const href = link?.getAttributes?.()?.href
          if (href && href !== '#') this.set('thbNgHref', href, { silent: true })
        }

        this.listenTo(this, 'change:thbNgLabel', () => applyTHBNavGroupLabel(this))
        this.listenTo(this, 'change:thbNgHref', () => applyTHBNavGroupHref(this))
        this.listenTo(this, 'change:thbNgType', () => applyTHBNavGroupType(this))

        applyTHBNavGroupLabel(this)
        if (inferredType) applyTHBNavGroupType(this)
      },
    },
  })

  // ── Simple nav item ───────────────────────────────────────────────────

  DomComponents.addType(TYPE_THB_NAV_ITEM, {
    isComponent: (el: HTMLElement) => {
      if (el.tagName !== 'LI' || !hasClass(el, 'site-header__nav-item')) return undefined
      if (hasClass(el, 'site-header__nav-item--has-dropdown')) return undefined
      return { type: TYPE_THB_NAV_ITEM }
    },
    model: {
      defaults: {
        name: 'Nav Item',
        tagName: 'li',
        draggable: `[data-gjs-type="${TYPE_THB_NAV_LIST}"]`,
        droppable: false,
        copyable: true,
        removable: true,
        thbNiLabel: '',
        thbNiHref: '#',
        traits: [
          { type: 'text', label: 'Label', name: 'thbNiLabel', changeProp: true },
          { type: 'page-link', label: 'Href', name: 'thbNiHref', changeProp: true },
          { type: 'select', label: 'Target', name: 'thbNiTarget', changeProp: true, options: [{ id: '', name: 'Same tab' }, { id: '_blank', name: 'New tab' }] },
        ],
      },
      init(this: any) {
        if (!this.get('thbNiLabel')) {
          const link = findChildByClass(this, 'site-header__nav-link')
          const text = link ? readFirstTextnodeContent(link).trim() : ''
          if (text) this.set('thbNiLabel', text, { silent: true })
        }
        if (!this.get('thbNiHref') || this.get('thbNiHref') === '#') {
          const link = findChildByClass(this, 'site-header__nav-link')
          const href = link?.getAttributes?.()?.href
          if (href) this.set('thbNiHref', href, { silent: true })
        }

        this.listenTo(this, 'change:thbNiLabel', () => {
          const label = (this.get('thbNiLabel') as string) || ''
          const link = findChildByClass(this, 'site-header__nav-link')
          link?.components?.()?.each?.((c: any) => {
            if (c?.get?.('type') === 'textnode' && `${c.get('content') ?? ''}` !== label) {
              c.set('content', label)
            }
          })
        })
        this.listenTo(this, 'change:thbNiHref', () => {
          const href = (this.get('thbNiHref') as string) || '#'
          const link = findChildByClass(this, 'site-header__nav-link')
          if (link) link.addAttributes?.({ href })
        })
        this.listenTo(this, 'change:thbNiTarget', () => {
          const target = (this.get('thbNiTarget') as string) || ''
          const link = findChildByClass(this, 'site-header__nav-link')
          if (link) link.addAttributes?.({ target })
        })
      },
    },
  })

  // ── Nav list ──────────────────────────────────────────────────────────

  DomComponents.addType(TYPE_THB_NAV_LIST, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'UL' && hasClass(el, 'site-header__nav-list')
        ? { type: TYPE_THB_NAV_LIST }
        : undefined,
    model: {
      defaults: {
        name: 'Nav List',
        tagName: 'ul',
        draggable: false,
        copyable: false,
        removable: false,
        droppable: `[data-gjs-type="${TYPE_THB_NAV_ITEM}"],[data-gjs-type="${TYPE_THB_NAV_GROUP}"]`,
        thbMenuSourceId: '',
        traits: [
          { type: 'navbar-thb-menu-select', label: '后台菜单', name: 'thbMenuSourceId', changeProp: true },
          {
            type: 'button' as any,
            name: 'add-nav-item',
            label: false as const,
            text: '+ Add Link',
            full: true,
            command(this: any, currentEditor: Editor) {
              const target = currentEditor.getSelected?.()?.closestType?.(TYPE_THB_NAV_LIST)
                ?? currentEditor.getSelected?.()
              if (!target) return
              const created = (target.components() as any).add(makeTHBNavItem('New Link'))
              if (created) currentEditor.select(created)
            },
          },
          {
            type: 'button' as any,
            name: 'add-nav-group',
            label: false as const,
            text: '+ Add Dropdown',
            full: true,
            command(this: any, currentEditor: Editor) {
              const target = currentEditor.getSelected?.()?.closestType?.(TYPE_THB_NAV_LIST)
                ?? currentEditor.getSelected?.()
              if (!target) return
              const created = (target.components() as any).add(
                makeTHBNavGroup('New Menu', '#', 'dropdown'),
              )
              if (created) currentEditor.select(created)
            },
          },
        ],
      },
    },
  })

  // ── Root navbar-thb ───────────────────────────────────────────────────

  DomComponents.addType(WB_NAVBAR_THB_TYPE, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'HEADER' && hasClass(el, 'site-header')
        ? { type: WB_NAVBAR_THB_TYPE }
        : undefined,
    model: {
      defaults: {
        name: 'Navbar THB',
        tagName: 'header',
        classes: ['site-header'],
        droppable: false,
        draggable: true,
        copyable: false,
        script: navbarThbScript,
        'script-export': navbarThbScript,
        styles: NAVBAR_THB_STYLES,
        thbMode: 'transparent-fixed',
        thbMenuAlign: 'center',
        thbBg: 'transparent',
        thbScrollBg: '#ffffff',
        thbColor: '#0C1029',
        thbScrollColor: '#0C1029',
        thbHeight: 64,
        thbMobileHeight: 60,
        thbGutter: 40,
        thbMobileGutter: 20,
        thbNavGap: 40,
        thbLogoDefault: '',
        thbLogoScrolled: '',
        thbLogoHref: '/',
        thbLogoAlt: 'Logo',
        thbLogoHeight: 36,
        thbLogoMobileHeight: 32,
        thbPrimaryColor: '#3C53E8',
        thbCtaText: 'Consult THB',
        thbCtaHref: '#',
        traits: [
          {
            type: 'select',
            label: 'Navbar 类型',
            name: 'thbMode',
            changeProp: true,
            options: THB_NAVBAR_MODE_OPTIONS,
          },
          {
            type: 'select',
            label: '菜单对齐',
            name: 'thbMenuAlign',
            changeProp: true,
            options: THB_MENU_ALIGN_OPTIONS,
          },
          ({ type: 'image-picker', label: '默认 Logo', name: 'thbLogoDefault', changeProp: true, ui: { showPreview: true } } as any),
          ({ type: 'image-picker', label: '滚动后 Logo', name: 'thbLogoScrolled', changeProp: true, ui: { showPreview: true } } as any),
          { type: 'page-link', label: 'Logo 链接', name: 'thbLogoHref', changeProp: true },
          { type: 'text', label: 'Logo Alt', name: 'thbLogoAlt', changeProp: true },
          { type: 'color-picker', label: '主题色', name: 'thbPrimaryColor', changeProp: true },
          { type: 'color-picker', label: '默认背景色', name: 'thbBg', changeProp: true },
          { type: 'color-picker', label: '滚动后背景色', name: 'thbScrollBg', changeProp: true },
          { type: 'color-picker', label: '链接默认色', name: 'thbColor', changeProp: true },
          { type: 'color-picker', label: '链接滚动色', name: 'thbScrollColor', changeProp: true },
          { type: 'number', label: '桌面高度 (px)', name: 'thbHeight', changeProp: true, min: 40, max: 200 },
          { type: 'number', label: '移动高度 (px)', name: 'thbMobileHeight', changeProp: true, min: 40, max: 120 },
          { type: 'number', label: '桌面左右留白 (px)', name: 'thbGutter', changeProp: true, min: 0, max: 160 },
          { type: 'number', label: '移动左右留白 (px)', name: 'thbMobileGutter', changeProp: true, min: 0, max: 80 },
          { type: 'number', label: '菜单间距 (px)', name: 'thbNavGap', changeProp: true, min: 8, max: 120 },
          { type: 'number', label: 'Logo 高度 (px)', name: 'thbLogoHeight', changeProp: true, min: 16, max: 120 },
          { type: 'number', label: '移动 Logo 高度 (px)', name: 'thbLogoMobileHeight', changeProp: true, min: 16, max: 96 },
          { type: 'text', label: 'CTA 文字', name: 'thbCtaText', changeProp: true },
          { type: 'page-link', label: 'CTA 链接', name: 'thbCtaHref', changeProp: true },
        ],
        components: createNavbarThbHtml(),
      },
      init(this: any) {
        this.listenTo(
          this,
          'change:thbMode change:thbMenuAlign change:thbBg change:thbScrollBg change:thbColor change:thbScrollColor change:thbHeight change:thbMobileHeight change:thbGutter change:thbMobileGutter change:thbNavGap change:thbLogoDefault change:thbLogoScrolled change:thbLogoHref change:thbLogoAlt change:thbLogoHeight change:thbLogoMobileHeight change:thbPrimaryColor change:thbCtaText change:thbCtaHref',
          () => applyTHBRootTraits(this),
        )
        applyTHBRootTraits(this)
      },
    },
  })

  try {
    BlockManager.add('navbar-thb-component', {
      label: 'Navbar THB',
      category: 'Navigation',
      media: BLOCK_ICON,
      content: { type: WB_NAVBAR_THB_TYPE },
    })
  } catch (_) {
    // ignore
  }
}
