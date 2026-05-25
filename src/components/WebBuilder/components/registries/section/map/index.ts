import type { Editor } from 'grapesjs'
import {
  makeColorPickerTrait,
  makeImagePickerTrait,
  makeNumberTrait,
  makeTextTrait
} from '@/components/WebBuilder/utils/traitFactory'
import { injectStyleOnce } from '@/components/WebBuilder/utils/injectStyle'

export const WB_MAP_TYPE = 'wb-map'
export const WB_MAP_PIN_TYPE = 'wb-map-pin'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M3.5 6.5 8.5 4l7 2.5 5-2.5v13l-5 2.5-7-2.5-5 2.5z" />
  <path d="M8.5 4v13" />
  <path d="M15.5 6.5v13" />
  <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" />
</svg>`

const MAP_PIN_IDLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="34" height="42" viewBox="0 0 34 42"><defs><linearGradient x1="0.5" y1="0" x2="0.5" y2="1" id="wb_map_pin_idle_shadow"><stop offset="0%" stop-color="#282738" stop-opacity="0"/><stop offset="100%" stop-color="#212043" stop-opacity="1"/></linearGradient></defs><ellipse cx="17.61" cy="37.31" rx="13.56" ry="4.94" fill="url(#wb_map_pin_idle_shadow)" fill-opacity="1" style="opacity:0.3;"/><path d="M26.0157 26.1499L17 35.7337L7.98439 26.1499C3.0052 20.8567 3.0052 12.2751 7.98439 6.98202C12.9636 1.68897 21.0364 1.68897 26.0157 6.98202C30.9948 12.2751 30.9948 20.8567 26.0157 26.1499Z" fill="#BBBBBB"/><circle cx="17" cy="16.566" r="4.25" fill="#FFFFFF"/></svg>`

