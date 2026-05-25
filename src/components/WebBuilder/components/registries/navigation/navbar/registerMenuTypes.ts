import type { Editor } from 'grapesjs'
import {
  LINK_TARGET_OPTIONS,
  TYPE_DROPDOWN,
  TYPE_DROPDOWN_ITEM,
  TYPE_NAVBAR_LINK,
  TYPE_NAVBAR_MENU,
  TYPE_NAV_GROUP,
} from './constants'
import { makeDropdownItem, makeLink, makeNavGroup } from './factories'
import {
  applyStyleVars,
  findImmediateChildByClass,
  readFirstTextnodeContent,
  resolveTraitTarget,
  toCssSize,
  toPx,
  writeFirstTextnodeContent,
} from './helpers'

function createTargetTrait() {
  return {
    type: 'select',
    label: 'Target',
    name: 'target',
    options: LINK_TARGET_OPTIONS,
  }
}

function createAddChildTrait(
  name: string,
  text: string,
  expectedType: string,
  factory: () => any,
) {
  return {
    type: 'button' as any,
    name,
    label: false as const,
    text,
    full: true,
    command(this: any, editor: Editor) {
      const target = resolveTraitTarget(editor, expectedType, this)
      if (!target) return

      const created = (target.components() as any).add(factory())
      if (created) editor.select(created)
    },
  }
}

function applyInlineLabel(model: any) {
  let label = (model.get('content') as string) || ''

  if (!label) {
    label = readFirstTextnodeContent(model)
    if (label) model.set('content', label)
  }

  if (!label) return
  writeFirstTextnodeContent(model, label)
}

function applyMenuTraits(model: any) {
  applyStyleVars(model, {
    '--wb-navbar-menu-gap': toPx(model.get('nmGap') as string | number | undefined, 28),
    '--wb-navbar-drawer-width': toCssSize(
      model.get('nmDrawerWidth') as string | number | undefined,
      '360px',
    ),
    '--wb-navbar-drawer-bg': ((model.get('nmDrawerBg') as string) || '').trim() || '#ffffff',
    '--wb-navbar-drawer-padding-top': toPx(model.get('nmDrawerPaddingTop') as string | number | undefined, 72),
    '--wb-navbar-drawer-padding-x': toPx(model.get('nmDrawerPaddingX') as string | number | undefined, 12),
    '--wb-navbar-drawer-padding-bottom': toPx(model.get('nmDrawerPaddingBottom') as string | number | undefined, 24),
  })
}

function addDropdownItem(editor: Editor, traitCtx: any) {
  const target = resolveTraitTarget(editor, TYPE_DROPDOWN, traitCtx)
  if (!target) return

  const itemsContainer =
    findImmediateChildByClass(target, 'gjs-nav-group__dropdown-inner') ?? target
  const created = (itemsContainer.components() as any).add(makeDropdownItem('New Item'))
  if (created) editor.select(created)
}

