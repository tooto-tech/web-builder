import type { Editor } from 'grapesjs'
import {
  LINK_TARGET_OPTIONS,
  NAV_GROUP_TYPE_OPTIONS,
  TYPE_DROPDOWN,
  TYPE_DROPDOWN_ITEM,
  TYPE_MEGA,
  TYPE_MEGA_COL,
  TYPE_MEGA_INNER,
  TYPE_MEGA_ITEM,
  TYPE_MEGA_LEFT,
  TYPE_MEGA_RIGHT,
  TYPE_NAV_GROUP,
} from './constants'
import { makeDropdown, makeMega, makeMegaCol } from './factories'
import {
  applyStyleVars,
  findImmediateChildByClass,
  findImmediateChildByType,
  hasClass,
  readFirstTextnodeContent,
  readTextnodeContentByClass,
  resolveTraitTarget,
  toPx,
  writeTextnodeContentByClass,
} from './helpers'

function createTargetTrait() {
  return {
    type: 'select',
    label: 'Target',
    name: 'target',
    options: LINK_TARGET_OPTIONS,
  }
}

function applyMegaColumnTitle(model: any) {
  let title = (model.get('mcTitle') as string) || ''

  if (!title) {
    title = readTextnodeContentByClass(model, 'gjs-nav-group__mega-col-title')
    if (title) model.set('mcTitle', title)
  }

  if (!title) return
  writeTextnodeContentByClass(model, 'gjs-nav-group__mega-col-title', title)
}

function applyMegaItemLabel(model: any) {
  let label = (model.get('miLabel') as string) || ''

  if (!label) {
    label = readTextnodeContentByClass(model, 'gjs-nav-group__mega-item-label')
    if (label) model.set('miLabel', label)
  }

  if (!label) return
  writeTextnodeContentByClass(model, 'gjs-nav-group__mega-item-label', label)
}

function findMegaImageModel(model: any) {
  const mega = model?.closestType?.(TYPE_MEGA)
  if (!mega) return null

  const inner = findImmediateChildByClass(mega, 'gjs-nav-group__mega-inner')
  const right = findImmediateChildByType(inner, TYPE_MEGA_RIGHT)
  return findImmediateChildByClass(right, 'gjs-nav-group__mega-img')
}

function isFirstMegaItem(model: any) {
  const column = model?.closestType?.(TYPE_MEGA_COL)
  const components = column?.components?.() as any
  let firstItem: any = null

  components?.each?.((component: any) => {
    if (!firstItem && component?.get?.('type') === TYPE_MEGA_ITEM) {
      firstItem = component
    }
  })

  return firstItem === model
}

function applyMegaItemMedia(model: any) {
  const src = ((model.get('miImageSrc') as string) || '').trim()
  const alt = ((model.get('miImageAlt') as string) || '').trim() || (model.get('miLabel') as string) || ''
  const previousSrc = ((model.previous?.('miImageSrc') as string) || '').trim()
  const imageModel = findMegaImageModel(model)
  const currentSrc = ((imageModel?.getAttributes?.()?.src as string) || '').trim()
  const currentAttrs = model.getAttributes?.() ?? {}

  const nextAttrs: Record<string, string> = {}
  if (`${currentAttrs['data-mega-image-src'] ?? ''}` !== src) {
    nextAttrs['data-mega-image-src'] = src
  }
  if (`${currentAttrs['data-mega-image-alt'] ?? ''}` !== alt) {
    nextAttrs['data-mega-image-alt'] = alt
  }

  if (Object.keys(nextAttrs).length) {
    model.addAttributes?.(nextAttrs)
  }

  const shouldSyncPreview =
    Boolean(src)
    && (
      isFirstMegaItem(model)
      || !currentSrc
      || currentSrc === previousSrc
    )

  if (shouldSyncPreview && imageModel) {
    const imageAttrs = imageModel.getAttributes?.() ?? {}
    if (`${imageAttrs.src ?? ''}` !== src || `${imageAttrs.alt ?? ''}` !== alt) {
      imageModel.addAttributes?.({ src, alt })
    }
  }
}

