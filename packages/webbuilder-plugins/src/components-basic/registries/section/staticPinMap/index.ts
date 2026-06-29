import type { Editor } from 'grapesjs'
import { injectStyleOnce } from '../../../injectStyle.js'
import { makeImagePickerTrait, makeNumberTrait } from '../../../traitFactory.js'

export const WB_STATIC_PIN_MAP_TYPE = 'wb-static-pin-map'
export const WB_STATIC_PIN_TYPE = 'wb-static-pin'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M12 22s-6-7.1-6-11a6 6 0 1 1 12 0c0 3.9-6 11-6 11Z" />
  <circle cx="12" cy="11" r="2.5" />
</svg>`

const DEFAULT_MAP_SRC = '/assets/static-map/map-placeholder.svg'
const DEFAULT_PIN_BLUE = '/assets/static-map/pin-blue.svg'
const DEFAULT_PIN_YELLOW = '/assets/static-map/pin-yellow.svg'

type PinVariant = 'blue' | 'yellow'

type PinPreset = {
  left: string
  top: string
  variant?: PinVariant
  delay?: string
  name?: string
}

const DEFAULT_PINS: PinPreset[] = [
  { left: '17%', top: '30%', variant: 'yellow', delay: '0s', name: 'Seattle' },
  { left: '32%', top: '34%', variant: 'blue', delay: '0.12s', name: 'Boise' },
  { left: '26%', top: '50%', variant: 'blue', delay: '0.24s', name: 'Salt Lake City' },
  { left: '23%', top: '66%', variant: 'yellow', delay: '0.36s', name: 'Phoenix' },
  { left: '37%', top: '55%', variant: 'yellow', delay: '0.48s', name: 'Denver' },
  { left: '52%', top: '44%', variant: 'blue', delay: '0.6s', name: 'Kansas City' },
  { left: '54%', top: '68%', variant: 'blue', delay: '0.72s', name: 'Houston' },
  { left: '62%', top: '48%', variant: 'blue', delay: '0.84s', name: 'Chicago' },
  { left: '79%', top: '42%', variant: 'yellow', delay: '0.96s', name: 'Washington DC' },
  { left: '73%', top: '64%', variant: 'yellow', delay: '1.08s', name: 'Atlanta' }
]

const STATIC_PIN_MAP_CSS = `
  .wb-static-map {
    --pin-size-blue: 36px;
    --pin-size-yellow: 32px;
    --pin-size-blue-m: var(--pin-size-blue);
    --pin-size-yellow-m: var(--pin-size-yellow);
    --pin-bounce-duration: 1.8s;
    --pin-stagger: 0.18s;
    --pin-intro-delay: 0.35s;
    --pin-shadow: 0 14px 24px rgba(13, 32, 55, 0.18);
    position: relative;
    width: 100%;
    box-sizing: border-box;
  }
  .wb-static-map__frame {
    position: relative;
    width: 100%;
    aspect-ratio: 605 / 512;
    overflow: hidden;
    border-radius: 18px;
  }
  .wb-static-map__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    user-select: none;
    pointer-events: none;
  }
  .wb-static-map__pins {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }
  .wb-static-map__pin {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -100%);
    width: calc(var(--pin-size-current) * 2);
    height: calc(var(--pin-size-current) * 2.1);
    pointer-events: none;
  }
  .wb-static-map__pin[data-variant="blue"] { --pin-size-current: var(--pin-size-blue); }
  .wb-static-map__pin[data-variant="yellow"] { --pin-size-current: var(--pin-size-yellow); }
  .wb-static-map__pin-icon {
    position: absolute;
    left: 50%;
    bottom: 6px;
    transform: translate(-50%, 0);
    width: var(--pin-size-current);
    height: var(--pin-size-current);
    display: block;
    filter: drop-shadow(var(--pin-shadow));
    opacity: 0;
    animation:
      wb-static-pin-appear 0.45s ease var(--pin-intro-delay) 1 forwards,
      wb-static-pin-bounce var(--pin-bounce-duration) ease-in-out calc(var(--pin-intro-delay) + var(--pin-delay, 0s)) infinite;
    transform-origin: center bottom;
    user-select: none;
    pointer-events: none;
  }
  .wb-static-map__pin-shadow {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 0);
    width: calc(var(--pin-size-current) * 0.9);
    height: calc(var(--pin-size-current) * 0.32);
    background: radial-gradient(ellipse at center, rgba(0, 23, 55, 0.25), transparent 60%);
    opacity: 0.8;
    filter: blur(1px);
    opacity: 0;
    animation:
      wb-static-pin-shadow-appear 0.35s ease var(--pin-intro-delay) 1 forwards,
      wb-static-pin-shadow var(--pin-bounce-duration) ease-in-out calc(var(--pin-intro-delay) + var(--pin-delay, 0s)) infinite;
  }
  @keyframes wb-static-pin-appear {
    from { opacity: 0; transform: translate(-50%, 14%) scale(0.9); }
    to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
  }
  @keyframes wb-static-pin-bounce {
    0%, 70%, 100% { transform: translate(-50%, 0) scale(1); }
    35% { transform: translate(-50%, -12%) scale(1.04); }
    50% { transform: translate(-50%, -8%) scale(0.98); }
  }
  @keyframes wb-static-pin-shadow-appear {
    from { opacity: 0; transform: translate(-50%, 0) scale(0.9); }
    to   { opacity: 0.8; transform: translate(-50%, 0) scale(1); }
  }
  @keyframes wb-static-pin-shadow {
    0%, 70%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.8; }
    35% { transform: translate(-50%, 0) scale(0.9); opacity: 0.5; }
    50% { transform: translate(-50%, 0) scale(1.02); opacity: 0.9; }
  }
  @media (max-width: 1023px) {
    .wb-static-map__frame { border-radius: 14px; }
    .wb-static-map__pin[data-variant="blue"] { --pin-size-current: var(--pin-size-blue-m, var(--pin-size-blue)); }
    .wb-static-map__pin[data-variant="yellow"] { --pin-size-current: var(--pin-size-yellow-m, var(--pin-size-yellow)); }
    .wb-static-map__pin { width: calc(var(--pin-size-current) * 1.8); height: calc(var(--pin-size-current) * 1.9); }
    .wb-static-map__pin-icon { width: calc(var(--pin-size-current) * 0.9); height: calc(var(--pin-size-current) * 0.9); }
  }
  @media (max-width: 767px) {
    .wb-static-map__frame { border-radius: 12px; }
    .wb-static-map__pin { width: calc(var(--pin-size-current) * 1.6); height: calc(var(--pin-size-current) * 1.7); }
    .wb-static-map__pin-icon { width: calc(var(--pin-size-current) * 0.82); height: calc(var(--pin-size-current) * 0.82); }
  }
