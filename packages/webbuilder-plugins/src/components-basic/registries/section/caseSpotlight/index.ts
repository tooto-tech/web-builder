import type { Editor } from 'grapesjs'
import { getImageManager } from '../../../traitBridge.js'
import { makeImagePickerTrait, makeLinkTrait, makeTextTrait } from '../../../traitFactory.js'

export const WB_CASE_SPOTLIGHT_TYPE = 'wb-case-spotlight'
const WB_CASE_SPOTLIGHT_IMAGE_FIELD_TYPE = 'wb-case-spotlight-image-field'
const WB_CASE_SPOTLIGHT_TEXT_FIELD_TYPE = 'wb-case-spotlight-text-field'
const WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE = 'wb-case-spotlight-link-field'

type CaseSpotlightItem = {
  image: string
  title: string
  desc: string
  detailHref: string
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3.5" y="4" width="17" height="16" rx="2" />
  <path d="M12 4v16" />
  <path d="M14.5 9.5h3" />
  <path d="M14.5 14.5h3" />
  <path d="M6.5 16l2.8-3.2 1.9 1.8 2.3-3.1" />
</svg>`

const DEFAULT_PREV_ICON_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="13.853058815002441" height="27.67112922668457" viewBox="0 0 13.853058815002441 27.67112922668457"><path d="M11.913871,0L11.047906,0.96959853L0.33041,12.969601Q0.25127888,13.0582,0.18951702,13.159675Q0.12775612,13.261148,0.085408211,13.372135Q0.043060303,13.483124,0.021530151,13.599947Q0,13.716771,0,13.835565Q0,13.954356,0.021530151,14.071182Q0.043060303,14.188006,0.085408211,14.298993Q0.12775612,14.409982,0.18951702,14.511456Q0.25127888,14.61293,0.33041,14.70153L11.047906,26.701529L11.913871,27.671129L13.853059,25.939192L12.987086,24.969601L3.043004,13.835566L12.987084,2.7015278L13.853059,1.7319373L11.913871,0Z" fill-rule="evenodd" fill="#003152" fill-opacity="1"/></svg>',
)}`
const DEFAULT_NEXT_ICON_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="13.853058815002441" height="27.67112922668457" viewBox="0 0 13.853058815002441 27.67112922668457"><path d="M25.76692981500244,0L24.90096481500244,0.96959853L14.183468815002442,12.969601Q14.10433769500244,13.0582,14.042575835002442,13.159675Q13.980814935002442,13.261148,13.938467026002442,13.372135Q13.896119118002442,13.483124,13.874588966002442,13.599947Q13.853058815002441,13.716771,13.853058815002441,13.835565Q13.853058815002441,13.954356,13.874588966002442,14.071182Q13.896119118002442,14.188006,13.938467026002442,14.298993Q13.980814935002442,14.409982,14.042575835002442,14.511456Q14.10433769500244,14.61293,14.183468815002442,14.70153L24.90096481500244,26.701529L25.76692981500244,27.671129L27.706117815002443,25.939192L26.84014481500244,24.969601L16.89606281500244,13.835566L26.84014281500244,2.7015278L27.706117815002443,1.7319373L25.76692981500244,0Z" fill-rule="evenodd" fill="#003152" fill-opacity="1" transform="matrix(-1,0,0,1,27.706117630004883,0)"/></svg>',
)}`

const BROWSE_ARROW_ICON_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M2.5 8h11M9.5 3.5L14 8l-4.5 4.5" stroke="%232d5f86" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
)}`

const CASE_SPOTLIGHT_CSS = `
  .wb-case-spotlight {
    width: 100%;
    background: #f5f6f7;
    overflow: hidden;
  }
  .wb-case-spotlight__shell {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-height: 760px;
    align-items: stretch;
  }
  .wb-case-spotlight__media {
    min-width: 0;
    background: #dadfe5;
    overflow: hidden;
  }
  .wb-case-spotlight__image {
    width: 100%;
    height: 100%;
    display: block;
    min-height: 100%;
    object-fit: cover;
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transform-origin: center center;
    transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
    will-change: transform, opacity;
  }
  .wb-case-spotlight__panel {
    min-width: 0;
    background: #f5f6f7;
    padding: 60px clamp(36px, 4.8vw, 76px) 56px;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 28px;
  }
  .wb-case-spotlight__topbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
  }
  .wb-case-spotlight__eyebrow {
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
    letter-spacing: 0;
    text-transform: uppercase;
    font-weight: 400;
    color: #003152;
  }
  .wb-case-spotlight__browse {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #2d5f86;
    text-decoration: none;
    font-size: 16px;
    line-height: 1.4;
    font-weight: 400;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .wb-case-spotlight__browse:hover {
    opacity: 0.8;
    transform: translateX(1px);
  }
  .wb-case-spotlight__browse-icon {
    display: none;
  }
  .wb-case-spotlight__browse::after {
    content: '';
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    display: block;
    background: url("${BROWSE_ARROW_ICON_URL}") center center / 18px 18px no-repeat;
  }
  .wb-case-spotlight__body {
    width: 100%;
    max-width: 454px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 12px;
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
    will-change: transform, opacity;
  }
  .wb-case-spotlight__title {
    margin: 0;
    font-size: 40px;
    line-height: 1.4;
    letter-spacing: -0.02em;
    font-weight: 600;
    color: #000a11;
  }
  .wb-case-spotlight__desc {
    margin: 0;
    max-width: 420px;
    font-size: 14px;
    line-height: 1.6;
    color: #768389;
  }
  .wb-case-spotlight__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 12px;
  }
  .wb-case-spotlight__btn {
    min-width: 140px;
    min-height: 48px;
    padding: 0 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-size: 16px;
    line-height: 1.4;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .wb-case-spotlight__btn:hover {
    opacity: 0.86;
    transform: translateY(-1px);
  }
  .wb-case-spotlight__btn--primary {
    background: #ffd400;
    border: 1px solid #ffd400;
    color: #101722;
  }
  .wb-case-spotlight__btn--secondary {
    background: transparent;
    border: 1px solid #95adc0;
    color: #2d5f86;
  }
  .wb-case-spotlight__nav {
    display: flex;
    align-items: center;
    gap: 28px;
  }
  .wb-case-spotlight.is-switching-next.is-switching-out .wb-case-spotlight__image,
  .wb-case-spotlight.is-switching-next.is-switching-out .wb-case-spotlight__body {
    opacity: 0;
    transform: translate3d(-20px, 0, 0);
  }
  .wb-case-spotlight.is-switching-prev.is-switching-out .wb-case-spotlight__image,
  .wb-case-spotlight.is-switching-prev.is-switching-out .wb-case-spotlight__body {
    opacity: 0;
    transform: translate3d(20px, 0, 0);
  }
  .wb-case-spotlight.is-switching-next.is-switching-in .wb-case-spotlight__image,
  .wb-case-spotlight.is-switching-next.is-switching-in .wb-case-spotlight__body {
    opacity: 0;
    transform: translate3d(20px, 0, 0);
  }
  .wb-case-spotlight.is-switching-prev.is-switching-in .wb-case-spotlight__image,
  .wb-case-spotlight.is-switching-prev.is-switching-in .wb-case-spotlight__body {
    opacity: 0;
    transform: translate3d(-20px, 0, 0);
  }
  .wb-case-spotlight__nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    transition: opacity 0.22s ease, transform 0.22s ease;
  }
  .wb-case-spotlight__nav-btn:hover {
    opacity: 0.82;
    transform: translateY(-1px);
  }
  .wb-case-spotlight__nav-btn img {
    width: 14px;
    height: 28px;
    display: block;
    object-fit: contain;
  }
  @media (max-width: 1279px) {
    .wb-case-spotlight__shell {
      min-height: 700px;
    }
    .wb-case-spotlight__panel {
      padding: 52px 40px 48px;
      gap: 24px;
    }
    .wb-case-spotlight__title {
      font-size: 36px;
    }
  }
  @media (max-width: 991px) {
    .wb-case-spotlight__shell {
      grid-template-columns: minmax(0, 1fr);
      min-height: 0;
    }
    .wb-case-spotlight__media {
      min-height: 0;
      aspect-ratio: 1 / 1;
    }
    .wb-case-spotlight__panel {
      padding: 28px 32px 40px;
      gap: 32px;
    }
    .wb-case-spotlight__topbar {
      justify-content: flex-start;
    }
    .wb-case-spotlight__browse {
      margin-left: auto;
      align-self: flex-end;
    }
    .wb-case-spotlight__body {
      max-width: 100%;
      align-items: center;
      text-align: center;
      margin: 0 auto;
    }
    .wb-case-spotlight__title {
      font-size: 34px;
    }
    .wb-case-spotlight__desc {
      max-width: 420px;
    }
    .wb-case-spotlight__actions {
      justify-content: center;
    }
    .wb-case-spotlight__nav {
      justify-content: center;
    }
  }
  @media (max-width: 767px) {
    .wb-case-spotlight__media {
      aspect-ratio: 1 / 1;
    }
    .wb-case-spotlight__panel {
      padding: 24px 18px 34px;
      gap: 28px;
    }
    .wb-case-spotlight__eyebrow {
      font-size: 16px;
    }
    .wb-case-spotlight__browse {
      font-size: 16px;
      gap: 8px;
    }
    .wb-case-spotlight__title {
      font-size: 28px;
    }
    .wb-case-spotlight__desc {
      max-width: 296px;
    }
    .wb-case-spotlight__btn {
      min-width: 112px;
      min-height: 46px;
      padding: 0 18px;
      font-size: 14px;
    }
    .wb-case-spotlight__nav {
      gap: 22px;
    }
    .wb-case-spotlight__nav-btn img {
      width: 12px;
      height: 24px;
    }
  }
`