const MAP_PIN_ACTIVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="63" height="73" viewBox="0 0 63 73"><defs><linearGradient x1="0.5" y1="0" x2="0.5" y2="1" id="wb_map_pin_active_shadow"><stop offset="0%" stop-color="#282738" stop-opacity="0"/><stop offset="100%" stop-color="#212043" stop-opacity="1"/></linearGradient></defs><ellipse cx="31.0934" cy="65.5128" rx="24.3996" ry="7.7372" fill="url(#wb_map_pin_active_shadow)" fill-opacity="1" style="opacity:0.3;"/><path d="M48.2035 47.3041L31.498 64.6409L14.7927 47.3041C5.56651 37.729 5.56651 22.205 14.7927 12.6301C24.0188 3.05519 38.9772 3.05519 48.2035 12.6301C57.4296 22.205 57.4296 37.729 48.2035 47.3041Z" fill="#003152"/><circle cx="31.499" cy="29.9671" r="7.875" fill="#FFFFFF"/></svg>`

const MAP_PIN_IDLE_SRC = `data:image/svg+xml,${encodeURIComponent(MAP_PIN_IDLE_SVG)}`
const MAP_PIN_ACTIVE_SRC = `data:image/svg+xml,${encodeURIComponent(MAP_PIN_ACTIVE_SVG)}`

function toCssUrl(raw: string | undefined, fallback: string) {
  const value = `${raw || ''}`.trim()
  if (!value) return fallback
  if (value.startsWith('url(')) return value
  return `url("${value}")`
}

const DEFAULT_MAP_BACKGROUND =
  'https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg'

type MapAreaContent = {
  title: string
  description: string
  image: string
}

type PinStylePreset = {
  left: string
  top: string
}

type AreaPreset = {
  pin: PinStylePreset
  mutedPins: PinStylePreset[]
}

type MapPointEntry = {
  title: string
  description: string
  image: string
  pin: PinStylePreset
  name: string
}

const DEFAULT_AREAS: MapAreaContent[] = [
  {
    title: 'North American',
    description: 'Perfect for 30-300 units projects: cUPC-certified fixtures, stable production.',
    image: 'https://placehold.co/128x128'
  },
  {
    title: 'Asia Pacific',
    description: 'Flexible logistics and contractor-friendly delivery support across key markets.',
    image: 'https://placehold.co/128x128'
  },
  {
    title: 'Europe',
    description:
      'Stable production and integrated support for medium and large engineering projects.',
    image: 'https://placehold.co/128x128'
  },
  {
    title: 'South America',
    description: 'Partnering with regional distributors to keep lead times predictable.',
    image: 'https://placehold.co/128x128'
  },
  {
    title: 'Middle East',
    description: 'Specification-ready product lines and responsive technical support.',
    image: 'https://placehold.co/128x128'
  },
  {
    title: 'Africa',
    description: 'Consistent quality assurance and project-level delivery coordination.',
    image: 'https://placehold.co/128x128'
  }
]

// Hotspot positioning:
// `pin.left/top` controls the active point location
// `mutedPins` controls the passive gray point locations
const AREA_PRESETS: AreaPreset[] = [
  {
    pin: {
      left: '20.8%',
      top: '43.8%'
    },
    mutedPins: [
      { left: '13.8%', top: '50.4%' },
      { left: '17.4%', top: '58.6%' },
      { left: '25.6%', top: '52.2%' }
    ]
  },
  {
    pin: {
      left: '81.9%',
      top: '44.6%'
    },
    mutedPins: [
      { left: '77.8%', top: '53.2%' },
      { left: '82.6%', top: '52.1%' },
      { left: '79.7%', top: '61.5%' }
    ]
  },
  {
    pin: {
      left: '56.2%',
      top: '41%'
    },
    mutedPins: [{ left: '53.8%', top: '46%' }]
  },
  {
    pin: {
      left: '30.8%',
      top: '63.5%'
    },
    mutedPins: [{ left: '28.2%', top: '68.8%' }]
  },
  {
    pin: {
      left: '64.4%',
      top: '52.4%'
    },
    mutedPins: [{ left: '61.6%', top: '57%' }]
  },
  {
    pin: {
      left: '55.2%',
      top: '63.6%'
    },
    mutedPins: [{ left: '52.8%', top: '69.2%' }]
  }
]

const MAP_CSS = `
  .wb-map {
    --wb-map-bg: #f4f5f7;
    --wb-map-base-color: #e2e4eb;
    --wb-map-title-size: 62px;
    --wb-map-summary-size: 16px;
    --wb-map-card-title-size: 20px;
    --wb-map-card-desc-size: 14px;
    --wb-map-title-color: #003152;
    --wb-map-summary-color: #768389;
    --wb-map-region-color: #ffe200;
    --wb-map-pin-size: 34px;
    --wb-map-pin-hit-width: 75px;
    --wb-map-pin-hit-height: 78px;
    --wb-map-pin-idle-width: 34px;
    --wb-map-pin-idle-height: 42px;
    --wb-map-pin-active-width: 63px;
    --wb-map-pin-active-height: 73px;
    --wb-map-card-bg: rgba(255, 255, 255, 0.92);
    --wb-map-card-title-color: #0f3e67;
    --wb-map-card-desc-color: #6f7c89;
    --wb-map-bg-opacity: 0.9;
    width: 100%;
    box-sizing: border-box;
    background: var(--wb-map-bg);
    position: relative;
    overflow: hidden;
    padding: 56px 0 72px;
  }
  .wb-map__inner {
    max-width: 1560px;
    margin: 0 auto;
    padding: 0 52px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .wb-map__intro {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 36px;
    align-items: start;
  }
  .wb-map__heading-wrap,
  .wb-map__summary-wrap {
    min-width: 0;
  }
  .wb-map__title {
    margin: 0;
    font-size: var(--wb-map-title-size);
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: var(--wb-map-title-color);
    font-weight: 700;
  }
  .wb-map__summary {
    margin: 0;
    font-size: var(--wb-map-summary-size);
    line-height: 1.6;
    color: var(--wb-map-summary-color);
    max-width: 92%;
  }
  .wb-map__stage {
    position: relative;
  }
  .wb-map__canvas {
    position: relative;
    width: 100%;
    min-height: 420px;
    aspect-ratio: 2.45 / 1;
    overflow: hidden;
    background: var(--wb-map-base-color);
  }
  .wb-map__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: var(--wb-map-bg-opacity);
    pointer-events: none;
    user-select: none;
  }
  .wb-map__regions,
  .wb-map__pins,
  .wb-map__pins-muted {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }
  .wb-map__pin:focus-visible {
    outline: 2px solid #1f4fbf;
    outline-offset: 3px;
  }
  .wb-map__pin {
    position: absolute;
    border: 0;
    background: transparent;
    padding: 0;
    transform: translate(-50%, -100%);
  }
  .wb-map__pin-visual {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    transition:
      opacity 0.34s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.34s cubic-bezier(0.22, 1, 0.36, 1);
    transform-origin: center bottom;
    will-change: opacity, transform, filter;
    pointer-events: none;
    user-select: none;
    display: block;
  }
  .wb-map__pin {
    cursor: pointer;
    pointer-events: auto;
  }
  .wb-map__pin-visual--idle {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
    filter: blur(0);
  }
  .wb-map__pin-visual--active {
    opacity: 0;
    transform: translateX(-50%) translateY(8px) scale(0.84);
    filter: blur(1px);
  }
  .wb-map__pin.is-active .wb-map__pin-visual--idle {
    opacity: 0;
    transform: translateX(-50%) translateY(6px) scale(0.8);
    filter: blur(1.5px);
  }
  .wb-map__pin.is-active .wb-map__pin-visual--active {
    opacity: 1;
    transform: translateX(-50%) translateY(-2px) scale(1);
    filter: blur(0);
  }
  .wb-map__pin:hover .wb-map__pin-visual--idle {
    transform: translateX(-50%) translateY(-2px) scale(1.05);
  }
  .wb-map__pin.is-active:hover .wb-map__pin-visual--active {
    transform: translateX(-50%) translateY(-3px) scale(1.02);
  }
  .wb-map__cards {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
  }
  .wb-map__nav {
    display: none;
  }
  .wb-map__card {
    position: absolute;
    left: 0;
    top: 0;
    display: grid;
    width: 440px;
    min-height: 150px;
    grid-template-columns: 128px minmax(0, 1fr);
    align-items: start;
    gap: 8px;
    padding: 12px;
    box-sizing: border-box;
    background: var(--wb-map-card-bg);
    border-radius: 0;
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.32s ease, transform 0.32s ease;
    pointer-events: none;
    visibility: hidden;
  }
  .wb-map__card.is-active {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
    visibility: visible;
    background: white;
  }
  .wb-map__card-media {
    width: 128px;
    height: 128px;
    overflow: hidden;
  }
  .wb-map__card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .wb-map__card-body {
    min-width: 0;
  }
  .wb-map__card-title {
    margin: 0 0 8px;
    font-size: var(--wb-map-card-title-size);
    line-height: 1.12;
    color: var(--wb-map-card-title-color);
    font-weight: 700;
  }
  .wb-map__card-description {
    margin: 0;
    font-size: var(--wb-map-card-desc-size);
    line-height: 1.45;
    color: var(--wb-map-card-desc-color);
  }
  @media (max-width: 1279px) {
    .wb-map {
      padding: 48px 0 58px;
    }
    .wb-map__inner {
      padding: 0 28px;
      gap: 34px;
    }
    .wb-map__title {
      font-size: clamp(42px, 6vw, var(--wb-map-title-size)) !important;
    }
    .wb-map__card-title {
      font-size: clamp(30px, 3.8vw, var(--wb-map-card-title-size)) !important;
    }
    .wb-map__cards {
      left: 17%;
      right: 17%;
    }
  }
  @media (max-width: 1023px) {
    .wb-map {
      padding: 40px 0 46px;
    }
    .wb-map__inner {
      padding: 0 20px;
      gap: 28px;
    }
    .wb-map__intro {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .wb-map__summary {
      max-width: 100%;
      font-size: clamp(15px, 2.6vw, var(--wb-map-summary-size)) !important;
    }
    .wb-map__canvas {
      min-height: 286px;
      aspect-ratio: 1.85 / 1;
    }
  }
  @media (max-width: 767px) {
    .wb-map {
      padding: 28px 0 34px;
    }
    .wb-map__inner {
      padding: 0 16px;
      gap: 18px;
    }
    .wb-map__title {
      font-size: 32px !important;
      line-height: 1.08 !important;
    }
    .wb-map__canvas {
      min-height: 200px;
      aspect-ratio: 1.7 / 1;
    }
    .wb-map__summary {
      font-size: 15px !important;
      line-height: 1.7 !important;
      max-width: 100%;
    }
    .wb-map__pin {
      width: 8px !important;
      height: 10px !important;
      transform: translate(-50%, -100%);
      transform-origin: center bottom;
      pointer-events: none;
    }
    .wb-map__pin-visual {
      width: 8px !important;
      height: 10px !important;
    }
    .wb-map__pin-visual--idle {
      transform: translateX(-50%) translateY(0) scale(1);
      filter: blur(0);
    }
    .wb-map__pin-visual--active {
      transform: translateX(-50%) translateY(1px) scale(0.9);
      filter: blur(0.6px);
    }
    .wb-map__pin.is-active .wb-map__pin-visual--idle {
      transform: translateX(-50%) translateY(1px) scale(0.9);
      filter: blur(0.8px);
    }
    .wb-map__pin.is-active .wb-map__pin-visual--active {
      transform: translateX(-50%) translateY(0) scale(1);
      filter: blur(0);
    }
    .wb-map__pin:hover .wb-map__pin-visual--idle,
    .wb-map__pin.is-active:hover .wb-map__pin-visual--active {
      transform: translateX(-50%) translateY(0) scale(1);
    }
    .wb-map__cards {
      position: static;
      min-height: 0;
      pointer-events: auto;
      margin-top: 14px;
    }
    .wb-map__nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 26px;
      margin-top: 10px;
    }
    .wb-map__nav-btn {
      width: 42px;
      height: 42px;
      border: none;
      background: transparent;
      color: #0f3e67;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }
    .wb-map__nav-btn svg {
      width: 24px;
      height: 24px;
      display: block;
      stroke: currentColor;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .wb-map__nav-btn:active svg {
      transform: scale(0.96);
    }
    .wb-map__card {
      position: relative;
      left: auto !important;
      top: auto !important;
      display: none;
      opacity: 1;
      transform: none;
      visibility: visible;
      pointer-events: auto;
      width: 100%;
      min-height: 0;
      grid-template-columns: 80px minmax(0, 1fr);
      align-items: start;
      gap: 12px;
      box-shadow: 0 12px 22px rgba(15, 23, 42, 0.08);
      border-radius: 0;
      padding: 12px;
    }
    .wb-map__card.is-active {
      display: grid;
    }
    .wb-map__card-media {
      width: 80px;
      height: 80px;
      max-width: none;
    }
    .wb-map__card-title {
      margin-bottom: 8px;
      font-size: 18px !important;
      line-height: 1.16 !important;
    }
    .wb-map__card-description {
      font-size: 12px !important;
      line-height: 1.5 !important;
    }
  }
`

const STYLE_VAR_DEFAULTS: Record<string, string> = {
  '--wb-map-bg': '#f4f5f7',
  '--wb-map-base-color': '#e2e4eb',
  '--wb-map-title-size': '62px',
  '--wb-map-summary-size': '16px',
  '--wb-map-card-title-size': '48px',
  '--wb-map-card-desc-size': '16px',
  '--wb-map-title-color': '#03101f',
  '--wb-map-summary-color': '#7b8793',
  '--wb-map-region-color': '#ffe200',
  '--wb-map-pin-size': '34px',
  '--wb-map-pin-hit-width': '75px',
  '--wb-map-pin-hit-height': '78px',
  '--wb-map-pin-idle-width': '34px',
  '--wb-map-pin-idle-height': '42px',
  '--wb-map-pin-active-width': '63px',
  '--wb-map-pin-active-height': '73px',
  '--wb-map-card-bg': 'rgba(255, 255, 255, 0.92)',
  '--wb-map-card-title-color': '#0f3e67',
  '--wb-map-card-desc-color': '#6f7c89',
  '--wb-map-bg-opacity': '0.9'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function toPx(value: unknown, fallback: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return `${numeric}px`
}

function withClass(baseClass: string, activeClass: string, active: boolean): string {
  return active ? `${baseClass} ${activeClass}` : baseClass
}

function getAreaPreset(index: number): AreaPreset {
  if (AREA_PRESETS[index]) return AREA_PRESETS[index]
  return AREA_PRESETS[index % AREA_PRESETS.length]
}

function getAreaContent(index: number): MapAreaContent {
  if (DEFAULT_AREAS[index]) return DEFAULT_AREAS[index]
  const fallback = DEFAULT_AREAS[index % DEFAULT_AREAS.length]
  return {
    title: `${fallback.title} ${index + 1}`,
    description: fallback.description,
    image: fallback.image
  }
}

function buildPointEntries(groupCount: number): MapPointEntry[] {
  const entries: MapPointEntry[] = []

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
    const area = getAreaContent(groupIndex)
    const preset = getAreaPreset(groupIndex)
    const points = [preset.pin, ...preset.mutedPins]

    points.forEach((pin, pointIndex) => {
      entries.push({
        ...area,
        pin,
        name: `${area.title} Pin ${pointIndex + 1}`
      })
    })
  }

  return entries
}

function getPinMetrics(pinSize: number) {
  const safePinSize = Number.isFinite(pinSize) && pinSize > 0 ? pinSize : 34
  return {
    hitWidth: Math.round(safePinSize * 2.2),
    hitHeight: Math.round(safePinSize * 2.3),
    idleWidth: safePinSize,
    idleHeight: Math.round(safePinSize * 1.2353),
    activeWidth: Math.round(safePinSize * 1.8529),
    activeHeight: Math.round(safePinSize * 2.1471)
  }
}

function buildPrimaryPinDef(
  index: number,
  preset: PinStylePreset,
  isActive: boolean,
  areaTitle: string,
  name?: string
) {
  const metrics = getPinMetrics(34)
  return {
    type: WB_MAP_PIN_TYPE,
    tagName: 'button',
    name: name || `Pin ${index + 1}`,
    selectable: true,
    stylable: true,
    droppable: false,
    draggable: '.wb-map__pins',
    attributes: {
      class: withClass('wb-map__pin', 'is-active', isActive),
      type: 'button',
      title: areaTitle,
      'aria-label': areaTitle,
      'data-map-index': `${index}`,
      'data-map-role': 'pin'
    },
    style: {
      left: preset.left,
      top: preset.top,
      width: `${metrics.hitWidth}px`,
      height: `${metrics.hitHeight}px`
    },
    components: [
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
          class: 'wb-map__pin-visual wb-map__pin-visual--idle',
          src: MAP_PIN_IDLE_SRC,
          alt: ''
        },
        style: {
          width: `${metrics.idleWidth}px`,
          height: `${metrics.idleHeight}px`
        }
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
          class: 'wb-map__pin-visual wb-map__pin-visual--active',
          src: MAP_PIN_ACTIVE_SRC,
          alt: ''
        },
        style: {
          width: `${metrics.activeWidth}px`,
          height: `${metrics.activeHeight}px`
        }
      }
    ]
  }
}

function buildMutedPinDef(index: number, preset: PinStylePreset, areaTitle: string) {
  return buildPrimaryPinDef(index, preset, false, areaTitle)
}

function buildCardDef(index: number, area: MapAreaContent, isActive: boolean) {
  return {
    tagName: 'article',
    name: `Card ${index + 1}`,
    selectable: true,
    stylable: true,
    droppable: false,
    draggable: '.wb-map__cards',
    attributes: {
      class: withClass('wb-map__card', 'is-active', isActive),
      'data-map-index': `${index}`
    },
    components: [
      {
        tagName: 'div',
        name: 'Card Media',
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-map__card-media' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            droppable: false,
            attributes: {
              class: 'wb-map__card-image',
              src: area.image,
              alt: ''
            }
          }
        ]
      },
      {
        tagName: 'div',
        name: 'Card Body',
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-map__card-body' },
        components: [
          {
            tagName: 'h3',
            type: 'text',
            selectable: true,
            stylable: true,
            editable: true,
            droppable: true,
            attributes: { class: 'wb-map__card-title' },
            components: area.title
          },
          {
            tagName: 'p',
            type: 'text',
            selectable: true,
            stylable: true,
            editable: true,
            droppable: true,
            attributes: { class: 'wb-map__card-description' },
            components: area.description
          }
        ]
      }
    ]
  }
}

function buildNavButtonDef(direction: 'prev' | 'next') {
  const isPrev = direction === 'prev'
  return {
    tagName: 'button',
    name: isPrev ? 'Prev Button' : 'Next Button',
    selectable: true,
    stylable: true,
    droppable: false,
    draggable: '.wb-map__nav',
    attributes: {
      class: `wb-map__nav-btn wb-map__nav-btn--${direction}`,
      type: 'button',
      'data-map-nav': direction,
      'aria-label': isPrev ? 'Previous card' : 'Next card'
    },
    components: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${isPrev ? 'M15 4 7 12 15 20' : 'M9 4 17 12 9 20'}"/></svg>`
  }
}

