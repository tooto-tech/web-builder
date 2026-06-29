import type { Editor } from 'grapesjs'
import { makeNumberTrait } from '../../../traitFactory.js'

export const WB_TABS_TYPE = 'wb-tabs'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 5h16" />
  <path d="M4 12h7" />
  <path d="M4 19h16" />
  <path d="M15 10l3 2-3 2" />
</svg>`

const DEFAULT_TABS = [
  'Tab 1',
  'Tab 2',
  'Tab 3',
]

const TABS_CSS = `
  .wb-tabs {
    width: 100%;
    padding: 56px 0;
    background: #ffffff;
    box-sizing: border-box;
  }
  .wb-tabs,
  .wb-tabs *,
  .wb-tabs *::before,
  .wb-tabs *::after {
    box-sizing: border-box;
  }
  .wb-tabs__inner {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .wb-tabs__nav-wrap {
    width: 100%;
    overflow: hidden;
    border-bottom: 1px solid #d9dee5;
  }
  .wb-tabs__nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
  }
  .wb-tabs__nav::-webkit-scrollbar {
    display: none;
  }
  .wb-tabs__nav.is-scrollable {
    justify-content: flex-start;
  }
  .wb-tabs__button {
    position: relative;
    flex: 0 0 auto;
    min-width: max-content;
    padding: 0 0 14px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #657080;
    cursor: pointer;
    appearance: none;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.35;
    letter-spacing: 0;
    text-align: center;
    white-space: nowrap;
    transition: color 180ms ease, border-color 180ms ease;
  }
  .wb-tabs__button.is-active {
    border-bottom-color: #0057ce;
    color: #0057ce;
  }
  .wb-tabs__button:focus-visible {
    outline: 2px solid #0057ce;
    outline-offset: 4px;
  }
  .wb-tabs__panels {
    min-width: 0;
    padding-top: 32px;
  }
  .wb-tabs__panel {
    display: none;
    min-height: 120px;
  }
  .wb-tabs__panel.is-active {
    display: block;
  }
  @media (max-width: 1023px) {
    .wb-tabs {
      padding: 44px 0;
    }
    .wb-tabs__inner {
      padding: 0 20px;
    }
    .wb-tabs__nav {
      gap: 22px;
    }
  }
  @media (max-width: 767px) {
    .wb-tabs {
      padding: 36px 0;
    }
    .wb-tabs__inner {
      padding: 0 16px;
    }
    .wb-tabs__nav {
      gap: 18px;
    }
    .wb-tabs__button {
      padding-bottom: 12px;
      font-size: 14px;
    }
    .wb-tabs__panels {
      padding-top: 24px;
    }
  }
