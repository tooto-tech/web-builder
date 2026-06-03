/**
 * logo.ts — Logo block
 *
 * An <a> wrapping an <img>. Traits: href (default "/") and target.
 */
import type { Editor } from 'grapesjs'

const TYPE_LOGO = 'logo-brand'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="2" y="6" width="20" height="12" rx="2"/>
  <circle cx="8" cy="12" r="2.5" fill="currentColor" stroke="none"/>
  <line x1="13" y1="9" x2="20" y2="9"/>
  <line x1="13" y1="12" x2="18" y2="12"/>
  <line x1="13" y1="15" x2="16" y2="15"/>
</svg>`

export function registerLogo (editor: Editor): void {
  const { DomComponents, BlockManager } = editor

  DomComponents.addType(TYPE_LOGO, {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains('gjs-logo') ? { type: TYPE_LOGO } : undefined,

    extend: 'link',

    model: {
      defaults: {
        name: 'Logo',
        tagName: 'a',
        draggable: true,
        droppable: false,
        attributes: { href: '/' },

        traits: [
          {
            type: 'page-link',
            label: 'Link',
            name: 'href',
            placeholder: '/',
          },
          {
            type: 'select',
            label: 'Target',
            name: 'target',
            options: [
              { id: '',       name: 'Same tab' },
              { id: '_blank', name: 'New tab'  },
            ],
          },
        ],

        components: [
          {
            type: 'image',
            tagName: 'img',
            classes: ['gjs-logo__img'],
            attributes: { src: '', alt: 'Logo' },
            selectable: false, hoverable: false,
            draggable: false, droppable: false,
            layerable: false, highlightable: false,
          },
        ],
      },

      // Proxy all style read/write operations to the <img> child so that the
      // StylePanel targets the image even when the <a> wrapper is selected.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getStyle (this: any, opts?: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const img = this.components().find((c: any) => c.get('tagName') === 'img')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return img ? img.getStyle(opts) : {}
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addStyle (this: any, styles: Record<string, string>, opts?: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const img = this.components().find((c: any) => c.get('tagName') === 'img')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if (img) img.addStyle(styles, opts)
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setStyle (this: any, styles: Record<string, string>, opts?: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const img = this.components().find((c: any) => c.get('tagName') === 'img')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if (img) img.setStyle(styles, opts)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this
      },
    },
  })

  BlockManager.add('logo-brand', {
    label: 'Logo',
    category: 'Navigation',
    media: BLOCK_ICON,
    content: { type: TYPE_LOGO },
  })
}

// ── b2b-admin 适配导出 ─────────────────────────────────────────────────────────
export const WB_LOGO_TYPE = TYPE_LOGO
export function registerLogoComponent (editor: import('grapesjs').Editor): void {
  registerLogo(editor)
}