function buildIntroDef() {
  return {
    tagName: 'div',
    name: 'Intro',
    selectable: true,
    stylable: true,
    droppable: false,
    attributes: { class: 'wb-map__intro' },
    components: [
      {
        tagName: 'div',
        name: 'Title Wrap',
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-map__heading-wrap' },
        components: [
          {
            tagName: 'h2',
            type: 'text',
            selectable: true,
            stylable: true,
            editable: true,
            droppable: true,
            attributes: { class: 'wb-map__title' },
            components: 'Why Choose Us'
          }
        ]
      },
      {
        tagName: 'div',
        name: 'Summary Wrap',
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-map__summary-wrap' },
        components: [
          {
            tagName: 'p',
            type: 'text',
            selectable: true,
            stylable: true,
            editable: true,
            droppable: true,
            attributes: { class: 'wb-map__summary' },
            components:
              'Perfect for 30-300 units projects: cUPC-certified fixtures, stable production, flexible logistics, and contractor-friendly service.'
          }
        ]
      }
    ]
  }
}

function buildStageDef(areaCount: number) {
  const points = buildPointEntries(areaCount)
  const pins = points.map((point, index) =>
    buildPrimaryPinDef(index, point.pin, index === 0, point.title, point.name)
  )

  const cards = points.map((point, index) =>
    buildCardDef(
      index,
      {
        title: point.title,
        description: point.description,
        image: point.image
      },
      index === 0
    )
  )

  return {
    tagName: 'div',
    name: 'Stage',
    selectable: true,
    stylable: true,
    droppable: false,
    attributes: { class: 'wb-map__stage' },
    components: [
      {
        tagName: 'div',
        name: 'Canvas',
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-map__canvas' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            stylable: false,
            droppable: false,
            attributes: {
              class: 'wb-map__bg',
              src: DEFAULT_MAP_BACKGROUND,
              alt: 'World map'
            }
          },
          {
            tagName: 'div',
            name: 'Pins Layer',
            selectable: true,
            stylable: true,
            droppable: '[data-map-role="pin"]',
            attributes: { class: 'wb-map__pins' },
            components: pins
          }
        ]
      },
      {
        tagName: 'div',
        name: 'Cards Layer',
        selectable: true,
        stylable: true,
        droppable: '.wb-map__card',
        attributes: { class: 'wb-map__cards' },
        components: cards
      },
      {
        tagName: 'div',
        name: 'Mobile Nav',
        selectable: true,
        stylable: true,
        droppable: '.wb-map__nav-btn',
        attributes: { class: 'wb-map__nav' },
        components: [buildNavButtonDef('prev'), buildNavButtonDef('next')]
      }
    ]
  }
}

