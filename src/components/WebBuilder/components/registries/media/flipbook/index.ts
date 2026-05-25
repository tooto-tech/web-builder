import type { Editor } from 'grapesjs'
import { makeColorPickerTrait, makeImagePickerTrait, makeNumberTrait, makeTextTrait } from '@/components/WebBuilder/utils/traitFactory'
import { injectStyleOnce } from '@/components/WebBuilder/utils/injectStyle'

export const WB_FLIPBOOK_TYPE = 'wb-flipbook'
export const WB_FLIPBOOK_PAGE_TYPE = 'wb-flipbook-page'

type FlipbookPageData = {
  image: string
  alt: string
}

export function sanitizeFlipbookProjectData(projectData: any): any {
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return

    const type = `${node.type ?? ''}`.trim()
    const componentName = `${node.attributes?.['data-wb-component'] ?? ''}`.trim()
    const isFlipbook = type === WB_FLIPBOOK_TYPE || componentName === 'flipbook'

    if (isFlipbook) {
      delete node.script
      delete node['script-export']

      if (node.attributes && typeof node.attributes === 'object') {
        delete node.attributes['data-flipbook-refresh']
        delete node.attributes['data-flipbook-structure']
        delete node.attributes['data-wb-preview-active']
      }
    }

    Object.keys(node).forEach((key) => {
      const value = node[key]
      if (Array.isArray(value)) {
        value.forEach(visit)
        return
      }
      if (value && typeof value === 'object') {
        visit(value)
      }
    })
  }

  visit(projectData)
  return projectData
}

const INNER_NODE = {
  selectable: false,
  hoverable: false,
  highlightable: false,
  draggable: false,
  droppable: false,
  copyable: false,
  removable: false,
  layerable: false,
  badgable: false,
} as const

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M5 4.75A2.75 2.75 0 0 1 7.75 2H19v18.25A1.75 1.75 0 0 0 17.25 22H7.75A2.75 2.75 0 0 1 5 19.25V4.75Z" />
  <path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" />
  <path d="M11 6.5h4.5" />
  <path d="M11 10h4.5" />
