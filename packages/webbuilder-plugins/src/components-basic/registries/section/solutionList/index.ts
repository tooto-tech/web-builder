import type { Editor } from 'grapesjs'
import {
  makeImagePickerTrait,
  makeLinkTrait,
  makeTextTrait,
} from '../../../traitFactory.js'

export const WB_SOLUTION_LIST_TYPE = 'wb-solution-list'
export const WB_SOLUTION_LIST_CARD_TYPE = 'wb-solution-list-card'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="4" width="8" height="7" rx="1" />
  <rect x="13" y="4" width="8" height="7" rx="1" />
  <rect x="3" y="13" width="8" height="7" rx="1" />
  <rect x="13" y="13" width="8" height="7" rx="1" />
</svg>`

type SolutionCard = {
  image: string
  title: string
  primaryText: string
  primaryHref: string
  secondaryText: string
  secondaryHref: string
}

const DEFAULT_CARDS: SolutionCard[] = [
  {
    image: 'https://placehold.co/708x356/202326/e5e7eb?text=Commercial+Buildings',
    title: 'Public & Commercial Buildings',
    primaryText: 'Inquiry Now',
    primaryHref: '#',
    secondaryText: 'Learn More',
    secondaryHref: '#',
  },
  {
    image: 'https://placehold.co/708x356/303235/e5e7eb?text=Real+Estate',
    title: 'High-end Residences & Real Estate',
    primaryText: 'Inquiry Now',
    primaryHref: '#',
    secondaryText: 'Learn More',
    secondaryHref: '#',
  },
  {
    image: 'https://placehold.co/708x356/d7d8d4/31363a?text=Healthcare',
    title: 'Healthcare & Wellness Spaces',
    primaryText: 'Inquiry Now',
    primaryHref: '#',
    secondaryText: 'Learn More',
    secondaryHref: '#',
  },
  {
    image: 'https://placehold.co/708x356/8d8f8d/ffffff?text=Hotels',
    title: 'Hotels & Resorts',
    primaryText: 'Inquiry Now',
    primaryHref: '#',
    secondaryText: 'Learn More',
    secondaryHref: '#',
  },
  {
    image: 'https://placehold.co/708x356/6d746e/ffffff?text=Apartments',
    title: 'Small Houses & Apartments',
    primaryText: 'Inquiry Now',
    primaryHref: '#',
    secondaryText: 'Learn More',
    secondaryHref: '#',
  },
]

const SOLUTION_LIST_CSS = `
  .wb-solution-list {
    width: 100%;
    padding: 0;
    box-sizing: border-box;
  }
  .wb-solution-list,
  .wb-solution-list *,
  .wb-solution-list *::before,
  .wb-solution-list *::after {
    box-sizing: border-box;
  }
  .wb-solution-list__grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
  }
  .wb-solution-list__card {
    position: relative;
    display: block;
    min-width: 0;
    aspect-ratio: 670 / 700;
    overflow: hidden;
    background: #111111;
  }
  .wb-solution-list__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.75);
    transform: scale(1);
    transition: transform 260ms ease, filter 260ms ease;
  }
  .wb-solution-list__shade {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.04) 28%, rgba(0, 0, 0, 0.72) 100%),
      linear-gradient(90deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.04));
    pointer-events: none;
  }
  .wb-solution-list__content {
    position: absolute;
    left: 8%;
    right: 8%;
    bottom: 8%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    text-align: center;
    color: #ffffff;
  }
  .wb-solution-list__title {
    margin: 0;
    max-width: 420px;
    color: #ffffff;
    font-size: 36px;
    line-height: 1.08;
    font-weight: 600;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  .wb-solution-list__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
    transition: max-height 220ms ease, opacity 180ms ease, transform 180ms ease;
  }
  .wb-solution-list__card:hover .wb-solution-list__actions{
    max-height: 50px;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .wb-solution-list__card:focus-within .wb-solution-list__actions {
    max-height: 50px;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .wb-solution-list__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    border-radius: 0;
    color: #ffffff;
    font-size: 16px;
    line-height: 1.4;
    font-weight: 500;
    letter-spacing: 0;
    text-decoration: none;
    white-space: nowrap;
  }
  .wb-solution-list__button--primary {
    background: #FFE200;
    color: #00101A;
    border: solid 1px #FFE200;
  }
  .wb-solution-list__button--secondary {
    background: transparent;
    color: #ffffff;
    border: solid 1px #ffffff;
  }
  .wb-solution-list__card:hover .wb-solution-list__image {
    filter: saturate(0.9);
    transform: scale(1.04);
  }
  @media (max-width: 1023px) {
    .wb-solution-list__title {
      font-size: 22px;
    }
  }
  @media (max-width: 767px) {
    .wb-solution-list__grid {
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 20px;
    }
    .wb-solution-list__card {
      aspect-ratio: 670 / 700;
    }
    .wb-solution-list__content {
      left: 6%;
      right: 6%;
      bottom: 7%;
      gap: 12px;
    }
    .wb-solution-list__title {
      font-size: 15px;
      line-height: 1.12;
      max-width: 150px;
    }
    .wb-solution-list__actions {
      max-height: 32px;
      opacity: 1;
      transform: none;
      pointer-events: auto;
      gap: 5px;
    }
    .wb-solution-list__button {
      min-height: 22px;
      padding: 6px 9px;
      font-size: 9px;
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

function buildCardContent(card: SolutionCard) {
  return [
    {
      tagName: 'img',
      ...nonLayered({
        attributes: {
          class: 'wb-solution-list__image',
          src: card.image,
          alt: card.title,
        },
      }),
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'wb-solution-list__shade' },
      }),
    },
    {
      tagName: 'div',
      ...nonLayered({
        attributes: { class: 'wb-solution-list__content' },
      }),
      components: [
        {
          tagName: 'h3',
          ...nonLayered({
            attributes: { class: 'wb-solution-list__title' },
          }),
          content: card.title,
        },
        {
          tagName: 'div',
          ...nonLayered({
            attributes: { class: 'wb-solution-list__actions' },
          }),
          components: [
            {
              tagName: 'a',
              ...nonLayered({
                attributes: {
                  class: 'wb-solution-list__button wb-solution-list__button--primary',
                  href: card.primaryHref,
                },
              }),
              content: card.primaryText,
            },
            {
              tagName: 'a',
              ...nonLayered({
                attributes: {
                  class: 'wb-solution-list__button wb-solution-list__button--secondary',
                  href: card.secondaryHref,
                },
              }),
              content: card.secondaryText,
            },
          ],
        },
      ],
    },
  ]
}

