/**
 * search.ts — Fullscreen Search Spotlight block
 *
 * A standalone, droppable search widget: trigger button + fullscreen overlay modal.
 * Can be placed anywhere — inside a navbar, hero section, or standalone in the page.
 */
import type { Editor } from 'grapesjs'

const TYPE_SEARCH = 'search-spotlight'

const ICON_SEARCH = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_981_349)">
        <mask id="mask0_981_349" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="28">
            <path d="M28 0H0V28H28V0Z" fill="white"/>
        </mask>
        <g mask="url(#mask0_981_349)">
            <path d="M24.14 22.9463L20.4166 19.2229L20.415 19.2214C21.053 18.466 21.5732 17.6186 21.958 16.7078C22.4727 15.4908 22.7337 14.1985 22.7337 12.8669C22.7337 11.5352 22.4727 10.243 21.958 9.02599C21.461 7.85095 20.7497 6.79583 19.8438 5.88996C18.9379 4.98409 17.8828 4.27274 16.7078 3.77574C15.4908 3.261 14.1985 3 12.8669 3C11.5352 3 10.243 3.261 9.02599 3.77574C7.85095 4.27274 6.79583 4.98406 5.88996 5.88996C4.98406 6.79583 4.27274 7.85097 3.77574 9.02599C3.261 10.243 3 11.5352 3 12.8669C3 14.1985 3.261 15.4908 3.77574 16.7078C4.27274 17.8828 4.98406 18.938 5.88996 19.8438C6.79583 20.7497 7.85097 21.4611 9.02599 21.958C10.243 22.4727 11.5352 22.7337 12.8669 22.7337C14.1985 22.7337 15.4908 22.4727 16.7078 21.958C17.6041 21.5789 18.4303 21.0747 19.1741 20.455C19.1758 20.4567 19.1774 20.4586 19.1792 20.4603L22.9026 24.1837C23.0735 24.3546 23.2973 24.44 23.5213 24.44C23.7452 24.44 23.9692 24.3546 24.14 24.1837C24.4817 23.8421 24.4817 23.288 24.14 22.9463ZM12.8669 21.0469C10.6819 21.0469 8.62775 20.196 7.08275 18.651C5.53775 17.106 4.68689 15.0518 4.68689 12.8669C4.68689 10.6819 5.53775 8.62775 7.08275 7.08275C8.62773 5.53775 10.6819 4.68689 12.8669 4.68689C15.0519 4.68689 17.106 5.53775 18.651 7.08275C20.196 8.62773 21.0469 10.6819 21.0469 12.8669C21.0469 15.0519 20.196 17.106 18.651 18.651C17.106 20.196 15.0518 21.0469 12.8669 21.0469Z" fill="currentColor"/>
        </g>
    </g>
    <defs>
        <clipPath id="clip0_981_349">
            <rect width="28" height="28" fill="white"/>
        </clipPath>
    </defs>
</svg>
`

const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
  width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

const BLOCK_ICON = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_981_349)">
        <mask id="mask0_981_349" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="28">
            <path d="M28 0H0V28H28V0Z" fill="white"/>
        </mask>
        <g mask="url(#mask0_981_349)">
            <path d="M24.14 22.9463L20.4166 19.2229L20.415 19.2214C21.053 18.466 21.5732 17.6186 21.958 16.7078C22.4727 15.4908 22.7337 14.1985 22.7337 12.8669C22.7337 11.5352 22.4727 10.243 21.958 9.02599C21.461 7.85095 20.7497 6.79583 19.8438 5.88996C18.9379 4.98409 17.8828 4.27274 16.7078 3.77574C15.4908 3.261 14.1985 3 12.8669 3C11.5352 3 10.243 3.261 9.02599 3.77574C7.85095 4.27274 6.79583 4.98406 5.88996 5.88996C4.98406 6.79583 4.27274 7.85097 3.77574 9.02599C3.261 10.243 3 11.5352 3 12.8669C3 14.1985 3.261 15.4908 3.77574 16.7078C4.27274 17.8828 4.98406 18.938 5.88996 19.8438C6.79583 20.7497 7.85097 21.4611 9.02599 21.958C10.243 22.4727 11.5352 22.7337 12.8669 22.7337C14.1985 22.7337 15.4908 22.4727 16.7078 21.958C17.6041 21.5789 18.4303 21.0747 19.1741 20.455C19.1758 20.4567 19.1774 20.4586 19.1792 20.4603L22.9026 24.1837C23.0735 24.3546 23.2973 24.44 23.5213 24.44C23.7452 24.44 23.9692 24.3546 24.14 24.1837C24.4817 23.8421 24.4817 23.288 24.14 22.9463ZM12.8669 21.0469C10.6819 21.0469 8.62775 20.196 7.08275 18.651C5.53775 17.106 4.68689 15.0518 4.68689 12.8669C4.68689 10.6819 5.53775 8.62775 7.08275 7.08275C8.62773 5.53775 10.6819 4.68689 12.8669 4.68689C15.0519 4.68689 17.106 5.53775 18.651 7.08275C20.196 8.62773 21.0469 10.6819 21.0469 12.8669C21.0469 15.0519 20.196 17.106 18.651 18.651C17.106 20.196 15.0518 21.0469 12.8669 21.0469Z" fill="currentColor"/>
        </g>
    </g>
    <defs>
        <clipPath id="clip0_981_349">
            <rect width="28" height="28" fill="white"/>
        </clipPath>
    </defs>
</svg>
`

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
