import type { Editor } from 'grapesjs'

export const WB_MARQUEE_TYPE = 'wb-marquee'
export const WB_MARQUEE_ITEM_TYPE = 'wb-marquee-item'

const DEFAULT_SPEED = 30
const DEFAULT_DIRECTION = 'left'
const DEFAULT_PAUSE_ON_HOVER = true
const DEFAULT_GAP = 0
const DEFAULT_ITEMS = 4

const DEFAULT_IMAGE_SOURCES = [
  'https://placehold.co/480x578/e5e7eb/4b5563?text=Image+1',
  'https://placehold.co/480x578/dbeafe/1d4ed8?text=Image+2',
  'https://placehold.co/480x578/dcfce7/15803d?text=Image+3',
  'https://placehold.co/480x578/fef3c7/b45309?text=Image+4'
]

const MARQUEE_CSS = `
  [data-wb-component="marquee"] {
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  [data-wb-marquee-item="1"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .wb-marquee__viewport {
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  .wb-marquee__track {
    display: inline-flex;
    vertical-align: middle;
    align-items: center;
    flex-wrap: nowrap;
    width: max-content;
    will-change: transform;
  }
`

const toNumber = (value: unknown, fallback = 0) => {
  const num = parseFloat(String(value))
  return Number.isFinite(num) ? num : fallback
}

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value
  return String(value) === 'true'
}