</svg>`

const STYLE_VAR_DEFAULTS = {
  '--wb-flipbook-section-bg': '#000000',
  '--wb-flipbook-stage-bg': '#000000',
  '--wb-flipbook-accent': '#0a3554',
  '--wb-flipbook-page-radius': '22px',
} as const

const FLIPBOOK_CSS = `
  .wb-flipbook {
    --wb-flipbook-section-bg: #000000;
    --wb-flipbook-stage-bg: #000000;
    --wb-flipbook-accent: #0a3554;
    --wb-flipbook-page-radius: 22px;
    width: 100%;
    box-sizing: border-box;
    background: var(--wb-flipbook-section-bg);
    padding: 22px 0 0;
  }
  .wb-flipbook * {
    box-sizing: border-box;
  }
  .wb-flipbook__inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 12px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .wb-flipbook__stage {
    position: relative;
    padding: 0 54px 18px;
    background: var(--wb-flipbook-stage-bg);
    overflow: hidden;
  }
  .wb-flipbook__stage::before {
    display: none;
  }
  .wb-flipbook__viewport {
    position: relative;
    max-width: 1240px;
    margin: 0 auto;
    perspective: 2200px;
  }
  .wb-flipbook__book {
    position: relative;
    width: 100%;
    aspect-ratio: 1.72;
    min-height: 660px;
    transform-style: preserve-3d;
    border-radius: 0;
  }
  .wb-flipbook__pages {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }
  .wb-flipbook__page {
    position: absolute;
    top: 0;
    bottom: 0;
    width: calc(50% - 10px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform-style: preserve-3d;
    will-change: transform, opacity;
  }
  .wb-flipbook__page.is-slot-left {
    left: 0;
    transform-origin: right center;
  }
  .wb-flipbook__page.is-slot-right {
    right: 0;
    transform-origin: left center;
  }
  .wb-flipbook__page.is-visible {
    visibility: visible;
  }
  .wb-flipbook__page.is-active {
    opacity: 1;
    pointer-events: auto;
    z-index: 5;
    transform: translateX(0) rotateY(0deg) scale(1);
  }
  .wb-flipbook__page.is-rest-left {
    opacity: 0.04;
    z-index: 1;
    transform: translateX(-8%) rotateY(-14deg) scale(0.98);
  }
  .wb-flipbook__page.is-rest-right {
    opacity: 0.04;
    z-index: 1;
    transform: translateX(8%) rotateY(14deg) scale(0.98);
  }
  .wb-flipbook__page.is-animating-out-next-left {
    opacity: 1;
    visibility: visible;
    z-index: 6;
    animation: wb-flipbook-spread-out-next-left 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page.is-animating-out-next-right {
    opacity: 1;
    visibility: visible;
    z-index: 7;
    animation: wb-flipbook-spread-out-next-right 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page.is-animating-in-next-left {
    opacity: 0.16;
    visibility: visible;
    z-index: 5;
    animation: wb-flipbook-spread-in-next-left 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page.is-animating-in-next-right {
    opacity: 0.16;
    visibility: visible;
    z-index: 6;
    animation: wb-flipbook-spread-in-next-right 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page.is-animating-out-prev-left {
    opacity: 1;
    visibility: visible;
    z-index: 7;
    animation: wb-flipbook-spread-out-prev-left 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page.is-animating-out-prev-right {
    opacity: 1;
    visibility: visible;
    z-index: 6;
    animation: wb-flipbook-spread-out-prev-right 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page.is-animating-in-prev-left {
    opacity: 0.16;
    visibility: visible;
    z-index: 5;
    animation: wb-flipbook-spread-in-prev-left 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page.is-animating-in-prev-right {
    opacity: 0.16;
    visibility: visible;
    z-index: 6;
    animation: wb-flipbook-spread-in-prev-right 0.7s cubic-bezier(.2, .8, .2, 1) forwards;
  }
  .wb-flipbook__page-frame {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--wb-flipbook-page-radius);
    overflow: hidden;
    background: #ffffff;
    border: 1px solid rgba(15, 63, 103, 0.08);
    box-shadow:
      0 28px 54px rgba(15, 22, 34, 0.16),
      inset 0 0 0 1px rgba(255, 255, 255, 0.44);
  }
  .wb-flipbook__page-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    background: #eef2f6;
  }
  .wb-flipbook__page-number {
    position: absolute;
    right: 18px;
    bottom: 16px;
    z-index: 3;
    min-width: 42px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(15, 63, 103, 0.78);
    color: #ffffff;
    font-size: 12px;
    line-height: 1;
    font-weight: 600;
    text-align: center;
    backdrop-filter: blur(8px);
  }
  .wb-flipbook__toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 18px;
    min-height: 82px;
    padding: 16px 22px;
    background: var(--wb-flipbook-accent);
    color: #e8f1f8;
  }
  .wb-flipbook__toolbar-group {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .wb-flipbook__toolbar-group--center {
    justify-content: center;
  }
  .wb-flipbook__toolbar-group--right {
    justify-content: flex-end;
  }
  .wb-flipbook__toolbar-btn,
  .wb-flipbook__btn {
    appearance: none;
    border: 0;
    padding: 0 2px;
    min-width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #d5e1ec;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .wb-flipbook__toolbar-btn:hover,
  .wb-flipbook__btn:hover {
    opacity: 0.86;
  }
  .wb-flipbook__toolbar-btn:disabled,
  .wb-flipbook__btn:disabled {
    cursor: not-allowed;
    opacity: 0.36;
    transform: none;
  }
  .wb-flipbook__toolbar-btn:focus-visible,
  .wb-flipbook__btn:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.4);
    outline-offset: 3px;
  }
  .wb-flipbook__toolbar-btn svg,
  .wb-flipbook__btn svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 1.8;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .wb-flipbook__back-text {
    font-size: 14px;
    line-height: 1;
    font-weight: 600;
  }
  .wb-flipbook__page-control {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    line-height: 1;
    color: #eef5fb;
  }
  .wb-flipbook__page-label {
    white-space: nowrap;
  }
  .wb-flipbook__page-select-wrap {
    position: relative;
    min-width: 104px;
    height: 34px;
    border: 1px solid rgba(207, 223, 236, 0.4);
    border-radius: 6px;
    background: rgba(7, 41, 66, 0.9);
    overflow: hidden;
  }
  .wb-flipbook__page-select-wrap::after {
    content: "";
    position: absolute;
    right: 10px;
    top: 50%;
    width: 8px;
    height: 8px;
    margin-top: -6px;
    border-right: 1.5px solid #d7e4ef;
    border-bottom: 1.5px solid #d7e4ef;
    transform: rotate(45deg);
    pointer-events: none;
  }
  .wb-flipbook__page-select {
    width: 100%;
    height: 100%;
    border: 0;
    padding: 0 28px 0 12px;
    background: transparent;
    color: #f8fbff;
    font-size: 14px;
    line-height: 1;
    outline: none;
    appearance: none;
    cursor: pointer;
  }
  .wb-flipbook__side-nav {
    position: absolute;
    top: 50%;
    z-index: 8;
    width: 42px;
    height: 72px;
    margin-top: -36px;
    border: 0;
    background: transparent;
    color: #9fb2c3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .wb-flipbook__side-nav:hover {
    opacity: 0.86;
  }
  .wb-flipbook__side-nav--prev {
    left: 6px;
  }
  .wb-flipbook__side-nav--next {
    right: 6px;
  }
  .wb-flipbook__side-nav svg {
    width: 26px;
    height: 52px;
    stroke: currentColor;
    stroke-width: 1.6;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .wb-flipbook__thumbs-panel {
    max-height: 0;
    overflow: hidden;
    background: #041f32;
    transition: max-height 0.28s ease;
  }
  .wb-flipbook.is-thumbs-open .wb-flipbook__thumbs-panel {
    max-height: 184px;
  }
  .wb-flipbook__thumbs-inner {
    padding: 14px 20px 18px;
  }
  .wb-flipbook__thumbs-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 10px;
  }
  .wb-flipbook__thumb {
    appearance: none;
    border: 1px solid rgba(192, 210, 223, 0.24);
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
    padding: 0;
    cursor: pointer;
    color: #fff;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }
  .wb-flipbook__thumb:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.28);
  }
  .wb-flipbook__thumb.is-active {
    border-color: rgba(255, 255, 255, 0.72);
  }
  .wb-flipbook__thumb-image {
    display: block;
    width: 100%;
    aspect-ratio: 0.72;
    object-fit: cover;
    background: #163247;
  }
  .wb-flipbook__thumb-label {
    display: block;
    padding: 8px 6px;
    font-size: 11px;
    line-height: 1;
    text-align: center;
  }
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__pages {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page {
    left: 50%;
    right: auto;
    width: min(100%, 720px);
    transform: translateX(-50%) scale(0.98);
    transform-origin: center center;
  }
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-active {
    transform: translateX(-50%) scale(1);
  }
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-rest-left,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-rest-right,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-slot-left,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-slot-right,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-out-next-left,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-out-next-right,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-in-next-left,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-in-next-right,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-out-prev-left,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-out-prev-right,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-in-prev-left,
  .wb-flipbook.is-single-page:not(.is-turn-mode) .wb-flipbook__page.is-animating-in-prev-right {
    animation: none;
  }
  .wb-flipbook.is-turn-mode .wb-flipbook__pages {
    max-width: 100%;
    overflow: visible;
  }
  .wb-flipbook.is-turn-mode .wb-flipbook__page {
    position: static;
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    width: auto;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: none;
    will-change: auto;
  }
  .wb-flipbook.is-turn-mode .wb-flipbook__page-frame {
    height: 100%;
  }
  .wb-flipbook.is-turn-mode .wb-flipbook__page-number {
    display: none;
  }
  .wb-flipbook.is-turn-mode .wb-flipbook__pages .turn-page {
    background: transparent;
  }
  .wb-flipbook.is-turn-mode .wb-flipbook__pages .shadow,
  .wb-flipbook.is-turn-mode .wb-flipbook__pages .page-wrapper,
  .wb-flipbook.is-turn-mode .wb-flipbook__pages .page {
    border-radius: var(--wb-flipbook-page-radius);
  }
  @keyframes wb-flipbook-spread-out-next-left {
    0% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
    100% {
      opacity: 0.05;
      transform: translateX(-10%) rotateY(-10deg) scale(0.98);
      filter: brightness(0.95);
    }
  }
  @keyframes wb-flipbook-spread-out-next-right {
    0% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
    100% {
      opacity: 0.06;
      transform: translateX(-5%) rotateY(-72deg) scale(0.98);
      filter: brightness(0.9);
    }
  }
  @keyframes wb-flipbook-spread-in-next-left {
    0% {
      opacity: 0.04;
      transform: translateX(10%) rotateY(10deg) scale(0.98);
      filter: brightness(0.95);
    }
    100% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
  }
  @keyframes wb-flipbook-spread-in-next-right {
    0% {
      opacity: 0.08;
      transform: translateX(5%) rotateY(72deg) scale(0.98);
      filter: brightness(0.92);
    }
    100% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
  }
  @keyframes wb-flipbook-spread-out-prev-left {
    0% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
    100% {
      opacity: 0.06;
      transform: translateX(5%) rotateY(72deg) scale(0.98);
      filter: brightness(0.9);
    }
  }
  @keyframes wb-flipbook-spread-out-prev-right {
    0% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
    100% {
      opacity: 0.05;
      transform: translateX(10%) rotateY(10deg) scale(0.98);
      filter: brightness(0.95);
    }
  }
  @keyframes wb-flipbook-spread-in-prev-left {
    0% {
      opacity: 0.08;
      transform: translateX(-5%) rotateY(-72deg) scale(0.98);
      filter: brightness(0.92);
    }
    100% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
  }
  @keyframes wb-flipbook-spread-in-prev-right {
    0% {
      opacity: 0.04;
      transform: translateX(-10%) rotateY(-10deg) scale(0.98);
      filter: brightness(0.95);
    }
    100% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg) scale(1);
      filter: brightness(1);
    }
  }
  @media (max-width: 767px) {
    .wb-flipbook {
      padding: 12px 0 0;
    }
    .wb-flipbook__inner {
      padding: 0;
      gap: 16px;
    }
    .wb-flipbook__stage {
      padding: 0 34px 12px;
    }
    .wb-flipbook__book {
      aspect-ratio: 1.18;
      min-height: 320px;
    }
    .wb-flipbook__toolbar {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 14px 16px;
      min-height: 0;
    }
    .wb-flipbook__toolbar-group {
      justify-content: center;
    }
    .wb-flipbook__toolbar-group--right,
    .wb-flipbook__toolbar-group--left {
      justify-content: center;
    }
    .wb-flipbook__page-control {
      font-size: 13px;
    }
    .wb-flipbook__page-select-wrap {
      min-width: 92px;
      height: 32px;
    }
    .wb-flipbook__side-nav {
      width: 28px;
      height: 56px;
      margin-top: -28px;
    }
    .wb-flipbook__side-nav svg {
      width: 18px;
      height: 40px;
    }
    .wb-flipbook__thumbs-list {
      grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .wb-flipbook__page {
      animation: none !important;
      transition: none !important;
    }
    .wb-flipbook__btn {
      transition: none !important;
    }
  }
`

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function toPx(value: unknown, fallback: string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return `${numeric}px`
}

function formatPageNumber(pageNumber: number) {
  return String(pageNumber).padStart(2, '0')
}

function createPagePlaceholder(index: number) {
  const label = `Page ${index + 1}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" fill="none">
    <defs>
      <linearGradient id="wb_flipbook_placeholder_${index}" x1="110" y1="84" x2="1020" y2="1498" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F7FAFC"/>
        <stop offset="1" stop-color="#DDE5EE"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="1600" rx="42" fill="url(#wb_flipbook_placeholder_${index})"/>
    <rect x="112" y="138" width="976" height="1324" rx="28" fill="rgba(255,255,255,0.78)" stroke="rgba(15,63,103,0.08)" stroke-width="4"/>
    <path d="M188 278h824" stroke="rgba(15,63,103,0.12)" stroke-width="10" stroke-linecap="round"/>
    <path d="M188 346h640" stroke="rgba(15,63,103,0.09)" stroke-width="8" stroke-linecap="round"/>
    <path d="M188 452h824" stroke="rgba(15,63,103,0.06)" stroke-width="6" stroke-linecap="round"/>
    <path d="M188 506h780" stroke="rgba(15,63,103,0.06)" stroke-width="6" stroke-linecap="round"/>
    <path d="M188 560h700" stroke="rgba(15,63,103,0.06)" stroke-width="6" stroke-linecap="round"/>
    <rect x="188" y="660" width="824" height="520" rx="26" fill="#E7EDF4"/>
    <circle cx="414" cy="920" r="112" fill="#D7E2EE"/>
    <path d="M286 1086L422 950l108 94 190-220 180 262H286Z" fill="#C8D5E2"/>
    <text x="188" y="1304" fill="#0F3F67" font-family="Arial, sans-serif" font-size="74" font-weight="700">${label}</text>
    <text x="188" y="1386" fill="#5F7285" font-family="Arial, sans-serif" font-size="34">Replace this placeholder with your page image.</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function getPageImageValue(model: any, index: number) {
  const raw = `${model?.get?.('fbPageImage') || ''}`.trim()
  return raw || createPagePlaceholder(index)
}

function getPageAltValue(model: any, index: number) {
  const raw = `${model?.get?.('fbPageAlt') || ''}`.trim()
  return raw || `Flipbook page ${index + 1}`
}

function buildPageDef(index: number, data?: Partial<FlipbookPageData>) {
  const alt = `${data?.alt || ''}`.trim() || `Flipbook page ${index + 1}`
  const image = `${data?.image || ''}`.trim()

  return {
    type: WB_FLIPBOOK_PAGE_TYPE,
    fbPageImage: image,
    fbPageAlt: alt,
    attributes: {
      class: 'wb-flipbook__page',
      'data-page-index': `${index}`,
    },
    components: [
      {
        tagName: 'div',
        name: `Page Frame ${index + 1}`,
        ...INNER_NODE,
        attributes: { class: 'wb-flipbook__page-frame' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            ...INNER_NODE,
            attributes: {
              class: 'wb-flipbook__page-image',
              src: image || createPagePlaceholder(index),
              alt,
            },
          },
          {
            tagName: 'div',
            type: 'text',
            ...INNER_NODE,
            editable: false,
            attributes: { class: 'wb-flipbook__page-number' },
            components: formatPageNumber(index + 1),
          },
        ],
      },
    ],
  }
}

function buildFlipbookTree() {
  return [
    {
      tagName: 'div',
      name: 'Flipbook Inner',
      ...INNER_NODE,
      attributes: { class: 'wb-flipbook__inner' },
      components: [
        {
          tagName: 'div',
          name: 'Stage',
          ...INNER_NODE,
          attributes: { class: 'wb-flipbook__stage' },
          components: [
            {
              tagName: 'button',
              name: 'Side Prev',
              ...INNER_NODE,
              attributes: {
                class: 'wb-flipbook__side-nav wb-flipbook__side-nav--prev',
                type: 'button',
                'data-flipbook-action': 'prev',
                'aria-label': 'Previous pages',
              },
              components: `<svg viewBox="0 0 24 48" aria-hidden="true"><path d="M18 6 7 24l11 18"/></svg>`,
            },
            {
              tagName: 'div',
              name: 'Viewport',
              ...INNER_NODE,
              attributes: { class: 'wb-flipbook__viewport' },
              components: [
                {
                  tagName: 'div',
                  name: 'Book',
                  ...INNER_NODE,
                  attributes: { class: 'wb-flipbook__book' },
                  components: [
                    {
                      tagName: 'div',
                      name: 'Pages',
                      ...INNER_NODE,
                      attributes: { class: 'wb-flipbook__pages' },
                      components: [buildPageDef(0), buildPageDef(1)],
                    },
                  ],
                },
              ],
            },
            {
              tagName: 'button',
              name: 'Side Next',
              ...INNER_NODE,
              attributes: {
                class: 'wb-flipbook__side-nav wb-flipbook__side-nav--next',
                type: 'button',
                'data-flipbook-action': 'next',
                'aria-label': 'Next pages',
              },
              components: `<svg viewBox="0 0 24 48" aria-hidden="true"><path d="m6 6 11 18L6 42"/></svg>`,
            },
          ],
        },
        {
          tagName: 'div',
          name: 'Toolbar',
          ...INNER_NODE,
          attributes: { class: 'wb-flipbook__toolbar' },
          components: [
            {
              tagName: 'div',
              name: 'Toolbar Left',
              ...INNER_NODE,
              attributes: { class: 'wb-flipbook__toolbar-group wb-flipbook__toolbar-group--left' },
              components: [
                {
                  tagName: 'button',
                  name: 'Back Button',
                  ...INNER_NODE,
                  attributes: {
                    class: 'wb-flipbook__toolbar-btn',
                    type: 'button',
                    'data-flipbook-action': 'back',
                    'aria-label': 'Back',
                  },
                  components: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/><path d="M9 12h8"/></svg><span class="wb-flipbook__back-text">Back</span>`,
                },
              ],
            },
            {
              tagName: 'div',
              name: 'Toolbar Center',
              ...INNER_NODE,
              attributes: { class: 'wb-flipbook__toolbar-group wb-flipbook__toolbar-group--center' },
              components: [
                {
                  tagName: 'button',
                  name: 'First Button',
                  ...INNER_NODE,
                  attributes: {
                    class: 'wb-flipbook__toolbar-btn',
                    type: 'button',
                    'data-flipbook-action': 'first',
                    'aria-label': 'First page',
                  },
                  components: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 10 12l8 6"/><path d="M12 6 4 12l8 6"/></svg>`,
                },
                {
                  tagName: 'button',
                  name: 'Prev Button',
                  ...INNER_NODE,
                  attributes: {
                    class: 'wb-flipbook__toolbar-btn',
                    type: 'button',
                    'data-flipbook-action': 'prev',
                    'aria-label': 'Previous page',
                  },
                  components: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>`,
                },
                {
                  tagName: 'div',
                  name: 'Page Control',
                  ...INNER_NODE,
                  attributes: { class: 'wb-flipbook__page-control' },
                  components: [
                    {
                      tagName: 'span',
                      type: 'text',
                      ...INNER_NODE,
                      editable: false,
                      attributes: { class: 'wb-flipbook__page-label' },
                      components: 'Page',
                    },
                    {
                      tagName: 'div',
                      ...INNER_NODE,
                      attributes: { class: 'wb-flipbook__page-select-wrap' },
                      components: [
                        {
                          tagName: 'select',
                          ...INNER_NODE,
                          attributes: {
                            class: 'wb-flipbook__page-select',
                            'data-flipbook-page-select': '',
                            'aria-label': 'Page selector',
                          },
                          components: [
                            {
                              tagName: 'option',
                              ...INNER_NODE,
                              attributes: { value: '1' },
                              components: '1 / 2',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  tagName: 'button',
                  name: 'Next Button',
                  ...INNER_NODE,
                  attributes: {
                    class: 'wb-flipbook__toolbar-btn',
                    type: 'button',
                    'data-flipbook-action': 'next',
                    'aria-label': 'Next page',
                  },
                  components: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`,
                },
                {
                  tagName: 'button',
                  name: 'Last Button',
                  ...INNER_NODE,
                  attributes: {
                    class: 'wb-flipbook__toolbar-btn',
                    type: 'button',
                    'data-flipbook-action': 'last',
                    'aria-label': 'Last page',
                  },
                  components: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 8 6-8 6"/><path d="m12 6 8 6-8 6"/></svg>`,
                },
              ],
            },
            {
              tagName: 'div',
              name: 'Toolbar Right',
              ...INNER_NODE,
              attributes: { class: 'wb-flipbook__toolbar-group wb-flipbook__toolbar-group--right' },
              components: [
                {
                  tagName: 'button',
                  name: 'Thumbs Toggle',
                  ...INNER_NODE,
                  attributes: {
                    class: 'wb-flipbook__toolbar-btn',
                    type: 'button',
                    'data-flipbook-action': 'thumbs',
                    'aria-label': 'Toggle thumbnails',
                  },
                  components: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></svg>`,
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          name: 'Thumbs Panel',
          ...INNER_NODE,
          attributes: { class: 'wb-flipbook__thumbs-panel' },
          components: [
            {
              tagName: 'div',
              name: 'Thumbs Inner',
              ...INNER_NODE,
              attributes: { class: 'wb-flipbook__thumbs-inner' },
              components: [
                {
                  tagName: 'div',
                  name: 'Thumbs List',
                  ...INNER_NODE,
                  attributes: { class: 'wb-flipbook__thumbs-list', 'data-flipbook-thumbs': '' },
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

function findChildByClass(model: any, className: string) {
  const children = model?.components?.()?.models ?? []
  return children.find((child: any) => {
    const classes = child?.getClasses?.() ?? []
    return Array.isArray(classes) && classes.includes(className)
  }) ?? null
}

const flipbookScript = function (this: HTMLElement) {
  const root = this as HTMLElement & {
    _wbFlipbookCleanup?: () => void
    _wbFlipbookTimer?: number
    _wbFlipbookTurnTimer?: number
  }

  if (root._wbFlipbookCleanup) root._wbFlipbookCleanup()
  root.classList.add('is-single-page')

  let handlers: Array<{ el: HTMLElement; type: string; fn: EventListener }> = []
  let animating = false
  let usingTurn = false
  let suppressTurnMutations = false
  const isEditorFrame = (() => {
    try {
      const frame = window.frameElement
      return !!(
        frame &&
        frame.classList &&
        (frame.classList.contains('gjs-frame') || frame.classList.contains('gjs-cv-frame'))
      )
    } catch (_error) {
      return false
    }
  })()
  const isPreviewActive = () => root.getAttribute('data-wb-preview-active') === '1'
  const shouldDisableTurn = () => isEditorFrame && !isPreviewActive()

  const runtimeClamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))

  const runtimePlaceholder = (index: number) => {
    const label = `Page ${index + 1}`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" fill="none">
      <defs>
        <linearGradient id="wb_flipbook_runtime_${index}" x1="110" y1="84" x2="1020" y2="1498" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F7FAFC"/>
          <stop offset="1" stop-color="#DDE5EE"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="1600" rx="42" fill="url(#wb_flipbook_runtime_${index})"/>
      <rect x="112" y="138" width="976" height="1324" rx="28" fill="rgba(255,255,255,0.78)" stroke="rgba(15,63,103,0.08)" stroke-width="4"/>
      <path d="M188 278h824" stroke="rgba(15,63,103,0.12)" stroke-width="10" stroke-linecap="round"/>
      <path d="M188 346h640" stroke="rgba(15,63,103,0.09)" stroke-width="8" stroke-linecap="round"/>
      <path d="M188 452h824" stroke="rgba(15,63,103,0.06)" stroke-width="6" stroke-linecap="round"/>
      <path d="M188 506h780" stroke="rgba(15,63,103,0.06)" stroke-width="6" stroke-linecap="round"/>
      <path d="M188 560h700" stroke="rgba(15,63,103,0.06)" stroke-width="6" stroke-linecap="round"/>
      <rect x="188" y="660" width="824" height="520" rx="26" fill="#E7EDF4"/>
      <circle cx="414" cy="920" r="112" fill="#D7E2EE"/>
      <path d="M286 1086L422 950l108 94 190-220 180 262H286Z" fill="#C8D5E2"/>
      <text x="188" y="1304" fill="#0F3F67" font-family="Arial, sans-serif" font-size="74" font-weight="700">${label}</text>
      <text x="188" y="1386" fill="#5F7285" font-family="Arial, sans-serif" font-size="34">Replace this placeholder with your page image.</text>
    </svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }

  const getPages = () =>
    Array.from(root.querySelectorAll('.wb-flipbook__page[data-page-index]')) as HTMLElement[]
  const getPagesHost = () => root.querySelector('.wb-flipbook__pages') as HTMLElement | null
  const getViewport = () => root.querySelector('.wb-flipbook__viewport') as HTMLElement | null
  const getActionButtons = (action: string) =>
    Array.from(root.querySelectorAll(`[data-flipbook-action="${action}"]`)) as HTMLButtonElement[]
  const getPageSelect = () => root.querySelector('[data-flipbook-page-select]') as HTMLSelectElement | null
  const getThumbsHost = () => root.querySelector('[data-flipbook-thumbs]') as HTMLElement | null

  const setActionDisabled = (action: string, disabled: boolean) => {
    getActionButtons(action).forEach((button) => {
      button.disabled = disabled
    })
  }

  const getJQuery = () => {
    const w = window as any
    return w.__wbFlipbookJQuery || w.jQuery || w.$ || null
  }

  const isTurnCompatibleJQuery = ($: any) => {
    const version = `${$?.fn?.jquery || ''}`.trim()
    const major = Number(version.split('.')[0] || 0)
    return !!$?.fn && Number.isFinite(major) && major > 0 && major < 3
  }

  const destroyTurn = () => {
    const $ = getJQuery()
    const pagesHost = getPagesHost()
    suppressTurnMutations = false
    if ($ && pagesHost && $.fn?.turn) {
      try {
        $(pagesHost).turn('destroy')
      } catch (_error) {
        // noop
      }
    }
    if (pagesHost) {
      pagesHost.style.width = ''
      pagesHost.style.height = ''
    }
    root.classList.remove('is-turn-mode')
    usingTurn = false
  }

  const ensureJQuery = () => {
    return new Promise<void>((resolve, reject) => {
      const w = window as any
      if (w.__wbFlipbookJQuery?.fn?.jquery) {
        resolve()
        return
      }

      const current = w.jQuery || w.$
      if (isTurnCompatibleJQuery(current)) {
        w.__wbFlipbookJQuery = current
        resolve()
        return
      }

      const existing = document.querySelector('script[data-wb-flipbook-jquery]') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener(
          'load',
          () => {
            if (w.__wbFlipbookJQuery?.fn?.jquery) resolve()
            else reject(new Error('jQuery script failed'))
          },
          { once: true },
        )
        existing.addEventListener('error', () => reject(new Error('jQuery script failed')), { once: true })
        return
      }

      const prevJQuery = w.jQuery
      const prevDollar = w.$
      const script = document.createElement('script')
      script.src = 'https://code.jquery.com/jquery-1.12.4.min.js'
      script.async = true
      script.setAttribute('data-wb-flipbook-jquery', '1')
      script.onload = () => {
        try {
          const loaded = w.jQuery || w.$
          if (!loaded?.fn?.jquery) {
            throw new Error('jQuery script failed')
          }
          w.__wbFlipbookJQuery =
            typeof loaded.noConflict === 'function' ? loaded.noConflict(true) : loaded
          w.jQuery = prevJQuery
          w.$ = prevDollar
          resolve()
        } catch (error) {
          w.jQuery = prevJQuery
          w.$ = prevDollar
          reject(error instanceof Error ? error : new Error('jQuery script failed'))
        }
      }
      script.onerror = () => {
        w.jQuery = prevJQuery
        w.$ = prevDollar
        reject(new Error('jQuery script failed'))
      }
      document.body.appendChild(script)
    })
  }

  const ensureTurnJs = () => {
    return new Promise<void>((resolve, reject) => {
      ensureJQuery()
        .then(() => {
          const $ = getJQuery()
          if ($?.fn?.turn) {
            resolve()
            return
          }

          const existing = document.querySelector('script[data-wb-turnjs]') as HTMLScriptElement | null
          if (existing) {
            existing.addEventListener(
              'load',
              () => {
                if ($?.fn?.turn) resolve()
                else reject(new Error('turn.js script failed'))
              },
              { once: true },
            )
            existing.addEventListener('error', () => reject(new Error('turn.js script failed')), { once: true })
            return
          }

          const w = window as any
          const prevJQuery = w.jQuery
          const prevDollar = w.$
          w.jQuery = $
          w.$ = $
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js'
          script.async = true
          script.setAttribute('data-wb-turnjs', '1')
          script.onload = () => {
            w.jQuery = prevJQuery
            w.$ = prevDollar
            if ($?.fn?.turn) resolve()
            else reject(new Error('turn.js script failed'))
          }
          script.onerror = () => {
            w.jQuery = prevJQuery
            w.$ = prevDollar
            reject(new Error('turn.js script failed'))
          }
          document.body.appendChild(script)
        })
        .catch(reject)
    })
  }

  const clearState = (page: HTMLElement) => {
    page.classList.remove(
      'is-visible',
      'is-active',
      'is-slot-left',
      'is-slot-right',
      'is-rest-left',
      'is-rest-right',
      'is-animating-out-next-left',
      'is-animating-out-next-right',
      'is-animating-in-next-left',
      'is-animating-in-next-right',
      'is-animating-out-prev-left',
      'is-animating-out-prev-right',
      'is-animating-in-prev-left',
      'is-animating-in-prev-right',
    )
  }

  const getSpreadCount = () => Math.max(1, getPages().length)

  const getCurrentSpread = () => {
    const raw = Number(root.getAttribute('data-active-spread-index'))
    return runtimeClamp(Number.isFinite(raw) ? raw : 0, 0, Math.max(0, getSpreadCount() - 1))
  }

  const getSpreadPages = (spreadIndex: number) => {
    const pages = getPages()
    const safeSpread = runtimeClamp(spreadIndex, 0, Math.max(0, pages.length - 1))
    return {
      left: pages[safeSpread] || null,
      right: null,
      startPage: safeSpread + 1,
      endPage: safeSpread + 1,
    }
  }

  const syncThumbsAndSelect = (start: number, end: number, total: number) => {
    const thumbsHost = getThumbsHost()
    const select = getPageSelect()
    const pages = getPages()

    if (select) {
      const currentValue = String(start)
      const needsRebuild =
        select.options.length !== total ||
        Array.from(select.options).some((option, index) => option.value !== String(index + 1))

      if (needsRebuild) {
        select.innerHTML = ''
        for (let index = 0; index < total; index++) {
          const option = document.createElement('option')
          option.value = String(index + 1)
          option.textContent = `${index + 1} / ${total}`
          select.appendChild(option)
        }
      }
      if (select.value !== currentValue) {
        select.value = currentValue
      }
    }

    if (thumbsHost) {
      const activeSet = new Set<number>()
      for (let page = start; page <= end; page++) activeSet.add(page)

      thumbsHost.innerHTML = ''
      pages.forEach((pageEl, index) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `wb-flipbook__thumb${activeSet.has(index + 1) ? ' is-active' : ''}`
        button.setAttribute('data-page', String(index + 1))

        const img = pageEl.querySelector('.wb-flipbook__page-image') as HTMLImageElement | null
        const thumbImg = document.createElement('img')
        thumbImg.className = 'wb-flipbook__thumb-image'
        thumbImg.src = img?.getAttribute('src') || runtimePlaceholder(index)
        thumbImg.alt = img?.getAttribute('alt') || `Page ${index + 1}`

        const label = document.createElement('span')
        label.className = 'wb-flipbook__thumb-label'
        label.textContent = `Page ${index + 1}`

        button.appendChild(thumbImg)
        button.appendChild(label)
        thumbsHost.appendChild(button)
      })
    }
  }

  const updateControls = (spreadIndex: number) => {
    const total = getPages().length
    const range = getSpreadPages(spreadIndex)

    setActionDisabled('prev', spreadIndex <= 0)
    setActionDisabled('first', spreadIndex <= 0)
    setActionDisabled('next', spreadIndex >= getSpreadCount() - 1)
    setActionDisabled('last', spreadIndex >= getSpreadCount() - 1)
    syncThumbsAndSelect(range.startPage, range.endPage, Math.max(total, 1))
  }

  const renderStatic = (spreadIndex: number) => {
    const pages = getPages()
    const active = getSpreadPages(spreadIndex)

    pages.forEach((page) => {
      clearState(page)
      if (page === active.left) {
        page.classList.add('is-visible', 'is-active')
      }
    })
    updateControls(spreadIndex)
  }

  const finishFlip = (nextSpread: number) => {
    animating = false
    const nextValue = String(nextSpread)
    if (root.getAttribute('data-active-spread-index') !== nextValue) {
      root.setAttribute('data-active-spread-index', nextValue)
    }
    renderStatic(nextSpread)
  }

  const flipTo = (rawSpread: number, direction: 'next' | 'prev') => {
    const nextSpread = runtimeClamp(rawSpread, 0, Math.max(0, getSpreadCount() - 1))
    window.clearTimeout(root._wbFlipbookTimer)
    animating = false
    void direction
    finishFlip(nextSpread)
  }

  const updateTurnControls = () => {
    const $ = getJQuery()
    const pagesHost = getPagesHost()
    if (!$ || !pagesHost || !$.fn?.turn) return

    let currentPage = 1
    try {
      currentPage = Number($(pagesHost).turn('page')) || 1
    } catch (_error) {
      currentPage = 1
    }

    const total = Math.max(1, getPages().length)
    const safePage = runtimeClamp(currentPage, 1, total)

    setActionDisabled('prev', safePage <= 1)
    setActionDisabled('first', safePage <= 1)
    setActionDisabled('next', safePage >= total)
    setActionDisabled('last', safePage >= total)
    syncThumbsAndSelect(safePage, safePage, total)

    const nextSpreadValue = String(Math.max(0, safePage - 1))
    if (root.getAttribute('data-active-spread-index') !== nextSpreadValue) {
      root.setAttribute('data-active-spread-index', nextSpreadValue)
    }
  }

  const getDesiredTurnDisplay = () => 'single'

  const syncTurnDisplay = (pageNumber?: number) => {
    const $ = getJQuery()
    const pagesHost = getPagesHost()
    if (!$ || !pagesHost || !$.fn?.turn) return

    const safePage = runtimeClamp(pageNumber || Number($(pagesHost).turn('page')) || 1, 1, Math.max(1, getPages().length))
    const desiredDisplay = getDesiredTurnDisplay()

    try {
      const currentDisplay = `${$(pagesHost).turn('display') || ''}`.trim()
      if (currentDisplay !== desiredDisplay) {
        $(pagesHost).turn('display', desiredDisplay)
      }
      $(pagesHost).turn('center')
    } catch (_error) {
      // noop
    }
  }

  const getTurnState = () => {
    const $ = getJQuery()
    const pagesHost = getPagesHost()
    if (!$ || !pagesHost || !$.fn?.turn) return null

    try {
      return {
        currentPage: runtimeClamp(
          Number($(pagesHost).turn('page')) || 1,
          1,
          Math.max(1, getPages().length),
        ),
      }
    } catch (_error) {
      return null
    }
  }

  const normalizeTurnTargetPage = (pageNumber: number) => {
    const total = Math.max(1, getPages().length)
    return runtimeClamp(pageNumber, 1, total)
  }

  const setTurnPage = (pageNumber: number) => {
    const $ = getJQuery()
    const pagesHost = getPagesHost()
    if (!$ || !pagesHost || !$.fn?.turn) return false

    const targetPage = normalizeTurnTargetPage(pageNumber)
    syncTurnDisplay(targetPage)

    try {
      $(pagesHost).turn('page', targetPage)
      return true
    } catch (_error) {
      return false
    }
  }

  const initTurn = () => {
    if (shouldDisableTurn()) return false

    const $ = getJQuery()
    const pagesHost = getPagesHost()
    const viewport = getViewport()
    if (!$ || !pagesHost || !viewport || !$.fn?.turn) return false

    destroyTurn()

    const width = Math.max(320, Math.round(viewport.clientWidth || pagesHost.clientWidth || 920))
    const height = Math.max(240, Math.round(viewport.clientHeight || pagesHost.clientHeight || width / 1.56))
    const initialPage = Math.max(1, getCurrentSpread() + 1)

    pagesHost.style.width = `${width}px`
    pagesHost.style.height = `${height}px`

    try {
      suppressTurnMutations = true
      $(pagesHost).turn({
        width,
        height,
        autoCenter: true,
        display: getDesiredTurnDisplay(),
        acceleration: true,
        gradients: true,
        elevation: 48,
        duration: 900,
        page: initialPage,
        when: {
          turning: function (_event: Event, page: number) {
            syncTurnDisplay(Number(page) || initialPage)
            updateTurnControls()
          },
          turned: function (_event: Event, page: number) {
            syncTurnDisplay(Number(page) || initialPage)
            updateTurnControls()
          },
        },
      })
      root.classList.add('is-turn-mode')
      usingTurn = true
      syncTurnDisplay(initialPage)
      updateTurnControls()
      window.setTimeout(() => {
        suppressTurnMutations = false
      }, 120)
      return true
    } catch (_error) {
      suppressTurnMutations = false
      destroyTurn()
      return false
    }
  }

  const scheduleTurnInit = () => {
    window.clearTimeout(root._wbFlipbookTurnTimer)
    root._wbFlipbookTurnTimer = window.setTimeout(() => {
      if (shouldDisableTurn()) {
        destroyTurn()
        renderStatic(getCurrentSpread())
        return
      }

      ensureTurnJs()
        .then(() => {
          if (!initTurn()) {
            renderStatic(getCurrentSpread())
          }
        })
        .catch(() => {
          destroyTurn()
          renderStatic(getCurrentSpread())
        })
    }, 0)
  }

  const goToPage = (pageNumber: number) => {
    const safePage = runtimeClamp(pageNumber, 1, Math.max(1, getPages().length))
    if (usingTurn) {
      if (setTurnPage(safePage)) {
        return
      }
      destroyTurn()
    }
    finishFlip(safePage - 1)
  }

  const onPrev = () => {
    if (usingTurn) {
      const state = getTurnState()
      if (state) {
        const targetPage = state.currentPage - 1
        if (setTurnPage(targetPage)) return
      }
      destroyTurn()
    }
    flipTo(getCurrentSpread() - 1, 'prev')
  }
  const onNext = () => {
    if (usingTurn) {
      const state = getTurnState()
      if (state) {
        const targetPage = state.currentPage + 1
        if (setTurnPage(targetPage)) return
      }
      destroyTurn()
    }
    flipTo(getCurrentSpread() + 1, 'next')
  }
  const onKeydown = (event: Event) => {
    const e = event as KeyboardEvent
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
  }

  const onFirst = () => goToPage(1)
  const onLast = () => goToPage(getPages().length)
  const onBack = () => {
    try {
      window.history.back()
    } catch (_error) {
      // noop
    }
  }
  const onToggleThumbs = () => {
    root.classList.toggle('is-thumbs-open')
  }
  const onSelectChange = (event: Event) => {
    const value = Number((event.target as HTMLSelectElement | null)?.value || 1)
    goToPage(value)
  }
  const onThumbsClick = (event: Event) => {
    const target = event.target as HTMLElement | null
    const button = target?.closest?.('[data-page]') as HTMLElement | null
    if (!button) return
    const page = Number(button.getAttribute('data-page') || 1)
    goToPage(page)
  }

  const bind = () => {
    const actionMap: Record<string, EventListener> = {
      prev: onPrev as EventListener,
      next: onNext as EventListener,
      first: onFirst as EventListener,
      last: onLast as EventListener,
      back: onBack as EventListener,
      thumbs: onToggleThumbs as EventListener,
    }

    Object.entries(actionMap).forEach(([action, handler]) => {
      getActionButtons(action).forEach((button) => {
        button.addEventListener('click', handler)
        handlers.push({ el: button, type: 'click', fn: handler })
      })
    })

    const select = getPageSelect()
    if (select) {
      select.addEventListener('change', onSelectChange)
      handlers.push({ el: select, type: 'change', fn: onSelectChange as EventListener })
    }

    const thumbsHost = getThumbsHost()
    if (thumbsHost) {
      thumbsHost.addEventListener('click', onThumbsClick)
      handlers.push({ el: thumbsHost, type: 'click', fn: onThumbsClick as EventListener })
    }

    root.addEventListener('keydown', onKeydown)
    handlers.push({ el: root, type: 'keydown', fn: onKeydown as EventListener })
  }

  const observer = new MutationObserver((records) => {
    const hasStructureRefresh = records.some((record) => record.attributeName === 'data-flipbook-structure')
    const hasContentRefresh = records.some((record) => record.attributeName === 'data-flipbook-refresh')
    const hasPreviewToggle = records.some((record) => record.attributeName === 'data-wb-preview-active')
    const shouldReinit = records.some((record) => record.attributeName === 'data-page-index')

    if (shouldReinit || hasStructureRefresh || hasPreviewToggle) {
      if (suppressTurnMutations) return
      scheduleTurnInit()
      return
    }

    if (hasContentRefresh) {
      if (usingTurn) {
        if (suppressTurnMutations) return
        scheduleTurnInit()
        return
      }
      renderStatic(getCurrentSpread())
      return
    }

    if (usingTurn) {
      updateTurnControls()
      return
    }

    renderStatic(getCurrentSpread())
  })

  observer.observe(root, {
    attributes: true,
    subtree: true,
    attributeFilter: [
      'src',
      'alt',
      'data-page-index',
      'data-flipbook-refresh',
      'data-flipbook-structure',
      'data-wb-preview-active',
    ],
  })

  bind()
  renderStatic(getCurrentSpread())
  scheduleTurnInit()

  root._wbFlipbookCleanup = () => {
    handlers.forEach((record) => record.el.removeEventListener(record.type, record.fn))
    handlers = []
    observer.disconnect()
    window.clearTimeout(root._wbFlipbookTimer)
    window.clearTimeout(root._wbFlipbookTurnTimer)
    destroyTurn()
  }
}

// 编辑态与导出态共享同一套 runtime，交互限制交给 GrapesJS view 处理。
const flipbookEditorScript = flipbookScript

export function registerFlipbookComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_FLIPBOOK_TYPE)) return

  injectStyleOnce(editor, 'wb-flipbook', FLIPBOOK_CSS)

  if (!domComponents.getType(WB_FLIPBOOK_PAGE_TYPE)) {
    domComponents.addType(WB_FLIPBOOK_PAGE_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.classList?.contains('wb-flipbook__page') ? { type: WB_FLIPBOOK_PAGE_TYPE } : false,
      model: {
        defaults: {
          name: 'Page 1',
          tagName: 'article',
          draggable: false,
          droppable: false,
          selectable: false,
          hoverable: false,
          highlightable: false,
          stylable: false,
          copyable: false,
          removable: false,
          layerable: false,
          badgable: false,
          traits: [
            makeImagePickerTrait('页面图片', 'fbPageImage'),
            makeTextTrait('替代文字', 'fbPageAlt', { placeholder: 'Flipbook page' }),
          ],
          fbPageImage: '',
          fbPageAlt: 'Flipbook page 1',
          attributes: {
            class: 'wb-flipbook__page',
            'data-page-index': '0',
          },
          components: buildPageDef(0).components,
        },
        init(this: any) {
          this.on('change:fbPageImage change:fbPageAlt', this.syncPageContent)
          this.syncPageContent()
        },
        _getFrame(this: any) {
          return this.components?.().at?.(0) ?? null
        },
        _getImage(this: any) {
          return this._getFrame?.()?.components?.().at?.(0) ?? null
        },
        _getNumberBadge(this: any) {
          return this._getFrame?.()?.components?.().at?.(1) ?? null
        },
        syncPageContent(this: any) {
          const index = clamp(Number(this.getAttributes?.()?.['data-page-index']) || 0, 0, 999)
          const image = this._getImage?.()
          image?.addAttributes?.({
            src: getPageImageValue(this, index),
            alt: getPageAltValue(this, index),
          })
        },
        syncPagePosition(this: any) {
          const index = clamp(Number(this.getAttributes?.()?.['data-page-index']) || 0, 0, 999)
          this.set?.('name', `Page ${index + 1}`)
          this._getNumberBadge?.()?.components?.(formatPageNumber(index + 1))
          this.syncPageContent?.()
        },
      },
    })
  }

  domComponents.addType(WB_FLIPBOOK_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'flipbook' ? { type: WB_FLIPBOOK_TYPE } : false,
    model: {
      defaults: {
        name: 'Flipbook',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: FLIPBOOK_CSS,
        attributes: {
          'data-wb-component': 'flipbook',
          class: 'wb-flipbook',
          'data-active-spread-index': '0',
          'data-flipbook-refresh': '0',
          'data-flipbook-structure': '0',
          'data-wb-preview-active': '0',
          tabindex: '0',
        },
        sectionBgColor: '#000000',
        stageBgColor: '#000000',
        accentColor: '#0a3554',
        pageRadius: 22,
        fbPagesVersion: 0,
        traits: [
          { type: 'flipbook-pages', name: 'fbPagesVersion', label: '图片集合', full: true, changeProp: true },
          makeColorPickerTrait('区块背景', 'sectionBgColor'),
          makeColorPickerTrait('舞台背景', 'stageBgColor'),
          makeColorPickerTrait('强调色', 'accentColor'),
          makeNumberTrait('页面圆角', 'pageRadius', { min: 0, max: 36, step: 1 }),
        ],
        script: flipbookEditorScript,
        'script-export': flipbookScript,
        components: buildFlipbookTree(),
      },
      init(this: any) {
        this.set?.('script', flipbookEditorScript, { silent: true })
        this.set?.('script-export', flipbookScript, { silent: true })
        this.ensurePages()
        this.applyStyleVars()
        this.syncPreviewState?.(!!editor.Commands?.isActive?.('core:preview'))

        this._wbFlipbookPreviewRun = () => this.syncPreviewState?.(true)
        this._wbFlipbookPreviewStop = () => this.syncPreviewState?.(false)
        editor.on?.('command:run:core:preview', this._wbFlipbookPreviewRun)
        editor.on?.('command:stop:core:preview', this._wbFlipbookPreviewStop)

        const pagesCollection = this.getPagesCollection?.()
        if (pagesCollection) {
          this.listenTo(pagesCollection, 'add remove reset', this.refreshStructure)
        }

        this.on('change:sectionBgColor change:stageBgColor change:accentColor change:pageRadius', this.applyStyleVars)
        this.refreshStructure()
      },
      _getInner(this: any) {
        return this.components?.().at?.(0) ?? null
      },
      _getStage(this: any) {
        return this._getInner?.()?.components?.().at?.(0) ?? null
      },
      _getViewport(this: any) {
        return findChildByClass(this._getStage?.(), 'wb-flipbook__viewport')
      },
      _getBook(this: any) {
        return findChildByClass(this._getViewport?.(), 'wb-flipbook__book')
      },
      getPagesContainer(this: any) {
        return findChildByClass(this._getBook?.(), 'wb-flipbook__pages')
      },
      getPagesCollection(this: any) {
        return this.getPagesContainer?.()?.components?.() ?? null
      },
      getPageComponent(this: any, index: number) {
        return this.getPagesCollection?.()?.at?.(index) ?? null
      },
      getPagesData(this: any): FlipbookPageData[] {
        const pages = this.getPagesCollection?.()
        if (!pages) return []
        return Array.from({ length: pages.length || 0 }, (_, index) => {
          const page = pages.at(index)
          return {
            image: `${page?.get?.('fbPageImage') || ''}`.trim(),
            alt: `${page?.get?.('fbPageAlt') || ''}`.trim(),
          }
        })
      },
      ensurePages(this: any) {
        const pages = this.getPagesCollection?.()
        if (!pages) return
        if (!pages.length) {
          pages.add(buildPageDef(0))
        }
      },
      bumpRuntimeRefresh(this: any) {
        this.addAttributes?.({
          'data-flipbook-refresh': `${Date.now()}`,
        })
      },
      bumpRuntimeStructure(this: any) {
        this.addAttributes?.({
          'data-flipbook-structure': `${Date.now()}`,
        })
      },
      bumpPagesVersion(this: any) {
        const current = Number(this.get?.('fbPagesVersion') || 0)
        this.set?.('fbPagesVersion', Number.isFinite(current) ? current + 1 : Date.now())
      },
      syncPreviewState(this: any, active: boolean) {
        const nextValue = active ? '1' : '0'
        const currentValue = `${this.getAttributes?.()?.['data-wb-preview-active'] ?? '0'}`
        if (currentValue === nextValue) return
        this.addAttributes?.({ 'data-wb-preview-active': nextValue })
        this.bumpRuntimeStructure?.()
      },
      refreshStructure(this: any) {
        const pages = this.getPagesCollection?.()
        if (!pages) return

        if (!pages.length) {
          pages.add(buildPageDef(0))
        }

        pages.each?.((page: any, index: number) => {
          page.addAttributes?.({
            ...(page.getAttributes?.() || {}),
            class: 'wb-flipbook__page',
            'data-page-index': `${index}`,
          })
          page.syncPagePosition?.()
        })

        const activeIndex = clamp(
          Number(this.getAttributes?.()?.['data-active-spread-index']) || 0,
          0,
          Math.max(0, (pages.length || 1) - 1),
        )
        this.addAttributes?.({ 'data-active-spread-index': `${activeIndex}` })
        this.bumpPagesVersion?.()
        this.bumpRuntimeStructure?.()
      },
      addPageItem(this: any) {
        const pages = this.getPagesCollection?.()
        if (!pages) return
        const created = pages.add(buildPageDef(pages.length || 0))
        this.refreshStructure?.()
        return Array.isArray(created) ? created[0] : created
      },
      updatePageItem(this: any, index: number, patch: Partial<FlipbookPageData>) {
        const page = this.getPageComponent?.(index)
        if (!page) return
        if (patch.image !== undefined) page.set?.('fbPageImage', patch.image)
        if (patch.alt !== undefined) page.set?.('fbPageAlt', patch.alt)
        page.syncPageContent?.()
        this.bumpPagesVersion?.()
        this.bumpRuntimeRefresh?.()
      },
      removePageItem(this: any, index: number) {
        const pages = this.getPagesCollection?.()
        if (!pages || (pages.length || 0) <= 1) return
        const page = pages.at(index)
        if (!page) return
        pages.remove(page)
        this.refreshStructure?.()
      },
      movePageItem(this: any, fromIndex: number, toIndex: number) {
        const pages = this.getPagesCollection?.()
        if (!pages) return
        const total = pages.length || 0
        if (total <= 1) return

        const safeFrom = clamp(fromIndex, 0, total - 1)
        const safeTo = clamp(toIndex, 0, total - 1)
        if (safeFrom === safeTo) return

        const page = pages.at(safeFrom)
        if (!page) return
        pages.remove(page, { silent: true })
        pages.add(page, { at: safeTo })
        this.refreshStructure?.()
      },
      applyStyleVars(this: any) {
        const style = { ...(this.getStyle?.() ?? {}) } as Record<string, string>
        style['--wb-flipbook-section-bg'] =
          this.get('sectionBgColor') || STYLE_VAR_DEFAULTS['--wb-flipbook-section-bg']
        style['--wb-flipbook-stage-bg'] =
          this.get('stageBgColor') || STYLE_VAR_DEFAULTS['--wb-flipbook-stage-bg']
        style['--wb-flipbook-accent'] =
          this.get('accentColor') || STYLE_VAR_DEFAULTS['--wb-flipbook-accent']
        style['--wb-flipbook-page-radius'] = toPx(
          this.get('pageRadius'),
          STYLE_VAR_DEFAULTS['--wb-flipbook-page-radius'],
        )
        this.setStyle(style)
      },
      removed(this: any) {
        if (this._wbFlipbookPreviewRun) {
          editor.off?.('command:run:core:preview', this._wbFlipbookPreviewRun)
        }
        if (this._wbFlipbookPreviewStop) {
          editor.off?.('command:stop:core:preview', this._wbFlipbookPreviewStop)
        }
      },
    },
    view: {
      events() {
        return {
          mousedown: 'onCanvasPointerDown',
          touchstart: 'onCanvasPointerDown',
          click: 'onCanvasClick',
        }
      },
      shouldHandleCanvasSelection(this: any, target: HTMLElement | null) {
        if (!target) return false
        if (editor.Commands?.isActive?.('core:preview')) return false
        if (target.closest('.wb-flipbook__toolbar')) return false
        if (target.closest('.wb-flipbook__thumbs-panel')) return false
        if (target.closest('.wb-flipbook__side-nav')) return false
        return !!(
          target.closest('.wb-flipbook__viewport') ||
          target.closest('.wb-flipbook__book') ||
          target.closest('.wb-flipbook__pages')
        )
      },
      onCanvasPointerDown(this: any, event: MouseEvent | TouchEvent) {
        const target = event.target as HTMLElement | null
        if (!this.shouldHandleCanvasSelection?.(target)) return
        event.preventDefault()
        event.stopPropagation()
      },
      onCanvasClick(this: any, event: MouseEvent) {
        const target = event.target as HTMLElement | null
        if (!this.shouldHandleCanvasSelection?.(target)) return
        event.preventDefault()
        event.stopPropagation()
        editor.select?.(this.model)
      },
    },
  })

  blockManager?.add?.(WB_FLIPBOOK_TYPE, {
    label: 'Flipbook',
    category: 'Media',
    content: { type: WB_FLIPBOOK_TYPE },
    media: BLOCK_ICON,
  })
}
