import type { Editor } from 'grapesjs'
import {
  makeLinkTargetTrait,
  makeLinkTrait,
  makeSvgIconPickerTrait,
  makeTextTrait,
  makeTextareaTrait,
} from '../../../traitFactory.js'
import { normalizeSvgMarkup } from '../../../svgIcon.js'

export const WB_SERVICES_SHOWCASE_TYPE = 'wb-services-showcase'
export const WB_SERVICES_SHOWCASE_ITEM_TYPE = 'wb-services-showcase-item'

type ServicesShowcaseItem = {
  icon: string
  title: string
  description: string
  linkUrl?: string
  linkTarget?: string
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="5" width="6" height="6" rx="1.5" />
  <rect x="10.5" y="5" width="6" height="6" rx="1.5" />
  <rect x="18" y="5" width="3" height="6" rx="1.5" />
  <path d="M4 17h12" />
  <path d="M4 20h8" />
</svg>`

const ICON_GRID = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="M409.59 477.88H204.804a102.376 102.376 0 0 1-102.41-102.41V238.94a136.53 136.53 0 0 1 136.53-136.53H375.47a102.376 102.376 0 0 1 102.393 102.394v204.803a68.31 68.31 0 0 1-68.273 68.274M238.923 170.667a68.31 68.31 0 0 0-68.256 68.273v136.53c0 18.857 15.28 34.137 34.137 34.137H409.59V204.804a34.137 34.137 0 0 0-34.12-34.137zM819.197 477.88H614.393a68.31 68.31 0 0 1-68.256-68.274V204.804A102.376 102.376 0 0 1 648.53 102.41h136.53a136.53 136.53 0 0 1 136.53 136.53v136.53a102.376 102.376 0 0 1-102.393 102.41M648.53 170.668a34.137 34.137 0 0 0-34.137 34.137v204.803h204.804a34.137 34.137 0 0 0 34.137-34.137V238.94a68.31 68.31 0 0 0-68.274-68.273zm-273.06 750.94H238.923a136.53 136.53 0 0 1-136.53-136.53V648.53a102.376 102.376 0 0 1 102.41-102.376H409.59a68.31 68.31 0 0 1 68.273 68.257V819.18A102.376 102.376 0 0 1 375.47 921.59M204.786 614.393a34.137 34.137 0 0 0-34.12 34.12V785.06a68.31 68.31 0 0 0 68.257 68.257H375.47a34.137 34.137 0 0 0 34.12-34.137V614.428zM785.06 921.59H648.53a102.376 102.376 0 0 1-102.393-102.41V614.428a68.31 68.31 0 0 1 68.256-68.274h204.804A102.376 102.376 0 0 1 921.59 648.547v136.547a136.53 136.53 0 0 1-136.53 136.53M614.393 614.411V819.18c0 18.857 15.28 34.137 34.137 34.137h136.53a68.31 68.31 0 0 0 68.274-68.257V648.53a34.137 34.137 0 0 0-34.137-34.137z"/></svg>`
const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="m695.467 70.366 130.355 26.231c35.704 7.202 61.645 41.643 61.645 81.8v511.78c0 29.132-13.756 56.131-36.284 71.167l-289.502 193.52c-35.806 23.944-80.657 23.944-116.463 0L155.75 761.36c-22.528-15.053-36.283-42.035-36.283-71.185v-511.83c0-40.157 25.941-74.58 61.645-81.783l130.355-26.197a971.1 971.1 0 0 1 384 0m-10.855 66.014a916.5 916.5 0 0 0-362.29 0l-130.356 26.282c-6.878 1.366-11.861 8.022-11.861 15.736v511.778c0 5.598 2.645 10.82 6.997 13.722l289.485 193.485a47.79 47.79 0 0 0 53.76 0l289.502-193.485a16.38 16.38 0 0 0 6.997-13.722V178.398c0-7.731-5-14.353-11.878-15.753z"/><path d="M688.248 334.968c12.441-12.032 31.283-10.82 42.393 2.713 11.094 13.534 10.377 34.407-1.621 46.968L532.07 582.793c-45.226 45.482-114.62 44.202-158.412-2.987l-83.337-89.685c-11.776-12.971-11.947-34.031-.341-47.207 11.588-13.192 30.6-13.585 42.632-.904l83.32 89.685c20.838 22.426 53.845 23.04 75.35 1.4z"/></svg>`
const ICON_FAILURE = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="M921.6 107.52v809.233c-.41 1.11-.921 2.219-1.143 3.414-5.462 30.242-34.611 52.633-68.71 52.633q-339.9.017-679.8-.085a80.2 80.2 0 0 1-18.808-2.39c-30.788-7.765-50.739-32.477-50.739-62.344V112.674c.717-27.375 21.504-51.422 50.944-58.982 3.618-.922 7.236-1.656 10.854-2.492h695.399c.734.273 1.553.734 2.287.836 29.867 4.608 51.251 22.853 57.958 49.306.512 2.116 1.246 4.147 1.758 6.178M163.567 511.864V904.96c0 10.138 1.963 11.896 13.141 11.896H847.31c1.758 0 3.413.085 5.171-.103 4.13-.358 6.707-2.39 7.424-5.888.427-1.945.427-3.96.427-5.99V119.228c0-10.138-1.963-11.896-13.142-11.896H172.476c-5.274.171-8.26 2.577-8.79 7.373-.204 2.116-.204 4.335-.204 6.451q.136 195.362.102 390.708"/><path d="M521.045 213.93h98.902c32.188-.085 55.637 12.971 68.352 39.288 12.92 26.692 8.106 51.815-14.029 73.25-26.76 25.856-54.101 51.064-81.476 76.459-2.97 2.765-3.277 4.983-1.946 8.465 34.73 88.61 69.376 177.323 104.021 265.933 10.036 25.77 4.608 48.401-16.81 67.994-36.284 33.126-72.363 66.44-108.544 99.669-28.058 25.754-68.13 25.941-96.307.085-37.206-34.048-74.411-68.01-111.395-102.332-20.087-18.585-25.429-40.67-15.889-64.853a62276 62276 0 0 1 105.353-264.653c1.74-4.318 1.229-6.997-2.475-10.308a6229 6229 0 0 1-82.483-77.483c-36.079-34.68-20.31-92.842 29.303-107.912 8.09-2.492 17.016-3.414 25.618-3.499 33.211-.375 66.508-.102 99.823-.102m-.188 55.586h-96.342c-2.355 0-4.812 0-7.168.273-8.192 1.024-12.612 9.472-8.09 15.82 1.127 1.57 2.56 2.85 3.994 4.148 31.966 29.986 63.95 60.075 95.915 90.078 9.54 8.926 12.288 19.234 7.68 30.925-14.029 35.413-28.28 70.929-42.325 106.36a94328 94328 0 0 1-70.81 177.68c-1.331 3.226-1.843 5.888 1.331 8.738 37.206 34.048 74.309 68.096 111.514 102.23 3.994 3.686 5.734 3.584 9.728-.086 36.693-33.672 73.267-67.26 110.063-100.949 2.662-2.39 3.072-4.779 1.74-7.817a751 751 0 0 1-8.191-20.787c-34.85-88.985-69.683-177.869-104.448-266.854-4.096-10.394-1.929-19.968 5.973-28.33 1.621-1.759 3.465-3.414 5.205-5.07 30.96-28.979 61.901-58.06 92.843-87.04 6.366-5.973 6.366-13.619-.512-17.305-2.867-1.553-6.758-1.929-10.24-1.929q-49.015-.102-97.86-.085"/></svg>`
const ICON_COMPASS = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="M512 85.333c235.648 0 426.667 191.019 426.667 426.667S747.648 938.667 512 938.667 85.333 747.648 85.333 512 276.352 85.333 512 85.333m0 85.334c-188.544 0-341.333 152.789-341.333 341.333S323.456 853.333 512 853.333 853.333 700.544 853.333 512 700.544 170.667 512 170.667m149.333 192-85.333 213.333-213.333 85.333 85.333-213.333zM512 469.333 469.333 554.667 554.667 512z"/></svg>`

const DEFAULT_DESCRIPTION =
  'We Evaluate Operating Conditions, Load Profiles And Environmental Risks To Identify The Real Constraints Behind Bearing Failures Or Selection Uncertainty.'

const DEFAULT_ITEMS: ServicesShowcaseItem[] = [
  { icon: ICON_GRID, title: 'Application Analysis', description: DEFAULT_DESCRIPTION },
  { icon: ICON_CHECK, title: 'Bearing Selection', description: DEFAULT_DESCRIPTION },
  { icon: ICON_CHECK, title: 'Custom Engineering', description: DEFAULT_DESCRIPTION },
  { icon: ICON_FAILURE, title: 'Failure Analysis', description: DEFAULT_DESCRIPTION },
  { icon: ICON_COMPASS, title: 'Lubrication Guidance', description: DEFAULT_DESCRIPTION },
]

const SHOWCASE_CSS = `
  .wb-services-showcase {
    --wb-ss-blue: #3C53E8;
    --wb-ss-text: #0C1029;
    --wb-ss-muted: #666;
    --wb-ss-border: #EBEBEB;
    --wb-ss-transition: 0.2s ease-in-out;
    --wb-ss-card-width: 335px;
    position: relative;
    width: 100%;
    overflow: visible;
    padding-bottom: 64px;
  }
  .wb-services-showcase__viewport.swiper {
    width: 100%;
    overflow: visible;
  }
  .wb-services-showcase__track {
    align-items: stretch;
  }
  .wb-services-showcase__slide.swiper-slide {
    width: var(--wb-ss-card-width);
    height: auto;
  }
  .wb-services-showcase__card {
    display: block;
    height: 100%;
    padding: 40px 28px;
    border: 1px solid var(--wb-ss-border);
    border-radius: 12px;
    color: var(--wb-ss-text);
    background: #ffffff;
    text-decoration: none;
    box-sizing: border-box;
    transition: all var(--wb-ss-transition);
    cursor: default;
    position: relative;
  }
  .wb-services-showcase__card::before {
    content: '';
    position: absolute;
    width: 224px;
    height: 49px;
    background: rgba(60, 83, 232, 0.4);
    filter: blur(20px);
    bottom: -25px;
    left: 50%;
    border-radius: 50%;
    opacity: 0;
    visibility: hidden;
    transform: scale(0.6) translateX(-50%);
    transition: .3s ease-in-out;
    transform-origin: top center;
  }
  .wb-services-showcase__card:hover {
    color: #ffffff;
    background: var(--wb-ss-blue);
    border-color: var(--wb-ss-blue);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  }
  .wb-services-showcase__card:hover::before {
    opacity: 1;
    visibility: visible;
    transform: scale(1) translateX(-50%);
  }
  .wb-services-showcase__icon {
    color: var(--wb-ss-blue);
    font-size: 30px;
    margin-bottom: 56px;
  }
  .wb-services-showcase__icon svg {
    display: block;
    width: 60px;
    height: 60px;
  }
  .wb-services-showcase__card:hover .wb-services-showcase__icon {
    color: rgba(255, 255, 255, 0.9);
  }
  .wb-services-showcase__title {
    max-width: 200px;
    margin: 0 0 14px;
    font-size: 24px;
    line-height: 1.25;
    font-weight: 600;
    letter-spacing: 0;
  }
  .wb-services-showcase__desc {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--wb-ss-muted);
  }
  .wb-services-showcase__card:hover .wb-services-showcase__desc {
    color: rgba(255, 255, 255, 0.75);
  }
  .wb-services-showcase__nav {
    position: absolute;
    top: calc(50% - 32px);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border: 0;
    border-radius: 999px;
    color: #000000;
    background: #ffffff;
    box-shadow: 0 -4px 10px 0 rgba(0, 0, 0, 0.11);
    cursor: pointer;
    padding: 20px;
  }
  .wb-services-showcase__nav svg {
    width: 24px;
    height: 24px;
  }
  .wb-services-showcase__nav--prev {
    left: -32px;
  }
  .wb-services-showcase__nav--next {
    right: -32px;
  }
  .wb-services-showcase__progress {
    position: absolute;
    left: 50%;
    bottom: 0;
    display: flex;
    gap: 4px;
    transform: translateX(-50%);
  }
  .wb-services-showcase__bar {
    display: block;
    width: 30px;
    height: 2px;
    border: 0;
    padding: 0;
    border-radius: 0;
    background: rgba(158, 158, 158, 0.5);
    cursor: pointer;
  }
  .wb-services-showcase__bar.is-active {
    background: var(--wb-ss-blue);
  }
  @media (max-width: 767px) {
    .wb-services-showcase {
      --wb-ss-card-width: calc((100% - 12px) / 1.3);
      overflow: hidden;
      box-sizing: border-box;
      padding-bottom: 64px;
    }
    .wb-services-showcase__viewport.swiper {
      overflow: visible;
    }
    .wb-services-showcase__card {
      padding: 20px;
    }
    .wb-services-showcase__icon {
      margin-bottom: 48px;
    }
    .wb-services-showcase__icon svg {
      width: 48px;
      height: 48px;
    }
    .wb-services-showcase__title {
      font-size: 16px;
    }
    .wb-services-showcase__desc {
      font-size: 14px;
    }
    .wb-services-showcase__nav {
      display: none;
    }
    .wb-services-showcase__bar {
      width: 16px;
      height: 1px;
    }
  }
