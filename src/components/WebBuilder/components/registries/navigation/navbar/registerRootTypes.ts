import type { Editor } from 'grapesjs'
import {
  ICON,
  NAVBAR_DRAWER_SIDE_OPTIONS,
  NAVBAR_MENU_ALIGN_OPTIONS,
  NAVBAR_MODE_OPTIONS,
  TYPE_NAVBAR,
  TYPE_NAVBAR_CENTER,
  TYPE_NAVBAR_LEFT,
  TYPE_NAVBAR_RIGHT,
} from './constants'
import { createNavbarStructure } from './factories'
import { applyStyleVars, toPx } from './helpers'
import { navbarScript } from './script'
import { NAVBAR_STYLES } from './style'
import { removeUngroupedCssRulesByPrefixes } from '@/components/WebBuilder/utils/cssScope'

const LEGACY_NAVBAR_INLINE_STYLE = {

}

function findNavbarInner(model: any): any | null {
  const components = model?.components?.()
  if (!components?.length) return null

  for (let index = 0; index < components.length; index += 1) {
    const child = components.at(index)
    if (child?.hasClass?.('gjs-navbar__inner')) return child
  }

  return null
}

function ensureNavbarInnerSelectable(model: any) {
  const inner = findNavbarInner(model)
  if (!inner) return

  const nextState = {
    name: inner.get?.('name') || 'Navbar Inner',
    selectable: true,
    hoverable: true,
    layerable: true,
    stylable: true,
    highlightable: true,
  }

  const shouldUpdate = Object.entries(nextState).some(([key, value]) => inner.get?.(key) !== value)
  if (shouldUpdate) {
    inner.set?.(nextState)
  }
}

function migrateLegacyNavbarStyle(model: any) {
  const currentStyle = { ...(model.getStyle?.() ?? {}) } as Record<string, string>
  let changed = false

  Object.entries(LEGACY_NAVBAR_INLINE_STYLE).forEach(([key, value]) => {
    if (currentStyle[key] === value) {
      delete currentStyle[key]
      changed = true
    }
  })

  if (changed) {
    model.setStyle?.(currentStyle)
  }
}

function applyMenuAlign(model: any, align: string) {
  const value = align || 'center'

  model.removeClass('gjs-navbar--menu-left')
  model.removeClass('gjs-navbar--menu-right')

  if (value === 'left') model.addClass('gjs-navbar--menu-left')
  if (value === 'right') model.addClass('gjs-navbar--menu-right')
}

function applyNavbarMode(model: any, isTransparentPage: boolean) {
  const isTransparent = Boolean(isTransparentPage)
  model.removeClass('gjs-navbar--sticky')
  model.removeClass('gjs-navbar--fixed-transparent')

  if (isTransparent) model.addClass('gjs-navbar--fixed-transparent')
  else model.addClass('gjs-navbar--sticky')
}

function applyNavbarTraits(model: any) {
  const bg = ((model.get('nbBg') as string) || '').trim()
  const scrollBg = ((model.get('nbScrollBg') as string) || '').trim()
  const color = ((model.get('nbColor') as string) || '').trim()
  const scrollColor = ((model.get('nbScrollColor') as string) || '').trim()
  const transparentBg = ((model.get('nbTransparentBg') as string) || '').trim()
  const transparentColor = ((model.get('nbTransparentColor') as string) || '').trim()
  const height = toPx(model.get('nbHeight') as string | number | undefined, 72)
  const mobileHeight = toPx(model.get('nbMobileHeight') as string | number | undefined, 52)
  const paddingX = toPx(model.get('nbPaddingX') as string | number | undefined, 24)
  const mobilePaddingX = toPx(model.get('nbMobilePaddingX') as string | number | undefined, 20)
  const logoHeight = toPx(model.get('nbLogoHeight') as string | number | undefined, 40)
  const mobileLogoHeight = toPx(model.get('nbLogoMobileHeight') as string | number | undefined, 28)

  applyStyleVars(model, {
    '--wb-navbar-bg': bg || '#003152',
    '--wb-navbar-scroll-bg': scrollBg || bg || '#003152',
    '--wb-navbar-link-color': color || '#ffffff',
    '--wb-navbar-scroll-link-color': scrollColor || color || '#ffffff',
    '--wb-navbar-transparent-bg': transparentBg || 'transparent',
    '--wb-navbar-transparent-link-color': transparentColor || '#ffffff',
    '--wb-navbar-height': height,
    '--wb-navbar-mobile-height': mobileHeight,
    '--wb-navbar-padding-x': paddingX,
    '--wb-navbar-mobile-padding-x': mobilePaddingX,
    '--wb-navbar-logo-height': logoHeight,
    '--wb-navbar-logo-mobile-height': mobileLogoHeight,
  })
}

function cleanupLegacyNavbarGlobalStyles(editor: Editor) {
  if ((editor as any).__wbNavbarGlobalStylesCleaned) return
  ;(editor as any).__wbNavbarGlobalStylesCleaned = true

  const cssComposer = editor.Css
  removeUngroupedCssRulesByPrefixes(cssComposer, ['.gjs-navbar', '.gjs-nav-group'])
}

