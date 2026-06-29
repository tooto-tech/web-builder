import type { Editor } from 'grapesjs'
import { makeImagePickerTrait, makeTextTrait } from '../../../traitFactory.js'

export const WB_SERVICE_ICON_GRID_TYPE = 'wb-service-icon-grid'
export const WB_SERVICE_ICON_GRID_ITEM_TYPE = 'wb-service-icon-grid-item'

type ServiceIconGridItem = {
  image: string
  title: string
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 5.5h16" />
  <path d="M4 12h16" />
  <path d="M4 18.5h16" />
  <path d="M8 3v19" />
  <path d="M16 3v19" />
</svg>`

const ICON_BOX = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72" fill="none">
    <path d="M20 22h56v38H20V22Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 22V10h32v12" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 10h32" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
  </svg>
`)

const ICON_PLANE = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72" fill="none">
    <path d="M18 28 78 8 56 64 45 38 18 28Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M45 38 78 8" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
  </svg>
`)

const ICON_SHIP = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72" fill="none">
    <path d="M20 48h56l-10 12H30L20 48Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M33 48V24h30v24" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42 24V12h12v12" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M48 12V4" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 36v8M48 32v12M58 36v8" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 62c5 0 5-3 10-3s5 3 10 3 5-3 10-3 5 3 10 3 5-3 10-3 5 3 10 3 5-3 10-3" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
  </svg>
`)

const ICON_TRUCK = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72" fill="none">
    <path d="M14 24h52v28H14V24Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M66 34h12l8 10v8H66V34Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 58a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM72 58a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="#003152" stroke-width="3"/>
    <path d="M10 32h10M8 40h12" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
  </svg>
`)

const ICON_DOC = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72" fill="none">
    <path d="M30 10h28l12 12v40H30V10Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M58 10v13h12" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M38 34h20M38 44h22M38 54h16" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
  </svg>
`)

const ICON_WAREHOUSE = svgIconDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72" fill="none">
    <path d="M18 32 48 18l30 14v30H18V32Z" stroke="#003152" stroke-width="3" stroke-linejoin="round"/>
    <path d="M28 42h40M28 50h40M28 58h40" stroke="#003152" stroke-width="3" stroke-linecap="round"/>
  </svg>