`

const SVG_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'
const SVG_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'

function editable(extra: Record<string, unknown> = {}) {
  return {
    selectable: true,
    draggable: false,
    droppable: false,
    hoverable: true,
    highlightable: true,
    layerable: true,
    stylable: true,
    copyable: false,
    removable: false,
    editable: false,
    ...extra,
  }
}

function editablePart(extra: Record<string, unknown> = {}) {
  return editable({
    copyable: false,
    removable: false,
    ...extra,
  })
}

function locked(extra: Record<string, unknown> = {}) {
  return {
    selectable: false,
    draggable: false,
    droppable: false,
    hoverable: false,
    highlightable: false,
    layerable: false,
    copyable: false,
    removable: false,
    ...extra,
  }
}

function structural(extra: Record<string, unknown> = {}) {
  return {
    selectable: true,
    draggable: false,
    droppable: false,
    hoverable: true,
    highlightable: true,
    layerable: true,
    stylable: false,
    copyable: false,
    removable: false,
    editable: false,
    ...extra,
  }
}

function findChildByClass(model: any, className: string): any {
  const children = model?.components?.()?.models ?? []
  for (const child of children) {
    const attrs = child?.getAttributes?.() || {}
    const classes = String(attrs.class || '').split(/\s+/).filter(Boolean)
    if (classes.includes(className)) return child
    const found = findChildByClass(child, className)
    if (found) return found
  }
  return null
}

function writeText(component: any, value: string): void {
  if (!component) return
  const collection = component.components?.()
  if (collection?.length) collection.reset([])
  component.set?.('content', value)
}

function getInnerHtml(model: any): string {
  const children = model?.components?.()?.models ?? []
  return children
    .map((child: any) => {
      if (typeof child?.toHTML === 'function') return child.toHTML()
      return `${child?.get?.('content') ?? ''}`
    })
    .join('')
    .trim()
}

function syncCardLink(card: any, item: ServicesShowcaseItem): void {
  if (!card) return
  const attrs = { ...(card.getAttributes?.() || {}) }
  const linkUrl = `${item.linkUrl || ''}`.trim()
  const linkTarget = `${item.linkTarget || '_self'}`.trim() || '_self'

  attrs.class = 'wb-services-showcase__card'
  if (linkUrl) {
    attrs.href = linkUrl
    attrs.target = linkTarget
    if (linkTarget === '_blank') {
      attrs.rel = 'noopener noreferrer'
    } else {
      delete attrs.rel
    }
  } else {
    delete attrs.href
    delete attrs.target
    delete attrs.rel
  }

  card.set?.('tagName', 'a')
  card.addAttributes?.(attrs)
}

function buildItemContent(item: ServicesShowcaseItem) {
  return [
    {
      tagName: 'a',
      ...editablePart({
        name: '服务卡片',
        attributes: {
          class: 'wb-services-showcase__card',
          ...(item.linkUrl ? { href: item.linkUrl, target: item.linkTarget || '_self' } : {}),
          ...(item.linkUrl && item.linkTarget === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
      }),
      components: [
        {
          tagName: 'div',
          ...editablePart({ name: '服务图标', attributes: { class: 'wb-services-showcase__icon' } }),
          components: item.icon,
        },
        {
          tagName: 'h3',
          ...editablePart({ name: '服务标题', attributes: { class: 'wb-services-showcase__title' } }),
          content: item.title,
        },
        {
          tagName: 'p',
          ...editablePart({ name: '服务描述', attributes: { class: 'wb-services-showcase__desc' } }),
          content: item.description,
        },
      ],
    },
  ]
}

function buildItemDef(item: ServicesShowcaseItem, index = 0) {
  return {
    type: WB_SERVICES_SHOWCASE_ITEM_TYPE,
    tagName: 'div',
    name: `Services Showcase Item · ${item.title}`,
    selectable: true,
    layerable: true,
    draggable: '.wb-services-showcase__track',
    droppable: false,
    copyable: true,
    removable: true,
    serviceTitle: item.title,
    serviceDescription: item.description,
    serviceIconSvg: item.icon,
    serviceIconSource: '',
    serviceLinkUrl: item.linkUrl || '',
    serviceLinkTarget: item.linkTarget || '_self',
    attributes: {
      class: 'swiper-slide wb-services-showcase__slide',
      'data-wb-component': 'services-showcase-item',
      'data-item-index': String(index),
    },
    components: buildItemContent(item),
  }
}

function getItemTraits() {
  return [
    makeSvgIconPickerTrait('图标', 'serviceIconSvg', { sourceName: 'serviceIconSource' }),
    makeTextTrait('标题', 'serviceTitle', { placeholder: 'Application Analysis' }),
    makeTextareaTrait('描述', 'serviceDescription', { placeholder: 'Service description', rows: 5 }),
    makeLinkTrait({ label: '链接地址', name: 'serviceLinkUrl', placeholder: 'https://example.com' }),
    makeLinkTargetTrait({ label: '打开方式', name: 'serviceLinkTarget' }),
  ]
}

function resolveShowcaseTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_SERVICES_SHOWCASE_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_SERVICES_SHOWCASE_TYPE) as any
  if (fromSelected?.get?.('type') === WB_SERVICES_SHOWCASE_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_SERVICES_SHOWCASE_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_SERVICES_SHOWCASE_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_SERVICES_SHOWCASE_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_SERVICES_SHOWCASE_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_SERVICES_SHOWCASE_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_SERVICES_SHOWCASE_TYPE) return fromTraitTarget

  return null
}

function createAddItemTrait() {
  return {
    type: 'button' as any,
    name: 'add-services-showcase-item',
    label: false as const,
    text: '+ 添加服务卡片',
    full: true,
    command(this: any, editor: Editor) {
      const showcase = resolveShowcaseTarget(editor, this)
      const track = findChildByClass(showcase, 'wb-services-showcase__track')
      const items = track?.components?.()
      if (!items) return

      const selected = editor.getSelected?.() as any
      const selectedItem = selected?.get?.('type') === WB_SERVICES_SHOWCASE_ITEM_TYPE
        ? selected
        : selected?.closestType?.(WB_SERVICES_SHOWCASE_ITEM_TYPE)
      const index = items.length || 0
      const source = selectedItem?.get?.('type') === WB_SERVICES_SHOWCASE_ITEM_TYPE
        ? getItemData(selectedItem)
        : getItemData(items.at?.(Math.max(0, index - 1)))
      const created = items.add(buildItemDef({ ...source, title: `${source.title} Copy` }, index))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

function getExistingIconSvg(model: any): string {
  const iconContainer = findChildByClass(model, 'wb-services-showcase__icon')
  const currentMarkup = getInnerHtml(iconContainer)
  if (!currentMarkup) return ''

  try {
    return normalizeSvgMarkup(currentMarkup)
  } catch {
    return currentMarkup
  }
}

function getItemData(model: any): ServicesShowcaseItem {
  const currentIndex = Number(model.getAttributes?.()?.['data-item-index']) || 0
  const fallback = DEFAULT_ITEMS[currentIndex] || DEFAULT_ITEMS[0]
  return {
    icon: String(model.get?.('serviceIconSvg') ?? fallback.icon),
    title: String(model.get?.('serviceTitle') || '').trim() || fallback.title,
    description: String(model.get?.('serviceDescription') || '').trim() || fallback.description,
    linkUrl: String(model.get?.('serviceLinkUrl') || ''),
    linkTarget: String(model.get?.('serviceLinkTarget') || '_self'),
  }
}

function syncItem(model: any): void {
  const item = getItemData(model)
  const itemName = `Services Showcase Item · ${item.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)

  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'swiper-slide wb-services-showcase__slide',
    'data-wb-component': 'services-showcase-item',
  })

  syncCardLink(findChildByClass(model, 'wb-services-showcase__card'), item)
  writeText(findChildByClass(model, 'wb-services-showcase__title'), item.title)
  writeText(findChildByClass(model, 'wb-services-showcase__desc'), item.description)

  const icon = findChildByClass(model, 'wb-services-showcase__icon')
  if (icon) icon.components?.(item.icon)
}