function createTextNode(content: string) {
  return { type: 'textnode', content }
}

function createDefaultCaseItem(index = 0): CaseSpotlightItem {
  const items: CaseSpotlightItem[] = [
    {
      image: 'https://placehold.co/1200x1200/e7ddd3/8e7e6d?text=Luxury+Seaside+Hotel',
      title: 'Luxury Seaside Hotel',
      desc: 'This project involved providing a full range of sanitary ware solutions for a 5-star seaside hotel in Dubai.',
      detailHref: '#',
    },
    {
      image: 'https://placehold.co/1200x1200/d8e2ea/687b8b?text=Business+Center',
      title: 'Premium Business Center',
      desc: 'A complete bathroom package for a high-end office complex, balancing durability, clean lines, and fast installation.',
      detailHref: '#',
    },
    {
      image: 'https://placehold.co/1200x1200/ddd4cb/7a6c5e?text=Urban+Residence',
      title: 'Urban Residential Tower',
      desc: 'Tailored fixture solutions for a large-scale residential project with coordinated finishes across multiple unit types.',
      detailHref: '#',
    },
  ]

  return items[index] ?? {
    image: 'https://placehold.co/1200x1200/dfe4ea/7c8792?text=Case+Image',
    title: `Case ${index + 1}`,
    desc: 'Case description content.',
    detailHref: '#',
  }
}

function normalizeCaseItems(raw: unknown): CaseSpotlightItem[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed) || !parsed.length) {
      return [createDefaultCaseItem(0)]
    }

    const items = parsed.map((item, index) => {
      const fallback = createDefaultCaseItem(index)
      return {
        image: `${item?.image ?? fallback.image}`.trim() || fallback.image,
        title: `${item?.title ?? fallback.title}`.trim() || fallback.title,
        desc: `${item?.desc ?? fallback.desc}`.trim() || fallback.desc,
        detailHref: `${item?.detailHref ?? fallback.detailHref}`.trim() || fallback.detailHref,
      }
    })

    return items.length ? items : [createDefaultCaseItem(0)]
  } catch {
    return [createDefaultCaseItem(0)]
  }
}

function serializeCaseItems(items: CaseSpotlightItem[]): string {
  return JSON.stringify(normalizeCaseItems(items))
}

function extractComponentText(component: any): string {
  const directContent = component?.get?.('content')
  if (typeof directContent === 'string' && !component?.components?.()?.length) {
    return directContent.trim()
  }

  const children = component?.components?.()?.models ?? []
  if (!children.length) return ''

  return children.map((child: any) => {
    if (child?.get?.('type') === 'textnode') {
      return `${child.get?.('content') ?? ''}`
    }
    return extractComponentText(child)
  }).join('').trim()
}

function findChildByClass(model: any, className: string) {
  const children = model?.components?.()?.models ?? []
  return children.find((child: any) => {
    const classes = child?.getClasses?.() ?? []
    return Array.isArray(classes) && classes.includes(className)
  }) ?? null
}

function resolveRoot(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_CASE_SPOTLIGHT_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_CASE_SPOTLIGHT_TYPE) as any
  if (fromSelected?.get?.('type') === WB_CASE_SPOTLIGHT_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_CASE_SPOTLIGHT_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_CASE_SPOTLIGHT_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_CASE_SPOTLIGHT_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_CASE_SPOTLIGHT_TYPE) return traitTarget

  return traitTarget?.closestType?.(WB_CASE_SPOTLIGHT_TYPE) ?? null
}

function setCaseItems(root: any, items: CaseSpotlightItem[]) {
  root.set?.('caseItemsSchema', serializeCaseItems(items))
}

function updateCaseItem(root: any, index: number, patch: Partial<CaseSpotlightItem>) {
  const items = normalizeCaseItems(root?.get?.('caseItemsSchema'))
  if (!items[index]) return
  items[index] = { ...items[index], ...patch }
  setCaseItems(root, items)
}

