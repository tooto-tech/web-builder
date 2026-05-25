import type { Editor } from 'grapesjs'
import { makeSelectTrait, makeTextTrait } from '@/components/WebBuilder/utils/traitFactory'

export const WB_LANGUAGE_SWITCHER_TYPE = 'wb-language-switcher'

const WB_LANGUAGE_SWITCHER_COMPONENT = 'language-switcher'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="m5 8 6 6"/>
  <path d="m4 14 6-6 2-3"/>
  <path d="M2 5h12"/>
  <path d="M7 2h1"/>
  <path d="m22 22-5-10-5 10"/>
  <path d="M14 18h6"/>
</svg>`

const DEFAULT_STYLES = `
  .wb-language-switcher {
    position: relative;
    display: inline-block;
    overflow: visible;
    z-index: 30;
    color: #111827;
    font-size: 14px;
    line-height: 1.2;
  }
  .wb-language-switcher__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid rgba(17, 24, 39, 0.16);
    border-radius: 999px;
    background: #ffffff;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .wb-language-switcher__current {
    white-space: nowrap;
  }
  .wb-language-switcher__chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.18s ease;
  }
  .wb-language-switcher.is-open .wb-language-switcher__chevron {
    transform: rotate(180deg);
  }
  .wb-language-switcher__menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    min-width: 100%;
    padding: 6px;
    border: 1px solid rgba(17, 24, 39, 0.12);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.14);
    display: none;
    box-sizing: border-box;
  }
  .wb-language-switcher.is-open .wb-language-switcher__menu {
    display: grid;
    gap: 2px;
  }
  .wb-language-switcher__menu[data-wb-language-fixed="true"] {
    position: fixed !important;
    right: auto !important;
    z-index: 2147483000 !important;
    max-height: calc(100vh - 16px);
    overflow-y: auto;
  }
  .wb-language-switcher.is-single .wb-language-switcher__menu {
    display: none;
  }
  .wb-language-switcher__option {
    display: flex;
    align-items: center;
    min-height: 32px;
    padding: 7px 10px;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
    white-space: nowrap;
  }
  .wb-language-switcher__option:hover,
  .wb-language-switcher__option.is-active {
    background: rgba(37, 99, 235, 0.08);
  }
