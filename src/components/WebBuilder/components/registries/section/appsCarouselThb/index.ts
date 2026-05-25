import type { Editor } from 'grapesjs'
import { createApp, h, ref } from 'vue'
import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus'
import {
  makeImagePickerTrait,
  makeTextTrait,
} from '@/components/WebBuilder/utils/traitFactory'
import { getImageManager } from '@/components/WebBuilder/utils/traitBridge'

export const WB_APPS_CAROUSEL_THB_TYPE = 'wb-apps-carousel-thb'
export const WB_APPS_CAROUSEL_THB_CARD_TYPE = 'wb-apps-carousel-thb-card'

type MiniItem = {
  image: string
  title: string
  link: string
  target: string
}

type AppCard = {
  image: string
  title: string
  minis: MiniItem[]
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

const LAYER_PATH_NODE = {
  ...INNER_NODE,
  layerable: true,
} as const

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><rect x="3" y="4" width="5" height="7" rx="1"/><rect x="9.5" y="4" width="5" height="7" rx="1"/><rect x="16" y="4" width="5" height="7" rx="1"/><path d="M4 17h5"/><path d="M11 17h5"/><path d="M18 17h2"/><path d="M4 20h9"/></svg>`

const SVG_PREV = `<svg viewBox="0 0 1024 1024" width="48" height="48"><path d="M302.057301 482.961858L671.812062 1012.234875l45.172662-31.547412L370.587534 484.871596 716.06658 44.529961 672.730206 10.577013 302.057301 482.943495z" fill="currentColor" /></svg>`
const SVG_NEXT = `<svg viewBox="0 0 1024 1024" width="48" height="48"><path d="M721.942699 482.961858L352.187938 1012.234875 307.015276 980.687463l346.39719-495.815867L307.93342 44.529961 351.269794 10.577013 721.942699 482.943495z" fill="currentColor"></path></svg>`

const DEFAULT_CARDS: AppCard[] = [
  {
    image: './img/solutions-1.webp',
    title: 'Factory sewing machine',
    minis: [
      { image: './img/products-1.webp', title: 'Super-precisio<br>n bearings', link: '#', target: '_self' },
      { image: './img/products-3.webp', title: 'Pillow Block &amp;<br>Bearing', link: '#', target: '_self' },
      { image: './img/products-4.webp', title: 'Thin section<br>bearings', link: '#', target: '_self' },
    ],
  },
  {
    image: './img/solutions-2.webp',
    title: 'Automotive OEM parts manufacturing',
    minis: [
      { image: './img/products-3.webp', title: 'Deep groove<br>ball bearings', link: '#', target: '_self' },
      { image: './img/products-4.webp', title: 'Tapered roller<br>bearings', link: '#', target: '_self' },
      { image: './img/products-1.webp', title: 'Angular contact<br>bearings', link: '#', target: '_self' },
    ],
  },
  {
    image: './img/solutions-3.webp',
    title: 'Intelligent logistics',
    minis: [
      { image: './img/products-4.webp', title: 'Thin section<br>bearings', link: '#', target: '_self' },
      { image: './img/products-1.webp', title: 'Super-precision<br>bearings', link: '#', target: '_self' },
      { image: './img/products-3.webp', title: 'Pillow Block<br>&amp; Bearing', link: '#', target: '_self' },
    ],
  },
  {
    image: './img/solutions-4.webp',
    title: 'Robots industry',
    minis: [
      { image: './img/products-1.webp', title: 'Cross roller<br>bearings', link: '#', target: '_self' },
      { image: './img/products-4.webp', title: 'Harmonic<br>reducer bearings', link: '#', target: '_self' },
      { image: './img/products-3.webp', title: 'Slewing ring<br>bearings', link: '#', target: '_self' },
    ],
  },
  {
    image: './img/solutions-1.webp',
    title: 'Intelligent logistics',
    minis: [
      { image: './img/products-3.webp', title: 'Pillow Block<br>&amp; Bearing', link: '#', target: '_self' },
      { image: './img/products-1.webp', title: 'Super-precision<br>bearings', link: '#', target: '_self' },
      { image: './img/products-4.webp', title: 'Thin section<br>bearings', link: '#', target: '_self' },
    ],
  },
  {
    image: './img/solutions-1.webp',
    title: 'Intelligent logistics',
    minis: [
      { image: './img/products-4.webp', title: 'Thin section<br>bearings', link: '#', target: '_self' },
      { image: './img/products-3.webp', title: 'Pillow Block<br>&amp; Bearing', link: '#', target: '_self' },
      { image: './img/products-1.webp', title: 'Super-precision<br>bearings', link: '#', target: '_self' },
    ],
  },
]

const APPS_CAROUSEL_THB_CSS = `
  .wb-apps-carousel-thb {
    --text-dark: #0e1428;
    --transition: 0.2s ease-in-out;
    width: 100%;
  }
  .wb-apps-carousel-thb .mi-apps__carousel {
    position: relative;
    display: grid;
    align-items: center;
    --gap: 16px;
    --items-per-view: 5;
    --navigation-vertical-offset: 120px;
    --navigation-horizontal-offset: -56px;
    --navigation-size: 52px;
  }
  .wb-apps-carousel-thb .mi-apps__track {
    display: flex;
    gap: var(--gap);
    overflow: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  .wb-apps-carousel-thb .mi-apps__track::-webkit-scrollbar {
    height: 0;
  }
  .wb-apps-carousel-thb .mi-apps__arrow {
    position: absolute;
    top: var(--navigation-vertical-offset);
    width: var(--navigation-size);
    height: var(--navigation-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 3;
    padding: 0;
    border: 0;
    color: inherit;
    background: transparent;
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .wb-apps-carousel-thb .mi-apps__arrow--prev {
    left: var(--navigation-horizontal-offset);
  }
  .wb-apps-carousel-thb .mi-apps__arrow--next {
    right: var(--navigation-horizontal-offset);
  }
  .wb-apps-carousel-thb .mi-app-card {
    flex: 0 0 calc((100% - var(--gap) * calc(var(--items-per-view) - 1)) / var(--items-per-view));
    scroll-snap-align: start;
    cursor: pointer;
    user-select: none;
  }
  .wb-apps-carousel-thb .mi-app-card__thumbnail {
    overflow: hidden;
    transition: box-shadow var(--transition);
    padding: 4px;
  }
  .wb-apps-carousel-thb .mi-app-card__img {
    width: 100%;
    aspect-ratio: 235 / 320;
    object-fit: cover;
    display: block;
    background: #f2f2f2;
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .wb-apps-carousel-thb .mi-app-card__label {
    margin-block: 16px;
    text-align: center;
    line-height: 1.4;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-dark);
  }
  .wb-apps-carousel-thb .mi-app-card[aria-selected="true"] .mi-app-card__thumbnail {
    box-shadow: inset 0 0 0 4px #0E0D0D;
  }
  .wb-apps-carousel-thb .mi-apps__mini {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
  }
  .wb-apps-carousel-thb .mi-mini {
    --img-size: 166px;
    --card-bg-color: #F9FAFB;
    display: grid;
    grid-template-columns: var(--img-size) 1fr;
    align-items: center;
    gap: 10px;
    background-color: var(--card-bg-color);
    color: inherit;
    text-decoration: none;
  }
  .wb-apps-carousel-thb .mi-mini.is-entering {
    animation: mi-fadeinup 520ms cubic-bezier(.2, .8, .2, 1) both;
    animation-delay: var(--mi-enter-delay, 0ms);
  }
  @keyframes mi-fadeinup {
    from { opacity: 0; transform: translate3d(0, 10px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .wb-apps-carousel-thb .mi-apps__track {
      scroll-behavior: auto;
    }
    .wb-apps-carousel-thb .mi-mini.is-entering {
      animation: none;
    }
  }
  .wb-apps-carousel-thb .mi-mini__img {
    width: var(--img-size);
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }
  .wb-apps-carousel-thb .mi-mini__title {
    font-size: 24px;
    line-height: 1.33;
    font-weight: 600;
    color: #000F17;
  }
  @media (max-width: 767px) {
    .wb-apps-carousel-thb .mi-apps__carousel {
      grid-column: 1 / -1;
    }
    .wb-apps-carousel-thb .mi-apps__track {
      --items-per-view: 1.5;
      --gap: 12px;
      padding-inline: 20px;
      scroll-padding-inline: 20px;
      scroll-snap-align: center;
    }
    .wb-apps-carousel-thb .mi-mini {
      --img-size: 100px;
    }
    .wb-apps-carousel-thb .mi-mini__title {
      font-size: 16px;
    }
    .wb-apps-carousel-thb .mi-apps__arrow {
      display: none;
    }
    .wb-apps-carousel-thb .mi-app-card {
      scroll-snap-align: center;
    }
    .wb-apps-carousel-thb .mi-apps__mini {
      grid-template-columns: 1fr;
      max-width: 360px;
    }
  }
`

function normalizeMinis(value: unknown): MiniItem[] {
  if (Array.isArray(value)) {
    return value.map((item) => ({
      image: String(item?.image || ''),
      title: String(item?.title || ''),
      link: String(item?.link || ''),
      target: String(item?.target || '_self') === '_blank' ? '_blank' : '_self',
    }))
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizeMinis(JSON.parse(value))
    } catch {
      return []
    }
  }
  return []
}

function encodeMinis(minis: MiniItem[]): string {
  return encodeURIComponent(JSON.stringify(normalizeMinis(minis)))
}

function decodeMinis(value: string): MiniItem[] {
  if (!value) return []
  try {
    return normalizeMinis(JSON.parse(decodeURIComponent(value)))
  } catch {
    return []
  }
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtml(value: string): string {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
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

function getCardData(model: any): AppCard {
  return {
    image: String(model?.get?.('thbAppsImage') || DEFAULT_CARDS[0].image),
    title: String(model?.get?.('thbAppsTitle') || DEFAULT_CARDS[0].title),
    minis: normalizeMinis(model?.get?.('thbAppsMinis')).length
      ? normalizeMinis(model?.get?.('thbAppsMinis'))
      : DEFAULT_CARDS[0].minis,
  }
}

function miniComponent(mini: MiniItem) {
  const tagName = mini.link ? 'a' : 'article'
  return {
    tagName,
    attributes: {
      class: 'mi-mini',
      ...(mini.link ? { href: mini.link, target: mini.target, rel: mini.target === '_blank' ? 'noopener noreferrer' : undefined } : {}),
    },
    ...INNER_NODE,
    components: [
      {
        tagName: 'img',
        type: 'image',
        attributes: { class: 'mi-mini__img', src: mini.image, alt: '' },
        ...INNER_NODE,
      },
      {
        tagName: 'h3',
        attributes: { class: 'mi-mini__title' },
        ...INNER_NODE,
        components: mini.title,
      },
    ],
  }
}

function buildMiniComponents(minis: MiniItem[]) {
  return normalizeMinis(minis).map((mini) => miniComponent(mini))
}

function buildCardContent(card: AppCard) {
  return [
    {
      tagName: 'div',
      attributes: { class: 'mi-app-card__thumbnail' },
      ...INNER_NODE,
      components: [
        {
          tagName: 'img',
          type: 'image',
          attributes: { class: 'mi-app-card__img', src: card.image, alt: stripHtml(card.title) },
          ...INNER_NODE,
        },
      ],
    },
    {
      tagName: 'h3',
      attributes: { class: 'mi-app-card__label' },
      ...INNER_NODE,
      components: escapeHtml(card.title),
    },
  ]
}

function cardComponent(card: AppCard, index: number) {
  return {
    type: WB_APPS_CAROUSEL_THB_CARD_TYPE,
    tagName: 'article',
    attributes: {
      class: 'mi-app-card',
      tabindex: '0',
      role: 'button',
      'aria-selected': index === 0 ? 'true' : 'false',
      'data-wb-component': 'apps-carousel-thb-card',
      'data-minis': encodeMinis(card.minis),
    },
    thbAppsImage: card.image,
    thbAppsTitle: card.title,
    thbAppsMinis: card.minis,
    components: buildCardContent(card),
  }
}

function buildTree() {
  return [
    {
      tagName: 'div',
      attributes: { class: 'mi-apps__carousel', 'aria-label': 'All applications carousel' },
      name: 'mi-apps__carousel',
      ...LAYER_PATH_NODE,
      components: [
        {
          tagName: 'div',
          attributes: { class: 'mi-apps__track' },
          name: 'mi-apps__track',
          ...LAYER_PATH_NODE,
          components: DEFAULT_CARDS.map((card, index) => cardComponent(card, index)),
        },
        {
          tagName: 'button',
          attributes: { class: 'mi-apps__arrow mi-apps__arrow--prev', type: 'button', 'aria-label': 'Previous applications' },
          ...INNER_NODE,
          components: SVG_PREV,
        },
        {
          tagName: 'button',
          attributes: { class: 'mi-apps__arrow mi-apps__arrow--next', type: 'button', 'aria-label': 'Next applications' },
          ...INNER_NODE,
          components: SVG_NEXT,
        },
      ],
    },
    {
      tagName: 'div',
      attributes: { class: 'mi-apps__mini', 'aria-live': 'polite', 'aria-label': 'Application bearings' },
      ...INNER_NODE,
      components: buildMiniComponents(DEFAULT_CARDS[0].minis),
    },
  ]
}

function updateRootMini(card: any): void {
  const root = card?.closestType?.(WB_APPS_CAROUSEL_THB_TYPE)
  if (!root) return
  const selected = String(card.getAttributes?.()?.['aria-selected'] || '') === 'true'
  if (!selected) return
  const mini = findChildByClass(root, 'mi-apps__mini')
  mini?.components?.()?.reset?.(buildMiniComponents(getCardData(card).minis))
}

function syncCard(model: any): void {
  const data = getCardData(model)
  model.addAttributes?.({
    class: 'mi-app-card',
    tabindex: '0',
    role: 'button',
    'data-wb-component': 'apps-carousel-thb-card',
    'data-minis': encodeMinis(data.minis),
  })
  const img = findChildByClass(model, 'mi-app-card__img')
  img?.addAttributes?.({ class: 'mi-app-card__img', src: data.image, alt: stripHtml(data.title) })
  writeText(findChildByClass(model, 'mi-app-card__label'), escapeHtml(data.title))
  updateRootMini(model)
}

function hydrateCardProps(model: any): void {
  const image = findChildByClass(model, 'mi-app-card__img')?.getAttributes?.()?.src
  const titleNode = findChildByClass(model, 'mi-app-card__label')
  const title = titleNode?.get?.('content') || titleNode?.toHTML?.()?.replace(/<[^>]*>/g, '') || ''
  const encodedMinis = String(model.getAttributes?.()?.['data-minis'] || '')
  if (image && !model.get?.('thbAppsImage')) model.set?.('thbAppsImage', image, { silent: true })
  if (title && !model.get?.('thbAppsTitle')) model.set?.('thbAppsTitle', title, { silent: true })
  if (encodedMinis && !normalizeMinis(model.get?.('thbAppsMinis')).length) {
    model.set?.('thbAppsMinis', decodeMinis(encodedMinis), { silent: true })
  }
}

function createAddCardTrait() {
  return {
    type: 'button',
    label: '卡片',
    text: '+ 添加应用卡片',
    full: true,
    command(editor: Editor) {
      const selected: any = editor.getSelected()
      const root = selected?.get?.('type') === WB_APPS_CAROUSEL_THB_TYPE
        ? selected
        : selected?.closestType?.(WB_APPS_CAROUSEL_THB_TYPE)
      const track = findChildByClass(root, 'mi-apps__track')
      if (!track) return
      const index = track.components?.()?.length || 0
      track.append?.(cardComponent(DEFAULT_CARDS[index % DEFAULT_CARDS.length], index))
    },
  }
}

function registerMinisTrait(editor: Editor): void {
  const tm = editor.TraitManager
  if (!tm || tm.getType?.('apps-carousel-thb-minis')) return

  tm.addType('apps-carousel-thb-minis', {
    createInput() {
      const el = document.createElement('div') as HTMLElement & {
        __wbAppsCarouselThbMinisVueApp?: ReturnType<typeof createApp>
      }
      el.style.cssText = 'display:flex;flex-direction:column;gap:10px;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const input = elInput as HTMLElement & {
        __wbAppsCarouselThbMinisVueApp?: ReturnType<typeof createApp>
      }
      input.__wbAppsCarouselThbMinisVueApp?.unmount()
      input.innerHTML = ''

      const name = trait.get?.('name') || 'thbAppsMinis'
      const items = ref<MiniItem[]>(normalizeMinis(component.get?.(name)))
      const commit = () => component.set?.(name, normalizeMinis(items.value))
      const updateItem = (index: number, patch: Partial<MiniItem>) => {
        const next = normalizeMinis(items.value)
        next[index] = {
          image: '',
          title: '',
          link: '',
          target: '_self',
          ...(next[index] || {}),
          ...patch,
        }
        items.value = next
        commit()
      }
      const pickImage = (index: number) => {
        const im = getImageManager()
        if (!im) return
        const target = {
          isStyleProp: false,
          selectCallback: (asset: any) => {
            const src = asset?.getSrc?.() ?? asset?.src ?? ''
            if (src) updateItem(index, { image: src })
          },
        }
        if (typeof im.openAssetsDialogWithTarget === 'function') {
          im.openAssetsDialogWithTarget(target)
        } else if (typeof im.openAssetsDialog === 'function') {
          im.openAssetsDialog(target)
        }
      }

      const app = createApp({
        setup() {
          return () =>
            h('div', { style: 'display:flex;flex-direction:column;gap:10px;width:100%;' }, [
              ...items.value.map((item, index) =>
                h(
                  'div',
                  {
                    key: index,
                    style:
                      'display:flex;flex-direction:column;gap:8px;padding:10px;border:1px solid #dcdfe6;border-radius:6px;background:#fff;',
                  },
                  [
                    h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:8px;' }, [
                      h('span', { style: 'font-size:12px;font-weight:600;color:#303846;' }, `Mini ${index + 1}`),
                      h(
                        ElButton,
                        {
                          size: 'small',
                          text: true,
                          type: 'danger',
                          onClick: () => {
                            const next = normalizeMinis(items.value)
                            next.splice(index, 1)
                            items.value = next
                            commit()
                          },
                        },
                        () => '删除',
                      ),
                    ]),
                    h('div', { style: 'display:flex;gap:8px;align-items:center;' }, [
                      h(
                        'div',
                        {
                          style:
                            'width:52px;height:52px;border:1px solid #e5e7eb;border-radius:4px;background:#f5f7fa;overflow:hidden;display:flex;align-items:center;justify-content:center;flex:0 0 auto;',
                        },
                        item.image
                          ? [
                              h('img', {
                                src: item.image,
                                alt: '',
                                style: 'width:100%;height:100%;object-fit:cover;display:block;',
                              }),
                            ]
                          : [h('span', { style: 'font-size:11px;color:#909399;' }, '暂无图片')],
                      ),
                      h('div', { style: 'display:flex;flex-direction:column;gap:6px;flex:1;min-width:0;' }, [
                        h(
                          ElButton,
                          {
                            size: 'small',
                            onClick: () => pickImage(index),
                          },
                          () => '从素材库选择',
                        ),
                        h(ElInput, {
                          modelValue: item.image,
                          placeholder: '图片 URL',
                          size: 'small',
                          clearable: true,
                          'onUpdate:modelValue': (value: string) => updateItem(index, { image: value }),
                        }),
                      ]),
                    ]),
                    h(ElInput, {
                      modelValue: item.title,
                      placeholder: '标题，支持 <br>',
                      size: 'small',
                      type: 'textarea',
                      rows: 2,
                      'onUpdate:modelValue': (value: string) => updateItem(index, { title: value }),
                    }),
                    h(ElInput, {
                      modelValue: item.link,
                      placeholder: '跳转链接',
                      size: 'small',
                      clearable: true,
                      'onUpdate:modelValue': (value: string) => updateItem(index, { link: value }),
                    }),
                    h(
                      ElSelect,
                      {
                        modelValue: item.target === '_blank' ? '_blank' : '_self',
                        placeholder: '打开方式',
                        size: 'small',
                        teleported: false,
                        style: 'width:100%;',
                        'onUpdate:modelValue': (value: string) =>
                          updateItem(index, { target: value === '_blank' ? '_blank' : '_self' }),
                      },
                      () => [
                        h(ElOption, { label: '当前页', value: '_self' }),
                        h(ElOption, { label: '新窗口', value: '_blank' }),
                      ],
                    ),
                  ],
                ),
              ),
              h(
                ElButton,
                {
                  size: 'small',
                  type: 'primary',
                  plain: true,
                  onClick: () => {
                    items.value = [
                      ...normalizeMinis(items.value),
                      { image: './img/products-1.webp', title: 'New<br>mini', link: '#', target: '_self' },
                    ]
                    commit()
                  },
                },
                () => '+ 添加 Mini',
              ),
            ])
        },
      })

      input.__wbAppsCarouselThbMinisVueApp = app
      app.mount(input)
    },
  })
}

function appsCarouselThbScript(this: HTMLElement) {
  const track = this.querySelector('.mi-apps__track') as HTMLElement | null
  const mini = this.querySelector('.mi-apps__mini') as HTMLElement | null
  if (!track || !mini) return

  const carousel = this.querySelector('.mi-apps__carousel') as HTMLElement | null
  const prevBtn = carousel?.querySelector('.mi-apps__arrow--prev') as HTMLElement | null
  const nextBtn = carousel?.querySelector('.mi-apps__arrow--next') as HTMLElement | null
  const cards = Array.prototype.slice.call(track.querySelectorAll('.mi-app-card')) as HTMLElement[]

  function decodeItems(value: string | undefined) {
    if (!value) return []
    try {
      return JSON.parse(decodeURIComponent(value))
    } catch (err) {
      return []
    }
  }

  function escape(value: string) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function escapeAttrValue(value: string) {
    return escape(value).replace(/'/g, '&#39;')
  }

  function getStep() {
    if (!cards.length) return 0
    const cardWidth = cards[0].getBoundingClientRect().width
    const styles = getComputedStyle(track)
    const gap = parseFloat(styles.columnGap || styles.gap) || 0
    return cardWidth + gap
  }

  function scrollByCard(dir: number) {
    track.scrollBy({ left: dir * getStep(), behavior: 'smooth' })
  }

  function renderMini(items: any[]) {
    mini.innerHTML = items.map((it) => {
      const image = escapeAttrValue(it?.image || it?.img || '')
      const title = String(it?.title || '')
      const link = String(it?.link || '')
      const target = it?.target === '_blank' ? '_blank' : '_self'
      const rel = target === '_blank' ? ' rel="noopener noreferrer"' : ''
      const inner = '<img class="mi-mini__img" src="' + image + '" alt="">'
        + '<h3 class="mi-mini__title">' + title + '</h3>'
      if (link) {
        return '<a class="mi-mini" href="' + escapeAttrValue(link) + '" target="' + target + '"' + rel + '>' + inner + '</a>'
      }
      return '<article class="mi-mini">' + inner + '</article>'
    }).join('')
    const nodes = mini.querySelectorAll('.mi-mini')
    nodes.forEach((node, i) => {
      ;(node as HTMLElement).style.setProperty('--mi-enter-delay', (i * 200) + 'ms')
      void (node as HTMLElement).offsetWidth
      node.classList.add('is-entering')
    })
  }

  function ensureCardVisible(card: HTMLElement) {
    const trackRect = track.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    if (cardRect.left < trackRect.left + 4 || cardRect.right > trackRect.right - 4) {
      const delta = cardRect.left - trackRect.left - (trackRect.width - cardRect.width) / 2
      track.scrollBy({ left: delta, behavior: 'smooth' })
    }
  }

  function selectCard(index: number) {
    if (index < 0 || index >= cards.length) return
    cards.forEach((card, i) => {
      card.setAttribute('aria-selected', i === index ? 'true' : 'false')
    })
    renderMini(decodeItems(cards[index].dataset.minis))
    ensureCardVisible(cards[index])
  }

  prevBtn?.addEventListener('click', () => scrollByCard(-1))
  nextBtn?.addEventListener('click', () => scrollByCard(1))

  cards.forEach((card, i) => {
    card.addEventListener('click', () => selectCard(i))
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectCard(i)
      }
    })
  })

  const params = new URLSearchParams(window.location.search)
  const rawIndex = params.get('index')
  const initialIndex = rawIndex === null ? 0 : Number.parseInt(rawIndex, 10)
  selectCard(Number.isFinite(initialIndex) ? Math.max(0, Math.min(cards.length - 1, initialIndex)) : 0)
}

export function registerAppsCarouselThbComponent(editor: Editor): void {
  const domComponents = editor.DomComponents
  const blockManager = editor.BlockManager

  registerMinisTrait(editor)

  domComponents.addType(WB_APPS_CAROUSEL_THB_CARD_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'apps-carousel-thb-card'
        ? { type: WB_APPS_CAROUSEL_THB_CARD_TYPE }
        : false,
    model: {
      defaults: {
        name: 'mi-app-card',
        tagName: 'article',
        selectable: true,
        layerable: true,
        draggable: '.wb-apps-carousel-thb .mi-apps__track',
        droppable: false,
        copyable: true,
        removable: true,
        thbAppsImage: DEFAULT_CARDS[0].image,
        thbAppsTitle: DEFAULT_CARDS[0].title,
        thbAppsMinis: DEFAULT_CARDS[0].minis,
        traits: [
          makeImagePickerTrait('卡片图片', 'thbAppsImage', { showPreview: true }),
          makeTextTrait('卡片标题', 'thbAppsTitle'),
          {
            type: 'apps-carousel-thb-minis',
            label: 'mi-apps__minis',
            name: 'thbAppsMinis',
            changeProp: true,
          },
        ],
      },
      init(this: any) {
        if (!this.components?.()?.length) this.components?.(buildCardContent(getCardData(this)))
        hydrateCardProps(this)
        this.listenTo(this, 'change:thbAppsImage change:thbAppsTitle change:thbAppsMinis', () => syncCard(this))
        syncCard(this)
      },
    },
  })

  domComponents.addType(WB_APPS_CAROUSEL_THB_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'apps-carousel-thb'
        ? { type: WB_APPS_CAROUSEL_THB_TYPE }
        : false,
    model: {
      defaults: {
        name: 'appsCarouselTHB',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'apps-carousel-thb',
          class: 'wb-apps-carousel-thb',
        },
        styles: APPS_CAROUSEL_THB_CSS,
        script: appsCarouselThbScript,
        'script-export': appsCarouselThbScript,
        traits: [createAddCardTrait()],
        components: buildTree(),
      },
    },
  })

  editor.on?.('component:selected', (component: any) => {
    if (!component || component.get?.('type') === WB_APPS_CAROUSEL_THB_CARD_TYPE) return
    const item = component.closestType?.(WB_APPS_CAROUSEL_THB_CARD_TYPE)
    if (!item) return
    const classes = String(component.getAttributes?.()?.class || '').split(/\s+/).filter(Boolean)
    const shouldSelectItem = [
      'mi-app-card',
      'mi-app-card__thumbnail',
      'mi-app-card__img',
      'mi-app-card__label',
    ].some((className) => classes.includes(className))
    if (shouldSelectItem) editor.select?.(item)
  })

  blockManager?.add?.(WB_APPS_CAROUSEL_THB_TYPE, {
    label: 'appsCarouselTHB',
    category: 'Section',
    content: { type: WB_APPS_CAROUSEL_THB_TYPE },
    media: BLOCK_ICON,
  })
}
