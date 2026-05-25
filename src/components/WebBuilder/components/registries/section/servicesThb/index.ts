import type { Editor } from 'grapesjs'
import {
  makeLinkTargetTrait,
  makeLinkTrait,
  makeSvgIconPickerTrait,
  makeTextTrait,
  makeTextareaTrait,
} from '@/components/WebBuilder/utils/traitFactory'
import { normalizeSvgMarkup } from '@/components/WebBuilder/utils/svgIcon'

export const WB_SERVICE_THB_TYPE = 'wb-service-thb'
export const WB_SERVICE_THB_ITEM_TYPE = 'wb-service-thb-item'

type ServiceThbItem = {
  icon: string
  title: string
  description: string
  linkUrl?: string
  linkTarget?: string
}

const INNER_NODE = {
  selectable: false,
  hoverable: false,
  draggable: false,
  droppable: false,
  layerable: false,
  highlightable: false,
  copyable: false,
  removable: false,
  badgable: false,
} as const

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><rect x="3" y="5" width="6" height="6" rx="1.5"/><rect x="10.5" y="5" width="6" height="6" rx="1.5"/><rect x="18" y="5" width="3" height="6" rx="1.5"/><path d="M4 17h12"/><path d="M4 20h8"/></svg>`

const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="m695.467 70.366 130.355 26.231c35.704 7.202 61.645 41.643 61.645 81.8v511.78c0 29.132-13.756 56.131-36.284 71.167l-289.502 193.52c-35.806 23.944-80.657 23.944-116.463 0L155.75 761.36c-22.528-15.053-36.283-42.035-36.283-71.185v-511.83c0-40.157 25.941-74.58 61.645-81.783l130.355-26.197a971.1 971.1 0 0 1 384 0m-10.855 66.014a916.5 916.5 0 0 0-362.29 0l-130.356 26.282c-6.878 1.366-11.861 8.022-11.861 15.736v511.778c0 5.598 2.645 10.82 6.997 13.722l289.485 193.485a47.79 47.79 0 0 0 53.76 0l289.502-193.485a16.38 16.38 0 0 0 6.997-13.722V178.398c0-7.731-5-14.353-11.878-15.753z"/><path d="M688.248 334.968c12.441-12.032 31.283-10.82 42.393 2.713 11.094 13.534 10.377 34.407-1.621 46.968L532.07 582.793c-45.226 45.482-114.62 44.202-158.412-2.987l-83.337-89.685c-11.776-12.971-11.947-34.031-.341-47.207 11.588-13.192 30.6-13.585 42.632-.904l83.32 89.685c20.838 22.426 53.845 23.04 75.35 1.4z"/></svg>`
const ICON_GRID = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="M409.59 477.88H204.804a102.376 102.376 0 0 1-102.41-102.41V238.94a136.53 136.53 0 0 1 136.53-136.53H375.47a102.376 102.376 0 0 1 102.393 102.394v204.803a68.31 68.31 0 0 1-68.273 68.274M238.923 170.667a68.31 68.31 0 0 0-68.256 68.273v136.53c0 18.857 15.28 34.137 34.137 34.137H409.59V204.804a34.137 34.137 0 0 0-34.12-34.137zM819.197 477.88H614.393a68.31 68.31 0 0 1-68.256-68.274V204.804A102.376 102.376 0 0 1 648.53 102.41h136.53a136.53 136.53 0 0 1 136.53 136.53v136.53a102.376 102.376 0 0 1-102.393 102.41M648.53 170.668a34.137 34.137 0 0 0-34.137 34.137v204.803h204.804a34.137 34.137 0 0 0 34.137-34.137V238.94a68.31 68.31 0 0 0-68.274-68.273zm-273.06 750.94H238.923a136.53 136.53 0 0 1-136.53-136.53V648.53a102.376 102.376 0 0 1 102.41-102.376H409.59a68.31 68.31 0 0 1 68.273 68.257V819.18A102.376 102.376 0 0 1 375.47 921.59M204.786 614.393a34.137 34.137 0 0 0-34.12 34.12V785.06a68.31 68.31 0 0 0 68.257 68.257H375.47a34.137 34.137 0 0 0 34.12-34.137V614.428zM785.06 921.59H648.53a102.376 102.376 0 0 1-102.393-102.41V614.428a68.31 68.31 0 0 1 68.256-68.274h204.804A102.376 102.376 0 0 1 921.59 648.547v136.547a136.53 136.53 0 0 1-136.53 136.53M614.393 614.411V819.18c0 18.857 15.28 34.137 34.137 34.137h136.53a68.31 68.31 0 0 0 68.274-68.257V648.53a34.137 34.137 0 0 0-34.137-34.137z"/></svg>`
const ICON_FAILURE = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="60" height="60" viewBox="0 0 1024 1024"><path d="M921.6 107.52v809.233c-.41 1.11-.921 2.219-1.143 3.414-5.462 30.242-34.611 52.633-68.71 52.633q-339.9.017-679.8-.085a80.2 80.2 0 0 1-18.808-2.39c-30.788-7.765-50.739-32.477-50.739-62.344V112.674c.717-27.375 21.504-51.422 50.944-58.982 3.618-.922 7.236-1.656 10.854-2.492h695.399c.734.273 1.553.734 2.287.836 29.867 4.608 51.251 22.853 57.958 49.306.512 2.116 1.246 4.147 1.758 6.178M163.567 511.864V904.96c0 10.138 1.963 11.896 13.141 11.896H847.31c1.758 0 3.413.085 5.171-.103 4.13-.358 6.707-2.39 7.424-5.888.427-1.945.427-3.96.427-5.99V119.228c0-10.138-1.963-11.896-13.142-11.896H172.476c-5.274.171-8.26 2.577-8.79 7.373-.204 2.116-.204 4.335-.204 6.451q.136 195.362.102 390.708"/><path d="M521.045 213.93h98.902c32.188-.085 55.637 12.971 68.352 39.288 12.92 26.692 8.106 51.815-14.029 73.25-26.76 25.856-54.101 51.064-81.476 76.459-2.97 2.765-3.277 4.983-1.946 8.465 34.73 88.61 69.376 177.323 104.021 265.933 10.036 25.77 4.608 48.401-16.81 67.994-36.284 33.126-72.363 66.44-108.544 99.669-28.058 25.754-68.13 25.941-96.307.085-37.206-34.048-74.411-68.01-111.395-102.332-20.087-18.585-25.429-40.67-15.889-64.853a62276 62276 0 0 1 105.353-264.653c1.74-4.318 1.229-6.997-2.475-10.308a6229 6229 0 0 1-82.483-77.483c-36.079-34.68-20.31-92.842 29.303-107.912 8.09-2.492 17.016-3.414 25.618-3.499 33.211-.375 66.508-.102 99.823-.102m-.188 55.586h-96.342c-2.355 0-4.812 0-7.168.273-8.192 1.024-12.612 9.472-8.09 15.82 1.127 1.57 2.56 2.85 3.994 4.148 31.966 29.986 63.95 60.075 95.915 90.078 9.54 8.926 12.288 19.234 7.68 30.925-14.029 35.413-28.28 70.929-42.325 106.36a94328 94328 0 0 1-70.81 177.68c-1.331 3.226-1.843 5.888 1.331 8.738 37.206 34.048 74.309 68.096 111.514 102.23 3.994 3.686 5.734 3.584 9.728-.086 36.693-33.672 73.267-67.26 110.063-100.949 2.662-2.39 3.072-4.779 1.74-7.817a751 751 0 0 1-8.191-20.787c-34.85-88.985-69.683-177.869-104.448-266.854-4.096-10.394-1.929-19.968 5.973-28.33 1.621-1.759 3.465-3.414 5.205-5.07 30.96-28.979 61.901-58.06 92.843-87.04 6.366-5.973 6.366-13.619-.512-17.305-2.867-1.553-6.758-1.929-10.24-1.929q-49.015-.102-97.86-.085"/></svg>`
const ICON_COMPASS = `<svg viewBox="0 0 1041 1024" fill="currentColor" width="60" height="60"><path d="M520.157288 123.904c53.300068 0 104.968678 10.187932 153.478509 30.494373a392.938305 392.938305 0 0 1 125.379254 83.100203 385.648814 385.648814 0 0 1 84.52339 123.296543 380.164339 380.164339 0 0 1 30.997695 150.90983c0 52.293424-10.361492 103.198373-31.015051 150.892475a385.648814 385.648814 0 0 1-84.506034 123.296542 392.938305 392.938305 0 0 1-125.379254 83.100203 397.988881 397.988881 0 0 1-153.461153 30.511729c-53.195932 0-104.951322-10.205288-153.461152-30.511729a392.938305 392.938305 0 0 1-125.396611-83.100203 385.648814 385.648814 0 0 1-84.506034-123.296542 380.164339 380.164339 0 0 1-31.01505-150.892475c0-52.31078 10.378847-103.198373 31.01505-150.90983a385.648814 385.648814 0 0 1 84.52339-123.296543 392.938305 392.938305 0 0 1 125.379255-83.100203 395.402847 395.402847 0 0 1 153.461152-30.494373z m0-59.999458c-251.487458 0-455.384949 200.495729-455.384949 447.783051 0 247.322034 203.897492 447.817763 455.402305 447.817763 251.487458 0 455.384949-200.513085 455.384949-447.800407 0-247.322034-203.897492-447.800407-455.384949-447.800407z" /><path d="M669.14061 365.203525l-72.200678 197.389017a40.717017 40.717017 0 0 1-25.009898 24.506577l-200.756068 71.089898 72.200678-197.389017a40.717017 40.717017 0 0 1 25.027254-24.506576l200.738712-71.089899z m25.634712-70.01383c-5.085288 0-10.378847 0.902508-15.44678 2.707525l-231.684339 81.989424a101.636339 101.636339 0 0 0-61.717695 60.711051L302.513898 668.376949a44.604746 44.604746 0 0 0 0 30.407593 45.472542 45.472542 0 0 0 42.817085 29.591865c5.085288 0 10.378847-0.902508 15.44678-2.707526l231.666983-81.989423a101.636339 101.636339 0 0 0 61.735051-60.693695l83.395254-227.813966a44.604746 44.604746 0 0 0 0-30.390238c-6.61261-18.310508-24.124746-29.60922-42.817085-29.60922z" /></svg>`