`)

const DEFAULT_ITEMS: ServiceIconGridItem[] = [
  { image: ICON_BOX, title: 'LCL Support' },
  { image: ICON_PLANE, title: 'North America High-Frequency Routes' },
  { image: ICON_SHIP, title: 'Batch Delivery' },
  { image: ICON_TRUCK, title: 'Rapid Replenishment' },
  { image: ICON_DOC, title: 'Full Documentation for Customs' },
  { image: ICON_WAREHOUSE, title: 'Warehousing Options' }
]

const SERVICE_ICON_GRID_CSS = `
  .wb-service-icon-grid {
    width: 100%;
    padding: 56px 0 64px;
    background: #f5f7f8;
    box-sizing: border-box;
  }
  .wb-service-icon-grid,
  .wb-service-icon-grid *,
  .wb-service-icon-grid *::before,
  .wb-service-icon-grid *::after {
    box-sizing: border-box;
  }
  .wb-service-icon-grid__grid {
    width: 100%;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 64px;
  }
  .wb-service-icon-grid__item {
    position: relative;
    min-width: 0;
    min-height: 102px;
    padding: 0 42px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
  }
  .wb-service-icon-grid__item:not(:nth-child(3n + 1))::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 1px;
    height: 102px;
    background: #dde2e6;
  }
  .wb-service-icon-grid__image {
    display: block;
    width: 72px;
    height: 56px;
    object-fit: contain;
    margin: 0 0 22px;
  }
  .wb-service-icon-grid__title {
    margin: 0;
    max-width: 520px;
    color: #003152;
    font-size: 20px;
    line-height: 1.32;
    font-weight: 500;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
 
 @media (max-width: 767px) {
    .wb-service-icon-grid {
      padding: 0;
    }
    .wb-service-icon-grid__grid {
      row-gap: 8px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .wb-service-icon-grid__item::before {
      display: none;
    }
    .wb-service-icon-grid__item:nth-child(even)::before {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      top: 58px;
      width: 1px;
      height: 62px;
      background: #dde2e6;
    }
    .wb-service-icon-grid__item {
      min-height: 165px;
      padding: 0 12px;
    }
    .wb-service-icon-grid__item:nth-child(even)::before {
      top: 54px;
      height: 62px;
    }
    .wb-service-icon-grid__image {
      width: 42px;
      margin-bottom: 8px;
    }
    .wb-service-icon-grid__title {
      max-width: 280px;
      font-size: 16px;
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
    ...extra
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
    const classes = String(attrs.class || '')
      .split(/\s+/)
      .filter(Boolean)
    if (classes.includes(className)) return child
    const found = findChildByClass(child, className)
    if (found) return found
  }
  return null
}

function buildItemContent(item: ServiceIconGridItem) {
  return [
    {
      tagName: 'img',
      ...nonLayered({
        attributes: {
          class: 'wb-service-icon-grid__image',
          src: item.image,
          alt: item.title
        }
      })
    },
    {
      tagName: 'h3',
      ...nonLayered({
        attributes: { class: 'wb-service-icon-grid__title' }
      }),
      content: item.title
    }
  ]
}

function buildItemDef(item: ServiceIconGridItem, index = 0) {
  return {
    type: WB_SERVICE_ICON_GRID_ITEM_TYPE,
    tagName: 'article',
    name: `服务项 · ${item.title}`,
    selectable: true,
    layerable: true,
    draggable: '.wb-service-icon-grid__grid',
    droppable: false,
    copyable: true,
    removable: true,
    serviceImage: item.image,
    serviceTitle: item.title,
    attributes: {
      class: 'wb-service-icon-grid__item',
      'data-wb-component': 'service-icon-grid-item',
      'data-item-index': String(index)
    },
    components: buildItemContent(item)
  }
}

function getItemTraits() {
  return [
    makeImagePickerTrait('图片', 'serviceImage', { showPreview: true }),
    makeTextTrait('标题', 'serviceTitle', { placeholder: 'Service title' })
  ]
}

function getItemData(model: any): ServiceIconGridItem {
  return {
    image: String(model.get?.('serviceImage') || '').trim() || ICON_BOX,
    title: String(model.get?.('serviceTitle') || '').trim() || 'Service Title'
  }
}

function syncItem(model: any): void {
  const item = getItemData(model)
  const itemName = `服务项 · ${item.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)

  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'wb-service-icon-grid__item',
    'data-wb-component': 'service-icon-grid-item'
  })

  const image = findChildByClass(model, 'wb-service-icon-grid__image')
  image?.addAttributes?.({
    class: 'wb-service-icon-grid__image',
    src: item.image,
    alt: item.title
  })
  writeText(findChildByClass(model, 'wb-service-icon-grid__title'), item.title)
}

function resolveServiceIconGridTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_SERVICE_ICON_GRID_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_SERVICE_ICON_GRID_TYPE) as any
  if (fromSelected?.get?.('type') === WB_SERVICE_ICON_GRID_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_SERVICE_ICON_GRID_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_SERVICE_ICON_GRID_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_SERVICE_ICON_GRID_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_SERVICE_ICON_GRID_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_SERVICE_ICON_GRID_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_SERVICE_ICON_GRID_TYPE) return fromTraitTarget

  return null
}

function createAddItemTrait() {
  return {
    type: 'button' as any,
    name: 'add-service-icon-grid-item',
    label: false as const,
    text: '+ 添加服务项',
    full: true,
    command(this: any, editor: Editor) {
      const root = resolveServiceIconGridTarget(editor, this)
      const grid = root?._getGrid?.()
      const items = grid?.components?.()
      if (!items) return

      const index = items.length || 0
      const created = items.add(
        buildItemDef(
          {
            image: ICON_BOX,
            title: `Service ${index + 1}`
          },
          index
        )
      )
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    }
  }
}

function buildTree() {
  return [
    {
      tagName: 'div',
      name: '服务项列表',
      ...nonLayered({
        selectable: true,
        droppable: '.wb-service-icon-grid__item',
        attributes: { class: 'wb-service-icon-grid__grid' }
      }),
      components: DEFAULT_ITEMS.map((item, index) => buildItemDef(item, index))
    }
  ]
}

export function registerServiceIconGridComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_SERVICE_ICON_GRID_TYPE)) return

  domComponents.addType(WB_SERVICE_ICON_GRID_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'service-icon-grid-item' ||
      el?.classList?.contains('wb-service-icon-grid__item')
        ? { type: WB_SERVICE_ICON_GRID_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '服务项',
        tagName: 'article',
        selectable: true,
        layerable: true,
        draggable: '.wb-service-icon-grid__grid',
        droppable: false,
        copyable: true,
        removable: true,
        serviceImage: '',
        serviceTitle: 'Service Title',
        traits: getItemTraits()
      },
      init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(buildItemContent(getItemData(this)))
        }
        this.listenTo(this, 'change:serviceImage change:serviceTitle', () => syncItem(this))
        syncItem(this)
      }
    }
  })

  domComponents.addType(WB_SERVICE_ICON_GRID_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'service-icon-grid'
        ? { type: WB_SERVICE_ICON_GRID_TYPE }
        : false,
    model: {
      defaults: {
        name: '服务图标网格',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'service-icon-grid',
          class: 'wb-service-icon-grid'
        },
        styles: SERVICE_ICON_GRID_CSS,
        traits: [createAddItemTrait()],
        components: buildTree()
      },
      _getGrid(this: any) {
        return this.components?.()?.at?.(0) ?? null
      }
    }
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_SERVICE_ICON_GRID_TYPE || type === WB_SERVICE_ICON_GRID_ITEM_TYPE) return

    const item = component?.closestType?.(WB_SERVICE_ICON_GRID_ITEM_TYPE)
    if (item?.get?.('type') === WB_SERVICE_ICON_GRID_ITEM_TYPE) {
      editor.select?.(item)
    }
  })

  if (!blockManager?.get?.(WB_SERVICE_ICON_GRID_TYPE)) {
    blockManager?.add?.(WB_SERVICE_ICON_GRID_TYPE, {
      label: '服务图标网格',
      category: 'Section',
      content: { type: WB_SERVICE_ICON_GRID_TYPE },
      media: BLOCK_ICON
    })
  }
}
