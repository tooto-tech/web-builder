import type { Editor } from 'grapesjs'

export const WB_PRODUCT_CARD_STRIP_TYPE = 'wb-product-card-strip'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3.5" y="5.5" width="5.5" height="13" rx="1.5" />
  <rect x="10.25" y="5.5" width="5.5" height="13" rx="1.5" />
  <rect x="17" y="5.5" width="3.5" height="13" rx="1.5" />
</svg>`

const SVG_PREV = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M10.53 5.47a.75.75 0 0 1 0 1.06l-4.72 4.72H20a.75.75 0 0 1 0 1.5H5.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0" clip-rule="evenodd"/></svg>`

const SVG_NEXT = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M13.47 5.47a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H4a.75.75 0 0 1 0-1.5h14.19l-4.72-4.72a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/></svg>`

const DEFAULT_TITLES = [
  'Carbon Black Masterbatch',
  'White Masterbatch',
  'Color Masterbatch',
  'Additive Masterbatch',
  'Modified Compounds',
]

const DEFAULT_TAGS = ['Conductive', 'Cost Effective']

function buildTagDef(label: string) {
  return {
    tagName: 'span',
    type: 'text',
    selectable: true,
    droppable: false,
    attributes: { class: 'wb-product-card-strip__tag' },
    components: label,
  }
}

function buildCardDef(index: number) {
  const title = DEFAULT_TITLES[index] ?? `Product Name ${index + 1}`

  return {
    tagName: 'div',
    selectable: true,
    droppable: false,
    draggable: '.swiper-wrapper',
    attributes: { class: 'swiper-slide wb-product-card-strip__card' },
    components: [
      {
        tagName: 'img',
        type: 'image',
        selectable: true,
        droppable: false,
        attributes: {
          src: 'https://placehold.co/402x528',
          alt: '',
          class: 'wb-product-card-strip__image',
        },
      },
      {
        tagName: 'div',
        selectable: true,
        droppable: true,
        attributes: { class: 'wb-product-card-strip__content' },
        components: [
          {
            tagName: 'h5',
            selectable: true,
            droppable: true,
            attributes: { class: 'wb-product-card-strip__title' },
            components: [
              {
                tagName: 'a',
                selectable: true,
                droppable: false,
                attributes: {
                  href: '',
                  class: 'wb-product-card-strip__detail-link',
                },
                components: title,
              },
            ],
          },
          {
            tagName: 'div',
            selectable: true,
            droppable: true,
            attributes: { class: 'wb-product-card-strip__tags' },
            components: DEFAULT_TAGS.map(buildTagDef),
          },
        ],
      },
    ],
  }
}

function resolveStripTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_PRODUCT_CARD_STRIP_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_PRODUCT_CARD_STRIP_TYPE) as any
  if (fromSelected?.get?.('type') === WB_PRODUCT_CARD_STRIP_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_PRODUCT_CARD_STRIP_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_PRODUCT_CARD_STRIP_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_PRODUCT_CARD_STRIP_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_PRODUCT_CARD_STRIP_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_PRODUCT_CARD_STRIP_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_PRODUCT_CARD_STRIP_TYPE) return fromTraitTarget

  return null
}

function createAddCardTrait() {
  return {
    type: 'button' as any,
    name: 'add-card',
    label: false as const,
    text: '+ 添加卡片',
    full: true,
    command(this: any, editor: Editor) {
      const strip = resolveStripTarget(editor, this)
      const track = strip?._getTrack?.()
      const cards = track?.components?.()
      if (!cards) return

      const created = cards.add(buildCardDef(cards.length || 0))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

export function registerProductCardStripComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_PRODUCT_CARD_STRIP_TYPE)) {
    return
  }

  domComponents.addType(WB_PRODUCT_CARD_STRIP_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'product-card-strip'
        ? { type: WB_PRODUCT_CARD_STRIP_TYPE }
        : false,

    model: {
      defaults: {
        name: '产品卡片横滑',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'product-card-strip',
          class: 'wb-product-card-strip',
        },
        script: function () {
          const root = this as any

          const ensureAssets = () =>
            new Promise<void>((resolve) => {
              const w = window as any
              if (w.Swiper) { resolve(); return }

              if (!document.querySelector('link[data-wb-swiper]')) {
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
                link.setAttribute('data-wb-swiper', '1')
                document.head.appendChild(link)
              }

              const existingScript = document.querySelector('script[data-wb-swiper]') as HTMLScriptElement | null
              if (existingScript) {
                existingScript.addEventListener('load', () => resolve(), { once: true })
                return
              }

              const s = document.createElement('script')
              s.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
              s.async = true
              s.setAttribute('data-wb-swiper', '1')
              s.onload = () => resolve()
              document.body.appendChild(s)
            })

          const init = () => {
            const w = window as any
            if (!w.Swiper) return
            const swiperEl = root.querySelector('.swiper') as HTMLElement | null
            const prevEl = root.querySelector('.swiper-button-prev') as HTMLElement | null
            const nextEl = root.querySelector('.swiper-button-next') as HTMLElement | null
            if (!swiperEl) return

            root._wbSwiper?.destroy?.(true, true)
            root._wbSwiper = new w.Swiper(swiperEl, {
              slidesPerView: 'auto',
              spaceBetween: 12,
              speed: 600,
              autoHeight: true,
              breakpoints: {
                767: { spaceBetween: 16 },
              },
              navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
            })
          }

          ensureAssets().then(init)
        },
        styles: `
          .wb-product-card-strip {
            position: relative;
          }
          @media (min-width: 1280px) {
            .wb-product-card-strip {
              // width: calc(100vw - ((100vw - 80rem) / 2) - 1.25rem);
            }
          }
          .wb-product-card-strip .swiper {
            overflow: visible;
          }
          .wb-product-card-strip__card {
            overflow: hidden;
            width: 16rem;
            position: relative;
            aspect-ratio: 402 / 528;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .wb-product-card-strip__image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: all 300ms ease;
          }
          .wb-product-card-strip__content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 1.25rem 1rem;
            row-gap: 0.75rem;
          }
          .wb-product-card-strip__title {
            margin: 0;
            font-size: 1.125rem;
            line-height: 1.2;
            color: #ffffff;
          }
          .wb-product-card-strip__detail-link {
            color: inherit;
            text-decoration: none;
          }
          .wb-product-card-strip__detail-link::after {
            content: "";
            position: absolute;
            inset: 0;
          }
          .wb-product-card-strip__tags {
            display: flex;
            gap: 0.375rem;
          }
          .wb-product-card-strip__tag {
            border-radius: 0.25rem;
            border: 1px solid #e5e7eb;
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            color: #ffffff;
            box-sizing: border-box;
          }
          .wb-product-card-strip__card:hover .wb-product-card-strip__image {
            transform: scale(1.1);
          }
          .wb-product-card-strip .swiper-button-prev,
          .wb-product-card-strip .swiper-button-next {
            width: 48px;
            height: 48px;
            background: #ffffff;
            padding: 8px;
            border-radius: 50%;
            box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.11);
            color: #000000;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .wb-product-card-strip .swiper-button-prev{
            left: -24px;
          }
          .wb-product-card-strip .swiper-button-next {
            right: -24px;
          }
          
          .wb-product-card-strip .swiper-button-prev::after,
          .wb-product-card-strip .swiper-button-next::after {
            display: none;
          }
           .wb-product-card-strip .swiper-button-prev{
           }
          @media (min-width: 1024px) {
            .wb-product-card-strip__card {
              width: 402px;
            }
            .wb-product-card-strip__content {
              padding: 2.5rem 2rem;
              row-gap: 1.5rem;
            }
            .wb-product-card-strip__title {
              font-size: 30px;
            }
            .wb-product-card-strip__tags {
              gap: 0.75rem;
            }
            .wb-product-card-strip__tag {
              padding: 0.5rem 1.5rem;
            }
          }
          @media (max-width: 1023px) {
            .wb-product-card-strip {
              width: calc(100vw - 32px);
            }
            .wb-product-card-strip__card {
              width: min(340px, calc(100vw - 96px));
            }
            .wb-product-card-strip__content {
              padding: 1.75rem 1.25rem;
              row-gap: 1rem;
            }
            .wb-product-card-strip__title {
              font-size: 1.5rem;
            }
            .wb-product-card-strip__tags {
              gap: 0.5rem;
              flex-wrap: wrap;
            }
          }
          @media (max-width: 767px) {
            .wb-product-card-strip {
              width: calc(100vw - 20px);
            }
            .wb-product-card-strip__card {
              width: min(280px, calc(100vw - 56px));
            }
            .wb-product-card-strip__content {
              padding: 1.25rem 1rem;
              row-gap: 0.75rem;
            }
            .wb-product-card-strip__title {
              font-size: 1.125rem;
            }
            .wb-product-card-strip .swiper-button-prev,
            .wb-product-card-strip .swiper-button-next {
              display: none;
            }
          }
        `,
        traits: [
          createAddCardTrait(),
        ],
        components: [
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            copyable: false,
            draggable: false,
            highlightable: false,
            attributes: { class: 'swiper' },
            components: [
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: true,
                copyable: false,
                draggable: false,
                highlightable: false,
                attributes: { class: 'swiper-wrapper' },
                components: Array.from({ length: 5 }, (_, index) => buildCardDef(index)),
              },
            ],
          },
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            copyable: false,
            draggable: false,
            highlightable: false,
            attributes: { class: 'swiper-button-prev' },
            components: SVG_PREV,
          },
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            copyable: false,
            draggable: false,
            highlightable: false,
            attributes: { class: 'swiper-button-next' },
            components: SVG_NEXT,
          },
        ],
      },
      _getTrack(this: any) {
        // root > .swiper (index 0) > .swiper-wrapper (index 0)
        return this.components?.()?.at?.(0)?.components?.()?.at?.(0) ?? null
      },
    },
  })

  if (!blockManager?.get?.(WB_PRODUCT_CARD_STRIP_TYPE)) {
    blockManager?.add?.(WB_PRODUCT_CARD_STRIP_TYPE, {
      label: '产品卡片横滑',
      category: 'Section',
      content: { type: WB_PRODUCT_CARD_STRIP_TYPE },
      media: BLOCK_ICON,
    })
  }
}