function applyNavGroupLabel(model: any) {
  const label = (model.get('ngLabel') as string) || ''
  if (!label) return

  const button = findImmediateChildByClass(model, 'gjs-nav-group__btn')
  const components = button?.components?.() as any

  components?.each?.((component: any) => {
    if (component?.get?.('type') === 'textnode') {
      const current = `${component.get?.('content') ?? ''}`
      if (current !== label) {
        component.set('content', label)
      }
    }
  })
}

function applyNavGroupOffset(model: any) {
  if (model.get('ngType') !== 'mega') return

  const raw = model.get('ngOffset') as string | number
  const offset = Math.max(0, Number(raw) || 0)
  const mega =
    findImmediateChildByType(model, TYPE_MEGA)
    ?? findImmediateChildByClass(model, 'gjs-nav-group__mega')

  mega?.addStyle?.({ 'padding-top': `${offset}px` })
}

function applyNavGroupPresentation(model: any) {
  const align = (model.get('ngDropdownAlign') as string) || 'left'
  const left = align === 'left' ? '0' : align === 'right' ? 'auto' : '50%'
  const right = align === 'right' ? '0' : 'auto'
  const translateX = align === 'center' ? '-50%' : '0'

  applyStyleVars(model, {
    '--wb-nav-group-dropdown-left': left,
    '--wb-nav-group-dropdown-right': right,
    '--wb-nav-group-dropdown-translate-x': translateX,
    '--wb-nav-group-dropdown-min-width': toPx(
      model.get('ngDropdownMinWidth') as string | number | undefined,
      180,
    ),
    '--wb-nav-group-dropdown-offset': toPx(
      model.get('ngDropdownOffset') as string | number | undefined,
      16,
    ),
    '--wb-nav-group-dropdown-bg':
      ((model.get('ngDropdownBg') as string) || '').trim() || '#ffffff',
    '--wb-nav-group-mega-bg':
      ((model.get('ngMegaBg') as string) || '').trim() || '#ffffff',
    '--wb-nav-group-mega-radius': toPx(
      model.get('ngMegaRadius') as string | number | undefined,
      0,
    ),
  })
}

function inferNavGroupType(model: any): 'dropdown' | 'mega' {
  if (model?.hasClass?.('gjs-nav-group--mega')) return 'mega'

  const components = model?.components?.() as any
  let inferred: 'dropdown' | 'mega' = 'dropdown'

  components?.each?.((component: any) => {
    if (inferred === 'mega') return

    const type = component?.get?.('type')
    if (type === TYPE_MEGA) {
      inferred = 'mega'
      return
    }

    if (hasClass(component, 'gjs-nav-group__mega')) {
      inferred = 'mega'
    }
  })

  return inferred
}

type SimpleItem = { text: string; href: string }
type MegaItem = { text: string; href: string; imageSrc?: string; imageAlt?: string }

function extractDropdownItems(dropdownComp: any): SimpleItem[] {
  const items: SimpleItem[] = []
  const inner =
    findImmediateChildByClass(dropdownComp, 'gjs-nav-group__dropdown-inner') ?? dropdownComp
  const components = inner?.components?.() as any

  components?.each?.((component: any) => {
    const type = component?.get?.('type')
    if (type === TYPE_DROPDOWN_ITEM || hasClass(component, 'gjs-nav-group__dropdown-item')) {
      const text =
        String(component?.get?.('content') || '').trim() ||
        readFirstTextnodeContent(component).trim()
      const href = String(component?.getAttributes?.()?.href || '#')
      if (text) items.push({ text, href })
    }
  })

  return items
}

