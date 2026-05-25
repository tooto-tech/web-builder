import type { Editor } from 'grapesjs'

export const WB_TAB_MEDIA_GALLERY_TYPE = 'wb-tab-media-gallery'

const DEFAULT_LABELS = [
  'Agricultural Film',
  'Food Packaging',
  'Consumer Packaging',
  'Industrial Packing',
  'Medical Packaging',
  'Wire And Cable Industry',
  'Auto Injection Parts',
  'Pipe Industry',
  'Textile Fiber',
  'Artificial Grass Fiber',
]

const TAB_MEDIA_GALLERY_CSS = `
  .wb-tmg {
    width: 100%;
    box-sizing: border-box;
    padding: 80px 0;
  }
  .wb-tmg__inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .wb-tmg__layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 30px;
    align-items: start;
  }
  .wb-tmg__tabs {
    display: flex;
    flex-direction: column;
  }
  .wb-tmg__tabs-title {
    margin: 0 0 40px 0;
    color: #000000;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 600;
  }
  .wb-tmg__tabs-list {
    display: flex;
    flex-direction: column;
  }
  .wb-tmg__tab-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 16px 0;
    border-top: 1px solid #D8D8D8;
    background: transparent;
    color: #000000;
    cursor: pointer;
    font-size: 16px;
    line-height: 1.2;
    text-align: left;
    transition: color 0.18s ease, transform 0.18s ease;
  }
  .wb-tmg__tab-btn.is-active {
    color: #0057CE;
    font-weight: 500;
  }
  .wb-tmg__content {
    min-width: 0;
  }
  .wb-tmg__panel {
    display: none;
  }
  .wb-tmg__panel.is-active {
    display: block;
  }
  .wb-tmg__list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .wb-tmg__card {
    position: relative;
    overflow: hidden;
    background: #dce5f1;
  }
  .wb-tmg__card-link {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    text-decoration: none;
  }
  .wb-tmg__card-img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.28s ease;
  }
  .wb-tmg__card-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 6px;
    padding: 28px;
    background: linear-gradient(180deg, rgba(8, 15, 38, 0.04) 0%, rgba(8, 15, 38, 0.72) 100%);
    box-sizing: border-box;
  }
  .wb-tmg__card-title {
    margin: 0;
    color: #ffffff;
    font-size: 24px;
    line-height: 1.2;
    font-weight: 600;
  }
  .wb-tmg__card-desc {
    margin: 0;
    color: rgba(255, 255, 255, 0.82);
    font-size: 14px;
    line-height: 1.55;
  }
  @media (max-width: 1023px) {
    .wb-tmg {
      padding: 48px 0;
    }
    .wb-tmg__layout {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .wb-tmg__tabs {
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .wb-tmg__tab-btn {
      width: auto;
      flex: 0 0 auto;
      white-space: nowrap;
    }
  }
  @media (max-width: 767px) {
    .wb-tmg__inner {
      padding: 0 16px;
    }
    .wb-tmg__tabs-title{
      margin-bottom: 20px;
    }
    .wb-tmg__tab-btn {
      padding: 14px 0;
      font-size: 14px;
    }
    .wb-tmg__list {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .wb-tmg__card,
    .wb-tmg__card-link {
      min-height: 220px;
    }
    .wb-tmg__card-overlay {
      padding: 22px 20px;
    }
    .wb-tmg__card-title {
      font-size: 21px;
    }
  }
`

function freezeWrapper(extra: Record<string, unknown> = {}) {
  return {
    removable: false,
    selectable: false,
    hoverable: false,
    draggable: false,
    droppable: false,
    highlightable: false,
    copyable: false,
    ...extra,
  }
}