function buildTree() {
  const progressBars = DEFAULT_ITEMS.map((_, index) => ({
    tagName: 'button',
    ...locked({
      attributes: {
        class: `wb-services-showcase__bar${index === 0 ? ' is-active' : ''}`,
        type: 'button',
        'data-index': String(index),
        'aria-label': `Go to slide ${index + 1}`,
      },
    }),
  }))

  return [
    {
      tagName: 'div',
      ...structural({
        name: '轮播视窗',
        attributes: { class: 'swiper wb-services-showcase__viewport' },
      }),
      components: [
        {
          tagName: 'div',
          ...structural({
            name: '卡片轨道',
            droppable: '.wb-services-showcase__slide',
            attributes: { class: 'swiper-wrapper wb-services-showcase__track' },
          }),
          components: DEFAULT_ITEMS.map((item, index) => buildItemDef(item, index)),
        },
      ],
    },
    {
      tagName: 'button',
      ...locked({ attributes: { class: 'wb-services-showcase__nav wb-services-showcase__nav--prev', type: 'button', 'aria-label': 'Previous slide' } }),
      components: SVG_PREV,
    },
    {
      tagName: 'button',
      ...locked({ attributes: { class: 'wb-services-showcase__nav wb-services-showcase__nav--next', type: 'button', 'aria-label': 'Next slide' } }),
      components: SVG_NEXT,
    },
    {
      tagName: 'div',
      ...locked({ attributes: { class: 'wb-services-showcase__progress', 'aria-hidden': 'true' } }),
      components: progressBars,
    },
  ]
}

