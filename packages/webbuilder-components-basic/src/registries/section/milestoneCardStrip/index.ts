import type { Editor } from 'grapesjs'

export const WB_MILESTONE_CARD_STRIP_TYPE = 'wb-milestone-card-strip'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3.5" y="5.5" width="5.5" height="13" rx="1.5" />
  <rect x="10.25" y="5.5" width="5.5" height="13" rx="1.5" />
  <rect x="17" y="5.5" width="3.5" height="13" rx="1.5" />
</svg>`

const SVG_PREV = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M10.53 5.47a.75.75 0 0 1 0 1.06l-4.72 4.72H20a.75.75 0 0 1 0 1.5H5.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0" clip-rule="evenodd"/></svg>`

const SVG_NEXT = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M13.47 5.47a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H4a.75.75 0 0 1 0-1.5h14.19l-4.72-4.72a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/></svg>`

const DEFAULT_YEARS = ['In 1990', 'In 2000', 'In 2014', 'In 2020', 'In 2024']
const DEFAULT_DESCRIPTION = 'With years of expertise in polymer coloring and modification, we focus on delivering stable, high-performing masterbatch solutions that help our customers improve.'

function buildMilestoneCardDef(index: number) {
  const year = DEFAULT_YEARS[index] ?? `In ${1990 + index * 5}`

  return {
    tagName: 'div',
    selectable: true,
    droppable: false,
    draggable: '.swiper-wrapper',
    attributes: { class: 'swiper-slide wb-milestone-card-strip__card' },
    components: [
      {
        tagName: 'div',
        selectable: true,
        droppable: false,
        attributes: { class: 'wb-milestone-card-strip__media' },
        components: [
          {
            tagName: 'img',
            type: 'image',
            selectable: true,
            droppable: false,
            attributes: {
              src: 'https://placehold.co/403x290',
              alt: '',
              class: 'wb-milestone-card-strip__image',
            },
          },
        ],
      },
      {
        tagName: 'div',
        selectable: true,
        droppable: true,
        attributes: { class: 'wb-milestone-card-strip__body' },
        components: [
          {
            tagName: 'h5',
            type: 'text',
            selectable: true,
            droppable: false,
            attributes: { class: 'wb-milestone-card-strip__title' },
            components: year,
          },
          {
            tagName: 'p',
            type: 'text',
            selectable: true,
            droppable: false,
            attributes: { class: 'wb-milestone-card-strip__description' },
            components: DEFAULT_DESCRIPTION,
          },
        ],
      },
    ],
  }
}

function resolveStripTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_MILESTONE_CARD_STRIP_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_MILESTONE_CARD_STRIP_TYPE) as any
  if (fromSelected?.get?.('type') === WB_MILESTONE_CARD_STRIP_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_MILESTONE_CARD_STRIP_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_MILESTONE_CARD_STRIP_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_MILESTONE_CARD_STRIP_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_MILESTONE_CARD_STRIP_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_MILESTONE_CARD_STRIP_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_MILESTONE_CARD_STRIP_TYPE) return fromTraitTarget

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

      const created = cards.add(buildMilestoneCardDef(cards.length || 0))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

export function registerMilestoneCardStripComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_MILESTONE_CARD_STRIP_TYPE)) {
    return
  }

  domComponents.addType(WB_MILESTONE_CARD_STRIP_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'milestone-card-strip'
        ? { type: WB_MILESTONE_CARD_STRIP_TYPE }
        : false,

    model: {
      defaults: {
        name: '年份卡片横滑',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'milestone-card-strip',
          class: 'wb-milestone-card-strip',
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
              autoHeight: true,
              speed: 600,
              breakpoints: {
                767: { spaceBetween: 16 },
              },
              navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
            })
          }

          ensureAssets().then(init)
        },
        styles: `
          .wb-milestone-card-strip {
            position: relative;
          }
          @media (min-width: 1280px) {
            .wb-milestone-card-strip {
            
            }
          }
          .wb-milestone-card-strip .swiper {
            overflow: visible;
          }
          .wb-milestone-card-strip__card.swiper-slide {
            width: 403px;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .wb-milestone-card-strip__media {
            width: 100%;
            aspect-ratio: 403 / 290;
            overflow: hidden;
            background: #dbe4f0;
          }
          .wb-milestone-card-strip__image {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 300ms ease;
          }
          .wb-milestone-card-strip__body {
            padding: 1rem 1.25rem 1.375rem;
            display: flex;
            flex-direction: column;
            row-gap: 0.75rem;
            background: #ffffff;
            min-height: 160px;
            box-sizing: border-box;
          }
          .wb-milestone-card-strip__title {
            margin: 0;
            color: #1b2a57;
            font-size: 24px;
            line-height: 1.3;
            font-weight: 500;
          }
          .wb-milestone-card-strip__description {
            margin: 0;
            color: #344054;
            font-size: 16px;
            line-height: 1.5;
          }
          .wb-milestone-card-strip__card:hover .wb-milestone-card-strip__image {
            transform: scale(1.06);
          }
          .wb-milestone-card-strip .swiper-button-prev,
          .wb-milestone-card-strip .swiper-button-next {
            width: 40px;
            height: 40px;
            margin-top: -20px;
            background: #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            color: #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
          }
          .wb-milestone-card-strip .swiper-button-prev{
            left: -24px;
          }
          .wb-milestone-card-strip .swiper-button-next {
            right: -24px;
          }
          .wb-milestone-card-strip .swiper-button-prev::after,
          .wb-milestone-card-strip .swiper-button-next::after {
            display: none;
          }
          @media (min-width: 1024px) {
            .wb-milestone-card-strip__card {
              width: 403px;
            }
            .wb-milestone-card-strip__body {
              padding: 18px 22px 22px;
              row-gap: 12px;
              min-height: 160px;
            }
            .wb-milestone-card-strip__title {
              font-size: 18px;
            }
            .wb-milestone-card-strip__description {
              font-size: 14px;
            }
          }
          @media (max-width: 1023px) {
            .wb-milestone-card-strip {
              width: calc(100vw - 32px);
            }
            .wb-milestone-card-strip__card {
              width: min(300px, calc(100vw - 110px));
            }
            .wb-milestone-card-strip__body {
              padding: 16px 18px 20px;
              min-height: 150px;
            }
            .wb-milestone-card-strip__title {
              font-size: 17px;
            }
            .wb-milestone-card-strip__description {
              font-size: 14px;
            }
          }
          @media (max-width: 767px) {
            .wb-milestone-card-strip {
            
            }
            .wb-milestone-card-strip__card.swiper-slide {
              width: min(264px, calc(100vw - 56px));
            }
            .wb-milestone-card-strip__body {
              padding: 14px 16px 18px;
              row-gap: 10px;
              min-height: 142px;
            }
            .wb-milestone-card-strip__title {
              font-size: 16px;
            }
            .wb-milestone-card-strip__description {
              font-size: 13px;
            }
            .wb-milestone-card-strip .swiper-button-prev,
            .wb-milestone-card-strip .swiper-button-next {
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
                components: Array.from({ length: 5 }, (_, index) => buildMilestoneCardDef(index)),
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

  if (!blockManager?.get?.(WB_MILESTONE_CARD_STRIP_TYPE)) {
    blockManager?.add?.(WB_MILESTONE_CARD_STRIP_TYPE, {
      label: '年份卡片横滑',
      category: 'Section',
      content: { type: WB_MILESTONE_CARD_STRIP_TYPE },
      media: BLOCK_ICON,
    })
  }
}