export function registerNavbarMenuTypes(editor: Editor): void {
  const { DomComponents } = editor

  DomComponents.addType(TYPE_NAVBAR_LINK, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'A' && el.classList.contains('gjs-navbar__link')
        ? { type: TYPE_NAVBAR_LINK }
        : undefined,
    extend: 'link',
    model: {
      defaults: {
        name: 'Nav Link',
        tagName: 'a',
        draggable: `[data-gjs-type="${TYPE_NAVBAR_MENU}"],[data-gjs-type="navbar-right-slot"]`,
        droppable: false,
        traits: [
          { type: 'text', label: 'Label', name: 'content', changeProp: true },
          { type: 'page-link', label: 'Href', name: 'href', placeholder: '#' },
          createTargetTrait(),
        ],
      },
      init(this: any) {
        this.listenTo(this, 'change:content', () => applyInlineLabel(this))
        applyInlineLabel(this)
      },
    },
  })

  DomComponents.addType(TYPE_NAVBAR_MENU, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'NAV' && el.classList?.contains('gjs-navbar__menu')
        ? { type: TYPE_NAVBAR_MENU }
        : undefined,
    model: {
      defaults: {
        name: 'Nav Menu',
        tagName: 'nav',
        draggable: false,
        copyable: false,
        removable: false,
        highlightable: false,
        droppable: `[data-gjs-type="${TYPE_NAVBAR_LINK}"],[data-gjs-type="${TYPE_NAV_GROUP}"]`,
        nmGap: 28,
        nmDrawerWidth: '360px',
        nmDrawerBg: '#ffffff',
        nmDrawerPaddingTop: 72,
        nmDrawerPaddingX: 12,
        nmDrawerPaddingBottom: 24,
        traits: [
          { type: 'navbar-menu-select', label: '后台菜单', name: 'nmMenuSourceId', changeProp: true },
          { type: 'number', label: '桌面菜单间距 (px)', name: 'nmGap', changeProp: true, min: 0, max: 80 },
          { type: 'text', label: '移动抽屉宽度', name: 'nmDrawerWidth', changeProp: true, placeholder: '360px / 100vw' },
          { type: 'color-picker', label: '移动抽屉背景', name: 'nmDrawerBg', changeProp: true },
          { type: 'number', label: '抽屉顶部内边距 (px)', name: 'nmDrawerPaddingTop', changeProp: true, min: 0, max: 200 },
          { type: 'number', label: '抽屉左右内边距 (px)', name: 'nmDrawerPaddingX', changeProp: true, min: 0, max: 80 },
          { type: 'number', label: '抽屉底部内边距 (px)', name: 'nmDrawerPaddingBottom', changeProp: true, min: 0, max: 120 },
          createAddChildTrait('add-link', '+ Add Link', TYPE_NAVBAR_MENU, () => makeLink('New Link')),
          createAddChildTrait('add-dropdown', '+ Add Dropdown', TYPE_NAVBAR_MENU, () => makeNavGroup('Menu')),
          createAddChildTrait('add-mega', '+ Add Mega Menu', TYPE_NAVBAR_MENU, () => makeNavGroup('Menu', 'mega')),
        ],
      },
      init(this: any) {
        this.listenTo(
          this,
          'change:nmGap change:nmDrawerWidth change:nmDrawerBg change:nmDrawerPaddingTop change:nmDrawerPaddingX change:nmDrawerPaddingBottom',
          () => applyMenuTraits(this),
        )
        applyMenuTraits(this)
      },
    },
  })

  DomComponents.addType(TYPE_DROPDOWN_ITEM, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'A' && el.classList.contains('gjs-nav-group__dropdown-item')
        ? { type: TYPE_DROPDOWN_ITEM }
        : undefined,
    extend: 'link',
    model: {
      defaults: {
        name: 'Dropdown Item',
        tagName: 'a',
        draggable: `[data-gjs-type="${TYPE_DROPDOWN}"]`,
        droppable: false,
        traits: [
          { type: 'text', label: 'Label', name: 'content', changeProp: true },
          { type: 'page-link', label: 'Href', name: 'href', placeholder: '#' },
          createTargetTrait(),
        ],
      },
      init(this: any) {
        this.listenTo(this, 'change:content', () => applyInlineLabel(this))
        applyInlineLabel(this)
      },
    },
  })

  DomComponents.addType(TYPE_DROPDOWN, {
    model: {
      defaults: {
        name: 'Dropdown',
        tagName: 'div',
        draggable: false,
        copyable: false,
        removable: false,
        droppable: `[data-gjs-type="${TYPE_DROPDOWN_ITEM}"]`,
        traits: [
          {
            type: 'button' as any,
            name: 'add-item',
            label: false as const,
            text: '+ Add Item',
            full: true,
            command(this: any, currentEditor: Editor) {
              addDropdownItem(currentEditor, this)
            },
          },
        ],
      },
    },
  })
}
