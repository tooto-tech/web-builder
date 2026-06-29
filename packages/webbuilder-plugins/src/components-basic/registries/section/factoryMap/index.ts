import type { Editor } from 'grapesjs'
import {
  makeColorPickerTrait,
  makeImagePickerTrait,
  makeNumberTrait,
  makeTextTrait,
} from '../../../traitFactory.js'
import { injectStyleOnce } from '../../../injectStyle.js'

export const WB_FACTORY_MAP_TYPE = 'wb-factory-map'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M3.5 6.5 8.5 4l7 2.5 5-2.5v13l-5 2.5-7-2.5-5 2.5z" />
  <path d="M8.5 4v13" />
  <path d="M15.5 6.5v13" />
  <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" />
</svg>`

const FACTORY_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="63" height="73" viewBox="0 0 63 73"><defs><linearGradient x1="0.5" y1="0" x2="0.5" y2="1" id="wb_factory_pin_shadow"><stop offset="0%" stop-color="#282738" stop-opacity="0"/><stop offset="100%" stop-color="#212043" stop-opacity="1"/></linearGradient></defs><ellipse cx="31.0934" cy="65.5128" rx="24.3996" ry="7.7372" fill="url(#wb_factory_pin_shadow)" fill-opacity="1" style="opacity:0.24;"/><path d="M48.2035 47.3041L31.498 64.6409L14.7927 47.3041C5.56651 37.729 5.56651 22.205 14.7927 12.6301C24.0188 3.05519 38.9772 3.05519 48.2035 12.6301C57.4296 22.205 57.4296 37.729 48.2035 47.3041Z" fill="#003152"/><circle cx="31.499" cy="29.9671" r="7.875" fill="#FFFFFF"/></svg>`
const FACTORY_PIN_SRC = `data:image/svg+xml,${encodeURIComponent(FACTORY_PIN_SVG)}`

const FACTORY_MAP_BG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 760" fill="none">
  <defs>
    <filter id="wb_factory_glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <g opacity="0.92" fill="#D8DFE9">
    <path d="M161 173C221 121 317 103 404 123C468 138 533 176 565 221C550 259 531 286 499 307C464 329 419 334 371 324C327 314 283 294 245 267C211 244 183 216 161 173Z"/>
    <path d="M369 365C401 355 438 365 466 392C488 413 496 444 490 478C483 515 463 548 435 580C411 608 381 627 349 633C330 615 325 588 329 557C334 523 348 492 353 462C358 430 350 395 369 365Z"/>
    <path d="M662 198C702 176 749 173 785 188C817 201 838 224 847 253C851 272 846 291 834 307C816 331 790 347 757 353C728 359 699 355 678 340C650 320 639 287 645 252C648 231 653 213 662 198Z"/>
    <path d="M712 365C738 343 775 334 812 339C844 343 872 357 890 380C908 403 913 431 907 463C898 511 873 559 839 602C805 645 767 673 726 685C693 663 676 625 678 578C679 535 696 493 705 451C711 419 704 391 712 365Z"/>
    <path d="M870 160C916 125 982 109 1058 116C1125 123 1186 146 1234 180C1271 205 1309 235 1341 271C1358 293 1367 315 1368 338C1343 360 1305 375 1269 383C1230 392 1190 394 1152 402C1124 408 1097 421 1077 439C1058 456 1045 480 1029 504C1008 535 975 553 939 551C898 549 863 518 851 476C838 433 851 393 870 355C889 317 911 283 913 249C915 219 899 194 870 160Z"/>
    <path d="M1271 523C1294 508 1328 503 1360 509C1398 516 1435 535 1461 563C1480 584 1487 608 1482 628C1448 640 1407 646 1368 641C1327 636 1287 621 1260 595C1243 579 1239 548 1271 523Z"/>
    <path d="M1194 402C1217 392 1245 394 1268 406C1289 417 1301 436 1299 458C1285 473 1266 483 1245 485C1221 488 1199 478 1186 458C1174 440 1174 414 1194 402Z"/>
  </g>
  <g opacity="0.38" filter="url(#wb_factory_glow)" fill="#FFD653">
    <path d="M256 211C291 189 339 184 384 193C420 200 447 221 451 242C455 264 432 284 394 292C349 302 301 297 266 279C241 266 232 245 256 211Z"/>
    <path d="M999 225C1051 202 1123 203 1178 226C1215 242 1232 269 1228 294C1225 318 1199 335 1162 344C1113 355 1052 353 1012 334C978 318 966 277 999 225Z"/>
    <path d="M1030 339C1050 326 1077 326 1098 339C1115 350 1123 370 1120 391C1117 414 1103 434 1085 446C1067 458 1046 458 1034 441C1020 422 1016 394 1017 371C1017 358 1021 347 1030 339Z"/>
  </g>
  <g fill="#FFD653">
    <path d="M268 220C297 199 339 192 379 198C409 203 430 219 434 238C438 257 420 273 391 281C353 292 309 289 279 275C256 264 247 242 268 220Z"/>
    <path d="M1019 236C1064 216 1123 216 1167 234C1197 246 1211 265 1209 284C1208 302 1191 316 1166 324C1125 338 1070 338 1034 324C1005 312 996 272 1019 236Z"/>
    <path d="M1037 345C1054 336 1075 336 1092 347C1105 356 1111 372 1108 388C1105 405 1095 420 1082 429C1068 438 1051 438 1042 426C1031 412 1028 393 1028 376C1028 363 1031 352 1037 345Z"/>
  </g>