function extractMegaItems(megaComp: any): MegaItem[] {
  const items: MegaItem[] = []
  const inner = findImmediateChildByClass(megaComp, 'gjs-nav-group__mega-inner')
  const left = findImmediateChildByType(inner, TYPE_MEGA_LEFT)
  const stack = findImmediateChildByClass(left, 'gjs-nav-group__mega-left-stack')
  // 取第一列（index 0）的所有 mega item
  const col = stack?.components?.()?.at?.(0)
  const colComps = col?.components?.() as any

  colComps?.each?.((component: any) => {
    if (component?.get?.('type') === TYPE_MEGA_ITEM) {
      const text =
        String(component?.get?.('miLabel') || '').trim() ||
        readTextnodeContentByClass(component, 'gjs-nav-group__mega-item-label').trim()
      const href = String(component?.getAttributes?.()?.href || '#')
      const imageSrc = String(
        component?.get?.('miImageSrc') ||
        component?.getAttributes?.()?.['data-mega-image-src'] ||
        '',
      )
      const imageAlt = String(
        component?.get?.('miImageAlt') ||
        component?.getAttributes?.()?.['data-mega-image-alt'] ||
        '',
      )
      if (text) items.push({ text, href, imageSrc, imageAlt })
    }
  })

  return items
}

function applyNavGroupType(model: any) {
  const menuType = model.get('ngType') as 'dropdown' | 'mega'
  const components = model.components() as any
  let panelComp: any = null
  const expectedType = menuType === 'mega' ? TYPE_MEGA : TYPE_DROPDOWN

  components?.each?.((component: any) => {
    const type = component?.get?.('type')
    if (
      type === TYPE_DROPDOWN
      || type === TYPE_MEGA
      || hasClass(component, 'gjs-nav-group__dropdown')
      || hasClass(component, 'gjs-nav-group__mega')
    ) {
      panelComp = component
    }
  })

  const panelMatchesExpected =
    panelComp?.get?.('type') === expectedType
    || (expectedType === TYPE_MEGA && hasClass(panelComp, 'gjs-nav-group__mega'))
    || (expectedType === TYPE_DROPDOWN && hasClass(panelComp, 'gjs-nav-group__dropdown'))

  if (!panelMatchesExpected) {
    let newPanel: any
    if (menuType === 'mega') {
      const existingItems = panelComp ? extractDropdownItems(panelComp) : []
      newPanel = makeMega(existingItems.length > 0 ? { items: existingItems } : undefined)
    } else {
      const existingItems = panelComp ? extractMegaItems(panelComp) : []
      newPanel = makeDropdown(existingItems.length > 0 ? existingItems : undefined)
    }
    panelComp?.remove?.()
    components?.add?.(newPanel)
  }

  if (menuType === 'mega') model.addClass('gjs-nav-group--mega')
  else model.removeClass('gjs-nav-group--mega')

  if (menuType === 'mega') applyNavGroupOffset(model)
  applyNavGroupPresentation(model)
}

function applyMegaColumnLayout(model: any) {
  model.addStyle?.({
    'min-width': toPx(model.get('mcMinWidth') as string | number | undefined, 160),
  })
}

function applyMegaPresentation(model: any) {
  const mega = model
  const inner = findImmediateChildByClass(model, 'gjs-nav-group__mega-inner')
  const left = findImmediateChildByType(inner, TYPE_MEGA_LEFT)
  const showImage = model.get('mgImageVisible') !== false

  mega?.addStyle?.({
    background: ((model.get('mgPanelBg') as string) || '').trim() || '#ffffff',
    'border-radius': toPx(model.get('mgPanelRadius') as string | number | undefined, 0),
    '--wb-mega-left-width': showImage ? '50%' : '100%',
    '--wb-mega-right-width': showImage ? '50vw' : '0px',
    '--wb-mega-right-display': showImage ? 'flex' : 'none',
    '--wb-mega-image-padding': toPx(model.get('mgImagePadding') as string | number | undefined, 0),
  })

  left?.addStyle?.({
    flex: 'none',
  })
}