export function registerNavbarRootTypes(editor: Editor): void {
  const { DomComponents, BlockManager } = editor

  editor.on?.('load', () => {
    cleanupLegacyNavbarGlobalStyles(editor)
  })

  DomComponents.addType(TYPE_NAVBAR_LEFT, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-navbar__left') ? { type: TYPE_NAVBAR_LEFT } : undefined,
    model: {
      defaults: {
        name: '品牌 Logo',
        tagName: 'div',
        draggable: false,
        copyable: false,
        removable: false,
        highlightable: false,
        droppable: `[data-gjs-type="logo-brand"]`,
      },
    },
  })

  DomComponents.addType(TYPE_NAVBAR_CENTER, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-navbar__center') ? { type: TYPE_NAVBAR_CENTER } : undefined,
    model: {
      defaults: {
        name: '导航菜单区',
        tagName: 'div',
        draggable: false,
        copyable: false,
        removable: false,
        highlightable: false,
        droppable: false,
      },
    },
  })

  DomComponents.addType(TYPE_NAVBAR_RIGHT, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-navbar__right') ? { type: TYPE_NAVBAR_RIGHT } : undefined,
    model: {
      defaults: {
        name: '操作区',
        tagName: 'div',
        draggable: false,
        copyable: false,
        removable: false,
        droppable: true,
      },
    },
  })

  DomComponents.addType(TYPE_NAVBAR, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'HEADER' && el.classList.contains('gjs-navbar')
        ? { type: TYPE_NAVBAR }
        : undefined,
    model: {
      defaults: {
        name: 'Navbar',
        tagName: 'header',
        classes: ['gjs-navbar'],
        droppable: false,
        draggable: true,
        nbMode: 'sticky',
        nbDrawerSide: 'left',
        nbBg: '#003152',
        nbScrollBg: '#003152',
        nbColor: '#ffffff',
        nbScrollColor: '#ffffff',
        nbTransparentBg: 'transparent',
        nbTransparentColor: '#ffffff',
        nbHeight: 72,
        nbMobileHeight: 52,
        nbPaddingX: 24,
        nbMobilePaddingX: 20,
        nbLogoHeight: 40,
        nbLogoMobileHeight: 28,
        traits: [
          {
            type: 'select',
            label: 'Navbar 类型',
            name: 'nbMode',
            changeProp: true,
            options: NAVBAR_MODE_OPTIONS,
          },
          {
            type: 'select',
            label: 'Drawer Side',
            name: 'nbDrawerSide',
            changeProp: true,
            options: NAVBAR_DRAWER_SIDE_OPTIONS,
          },
          {
            type: 'select',
            label: '菜单对齐',
            name: 'nbMenuAlign',
            changeProp: true,
            options: NAVBAR_MENU_ALIGN_OPTIONS,
          },
          { type: 'color-picker', label: '默认背景色', name: 'nbBg', changeProp: true },
          { type: 'color-picker', label: '透明态背景色', name: 'nbTransparentBg', changeProp: true },
          { type: 'color-picker', label: '滚动后背景色', name: 'nbScrollBg', changeProp: true },
          { type: 'color-picker', label: '链接默认色', name: 'nbColor', changeProp: true },
          { type: 'color-picker', label: '透明态链接色', name: 'nbTransparentColor', changeProp: true },
          { type: 'color-picker', label: '链接滚动色', name: 'nbScrollColor', changeProp: true },
          { type: 'number', label: '桌面高度 (px)', name: 'nbHeight', changeProp: true, min: 40, max: 200 },
          { type: 'number', label: '移动高度 (px)', name: 'nbMobileHeight', changeProp: true, min: 40, max: 120 },
          { type: 'number', label: '桌面左右内边距 (px)', name: 'nbPaddingX', changeProp: true, min: 0, max: 120 },
          { type: 'number', label: '移动左右内边距 (px)', name: 'nbMobilePaddingX', changeProp: true, min: 0, max: 80 },
          { type: 'number', label: 'Logo 高度 (px)', name: 'nbLogoHeight', changeProp: true, min: 16, max: 120 },
          { type: 'number', label: '移动 Logo 高度 (px)', name: 'nbLogoMobileHeight', changeProp: true, min: 16, max: 96 },
        ],
        script: navbarScript,
        'script-export': navbarScript,
        styles: NAVBAR_STYLES,
        components: createNavbarStructure(),
      },
      init(this: any) {
        this.addClass?.('gjs-navbar')
        migrateLegacyNavbarStyle(this)
        ensureNavbarInnerSelectable(this)

        this.listenTo(this, 'change:nbDrawerSide', () => {
          const side = this.get('nbDrawerSide') as string
          if (side === 'left') this.addClass('gjs-navbar--drawer-left')
          else this.removeClass('gjs-navbar--drawer-left')
        })

        const initialDrawerSide = this.get('nbDrawerSide') as string
        if (initialDrawerSide === 'left') this.addClass('gjs-navbar--drawer-left')
        else this.removeClass('gjs-navbar--drawer-left')

        this.listenTo(this, 'change:nbMode', () => {
          applyNavbarMode(this, this.get('nbMode') === 'transparent-fixed')
          applyNavbarTraits(this)
        })

        applyNavbarMode(this, this.get('nbMode') === 'transparent-fixed')

        this.listenTo(this, 'change:nbMenuAlign', () => {
          applyMenuAlign(this, this.get('nbMenuAlign') as string)
        })

        const initialAlign = this.get('nbMenuAlign') as string
        if (initialAlign) applyMenuAlign(this, initialAlign)

        this.listenTo(
          this,
          'change:nbBg change:nbTransparentBg change:nbScrollBg change:nbColor change:nbTransparentColor change:nbScrollColor change:nbHeight change:nbMobileHeight change:nbPaddingX change:nbMobilePaddingX change:nbLogoHeight change:nbLogoMobileHeight',
          () => applyNavbarTraits(this),
        )

        applyNavbarTraits(this)
      },
    },
  })

  try {
    BlockManager.add('navbar-component', {
      label: 'Navbar',
      category: 'Navigation',
      media: ICON,
      content: { type: TYPE_NAVBAR },
    })
  } catch (_) {
    // ignore if BlockManager not available
  }
}