function getCaseActiveIndex(root: any) {
  const items = normalizeCaseItems(root?.get?.('caseItemsSchema'))
  return Math.max(0, Math.min(Number(root?.get?.('caseActiveIndex')) || 0, items.length - 1))
}

function updateActiveCaseItem(root: any, patch: Partial<CaseSpotlightItem>) {
  updateCaseItem(root, getCaseActiveIndex(root), patch)
}

function addCaseItem(root: any) {
  const items = normalizeCaseItems(root?.get?.('caseItemsSchema'))
  items.push(createDefaultCaseItem(items.length))
  setCaseItems(root, items)
}

function removeCaseItem(root: any, index: number) {
  const items = normalizeCaseItems(root?.get?.('caseItemsSchema'))
  if (items.length <= 1) return
  items.splice(index, 1)
  setCaseItems(root, items)
}

function createIconImageNode(className: string, src: string, alt: string) {
  return {
    tagName: 'img',
    selectable: false,
    hoverable: false,
    highlightable: false,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    attributes: {
      class: className,
      src,
      alt,
      decoding: 'async',
      fetchpriority: 'auto',
    },
  }
}

function getCaseSpotlightNodes(model: any) {
  const shell = model?.components?.()?.at?.(0)
  const media = shell?.components?.()?.at?.(0)
  const image = findChildByClass(media, 'wb-case-spotlight__image')
  const panel = shell?.components?.()?.at?.(1)
  const topbar = panel?.components?.()?.at?.(0)
  const browse = findChildByClass(topbar, 'wb-case-spotlight__browse')
  const body = panel?.components?.()?.at?.(1)
  const title = findChildByClass(body, 'wb-case-spotlight__title')
  const desc = findChildByClass(body, 'wb-case-spotlight__desc')
  const actions = findChildByClass(body, 'wb-case-spotlight__actions')
  const primary = actions?.components?.()?.at?.(0)
  const secondary = actions?.components?.()?.at?.(1)
  const nav = panel?.components?.()?.at?.(2)
  const prevBtn = nav?.components?.()?.at?.(0)
  const nextBtn = nav?.components?.()?.at?.(1)
  const prevIcon = prevBtn?.components?.()?.at?.(0)
  const nextIcon = nextBtn?.components?.()?.at?.(0)

  return {
    shell,
    media,
    image,
    panel,
    topbar,
    browse,
    body,
    title,
    desc,
    actions,
    primary,
    secondary,
    nav,
    prevBtn,
    nextBtn,
    prevIcon,
    nextIcon,
  }
}

function syncCaseSpotlightEditableBindings(root: any) {
  if (root?.__wbCaseSpotlightEditableBound) return

  const {
    image,
    browse,
    primary,
    secondary,
  } = getCaseSpotlightNodes(root)

  if (image) {
    root.listenTo(image, 'change:imageSrc', () => {
      if (root.__wbCaseSpotlightSyncing) return
      updateActiveCaseItem(root, {
        image: `${image.get?.('imageSrc') ?? image.getAttributes?.()?.src ?? ''}`.trim(),
      })
    })
  }

  if (browse) {
    root.listenTo(browse, 'change:fieldHref', () => {
      if (root.__wbCaseSpotlightSyncing) return
      root.set('caseBrowseHref', `${browse.get?.('fieldHref') ?? '#'}`.trim() || '#')
    })
  }

  if (primary) {
    root.listenTo(primary, 'change:fieldHref', () => {
      if (root.__wbCaseSpotlightSyncing) return
      root.set('caseInquiryHref', `${primary.get?.('fieldHref') ?? '#'}`.trim() || '#')
    })
  }

  if (secondary) {
    root.listenTo(secondary, 'change:fieldHref', () => {
      if (root.__wbCaseSpotlightSyncing) return
      updateActiveCaseItem(root, {
        detailHref: `${secondary.get?.('fieldHref') ?? '#'}`.trim() || '#',
      })
    })
  }

  root.__wbCaseSpotlightEditableBound = true
}

function upgradeCaseSpotlightStructure(root: any) {
  const {
    image,
    browse,
    title,
    desc,
    primary,
    secondary,
  } = getCaseSpotlightNodes(root)

  const isUpgraded =
    image?.get?.('type') === WB_CASE_SPOTLIGHT_IMAGE_FIELD_TYPE &&
    title?.get?.('type') === WB_CASE_SPOTLIGHT_TEXT_FIELD_TYPE &&
    desc?.get?.('type') === WB_CASE_SPOTLIGHT_TEXT_FIELD_TYPE &&
    browse?.get?.('type') === WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE &&
    primary?.get?.('type') === WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE &&
    secondary?.get?.('type') === WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE

  if (isUpgraded) return

  const items = normalizeCaseItems(root?.get?.('caseItemsSchema'))
  const activeIndex = getCaseActiveIndex(root)
  const activeItem = items[activeIndex] ?? createDefaultCaseItem(0)

  const nextItems = [...items]
  nextItems[activeIndex] = {
    ...activeItem,
    image: `${image?.getAttributes?.()?.src ?? activeItem.image}`.trim() || activeItem.image,
    title: extractComponentText(title) || activeItem.title,
    desc: extractComponentText(desc) || activeItem.desc,
    detailHref: `${secondary?.getAttributes?.()?.href ?? activeItem.detailHref}`.trim() || activeItem.detailHref,
  }

  root.set('caseItemsSchema', serializeCaseItems(nextItems), { silent: true })
  root.set('caseBrowseText', extractComponentText(browse) || root.get?.('caseBrowseText') || 'View All', { silent: true })
  root.set('caseBrowseHref', `${browse?.getAttributes?.()?.href ?? root.get?.('caseBrowseHref') ?? '#'}`.trim() || '#', { silent: true })
  root.set('caseInquiryText', extractComponentText(primary) || root.get?.('caseInquiryText') || 'Inquiry Now', { silent: true })
  root.set('caseInquiryHref', `${primary?.getAttributes?.()?.href ?? root.get?.('caseInquiryHref') ?? '#'}`.trim() || '#', { silent: true })
  root.set('caseDetailText', extractComponentText(secondary) || root.get?.('caseDetailText') || 'See Details', { silent: true })
  root.components()?.reset(buildCaseSpotlightTree())
}

function commitCaseSpotlightCanvasField(root: any, field: any) {
  if (!root || root.__wbCaseSpotlightSyncing || !field?.get) return

  const caseField = `${field.get('caseField') ?? ''}`.trim()
  const text = extractComponentText(field)

  switch (caseField) {
    case 'title':
      updateActiveCaseItem(root, { title: text || createDefaultCaseItem(0).title })
      break
    case 'desc':
      updateActiveCaseItem(root, { desc: text || createDefaultCaseItem(0).desc })
      break
    case 'browse':
      root.set('caseBrowseText', text || 'View All')
      break
    case 'inquiry':
      root.set('caseInquiryText', text || 'Inquiry Now')
      break
    case 'detail':
      root.set('caseDetailText', text || 'See Details')
      break
    default:
      break
  }
}

