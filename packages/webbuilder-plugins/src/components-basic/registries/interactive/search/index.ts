/**
 * search.ts — Fullscreen Search Spotlight block
 *
 * A standalone, droppable search widget: trigger button + fullscreen overlay modal.
 * Can be placed anywhere — inside a navbar, hero section, or standalone in the page.
 */
import type { Editor } from 'grapesjs'

const TYPE_SEARCH = 'search-spotlight'

const ICON_SEARCH = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12.75" cy="12.75" r="8.25" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18.75 18.75L24 24" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
  width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

const BLOCK_ICON = ICON_SEARCH

const script = function (this: HTMLElement) {
  const el = this as HTMLElement & { __searchInit?: boolean }
  if (el.__searchInit) return
  el.__searchInit = true

  const btn    = el.querySelector('.gjs-search__btn')    as HTMLElement | null
  const modal  = el.querySelector('.gjs-search__modal')  as HTMLElement | null
  const close  = el.querySelector('.gjs-search__close')  as HTMLElement | null
  const input  = el.querySelector('.gjs-search__input')  as HTMLInputElement | null

  if (!btn || !modal) return

  function openModal () {
    modal!.classList.add('is-open')
    setTimeout(function () { input && input.focus() }, 50)
  }
  function closeModal () {
    modal!.classList.remove('is-open')
  }

  function submitSearch() {
    const keyword = input?.value?.trim() || ''
    if (!keyword) return

    const searchUrl = new URL('/search', window.location.origin)
    searchUrl.searchParams.set('q', keyword)
    window.location.assign(searchUrl.toString())
  }

  btn.addEventListener('click', openModal)
  if (close) close.addEventListener('click', closeModal)
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        submitSearch()
      }
    })
  }
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal()
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal()
  })
}

export function registerSearch (editor: Editor): void {
  const { DomComponents, BlockManager } = editor

  DomComponents.addType(TYPE_SEARCH, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-search') ? { type: TYPE_SEARCH } : undefined,

    model: {
      defaults: {
        name: 'Search',
        tagName: 'div',
        draggable: true,
        droppable: false,

        script,
        'script-export': script,

        styles: `
          /* ── Search trigger button ───────────────────────────────────── */
          .gjs-search {
            display: inline-flex;
            align-items: center;
          }
          .gjs-search__btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: none;
            background: transparent;
            color: currentColor;
            cursor: pointer;
            border-radius: 6px;
            padding: 0;
            transition: color 0.15s, background 0.15s;
          }
          .gjs-search__btn:hover {
          
          }

          /* ── Fullscreen modal ────────────────────────────────────────── */
          .gjs-search__modal {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(6px);
            padding-top: 96px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s, visibility 0.2s;
          }
          .gjs-search__modal.is-open {
            opacity: 1;
            visibility: visible;
          }
          .gjs-search__inner {
            position: relative;
            width: 100%;
            max-width: 620px;
            margin: 0 24px;
          }
          .gjs-search__input {
            width: 100%;
            height: 56px;
            padding: 0 52px 0 20px;
            font-size: 1.0625rem;
            background: #fff;
            border: none;
            border-radius: 12px;
            outline: none;
            color: #111827;
            box-sizing: border-box;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          .gjs-search__input::placeholder {
            color: #9ca3af;
          }
          .gjs-search__close {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            cursor: pointer;
            color: #9ca3af;
            border-radius: 6px;
            transition: color 0.15s;
          }
          .gjs-search__close:hover {
            color: #111827;
          }
          @media (max-width: 1023px) {
            .gjs-search__modal {
              padding-top: 72px;
            }
            .gjs-search__inner {
              max-width: 560px;
              margin: 0 20px;
            }
            .gjs-search__input {
              height: 52px;
              font-size: 1rem;
              padding: 0 48px 0 18px;
            }
          }
          @media (max-width: 767px) {
            .gjs-search__modal {
              align-items: flex-start;
              padding-top: 48px;
            }
            .gjs-search__inner {
              margin: 0 16px;
              max-width: none;
            }
            .gjs-search__input {
              height: 48px;
              font-size: 0.9375rem;
              border-radius: 10px;
              padding: 0 44px 0 16px;
            }
            .gjs-search__close {
              right: 8px;
              width: 32px;
              height: 32px;
            }
          }
        `,

        components: [
          {
            tagName: 'button',
            classes: ['gjs-search__btn'],
            attributes: { 'aria-label': 'Search', type: 'button' },
            selectable: false, hoverable: false,
            draggable: false, droppable: false,
            layerable: false, highlightable: false,
            content: ICON_SEARCH,
          },
          {
            tagName: 'div',
            classes: ['gjs-search__modal'],
            selectable: false, hoverable: false,
            draggable: false, droppable: false,
            layerable: false, highlightable: false,
            components: [
              {
                tagName: 'div',
                classes: ['gjs-search__inner'],
                selectable: false, hoverable: false,
                draggable: false, droppable: false,
                layerable: false, highlightable: false,
                components: [
                  {
                    tagName: 'input',
                    classes: ['gjs-search__input'],
                    selectable: false, hoverable: false,
                    draggable: false, droppable: false,
                    layerable: false, highlightable: false,
                    attributes: { type: 'text', placeholder: 'Search…', autocomplete: 'off' },
                  },
                  {
                    tagName: 'button',
                    classes: ['gjs-search__close'],
                    attributes: { 'aria-label': 'Close search', type: 'button' },
                    selectable: false, hoverable: false,
                    draggable: false, droppable: false,
                    layerable: false, highlightable: false,
                    content: ICON_CLOSE,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  })

  BlockManager.add('search-spotlight', {
    label: 'Search',
    category: 'UI',
    media: BLOCK_ICON,
    content: { type: TYPE_SEARCH },
  })
}

// ── b2b-admin 适配导出 ─────────────────────────────────────────────────────────
export const WB_SEARCH_TYPE = TYPE_SEARCH
export function registerSearchComponent (editor: import('grapesjs').Editor): void {
  registerSearch(editor)
}