function buildDefaultCard(index = 0) {
  return {
    name: `卡片 ${index + 1}`,
    tagName: 'div',
    selectable: true,
    droppable: false,
    attributes: { class: 'wb-tmg__card' },
    components: [
      {
        name: `卡片链接 ${index + 1}`,
        tagName: 'a',
        selectable: true,
        droppable: false,
        attributes: { href: '#', class: 'wb-tmg__card-link' },
        components: [
          {
            name: `图片 ${index + 1}`,
            tagName: 'img',
            selectable: true,
            droppable: false,
            attributes: {
              src: 'https://placehold.co/888x548/e2e8f0/94a3b8?text=Industry+Image',
              alt: '',
              class: 'wb-tmg__card-img',
            },
          }
        ],
      },
    ],
  }
}

function buildTabButton(label: string, isActive: boolean) {
  return {
    name: `Tab ${label}`,
    tagName: 'button',
    type: 'text',
    selectable: true,
    droppable: false,
    attributes: {
      class: `wb-tmg__tab-btn${isActive ? ' is-active' : ''}`,
      type: 'button',
      'aria-selected': isActive ? 'true' : 'false',
    },
    components: label,
  }
}

function buildPanel(index: number, itemCount = 2) {
  return {
    name: `面板 ${index + 1}`,
    tagName: 'div',
    selectable: true,
    droppable: false,
    attributes: {
      class: `wb-tmg__panel${index === 0 ? ' is-active' : ''}`,
      'data-tmg-panel': String(index),
    },
    components: [
      {
        name: `图片列表 ${index + 1}`,
        tagName: 'div',
        selectable: true,
        droppable: true,
        attributes: { class: 'wb-tmg__list' },
        components: Array.from({ length: itemCount }, (_, cardIndex) => buildDefaultCard(cardIndex)),
      },
    ],
  }
}

function buildComponentTree(tabCount = DEFAULT_LABELS.length) {
  const labels = Array.from({ length: tabCount }, (_, index) => DEFAULT_LABELS[index] ?? `Tab ${index + 1}`)

  return [
    {
      tagName: 'div',
      name: '内容容器',
      ...freezeWrapper({ attributes: { class: 'wb-tmg__inner' } }),
      components: [
        {
          tagName: 'div',
          name: '双栏布局',
          ...freezeWrapper({ attributes: { class: 'wb-tmg__layout' } }),
          components: [
            {
              name: 'Tabs 区域',
              tagName: 'div',
              selectable: false,
              droppable: false,
              attributes: { class: 'wb-tmg__tabs' },
              components: [
                {
                  name: 'Heading',
                  tagName: 'h2',
                  selectable: true,
                  droppable: false,
                  attributes: { class: 'wb-tmg__tabs-title' },
                  components: [{ type: 'textnode', content: 'Product category' }],
                },
                {
                  name: 'Tabs',
                  tagName: 'div',
                  selectable: false,
                  droppable: false,
                  attributes: { class: 'wb-tmg__tabs-list' },
                  components: labels.map((label, index) => buildTabButton(label, index === 0)),
                },
              ],
            },
            {
              name: '内容区',
              tagName: 'div',
              selectable: false,
              droppable: false,
              attributes: { class: 'wb-tmg__content' },
              components: labels.map((_, index) => buildPanel(index, 3)),
            },
          ],
        },
      ],
    },
  ]
}

function makeScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & { __wbTmgCleanup?: () => void }

    if (root.__wbTmgCleanup) {
      root.__wbTmgCleanup()
      root.__wbTmgCleanup = undefined
    }

    const buttons = Array.from(root.querySelectorAll('.wb-tmg__tab-btn')) as HTMLElement[]
    const panels = Array.from(root.querySelectorAll('.wb-tmg__panel')) as HTMLElement[]
    if (!buttons.length || !panels.length) return

    function setActive(nextIndex: number) {
      buttons.forEach((button, index) => {
        const active = index === nextIndex
        button.classList.toggle('is-active', active)
        button.setAttribute('aria-selected', active ? 'true' : 'false')
      })

      panels.forEach((panel, index) => {
        panel.classList.toggle('is-active', index === nextIndex)
      })
    }

    const handlers: Array<{ button: HTMLElement; fn: () => void }> = []
    buttons.forEach((button, index) => {
      const fn = () => setActive(index)
      button.addEventListener('click', fn)
      handlers.push({ button, fn })
    })

    const readIndexFromUrl = () => {
      try {
        const raw = new URLSearchParams(window.location.search).get('index')
        if (raw == null) return null
        const n = Number(raw)
        if (!Number.isFinite(n)) return null
        // Support both 0-based (?index=0) and 1-based (?index=1) usage.
        const idx = n >= 1 ? n - 1 : n
        if (idx < 0 || idx >= buttons.length) return null
        return idx
      } catch {
        return null
      }
    }

    const urlIndex = readIndexFromUrl()
    const markedIndex = buttons.findIndex(button => button.classList.contains('is-active'))
    const initialIndex = urlIndex ?? (markedIndex >= 0 ? markedIndex : 0)
    setActive(initialIndex)

    root.__wbTmgCleanup = () => {
      handlers.forEach(({ button, fn }) => button.removeEventListener('click', fn))
    }
  }
}

export function registerTabMediaGalleryComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_TAB_MEDIA_GALLERY_TYPE)) return

  domComponents.addType(WB_TAB_MEDIA_GALLERY_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'tab-media-gallery'
        ? { type: WB_TAB_MEDIA_GALLERY_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Tabs 图片列表',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'tab-media-gallery',
          class: 'wb-tmg',
        },
        style: {
          width: '100%',
        },
        tabCount: 10,
        traits: [
          {
            type: 'number',
            label: 'Tab 数量',
            name: 'tabCount',
            min: 1,
            max: 20,
            step: 1,
            changeProp: true,
          },
        ],
        components: buildComponentTree(DEFAULT_LABELS.length),
        script: makeScript(),
        'script-export': makeScript(),
        styles: TAB_MEDIA_GALLERY_CSS,
      },

      init(this: any) {
        this.on('change:tabCount', this.applyTabCount)
      },

      getTabsContainer(this: any) {
        return this.components()?.at(0)?.components()?.at(0)?.components()?.at(0) ?? null
      },

      getPanelsContainer(this: any) {
        return this.components()?.at(0)?.components()?.at(0)?.components()?.at(1) ?? null
      },

      applyTabCount(this: any) {
        const tabsContainer = this.getTabsContainer()
        const panelsContainer = this.getPanelsContainer()
        if (!tabsContainer || !panelsContainer) return

        const target = Math.max(1, Math.min(10, Number(this.get('tabCount')) || 10))
        const tabButtons = tabsContainer.components?.()
        const panels = panelsContainer.components?.()
        if (!tabButtons || !panels) return

        const current = tabButtons.length || 0

        if (current < target) {
          for (let index = current; index < target; index++) {
            tabButtons.add(buildTabButton(DEFAULT_LABELS[index] ?? `Tab ${index + 1}`, false))
            panels.add(buildPanel(index, 2))
          }
        } else if (current > target) {
          for (let index = current - 1; index >= target; index--) {
            const tabButton = tabButtons.at(index)
            const panel = panels.at(index)
            if (tabButton) tabButtons.remove(tabButton)
            if (panel) panels.remove(panel)
          }
        }

        tabButtons.each?.((button: any, index: number) => {
          const classes = new Set<string>((button.getClasses?.() as string[]) || [])
          if (index === 0) classes.add('is-active')
          else classes.delete('is-active')
          button.setClass?.(Array.from(classes))
          button.addAttributes?.({ 'aria-selected': index === 0 ? 'true' : 'false' })
        })

        panels.each?.((panel: any, index: number) => {
          const classes = new Set<string>((panel.getClasses?.() as string[]) || [])
          if (index === 0) classes.add('is-active')
          else classes.delete('is-active')
          panel.setClass?.(Array.from(classes))
        })
      },
    },
  })
}