function runCaseSpotlightSwitchAnimation(
  element: HTMLElement | null | undefined,
  direction: number,
  onMidpoint: () => void,
) {
  if (!element || typeof window === 'undefined') {
    onMidpoint()
    return
  }

  const root = element as HTMLElement & {
    __wbCaseSpotlightEditorOutTimer?: number
    __wbCaseSpotlightEditorCleanTimer?: number
  }

  if (root.__wbCaseSpotlightEditorOutTimer) {
    window.clearTimeout(root.__wbCaseSpotlightEditorOutTimer)
    root.__wbCaseSpotlightEditorOutTimer = undefined
  }
  if (root.__wbCaseSpotlightEditorCleanTimer) {
    window.clearTimeout(root.__wbCaseSpotlightEditorCleanTimer)
    root.__wbCaseSpotlightEditorCleanTimer = undefined
  }

  root.classList.remove(
    'is-switching-out',
    'is-switching-in',
    'is-switching-next',
    'is-switching-prev',
  )

  const directionClass = direction < 0 ? 'is-switching-prev' : 'is-switching-next'
  root.classList.add(directionClass, 'is-switching-out')

  root.__wbCaseSpotlightEditorOutTimer = window.setTimeout(() => {
    onMidpoint()
    root.classList.remove('is-switching-out')
    root.classList.add('is-switching-in')
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        root.classList.remove('is-switching-in')
      })
    })
    root.__wbCaseSpotlightEditorOutTimer = undefined
  }, 170)

  root.__wbCaseSpotlightEditorCleanTimer = window.setTimeout(() => {
    root.classList.remove('is-switching-next', 'is-switching-prev', 'is-switching-in', 'is-switching-out')
    root.__wbCaseSpotlightEditorCleanTimer = undefined
  }, 520)
}