function buildMapTree(areaCount: number) {
  return [
    {
      tagName: 'div',
      name: 'Map Inner',
      selectable: true,
      stylable: true,
      droppable: false,
      attributes: { class: 'wb-map__inner' },
      components: [buildIntroDef(), buildStageDef(areaCount)]
    }
  ]
}

function setClassState(model: any, className: string, active: boolean) {
  const attrs = { ...(model?.getAttributes?.() ?? {}) }
  const rawClass = `${attrs.class ?? ''}`.trim()
  const tokens = rawClass ? rawClass.split(/\s+/g).filter(Boolean) : []
  const hasClass = tokens.includes(className)

  if (active && !hasClass) tokens.push(className)
  if (!active && hasClass) {
    const nextTokens = tokens.filter((token) => token !== className)
    attrs.class = nextTokens.join(' ')
    model.addAttributes?.(attrs)
    return
  }

  attrs.class = tokens.join(' ')
  model.addAttributes?.(attrs)
}

function ensureDataIndex(model: any, index: number) {
  const attrs = { ...(model?.getAttributes?.() ?? {}) }
  attrs['data-map-index'] = `${index}`
  model.addAttributes?.(attrs)
}

const mapScript = function () {
  const root = this as HTMLElement & {
    _wbMapCleanup?: () => void
  }

  if (root._wbMapCleanup) root._wbMapCleanup()

  let handlers: Array<{ el: HTMLElement; fn: () => void }> = []
  let bindQueued = false

  const getPins = () =>
    Array.from(root.querySelectorAll('.wb-map__pin[data-map-index]')) as HTMLElement[]
  const getCards = () =>
    Array.from(root.querySelectorAll('.wb-map__card[data-map-index]')) as HTMLElement[]
  const getNavButtons = () =>
    Array.from(root.querySelectorAll('.wb-map__nav-btn[data-map-nav]')) as HTMLElement[]
  const isMobileMode = () => window.matchMedia?.('(max-width: 767px)')?.matches === true
  const CARD_GAP = 10
  const CARD_SAFE_MARGIN = 21
  const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const renderActive = (nextRawIndex: number) => {
    const pins = getPins()
    const cards = getCards()

    const maxIndex = Math.min(pins.length, cards.length) - 1
    if (maxIndex < 0) return
    const nextIndex = Math.max(0, Math.min(nextRawIndex, maxIndex))

    pins.forEach((item, index) => item.classList.toggle('is-active', index === nextIndex))
    cards.forEach((item, index) => item.classList.toggle('is-active', index === nextIndex))
    positionActiveCard(nextIndex)
  }

  const positionActiveCard = (activeIndex: number) => {
    if (isMobileMode()) return

    const pins = getPins()
    const cards = getCards()
    const activePin = pins[activeIndex]
    const activeCard = cards[activeIndex]
    const canvas = root.querySelector('.wb-map__canvas') as HTMLElement | null
    if (!activePin || !activeCard || !canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    const pinVisual =
      (activePin.querySelector('.wb-map__pin-visual--active') as HTMLElement | null) ||
      (activePin.querySelector('.wb-map__pin-visual--idle') as HTMLElement | null)
    const pinRect = (pinVisual || activePin).getBoundingClientRect()
    const cardStyle = window.getComputedStyle(activeCard)
    const styledWidth = Number.parseFloat(cardStyle.width || '')
    const styledMinHeight = Number.parseFloat(cardStyle.minHeight || '')
    const cardWidth = Math.round(styledWidth || activeCard.offsetWidth || 440)
    const cardHeight = Math.round(styledMinHeight || activeCard.offsetHeight || 150)
    const margin = CARD_SAFE_MARGIN
    const gap = CARD_GAP

    const pinLeft = pinRect.left - canvasRect.left
    const pinRight = pinRect.right - canvasRect.left
    const pinTop = pinRect.top - canvasRect.top
    const pinCenterX = pinLeft + pinRect.width / 2

    const preferRight = pinCenterX <= canvasRect.width * 0.52
    const rightSideLeft = pinRight + gap
    const leftSideLeft = pinLeft - cardWidth - gap
    let left = preferRight ? rightSideLeft : leftSideLeft

    if (left + cardWidth > canvasRect.width - margin) left = leftSideLeft
    if (left < margin) left = rightSideLeft
    left = clampValue(left, margin, canvasRect.width - cardWidth - margin)

    const top = clampValue(pinTop, margin, canvasRect.height - cardHeight - margin)

    activeCard.style.left = `${left}px`
    activeCard.style.top = `${top}px`
    activeCard.style.transformOrigin = preferRight ? 'left top' : 'right top'
  }

  const setActive = (nextRawIndex: number) => {
    const currentIndex = Number(root.getAttribute('data-active-index'))
    const nextIndex = Number.isFinite(nextRawIndex) ? nextRawIndex : 0

    if (currentIndex !== nextIndex) {
      root.setAttribute('data-active-index', String(nextIndex))
    }

    renderActive(nextIndex)
  }

  const bind = () => {
    bindQueued = false
    handlers.forEach((record) => {
      record.el.removeEventListener('click', record.fn)
      record.el.removeEventListener('mouseenter', record.fn)
    })
    handlers = []

    const pins = getPins()
    const cards = getCards()
    const maxIndex = Math.min(pins.length, cards.length) - 1
    if (maxIndex < 0) return

    const attrIndex = Number(root.getAttribute('data-active-index'))
    renderActive(Number.isFinite(attrIndex) ? attrIndex : 0)

    if (!isMobileMode()) {
      getPins().forEach((element) => {
        const index = Number(element.dataset.mapIndex)
        if (!Number.isFinite(index)) return

        const clickListener = (event: Event) => {
          event.preventDefault?.()
          event.stopPropagation?.()
          setActive(index)
        }
        element.addEventListener('click', clickListener)
        handlers.push({ el: element, fn: clickListener })

        const hoverListener = () => setActive(index)
        element.addEventListener('mouseenter', hoverListener)
        handlers.push({ el: element, fn: hoverListener })
      })
    }

    getNavButtons().forEach((element) => {
      const direction = `${element.dataset.mapNav || ''}`.trim()
      if (!direction) return

      const navListener = () => {
        const currentIndex = Number(root.getAttribute('data-active-index'))
        const safeCurrent = Number.isFinite(currentIndex) ? currentIndex : 0
        const nextIndex =
          direction === 'prev'
            ? (safeCurrent - 1 + maxIndex + 1) % (maxIndex + 1)
            : (safeCurrent + 1) % (maxIndex + 1)
        setActive(nextIndex)
      }

      element.addEventListener('click', navListener)
      handlers.push({ el: element, fn: navListener })
    })
  }

  const scheduleBind = () => {
    if (bindQueued) return
    bindQueued = true
    Promise.resolve().then(() => bind())
  }

  const observer = new MutationObserver((records) => {
    let shouldRebind = false
    let shouldRender = false

    records.forEach((record) => {
      if (record.type === 'attributes') {
        shouldRender = true
        return
      }
      shouldRebind = true
    })

    if (shouldRebind) {
      scheduleBind()
      return
    }

    if (shouldRender) {
      const attrIndex = Number(root.getAttribute('data-active-index'))
      renderActive(Number.isFinite(attrIndex) ? attrIndex : 0)
    }
  })

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-active-index']
  })

  root._wbMapCleanup = () => {
    handlers.forEach((record) => {
      record.el.removeEventListener('click', record.fn)
      record.el.removeEventListener('mouseenter', record.fn)
    })
    handlers = []
    observer.disconnect()
    window.removeEventListener('resize', scheduleBind)
  }

  window.addEventListener('resize', scheduleBind)
  bind()
}