`

function buildPin(preset: PinPreset, index: number) {
  const variant: PinVariant = preset.variant ?? 'blue'
  const delay = preset.delay ?? `calc(var(--pin-stagger) * ${index})`

  return {
    type: WB_STATIC_PIN_TYPE,
    name: preset.name ?? `Pin ${index + 1}`,
    draggable: '.wb-static-map__pins',
    droppable: false,
    selectable: true,
    stylable: true,
    copyable: true,
    removable: true,
    attributes: {
      class: 'wb-static-map__pin',
      'data-variant': variant,
      'data-pin-index': `${index}`,
      'aria-label': preset.name ?? `Pin ${index + 1}`
    },
    style: {
      left: preset.left,
      top: preset.top,
      '--pin-delay': delay
    },
    components: [
      {
        tagName: 'span',
        selectable: false,
        hoverable: false,
        highlightable: false,
        layerable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-static-map__pin-shadow' }
      },
      {
        tagName: 'img',
        selectable: false,
        hoverable: false,
        highlightable: false,
        layerable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: {
          class: 'wb-static-map__pin-icon',
          src: variant === 'yellow' ? DEFAULT_PIN_YELLOW : DEFAULT_PIN_BLUE,
          alt: '',
          loading: 'lazy'
        }
      }
    ]
  }
}

function buildPins() {
  return DEFAULT_PINS.map((preset, index) => buildPin(preset, index))
}

function buildStaticMapTree() {
  return [
    {
      tagName: 'div',
      name: '画布',
      selectable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-static-map__frame' },
      components: [
        {
          type: 'image',
          name: '底图',
          selectable: true,
          hoverable: true,
          stylable: true,
          attributes: {
            class: 'wb-static-map__bg',
            src: DEFAULT_MAP_SRC,
            alt: 'Map background',
            draggable: false
          }
        },
        {
          tagName: 'div',
          name: '点位容器',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: true,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-static-map__pins' },
          components: buildPins()
        }
      ]
    }
  ]
}

function parseSeconds(value: unknown, fallback: number): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback
}

function parseSize(value: unknown, fallback: number, min = 8, max = 160): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(Math.max(numeric, min), max)
}

export function registerStaticPinMapComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_STATIC_PIN_MAP_TYPE)) return

  injectStyleOnce(editor, 'wb-static-pin-map', STATIC_PIN_MAP_CSS)

  if (!domComponents.getType(WB_STATIC_PIN_TYPE)) {
    domComponents.addType(WB_STATIC_PIN_TYPE, {
      model: {
        defaults: {
          traits: [
            makeNumberTrait('X (%)', 'pinLeft', { min: 0, max: 100, step: 0.1 }),
            makeNumberTrait('Y (%)', 'pinTop', { min: 0, max: 100, step: 0.1 })
          ]
        },
        init(this: any) {
          const style = this.getStyle?.() ?? {}
          const left = Number.parseFloat(`${style.left ?? ''}`)
          const top = Number.parseFloat(`${style.top ?? ''}`)

          if (Number.isFinite(left) && !Number.isFinite(Number(this.get('pinLeft')))) {
            this.set('pinLeft', left)
          }
          if (Number.isFinite(top) && !Number.isFinite(Number(this.get('pinTop')))) {
            this.set('pinTop', top)
          }

          this.on('change:pinLeft change:pinTop', this.applyPinPosition)
        },
        applyPinPosition(this: any) {
          const currentStyle = { ...(this.getStyle?.() ?? {}) }
          const left = Number(this.get('pinLeft'))
          const top = Number(this.get('pinTop'))

          if (Number.isFinite(left)) currentStyle.left = `${left}%`
          if (Number.isFinite(top)) currentStyle.top = `${top}%`

          this.setStyle(currentStyle)
        }
      }
    })
  }

  domComponents.addType(WB_STATIC_PIN_MAP_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'static-pin-map'
        ? { type: WB_STATIC_PIN_MAP_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Static Map Pins',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: STATIC_PIN_MAP_CSS,
        attributes: {
          'data-wb-component': 'static-pin-map',
          class: 'wb-static-map'
        },
        mapImage: DEFAULT_MAP_SRC,
        pinBlueImage: DEFAULT_PIN_BLUE,
        pinYellowImage: DEFAULT_PIN_YELLOW,
        pinBlueSize: 36,
        pinYellowSize: 32,
        pinBlueSizeMobile: 30,
        pinYellowSizeMobile: 26,
        bounceDuration: 1.8,
        stagger: 0.18,
        introDelay: 0.35,
        traits: [
          makeImagePickerTrait('地图底图', 'mapImage'),
          makeImagePickerTrait('蓝色点图标', 'pinBlueImage'),
          makeImagePickerTrait('黄色点图标', 'pinYellowImage'),
          makeNumberTrait('蓝点尺寸(px)', 'pinBlueSize', { min: 16, max: 96, step: 2 }),
          makeNumberTrait('黄点尺寸(px)', 'pinYellowSize', { min: 14, max: 96, step: 2 }),
          makeNumberTrait('蓝点尺寸-移动(px)', 'pinBlueSizeMobile', { min: 12, max: 96, step: 2 }),
          makeNumberTrait('黄点尺寸-移动(px)', 'pinYellowSizeMobile', { min: 12, max: 96, step: 2 }),
          makeNumberTrait('弹跳周期(秒)', 'bounceDuration', { min: 0.6, max: 4, step: 0.1 }),
          makeNumberTrait('错峰间隔(秒)', 'stagger', { min: 0, max: 1, step: 0.02 }),
          makeNumberTrait('出场延迟(秒)', 'introDelay', { min: 0, max: 3, step: 0.05 })
        ],
        components: buildStaticMapTree()
      },

      init(this: any) {
        this.applyMapImage()
        this.applyPinImages()
        this.applyTimingVars()
        this.on('change:mapImage', this.applyMapImage)
        this.on('change:pinBlueImage change:pinYellowImage', this.applyPinImages)
        this.on(
          'change:pinBlueSize change:pinYellowSize change:pinBlueSizeMobile change:pinYellowSizeMobile change:bounceDuration change:stagger change:introDelay',
          this.applyTimingVars
        )
      },

      applyMapImage(this: any) {
        const bg = this.find?.('.wb-static-map__bg')?.[0]
        const src = `${this.get('mapImage') || ''}`.trim() || DEFAULT_MAP_SRC
        bg?.addAttributes?.({ src })
      },

      applyPinImages(this: any) {
        const blue = `${this.get('pinBlueImage') || ''}`.trim() || DEFAULT_PIN_BLUE
        const yellow = `${this.get('pinYellowImage') || ''}`.trim() || DEFAULT_PIN_YELLOW
        const pins = this.find?.('.wb-static-map__pin') || []
        pins.forEach((pin: any) => {
          const variant = pin?.getAttributes?.()?.['data-variant'] ?? 'blue'
          const icon = pin?.find?.('.wb-static-map__pin-icon')?.[0]
          if (icon) {
            icon.addAttributes?.({ src: variant === 'yellow' ? yellow : blue })
          }
        })
      },

      applyTimingVars(this: any) {
        const style = { ...(this.getStyle?.() ?? {}) }
        const pinBlue = parseSize(this.get('pinBlueSize'), 36)
        const pinYellow = parseSize(this.get('pinYellowSize'), 32)
        const pinBlueM = parseSize(this.get('pinBlueSizeMobile'), pinBlue)
        const pinYellowM = parseSize(this.get('pinYellowSizeMobile'), pinYellow)
        const duration = parseSeconds(this.get('bounceDuration'), 1.8)
        const stagger = parseSeconds(this.get('stagger'), 0.18)
        const introDelay = parseSeconds(this.get('introDelay'), 0.35)
        style['--pin-size-blue'] = `${pinBlue}px`
        style['--pin-size-yellow'] = `${pinYellow}px`
        style['--pin-size-blue-m'] = `${pinBlueM}px`
        style['--pin-size-yellow-m'] = `${pinYellowM}px`
        style['--pin-bounce-duration'] = `${duration}s`
        style['--pin-stagger'] = `${stagger}s`
        style['--pin-intro-delay'] = `${introDelay}s`
        this.setStyle(style)
      }
    }
  })

  blockManager?.add?.(WB_STATIC_PIN_MAP_TYPE, {
    label: '静态地图点位',
    category: 'Section',
    media: BLOCK_ICON,
    content: { type: WB_STATIC_PIN_MAP_TYPE }
  })
}