function buildCaseSpotlightTree() {
  return [
    {
      tagName: 'div',
      name: '双栏容器',
      selectable: false,
      hoverable: false,
      highlightable: false,
      layerable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-case-spotlight__shell' },
      components: [
        {
          tagName: 'div',
          name: '图片区',
          selectable: false,
          hoverable: false,
          highlightable: false,
          layerable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-case-spotlight__media' },
          components: [
            {
              type: WB_CASE_SPOTLIGHT_IMAGE_FIELD_TYPE,
              tagName: 'img',
              selectable: true,
              hoverable: true,
              highlightable: true,
              layerable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              stylable: false,
              caseField: 'image',
              imageSrc: createDefaultCaseItem(0).image,
              imageAlt: createDefaultCaseItem(0).title,
              attributes: {
                class: 'wb-case-spotlight__image',
                src: createDefaultCaseItem(0).image,
                alt: createDefaultCaseItem(0).title,
                decoding: 'async',
                fetchpriority: 'auto',
              },
            },
          ],
        },
        {
          tagName: 'div',
          name: '内容区',
          selectable: false,
          hoverable: false,
          highlightable: false,
          layerable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-case-spotlight__panel' },
          components: [
            {
              tagName: 'div',
              selectable: false,
              layerable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-case-spotlight__topbar' },
              components: [
                {
                  type: WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE,
                  tagName: 'a',
                  selectable: true,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  editable: true,
                  stylable: false,
                  caseField: 'browse',
                  fieldContent: 'View All',
                  fieldHref: '#',
                  attributes: {
                    class: 'wb-case-spotlight__browse',
                    href: '#',
                  },
                  components: [createTextNode('View All')],
                },
              ],
            },
            {
              tagName: 'div',
              selectable: false,
              layerable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-case-spotlight__body' },
              components: [
                {
                  tagName: 'p',
                  selectable: false,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  attributes: { class: 'wb-case-spotlight__eyebrow' },
                  components: [createTextNode('REAL CASES')],
                },
                {
                  tagName: 'h2',
                  type: WB_CASE_SPOTLIGHT_TEXT_FIELD_TYPE,
                  selectable: true,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  editable: true,
                  stylable: false,
                  caseField: 'title',
                  fieldContent: createDefaultCaseItem(0).title,
                  attributes: { class: 'wb-case-spotlight__title' },
                  components: [createTextNode(createDefaultCaseItem(0).title)],
                },
                {
                  tagName: 'p',
                  type: WB_CASE_SPOTLIGHT_TEXT_FIELD_TYPE,
                  selectable: true,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  editable: true,
                  stylable: false,
                  caseField: 'desc',
                  fieldContent: createDefaultCaseItem(0).desc,
                  attributes: { class: 'wb-case-spotlight__desc' },
                  components: [createTextNode(createDefaultCaseItem(0).desc)],
                },
                {
                  tagName: 'div',
                  selectable: false,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  attributes: { class: 'wb-case-spotlight__actions' },
                  components: [
                    {
                      type: WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE,
                      tagName: 'a',
                      selectable: true,
                      layerable: false,
                      draggable: false,
                      droppable: false,
                      copyable: false,
                      removable: false,
                      editable: true,
                      stylable: false,
                      caseField: 'inquiry',
                      fieldContent: 'Inquiry Now',
                      fieldHref: '#',
                      attributes: {
                        class: 'wb-case-spotlight__btn wb-case-spotlight__btn--primary',
                        href: '#',
                      },
                      components: [createTextNode('Inquiry Now')],
                    },
                    {
                      type: WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE,
                      tagName: 'a',
                      selectable: true,
                      layerable: false,
                      draggable: false,
                      droppable: false,
                      copyable: false,
                      removable: false,
                      editable: true,
                      stylable: false,
                      caseField: 'detail',
                      fieldContent: 'See Details',
                      fieldHref: createDefaultCaseItem(0).detailHref,
                      attributes: {
                        class: 'wb-case-spotlight__btn wb-case-spotlight__btn--secondary',
                        href: createDefaultCaseItem(0).detailHref,
                      },
                      components: [createTextNode('See Details')],
                    },
                  ],
                },
              ],
            },
            {
              tagName: 'div',
              selectable: false,
              layerable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-case-spotlight__nav' },
              components: [
                {
                  tagName: 'button',
                  selectable: false,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  attributes: {
                    class: 'wb-case-spotlight__nav-btn',
                    type: 'button',
                    'data-case-nav': 'prev',
                    'aria-label': 'Previous case',
                  },
                  components: [
                    createIconImageNode('wb-case-spotlight__nav-icon', DEFAULT_PREV_ICON_SRC, 'Previous'),
                  ],
                },
                {
                  tagName: 'button',
                  selectable: false,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                  attributes: {
                    class: 'wb-case-spotlight__nav-btn',
                    type: 'button',
                    'data-case-nav': 'next',
                    'aria-label': 'Next case',
                  },
                  components: [
                    createIconImageNode('wb-case-spotlight__nav-icon', DEFAULT_NEXT_ICON_SRC, 'Next'),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

function syncCaseSpotlight(model: any) {
  const items = normalizeCaseItems(model?.get?.('caseItemsSchema'))
  const activeIndex = getCaseActiveIndex(model)
  const activeItem = items[activeIndex] ?? createDefaultCaseItem(0)
  const {
    image,
    browse,
    title,
    desc,
    primary,
    secondary,
    prevIcon,
    nextIcon,
  } = getCaseSpotlightNodes(model)

  const browseHref = `${model.get?.('caseBrowseHref') ?? ''}`.trim() || '#'
  const inquiryHref = `${model.get?.('caseInquiryHref') ?? ''}`.trim() || '#'
  const browseText = `${model.get?.('caseBrowseText') ?? ''}`.trim() || 'View All'
  const inquiryText = `${model.get?.('caseInquiryText') ?? ''}`.trim() || 'Inquiry Now'
  const detailText = `${model.get?.('caseDetailText') ?? ''}`.trim() || 'See Details'
  const prevIconUrl = `${model.get?.('casePrevIconUrl') ?? ''}`.trim() || DEFAULT_PREV_ICON_SRC
  const nextIconUrl = `${model.get?.('caseNextIconUrl') ?? ''}`.trim() || DEFAULT_NEXT_ICON_SRC

  model.addAttributes?.({
    'data-case-items': serializeCaseItems(items),
    'data-active-index': String(activeIndex),
    'data-browse-href': browseHref,
    'data-inquiry-href': inquiryHref,
    'data-prev-icon': prevIconUrl,
    'data-next-icon': nextIconUrl,
  })

  model.__wbCaseSpotlightSyncing = true
  try {
    image?.set?.({
      imageSrc: activeItem.image,
      imageAlt: activeItem.title,
    })
    title?.set?.('fieldContent', activeItem.title)
    desc?.set?.('fieldContent', activeItem.desc)
    browse?.set?.({
      fieldContent: browseText,
      fieldHref: browseHref,
    })
    primary?.set?.({
      fieldContent: inquiryText,
      fieldHref: inquiryHref,
    })
    secondary?.set?.({
      fieldContent: detailText,
      fieldHref: activeItem.detailHref || '#',
    })
    prevIcon?.addAttributes?.({
      src: prevIconUrl,
      alt: 'Previous',
      decoding: 'async',
      fetchpriority: 'auto',
    })
    nextIcon?.addAttributes?.({
      src: nextIconUrl,
      alt: 'Next',
      decoding: 'async',
      fetchpriority: 'auto',
    })
  } finally {
    model.__wbCaseSpotlightSyncing = false
  }
}

function makeCaseSpotlightScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      __wbCaseSpotlightInit?: boolean
      __wbCaseSpotlightRender?: () => void
      __wbCaseSpotlightOutTimer?: number
      __wbCaseSpotlightCleanTimer?: number
    }

    if (root.__wbCaseSpotlightInit) return
    root.__wbCaseSpotlightInit = true

    const fallbackPrev = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20version%3D%221.1%22%20width%3D%2213.853058815002441%22%20height%3D%2227.67112922668457%22%20viewBox%3D%220%200%2013.853058815002441%2027.67112922668457%22%3E%3Cpath%20d%3D%22M11.913871%2C0L11.047906%2C0.96959853L0.33041%2C12.969601Q0.25127888%2C13.0582%2C0.18951702%2C13.159675Q0.12775612%2C13.261148%2C0.085408211%2C13.372135Q0.043060303%2C13.483124%2C0.021530151%2C13.599947Q0%2C13.716771%2C0%2C13.835565Q0%2C13.954356%2C0.021530151%2C14.071182Q0.043060303%2C14.188006%2C0.085408211%2C14.298993Q0.12775612%2C14.409982%2C0.18951702%2C14.511456Q0.25127888%2C14.61293%2C0.33041%2C14.70153L11.047906%2C26.701529L11.913871%2C27.671129L13.853059%2C25.939192L12.987086%2C24.969601L3.043004%2C13.835566L12.987084%2C2.7015278L13.853059%2C1.7319373L11.913871%2C0Z%22%20fill-rule%3D%22evenodd%22%20fill%3D%22%23003152%22%20fill-opacity%3D%221%22/%3E%3C/svg%3E'
    const fallbackNext = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20version%3D%221.1%22%20width%3D%2213.853058815002441%22%20height%3D%2227.67112922668457%22%20viewBox%3D%220%200%2013.853058815002441%2027.67112922668457%22%3E%3Cpath%20d%3D%22M25.76692981500244%2C0L24.90096481500244%2C0.96959853L14.183468815002442%2C12.969601Q14.10433769500244%2C13.0582%2C14.042575835002442%2C13.159675Q13.980814935002442%2C13.261148%2C13.938467026002442%2C13.372135Q13.896119118002442%2C13.483124%2C13.874588966002442%2C13.599947Q13.853058815002441%2C13.716771%2C13.853058815002441%2C13.835565Q13.853058815002441%2C13.954356%2C13.874588966002442%2C14.071182Q13.896119118002442%2C14.188006%2C13.938467026002442%2C14.298993Q13.980814935002442%2C14.409982%2C14.042575835002442%2C14.511456Q14.10433769500244%2C14.61293%2C14.183468815002442%2C14.70153L24.90096481500244%2C26.701529L25.76692981500244%2C27.671129L27.706117815002443%2C25.939192L26.84014481500244%2C24.969601L16.89606281500244%2C13.835566L26.84014281500244%2C2.7015278L27.706117815002443%2C1.7319373L25.76692981500244%2C0Z%22%20fill-rule%3D%22evenodd%22%20fill%3D%22%23003152%22%20fill-opacity%3D%221%22%20transform%3D%22matrix(-1%2C0%2C0%2C1%2C27.706117630004883%2C0)%22/%3E%3C/svg%3E'
    const fallbackItems = [
      {
        image: 'https://placehold.co/1200x1200/e7ddd3/8e7e6d?text=Luxury+Seaside+Hotel',
        title: 'Luxury Seaside Hotel',
        desc: 'This project involved providing a full range of sanitary ware solutions for a 5-star seaside hotel in Dubai.',
        detailHref: '#',
      },
    ]

    const parseItems = () => {
      try {
        const raw = root.getAttribute('data-case-items') || '[]'
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed) || !parsed.length) return fallbackItems
        return parsed.map((item: any) => {
          const fallback = fallbackItems[0]
          return {
            image: `${item?.image ?? fallback.image}`.trim() || fallback.image,
            title: `${item?.title ?? fallback.title}`.trim() || fallback.title,
            desc: `${item?.desc ?? fallback.desc}`.trim() || fallback.desc,
            detailHref: `${item?.detailHref ?? '#'}`.trim() || '#',
          }
        })
      } catch {
        return fallbackItems
      }
    }

    const clampIndex = (index: number, count: number) =>
      Math.max(0, Math.min(Number.isFinite(index) ? index : 0, Math.max(0, count - 1)))

    const resetMotionState = () => {
      if (root.__wbCaseSpotlightOutTimer) {
        window.clearTimeout(root.__wbCaseSpotlightOutTimer)
        root.__wbCaseSpotlightOutTimer = undefined
      }
      if (root.__wbCaseSpotlightCleanTimer) {
        window.clearTimeout(root.__wbCaseSpotlightCleanTimer)
        root.__wbCaseSpotlightCleanTimer = undefined
      }
      root.classList.remove(
        'is-switching-out',
        'is-switching-in',
        'is-switching-next',
        'is-switching-prev',
      )
    }

    const render = () => {
      const items = parseItems()
      const image = root.querySelector('.wb-case-spotlight__image') as HTMLImageElement | null
      const title = root.querySelector('.wb-case-spotlight__title') as HTMLElement | null
      const desc = root.querySelector('.wb-case-spotlight__desc') as HTMLElement | null
      const browse = root.querySelector('.wb-case-spotlight__browse') as HTMLAnchorElement | null
      const primary = root.querySelector('.wb-case-spotlight__btn--primary') as HTMLAnchorElement | null
      const secondary = root.querySelector('.wb-case-spotlight__btn--secondary') as HTMLAnchorElement | null
      const prevBtn = root.querySelector('[data-case-nav="prev"]') as HTMLButtonElement | null
      const nextBtn = root.querySelector('[data-case-nav="next"]') as HTMLButtonElement | null
      const prevIcon = prevBtn?.querySelector('img') as HTMLImageElement | null
      const nextIcon = nextBtn?.querySelector('img') as HTMLImageElement | null

      const currentIndex = clampIndex(Number(root.getAttribute('data-active-index') || '0'), items.length)
      const active = items[currentIndex] || items[0]
      root.setAttribute('data-active-index', String(currentIndex))

      if (image) {
        image.src = active.image
        image.alt = active.title
      }
      if (title) title.textContent = active.title
      if (desc) desc.textContent = active.desc
      if (browse) browse.href = root.getAttribute('data-browse-href') || '#'
      if (primary) primary.href = root.getAttribute('data-inquiry-href') || '#'
      if (secondary) secondary.href = active.detailHref || '#'

      const prevSrc = root.getAttribute('data-prev-icon') || fallbackPrev
      const nextSrc = root.getAttribute('data-next-icon') || fallbackNext
      if (prevIcon) prevIcon.src = prevSrc
      if (nextIcon) nextIcon.src = nextSrc

      const isSwitchable = items.length > 1
      ;[prevBtn, nextBtn].forEach((btn) => {
        if (!btn) return
        btn.style.pointerEvents = isSwitchable ? 'auto' : 'none'
        btn.style.opacity = isSwitchable ? '1' : '0.35'
      })
    }

    const move = (direction: number) => {
      const items = parseItems()
      if (items.length <= 1) return
      const currentIndex = clampIndex(Number(root.getAttribute('data-active-index') || '0'), items.length)
      const nextIndex = (currentIndex + direction + items.length) % items.length
      const directionClass = direction < 0 ? 'is-switching-prev' : 'is-switching-next'

      resetMotionState()
      root.classList.add(directionClass, 'is-switching-out')

      root.__wbCaseSpotlightOutTimer = window.setTimeout(() => {
        root.setAttribute('data-active-index', String(nextIndex))
        root.classList.remove('is-switching-out')
        root.classList.add('is-switching-in')
        render()
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            root.classList.remove('is-switching-in')
          })
        })
      }, 170)

      root.__wbCaseSpotlightCleanTimer = window.setTimeout(() => {
        root.classList.remove('is-switching-next', 'is-switching-prev')
        root.__wbCaseSpotlightCleanTimer = undefined
      }, 520)
    }

    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null
      const navButton = target?.closest?.('[data-case-nav]') as HTMLElement | null
      if (!navButton || !root.contains(navButton)) return
      event.preventDefault()
      move(navButton.getAttribute('data-case-nav') === 'prev' ? -1 : 1)
    })

    root.addEventListener('wb-case-spotlight:refresh', render as EventListener)
    root.__wbCaseSpotlightRender = render
    render()
  }
}