export function registerNavbarMegaTypes(editor: Editor): void {
  const { DomComponents } = editor

  DomComponents.addType(TYPE_MEGA_INNER, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-nav-group__mega-inner') ? { type: TYPE_MEGA_INNER } : undefined,
    model: {
      defaults: {
        name: 'Mega Panel',
        tagName: 'div',
        selectable: false,
        hoverable: false,
        highlightable: false,
        draggable: false,
        copyable: false,
        removable: false,
        droppable: false,
      },
    },
  })

  DomComponents.addType(TYPE_MEGA_COL, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-nav-group__mega-col') ? { type: TYPE_MEGA_COL } : undefined,
    model: {
      defaults: {
        name: 'Mega Column',
        tagName: 'div',
        draggable: `[data-gjs-type="${TYPE_MEGA_LEFT}"]`,
        droppable: `[data-gjs-type="${TYPE_MEGA_ITEM}"],[data-gjs-type="wb-button"]`,
        copyable: true,
        removable: true,
        mcTitle: '',
        mcMinWidth: 160,
        traits: [
          { type: 'text', label: 'Column Title', name: 'mcTitle', changeProp: true },
          { type: 'number', label: '列最小宽度 (px)', name: 'mcMinWidth', changeProp: true, min: 120, max: 480 },
        ],
      },
      init(this: any) {
        this.listenTo(this, 'change:mcTitle', () => applyMegaColumnTitle(this))
        this.listenTo(this, 'change:mcMinWidth', () => applyMegaColumnLayout(this))
        applyMegaColumnTitle(this)
        applyMegaColumnLayout(this)
      },
    },
  })

  DomComponents.addType(TYPE_MEGA_ITEM, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'A' && el.classList.contains('gjs-nav-group__mega-item')
        ? { type: TYPE_MEGA_ITEM }
        : undefined,
    extend: 'link',
    model: {
      defaults: {
        name: 'Mega Item',
        tagName: 'a',
        draggable: `[data-gjs-type="${TYPE_MEGA_COL}"]`,
        droppable: false,
        copyable: true,
        removable: true,
        miLabel: '',
        miImageSrc: '',
        miImageAlt: '',
        traits: [
          { type: 'text', label: 'Label', name: 'miLabel', changeProp: true },
          { type: 'page-link', label: 'Href', name: 'href', placeholder: '#' },
          createTargetTrait(),
          { type: 'image-picker', label: '悬停图片', name: 'miImageSrc', changeProp: true, ui: { showPreview: true } },
          { type: 'text', label: '图片 Alt', name: 'miImageAlt', changeProp: true },
        ],
      },
      init(this: any) {
        this.listenTo(this, 'change:miLabel', () => {
          applyMegaItemLabel(this)
          applyMegaItemMedia(this)
        })
        this.listenTo(this, 'change:miImageSrc change:miImageAlt', () => applyMegaItemMedia(this))
        applyMegaItemLabel(this)
        applyMegaItemMedia(this)
      },
    },
  })

  DomComponents.addType(TYPE_MEGA_LEFT, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-nav-group__mega-left') ? { type: TYPE_MEGA_LEFT } : undefined,
    model: {
      defaults: {
        name: 'Mega Left (Columns)',
        tagName: 'div',
        draggable: false,
        copyable: false,
        removable: false,
        droppable: `[data-gjs-type="${TYPE_MEGA_COL}"]`,
      },
    },
  })

  DomComponents.addType(TYPE_MEGA_RIGHT, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-nav-group__mega-right') ? { type: TYPE_MEGA_RIGHT } : undefined,
    model: {
      defaults: {
        name: 'Mega Right (Image)',
        tagName: 'div',
        draggable: false,
        copyable: false,
        removable: false,
        droppable: true,
      },
    },
  })

  DomComponents.addType(TYPE_MEGA, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-nav-group__mega') ? { type: TYPE_MEGA } : undefined,
    model: {
      defaults: {
        name: 'Mega Menu',
        tagName: 'div',
        draggable: false,
        copyable: false,
        removable: false,
        droppable: false,
        mgPanelBg: '#ffffff',
        mgPanelRadius: 0,
        mgImageVisible: true,
        mgImagePadding: 0,
        traits: [
          { type: 'color-picker', label: '面板背景色', name: 'mgPanelBg', changeProp: true },
          { type: 'number', label: '面板圆角 (px)', name: 'mgPanelRadius', changeProp: true, min: 0, max: 80 },
          { type: 'checkbox', label: '显示右侧图片', name: 'mgImageVisible', changeProp: true },
          { type: 'number', label: '图片区内边距 (px)', name: 'mgImagePadding', changeProp: true, min: 0, max: 120 },
          {
            type: 'button' as any,
            name: 'add-col',
            label: false,
            text: '+ Add Column',
            full: true,
            command(this: any, currentEditor: Editor) {
              const mega = resolveTraitTarget(currentEditor, TYPE_MEGA, this)
              if (!mega) return

              const inner = findImmediateChildByClass(mega, 'gjs-nav-group__mega-inner')
              if (!inner) return

              const left = findImmediateChildByType(inner, TYPE_MEGA_LEFT)
              if (!left) return

              const count = (left.components().length as number) + 1
              const created = (left.components() as any).add(makeMegaCol(`Column ${count}`))
              if (created) currentEditor.select(created)
            },
          },
        ],
      },
      init(this: any) {
        this.listenTo(
          this,
          'change:mgPanelBg change:mgPanelRadius change:mgImageVisible change:mgImagePadding',
          () => applyMegaPresentation(this),
        )
        applyMegaPresentation(this)
      },
    },
  })

  DomComponents.addType(TYPE_NAV_GROUP, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-nav-group')
        ? {
            type: TYPE_NAV_GROUP,
            ngType:
              el.classList.contains('gjs-nav-group--mega')
              || !!el.querySelector(':scope > .gjs-nav-group__mega')
                ? 'mega'
                : 'dropdown',
          }
        : undefined,
    model: {
      defaults: {
        name: 'Nav Group',
        tagName: 'div',
        draggable: `[data-gjs-type="navbar-menu"]`,
        droppable: false,
        copyable: true,
        removable: true,
        ngType: 'dropdown',
        ngLabel: '',
        ngOffset: 0,
        ngDropdownMinWidth: 180,
        ngDropdownOffset: 16,
        ngDropdownAlign: 'left',
        ngDropdownBg: '#ffffff',
        ngMegaBg: '#ffffff',
        ngMegaRadius: 0,
        traits: [
          { type: 'text', label: 'Label', name: 'ngLabel', changeProp: true },
          {
            type: 'select',
            label: 'Menu Type',
            name: 'ngType',
            changeProp: true,
            options: NAV_GROUP_TYPE_OPTIONS,
          },
          {
            type: 'number',
            label: 'Mega 间距 (px)',
            name: 'ngOffset',
            changeProp: true
          },
          {
            type: 'number',
            label: '下拉偏移 (px)',
            name: 'ngDropdownOffset',
            changeProp: true,
            min: 0,
            max: 80,
          },
          {
            type: 'number',
            label: '下拉最小宽度 (px)',
            name: 'ngDropdownMinWidth',
            changeProp: true,
            min: 120,
            max: 480,
          },
          {
            type: 'select',
            label: '下拉对齐',
            name: 'ngDropdownAlign',
            changeProp: true,
            options: [
              { id: 'left', name: '左对齐' },
              { id: 'center', name: '居中' },
              { id: 'right', name: '右对齐' },
            ],
          },
          { type: 'color-picker', label: '下拉背景色', name: 'ngDropdownBg', changeProp: true },
          { type: 'color-picker', label: '超级菜单背景色', name: 'ngMegaBg', changeProp: true },
          {
            type: 'number',
            label: '超级菜单圆角 (px)',
            name: 'ngMegaRadius',
            changeProp: true,
            min: 0,
            max: 80,
          },
        ],
      },
      init(this: any) {
        const inferredType = inferNavGroupType(this)
        if ((this.get('ngType') as string) !== inferredType) {
          this.set('ngType', inferredType, { silent: true })
        }

        this.listenTo(this, 'change:ngLabel', () => applyNavGroupLabel(this))
        this.listenTo(this, 'change:ngType', () => applyNavGroupType(this))
        this.listenTo(this, 'change:ngOffset', () => applyNavGroupOffset(this))
        this.listenTo(
          this,
          'change:ngDropdownMinWidth change:ngDropdownOffset change:ngDropdownAlign change:ngDropdownBg change:ngMegaBg change:ngMegaRadius',
          () => applyNavGroupPresentation(this),
        )
        applyNavGroupLabel(this)
        applyNavGroupType(this)
        applyNavGroupOffset(this)
        applyNavGroupPresentation(this)
      },
    },
  })
}