export function registerMarqueeComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents) return

  if (!domComponents.getType(WB_MARQUEE_ITEM_TYPE)) {
    domComponents.addType(WB_MARQUEE_ITEM_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-marquee-item') === '1' ||
        el?.hasAttribute?.('data-gjs-marquee-item')
          ? { type: WB_MARQUEE_ITEM_TYPE }
          : false,

      model: {
        defaults: {
          name: 'Marquee Item',
          tagName: 'div',
          draggable: `[data-gjs-type="${WB_MARQUEE_TYPE}"]`,
          droppable: true,
          layerable: true,
          selectable: true,
          hoverable: true,
          copyable: true,
          removable: true,
          highlightable: true,
          attributes: {
            'data-wb-marquee-item': '1',
            class: 'wb-marquee__item'
          },
          style: {
            display: 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
            'flex-shrink': '0'
          },
          components: [
            {
              type: 'image',
              attributes: {
                src: DEFAULT_IMAGE_SOURCES[0],
                alt: ''
              }
            }
          ]
        },

        init(this: any) {
          const refreshParent = () => {
            const parent = this.parent?.()
            if (parent?.get?.('type') === WB_MARQUEE_TYPE) {
              parent.triggerRuntimeRefresh?.()
            }
          }

          this.on('change', refreshParent)
          this.listenTo(this.components(), 'add remove reset change', refreshParent)
        }
      }
    })
  }

  if (domComponents.getType(WB_MARQUEE_TYPE)) return

  domComponents.addType(WB_MARQUEE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'marquee' ||
      el?.hasAttribute?.('data-gjs-marquee')
        ? { type: WB_MARQUEE_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Marquee',
        tagName: 'div',
        draggable: '*',
        droppable: `[data-gjs-type="${WB_MARQUEE_ITEM_TYPE}"]`,
        layerable: true,
        selectable: true,
        hoverable: true,
        copyable: true,
        removable: true,
        stylable: true,
        attributes: {
          'data-wb-component': 'marquee',
          'data-speed': String(DEFAULT_SPEED),
          'data-direction': DEFAULT_DIRECTION,
          'data-pause-on-hover': String(DEFAULT_PAUSE_ON_HOVER),
          'data-gap': String(DEFAULT_GAP),
          class: 'wb-marquee'
        },
        style: {
          position: 'relative',
          overflow: 'hidden',
          width: '100%'
        },
        styles: MARQUEE_CSS,
        speed: DEFAULT_SPEED,
        direction: DEFAULT_DIRECTION,
        pauseOnHover: DEFAULT_PAUSE_ON_HOVER,
        gap: DEFAULT_GAP,
        components: Array.from({ length: DEFAULT_ITEMS }).map((_, index) => ({
          type: WB_MARQUEE_ITEM_TYPE,
          components: [
            {
              type: 'image',
              attributes: {
                src: DEFAULT_IMAGE_SOURCES[index % DEFAULT_IMAGE_SOURCES.length],
                alt: ''
              }
            }
          ]
        })),
        traits: [
          {
            type: 'number',
            label: 'Speed',
            name: 'speed',
            min: 1,
            step: 1,
            placeholder: String(DEFAULT_SPEED),
            changeProp: true
          },
          {
            type: 'select',
            label: 'Direction',
            name: 'direction',
            changeProp: true,
            options: [
              { id: 'left', label: 'Left' },
              { id: 'right', label: 'Right' }
            ]
          },
          {
            type: 'checkbox',
            label: 'Pause on hover',
            name: 'pauseOnHover',
            changeProp: true
          },
          {
            type: 'number',
            label: 'Gap',
            name: 'gap',
            min: 0,
            step: 1,
            placeholder: String(DEFAULT_GAP),
            changeProp: true
          }
        ],

        script: function (this: any) {
          // GrapesJS binds `this` to the component element inside canvas/export runtime.
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const root = this

          const setup = function () {
            const speed = Math.max(1, parseFloat(root.getAttribute('data-speed') || '30'))
            const direction = root.getAttribute('data-direction') || 'left'
            const pauseOnHover = String(root.getAttribute('data-pause-on-hover')) === 'true'
            const gap = Math.max(0, parseFloat(root.getAttribute('data-gap') || '24'))

            if (root.__wbMarqueeCleanup) {
              root.__wbMarqueeCleanup()
            }

            const oldViewport = root.querySelector(':scope > .wb-marquee__viewport')
            if (oldViewport) oldViewport.remove()

            const sourceItems = Array.prototype.slice.call(root.children).filter(function (node) {
              return (
                node.nodeType === 1 &&
                node.getAttribute &&
                node.getAttribute('data-wb-marquee-item') === '1'
              )
            })

            if (!sourceItems.length) return

            sourceItems.forEach(function (item) {
              item.style.display = 'none'
            })

            const sourceObservers: MutationObserver[] = []

            const viewport = document.createElement('div')
            viewport.className = 'wb-marquee__viewport'
            viewport.style.cssText = 'position:relative;overflow:hidden;width:100%;'

            const track = document.createElement('div')
            track.className = 'wb-marquee__track'
            track.style.cssText =
              'display:inline-flex;align-items:center;flex-wrap:nowrap;width:max-content;will-change:transform;gap:' +
              gap +
              'px;'

            const createSet = function () {
              const frag = document.createDocumentFragment()
              sourceItems.forEach(function (item) {
                const clone = item.cloneNode(true)
                clone.style.display = ''
                clone.removeAttribute('data-gjs-highlightable')
                clone.removeAttribute('data-gjs-selectable')
                clone.removeAttribute('data-gjs-hoverable')
                frag.appendChild(clone)
              })
              return frag
            }

            track.appendChild(createSet())
            track.appendChild(createSet())
            viewport.appendChild(track)
            root.appendChild(viewport)

            let rafId = 0
            let paused = false
            let x = direction === 'left' ? 0 : -track.scrollWidth / 2
            let lastTs = 0

            const getHalfWidth = function () {
              return track.scrollWidth / 2
            }

            const render = function () {
              track.style.transform = 'translate3d(' + x + 'px,0,0)'
            }

            const normalize = function () {
              const half = getHalfWidth()
              if (!half) return

              if (direction === 'left') {
                if (Math.abs(x) >= half) x += half
              } else if (x >= 0) {
                x -= half
              }
            }

            const tick = function (ts) {
              if (!lastTs) lastTs = ts
              const dt = (ts - lastTs) / 1000
              lastTs = ts

              if (!paused) {
                const dist = speed * dt
                if (direction === 'left') {
                  x -= dist
                } else {
                  x += dist
                }
                normalize()
                render()
              }

              rafId = requestAnimationFrame(tick)
            }

            const onMouseEnter = function () {
              paused = true
            }
            const onMouseLeave = function () {
              paused = false
            }
            const onResize = function () {
              normalize()
              render()
            }
            let refreshTimer = 0
            const scheduleRefresh = function () {
              if (refreshTimer) cancelAnimationFrame(refreshTimer)
              refreshTimer = requestAnimationFrame(function () {
                refreshTimer = 0
                setup()
              })
            }

            if (pauseOnHover) {
              root.addEventListener('mouseenter', onMouseEnter)
              root.addEventListener('mouseleave', onMouseLeave)
            }

            sourceItems.forEach(function (item) {
              const observer = new MutationObserver(scheduleRefresh)
              observer.observe(item, {
                attributes: true,
                attributeFilter: ['src', 'alt', 'class', 'style', 'href', 'target', 'title'],
                childList: true,
                characterData: true,
                subtree: true
              })
              sourceObservers.push(observer)
            })

            window.addEventListener('resize', onResize)
            render()
            rafId = requestAnimationFrame(tick)

            root.__wbMarqueeCleanup = function () {
              cancelAnimationFrame(rafId)
              if (refreshTimer) cancelAnimationFrame(refreshTimer)
              sourceObservers.forEach(function (observer) {
                observer.disconnect()
              })
              window.removeEventListener('resize', onResize)
              root.removeEventListener('mouseenter', onMouseEnter)
              root.removeEventListener('mouseleave', onMouseLeave)
            }
          }

          requestAnimationFrame(setup)
        }
      },

      init(this: any) {
        this.on('change:speed change:direction change:pauseOnHover change:gap', this.applyConfig)
        this.on('change:components', this.triggerRuntimeRefresh)
        this.applyConfig()
      },

      applyConfig(this: any) {
        this.addAttributes({
          'data-speed': String(toNumber(this.get('speed'), DEFAULT_SPEED)),
          'data-direction': this.get('direction') || DEFAULT_DIRECTION,
          'data-pause-on-hover': String(toBoolean(this.get('pauseOnHover'))),
          'data-gap': String(toNumber(this.get('gap'), DEFAULT_GAP))
        })

        this.triggerRuntimeRefresh()
      },

      triggerRuntimeRefresh(this: any) {
        this.addAttributes({
          'data-marquee-refresh': String(Date.now())
        })

        const view = this.view
        const el = view?.el as (HTMLElement & { __wbMarqueeCleanup?: () => void }) | undefined
        if (el?.__wbMarqueeCleanup) {
          el.__wbMarqueeCleanup()
        }
        view?.render?.()
      }
    },

    view: {
      init(this: any) {
        this.listenTo(this.model.components(), 'add remove reset', this.onChildrenChange)
        this.listenTo(this.model.components(), 'change', this.onChildrenChange)
      },

      onChildrenChange(this: any) {
        const el = this.el as (HTMLElement & { __wbMarqueeCleanup?: () => void }) | undefined
        if (el?.__wbMarqueeCleanup) {
          el.__wbMarqueeCleanup()
        }
        this.render()
      }
    }
  })
}