function buildItemCard(root: any, item: CaseSpotlightItem, index: number, trait: any) {
  const card = document.createElement('div')
  card.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa;'

  const commitPatch = (patch: Partial<CaseSpotlightItem>) => {
    updateCaseItem(root, index, patch)
  }

  const bindCommitInput = (
    input: HTMLInputElement | HTMLTextAreaElement,
    getPatch: () => Partial<CaseSpotlightItem>,
    options?: { enterToCommit?: boolean },
  ) => {
    const commit = () => commitPatch(getPatch())
    input.onchange = commit
    input.onblur = commit

    if (options?.enterToCommit) {
      input.onkeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        input.blur()
      }
    }
  }

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;'

  const label = document.createElement('div')
  label.textContent = `案例 ${index + 1}`
  label.style.cssText = 'font-size:12px;font-weight:600;color:#111827;'

  const deleteBtn = document.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.textContent = '删除'
  deleteBtn.style.cssText = 'padding:4px 8px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:999px;font-size:12px;cursor:pointer;'
  deleteBtn.onclick = () => {
    removeCaseItem(root, index)
    trait.trigger?.('change')
  }

  header.appendChild(label)
  header.appendChild(deleteBtn)

  const preview = document.createElement('div')
  preview.style.cssText = 'width:100%;aspect-ratio:1/1;border-radius:8px;overflow:hidden;background:#f3f4f6;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;'

  const previewImg = document.createElement('img')
  previewImg.src = item.image
  previewImg.style.cssText = `width:100%;height:100%;object-fit:cover;display:${item.image ? 'block' : 'none'};`

  const previewEmpty = document.createElement('div')
  previewEmpty.textContent = '暂无图片'
  previewEmpty.style.cssText = `display:${item.image ? 'none' : 'flex'};align-items:center;justify-content:center;color:#9ca3af;font-size:12px;width:100%;height:100%;`

  const syncPreviewState = (src: string) => {
    previewImg.src = src
    previewImg.style.display = src ? 'block' : 'none'
    previewEmpty.style.display = src ? 'none' : 'flex'
  }

  preview.appendChild(previewImg)
  preview.appendChild(previewEmpty)

  const imageRow = document.createElement('div')
  imageRow.style.cssText = 'display:flex;gap:8px;'

  const pickBtn = document.createElement('button')
  pickBtn.type = 'button'
  pickBtn.textContent = '选择图片'
  pickBtn.style.cssText = 'flex:1;padding:6px 10px;border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;border-radius:8px;font-size:12px;cursor:pointer;'
  pickBtn.onclick = () => {
    const im = getImageManager()
    if (!im) return
    const target = {
      selectCallback: (asset: any) => {
        const src = asset?.getSrc?.() ?? asset?.src ?? ''
        if (!src) return
        commitPatch({ image: src })
        syncPreviewState(src)
        imageInput.value = src
      },
    }
    if (typeof im.openAssetsDialogWithTarget === 'function') im.openAssetsDialogWithTarget(target)
    else if (typeof im.openAssetsDialog === 'function') im.openAssetsDialog(target)
  }

  const imageInput = document.createElement('input')
  imageInput.type = 'text'
  imageInput.value = item.image
  imageInput.placeholder = '图片地址'
  imageInput.style.cssText = 'flex:2;padding:6px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;'
  imageInput.oninput = () => syncPreviewState(imageInput.value)
  bindCommitInput(imageInput, () => ({ image: imageInput.value }), { enterToCommit: true })

  const titleInput = document.createElement('input')
  titleInput.type = 'text'
  titleInput.value = item.title
  titleInput.placeholder = '标题'
  titleInput.style.cssText = 'width:100%;padding:6px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;'
  bindCommitInput(titleInput, () => ({ title: titleInput.value }), { enterToCommit: true })

  const descInput = document.createElement('textarea')
  descInput.value = item.desc
  descInput.rows = 4
  descInput.placeholder = '描述'
  descInput.style.cssText = 'width:100%;padding:8px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;resize:vertical;min-height:88px;'
  bindCommitInput(descInput, () => ({ desc: descInput.value }))

  const hrefInput = document.createElement('input')
  hrefInput.type = 'text'
  hrefInput.value = item.detailHref
  hrefInput.placeholder = '详情链接'
  hrefInput.style.cssText = 'width:100%;padding:6px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;'
  bindCommitInput(hrefInput, () => ({ detailHref: hrefInput.value }), { enterToCommit: true })

  imageRow.appendChild(pickBtn)
  imageRow.appendChild(imageInput)

  card.appendChild(header)
  card.appendChild(preview)
  card.appendChild(imageRow)
  card.appendChild(titleInput)
  card.appendChild(descInput)
  card.appendChild(hrefInput)

  return card
}