const DEFAULT_ITEMS: ServiceThbItem[] = [
  {
    icon: ICON_CHECK,
    title: 'Bearing Replacement Evaluation',
    description:
      'Using premium bearing brands? We help you evaluate if a THB replacement is feasible - with engineering analysis, not just guesswork.',
  },
  {
    icon: ICON_GRID,
    title: 'Bearing Selection Support',
    description:
      'Not sure which bearing fits your application? Share your load, speed, and operating conditions - we can help you evaluate the options together.',
  },
  {
    icon: ICON_CHECK,
    title: 'Bearing Life Calculation',
    description:
      'Need to understand bearing life in your actual application? Share your operating conditions - we can help calculate expected life based on industry standards.',
  },
  {
    icon: ICON_FAILURE,
    title: 'Failure Analysis',
    description:
      'Bearings failing too soon - or repeatedly without a clear cause? Share your application details. We help analyze the root cause and recommend improvements.',
  },
  {
    icon: ICON_COMPASS,
    title: 'Lubrication Selection Guidance',
    description:
      'Grease selection is often overlooked - yet lubrication issues account for nearly 40% of premature bearing failures. We help you select the right grease based on your operating conditions.',
  },
]

const SVG_PREV = `<svg viewBox="0 0 1464 1024" width="24" height="24"><path fill="currentColor" d="M64.78790437 474.21653375L523.76772655 47.6696075a60.34692375 60.34692375 0 0 1 80.88203719 0c22.30834125 20.76391781 22.30834125 54.3980325 0 75.16195031L241.25260405 460.54552437h1123.196385c30.48806625 0 55.14164344 22.93755094 55.14164344 51.25198407 0 28.2572325-24.65357719 51.19478344-55.14164344 51.19478343H241.25260405l363.39715969 337.7139675c22.30834125 20.76391781 22.30834125 54.3980325 0 75.16194938a59.31730781 59.31730781 0 0 1-40.44101812 15.55863844c-14.64342375 0-29.28684844-5.14807875-40.44101907-15.55863844L64.78790437 549.37848406a50.50837312 50.50837312 0 0 1 0-75.16195031z"></path></svg>`
const SVG_NEXT = `<svg viewBox="0 0 1464 1024" width="24" height="24"><path fill="currentColor" d="M1398.39594291 549.62127313l-459.29371781 426.78140062a60.38819437 60.38819437 0 0 1-80.9373525 0 50.54291531 50.54291531 0 0 1 0-75.21335344L1221.81055885 563.24439125H97.84602197c-30.45167719 0-55.17935531-22.89599813-55.17935531-51.22979531s24.72767813-51.28703531 55.17935531-51.28703531H1221.81055885l-363.64568625-337.94492907a50.54291531 50.54291531 0 0 1 0-75.21335343c11.16179906-10.36043906 25.81523719-15.56927813 40.46867625-15.56927813 14.65343906 0 29.30687719 5.15159906 40.46867625 15.56927813l459.29371781 426.83864156c22.38083813 20.77811813 22.38083813 54.37799531 0 75.21335344z"></path></svg>`

