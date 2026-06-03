import type { Editor } from 'grapesjs'
import {
  makeLinkTargetTrait,
  makeLinkTrait,
  makeSvgIconPickerTrait,
  makeTextTrait,
  makeTextareaTrait,
} from '../../../traitFactory.js'
import { normalizeSvgMarkup } from '../../../svgIcon.js'

export const WB_SERVICES_CAROUSEL_TYPE = 'wb-services-carousel'
export const WB_SERVICES_CAROUSEL_ITEM_TYPE = 'wb-services-carousel-item'

type ServicesCarouselItem = {
  icon: string
  title: string
  description: string
  linkUrl?: string
  linkTarget?: string
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 7h16" />
  <path d="M7 7v10" />
  <path d="M17 7v10" />
  <path d="M4 17h16" />
  <path d="M10 12h4" />
</svg>`

const ICON_GRID = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="M409.59 477.88H204.804a102.376 102.376 0 0 1-102.41-102.41V238.94a136.53 136.53 0 0 1 136.53-136.53H375.47a102.376 102.376 0 0 1 102.393 102.394v204.803a68.31 68.31 0 0 1-68.273 68.274M238.923 170.667a68.31 68.31 0 0 0-68.256 68.273v136.53c0 18.857 15.28 34.137 34.137 34.137H409.59V204.804a34.137 34.137 0 0 0-34.12-34.137zM819.197 477.88H614.393a68.31 68.31 0 0 1-68.256-68.274V204.804A102.376 102.376 0 0 1 648.53 102.41h136.53a136.53 136.53 0 0 1 136.53 136.53v136.53a102.376 102.376 0 0 1-102.393 102.41M648.53 170.668a34.137 34.137 0 0 0-34.137 34.137v204.803h204.804a34.137 34.137 0 0 0 34.137-34.137V238.94a68.31 68.31 0 0 0-68.274-68.273zm-273.06 750.94H238.923a136.53 136.53 0 0 1-136.53-136.53V648.53a102.376 102.376 0 0 1 102.41-102.376H409.59a68.31 68.31 0 0 1 68.273 68.257V819.18A102.376 102.376 0 0 1 375.47 921.59M204.786 614.393a34.137 34.137 0 0 0-34.12 34.12V785.06a68.31 68.31 0 0 0 68.257 68.257H375.47a34.137 34.137 0 0 0 34.12-34.137V614.428zM785.06 921.59H648.53a102.376 102.376 0 0 1-102.393-102.41V614.428a68.31 68.31 0 0 1 68.256-68.274h204.804A102.376 102.376 0 0 1 921.59 648.547v136.547a136.53 136.53 0 0 1-136.53 136.53M614.393 614.411V819.18c0 18.857 15.28 34.137 34.137 34.137h136.53a68.31 68.31 0 0 0 68.274-68.257V648.53a34.137 34.137 0 0 0-34.137-34.137z"/></svg>`

const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="m695.467 70.366 130.355 26.231c35.704 7.202 61.645 41.643 61.645 81.8v511.78c0 29.132-13.756 56.131-36.284 71.167l-289.502 193.52c-35.806 23.944-80.657 23.944-116.463 0L155.75 761.36c-22.528-15.053-36.283-42.035-36.283-71.185v-511.83c0-40.157 25.941-74.58 61.645-81.783l130.355-26.197a971.1 971.1 0 0 1 384 0m-10.855 66.014a916.5 916.5 0 0 0-362.29 0l-130.356 26.282c-6.878 1.366-11.861 8.022-11.861 15.736v511.778c0 5.598 2.645 10.82 6.997 13.722l289.485 193.485a47.79 47.79 0 0 0 53.76 0l289.502-193.485a16.38 16.38 0 0 0 6.997-13.722V178.398c0-7.731-5-14.353-11.878-15.753z"/><path d="M688.248 334.968c12.441-12.032 31.283-10.82 42.393 2.713 11.094 13.534 10.377 34.407-1.621 46.968L532.07 582.793c-45.226 45.482-114.62 44.202-158.412-2.987l-83.337-89.685c-11.776-12.971-11.947-34.031-.341-47.207 11.588-13.192 30.6-13.585 42.632-.904l83.32 89.685c20.838 22.426 53.845 23.04 75.35 1.4z"/></svg>`

const ICON_FAILURE = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="M921.6 107.52v809.233c-.41 1.11-.921 2.219-1.143 3.414-5.462 30.242-34.611 52.633-68.71 52.633q-339.9.017-679.8-.085a80.2 80.2 0 0 1-18.808-2.39c-30.788-7.765-50.739-32.477-50.739-62.344V112.674c.717-27.375 21.504-51.422 50.944-58.982 3.618-.922 7.236-1.656 10.854-2.492h695.399c.734.273 1.553.734 2.287.836 29.867 4.608 51.251 22.853 57.958 49.306.512 2.116 1.246 4.147 1.758 6.178M163.567 511.864V904.96c0 10.138 1.963 11.896 13.141 11.896H847.31c1.758 0 3.413.085 5.171-.103 4.13-.358 6.707-2.39 7.424-5.888.427-1.945.427-3.96.427-5.99V119.228c0-10.138-1.963-11.896-13.142-11.896H172.476c-5.274.171-8.26 2.577-8.79 7.373-.204 2.116-.204 4.335-.204 6.451q.136 195.362.102 390.708"/><path d="M521.045 213.93h98.902c32.188-.085 55.637 12.971 68.352 39.288 12.92 26.692 8.106 51.815-14.029 73.25-26.76 25.856-54.101 51.064-81.476 76.459-2.97 2.765-3.277 4.983-1.946 8.465 34.73 88.61 69.376 177.323 104.021 265.933 10.036 25.77 4.608 48.401-16.81 67.994-36.284 33.126-72.363 66.44-108.544 99.669-28.058 25.754-68.13 25.941-96.307.085-37.206-34.048-74.411-68.01-111.395-102.332-20.087-18.585-25.429-40.67-15.889-64.853a62276 62276 0 0 1 105.353-264.653c1.74-4.318 1.229-6.997-2.475-10.308a6229 6229 0 0 1-82.483-77.483c-36.079-34.68-20.31-92.842 29.303-107.912 8.09-2.492 17.016-3.414 25.618-3.499 33.211-.375 66.508-.102 99.823-.102m-.188 55.586h-96.342c-2.355 0-4.812 0-7.168.273-8.192 1.024-12.612 9.472-8.09 15.82 1.127 1.57 2.56 2.85 3.994 4.148 31.966 29.986 63.95 60.075 95.915 90.078 9.54 8.926 12.288 19.234 7.68 30.925-14.029 35.413-28.28 70.929-42.325 106.36a94328 94328 0 0 1-70.81 177.68c-1.331 3.226-1.843 5.888 1.331 8.738 37.206 34.048 74.309 68.096 111.514 102.23 3.994 3.686 5.734 3.584 9.728-.086 36.693-33.672 73.267-67.26 110.063-100.949 2.662-2.39 3.072-4.779 1.74-7.817a751 751 0 0 1-8.191-20.787c-34.85-88.985-69.683-177.869-104.448-266.854-4.096-10.394-1.929-19.968 5.973-28.33 1.621-1.759 3.465-3.414 5.205-5.07 30.96-28.979 61.901-58.06 92.843-87.04 6.366-5.973 6.366-13.619-.512-17.305-2.867-1.553-6.758-1.929-10.24-1.929q-49.015-.102-97.86-.085"/></svg>`

const SVG_PREV = `<svg viewBox="0 0 1464 1024" width="24" height="24"><path fill="currentColor" d="M64.78790437 474.21653375L523.76772655 47.6696075a60.34692375 60.34692375 0 0 1 80.88203719 0c22.30834125 20.76391781 22.30834125 54.3980325 0 75.16195031L241.25260405 460.54552437h1123.196385c30.48806625 0 55.14164344 22.93755094 55.14164344 51.25198407 0 28.2572325-24.65357719 51.19478344-55.14164344 51.19478343H241.25260405l363.39715969 337.7139675c22.30834125 20.76391781 22.30834125 54.3980325 0 75.16194938a59.31730781 59.31730781 0 0 1-40.44101812 15.55863844c-14.64342375 0-29.28684844-5.14807875-40.44101907-15.55863844L64.78790437 549.37848406a50.50837312 50.50837312 0 0 1 0-75.16195031z"></path></svg>`

const SVG_NEXT = `<svg viewBox="0 0 1464 1024" width="24" height="24"><path fill="currentColor" d="M1398.39594291 549.62127313l-459.29371781 426.78140062a60.38819437 60.38819437 0 0 1-80.9373525 0 50.54291531 50.54291531 0 0 1 0-75.21335344L1221.81055885 563.24439125H97.84602197c-30.45167719 0-55.17935531-22.89599813-55.17935531-51.22979531s24.72767813-51.28703531 55.17935531-51.28703531H1221.81055885l-363.64568625-337.94492907a50.54291531 50.54291531 0 0 1 0-75.21335343c11.16179906-10.36043906 25.81523719-15.56927813 40.46867625-15.56927813 14.65343906 0 29.30687719 5.15159906 40.46867625 15.56927813l459.29371781 426.83864156c22.38083813 20.77811813 22.38083813 54.37799531 0 75.21335344z"></path></svg>`

const DEFAULT_DESCRIPTION =
  'We Evaluate Operating Conditions, Load Profiles And Environmental Risks To Identify The Real Constraints Behind Bearing Failures Or Selection Uncertainty.'

const DEFAULT_ITEMS: ServicesCarouselItem[] = [
  { icon: ICON_GRID, title: 'Application Analysis', description: DEFAULT_DESCRIPTION },
  { icon: ICON_CHECK, title: 'Bearing Selection', description: DEFAULT_DESCRIPTION },
  { icon: ICON_CHECK, title: 'Custom Engineering', description: DEFAULT_DESCRIPTION },
  { icon: ICON_FAILURE, title: 'Failure Analysis', description: DEFAULT_DESCRIPTION },
]

const SERVICES_MOBILE_SLIDE_WIDTH = 'calc((100% - 12px) / 1.3)'

const SERVICES_CAROUSEL_CSS = `
  :root {
    --primary-blue: #3C53E8;
    --dark-blue: #080E2B;
    --text-dark: #0C1029;
    --text-gray: #666;
    --bg-light: #f8f9fa;
    --transition: 0.2s ease-in-out;
  }

  /* Services Swiper */
  .services__swiper.swiper {
    width: 100%;
    overflow: visible;
    padding-bottom: 64px;
    --swiper-pagination-bullet-horizontal-gap: 2px;
    --swiper-pagination-bullet-border-radius: 0;
    --swiper-pagination-bullet-width: 30px;
    --swiper-pagination-bullet-height: 2px;
    --swiper-pagination-color: var(--primary-blue);
    --swiper-pagination-bullet-inactive-color: #9E9E9E;
    --swiper-pagination-bullet-opacity: 1;
    --swiper-pagination-bullet-inactive-opacity: 0.5;
    --swiper-pagination-bottom: 0;
    --swiper-navigation-sides-offset: -32px;
    --swiper-navigation-top-offset: calc(50% - 32px);
    --swiper-navigation-color: #000000;
    --swiper-navigation-size: 56px;
  }
  .services__swiper .services__card {
    height: 100%;
  }
  .services__swiper .swiper-slide {
    height: auto;
    width: 335px;
  }
  .services__swiper.swiper .swiper-button-prev,
  .services__swiper.swiper .swiper-button-next {
    height: 64px;
    width: 64px;
    padding: 20px;
    box-shadow: 0 -4px 10px 0 rgba(0, 0, 0, 0.11);
    background-color: #ffffff;
    border-radius: 999px;
    opacity: 0;
    visibility: hidden;
    transition: .2s ease-in-out;
  }
  .services__swiper.swiper:hover .swiper-button-prev,
  .services__swiper.swiper:hover .swiper-button-next{
    opacity: 1;
    visibility: visible;
  }
  .services__swiper.swiper .swiper-button-prev::after,
  .services__swiper.swiper .swiper-button-next::after {
    display: none;
  }
  .services__swiper .swiper-pagination {
    bottom: 8px;
    display: flex;
    justify-content: center;
  }
  .services__card {
    display: block;
    border: 1px solid #EBEBEB;
    padding: 40px 28px;
    border-radius: 12px;
    transition: all var(--transition);
    cursor: default;
    position: relative;
    color: inherit;
    text-decoration: none;
  }
  .services__card::before {
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
  @media (min-width: 769px) {
    .services__card:hover {
      background: var(--primary-blue);
      color: #fff;
      border-color: var(--primary-blue);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    }
    .services__card:hover::before {
      opacity: 1;
      visibility: visible;
      transform: scale(1) translateX(-50%);
    }
  }
  .services__card-icon {
    font-size: 30px;
    margin-bottom: 56px;
    color: var(--primary-blue);
  }
  @media (min-width: 769px) {
    .services__card:hover .services__card-icon {
      color: rgba(255, 255, 255, 0.9);
    }
  }
  .services__card-title {
    margin-bottom: 14px;
    font-size: 24px;
    font-weight: 600;
    max-width: 200px;
    line-height: 1.25;
  }
  .services__card-desc {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-gray);
  }
  @media (min-width: 769px) {
    .services__card:hover .services__card-desc {
      color: rgba(255, 255, 255, 0.75);
    }
  }
  @media (max-width: 767px) {
    /* Services Swiper — hide arrows on mobile */
    .services__swiper .swiper-button-prev,
    .services__swiper .swiper-button-next {
      display: none;
    }
    .services__swiper .swiper-slide {
      flex: 0 0 ${SERVICES_MOBILE_SLIDE_WIDTH};
      width: ${SERVICES_MOBILE_SLIDE_WIDTH};
    }
    .services__card {
      padding: 20px;
    }
    .services__card-icon {
      margin-bottom: 48px;
    }
    .services__card-title {
      font-size: 16px;
    }
    .services__card-desc {
      font-size: 14px;
    }
    .services__swiper.swiper {
      box-sizing: border-box;
      overflow: hidden;
      --swiper-pagination-bullet-width: 16px;
      --swiper-pagination-bullet-height: 1px;
    }
  }
`

function nonLayered(extra: Record<string, unknown> = {}) {
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

function editablePart(extra: Record<string, unknown> = {}) {
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

function writeText(component: any, value: string): void {
  if (!component) return
  const collection = component.components?.()
  if (collection?.length) collection.reset([])
  component.set?.('content', value)
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

function applyEditablePartSettings(model: any, name?: string): void {
  if (!model) return
  model.set?.(editablePart(name ? { name } : {}))
}

function syncCardLinkAttributes(card: any, item: ServicesCarouselItem): void {
  if (!card) return
  const attrs = { ...(card.getAttributes?.() || {}) }
  const linkUrl = `${item.linkUrl || ''}`.trim()
  const linkTarget = `${item.linkTarget || '_self'}`.trim() || '_self'

  attrs.class = 'services__card'
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

function unlockExistingItemParts(model: any): void {
  applyEditablePartSettings(findChildByClass(model, 'services__card'), '服务卡片')
  applyEditablePartSettings(findChildByClass(model, 'services__card-icon'), '服务图标')
  applyEditablePartSettings(findChildByClass(model, 'services__card-title'), '服务标题')
  applyEditablePartSettings(findChildByClass(model, 'services__card-desc'), '服务描述')
}

function buildItemContent(item: ServicesCarouselItem) {
  return [
    {
      tagName: 'a',
      ...editablePart({
        name: '服务卡片',
        attributes: {
          class: 'services__card',
          ...(item.linkUrl ? { href: item.linkUrl, target: item.linkTarget || '_self' } : {}),
          ...(item.linkUrl && item.linkTarget === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
      }),
      components: [
        {
          tagName: 'div',
          ...editablePart({
            name: '服务图标',
            attributes: { class: 'services__card-icon' },
          }),
          components: item.icon,
        },
        {
          tagName: 'h3',
          ...editablePart({
            name: '服务标题',
            attributes: { class: 'services__card-title' },
          }),
          content: item.title,
        },
        {
          tagName: 'p',
          ...editablePart({
            name: '服务描述',
            attributes: { class: 'services__card-desc' },
          }),
          content: item.description,
        },
      ],
    },
  ]
}

function buildItemDef(item: ServicesCarouselItem, index = 0) {
  return {
    type: WB_SERVICES_CAROUSEL_ITEM_TYPE,
    tagName: 'div',
    name: `服务轮播项 · ${item.title}`,
    selectable: true,
    layerable: true,
    draggable: '.services__swiper .swiper-wrapper',
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
      class: 'swiper-slide',
      'data-wb-component': 'services-carousel-item',
      'data-item-index': String(index),
    },
    components: buildItemContent(item),
  }
}

function getItemTraits() {
  return [
    makeSvgIconPickerTrait('图标', 'serviceIconSvg', { sourceName: 'serviceIconSource' }),
    makeTextTrait('标题', 'serviceTitle', { placeholder: 'Service title' }),
    makeTextareaTrait('描述', 'serviceDescription', {
      placeholder: 'Service description',
      rows: 5,
    }),
    makeLinkTrait({
      label: '链接地址',
      name: 'serviceLinkUrl',
      placeholder: 'https://example.com',
    }),
    makeLinkTargetTrait({ label: '打开方式', name: 'serviceLinkTarget' }),
  ]
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

function getExistingIconSvg(model: any): string {
  const iconContainer = findChildByClass(model, 'services__card-icon')
  const currentMarkup = getInnerHtml(iconContainer)
  if (!currentMarkup) return ''

  try {
    return normalizeSvgMarkup(currentMarkup)
  } catch {
    return currentMarkup
  }
}

function getItemData(model: any): ServicesCarouselItem {
  const currentIndex = Number(model.getAttributes?.()?.['data-item-index']) || 0
  const fallback = DEFAULT_ITEMS[currentIndex] || DEFAULT_ITEMS[0]
  return {
    icon: String(model.get?.('serviceIconSvg') ?? fallback.icon),
    title: String(model.get?.('serviceTitle') || '').trim() || fallback.title,
    description:
      String(model.get?.('serviceDescription') || '').trim() || fallback.description,
    linkUrl: String(model.get?.('serviceLinkUrl') || ''),
    linkTarget: String(model.get?.('serviceLinkTarget') || '_self'),
  }
}

function syncItem(model: any): void {
  const item = getItemData(model)
  const itemName = `服务轮播项 · ${item.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)
  unlockExistingItemParts(model)

  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'swiper-slide',
    'data-wb-component': 'services-carousel-item',
  })

  syncCardLinkAttributes(findChildByClass(model, 'services__card'), item)
  writeText(findChildByClass(model, 'services__card-title'), item.title)
  writeText(findChildByClass(model, 'services__card-desc'), item.description)

  const iconContainer = findChildByClass(model, 'services__card-icon')
  if (iconContainer) {
    iconContainer.components?.(item.icon)
    const children = iconContainer.components?.()?.models ?? []
    children.forEach((child: any) => {
      child.set?.({
        selectable: true,
        hoverable: true,
        highlightable: true,
        layerable: true,
        stylable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
      })
    })
  }
}

function resolveCarouselTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_SERVICES_CAROUSEL_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_SERVICES_CAROUSEL_TYPE) as any
  if (fromSelected?.get?.('type') === WB_SERVICES_CAROUSEL_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_SERVICES_CAROUSEL_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_SERVICES_CAROUSEL_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_SERVICES_CAROUSEL_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_SERVICES_CAROUSEL_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_SERVICES_CAROUSEL_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_SERVICES_CAROUSEL_TYPE) return fromTraitTarget

  return null
}

function createAddItemTrait() {
  return {
    type: 'button' as any,
    name: 'add-services-carousel-item',
    label: false as const,
    text: '+ 添加服务轮播项',
    full: true,
    command(this: any, editor: Editor) {
      const carousel = resolveCarouselTarget(editor, this)
      const wrapper = carousel?._getWrapper?.()
      const items = wrapper?.components?.()
      if (!items) return

      const index = items.length || 0
      const fallback = DEFAULT_ITEMS[index % DEFAULT_ITEMS.length]
      const created = items.add(buildItemDef({
        ...fallback,
        title: `Service ${index + 1}`,
      }, index))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}


function buildTree() {
  return [
    {
      tagName: 'div',
      ...nonLayered({
        selectable: true,
        droppable: '.swiper-slide',
        attributes: { class: 'swiper-wrapper' },
      }),
      components: DEFAULT_ITEMS.map((item, index) => buildItemDef(item, index)),
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'swiper-button-prev services__prev' },
      }),
      components: SVG_PREV,
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'swiper-button-next services__next' },
      }),
      components: SVG_NEXT,
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'swiper-pagination services__pagination' },
      }),
    },
  ]
}

export function registerServicesCarouselComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_SERVICES_CAROUSEL_TYPE)) return

  domComponents.addType(WB_SERVICES_CAROUSEL_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'services-carousel-item'
        ? { type: WB_SERVICES_CAROUSEL_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '服务轮播项',
        tagName: 'div',
        selectable: true,
        layerable: true,
        draggable: '.services__swiper .swiper-wrapper',
        droppable: false,
        copyable: true,
        removable: true,
        serviceTitle: 'Service Title',
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

  domComponents.addType(WB_SERVICES_CAROUSEL_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'services-carousel'
        ? { type: WB_SERVICES_CAROUSEL_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Services 轮播',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'services-carousel',
          class: 'swiper services__swiper',
        },
        script: function () {
          const root = this as any
          let rafId = 0
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

              const existingScript = document.querySelector(
                'script[data-wb-swiper]',
              ) as HTMLScriptElement | null
              if (existingScript) {
                existingScript.addEventListener('load', () => resolve(), { once: true })
                return
              }

              const script = document.createElement('script')
              script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
              script.async = true
              script.setAttribute('data-wb-swiper', '1')
              script.onload = () => resolve()
              document.body.appendChild(script)
            })

          const destroySwiper = () => {
            root._wbServicesSwiper?.destroy?.(true, true)
            root._wbServicesSwiper = null
          }

          const resetSwiperRuntimeState = () => {
            root.classList.remove(
              'swiper-initialized',
              'swiper-horizontal',
              'swiper-backface-hidden',
            )

            const wrapper = root.querySelector('.swiper-wrapper') as HTMLElement | null
            if (wrapper) {
              wrapper.style.transform = ''
              wrapper.style.transitionDuration = ''
              wrapper.style.transitionDelay = ''
            }

            root.querySelectorAll('.swiper-wrapper > .swiper-slide').forEach((slide: any) => {
              slide.classList.remove(
                'swiper-slide-active',
                'swiper-slide-next',
                'swiper-slide-prev',
                'swiper-slide-visible',
                'swiper-slide-fully-visible',
              )
              slide.style.transform = ''
              slide.style.transitionDuration = ''
              slide.style.transitionDelay = ''
              slide.style.width = ''
              slide.style.marginRight = ''
              slide.style.marginLeft = ''
            })

            const pagination = root.querySelector('.services__pagination') as HTMLElement | null
            if (pagination) {
              pagination.classList.remove(
                'swiper-pagination-lock',
                'swiper-pagination-clickable',
                'swiper-pagination-bullets',
                'swiper-pagination-horizontal',
              )
              pagination.innerHTML = ''
            }
          }

          const getWrapperTranslate = () => {
            const wrapper = root.querySelector('.swiper-wrapper') as HTMLElement | null
            if (!wrapper) return 0

            const transform = window.getComputedStyle(wrapper).transform
            if (!transform || transform === 'none') return 0
            const matrix = transform.match(/^matrix\((.+)\)$/)
            if (matrix) {
              const values = matrix[1].split(',').map((value) => Number(value.trim()))
              return Number.isFinite(values[4]) ? values[4] : 0
            }
            const matrix3d = transform.match(/^matrix3d\((.+)\)$/)
            if (matrix3d) {
              const values = matrix3d[1].split(',').map((value) => Number(value.trim()))
              return Number.isFinite(values[12]) ? values[12] : 0
            }
            return 0
          }

          const clampSlideIndex = (index: number, slides: Element[]) => (
            Math.max(0, Math.min(Math.max(0, slides.length - 1), Number(index) || 0))
          )

          const getVisualSlideIndex = (slides: Element[]) => {
            if (!slides.length) return 0

            const translate = Math.abs(getWrapperTranslate())
            let bestIndex = 0
            let bestDistance = Number.POSITIVE_INFINITY
            slides.forEach((slide, index) => {
              const offset = (slide as HTMLElement).offsetLeft || 0
              const distance = Math.abs(offset - translate)
              if (distance < bestDistance) {
                bestDistance = distance
                bestIndex = index
              }
            })

            if (Number.isFinite(bestDistance) && bestDistance < Number.POSITIVE_INFINITY) {
              return clampSlideIndex(bestIndex, slides)
            }

            const activeByClass = slides.findIndex((slide) => slide.classList.contains('swiper-slide-active'))
            if (activeByClass >= 0) return clampSlideIndex(activeByClass, slides)

            return 0
          }

          const snapToVisualSlide = (swiper: any, slides: Element[]) => {
            if (!swiper || !slides.length) return
            const targetIndex = getVisualSlideIndex(slides)
            swiper.slideTo?.(targetIndex, 240, false)
          }

          const getSlidesOffsetAfter = (slides: Element[]) => {
            if (!slides.length) return 0
            if (window.matchMedia('(min-width: 768px)').matches) return 0

            const firstSlide = slides[0] as HTMLElement | undefined
            const slideWidth = firstSlide?.getBoundingClientRect?.().width || 0
            const rootWidth = root.getBoundingClientRect?.().width || 0
            return Math.max(0, rootWidth - slideWidth)
          }

          const init = () => {
            const w = window as any
            if (!w.Swiper || disposed) return

            const slides = Array.from(
              root.querySelectorAll('.swiper-wrapper > .swiper-slide'),
            ) as Element[]
            const paginationEl = root.querySelector('.services__pagination') as HTMLElement | null
            const prevEl = root.querySelector('.services__prev') as HTMLElement | null
            const nextEl = root.querySelector('.services__next') as HTMLElement | null
            const syncPagination = (swiper: any) => {
              if (!paginationEl || !slides.length) return
              const expectedCount = slides.length
              const bulletCount = paginationEl.querySelectorAll('.swiper-pagination-bullet').length
              if (bulletCount !== expectedCount) {
                paginationEl.innerHTML = slides
                  .map((_, index) => (
                    `<span class="swiper-pagination-bullet" role="button" tabindex="0" data-services-pagination-index="${index}"></span>`
                  ))
                  .join('')
                Array.from(
                  paginationEl.querySelectorAll('.swiper-pagination-bullet'),
                ).forEach((bullet, index) => {
                  bullet.addEventListener('click', () => swiper.slideTo?.(index))
                })
              }
              swiper.pagination?.update?.()

              const activeIndex = getVisualSlideIndex(slides)
              paginationEl.querySelectorAll('.swiper-pagination-bullet').forEach((bullet, index) => {
                const isActive = index === activeIndex
                bullet.classList.toggle('swiper-pagination-bullet-active', isActive)
                if (isActive) {
                  bullet.setAttribute('aria-current', 'true')
                } else {
                  bullet.removeAttribute('aria-current')
                }
              })
            }

            const scheduleSnapAndPaginationSync = (swiper: any) => {
              window.requestAnimationFrame(() => {
                snapToVisualSlide(swiper, slides)
                syncPagination(swiper)
                window.requestAnimationFrame(() => {
                  snapToVisualSlide(swiper, slides)
                  syncPagination(swiper)
                })
              })
              window.setTimeout(() => {
                snapToVisualSlide(swiper, slides)
                syncPagination(swiper)
              }, 120)
            }

            const bindPaginationSyncEvents = (swiper: any) => {
              root._wbServicesPaginationCleanup?.()
              const wrapper = root.querySelector('.swiper-wrapper') as HTMLElement | null
              const events: Array<[EventTarget, string]> = [
                [root, 'touchend'],
                [root, 'pointerup'],
                [root, 'mouseup'],
                [root, 'keyup'],
              ]
              if (wrapper) events.push([wrapper, 'transitionend'])

              const handler = () => scheduleSnapAndPaginationSync(swiper)
              events.forEach(([target, eventName]) => {
                target.addEventListener(eventName, handler)
              })
              root._wbServicesPaginationCleanup = () => {
                events.forEach(([target, eventName]) => {
                  target.removeEventListener(eventName, handler)
                })
              }
            }

            const targetIndex = root._wbServicesSwiper
              ? getVisualSlideIndex(slides)
              : 0

            destroySwiper()
            resetSwiperRuntimeState()
            root._wbServicesSwiper = new w.Swiper(root, {
              initialSlide: 0,
              slidesPerView: 'auto',
              spaceBetween: 12,
              slidesPerGroup: 1,
              loop: false,
              rewind: slides.length > 1,
              centeredSlides: false,
              snapToSlideEdge: true,
              slidesOffsetBefore: 0,
              slidesOffsetAfter: getSlidesOffsetAfter(slides),
              watchOverflow: false,
              breakpointsBase: 'container',
              observer: true,
              observeParents: true,
              resizeObserver: true,
              pagination: paginationEl
                ? {
                    el: paginationEl,
                    clickable: true,
                    renderBullet(index: number, className: string) {
                      return `<span class="${className}" data-services-pagination-index="${index}"></span>`
                    },
                  }
                : false,
              navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
              breakpoints: {
                768: {
                  slidesPerView: 'auto',
                  slidesPerGroup: 1,
                  spaceBetween: 20,
                  centeredSlides: false,
                  snapToSlideEdge: true,
                },
              },
              on: {
                init(swiper: any) {
                  swiper.slideTo?.(targetIndex, 0, false)
                  bindPaginationSyncEvents(swiper)
                  syncPagination(swiper)
                },
                setTranslate(swiper: any) {
                  syncPagination(swiper)
                },
                slideChange(swiper: any) {
                  syncPagination(swiper)
                },
                snapIndexChange(swiper: any) {
                  syncPagination(swiper)
                },
                touchEnd(swiper: any) {
                  scheduleSnapAndPaginationSync(swiper)
                },
                resize(swiper: any) {
                  syncPagination(swiper)
                },
              },
            })
          }

          const scheduleRefresh = () => {
            cancelAnimationFrame(rafId)
            rafId = window.requestAnimationFrame(() => {
              if (disposed) return
              init()
            })
          }

          ensureAssets().then(() => {
            if (disposed) return
            init()

            const wrapper = root.querySelector('.swiper-wrapper') as HTMLElement | null
            if (wrapper) {
              observer = new MutationObserver(() => scheduleRefresh())
              observer.observe(wrapper, { childList: true, subtree: false })
            }

            window.addEventListener('resize', scheduleRefresh)
          })

          root._wbServicesCarouselCleanup = function () {
            disposed = true
            cancelAnimationFrame(rafId)
            if (observer) observer.disconnect()
            window.removeEventListener('resize', scheduleRefresh)
            root._wbServicesPaginationCleanup?.()
            root._wbServicesPaginationCleanup = null
            destroySwiper()
          }
        },
        styles: SERVICES_CAROUSEL_CSS,
        traits: [createAddItemTrait()],
        components: buildTree(),
      },
      _getWrapper(this: any) {
        return this.components?.()?.at?.(0) ?? null
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_SERVICES_CAROUSEL_TYPE || type === WB_SERVICES_CAROUSEL_ITEM_TYPE) return
    if (component?.get?.('selectable') !== false && component?.get?.('stylable') !== false) return

    const item = component?.closestType?.(WB_SERVICES_CAROUSEL_ITEM_TYPE)
    if (item?.get?.('type') === WB_SERVICES_CAROUSEL_ITEM_TYPE) {
      editor.select?.(item)
    }
  })

  blockManager?.add?.(WB_SERVICES_CAROUSEL_TYPE, {
    label: 'Services',
    category: 'Section',
    content: { type: WB_SERVICES_CAROUSEL_TYPE },
    media: BLOCK_ICON,
  })
}
