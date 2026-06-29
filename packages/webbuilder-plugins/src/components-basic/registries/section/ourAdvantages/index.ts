import type { Editor } from 'grapesjs'
import {
  makeImagePickerTrait,
  makeTextTrait,
  makeTextareaTrait,
} from '../../../traitFactory.js'

export const WB_OUR_ADVANTAGES_TYPE = 'wb-our-advantages'
export const WB_OUR_ADVANTAGES_ITEM_TYPE = 'wb-our-advantages-item'

type AdvantageItem = {
  image: string
  title: string
  description: string
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M12 3l7 4v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V7l7-4Z" />
  <path d="M9 12l2 2 4-5" />
</svg>`

const ICON_BATHROOM = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <path d="M9 39h23V12h7v36" stroke="#003152" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 45h29" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
    <path d="M15 39v-9c0-4 3-7 7-7h5" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
    <path d="M39 12h8v36" stroke="#003152" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`)

const ICON_DURABLE = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="20" stroke="#003152" stroke-width="3"/>
    <path d="M24 34l9-9 10 10" stroke="#003152" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M27 25l-6-6" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
    <path d="M23 12l2 5 5-2" stroke="#003152" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 14c5-3 11-3 16 0" stroke="#003152" stroke-width="2" stroke-linecap="round"/>
  </svg>
`)

const ICON_WATER = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <path d="M32 8c7 9 10 13 10 19a10 10 0 0 1-20 0c0-6 3-10 10-19Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M18 36l10 10v10" stroke="#003152" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M46 36L36 46v10" stroke="#003152" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`)

const ICON_MAINTENANCE = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <path d="M18 10h30v28H18z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 18h14M24 27h18M24 36h7" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
    <path d="M37 34l15 15-6 6-15-15a8 8 0 0 1-2-8l6 6 4-4-6-6a8 8 0 0 1 8 2Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
  </svg>
`)

const DEFAULT_DESCRIPTION = 'The faucets, shower systems, ceramic sanitary ware, bathroom cabinets, and hardware accessories - all are sourced from a single supplier. They have consistent appearance, uniform materials, and controllable quality.'

const DEFAULT_ITEMS: AdvantageItem[] = [
  {
    image: ICON_BATHROOM,
    title: 'Coordinated Bathroom Package',
    description: DEFAULT_DESCRIPTION,
  },
  {
    image: ICON_DURABLE,
    title: 'Durable Materials For High-frequency Environments',
    description: DEFAULT_DESCRIPTION,
  },
  {
    image: ICON_WATER,
    title: 'Water-saving & Energy Efficiency',
    description: DEFAULT_DESCRIPTION,
  },
  {
    image: ICON_MAINTENANCE,
    title: 'Easy Maintenance & Housekeeping-friendly Design',
    description: DEFAULT_DESCRIPTION,
  },
]

const OUR_ADVANTAGES_CSS = `
  .wb-our-advantages {
    width: 100%;
    padding: 68px 0;
    background: #ffffff;
    box-sizing: border-box;
  }
  .wb-our-advantages,
  .wb-our-advantages *,
  .wb-our-advantages *::before,
  .wb-our-advantages *::after {
    box-sizing: border-box;
  }
  .wb-our-advantages__grid {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 64px;
  }
  .wb-our-advantages__item {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .wb-our-advantages__image {
    display: block;
    width: 42px;
    height: 42px;
    object-fit: contain;
    margin-bottom: 28px;
  }
  .wb-our-advantages__title {
    margin: 0;
    max-width: 290px;
    color: #07111c;
    font-size: 22px;
    line-height: 1.32;
    font-weight: 600;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  .wb-our-advantages__description {
    margin: 28px 0 0;
    max-width: 296px;
    color: #7c878d;
    font-size: 16px;
    line-height: 1.6;
    font-weight: 400;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  @media (max-width: 1023px) {
    .wb-our-advantages__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 64px 48px;
    }
    .wb-our-advantages__image {
      width: 52px;
      height: 52px;
      margin-bottom: 28px;
    }
    .wb-our-advantages__title {
      font-size: 30px;
      line-height: 1.38;
      max-width: 360px;
    }
    .wb-our-advantages__description {
      margin-top: 28px;
      font-size: 25px;
      line-height: 1.55;
      max-width: 360px;
    }
  }
  @media (max-width: 767px) {
    .wb-our-advantages {
      padding: 32px 0 40px;
    }
    .wb-our-advantages__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 36px 20px;
    }
    .wb-our-advantages__image {
      width: 32px;
      height: 32px;
      margin-bottom: 16px;
    }
    .wb-our-advantages__title {
      font-size: 16px;
      line-height: 1.35;
      max-width: none;
    }
    .wb-our-advantages__description {
      margin-top: 14px;
      font-size: 13px;
      line-height: 1.55;
      max-width: none;
    }
  }
`

function svgIconDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`
}

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

function buildItemContent(item: AdvantageItem) {
  return [
    {
      tagName: 'img',
      ...nonLayered({
        attributes: {
          class: 'wb-our-advantages__image',
          src: item.image,
          alt: item.title,
        },
      }),
    },
    {
      tagName: 'h3',
      ...nonLayered({
        attributes: { class: 'wb-our-advantages__title' },
      }),
      content: item.title,
    },
    {
      tagName: 'p',
      ...nonLayered({
        attributes: { class: 'wb-our-advantages__description' },
      }),
      content: item.description,
    },
  ]
}