function buildCardDef(card: SolutionCard, index = 0) {
  return {
    type: WB_SOLUTION_LIST_CARD_TYPE,
    tagName: 'article',
    name: `解决方案卡片 · ${card.title}`,
    selectable: true,
    layerable: true,
    draggable: '.wb-solution-list__grid',
    droppable: false,
    copyable: true,
    removable: true,
    slImage: card.image,
    slTitle: card.title,
    slPrimaryText: card.primaryText,
    slPrimaryHref: card.primaryHref,
    slSecondaryText: card.secondaryText,
    slSecondaryHref: card.secondaryHref,
    attributes: {
      class: 'wb-solution-list__card',
      'data-wb-component': 'solution-list-card',
      'data-card-index': String(index),
    },
    components: buildCardContent(card),
  }
}

function getCardTraits() {
  return [
    makeImagePickerTrait('图片', 'slImage', { showPreview: true }),
    makeTextTrait('标题', 'slTitle', { placeholder: 'Solution title' }),
    makeTextTrait('主要按钮文字', 'slPrimaryText', { placeholder: 'Inquiry Now' }),
    makeLinkTrait({ label: '主要按钮链接', name: 'slPrimaryHref', placeholder: '#' }),
    makeTextTrait('次要按钮文字', 'slSecondaryText', { placeholder: 'Learn More' }),
    makeLinkTrait({ label: '次要按钮链接', name: 'slSecondaryHref', placeholder: '#' }),
  ]
}

function getCardData(model: any): SolutionCard {
  return {
    image: String(model.get?.('slImage') || '').trim() || 'https://placehold.co/708x356/202326/e5e7eb?text=Solution',
    title: String(model.get?.('slTitle') || '').trim() || 'Solution',
    primaryText: String(model.get?.('slPrimaryText') || '').trim() || 'Inquiry Now',
    primaryHref: String(model.get?.('slPrimaryHref') || '').trim() || '#',
    secondaryText: String(model.get?.('slSecondaryText') || '').trim() || 'Learn More',
    secondaryHref: String(model.get?.('slSecondaryHref') || '').trim() || '#',
  }
}