const SERVICE_THB_CSS = `
  .services__swiper.swiper {
    width: 100%;
    overflow: visible;
    padding-bottom: 64px;
    --primary-blue: #3C53E8;
    --text-dark: #0C1029;
    --text-gray: #666;
    --transition: 0.2s ease-in-out;
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
    display: block;
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
  .services__swiper.swiper:hover .swiper-button-next {
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
    color: inherit;
    cursor: default;
    text-decoration: none;
    position: relative;
  }
  .services__card[href] {
    cursor: pointer;
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
  .services__card-icon svg {
    display: block;
    width: 60px;
    height: 60px;
  }
  @media (min-width: 769px) {
    .services__card:hover .services__card-icon {
      color: rgba(255, 255, 255, 0.9);
    }
  }
  .services__card-title {
    margin: 0 0 14px;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.25;
    height: 2.5em;
  }
  .services__card-desc {
    margin: 0;
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
    .services__swiper .swiper-button-prev,
    .services__swiper .swiper-button-next {
      display: none;
    }
    .services__swiper .swiper-slide {
      width: 250px;
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
  }
`

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

function findChildByClass(model: any, className: string): any {
  const children = model?.components?.()?.models ?? []
  for (const child of children) {
    const classes = String(child?.getAttributes?.()?.class || '').split(/\s+/).filter(Boolean)
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

function getTextContent(model: any): string {
  if (!model) return ''
  const ownContent = String(model.get?.('content') ?? '').trim()
  if (ownContent) return ownContent
  const children = model.components?.()?.models ?? []
  return children
    .map((child: any) => {
      if (child?.get?.('type') === 'textnode') return String(child.get?.('content') ?? '')
      return getTextContent(child)
    })
    .join('')
    .trim()
}

function syncCardLinkAttributes(card: any, item: ServiceThbItem): void {
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

function buildItemContent(item: ServiceThbItem) {
  return [
    {
      tagName: 'a',
      ...editable({
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
          ...editable({ name: '服务图标', attributes: { class: 'services__card-icon' } }),
          components: item.icon,
        },
        {
          tagName: 'h3',
          ...editable({ name: '卡片标题', attributes: { class: 'services__card-title' } }),
          content: item.title,
        },
        {
          tagName: 'p',
          ...editable({ name: '卡片描述', attributes: { class: 'services__card-desc' } }),
          content: item.description,
        },
      ],
    },
  ]
}

function buildItemDef(item: ServiceThbItem, index = 0) {
  return {
    type: WB_SERVICE_THB_ITEM_TYPE,
    tagName: 'div',
    name: `Service THB Item · ${item.title}`,
    selectable: true,
    layerable: true,
    draggable: '.services__swiper .swiper-wrapper',
    droppable: false,
    copyable: true,
    removable: true,
    thbServiceTitle: item.title,
    thbServiceDescription: item.description,
    thbServiceIconSvg: item.icon,
    thbServiceIconSource: '',
    thbServiceLinkUrl: item.linkUrl || '',
    thbServiceLinkTarget: item.linkTarget || '_self',
    attributes: {
      class: 'swiper-slide',
      'data-wb-component': 'service-thb-item',
      'data-item-index': String(index),
    },
    components: buildItemContent(item),
  }
}

function getItemTraits() {
  return [
    makeSvgIconPickerTrait('图标', 'thbServiceIconSvg', { sourceName: 'thbServiceIconSource' }),
    makeTextTrait('标题', 'thbServiceTitle', { placeholder: 'Bearing Replacement Evaluation' }),
    makeTextareaTrait('描述', 'thbServiceDescription', { placeholder: 'Service description', rows: 5 }),
    makeLinkTrait({
      label: '跳转链接',
      name: 'thbServiceLinkUrl',
      placeholder: 'https://example.com',
    }),
    makeLinkTargetTrait({ label: '打开方式', name: 'thbServiceLinkTarget' }),
  ]
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

function getItemData(model: any): ServiceThbItem {
  const currentIndex = Number(model.getAttributes?.()?.['data-item-index']) || 0
  const fallback = DEFAULT_ITEMS[currentIndex] || DEFAULT_ITEMS[0]
  return {
    icon: String(model.get?.('thbServiceIconSvg') ?? fallback.icon),
    title: String(model.get?.('thbServiceTitle') || '').trim() || fallback.title,
    description: String(model.get?.('thbServiceDescription') || '').trim() || fallback.description,
    linkUrl: String(model.get?.('thbServiceLinkUrl') || ''),
    linkTarget: String(model.get?.('thbServiceLinkTarget') || '_self'),
  }
}

function hydrateItemProps(model: any): void {
  const currentIndex = Number(model.getAttributes?.()?.['data-item-index']) || 0
  const fallback = DEFAULT_ITEMS[currentIndex] || DEFAULT_ITEMS[0]
  const title = getTextContent(findChildByClass(model, 'services__card-title'))
  const description = getTextContent(findChildByClass(model, 'services__card-desc'))
  const card = findChildByClass(model, 'services__card')
  const cardAttrs = card?.getAttributes?.() || {}
  const currentTitle = String(model.get?.('thbServiceTitle') || '').trim()
  const currentDescription = String(model.get?.('thbServiceDescription') || '').trim()
  const currentLinkUrl = String(model.get?.('thbServiceLinkUrl') || '').trim()
  const currentLinkTarget = String(model.get?.('thbServiceLinkTarget') || '').trim()

  if (title && (!currentTitle || currentTitle === fallback.title)) {
    model.set?.('thbServiceTitle', title, { silent: true })
  }
  if (description && (!currentDescription || currentDescription === fallback.description)) {
    model.set?.('thbServiceDescription', description, { silent: true })
  }
  if (!currentLinkUrl && cardAttrs.href) {
    model.set?.('thbServiceLinkUrl', String(cardAttrs.href), { silent: true })
  }
  if (!currentLinkTarget && cardAttrs.target) {
    model.set?.('thbServiceLinkTarget', String(cardAttrs.target), { silent: true })
  }
}

function syncItem(model: any): void {
  const item = getItemData(model)
  const itemName = `Service THB Item · ${item.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)

  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'swiper-slide',
    'data-wb-component': 'service-thb-item',
  })
  syncCardLinkAttributes(findChildByClass(model, 'services__card'), item)
  writeText(findChildByClass(model, 'services__card-title'), item.title)
  writeText(findChildByClass(model, 'services__card-desc'), item.description)

  const icon = findChildByClass(model, 'services__card-icon')
  if (icon) icon.components?.(item.icon)
}

function buildTree() {
  return [
    {
      tagName: 'div',
      attributes: { class: 'swiper-wrapper' },
      selectable: true,
      draggable: false,
      droppable: '.swiper-slide',
      components: DEFAULT_ITEMS.map((item, index) => buildItemDef(item, index)),
    },
    {
      tagName: 'div',
      attributes: { class: 'swiper-button-prev services__prev' },
      ...INNER_NODE,
      components: SVG_PREV,
    },
    {
      tagName: 'div',
      attributes: { class: 'swiper-button-next services__next' },
      ...INNER_NODE,
      components: SVG_NEXT,
    },
    {
      tagName: 'div',
      attributes: { class: 'swiper-pagination services__pagination' },
      ...INNER_NODE,
    },
  ]
}

function createAddItemTrait() {
  return {
    type: 'button' as any,
    name: 'add-service-thb-item',
    label: false as const,
    text: '+ 添加服务卡片',
    full: true,
    command(this: any, editor: Editor) {
      const selected = editor.getSelected?.() as any
      const root = selected?.get?.('type') === WB_SERVICE_THB_TYPE
        ? selected
        : selected?.closestType?.(WB_SERVICE_THB_TYPE)
      const wrapper = findChildByClass(root, 'swiper-wrapper')
      const items = wrapper?.components?.()
      if (!items) return

      const index = items.length || 0
      const source = getItemData(items.at?.(Math.max(0, index - 1)))
      const created = items.add(buildItemDef({ ...source, title: `${source.title} Copy` }, index))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

const serviceThbScript = function (this: HTMLElement) {
  const root = this as HTMLElement & { __wbServiceThbCleanup?: () => void; __wbServiceThbSwiper?: any }
  const win = window as any
  let disposed = false

  const ensureAssets = () =>
    new Promise<void>((resolve) => {
      if (win.Swiper) {
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
      document.head.appendChild(script)
    })

  const init = () => {
    if (disposed || !win.Swiper) return
    root.__wbServiceThbSwiper?.destroy?.(true, true)
    root.__wbServiceThbSwiper = new win.Swiper(root, {
      slidesPerView: 'auto',
      spaceBetween: 12,
      loop: true,
      centeredSlides: true,
      pagination: {
        el: root.querySelector('.services__pagination'),
        clickable: true,
      },
      navigation: {
        prevEl: root.querySelector('.services__prev'),
        nextEl: root.querySelector('.services__next'),
      },
      breakpoints: {
        768: {
          loop: false,
          slidesPerView: 'auto',
          spaceBetween: 20,
          centeredSlides: false,
        },
      },
    })
  }

  root.__wbServiceThbCleanup?.()
  ensureAssets().then(init)
  root.__wbServiceThbCleanup = function () {
    disposed = true
    root.__wbServiceThbSwiper?.destroy?.(true, true)
    root.__wbServiceThbSwiper = null
  }
}

export function registerServiceThbComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_SERVICE_THB_TYPE)) return

  domComponents.addType(WB_SERVICE_THB_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'service-thb-item'
        ? { type: WB_SERVICE_THB_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Service THB Item',
        tagName: 'div',
        selectable: true,
        layerable: true,
        draggable: '.services__swiper .swiper-wrapper',
        droppable: false,
        copyable: true,
        removable: true,
        thbServiceTitle: DEFAULT_ITEMS[0].title,
        thbServiceDescription: DEFAULT_ITEMS[0].description,
        thbServiceIconSvg: DEFAULT_ITEMS[0].icon,
        thbServiceIconSource: '',
        thbServiceLinkUrl: '',
        thbServiceLinkTarget: '_self',
        traits: getItemTraits(),
      },
      init(this: any) {
        if (!this.components?.()?.length) this.components?.(buildItemContent(getItemData(this)))
        hydrateItemProps(this)
        const existingIcon = getExistingIconSvg(this)
        const iconValue = String(this.get?.('thbServiceIconSvg') || '').trim()
        if (existingIcon && (!iconValue || iconValue === DEFAULT_ITEMS[0].icon)) {
          this.set?.('thbServiceIconSvg', existingIcon, { silent: true })
        }
        this.listenTo(
          this,
          'change:thbServiceTitle change:thbServiceDescription change:thbServiceIconSvg change:thbServiceLinkUrl change:thbServiceLinkTarget',
          () => syncItem(this),
        )
        syncItem(this)
      },
    },
  })

  domComponents.addType(WB_SERVICE_THB_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'service-thb'
        ? { type: WB_SERVICE_THB_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Service THB',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'service-thb',
          class: 'swiper services__swiper',
        },
        styles: SERVICE_THB_CSS,
        script: serviceThbScript,
        'script-export': serviceThbScript,
        traits: [createAddItemTrait()],
        components: buildTree(),
      },
    },
  })

  editor.on?.('component:selected', (component: any) => {
    if (!component || component.get?.('type') === WB_SERVICE_THB_ITEM_TYPE) return
    const item = component.closestType?.(WB_SERVICE_THB_ITEM_TYPE)
    if (!item) return
    const classes = String(component.getAttributes?.()?.class || '').split(/\s+/).filter(Boolean)
    const shouldSelectItem = [
      'services__card',
      'services__card-icon',
      'services__card-title',
      'services__card-desc',
    ].some((className) => classes.includes(className))
    if (shouldSelectItem) editor.select?.(item)
  })

  blockManager?.add?.(WB_SERVICE_THB_TYPE, {
    label: 'Service THB',
    category: 'Section',
    content: { type: WB_SERVICE_THB_TYPE },
    media: BLOCK_ICON,
  })
}
