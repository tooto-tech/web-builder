import type { Editor } from 'grapesjs'
import { makeImagePickerTrait } from '@/components/WebBuilder/utils/traitFactory'

export const WB_CUSTOMIZATION_GRID_TYPE = 'wb-customization-grid'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="3" width="8" height="8" rx="1.5" />
  <rect x="13" y="3" width="8" height="8" rx="1.5" />
  <rect x="3" y="13" width="8" height="8" rx="1.5" />
  <rect x="13" y="13" width="8" height="8" rx="1.5" />
</svg>`

const DEFAULT_DESCRIPTION =
  'Customize Complete Bathroom Collections Including Shower Doors, Hardware, And Coordinated Designs For A Consistent Product Lineup.'

const DEFAULT_TITLE = 'What You Can Customize'

const DEFAULT_CARDS = [
  {
    title: 'Whole Bathroom Customization',
    desc: DEFAULT_DESCRIPTION,
    image: 'https://placehold.co/800x592/2f3945/ffffff?text=Whole+Bathroom+Customization'
  },
  {
    title: 'Size & Configuration',
    desc: DEFAULT_DESCRIPTION,
    image: 'https://placehold.co/800x592/d7ece8/1f2937?text=Size+%26+Configuration'
  },
  {
    title: 'Branding & Packaging',
    desc: DEFAULT_DESCRIPTION,
    image: 'https://placehold.co/800x592/e9decb/1f2937?text=Branding+%26+Packaging'
  },
  {
    title: 'Style & Material Options',
    desc: DEFAULT_DESCRIPTION,
    image: 'https://placehold.co/800x592/d9d2c7/1f2937?text=Style+%26+Material+Options'
  }
] as const

const TEXT_STYLABLE_PROPS = [
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration'
] as const

const CUSTOMIZATION_GRID_CSS = `
  .wb-customization-grid {
    width: 100%;
    padding: 100px 0;
    box-sizing: border-box;
    background: #FAFAFA;
  }
  .wb-customization-grid,
  .wb-customization-grid *,
  .wb-customization-grid *::before,
  .wb-customization-grid *::after {
    box-sizing: border-box;
  }
  .wb-customization-grid__inner {
    width: 100%;
    max-width: 1320px;
    margin: 0 auto;
    padding: 0;
  }
  .wb-customization-grid__title {
    margin: 0 0 48px;
    color: #101722;
    text-align: center;
    font-size: clamp(48px, 3vw, 56px);
    line-height: 1.3;
    font-weight: 600;
  }
  .wb-customization-grid__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
  .wb-customization-grid__card {
    position: relative;
    overflow: hidden;
    aspect-ratio: 400 / 300;
    background: #d9dee5;
    isolation: isolate;
  }
  .wb-customization-grid__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1);
    filter: saturate(0.96) brightness(0.96);
    transition:
      transform 0.72s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.48s ease;
    will-change: transform, filter;
  }
  .wb-customization-grid__overlay {
    position: absolute;
    inset: 0;
    display: block;
    text-align: center;
  }
  .wb-customization-grid__overlay::before,
  .wb-customization-grid__overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .wb-customization-grid__overlay::before {
    opacity: 1;
    background: linear-gradient(180deg, rgba(7, 13, 24, 0.14) 0%, rgba(7, 13, 24, 0.28) 100%);
    transition: opacity 0.42s ease;
  }
  .wb-customization-grid__overlay::after {
    opacity: 0;
    background: rgba(0, 0, 0, 0.6);
    transition: opacity 0.46s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wb-customization-grid__copy {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: calc(100% - 36px);
    width: min(calc(100% - 72px), 520px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
    text-align: center;
    opacity: 1;
    transform: translate(-50%, -100%);
    transition:
      top 0.62s cubic-bezier(0.16, 1, 0.3, 1),
      gap 0.34s ease,
      transform 0.62s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.3s ease;
  }
  .wb-customization-grid__card-title {
    margin: 0;
    color: #ffffff;
    font-size: clamp(28px, 2vw, 34px);
    line-height: 1.3;
    font-weight: 600;
    text-wrap: balance;
    text-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
  }
  .wb-customization-grid__card-desc {
    margin: 0;
    width: 100%;
    color: rgba(255, 255, 255, 0.92);
    font-size: 16px;
    line-height: 1.65;
    max-height: 0;
    min-height: 0;
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transform: translateY(14px);
    pointer-events: none;
    transition:
      max-height 0.46s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.24s ease,
      transform 0.52s cubic-bezier(0.16, 1, 0.3, 1),
      visibility 0s linear 0.24s;
  }
  .wb-customization-grid__card.is-active .wb-customization-grid__image {
    transform: scale(1.06);
    filter: saturate(1) brightness(0.74);
  }
  .wb-customization-grid__card.is-active .wb-customization-grid__overlay::before {
    opacity: 1;
  }
  .wb-customization-grid__card.is-active .wb-customization-grid__overlay::after {
    opacity: 1;
  }
  .wb-customization-grid__card.is-active .wb-customization-grid__copy {
    top: 50%;
    gap: 14px;
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  .wb-customization-grid__card.is-active .wb-customization-grid__card-desc {
    max-height: 180px;
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
    pointer-events: auto;
    transition-delay: 0.06s, 0.06s, 0s, 0s;
  }
  @media (hover: hover) and (pointer: fine) {
    .wb-customization-grid__card:hover .wb-customization-grid__image {
      transform: scale(1.06);
      filter: saturate(1) brightness(0.74);
    }
    .wb-customization-grid__card:hover .wb-customization-grid__overlay::before {
      opacity: 1;
    }
    .wb-customization-grid__card:hover .wb-customization-grid__overlay::after {
      opacity: 1;
    }
    .wb-customization-grid__card:hover .wb-customization-grid__copy {
      top: 50%;
      gap: 14px;
      opacity: 1;
      transform: translate(-50%, -50%);
    }
    .wb-customization-grid__card:hover .wb-customization-grid__card-desc {
      max-height: 180px;
      opacity: 1;
      transform: translateY(0);
      visibility: visible;
      pointer-events: auto;
      transition-delay: 0.06s, 0.06s, 0s, 0s;
    }
  }
  @media (max-width: 1023px) {
    .wb-customization-grid {
      padding: 56px 0;
    }
    .wb-customization-grid__title {
      margin-bottom: 24px;
      font-size: clamp(26px, 5vw, 38px);
    }
    .wb-customization-grid__copy {
      width: min(calc(100% - 60px), 520px);
    }
    .wb-customization-grid__card-title {
      font-size: 26px;
    }
  }
  @media (max-width: 767px) {
    .wb-customization-grid {
      padding: 40px 0;
    }
    .wb-customization-grid__inner {
      padding: 0 16px;
    }
    .wb-customization-grid__title {
      margin-bottom: 24px;
      font-size: 20px;
    }
    .wb-customization-grid__grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
    .wb-customization-grid__card {
      cursor: pointer;
    }
    .wb-customization-grid__copy {
      top: calc(100% - 18px);
      width: min(calc(100% - 36px), 520px);
    }
    .wb-customization-grid__card-title {
      font-size: 16px;
    }
    .wb-customization-grid__card-desc {
      font-size: 13px;
      line-height: 1.45;
    }
  }
`

type CardField = {
  image: string
  title: string
  desc: string
}

function freezeNode(extra: Record<string, unknown> = {}) {
  return {
    selectable: false,
    hoverable: false,
    draggable: false,
    droppable: false,
    highlightable: false,
    copyable: false,
    removable: false,
    editable: false,
    stylable: false,
    layerable: false,
    ...extra
  }
}

function buildEditableText(tagName: string, name: string, className: string, content: string) {
  return {
    type: 'text',
    tagName,
    name,
    selectable: true,
    hoverable: true,
    draggable: false,
    droppable: false,
    editable: true,
    stylable: [...TEXT_STYLABLE_PROPS],
    highlightable: true,
    copyable: false,
    removable: false,
    layerable: false,
    attributes: { class: className },
    components: content
  }
}

function buildCard(card: CardField, index: number) {
  return {
    tagName: 'article',
    name: `卡片 ${index + 1}`,
    ...freezeNode({
      attributes: {
        class: 'wb-customization-grid__card',
        'data-card-index': String(index + 1),
        tabindex: '0',
        'aria-expanded': 'false'
      }
    }),
    components: [
      {
        tagName: 'img',
        name: `图片 ${index + 1}`,
        ...freezeNode({
          attributes: {
            class: 'wb-customization-grid__image',
            src: card.image,
            alt: card.title,
            loading: 'lazy',
            decoding: 'async'
          }
        })
      },
      {
        tagName: 'div',
        name: `遮罩 ${index + 1}`,
        ...freezeNode({
          attributes: { class: 'wb-customization-grid__overlay' }
        }),
        components: [
          {
            tagName: 'div',
            name: `文案 ${index + 1}`,
            ...freezeNode({
              attributes: { class: 'wb-customization-grid__copy' }
            }),
            components: [
              buildEditableText(
                'h3',
                `标题 ${index + 1}`,
                'wb-customization-grid__card-title',
                DEFAULT_CARDS[index]?.title ?? ''
              ),
              buildEditableText(
                'p',
                `描述 ${index + 1}`,
                'wb-customization-grid__card-desc',
                DEFAULT_CARDS[index]?.desc ?? ''
              )
            ]
          }
        ]
      }
    ]
  }
}

function buildComponentTree() {
  return [
    {
      tagName: 'div',
      name: '内容容器',
      ...freezeNode({
        attributes: { class: 'wb-customization-grid__inner' }
      }),
      components: [
        buildEditableText('h2', '区块标题', 'wb-customization-grid__title', DEFAULT_TITLE),
        {
          tagName: 'div',
          name: '卡片网格',
          ...freezeNode({
            attributes: { class: 'wb-customization-grid__grid' }
          }),
          components: DEFAULT_CARDS.map((card, index) => buildCard(card, index))
        }
      ]
    }
  ]
}

function extractComponentText(component: any): string {
  if (!component) return ''
  if (component?.get?.('type') === 'textnode') {
    return `${component.get?.('content') ?? ''}`
  }

  const components = component?.components?.()
  if (!components?.each) {
    return `${component?.get?.('content') ?? ''}`
  }

  let text = ''
  components.each((child: any) => {
    text += extractComponentText(child)
  })

  return text
}

function extractComponentInnerHtml(component: any): string {
  const components = component?.components?.()
  if (!components?.each) {
    return `${component?.get?.('content') ?? ''}`
  }

  let html = ''
  components.each((child: any) => {
    html += child?.toHTML?.() ?? `${child?.get?.('content') ?? ''}`
  })

  return html
}

function updateAttributes(model: any, nextAttrs: Record<string, string>) {
  const currentAttrs = { ...(model?.getAttributes?.() ?? {}) }
  let changed = false

  Object.entries(nextAttrs).forEach(([key, value]) => {
    if (`${currentAttrs[key] ?? ''}` === `${value}`) return
    currentAttrs[key] = value
    changed = true
  })

  if (changed) {
    model?.addAttributes?.(currentAttrs)
  }
}

function getInner(model: any) {
  return model?.components?.().at?.(0) ?? null
}

function getHeading(model: any) {
  return getInner(model)?.components?.().at?.(0) ?? null
}

function getGrid(model: any) {
  return getInner(model)?.components?.().at?.(1) ?? null
}

function getCard(model: any, index: number) {
  return getGrid(model)?.components?.().at?.(index) ?? null
}

function getCardImage(card: any) {
  return card?.components?.().at?.(0) ?? null
}

function getCardOverlay(card: any) {
  return card?.components?.().at?.(1) ?? null
}

function getCardCopy(card: any) {
  return getCardOverlay(card)?.components?.().at?.(0) ?? null
}

function getCardTitle(card: any) {
  return getCardCopy(card)?.components?.().at?.(0) ?? null
}

function getCardDesc(card: any) {
  return getCardCopy(card)?.components?.().at?.(1) ?? null
}

function readCardFields(model: any, index: number): CardField {
  const fallback = DEFAULT_CARDS[index] ?? DEFAULT_CARDS[0]
  const cardNumber = index + 1
  const currentImage = `${getCardImage(getCard(model, index))?.getAttributes?.()?.src ?? ''}`.trim()

  return {
    image:
      `${model.get?.(`card${cardNumber}Image`) ?? ''}`.trim() || currentImage || fallback.image,
    title: fallback.title,
    desc: fallback.desc
  }
}

function ensureStaticNode(model: any, attrs?: Record<string, string>) {
  if (!model) return null

  model.set(
    {
      selectable: false,
      hoverable: false,
      draggable: false,
      droppable: false,
      highlightable: false,
      copyable: false,
      removable: false,
      editable: false,
      stylable: false,
      layerable: false
    },
    { silent: true }
  )

  if (attrs) {
    updateAttributes(model, attrs)
  }

  return model
}

function ensureEditableTextNode(
  model: any,
  config: {
    tagName: string
    name: string
    className: string
    fallbackContent: string
  }
) {
  if (!model) return null

  const currentHtml = extractComponentInnerHtml(model).trim()
  const currentStyle = { ...(model?.getStyle?.() ?? {}) }
  const currentAttrs = {
    ...(model?.getAttributes?.() ?? {}),
    class: config.className
  }

  if (`${model.get?.('type') ?? ''}` !== 'text') {
    const parent = model?.parent?.()
    const collection = parent?.components?.()
    const index = collection?.indexOf?.(model) ?? -1
    if (collection && index >= 0) {
      collection.remove(model, { silent: true })
      collection.add(
        {
          ...buildEditableText(
            config.tagName,
            config.name,
            config.className,
            currentHtml || config.fallbackContent
          ),
          style: currentStyle,
          attributes: currentAttrs
        },
        { at: index }
      )
      return collection.at(index)
    }
  }

  model.set(
    {
      type: 'text',
      tagName: config.tagName,
      name: config.name,
      selectable: true,
      hoverable: true,
      draggable: false,
      droppable: false,
      editable: true,
      stylable: [...TEXT_STYLABLE_PROPS],
      highlightable: true,
      copyable: false,
      removable: false,
      layerable: false
    },
    { silent: true }
  )

  updateAttributes(model, currentAttrs)

  if (!currentHtml && config.fallbackContent) {
    model.components(config.fallbackContent)
    model.view?.render?.()
  }

  return model
}

function normalizeCustomizationGrid(model: any) {
  model.set(
    {
      editable: false,
      stylable: false
    },
    { silent: true }
  )
  updateAttributes(model, {
    'data-wb-component': 'customization-grid',
    class: 'wb-customization-grid'
  })

  ensureStaticNode(getInner(model), { class: 'wb-customization-grid__inner' })
  ensureEditableTextNode(getHeading(model), {
    tagName: 'h2',
    name: '区块标题',
    className: 'wb-customization-grid__title',
    fallbackContent: DEFAULT_TITLE
  })
  ensureStaticNode(getGrid(model), { class: 'wb-customization-grid__grid' })

  DEFAULT_CARDS.forEach((_, index) => {
    const card = getCard(model, index)
    if (!card) return

    ensureStaticNode(card, {
      class: 'wb-customization-grid__card',
      'data-card-index': String(index + 1),
      tabindex: '0',
      'aria-expanded': 'false'
    })

    const fields = readCardFields(model, index)
    ensureStaticNode(getCardImage(card), {
      class: 'wb-customization-grid__image',
      src: fields.image,
      alt: extractComponentText(getCardTitle(card)).trim() || DEFAULT_CARDS[index]?.title || '',
      loading: 'lazy',
      decoding: 'async'
    })
    ensureStaticNode(getCardOverlay(card), { class: 'wb-customization-grid__overlay' })
    ensureStaticNode(getCardCopy(card), { class: 'wb-customization-grid__copy' })
    ensureEditableTextNode(getCardTitle(card), {
      tagName: 'h3',
      name: `标题 ${index + 1}`,
      className: 'wb-customization-grid__card-title',
      fallbackContent: DEFAULT_CARDS[index]?.title ?? ''
    })
    ensureEditableTextNode(getCardDesc(card), {
      tagName: 'p',
      name: `描述 ${index + 1}`,
      className: 'wb-customization-grid__card-desc',
      fallbackContent: DEFAULT_CARDS[index]?.desc ?? ''
    })
  })
}

function syncCustomizationGrid(model: any) {
  DEFAULT_CARDS.forEach((_, index) => {
    const card = getCard(model, index)
    if (!card) return

    const fields = readCardFields(model, index)
    const image = getCardImage(card)
    updateAttributes(image, {
      src: fields.image,
      alt: extractComponentText(getCardTitle(card)).trim() || DEFAULT_CARDS[index]?.title || ''
    })
  })
}

function createTraits() {
  const traits: any[] = []

  DEFAULT_CARDS.forEach((_, index) => {
    const cardNumber = index + 1
    traits.push(
      makeImagePickerTrait(`图片 ${cardNumber}`, `card${cardNumber}Image`, { showPreview: true })
    )
  })

  return traits
}

function makeScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      __wbCustomizationCleanup?: () => void
    }

    root.__wbCustomizationCleanup?.()
    root.__wbCustomizationCleanup = undefined

    const cards = Array.from(root.querySelectorAll('.wb-customization-grid__card')) as HTMLElement[]

    if (!cards.length) return

    const mq = window.matchMedia('(max-width: 767px)')

    const setActive = (nextIndex: number | null) => {
      cards.forEach((card, index) => {
        const active = mq.matches && nextIndex === index
        card.classList.toggle('is-active', active)
        card.setAttribute('aria-expanded', active ? 'true' : 'false')
      })
    }

    const toggleCard = (index: number) => {
      if (!mq.matches) return
      const card = cards[index]
      const isActive = card?.classList.contains('is-active')
      setActive(isActive ? null : index)
    }

    const clickHandlers = cards.map((card, index) => {
      const onClick = () => toggleCard(index)
      const onKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        toggleCard(index)
      }

      card.addEventListener('click', onClick)
      card.addEventListener('keydown', onKeydown)

      return { card, onClick, onKeydown }
    })

    const onMqChange = () => {
      if (!mq.matches) setActive(null)
    }

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onMqChange)
    } else {
      mq.addListener(onMqChange)
    }

    setActive(null)

    root.__wbCustomizationCleanup = () => {
      clickHandlers.forEach(({ card, onClick, onKeydown }) => {
        card.removeEventListener('click', onClick)
        card.removeEventListener('keydown', onKeydown)
      })

      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', onMqChange)
      } else {
        mq.removeListener(onMqChange)
      }

      setActive(null)
    }
  }
}

const SYNC_FIELDS = [
  ...DEFAULT_CARDS.flatMap((_, index) => {
    const cardNumber = index + 1
    return [`card${cardNumber}Image`]
  })
]

export function registerCustomizationGridComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CUSTOMIZATION_GRID_TYPE)) return

  domComponents.addType(WB_CUSTOMIZATION_GRID_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'customization-grid'
        ? { type: WB_CUSTOMIZATION_GRID_TYPE }
        : false,

    model: {
      defaults: {
        name: '四图定制',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: false,
        copyable: true,
        attributes: {
          'data-wb-component': 'customization-grid',
          class: 'wb-customization-grid'
        },
        styles: CUSTOMIZATION_GRID_CSS,
        card1Image: DEFAULT_CARDS[0].image,
        card2Image: DEFAULT_CARDS[1].image,
        card3Image: DEFAULT_CARDS[2].image,
        card4Image: DEFAULT_CARDS[3].image,
        traits: createTraits(),
        components: buildComponentTree(),
        script: makeScript(),
        'script-export': makeScript()
      },
      init(this: any) {
        const runWithoutUndo = (task: () => void) => {
          if (typeof editor.UndoManager?.skip === 'function') {
            editor.UndoManager.skip(task)
            return
          }
          task()
        }

        runWithoutUndo(() => {
          normalizeCustomizationGrid(this)
          syncCustomizationGrid(this)
        })

        this.on(SYNC_FIELDS.map((field) => `change:${field}`).join(' '), () => {
          syncCustomizationGrid(this)
        })
      }
    }
  })

  if (!blockManager?.get?.(WB_CUSTOMIZATION_GRID_TYPE)) {
    blockManager?.add?.(WB_CUSTOMIZATION_GRID_TYPE, {
      label: '四图定制',
      category: 'Section',
      content: { type: WB_CUSTOMIZATION_GRID_TYPE },
      media: BLOCK_ICON
    })
  }
}