export function registerCaseSpotlightComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CASE_SPOTLIGHT_TYPE)) return

  if (!domComponents.getType(WB_CASE_SPOTLIGHT_IMAGE_FIELD_TYPE)) {
    domComponents.addType(WB_CASE_SPOTLIGHT_IMAGE_FIELD_TYPE, {
      model: {
        defaults: {
          name: '案例图片',
          tagName: 'img',
          draggable: false,
          droppable: false,
          selectable: true,
          editable: false,
          stylable: false,
          layerable: false,
          copyable: false,
          removable: false,
          imageSrc: '',
          imageAlt: '',
          traits: [
            makeImagePickerTrait('图片', 'imageSrc', { showPreview: true }),
            makeTextTrait('替代文字', 'imageAlt', { placeholder: '图片描述' }),
          ],
        },
        init(this: any) {
          const attrs = this.getAttributes?.() ?? {}
          this.set('imageSrc', `${this.get('imageSrc') ?? attrs.src ?? ''}`, { silent: true })
          this.set('imageAlt', `${this.get('imageAlt') ?? attrs.alt ?? ''}`, { silent: true })
          this.on('change:imageSrc change:imageAlt', this.syncImageField)
          this.syncImageField()
        },
        syncImageField(this: any) {
          this.addAttributes?.({
            src: `${this.get('imageSrc') ?? ''}`.trim(),
            alt: `${this.get('imageAlt') ?? ''}`.trim(),
            decoding: 'async',
            fetchpriority: 'auto',
          })
        },
        openAssetsDialog(this: any) {
          const im = getImageManager()
          if (!im) return
          const target = {
            selectCallback: (asset: any) => {
              const src = asset?.getSrc?.() ?? asset?.src ?? ''
              if (src) this.set('imageSrc', src)
            },
          }
          if (typeof im.openAssetsDialogWithTarget === 'function') im.openAssetsDialogWithTarget(target)
          else if (typeof im.openAssetsDialog === 'function') im.openAssetsDialog(target)
        },
      },
      view: {
        events() {
          return { dblclick: 'onDblClick' }
        },
        onDblClick(this: any, event: MouseEvent) {
          event.preventDefault()
          event.stopPropagation()
          this.model.openAssetsDialog?.()
        },
      },
    })
  }

  if (!domComponents.getType(WB_CASE_SPOTLIGHT_TEXT_FIELD_TYPE)) {
    domComponents.addType(WB_CASE_SPOTLIGHT_TEXT_FIELD_TYPE, {
      extend: 'text',
      model: {
        defaults: {
          draggable: false,
          droppable: false,
          selectable: true,
          editable: true,
          stylable: false,
          layerable: false,
          copyable: false,
          removable: false,
          fieldContent: '',
          traits: [],
        },
        init(this: any) {
          this.__wbCaseSpotlightSyncingField = false
          const initialText = extractComponentText(this)
          if (initialText && !`${this.get('fieldContent') ?? ''}`.trim()) {
            this.set('fieldContent', initialText, { silent: true })
          }
          this.on('change:fieldContent', this.applyFieldContent)
          this.on('change:components', this.syncFieldContentFromCanvas)
        },
        syncFieldContentFromCanvas(this: any) {
          if (this.__wbCaseSpotlightSyncingField) return
          const nextText = extractComponentText(this)
          if (nextText === `${this.get('fieldContent') ?? ''}`) return
          this.__wbCaseSpotlightSyncingField = true
          this.set('fieldContent', nextText)
          this.__wbCaseSpotlightSyncingField = false
        },
        applyFieldContent(this: any) {
          if (this.__wbCaseSpotlightSyncingField) return
          const nextText = `${this.get('fieldContent') ?? ''}`
          if (nextText === extractComponentText(this)) return
          this.__wbCaseSpotlightSyncingField = true
          this.components(nextText)
          this.view?.render?.()
          this.__wbCaseSpotlightSyncingField = false
        },
      },
    })
  }

  if (!domComponents.getType(WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE)) {
    domComponents.addType(WB_CASE_SPOTLIGHT_LINK_FIELD_TYPE, {
      extend: 'text',
      model: {
        defaults: {
          tagName: 'a',
          draggable: false,
          droppable: false,
          selectable: true,
          editable: true,
          stylable: false,
          layerable: false,
          copyable: false,
          removable: false,
          fieldContent: '',
          fieldHref: '#',
          traits: [
            makeLinkTrait({ label: '链接', name: 'fieldHref', placeholder: 'https://' }),
          ],
        },
        init(this: any) {
          this.__wbCaseSpotlightSyncingField = false
          const attrs = this.getAttributes?.() ?? {}
          const initialText = extractComponentText(this)
          if (initialText && !`${this.get('fieldContent') ?? ''}`.trim()) {
            this.set('fieldContent', initialText, { silent: true })
          }
          this.set('fieldHref', `${this.get('fieldHref') ?? attrs.href ?? '#'}`.trim() || '#', { silent: true })
          this.on('change:fieldContent', this.applyFieldContent)
          this.on('change:fieldHref', this.applyFieldHref)
          this.on('change:components', this.syncFieldContentFromCanvas)
          this.applyFieldHref()
        },
        syncFieldContentFromCanvas(this: any) {
          if (this.__wbCaseSpotlightSyncingField) return
          const nextText = extractComponentText(this)
          if (nextText === `${this.get('fieldContent') ?? ''}`) return
          this.__wbCaseSpotlightSyncingField = true
          this.set('fieldContent', nextText)
          this.__wbCaseSpotlightSyncingField = false
        },
        applyFieldContent(this: any) {
          if (this.__wbCaseSpotlightSyncingField) return
          const nextText = `${this.get('fieldContent') ?? ''}`
          if (nextText === extractComponentText(this)) return
          this.__wbCaseSpotlightSyncingField = true
          this.components(nextText)
          this.view?.render?.()
          this.__wbCaseSpotlightSyncingField = false
        },
        applyFieldHref(this: any) {
          this.addAttributes?.({
            href: `${this.get('fieldHref') ?? '#'}`.trim() || '#',
          })
        },
      },
    })
  }

  if (!(editor as any).__wbCaseSpotlightRteBound) {
    editor.on('rte:disable', (view: any) => {
      const field = view?.model
      const root = field?.closestType?.(WB_CASE_SPOTLIGHT_TYPE) as any
      if (!root || root?.get?.('type') !== WB_CASE_SPOTLIGHT_TYPE) return
      commitCaseSpotlightCanvasField(root, field)
    })
    ;(editor as any).__wbCaseSpotlightRteBound = true
  }

  const traitManager = editor.TraitManager as any
  if (traitManager && !traitManager.getType('case-spotlight-items')) {
    traitManager.addType('case-spotlight-items', {
      createInput() {
        const el = document.createElement('div')
        el.style.cssText = 'display:flex;flex-direction:column;gap:12px;width:100%;'
        return el
      },
      onUpdate({ elInput, component, trait }: any) {
        const root = resolveRoot(editor, { target: component }) ?? component
        if (!root) return

        const items = normalizeCaseItems(root.get?.('caseItemsSchema'))
        elInput.innerHTML = ''

        const list = document.createElement('div')
        list.style.cssText = 'display:flex;flex-direction:column;gap:12px;'
        items.forEach((item, index) => {
          list.appendChild(buildItemCard(root, item, index, trait))
        })

        const addBtn = document.createElement('button')
        addBtn.type = 'button'
        addBtn.textContent = '+ 添加案例'
        addBtn.style.cssText = 'width:100%;padding:8px 12px;border:1px dashed #93c5fd;background:#f8fbff;color:#1d4ed8;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;'
        addBtn.onclick = () => {
          addCaseItem(root)
          trait.trigger?.('change')
        }

        elInput.appendChild(list)
        elInput.appendChild(addBtn)
      },
    })
  }

  domComponents.addType(WB_CASE_SPOTLIGHT_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'case-spotlight'
        ? { type: WB_CASE_SPOTLIGHT_TYPE }
        : false,
    model: {
      defaults: {
        name: '案例聚焦',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: CASE_SPOTLIGHT_CSS,
        attributes: {
          'data-wb-component': 'case-spotlight',
          class: 'wb-case-spotlight',
        },
        style: {
          width: '100%',
        },
        caseItemsSchema: serializeCaseItems([
          createDefaultCaseItem(0),
          createDefaultCaseItem(1),
          createDefaultCaseItem(2),
        ]),
        caseActiveIndex: 0,
        caseBrowseText: 'View All',
        caseBrowseHref: '#',
        caseInquiryText: 'Inquiry Now',
        caseInquiryHref: '#',
        caseDetailText: 'See Details',
        casePrevIconUrl: '',
        caseNextIconUrl: '',
        traits: [
          { type: 'case-spotlight-items' as any, name: 'caseItemsAction', label: '案例集合', full: true },
          makeLinkTrait({ name: 'caseBrowseHref', label: '顶部链接', placeholder: '/cases' }),
          makeLinkTrait({ name: 'caseInquiryHref', label: '询盘按钮链接', placeholder: '/contact' }),
          makeTextTrait('上一页 SVG 地址', 'casePrevIconUrl', { placeholder: 'https://example.com/prev.svg' }),
          makeTextTrait('下一页 SVG 地址', 'caseNextIconUrl', { placeholder: 'https://example.com/next.svg' }),
        ],
        script: makeCaseSpotlightScript(),
        'script-export': makeCaseSpotlightScript(),
        components: buildCaseSpotlightTree(),
      },
      init(this: any) {
        upgradeCaseSpotlightStructure(this)
        this.on(
          'change:caseItemsSchema change:caseActiveIndex change:caseBrowseText change:caseBrowseHref ' +
          'change:caseInquiryText change:caseInquiryHref change:caseDetailText change:casePrevIconUrl change:caseNextIconUrl',
          () => syncCaseSpotlight(this),
        )
        syncCaseSpotlightEditableBindings(this)
        syncCaseSpotlight(this)
      },
    },
    view: {
      events() {
        return {
          'click [data-case-nav]': 'onNavClick',
        }
      },
      onNavClick(this: any, event: MouseEvent) {
        const target = event.target as HTMLElement | null
        const navButton = target?.closest?.('[data-case-nav]') as HTMLElement | null
        if (!navButton) return
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation?.()

        const items = normalizeCaseItems(this.model?.get?.('caseItemsSchema'))
        if (items.length <= 1) return

        const direction = navButton.getAttribute('data-case-nav') === 'prev' ? -1 : 1
        const currentIndex = getCaseActiveIndex(this.model)
        const nextIndex = (currentIndex + direction + items.length) % items.length
        runCaseSpotlightSwitchAnimation(this.el, direction, () => {
          this.model.set('caseActiveIndex', nextIndex)
        })
      },
    },
  })

  blockManager?.add?.(WB_CASE_SPOTLIGHT_TYPE, {
    label: '案例聚焦',
    category: 'Section',
    content: { type: WB_CASE_SPOTLIGHT_TYPE },
    media: BLOCK_ICON,
  })
}