`

const languageSwitcherScript = function (this: HTMLElement) {
  type LanguageSwitcherRoot = HTMLElement & {
    __wbLanguageSwitcherInit?: boolean
    __wbLanguageMenu?: HTMLElement
    __wbLanguageMenuPlaceholder?: Comment
  }
  type LanguageSwitcherMenu = HTMLElement & {
    __wbLanguageSwitcherRoot?: LanguageSwitcherRoot
  }

  const getRoot = () => this as LanguageSwitcherRoot
  if (getRoot().__wbLanguageSwitcherInit) return
  getRoot().__wbLanguageSwitcherInit = true

  const toggle = getRoot().querySelector('[data-wb-language-toggle]') as HTMLElement | null
  const menu = getRoot().querySelector('[data-wb-language-menu]') as LanguageSwitcherMenu | null
  if (!toggle || !menu) return

  const isEditorCanvas = () =>
    !!getRoot().closest('[data-gjs-type]') ||
    !!document.querySelector('[data-gjs-type="wrapper"], .gjs-dashed')

  const getMenu = () => getRoot().__wbLanguageMenu || menu

  const portalMenu = () => {
    const root = getRoot()
    const activeMenu = getMenu() as LanguageSwitcherMenu
    if (!root.__wbLanguageMenuPlaceholder && activeMenu.parentNode) {
      root.__wbLanguageMenuPlaceholder = document.createComment('wb-language-switcher-menu')
      activeMenu.parentNode.insertBefore(root.__wbLanguageMenuPlaceholder, activeMenu)
    }
    root.__wbLanguageMenu = activeMenu
    activeMenu.__wbLanguageSwitcherRoot = root
    if (activeMenu.parentNode !== document.body) {
      document.body.appendChild(activeMenu)
    }
  }

  const restoreMenu = () => {
    const root = getRoot()
    const activeMenu = getMenu()
    const placeholder = root.__wbLanguageMenuPlaceholder
    if (placeholder?.parentNode && activeMenu.parentNode !== placeholder.parentNode) {
      placeholder.parentNode.insertBefore(activeMenu, placeholder)
    }
  }

  const resetMenuPosition = () => {
    const activeMenu = getMenu()
    activeMenu.removeAttribute('data-wb-language-fixed')
    activeMenu.removeAttribute('data-wb-language-portal')
    ;[
      'position',
      'top',
      'left',
      'right',
      'display',
      'visibility',
      'z-index',
      'min-width',
      'max-width',
      'max-height',
      'overflow-y',
      'box-sizing'
    ].forEach((property) => activeMenu.style.removeProperty(property))
  }

  const closeMenu = () => {
    getRoot().classList.remove('is-open')
    toggle.setAttribute('aria-expanded', 'false')
    resetMenuPosition()
    restoreMenu()
  }

  const positionMenu = () => {
    if (!getRoot().classList.contains('is-open')) return
    portalMenu()
    const activeMenu = getMenu()
    const rect = toggle.getBoundingClientRect()
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const gap = 8
    activeMenu.setAttribute('data-wb-language-fixed', 'true')
    activeMenu.setAttribute('data-wb-language-portal', 'true')
    activeMenu.style.position = 'fixed'
    activeMenu.style.right = 'auto'
    activeMenu.style.left = '0px'
    activeMenu.style.top = '0px'
    activeMenu.style.display = 'grid'
    activeMenu.style.visibility = 'hidden'
    activeMenu.style.zIndex = '2147483000'
    activeMenu.style.boxSizing = 'border-box'
    activeMenu.style.minWidth = `${Math.ceil(rect.width)}px`
    activeMenu.style.maxWidth = `calc(100vw - ${gap * 2}px)`
    activeMenu.style.maxHeight = `calc(100vh - ${gap * 2}px)`
    activeMenu.style.overflowY = 'auto'

    const menuWidth = activeMenu.offsetWidth || rect.width
    const menuHeight = activeMenu.offsetHeight || 0
    const maxLeft = Math.max(gap, viewportWidth - menuWidth - gap)
    let left = rect.right - menuWidth
    left = Math.max(gap, Math.min(left, maxLeft))

    const availableHeight = Math.min(menuHeight, viewportHeight - gap * 2)
    const maxTop = Math.max(gap, viewportHeight - availableHeight - gap)
    let top = rect.bottom + gap
    if (top + menuHeight > viewportHeight - gap && rect.top > menuHeight + gap) {
      top = rect.top - menuHeight - gap
    }
    top = Math.max(gap, Math.min(top, maxTop))

    activeMenu.style.left = `${Math.round(left)}px`
    activeMenu.style.top = `${Math.round(top)}px`
    activeMenu.style.visibility = ''
  }

  const openMenu = () => {
    getRoot().classList.add('is-open')
    toggle.setAttribute('aria-expanded', 'true')
    positionMenu()
  }

  const setOpen = (open: boolean) => {
    if (open) openMenu()
    else closeMenu()
  }

  toggle.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    setOpen(!getRoot().classList.contains('is-open'))
  })

  menu.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.(
      '[data-wb-language-option], .wb-language-switcher__option'
    ) as HTMLAnchorElement | null
    if (!link || isEditorCanvas()) return
    const href = `${link.getAttribute('href') || ''}`.trim()
    if (
      !href ||
      href === '#' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button === 1
    ) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    window.location.href = link.href
  })

  document.addEventListener('click', (event) => {
    const target = event.target as Node
    if (!getRoot().contains(target) && !getMenu().contains(target)) {
      closeMenu()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu()
    }
  })

  window.addEventListener('resize', positionMenu)
  window.addEventListener('scroll', positionMenu, true)

  if (isEditorCanvas()) {
    getRoot()
      .querySelectorAll('a')
      .forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault()
        })
      })
  }
}

const buildLanguageSwitcherChildren = () => [
  {
    tagName: 'button',
    name: '语言切换按钮',
    selectable: true,
    draggable: false,
    droppable: false,
    copyable: false,
    stylable: true,
    classes: ['wb-language-switcher__toggle'],
    attributes: {
      type: 'button',
      'data-wb-language-toggle': 'true',
      'aria-haspopup': 'true',
      'aria-expanded': 'false'
    },
    components: [
      {
        tagName: 'span',
        name: '当前语言',
        selectable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        stylable: true,
        classes: ['wb-language-switcher__current'],
        attributes: {
          'data-wb-language-current': 'true'
        },
        components: 'English'
      },
      {
        tagName: 'span',
        name: '下拉图标',
        selectable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        stylable: true,
        classes: ['wb-language-switcher__chevron'],
        attributes: {
          'aria-hidden': 'true'
        },
        components: '⌄'
      }
    ]
  },
  {
    tagName: 'div',
    name: '语言菜单',
    selectable: true,
    draggable: false,
    droppable: false,
    copyable: false,
    stylable: true,
    classes: ['wb-language-switcher__menu'],
    attributes: {
      'data-wb-language-menu': 'true',
      role: 'menu'
    },
    components: [
      {
        tagName: 'a',
        name: '语言选项',
        selectable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        stylable: true,
        classes: ['wb-language-switcher__option', 'is-active'],
        attributes: {
          href: '/en/',
          role: 'menuitem',
          'aria-current': 'page',
          'data-wb-language-option': 'true',
          'data-language-slug': 'en',
          'data-language-code': 'en_US'
        },
        components: [
          {
            tagName: 'span',
            classes: ['wb-language-switcher__option-label'],
            attributes: {
              'data-wb-language-option-label': 'true'
            },
            components: 'English'
          }
        ]
      },
      {
        tagName: 'a',
        name: '语言选项',
        selectable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        stylable: true,
        classes: ['wb-language-switcher__option'],
        attributes: {
          href: '/zh/',
          role: 'menuitem',
          'data-wb-language-option': 'true',
          'data-language-slug': 'zh',
          'data-language-code': 'zh_CN'
        },
        components: [
          {
            tagName: 'span',
            classes: ['wb-language-switcher__option-label'],
            attributes: {
              'data-wb-language-option-label': 'true'
            },
            components: '简体中文'
          }
        ]
      }
    ]
  }
]

const hasDescendantWithAttribute = (component: any, attributeName: string): boolean => {
  const children = component?.components?.()?.models ?? []
  for (const child of children) {
    const attributes = child?.getAttributes?.() ?? child?.get?.('attributes') ?? {}
    if (attributes?.[attributeName] != null) return true
    if (hasDescendantWithAttribute(child, attributeName)) return true
  }
  return false
}

const hasButtonAncestor = (component: any): boolean => {
  let parent = component?.parent?.()
  while (parent) {
    const tagName = `${parent?.get?.('tagName') ?? parent?.attributes?.tagName ?? ''}`.toLowerCase()
    if (tagName === 'button') return true
    parent = parent?.parent?.()
  }
  return false
}

const ensureLanguageSwitcherChildren = (component: any) => {
  if (hasButtonAncestor(component)) return

  const children = component?.components?.()
  if (!children?.reset) return

  const hasToggle = hasDescendantWithAttribute(component, 'data-wb-language-toggle')
  const hasMenu = hasDescendantWithAttribute(component, 'data-wb-language-menu')
  if (hasToggle && hasMenu) return

  children.reset(buildLanguageSwitcherChildren())
}

export function createLanguageSwitcherBlockContent() {
  return { type: WB_LANGUAGE_SWITCHER_TYPE }
}

export function registerLanguageSwitcherComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_LANGUAGE_SWITCHER_TYPE)) return

  domComponents.addType(WB_LANGUAGE_SWITCHER_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === WB_LANGUAGE_SWITCHER_COMPONENT) {
        return { type: WB_LANGUAGE_SWITCHER_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '多语言切换',
        tagName: 'nav',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        classes: ['wb-language-switcher', 'notranslate'],
        attributes: {
          'data-wb-component': WB_LANGUAGE_SWITCHER_COMPONENT,
          'data-wb-i18n-skip': 'true',
          'data-wb-language-url-mode': 'prefix',
          'data-wb-language-label-mode': 'name',
          translate: 'no',
          'aria-label': 'Language selector'
        },
        languageLabelMode: 'name',
        ariaLabel: 'Language selector',
        style: {
          position: 'relative',
          display: 'inline-block'
        },
        styles: DEFAULT_STYLES,
        components: buildLanguageSwitcherChildren(),
        script: languageSwitcherScript,
        'script-export': languageSwitcherScript,
        traits: [
          makeSelectTrait('语言显示', 'languageLabelMode', [
            { value: 'name', label: '语言名称' },
            { value: 'code', label: '语言代码' },
            { value: 'slug', label: 'URL 标识' }
          ]),
          makeTextTrait('无障碍标签', 'ariaLabel', { placeholder: 'Language selector' })
        ]
      },
      init(this: any) {
        ensureLanguageSwitcherChildren(this)
        this.on('change:languageLabelMode change:ariaLabel', this.syncLanguageSwitcherAttrs)
        this.syncLanguageSwitcherAttrs()
      },
      syncLanguageSwitcherAttrs(this: any) {
        const labelMode = `${this.get('languageLabelMode') || 'name'}`.trim() || 'name'
        const ariaLabel = `${this.get('ariaLabel') || 'Language selector'}`.trim()
        this.addAttributes?.({
          'data-wb-component': WB_LANGUAGE_SWITCHER_COMPONENT,
          'data-wb-i18n-skip': 'true',
          'data-wb-language-url-mode': 'prefix',
          'data-wb-language-label-mode': labelMode,
          translate: 'no',
          'aria-label': ariaLabel || 'Language selector'
        })
      }
    }
  })

  editor.BlockManager.add(WB_LANGUAGE_SWITCHER_TYPE, {
    label: '多语言切换',
    category: 'Navigation',
    content: createLanguageSwitcherBlockContent(),
    media: BLOCK_ICON
  })
}