function buildItemDef(item: AdvantageItem, index = 0) {
  return {
    type: WB_OUR_ADVANTAGES_ITEM_TYPE,
    tagName: 'article',
    name: `优势项 · ${item.title}`,
    selectable: true,
    layerable: true,
    draggable: '.wb-our-advantages__grid',
    droppable: false,
    copyable: true,
    removable: true,
    advImage: item.image,
    advTitle: item.title,
    advDescription: item.description,
    attributes: {
      class: 'wb-our-advantages__item',
      'data-wb-component': 'our-advantages-item',
      'data-item-index': String(index),
    },
    components: buildItemContent(item),
  }
}

function getItemTraits() {
  return [
    makeImagePickerTrait('图片', 'advImage', { showPreview: true }),
    makeTextTrait('标题', 'advTitle', { placeholder: 'Advantage title' }),
    makeTextareaTrait('描述', 'advDescription', { placeholder: 'Advantage description', rows: 5 }),
  ]
}

function getItemData(model: any): AdvantageItem {
  return {
    image: String(model.get?.('advImage') || '').trim() || ICON_BATHROOM,
    title: String(model.get?.('advTitle') || '').trim() || 'Advantage Title',
    description: String(model.get?.('advDescription') || '').trim() || DEFAULT_DESCRIPTION,
  }
}

function syncItem(model: any): void {
  const item = getItemData(model)
  const itemName = `优势项 · ${item.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)

  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'wb-our-advantages__item',
    'data-wb-component': 'our-advantages-item',
  })

  const image = findChildByClass(model, 'wb-our-advantages__image')
  image?.addAttributes?.({
    class: 'wb-our-advantages__image',
    src: item.image,
    alt: item.title,
  })
  writeText(findChildByClass(model, 'wb-our-advantages__title'), item.title)
  writeText(findChildByClass(model, 'wb-our-advantages__description'), item.description)
}

function resolveAdvantagesTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_OUR_ADVANTAGES_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_OUR_ADVANTAGES_TYPE) as any
  if (fromSelected?.get?.('type') === WB_OUR_ADVANTAGES_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_OUR_ADVANTAGES_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_OUR_ADVANTAGES_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_OUR_ADVANTAGES_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_OUR_ADVANTAGES_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_OUR_ADVANTAGES_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_OUR_ADVANTAGES_TYPE) return fromTraitTarget

  return null
}

function createAddItemTrait() {
  return {
    type: 'button' as any,
    name: 'add-advantage-item',
    label: false as const,
    text: '+ 添加优势项',
    full: true,
    command(this: any, editor: Editor) {
      const list = resolveAdvantagesTarget(editor, this)
      const grid = list?._getGrid?.()
      const items = grid?.components?.()
      if (!items) return

      const index = items.length || 0
      const created = items.add(buildItemDef({
        image: ICON_BATHROOM,
        title: `Advantage ${index + 1}`,
        description: DEFAULT_DESCRIPTION,
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
      name: '优势列表',
      ...nonLayered({
        selectable: true,
        droppable: '.wb-our-advantages__item',
        attributes: { class: 'wb-our-advantages__grid' },
      }),
      components: DEFAULT_ITEMS.map((item, index) => buildItemDef(item, index)),
    },
  ]
}

export function registerOurAdvantagesComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_OUR_ADVANTAGES_TYPE)) return

  domComponents.addType(WB_OUR_ADVANTAGES_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'our-advantages-item'
      || el?.classList?.contains('wb-our-advantages__item')
        ? { type: WB_OUR_ADVANTAGES_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '优势项',
        tagName: 'article',
        selectable: true,
        layerable: true,
        draggable: '.wb-our-advantages__grid',
        droppable: false,
        copyable: true,
        removable: true,
        advImage: '',
        advTitle: 'Advantage Title',
        advDescription: DEFAULT_DESCRIPTION,
        traits: getItemTraits(),
      },
      init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(buildItemContent(getItemData(this)))
        }
        this.listenTo(this, 'change:advImage change:advTitle change:advDescription', () => syncItem(this))
        syncItem(this)
      },
    },
  })

  domComponents.addType(WB_OUR_ADVANTAGES_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'our-advantages'
        ? { type: WB_OUR_ADVANTAGES_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Our Advantages',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'our-advantages',
          class: 'wb-our-advantages',
        },
        styles: OUR_ADVANTAGES_CSS,
        traits: [createAddItemTrait()],
        components: buildTree(),
      },
      _getGrid(this: any) {
        return this.components?.()?.at?.(0) ?? null
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_OUR_ADVANTAGES_TYPE || type === WB_OUR_ADVANTAGES_ITEM_TYPE) return

    const item = component?.closestType?.(WB_OUR_ADVANTAGES_ITEM_TYPE)
    if (item?.get?.('type') === WB_OUR_ADVANTAGES_ITEM_TYPE) {
      editor.select?.(item)
    }
  })

  blockManager?.add?.(WB_OUR_ADVANTAGES_TYPE, {
    label: 'Our Advantages',
    category: 'Section',
    content: { type: WB_OUR_ADVANTAGES_TYPE },
    media: BLOCK_ICON,
  })
}