</svg>`
const DEFAULT_FACTORY_MAP_BACKGROUND = `data:image/svg+xml,${encodeURIComponent(FACTORY_MAP_BG_SVG)}`

type FactoryPreset = {
  country: string
  title: string
  description: string
  pin: { left: string; top: string }
  elbow: { left: string; top: string }
  label: { left: string; top: string }
  align: 'left' | 'right'
  delay: number
  highlight?: { left: string; top: string; width: string; height: string; rotate?: number }
}

const FACTORY_PRESETS: FactoryPreset[] = [
  {
    country: 'USA',
    title: 'USA Production Center',
    description: '',
    pin: { left: '25.5%', top: '53%' },
    elbow: { left: '9.5%', top: '53%' },
    label: { left: '9.5%', top: '81.5%' },
    align: 'right',
    delay: 0,
    highlight: { left: '26%', top: '53%', width: '13%', height: '9%', rotate: -4 },
  },
  {
    country: 'China',
    title: 'China Production Center',
    description: '',
    pin: { left: '70%', top: '45%' },
    elbow: { left: '80.5%', top: '45%' },
    label: { left: '84%', top: '45%' },
    align: 'left',
    delay: 120,
    highlight: { left: '71%', top: '48%', width: '14%', height: '10%', rotate: 6 },
  },
  {
    country: 'Thailand',
    title: 'Thailand Production Center',
    description: '',
    pin: { left: '66%', top: '61%' },
    elbow: { left: '66%', top: '79%' },
    label: { left: '58%', top: '79%' },
    align: 'right',
    delay: 240,
    highlight: { left: '66%', top: '63%', width: '5%', height: '7%', rotate: -8 },
  },
]

const FACTORY_MAP_CSS = `
  .wb-factory-map {
    --wb-factory-map-title-color: #071624;
    --wb-factory-map-summary-color: #6b7885;
    --wb-factory-map-leader-color: #9eaebe;
    --wb-factory-map-highlight-color: #ffd633;
    --wb-factory-map-pin-image: url("${FACTORY_PIN_SRC}");
    --wb-factory-map-pin-size: 38px;
    --wb-factory-map-bg-opacity: 1;
    --wb-factory-map-label-gap: 18px;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    padding: 58px 0 72px;
  }
  .wb-factory-map * {
    box-sizing: border-box;
  }
  .wb-factory-map__inner {
    max-width: 1500px;
    margin: 0 auto;
    padding: 0 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .wb-factory-map__intro {
    display: flex;
    justify-content: center;
  }
  .wb-factory-map__heading-wrap {
    width: 100%;
  }
  .wb-factory-map__title {
    margin: 0;
    text-align: center;
    text-wrap: balance;
    font-size: clamp(38px, 4vw, 58px);
    line-height: 1.05;
    letter-spacing: -0.035em;
    color: var(--wb-factory-map-title-color);
    font-weight: 800;
  }
  .wb-factory-map__stage {
    position: relative;
  }
  .wb-factory-map__canvas {
    position: relative;
    width: 100%;
    min-height: 560px;
    aspect-ratio: 2.3 / 1;
    overflow: visible;
    isolation: isolate;
  }
  .wb-factory-map__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    opacity: var(--wb-factory-map-bg-opacity);
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }
  .wb-factory-map__leaders,
  .wb-factory-map__highlights,
  .wb-factory-map__pins,
  .wb-factory-map__labels {
    position: absolute;
    inset: 0;
  }
  .wb-factory-map__highlights {
    z-index: 1;
    pointer-events: none;
  }
  .wb-factory-map__highlight {
    position: absolute;
    background: var(--wb-factory-map-highlight-color);
    opacity: 0;
    filter: blur(2px) drop-shadow(0 12px 28px rgba(255, 214, 51, 0.34));
    transform: translate(-50%, -50%) rotate(var(--rotate, 0deg));
    border-radius: 38% 50% 42% 48%;
    mix-blend-mode: multiply;
    animation: wb-factory-map-highlight-in 0.5s cubic-bezier(.22, 1, .36, 1) forwards;
    animation-delay: calc(var(--wb-factory-delay, 0ms) + 70ms);
  }
  .wb-factory-map__leaders {
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    z-index: 2;
  }
  .wb-factory-map__leader-path {
    fill: none;
    stroke: var(--wb-factory-map-leader-color);
    stroke-width: 1.45;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    opacity: 0;
    animation: wb-factory-map-leader-draw 0.95s cubic-bezier(.22, 1, .36, 1) forwards;
    animation-delay: calc(var(--wb-factory-delay, 0ms) + 120ms);
  }
  .wb-factory-map__pins {
    z-index: 3;
  }
  .wb-factory-map__pin {
    position: absolute;
    width: var(--wb-factory-map-pin-size);
    height: calc(var(--wb-factory-map-pin-size) * 1.18);
    padding: 0;
    border: 0;
    background: transparent;
    cursor: default;
    transform: translate(-50%, -84%);
    opacity: 0;
    animation: wb-factory-map-pin-in 0.48s cubic-bezier(.22, 1, .36, 1) forwards;
    animation-delay: var(--wb-factory-delay, 0ms);
  }
  .wb-factory-map__pin::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: var(--wb-factory-map-pin-image);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    filter: drop-shadow(0 12px 24px rgba(7, 23, 41, 0.16));
  }
  .wb-factory-map__pin::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 53%;
    width: 11px;
    height: 11px;
    transform: translate(-50%, -50%);
    border-radius: 999px;
    box-shadow: 0 0 0 0 rgba(255, 203, 48, 0.34);
    animation: wb-factory-map-pin-pulse 2.6s ease-out infinite;
    animation-delay: calc(var(--wb-factory-delay, 0ms) + 620ms);
  }
  .wb-factory-map__labels {
    z-index: 4;
  }
  .wb-factory-map__label-anchor {
    position: absolute;
    top: 0;
    left: 0;
  }
  .wb-factory-map__label-anchor::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--wb-factory-map-leader-color);
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.9);
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
    animation: wb-factory-map-anchor-in 0.32s cubic-bezier(.22, 1, .36, 1) forwards;
    animation-delay: calc(var(--wb-factory-delay, 0ms) + 520ms);
  }
  .wb-factory-map__label {
    position: relative;
    width: max-content;
    max-width: min(22vw, 260px);
    padding: 3px 0;
    opacity: 0;
    color: #143452;
    filter: blur(10px);
    transform: translate(var(--wb-factory-map-label-x, 0), -50%);
    animation: wb-factory-map-label-in 0.42s cubic-bezier(.16, 1, .3, 1) forwards;
    animation-delay: calc(var(--wb-factory-delay, 0ms) + 560ms);
  }
  .wb-factory-map__label-anchor--left .wb-factory-map__label {
    --wb-factory-map-label-x: var(--wb-factory-map-label-gap);
    --wb-factory-map-label-enter-x: 14px;
    text-align: left;
    transform-origin: left center;
  }
  .wb-factory-map__label-anchor--right .wb-factory-map__label {
    --wb-factory-map-label-x: calc(-100% - var(--wb-factory-map-label-gap));
    --wb-factory-map-label-enter-x: -14px;
    text-align: right;
    transform-origin: right center;
  }
  .wb-factory-map__label-title {
    margin: 0;
    font-size: clamp(16px, 1.35vw, 19px);
    line-height: 1.45;
    font-weight: 600;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  .wb-factory-map__label-desc {
    display: none;
  }
  @keyframes wb-factory-map-pin-in {
    from {
      opacity: 0;
      transform: translate(-50%, -76%) scale(0.86);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -84%) scale(1);
    }
  }
  @keyframes wb-factory-map-pin-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 203, 48, 0.34);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(255, 203, 48, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 203, 48, 0);
    }
  }
  @keyframes wb-factory-map-highlight-in {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--rotate, 0deg)) scale(0.78);
    }
    to {
      opacity: 0.92;
      transform: translate(-50%, -50%) rotate(var(--rotate, 0deg)) scale(1);
    }
  }
  @keyframes wb-factory-map-leader-draw {
    from {
      opacity: 1;
      stroke-dashoffset: 1;
    }
    to {
      opacity: 1;
      stroke-dashoffset: 0;
    }
  }
  @keyframes wb-factory-map-anchor-in {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.2);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  @keyframes wb-factory-map-label-in {
    from {
      opacity: 0;
      filter: blur(10px);
      transform: translate(
        calc(var(--wb-factory-map-label-x, 0px) + var(--wb-factory-map-label-enter-x, 0px)),
        calc(-50% + 8px)
      );
    }
    to {
      opacity: 1;
      filter: blur(0);
      transform: translate(var(--wb-factory-map-label-x, 0px), -50%);
    }
  }
  @media (max-width: 1199px) {
    .wb-factory-map__inner {
      padding: 0 36px;
    }
    .wb-factory-map__canvas {
      min-height: 500px;
    }
  }
  @media (max-width: 767px) {
    .wb-factory-map {
      --wb-factory-map-label-gap: 12px;
      padding: 42px 0 52px;
    }
    .wb-factory-map__inner {
      padding: 0 18px;
      gap: 20px;
    }
    .wb-factory-map__title {
      font-size: clamp(30px, 9vw, 42px);
    }
    .wb-factory-map__canvas {
      min-height: 340px;
      aspect-ratio: 1.28 / 1;
    }
    .wb-factory-map__leader-path {
      stroke-width: 1.25;
    }
    .wb-factory-map__label {
      max-width: min(42vw, 180px);
      padding: 2px 0;
    }
    .wb-factory-map__label-title {
      font-size: 14px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .wb-factory-map__highlight,
    .wb-factory-map__pin,
    .wb-factory-map__leader-path {
      animation: none !important;
      opacity: 1 !important;
      stroke-dashoffset: 0 !important;
    }
    .wb-factory-map__label-anchor::before {
      animation: none !important;
      opacity: 1 !important;
      transform: translate(-50%, -50%) scale(1) !important;
    }
    .wb-factory-map__label {
      animation: none !important;
      opacity: 1 !important;
      filter: blur(0) !important;
      transform: translate(var(--wb-factory-map-label-x, 0px), -50%) !important;
    }
    .wb-factory-map__pin {
      animation: none !important;
      opacity: 1 !important;
      transform: translate(-50%, -84%) !important;
    }
    .wb-factory-map__pin::after {
      animation: none !important;
      box-shadow: 0 0 0 8px rgba(255, 203, 48, 0.12);
    }
  }
`

const STYLE_VAR_DEFAULTS = {
  '--wb-factory-map-title-color': '#071624',
  '--wb-factory-map-summary-color': '#6b7885',
  '--wb-factory-map-leader-color': '#9eaebe',
  '--wb-factory-map-highlight-color': '#ffd633',
  '--wb-factory-map-pin-image': `url("${FACTORY_PIN_SRC}")`,
  '--wb-factory-map-pin-size': '38px',
  '--wb-factory-map-bg-opacity': '1',
} as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function toCssUrl(raw: string | undefined, fallback: string) {
  const value = `${raw || ''}`.trim()
  if (!value) return `url("${fallback}")`
  if (value.startsWith('url(')) return value
  return `url("${value}")`
}

function toPx(value: unknown, fallback: string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return `${numeric}px`
}

function pctToNumber(value: string) {
  const numeric = Number.parseFloat(value)
  return Number.isFinite(numeric) ? clamp(numeric, 0, 100) : 0
}

function buildLeaderPath(preset: FactoryPreset) {
  return `M ${pctToNumber(preset.pin.left)} ${pctToNumber(preset.pin.top)} L ${pctToNumber(preset.elbow.left)} ${pctToNumber(preset.elbow.top)} L ${pctToNumber(preset.label.left)} ${pctToNumber(preset.label.top)}`
}

function buildPositionStyle(position: { left: string; top: string }, delay: number) {
  return `left:${position.left};top:${position.top};--wb-factory-delay:${delay}ms;`
}

function buildIntroDef() {
  return {
    tagName: 'div',
    name: 'Intro',
    selectable: true,
    stylable: true,
    droppable: false,
    attributes: { class: 'wb-factory-map__intro' },
    components: [
      {
        tagName: 'div',
        name: 'Title Wrap',
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-factory-map__heading-wrap' },
        components: [
          {
            tagName: 'h2',
            type: 'text',
            selectable: true,
            stylable: true,
            editable: true,
            droppable: true,
            attributes: { class: 'wb-factory-map__title' },
            components: 'Manufacturing Base Distribution',
          },
        ],
      },
    ],
  }
}

function buildLeaderDef(preset: FactoryPreset, index: number) {
  return {
    tagName: 'path',
    name: `Leader ${index + 1}`,
    selectable: false,
    hoverable: false,
    highlightable: false,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    attributes: {
      class: 'wb-factory-map__leader-path',
      d: buildLeaderPath(preset),
      pathLength: '1',
      'data-index': `${index}`,
      style: `--wb-factory-delay:${preset.delay}ms;`,
    },
  }
}

function buildPinDef(preset: FactoryPreset, index: number) {
  return {
    tagName: 'button',
    name: `Pin ${index + 1}`,
    selectable: false,
    hoverable: false,
    highlightable: false,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    attributes: {
      class: 'wb-factory-map__pin',
      type: 'button',
      'aria-label': `${preset.country} factory`,
      'data-index': `${index}`,
      style: buildPositionStyle(preset.pin, preset.delay),
    },
  }
}

function buildLabelTextDef(
  tagName: 'p' | 'h3',
  className: string,
  content: string,
  name: string,
) {
  return {
    tagName,
    type: 'text',
    name,
    selectable: true,
    stylable: true,
    editable: true,
    droppable: true,
    attributes: { class: className },
    components: content,
  }
}

function buildLabelDef(preset: FactoryPreset, index: number) {
  return {
    tagName: 'div',
    name: `Label ${index + 1}`,
    selectable: true,
    stylable: true,
    droppable: false,
    attributes: {
      class: `wb-factory-map__label-anchor wb-factory-map__label-anchor--${preset.align}`,
      'data-index': `${index}`,
      style: buildPositionStyle(preset.label, preset.delay),
    },
    components: [
      {
        tagName: 'div',
        name: `Label Card ${index + 1}`,
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-factory-map__label' },
        components: [
          buildLabelTextDef('h3', 'wb-factory-map__label-title', preset.title, 'Title'),
          buildLabelTextDef('p', 'wb-factory-map__label-desc', preset.description, 'Description'),
        ],
      },
    ],
  }
}

function buildHighlightDef(preset: FactoryPreset, index: number) {
  if (!preset.highlight) return null
  const { left, top, width, height, rotate } = preset.highlight
  return {
    tagName: 'span',
    name: `Highlight ${index + 1}`,
    selectable: false,
    hoverable: false,
    highlightable: false,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    attributes: {
      class: 'wb-factory-map__highlight',
      style: `left:${left};top:${top};width:${width};height:${height};--rotate:${rotate ?? 0}deg;--wb-factory-delay:${preset.delay}ms;`,
    },
  }
}

function buildStageDef() {
  return {
    tagName: 'div',
    name: 'Stage',
    selectable: true,
    stylable: true,
    droppable: false,
    attributes: { class: 'wb-factory-map__stage' },
    components: [
      {
        tagName: 'div',
        name: 'Canvas',
        selectable: true,
        stylable: true,
        droppable: false,
        attributes: { class: 'wb-factory-map__canvas' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            stylable: false,
            droppable: false,
            attributes: {
              class: 'wb-factory-map__bg',
              src: DEFAULT_FACTORY_MAP_BACKGROUND,
              alt: 'Highlighted world factory map',
            },
          },
          {
            tagName: 'div',
            name: 'Highlights',
            selectable: false,
            hoverable: false,
            highlightable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-factory-map__highlights' },
            components: FACTORY_PRESETS.map((preset, index) => buildHighlightDef(preset, index)).filter(Boolean) as any[],
          },
          {
            tagName: 'svg',
            name: 'Leaders',
            selectable: false,
            hoverable: false,
            highlightable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            attributes: {
              class: 'wb-factory-map__leaders',
              xmlns: 'http://www.w3.org/2000/svg',
              viewBox: '0 0 100 100',
              preserveAspectRatio: 'none',
              'aria-hidden': 'true',
            },
            components: FACTORY_PRESETS.map((preset, index) => buildLeaderDef(preset, index)),
          },
          {
            tagName: 'div',
            name: 'Pins Layer',
            selectable: false,
            hoverable: false,
            highlightable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            attributes: { class: 'wb-factory-map__pins' },
            components: FACTORY_PRESETS.map((preset, index) => buildPinDef(preset, index)),
          },
          {
            tagName: 'div',
            name: 'Labels Layer',
            selectable: true,
            stylable: false,
            droppable: false,
            attributes: { class: 'wb-factory-map__labels' },
            components: FACTORY_PRESETS.map((preset, index) => buildLabelDef(preset, index)),
          },
        ],
      },
    ],
  }
}

function buildFactoryMapTree() {
  return [
    {
      tagName: 'div',
      name: 'Factory Map Inner',
      selectable: true,
      stylable: true,
      droppable: false,
      attributes: { class: 'wb-factory-map__inner' },
      components: [buildIntroDef(), buildStageDef()],
    },
  ]
}

export function registerFactoryMapComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_FACTORY_MAP_TYPE)) return

  injectStyleOnce(editor, 'wb-factory-map', FACTORY_MAP_CSS)

  domComponents.addType(WB_FACTORY_MAP_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'factory-map'
        ? { type: WB_FACTORY_MAP_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Factory Map',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: FACTORY_MAP_CSS,
        attributes: {
          'data-wb-component': 'factory-map',
          class: 'wb-factory-map',
        },
        mapBackground: DEFAULT_FACTORY_MAP_BACKGROUND,
        mapBackgroundUrl: '',
        pinImage: FACTORY_PIN_SRC,
        pinSize: 38,
        mapOpacity: 100,
        titleColor: '#071624',
        summaryColor: '#6b7885',
        leaderColor: '#9eaebe',
        highlightColor: '#ffd633',
        traits: [
          makeImagePickerTrait('地图 SVG/底图', 'mapBackground'),
          makeTextTrait('地图 SVG URL', 'mapBackgroundUrl', {
            placeholder: 'https://example.com/factory-map.svg',
          }),
          makeImagePickerTrait('Pin 图标', 'pinImage'),
          makeNumberTrait('Pin 大小', 'pinSize', { min: 24, max: 60, step: 1 }),
          makeNumberTrait('底图透明度', 'mapOpacity', { min: 40, max: 100, step: 1 }),
          makeColorPickerTrait('标题颜色', 'titleColor'),
          makeColorPickerTrait('摘要颜色', 'summaryColor'),
          makeColorPickerTrait('引线颜色', 'leaderColor'),
          makeColorPickerTrait('高亮颜色', 'highlightColor'),
        ],
        components: buildFactoryMapTree(),
      },

      init(this: any) {
        this.applyMapBackground()
        this.applyStyleVars()

        this.on('change:mapBackground change:mapBackgroundUrl', this.applyMapBackground)
        this.on(
          'change:pinImage change:pinSize change:mapOpacity change:titleColor change:summaryColor change:leaderColor change:highlightColor',
          this.applyStyleVars,
        )
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

      applyMapBackground(this: any) {
        const mapImage = this._getMapImage?.()
        if (!mapImage) return

        const mapBackgroundUrl = `${this.get('mapBackgroundUrl') || ''}`.trim()
        const mapBackground = `${this.get('mapBackground') || ''}`.trim()
        const nextSrc = mapBackgroundUrl || mapBackground || DEFAULT_FACTORY_MAP_BACKGROUND

        mapImage.addAttributes?.({
          src: nextSrc,
        })
      },

      applyStyleVars(this: any) {
        const style = { ...(this.getStyle?.() ?? {}) } as Record<string, string>
        const opacity = clamp(Number(this.get('mapOpacity')) || 100, 40, 100)

        delete style['--wb-factory-map-section-bg']
        style['--wb-factory-map-title-color'] =
          this.get('titleColor') || STYLE_VAR_DEFAULTS['--wb-factory-map-title-color']
        style['--wb-factory-map-summary-color'] =
          this.get('summaryColor') || STYLE_VAR_DEFAULTS['--wb-factory-map-summary-color']
        style['--wb-factory-map-leader-color'] =
          this.get('leaderColor') || STYLE_VAR_DEFAULTS['--wb-factory-map-leader-color']
        style['--wb-factory-map-highlight-color'] =
          this.get('highlightColor') || STYLE_VAR_DEFAULTS['--wb-factory-map-highlight-color']
        style['--wb-factory-map-pin-image'] = toCssUrl(
          this.get('pinImage'),
          FACTORY_PIN_SRC,
        )
        style['--wb-factory-map-pin-size'] = toPx(
          this.get('pinSize'),
          STYLE_VAR_DEFAULTS['--wb-factory-map-pin-size'],
        )
        style['--wb-factory-map-bg-opacity'] = `${opacity / 100}`

        this.setStyle(style)
      },
    },
  })

  blockManager?.add?.(WB_FACTORY_MAP_TYPE, {
    label: 'Factory Map',
    category: 'Section',
    content: { type: WB_FACTORY_MAP_TYPE },
    media: BLOCK_ICON,
  })
}