export function registerMapComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_MAP_TYPE)) return

  injectStyleOnce(editor, 'wb-map', MAP_CSS)

  if (!domComponents.getType(WB_MAP_PIN_TYPE)) {
    domComponents.addType(WB_MAP_PIN_TYPE, {
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

  domComponents.addType(WB_MAP_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'map' ? { type: WB_MAP_TYPE } : false,

    model: {
      defaults: {
        name: 'Map',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: MAP_CSS,
        attributes: {
          'data-wb-component': 'map',
          class: 'wb-map',
          'data-active-index': '0'
        },
        regionCount: 2,
        activeIndex: 1,
        mapBackground: DEFAULT_MAP_BACKGROUND,
        mapBackgroundUrl: '',
        dotIdleImage: MAP_PIN_IDLE_SRC,
        dotActiveImage: MAP_PIN_ACTIVE_SRC,
        titleSize: 62,
        summarySize: 16,
        cardTitleSize: 48,
        cardDescSize: 16,
        pinSize: 34,
        mapOpacity: 90,
        sectionBgColor: '#f4f5f7',
        baseMapColor: '#E2E4EB',
        titleColor: '#03101f',
        summaryColor: '#7b8793',
        regionColor: '#FFE200',
        cardBgColor: 'rgba(255, 255, 255, 0.92)',
        cardTitleColor: '#0f3e67',
        cardDescColor: '#6f7c89',
        traits: [
          makeNumberTrait('区域数量', 'regionCount', { min: 1, max: 6, step: 1 }),
          makeNumberTrait('默认激活', 'activeIndex', { min: 1, max: 6, step: 1 }),
          makeImagePickerTrait('地图 SVG/底图', 'mapBackground'),
          makeTextTrait('地图 SVG URL', 'mapBackgroundUrl', {
            placeholder: 'https://example.com/world-map.svg'
          }),
          makeImagePickerTrait('DOT 未激活图片', 'dotIdleImage'),
          makeImagePickerTrait('DOT 激活图片', 'dotActiveImage'),
          makeNumberTrait('DOT 大小', 'pinSize', { min: 24, max: 48, step: 1 }),
          makeNumberTrait('地图透明度', 'mapOpacity', { min: 40, max: 100, step: 1 }),
          makeColorPickerTrait('区块背景', 'sectionBgColor'),
          makeColorPickerTrait('底图基色', 'baseMapColor'),
          makeColorPickerTrait('卡片背景', 'cardBgColor')
        ],
        components: buildMapTree(2),
        script: mapScript,
        'script-export': mapScript
      },

      init(this: any) {
        this.normalizeLegacyPointStructure()
        this.applyRegionCount()
        this.applyPinSizing()
        this.applyPinImages()
        this.applyMapBackground()
        this.applyStyleVars()
        this.applyActiveIndex()

        this.on('change:regionCount', this.applyRegionCount)
        this.on('change:activeIndex', this.applyActiveIndex)
        this.on('change:mapBackground change:mapBackgroundUrl', this.applyMapBackground)
        this.on('change:dotIdleImage change:dotActiveImage', this.applyPinImages)
        this.on(
          'change:pinSize change:mapOpacity change:dotIdleImage change:dotActiveImage',
          this.applyStyleVars
        )
        this.on('change:sectionBgColor change:baseMapColor change:cardBgColor', this.applyStyleVars)
      },

      _getInner(this: any) {
        return this.components?.().at?.(0) ?? null
      },

      _getStage(this: any) {
        return this._getInner?.()?.components?.().at?.(1) ?? null
      },

      _getCanvas(this: any) {
        return this._getStage?.()?.components?.().at?.(0) ?? null
      },

      _getMapImage(this: any) {
        return this._getCanvas?.()?.components?.().at?.(0) ?? null
      },

      _getPinsLayer(this: any) {
        return this._getCanvas?.()?.components?.().at?.(1) ?? null
      },

      applyPinSizing(this: any) {
        const pins = this._getPinsLayer?.()?.components?.()
        if (!pins) return

        const metrics = getPinMetrics(Number(this.get('pinSize')) || 34)
        for (let index = 0; index < (pins.length || 0); index++) {
          const pin = pins.at(index)
          pin?.setStyle?.({
            ...(pin?.getStyle?.() ?? {}),
            width: `${metrics.hitWidth}px`,
            height: `${metrics.hitHeight}px`
          })

          const children = pin?.components?.()
          const idleImage = children?.at?.(0)
          const activeImage = children?.at?.(1)
          idleImage?.setStyle?.({
            ...(idleImage?.getStyle?.() ?? {}),
            width: `${metrics.idleWidth}px`,
            height: `${metrics.idleHeight}px`
          })
          activeImage?.setStyle?.({
            ...(activeImage?.getStyle?.() ?? {}),
            width: `${metrics.activeWidth}px`,
            height: `${metrics.activeHeight}px`
          })
        }
      },

      applyPinImages(this: any) {
        const pins = this._getPinsLayer?.()?.components?.()
        if (!pins) return

        const idleSrc = `${this.get('dotIdleImage') || MAP_PIN_IDLE_SRC}`.trim() || MAP_PIN_IDLE_SRC
        const activeSrc =
          `${this.get('dotActiveImage') || MAP_PIN_ACTIVE_SRC}`.trim() || MAP_PIN_ACTIVE_SRC

        for (let index = 0; index < (pins.length || 0); index++) {
          const pin = pins.at(index)
          const children = pin?.components?.()
          const idleImage = children?.at?.(0)
          const activeImage = children?.at?.(1)
          idleImage?.addAttributes?.({ src: idleSrc })
          activeImage?.addAttributes?.({ src: activeSrc })
        }
      },

      _getCardsLayer(this: any) {
        return this._getStage?.()?.components?.().at?.(1) ?? null
      },

      _getNavLayer(this: any) {
        return this._getStage?.()?.components?.().at?.(2) ?? null
      },

      normalizeLegacyPointStructure(this: any) {
        const canvas = this._getCanvas?.()
        const canvasChildren = canvas?.components?.()
        const pinsLayer = this._getPinsLayer?.()
        const cardsLayer = this._getCardsLayer?.()
        const legacyLayer = canvasChildren?.at?.(2)
        const legacyClass = `${legacyLayer?.getAttributes?.()?.class ?? ''}`
        if (
          !canvasChildren ||
          !pinsLayer ||
          !cardsLayer ||
          !legacyClass.includes('wb-map__pins-muted')
        ) {
          return
        }

        const pins = pinsLayer.components?.()
        const cards = cardsLayer.components?.()
        const legacyPins = legacyLayer.components?.()
        if (!pins || !cards || !legacyPins) return

        const primaryPins = Array.from({ length: pins.length || 0 }, (_, index) =>
          pins.at(index)
        ).filter(Boolean)
        const mutedPins = Array.from({ length: legacyPins.length || 0 }, (_, index) =>
          legacyPins.at(index)
        ).filter(Boolean)
        const baseCards = Array.from({ length: cards.length || 0 }, (_, index) =>
          cards.at(index)
        ).filter(Boolean)
        if (!primaryPins.length || !baseCards.length) {
          canvasChildren.remove(legacyLayer)
          return
        }

        const groupCount = Math.max(baseCards.length, primaryPins.length)
        const mutedChunkSize = Math.ceil(mutedPins.length / groupCount)
        const nextPins: any[] = []
        const nextCards: any[] = []
        let nextActiveIndex = 0
        let pointIndex = 0

        for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
          const baseCard = baseCards[groupIndex] ?? baseCards[baseCards.length - 1]
          const basePrimary = primaryPins[groupIndex]
          const groupMutedPins = mutedPins.slice(
            groupIndex * mutedChunkSize,
            (groupIndex + 1) * mutedChunkSize
          )

          if (basePrimary && baseCard) {
            const primaryClone = basePrimary.clone?.() ?? basePrimary
            primaryClone.set?.(
              'name',
              `${primaryClone.get?.('title') || baseCard.getName?.() || 'Pin'} ${pointIndex + 1}`
            )
            primaryClone.addAttributes?.({
              ...(primaryClone.getAttributes?.() ?? {}),
              class: withClass('wb-map__pin', 'is-active', pointIndex === 0),
              'data-map-index': `${pointIndex}`,
              'data-map-role': 'pin'
            })
            nextPins.push(primaryClone)

            const cardClone = baseCard.clone?.() ?? baseCard
            cardClone.set?.('name', `Card ${pointIndex + 1}`)
            cardClone.addAttributes?.({
              ...(cardClone.getAttributes?.() ?? {}),
              class: withClass('wb-map__card', 'is-active', pointIndex === 0),
              'data-map-index': `${pointIndex}`
            })
            nextCards.push(cardClone)
            if (`${basePrimary.getAttributes?.()?.class ?? ''}`.includes('is-active')) {
              nextActiveIndex = pointIndex
            }
            pointIndex++
          }

          groupMutedPins.forEach((legacyPinModel: any) => {
            const pinClone = legacyPinModel.clone?.() ?? legacyPinModel
            pinClone.set?.('name', `Pin ${pointIndex + 1}`)
            pinClone.addAttributes?.({
              ...(pinClone.getAttributes?.() ?? {}),
              class: 'wb-map__pin',
              'data-map-index': `${pointIndex}`,
              'data-map-role': 'pin'
            })
            nextPins.push(pinClone)

            const duplicatedCard = baseCard?.clone?.() ?? baseCard
            duplicatedCard?.set?.('name', `Card ${pointIndex + 1}`)
            duplicatedCard?.addAttributes?.({
              ...(duplicatedCard?.getAttributes?.() ?? {}),
              class: 'wb-map__card',
              'data-map-index': `${pointIndex}`
            })
            nextCards.push(duplicatedCard)
            pointIndex++
          })
        }

        for (let index = (pins.length || 0) - 1; index >= 0; index--) {
          pins.remove(pins.at(index))
        }
        for (let index = (cards.length || 0) - 1; index >= 0; index--) {
          cards.remove(cards.at(index))
        }

        nextPins.forEach((model) => pins.add(model))
        nextCards.forEach((model) => cards.add(model))
        canvasChildren.remove(legacyLayer)

        this.set('activeIndex', nextActiveIndex + 1)
      },

      _reindexAndActivate(this: any, activeZeroIndex: number) {
        const pins = this._getPinsLayer?.()?.components?.()
        const cards = this._getCardsLayer?.()?.components?.()
        if (!pins || !cards) return

        const total = Math.min(pins.length || 0, cards.length || 0)
        for (let index = 0; index < total; index++) {
          const pin = pins.at(index)
          const card = cards.at(index)
          ensureDataIndex(pin, index)
          ensureDataIndex(card, index)
          setClassState(pin, 'is-active', index === activeZeroIndex)
          setClassState(card, 'is-active', index === activeZeroIndex)
        }
      },

      applyRegionCount(this: any) {
        const pinsLayer = this._getPinsLayer?.()
        const cardsLayer = this._getCardsLayer?.()
        if (!pinsLayer || !cardsLayer) return

        const pins = pinsLayer.components?.()
        const cards = cardsLayer.components?.()
        if (!pins || !cards) return

        const groupCount = clamp(Number(this.get('regionCount')) || 2, 1, 6)
        const desiredPoints = buildPointEntries(groupCount)
        const target = desiredPoints.length
        const current = Math.min(pins.length || 0, cards.length || 0)

        if (current < target) {
          for (let index = current; index < target; index++) {
            const point = desiredPoints[index]
            pins.add(buildPrimaryPinDef(index, point.pin, false, point.title, point.name))
            cards.add(
              buildCardDef(
                index,
                {
                  title: point.title,
                  description: point.description,
                  image: point.image
                },
                false
              )
            )
          }
        } else if (current > target) {
          for (let index = current - 1; index >= target; index--) {
            pins.remove(pins.at(index))
            cards.remove(cards.at(index))
          }
        }

        if (this.get('regionCount') !== groupCount) {
          this.set('regionCount', groupCount)
        }
        this.applyPinSizing()
        this.applyPinImages()
        this.applyActiveIndex()
      },

      applyActiveIndex(this: any) {
        const cards = this._getCardsLayer?.()?.components?.()
        const total = cards?.length || 1
        const rawActiveIndex = Number(this.get('activeIndex')) || 1
        const nextActiveIndex = clamp(rawActiveIndex, 1, Math.max(1, total))

        this.addAttributes({ 'data-active-index': String(nextActiveIndex - 1) })
        this._reindexAndActivate?.(nextActiveIndex - 1)

        if (rawActiveIndex !== nextActiveIndex) {
          this.set('activeIndex', nextActiveIndex)
        }
      },

      applyMapBackground(this: any) {
        const mapImage = this._getMapImage?.()
        if (!mapImage) return
        const mapBackgroundUrl = `${this.get('mapBackgroundUrl') || ''}`.trim()
        const mapBackground = `${this.get('mapBackground') || ''}`.trim()
        const nextSrc =
          mapBackgroundUrl &&
          mapBackgroundUrl !== DEFAULT_MAP_BACKGROUND &&
          mapBackgroundUrl !== mapBackground
            ? mapBackgroundUrl
            : mapBackground || DEFAULT_MAP_BACKGROUND
        mapImage.addAttributes?.({
          src: nextSrc || DEFAULT_MAP_BACKGROUND
        })
      },

      applyStyleVars(this: any) {
        const style = { ...(this.getStyle?.() ?? {}) } as Record<string, string>

        style['--wb-map-pin-size'] = toPx(
          this.get('pinSize'),
          STYLE_VAR_DEFAULTS['--wb-map-pin-size']
        )
        const pinSize = Number(this.get('pinSize')) || 34
        style['--wb-map-pin-hit-width'] = `${Math.round(pinSize * 2.2)}px`
        style['--wb-map-pin-hit-height'] = `${Math.round(pinSize * 2.3)}px`
        style['--wb-map-pin-idle-width'] = `${pinSize}px`
        style['--wb-map-pin-idle-height'] = `${Math.round(pinSize * 1.2353)}px`
        style['--wb-map-pin-active-width'] = `${Math.round(pinSize * 1.8529)}px`
        style['--wb-map-pin-active-height'] = `${Math.round(pinSize * 2.1471)}px`
        style['--wb-map-pin-idle-bg'] = toCssUrl(
          this.get('dotIdleImage'),
          STYLE_VAR_DEFAULTS['--wb-map-pin-idle-bg']
        )
        style['--wb-map-pin-active-bg'] = toCssUrl(
          this.get('dotActiveImage'),
          STYLE_VAR_DEFAULTS['--wb-map-pin-active-bg']
        )

        const opacity = clamp(Number(this.get('mapOpacity')) || 90, 40, 100)
        style['--wb-map-bg-opacity'] = `${opacity / 100}`

        style['--wb-map-bg'] = this.get('sectionBgColor') || STYLE_VAR_DEFAULTS['--wb-map-bg']
        style['--wb-map-base-color'] =
          this.get('baseMapColor') || STYLE_VAR_DEFAULTS['--wb-map-base-color']
        style['--wb-map-card-bg'] =
          this.get('cardBgColor') || STYLE_VAR_DEFAULTS['--wb-map-card-bg']

        this.setStyle(style)
      }
    }
  })

  blockManager?.add?.(WB_MAP_TYPE, {
    label: 'Map',
    category: 'Section',
    content: { type: WB_MAP_TYPE },
    media: BLOCK_ICON
  })
}
