import type { Editor } from 'grapesjs'
import {
  makeImagePickerTrait,
  makeTextTrait,
  makeTextareaTrait,
} from '../../../traitFactory.js'

export const WB_OVERVIEW_SPLIT_TYPE = 'wb-overview-split'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="5" width="7" height="14" rx="1" />
  <rect x="13" y="5" width="8" height="14" rx="1" />
  <path d="M5.5 10h2" />
  <path d="M5.5 14h2" />
</svg>`

const DEFAULT_TITLE = 'Overview'
const DEFAULT_DESCRIPTION = `Hotels and resorts demand bathroom spaces that reflect comfort, durability, and premium guest experience.
From boutique hotels to large-scale resort complexes, we provide complete bathroom solutions that unify design, performance, and long-term reliability.
We support hospitality developers, contractors, and design firms with coordinated sanitary ware packages tailored for high-frequency use.`
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1600&q=85'

const OVERVIEW_SPLIT_CSS = `
  .wb-overview-split {
    width: 100%;
    padding: 80px 0;
    background: #ffffff;
    overflow: hidden;
    box-sizing: border-box;
  }
  .wb-overview-split,
  .wb-overview-split *,
  .wb-overview-split *::before,
  .wb-overview-split *::after {
    box-sizing: border-box;
  }
  .wb-overview-split__inner {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding-left: 20px;
    display: grid;
    grid-template-columns: minmax(320px, 0.85fr) minmax(0, 1.15fr);
    gap: 88px;
    align-items: start;
  }
  .wb-overview-split__content {
    min-width: 0;
    align-self: center;
    padding: 24px 0;
  }
  .wb-overview-split__title {
    margin: 0 0 28px;
    color: #07111c;
    font-size: 48px;
    line-height: 1.16;
    font-weight: 700;
    letter-spacing: 0.08em;
    overflow-wrap: anywhere;
  }
  .wb-overview-split__description {
    margin: 0;
    max-width: 560px;
    color: #4f5860;
    font-size: 16px;
    line-height: 1.65;
    font-weight: 400;
    letter-spacing: 0;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  .wb-overview-split__media {
    width: calc(100% + max(20px, (100vw - 1280px) / 2));
    min-width: 0;
    aspect-ratio: 1.18 / 1;
    overflow: hidden;
    background: #d8d8d8;
  }
  .wb-overview-split__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @media (max-width: 1023px) {
    .wb-overview-split {
      padding: 56px 0;
    }
    .wb-overview-split__inner {
      padding: 0 24px;
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .wb-overview-split__content {
      padding: 0;
    }
    .wb-overview-split__title {
      margin-bottom: 24px;
      text-align: center;
      font-size: 34px;
      line-height: 1.2;
      letter-spacing: 0.04em;
    }
    .wb-overview-split__description {
      max-width: none;
      font-size: 20px;
      line-height: 1.55;
    }
    .wb-overview-split__media {
      width: 100%;
      aspect-ratio: 1 / 0.88;
    }
  }
  @media (max-width: 767px) {
    .wb-overview-split {
      padding: 32px 0 48px;
    }
    .wb-overview-split__inner {
      padding: 0 24px;
      gap: 34px;
    }
    .wb-overview-split__title {
      margin-bottom: 24px;
      font-size: 30px;
      line-height: 1.2;
    }
    .wb-overview-split__description {
      font-size: 19px;
      line-height: 1.55;
    }
    .wb-overview-split__media {
      aspect-ratio: 1 / 0.9;
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

function syncOverview(model: any): void {
  const title = String(model.get?.('overviewTitle') || '').trim() || DEFAULT_TITLE
  const description = String(model.get?.('overviewDescription') || '').trim() || DEFAULT_DESCRIPTION
  const image = String(model.get?.('overviewImage') || '').trim() || DEFAULT_IMAGE

  writeText(findChildByClass(model, 'wb-overview-split__title'), title)
  writeText(findChildByClass(model, 'wb-overview-split__description'), description)

  const imageNode = findChildByClass(model, 'wb-overview-split__image')
  imageNode?.addAttributes?.({
    class: 'wb-overview-split__image',
    src: image,
    alt: title,
  })
}

function buildTree() {
  return [
    {
      tagName: 'div',
      ...nonLayered({
        selectable: true,
        attributes: { class: 'wb-overview-split__inner' },
      }),
      components: [
        {
          tagName: 'div',
          ...nonLayered({
            attributes: { class: 'wb-overview-split__content' },
          }),
          components: [
            {
              tagName: 'h2',
              ...nonLayered({
                attributes: { class: 'wb-overview-split__title' },
              }),
              content: DEFAULT_TITLE,
            },
            {
              tagName: 'p',
              ...nonLayered({
                attributes: { class: 'wb-overview-split__description' },
              }),
              content: DEFAULT_DESCRIPTION,
            },
          ],
        },
        {
          tagName: 'div',
          ...nonLayered({
            attributes: { class: 'wb-overview-split__media' },
          }),
          components: [
            {
              tagName: 'img',
              ...nonLayered({
                attributes: {
                  class: 'wb-overview-split__image',
                  src: DEFAULT_IMAGE,
                  alt: DEFAULT_TITLE,
                },
              }),
            },
          ],
        },
      ],
    },
  ]
}

export function registerOverviewSplitComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_OVERVIEW_SPLIT_TYPE)) return

  domComponents.addType(WB_OVERVIEW_SPLIT_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'overview-split'
        ? { type: WB_OVERVIEW_SPLIT_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Overview 图文',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        overviewTitle: DEFAULT_TITLE,
        overviewDescription: DEFAULT_DESCRIPTION,
        overviewImage: DEFAULT_IMAGE,
        attributes: {
          'data-wb-component': 'overview-split',
          class: 'wb-overview-split',
        },
        styles: OVERVIEW_SPLIT_CSS,
        traits: [
          makeTextTrait('标题', 'overviewTitle', { placeholder: 'Overview' }),
          makeTextareaTrait('描述', 'overviewDescription', { placeholder: 'Overview description', rows: 6 }),
          makeImagePickerTrait('右侧图片', 'overviewImage', { showPreview: true }),
        ],
        components: buildTree(),
      },
      init(this: any) {
        this.listenTo(this, 'change:overviewTitle change:overviewDescription change:overviewImage', () => syncOverview(this))
        syncOverview(this)
      },
    },
  })

  blockManager?.add?.(WB_OVERVIEW_SPLIT_TYPE, {
    label: 'Overview 图文',
    category: 'Section',
    content: { type: WB_OVERVIEW_SPLIT_TYPE },
    media: BLOCK_ICON,
  })
}