function syncCard(model: any): void {
  const card = getCardData(model)
  const itemName = `解决方案卡片 · ${card.title}`
  if (model.get?.('name') !== itemName) model.set?.('name', itemName)

  model.addAttributes?.({
    ...(model.getAttributes?.() || {}),
    class: 'wb-solution-list__card',
    'data-wb-component': 'solution-list-card',
  })

  const image = findChildByClass(model, 'wb-solution-list__image')
  image?.addAttributes?.({
    class: 'wb-solution-list__image',
    src: card.image,
    alt: card.title,
  })

  writeText(findChildByClass(model, 'wb-solution-list__title'), card.title)

  const primary = findChildByClass(model, 'wb-solution-list__button--primary')
  primary?.addAttributes?.({
    class: 'wb-solution-list__button wb-solution-list__button--primary',
    href: card.primaryHref,
  })
  writeText(primary, card.primaryText)

  const secondary = findChildByClass(model, 'wb-solution-list__button--secondary')
  secondary?.addAttributes?.({
    class: 'wb-solution-list__button wb-solution-list__button--secondary',
    href: card.secondaryHref,
  })
  writeText(secondary, card.secondaryText)
}

function resolveSolutionListTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_SOLUTION_LIST_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_SOLUTION_LIST_TYPE) as any
  if (fromSelected?.get?.('type') === WB_SOLUTION_LIST_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_SOLUTION_LIST_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_SOLUTION_LIST_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_SOLUTION_LIST_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_SOLUTION_LIST_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_SOLUTION_LIST_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_SOLUTION_LIST_TYPE) return fromTraitTarget

  return null
}

function createAddCardTrait() {
  return {
    type: 'button' as any,
    name: 'add-solution-card',
    label: false as const,
    text: '+ 添加卡片',
    full: true,
    command(this: any, editor: Editor) {
      const list = resolveSolutionListTarget(editor, this)
      const grid = list?.find?.('.wb-solution-list__grid')?.[0]
      const cards = grid?.components?.()
      if (!cards) return

      const index = cards.length || 0
      const created = cards.add(buildCardDef({
        image: 'https://placehold.co/708x356/202326/e5e7eb?text=Solution',
        title: `Solution ${index + 1}`,
        primaryText: 'Inquiry Now',
        primaryHref: '#',
        secondaryText: 'Learn More',
        secondaryHref: '#',
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
      name: '卡片列表',
      ...nonLayered({
        selectable: true,
        droppable: '.wb-solution-list__card',
        attributes: { class: 'wb-solution-list__grid' },
      }),
      components: DEFAULT_CARDS.map((card, index) => buildCardDef(card, index)),
    },
  ]
}

export function registerSolutionListComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_SOLUTION_LIST_TYPE)) return

  domComponents.addType(WB_SOLUTION_LIST_CARD_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'solution-list-card'
      || el?.classList?.contains('wb-solution-list__card')
        ? { type: WB_SOLUTION_LIST_CARD_TYPE }
        : false,
    model: {
      defaults: {
        name: '解决方案卡片',
        tagName: 'article',
        selectable: true,
        layerable: true,
        draggable: '.wb-solution-list__grid',
        droppable: false,
        copyable: true,
        removable: true,
        slImage: '',
        slTitle: 'Solution',
        slPrimaryText: 'Inquiry Now',
        slPrimaryHref: '#',
        slSecondaryText: 'Learn More',
        slSecondaryHref: '#',
        traits: getCardTraits(),
      },
      init(this: any) {
        if (!this.components?.()?.length) {
          this.components?.(buildCardContent(getCardData(this)))
        }
        this.listenTo(
          this,
          'change:slImage change:slTitle change:slPrimaryText change:slPrimaryHref change:slSecondaryText change:slSecondaryHref',
          () => syncCard(this),
        )
        syncCard(this)
      },
    },
  })

  domComponents.addType(WB_SOLUTION_LIST_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'solution-list'
        ? { type: WB_SOLUTION_LIST_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Solution List',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'solution-list',
          class: 'wb-solution-list',
        },
        styles: SOLUTION_LIST_CSS,
        traits: [createAddCardTrait()],
        components: buildTree(),
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_SOLUTION_LIST_TYPE || type === WB_SOLUTION_LIST_CARD_TYPE) return

    const card = component?.closestType?.(WB_SOLUTION_LIST_CARD_TYPE)
    if (card?.get?.('type') === WB_SOLUTION_LIST_CARD_TYPE) {
      editor.select?.(card)
    }
  })

  blockManager?.add?.(WB_SOLUTION_LIST_TYPE, {
    label: 'Solution List',
    category: 'Section',
    content: { type: WB_SOLUTION_LIST_TYPE },
    media: BLOCK_ICON,
  })
}