export function registerServicesShowcaseComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_SERVICES_SHOWCASE_TYPE)) return

  domComponents.addType(WB_SERVICES_SHOWCASE_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'services-showcase-item'
        ? { type: WB_SERVICES_SHOWCASE_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Services Showcase Item',
        tagName: 'div',
        selectable: true,
        layerable: true,
        draggable: '.wb-services-showcase__track',
        droppable: false,
        copyable: true,
        removable: true,
        serviceTitle: 'Application Analysis',
        serviceDescription: DEFAULT_DESCRIPTION,
        serviceIconSvg: ICON_GRID,
        serviceIconSource: '',
        serviceLinkUrl: '',
        serviceLinkTarget: '_self',
        traits: getItemTraits(),
      },
      init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(buildItemContent(getItemData(this)))
        }
        const existingIcon = getExistingIconSvg(this)
        const iconValue = String(this.get?.('serviceIconSvg') || '').trim()
        if (existingIcon && (!iconValue || iconValue === ICON_GRID)) {
          this.set?.('serviceIconSvg', existingIcon, { silent: true })
        }
        this.listenTo(
          this,
          'change:serviceTitle change:serviceDescription change:serviceIconSvg change:serviceLinkUrl change:serviceLinkTarget',
          () => syncItem(this),
        )
        syncItem(this)
      },
    },
  })

  domComponents.addType(WB_SERVICES_SHOWCASE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'services-showcase'
        ? { type: WB_SERVICES_SHOWCASE_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Services Showcase',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'services-showcase',
          class: 'wb-services-showcase',
        },
        script: function () {
          const root = this as any
          let resizeRaf = 0
          let observer: MutationObserver | null = null
          let disposed = false

          const ensureAssets = () =>
            new Promise<void>((resolve) => {
              const w = window as any
              if (w.Swiper) {
                resolve()
                return
              }

              if (!document.querySelector('link[data-wb-swiper]')) {
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
                link.setAttribute('data-wb-swiper', '1')
                document.head.appendChild(link)
              }

              const existing = document.querySelector('script[data-wb-swiper]') as HTMLScriptElement | null
              if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true })
                return
              }

              const script = document.createElement('script')
              script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
              script.async = true
              script.setAttribute('data-wb-swiper', '1')
              script.onload = () => resolve()
              document.body.appendChild(script)
            })

          const getSlides = () =>
            Array.from(root.querySelectorAll('.wb-services-showcase__slide')) as HTMLElement[]

          const getOffsetAfter = () => {
            const slides = getSlides()
            if (!slides.length) return 0
            const slideWidth = slides[0].getBoundingClientRect().width || 0
            const viewport = root.querySelector('.wb-services-showcase__viewport') as HTMLElement | null
            const viewportWidth = viewport?.getBoundingClientRect().width || root.getBoundingClientRect().width || 0
            return Math.max(0, viewportWidth - slideWidth)
          }

          const normalizeIndex = (index: number) => {
            const max = Math.max(0, getSlides().length - 1)
            return Math.max(0, Math.min(max, Number(index) || 0))
          }

          const getVisualIndex = () => {
            const swiper = root._wbServicesShowcaseSwiper
            const slides = getSlides()
            if (!slides.length) return 0
            const translate = Math.abs(Number(swiper?.translate || 0))
            let bestIndex = 0
            let bestDistance = Number.POSITIVE_INFINITY
            slides.forEach((slide, index) => {
              const distance = Math.abs((slide.offsetLeft || 0) - translate)
              if (distance < bestDistance) {
                bestDistance = distance
                bestIndex = index
              }
            })
            return normalizeIndex(bestIndex)
          }

          const renderProgress = () => {
            const progress = root.querySelector('.wb-services-showcase__progress') as HTMLElement | null
            const swiper = root._wbServicesShowcaseSwiper
            const slides = getSlides()
            if (!progress || !swiper || !slides.length) return

            if (progress.querySelectorAll('.wb-services-showcase__bar').length !== slides.length) {
              progress.innerHTML = slides
                .map((_, index) => `<button class="wb-services-showcase__bar" type="button" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>`)
                .join('')
              progress.querySelectorAll('.wb-services-showcase__bar').forEach((bar) => {
                bar.addEventListener('click', () => {
                  swiper.slideTo?.(Number((bar as HTMLElement).dataset.index || 0), 360, false)
                })
              })
            }

            const activeIndex = getVisualIndex()
            progress.querySelectorAll('.wb-services-showcase__bar').forEach((bar, index) => {
              bar.classList.toggle('is-active', index === activeIndex)
            })
          }

          const updateSwiper = () => {
            const swiper = root._wbServicesShowcaseSwiper
            if (!swiper) return
            swiper.params.slidesOffsetAfter = getOffsetAfter()
            swiper.update?.()
            renderProgress()
          }

          const scheduleUpdate = () => {
            cancelAnimationFrame(resizeRaf)
            resizeRaf = window.requestAnimationFrame(updateSwiper)
          }

          const init = () => {
            const w = window as any
            if (!w.Swiper || disposed) return
            const viewport = root.querySelector('.wb-services-showcase__viewport') as HTMLElement | null
            const prevEl = root.querySelector('.wb-services-showcase__nav--prev') as HTMLElement | null
            const nextEl = root.querySelector('.wb-services-showcase__nav--next') as HTMLElement | null
            if (!viewport) return

            root._wbServicesShowcaseSwiper?.destroy?.(true, true)
            root._wbServicesShowcaseSwiper = new w.Swiper(viewport, {
              slidesPerView: 'auto',
              spaceBetween: 24,
              slidesPerGroup: 1,
              loop: false,
              rewind: false,
              resistanceRatio: 0,
              slidesOffsetBefore: 0,
              slidesOffsetAfter: getOffsetAfter(),
              watchOverflow: false,
              observer: true,
              observeParents: true,
              resizeObserver: true,
              navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
              breakpoints: {
                0: {
                  spaceBetween: 12,
                },
                768: {
                  spaceBetween: 24,
                },
              },
              on: {
                init() {
                  renderProgress()
                },
                setTranslate() {
                  renderProgress()
                },
                slideChange() {
                  renderProgress()
                },
                transitionEnd() {
                  renderProgress()
                },
                resize() {
                  updateSwiper()
                },
              },
            })

            const track = root.querySelector('.wb-services-showcase__track') as HTMLElement | null
            if (track) {
              observer = new MutationObserver(scheduleUpdate)
              observer.observe(track, { childList: true, subtree: false })
            }
            window.addEventListener('resize', scheduleUpdate)
            window.setTimeout(updateSwiper, 80)
          }

          ensureAssets().then(init)

          root._wbServicesShowcaseCleanup = function () {
            disposed = true
            cancelAnimationFrame(resizeRaf)
            observer?.disconnect()
            window.removeEventListener('resize', scheduleUpdate)
            root._wbServicesShowcaseSwiper?.destroy?.(true, true)
            root._wbServicesShowcaseSwiper = null
          }
        },
        styles: SHOWCASE_CSS,
        traits: [createAddItemTrait()],
        components: buildTree(),
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_SERVICES_SHOWCASE_TYPE || type === WB_SERVICES_SHOWCASE_ITEM_TYPE) return
  })

  blockManager?.add?.(WB_SERVICES_SHOWCASE_TYPE, {
    label: 'Services Showcase',
    category: 'Section',
    content: { type: WB_SERVICES_SHOWCASE_TYPE },
    media: BLOCK_ICON,
  })
}