`

function freezeWrapper(extra: Record<string, unknown> = {}) {
  return {
    removable: false,
    selectable: true,
    hoverable: true,
    draggable: false,
    droppable: false,
    highlightable: true,
    layerable: true,
    copyable: false,
    ...extra,
  }
}

function createTabButton(label: string, active = false) {
  return {
    tagName: 'button',
    name: `Tab ${label}`,
    type: 'text',
    selectable: true,
    droppable: false,
    draggable: '.wb-tabs__nav',
    copyable: true,
    removable: true,
    attributes: {
      class: `wb-tabs__button${active ? ' is-active' : ''}`,
      type: 'button',
      role: 'tab',
      'aria-selected': active ? 'true' : 'false',
    },
    components: label,
  }
}

function createPanel(index: number, active = false) {
  return {
    tagName: 'div',
    name: `Tab 内容 ${index + 1}`,
    selectable: true,
    droppable: true,
    draggable: '.wb-tabs__panels',
    copyable: true,
    removable: true,
    attributes: {
      class: `wb-tabs__panel${active ? ' is-active' : ''}`,
      role: 'tabpanel',
      'data-tab-panel': String(index),
    },
    components: [],
  }
}

function buildTabsTree(count = DEFAULT_TABS.length) {
  const labels = Array.from({ length: count }, (_, index) => DEFAULT_TABS[index] ?? `Tab ${index + 1}`)

  return [
    {
      tagName: 'div',
      name: '内容容器',
      ...freezeWrapper({ attributes: { class: 'wb-tabs__inner' } }),
      components: [
        {
          tagName: 'div',
          name: 'Tabs 滚动区域',
          ...freezeWrapper({ attributes: { class: 'wb-tabs__nav-wrap' } }),
          components: [
            {
              tagName: 'div',
              name: 'Tabs',
              ...freezeWrapper({
                droppable: '.wb-tabs__button',
                attributes: { class: 'wb-tabs__nav', role: 'tablist' },
              }),
              components: labels.map((label, index) => createTabButton(label, index === 0)),
            },
          ],
        },
        {
          tagName: 'div',
          name: '内容面板',
          ...freezeWrapper({
            droppable: '.wb-tabs__panel',
            attributes: { class: 'wb-tabs__panels' },
          }),
          components: labels.map((_, index) => createPanel(index, index === 0)),
        },
      ],
    },
  ]
}

function makeTabsScript() {
  return function (this: HTMLElement, props: { activeIndex?: number | string }) {
    const root = this as HTMLElement & {
      __wbTabsCleanup?: () => void
    }

    root.__wbTabsCleanup?.()
    root.__wbTabsCleanup = undefined

    const nav = root.querySelector('.wb-tabs__nav') as HTMLElement | null
    const buttons = Array.from(root.querySelectorAll('.wb-tabs__button')) as HTMLElement[]
    const panels = Array.from(root.querySelectorAll('.wb-tabs__panel')) as HTMLElement[]
    if (!nav || !buttons.length || !panels.length) return
    const tabsNav = nav

    function clampIndex(value: unknown) {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return null
      return Math.max(0, Math.min(buttons.length - 1, Math.floor(parsed)))
    }

    function isScrollable() {
      return tabsNav.scrollWidth > tabsNav.clientWidth + 1
    }

    function syncNavAlignment() {
      const scrollable = isScrollable()
      tabsNav.classList.toggle('is-scrollable', scrollable)
      if (!scrollable) tabsNav.scrollTo({ left: 0, behavior: 'auto' })
      return scrollable
    }

    function centerActive(button: HTMLElement, smooth = true) {
      if (!syncNavAlignment()) return
      const targetLeft = button.offsetLeft - (tabsNav.clientWidth - button.offsetWidth) / 2
      tabsNav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }

    function setActive(nextIndex: number, smooth = true) {
      const index = Math.max(0, Math.min(buttons.length - 1, nextIndex))

      buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index
        button.classList.toggle('is-active', active)
        button.setAttribute('aria-selected', active ? 'true' : 'false')
        button.setAttribute('tabindex', active ? '0' : '-1')
      })

      panels.forEach((panel, panelIndex) => {
        const active = panelIndex === index
        panel.classList.toggle('is-active', active)
        panel.toggleAttribute('hidden', !active)
      })

      centerActive(buttons[index], smooth)
    }

    function readInitialIndex() {
      const propIndex = clampIndex(props?.activeIndex)
      if (propIndex !== null) return propIndex

      const attrIndex = clampIndex(root.getAttribute('data-active-index'))
      if (attrIndex !== null) return attrIndex

      const markedIndex = buttons.findIndex(button => button.classList.contains('is-active'))
      return markedIndex >= 0 ? markedIndex : 0
    }

    const handlers: Array<{ button: HTMLElement; fn: (event: Event) => void }> = []
    buttons.forEach((button, index) => {
      const fn = () => setActive(index)
      button.addEventListener('click', fn)
      handlers.push({ button, fn })
    })

    const keyHandler = (event: KeyboardEvent) => {
      const activeButton = document.activeElement as HTMLElement | null
      const currentIndex = buttons.indexOf(activeButton as HTMLElement)
      if (currentIndex < 0) return

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') {
        return
      }

      event.preventDefault()
      const nextIndex =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : event.key === 'ArrowLeft'
              ? Math.max(0, currentIndex - 1)
              : Math.min(buttons.length - 1, currentIndex + 1)

      buttons[nextIndex]?.focus?.()
      setActive(nextIndex)
    }

    tabsNav.addEventListener('keydown', keyHandler)
    const resizeHandler = () => {
      const activeIndex = buttons.findIndex(button => button.classList.contains('is-active'))
      const activeButton = buttons[Math.max(0, activeIndex)]
      syncNavAlignment()
      if (activeButton) centerActive(activeButton, false)
    }
    window.addEventListener('resize', resizeHandler)

    const initialIndex = readInitialIndex()
    window.requestAnimationFrame(() => setActive(initialIndex, false))

    root.__wbTabsCleanup = () => {
      handlers.forEach(({ button, fn }) => button.removeEventListener('click', fn))
      tabsNav.removeEventListener('keydown', keyHandler)
      window.removeEventListener('resize', resizeHandler)
    }
  }
}

function resolveTabsTraitTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_TABS_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_TABS_TYPE) as any
  if (fromSelected?.get?.('type') === WB_TABS_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_TABS_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_TABS_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_TABS_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_TABS_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_TABS_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_TABS_TYPE) return fromTraitTarget

  return null
}

function createAddTabTrait() {
  return {
    type: 'button' as any,
    name: 'add-tab',
    label: false as const,
    text: '+ 添加 Tab',
    full: true,
    command(this: any, editor: Editor) {
      const tabs = resolveTabsTraitTarget(editor, this)
      const nav = tabs?.find?.('.wb-tabs__nav')?.[0]
      const panels = tabs?.find?.('.wb-tabs__panels')?.[0]
      const buttons = nav?.components?.()
      const panelList = panels?.components?.()
      if (!buttons || !panelList) return

      const nextIndex = buttons.length || 0
      const created = buttons.add(createTabButton(`Tab ${nextIndex + 1}`, false))
      panelList.add(createPanel(nextIndex, false))
      tabs?.set?.('tabCount', Math.max(nextIndex + 1, Number(tabs.get?.('tabCount')) || 0))

      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

export function registerTabsComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_TABS_TYPE)) return

  domComponents.addType(WB_TABS_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'tabs' ? { type: WB_TABS_TYPE } : false,

    model: {
      defaults: {
        name: 'Tabs',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'tabs',
          'data-active-index': '0',
          class: 'wb-tabs',
        },
        activeIndex: 0,
        tabCount: DEFAULT_TABS.length,
        styles: TABS_CSS,
        script: makeTabsScript(),
        'script-export': makeTabsScript(),
        'script-props': ['activeIndex'],
        traits: [
          makeNumberTrait('默认激活项', 'activeIndex', { min: 0, max: 20, step: 1 }),
          makeNumberTrait('Tab 数量', 'tabCount', { min: 1, max: 20, step: 1 }),
          createAddTabTrait(),
        ],
        components: buildTabsTree(DEFAULT_TABS.length),
      },
      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        const activeIndex = Math.max(
          0,
          Number(this.get('activeIndex') ?? attrs['data-active-index'] ?? 0) || 0
        )

        this.set('activeIndex', activeIndex, { silent: true })
        this.on('change:activeIndex', this._syncActiveIndex)
        this.on('change:tabCount', this._applyTabCount)
        this._syncActiveIndex()
      },
      _syncActiveIndex(this: any) {
        const activeIndex = Math.max(0, Number(this.get('activeIndex') || 0) || 0)
        this.addAttributes({
          'data-wb-component': 'tabs',
          'data-active-index': String(activeIndex),
        })

        const buttons = this.find?.('.wb-tabs__button') || []
        const panels = this.find?.('.wb-tabs__panel') || []
        buttons.forEach((button: any, index: number) => {
          const classes = new Set<string>((button.getClasses?.() as string[]) || [])
          if (index === activeIndex) classes.add('is-active')
          else classes.delete('is-active')
          button.setClass?.(Array.from(classes))
          button.addAttributes?.({
            'aria-selected': index === activeIndex ? 'true' : 'false',
            tabindex: index === activeIndex ? '0' : '-1',
          })
        })
        panels.forEach((panel: any, index: number) => {
          const classes = new Set<string>((panel.getClasses?.() as string[]) || [])
          if (index === activeIndex) classes.add('is-active')
          else classes.delete('is-active')
          panel.setClass?.(Array.from(classes))
          const attrs = { ...(panel.getAttributes?.() || {}) }
          if (index === activeIndex) delete attrs.hidden
          else attrs.hidden = 'hidden'
          panel.setAttributes?.(attrs)
        })
      },
      _applyTabCount(this: any) {
        const nav = this.find?.('.wb-tabs__nav')?.[0]
        const panels = this.find?.('.wb-tabs__panels')?.[0]
        const buttons = nav?.components?.()
        const panelList = panels?.components?.()
        if (!buttons || !panelList) return

        const target = Math.max(1, Math.min(20, Number(this.get('tabCount')) || DEFAULT_TABS.length))
        const current = buttons.length || 0

        if (current < target) {
          for (let index = current; index < target; index++) {
            buttons.add(createTabButton(DEFAULT_TABS[index] ?? `Tab ${index + 1}`, false))
            panelList.add(createPanel(index, false))
          }
        } else if (current > target) {
          for (let index = current - 1; index >= target; index--) {
            const button = buttons.at(index)
            const panel = panelList.at(index)
            if (button) buttons.remove(button)
            if (panel) panelList.remove(panel)
          }
        }

        const activeIndex = Math.min(
          target - 1,
          Math.max(0, Number(this.get('activeIndex') || 0) || 0)
        )
        this.set('activeIndex', activeIndex, { silent: true })
        this._syncActiveIndex()
      },
    },
  })

  blockManager?.add?.(WB_TABS_TYPE, {
    label: 'Tabs',
    category: 'Interactive',
    content: { type: WB_TABS_TYPE },
    media: BLOCK_ICON,
  })
}
