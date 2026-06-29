import type { Editor } from 'grapesjs'
import {
  makeCheckboxTrait,
  makeColorPickerTrait,
  makeNumberTrait,
  makeSelectTrait,
  makeTextTrait,
} from '../../../traitFactory.js'

export const WB_SOCIAL_LINKS_TYPE = 'wb-social-links'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <circle cx="5" cy="12" r="1.75" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none"/>
  <circle cx="19" cy="12" r="1.75" fill="currentColor" stroke="none"/>
  <path d="M3.5 6h17"/>
  <path d="M3.5 18h17"/>
</svg>`

type PlatformConfig = {
  key: string
  label: string
  svg: string
}

const PLATFORMS: PlatformConfig[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6H16.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4v2.2H7.2V14H10v8h3.5z"/></svg>`,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9zm9.75 1.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1zM12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 1.8A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3z"/></svg>`,
  },
  {
    key: 'twitter',
    label: 'X',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18.9 3H22l-6.8 7.8L23.2 21h-6.3L12 14.8 6.6 21H3.5l7.3-8.3L1.2 3h6.4l4.4 5.7L18.9 3zm-1.1 16.1h1.7L6.7 4.8H4.9l12.9 14.3z"/></svg>`,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30.6 30.6 0 0 0 2 12a30.6 30.6 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30.6 30.6 0 0 0 22 12a30.6 30.6 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z"/></svg>`,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.8 3c.3 2.3 1.6 4.1 3.9 4.5v2.8a6.7 6.7 0 0 1-3.6-1.1v5.4a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1V12a2.7 2.7 0 1 0 1.9 2.6V3h2.5z"/></svg>`,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.4 8.7H3.5V20h2.9V8.7zM5 3.9A1.7 1.7 0 1 0 5 7.3 1.7 1.7 0 0 0 5 3.9zM20.5 13c0-3.2-1.7-4.7-4-4.7-1.8 0-2.6 1-3 1.7v-1.4h-2.9V20h2.9v-5.7c0-1.5.3-3 2.1-3s2.1 1.6 2.1 3.1V20h2.8l.1-7z"/></svg>`,
  },
  {
    key: 'pinterest',
    label: 'Pinterest',
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3a9 9 0 0 0-3.3 17.4c0-.7 0-1.8.2-2.6l1.2-5.1s-.3-.7-.3-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1.1 4-.3 1.2.6 2.1 1.7 2.1 2 0 3.6-2.1 3.6-5.1 0-2.7-1.9-4.5-4.7-4.5-3.2 0-5.1 2.4-5.1 4.9 0 1 .4 2 1 2.6.1.1.1.2.1.4l-.4 1.5c-.1.2-.2.3-.4.2-1.5-.6-2.4-2.5-2.4-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1.1 0-2.1-.6-2.5-1.2l-.7 2.6c-.2.9-.8 2-1.2 2.7.9.3 1.8.5 2.8.5A9 9 0 1 0 12 3z"/></svg>`,
  },
]

const SOCIAL_LINKS_CSS = `
  .wb-social-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--wb-social-links-gap, 12px);
    justify-content: var(--wb-social-links-justify, flex-start);
    color: var(--wb-social-links-color, #111111);
    min-height: 24px;
    width: 100%;
    box-sizing: border-box;
  }
  .wb-social-links__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--wb-social-links-icon-size, 20px);
    height: var(--wb-social-links-icon-size, 20px);
    color: inherit;
    text-decoration: none;
    line-height: 0;
    flex: 0 0 auto;
  }
  .wb-social-links__item svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .wb-social-links__item:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
  .wb-social-links__placeholder {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    color: rgba(17, 24, 39, 0.55);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    pointer-events: none;
    user-select: none;
  }
`

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  return `${value}`.trim() === ''
}

function toPositiveInt(value: unknown, fallback: number): number {
  const next = Number.parseInt(`${value ?? ''}`, 10)
  return Number.isFinite(next) && next > 0 ? next : fallback
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function getJustifyContent(align: unknown): string {
  if (align === 'center') return 'center'
  if (align === 'right') return 'flex-end'
  return 'flex-start'
}

function lockTree(model: any): void {
  if (!model) return

  model.set?.({
    draggable: false,
    droppable: false,
    selectable: false,
    editable: false,
    hoverable: false,
    highlightable: false,
    copyable: false,
    removable: false,
    layerable: false,
    badgable: false,
    toolbar: [],
  })

  const children = model.components?.()?.models ?? []
  children.forEach((child: any) => lockTree(child))
}

function buildPlatformItem(model: any, platform: PlatformConfig) {
  const rawUrl = model.get(platform.key)
  if (isBlank(rawUrl)) return null

  const href = `${rawUrl}`.trim()
  const prefix = isBlank(model.get('aria_label_prefix'))
    ? 'Follow us on'
    : `${model.get('aria_label_prefix')}`.trim()
  const openInNewTab = toBoolean(model.get('open_in_new_tab'))

  return {
    tagName: 'a',
    name: platform.label,
    draggable: false,
    droppable: false,
    selectable: false,
    editable: false,
    hoverable: false,
    highlightable: false,
    copyable: false,
    removable: false,
    layerable: false,
    badgable: false,
    attributes: {
      class: `wb-social-links__item wb-social-links__item--${platform.key}`,
      href,
      'aria-label': `${prefix} ${platform.label}`,
      ...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    },
    // Let GrapesJS parse the inline SVG markup directly. This avoids
    // cross-context SVG root detection issues from manual DOMParser conversion.
    components: platform.svg,
  }
}

function buildSocialItems(model: any) {
  return PLATFORMS
    .map(platform => buildPlatformItem(model, platform))
    .filter(Boolean)
}

function syncRootStyle(model: any): void {
  const iconSize = toPositiveInt(model.get('icon_size'), 20)
  const gap = Math.max(0, toPositiveInt(model.get('gap'), 12))
  const iconColor = isBlank(model.get('icon_color')) ? '#111111' : `${model.get('icon_color')}`.trim()

  model.setStyle({
    display: 'flex',
    width: '100%',
    '--wb-social-links-icon-size': `${iconSize}px`,
    '--wb-social-links-gap': `${gap}px`,
    '--wb-social-links-color': iconColor,
    '--wb-social-links-justify': getJustifyContent(model.get('align')),
  })
}

function renderSocialLinks(model: any): void {
  syncRootStyle(model)

  const items = buildSocialItems(model)
  model.set('hasSocialItems', items.length > 0, { silent: true })

  const children = model.components?.()
  if (children?.reset) {
    children.reset(items)
  } else {
    model.components(items)
  }

  const renderedChildren = model.components?.().models ?? []
  renderedChildren.forEach((child: any) => lockTree(child))
  model.trigger('change:hasSocialItems')
}

export function registerSocialLinksComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager

  if (!domComponents || domComponents.getType(WB_SOCIAL_LINKS_TYPE)) return

  domComponents.addType(WB_SOCIAL_LINKS_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (
        el?.getAttribute?.('data-wb-component') === 'social-links' ||
        el?.classList?.contains('wb-social-links')
      ) {
        return { type: WB_SOCIAL_LINKS_TYPE }
      }
      return false
    },

    model: {
      defaults: {
        name: '社媒链接',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        removable: true,
        classes: ['wb-social-links'],
        attributes: {
          'data-wb-component': 'social-links',
          class: 'wb-social-links',
        },
        style: {
          '--wb-social-links-icon-size': '20px',
          '--wb-social-links-gap': '12px',
          '--wb-social-links-color': '#111111',
          '--wb-social-links-justify': 'flex-start',
        },
        styles: SOCIAL_LINKS_CSS,
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        twitter: '',
        youtube: '',
        tiktok: '',
        linkedin: 'https://linkedin.com',
        pinterest: '',
        icon_size: 20,
        gap: 12,
        icon_color: '#111111',
        open_in_new_tab: true,
        align: 'left',
        aria_label_prefix: 'Follow us on',
        hasSocialItems: true,
        traits: [
          makeTextTrait('Facebook', 'facebook', { placeholder: 'https://facebook.com/your-page' }),
          makeTextTrait('Instagram', 'instagram', { placeholder: 'https://instagram.com/your-page' }),
          makeTextTrait('X / Twitter', 'twitter', { placeholder: 'https://x.com/your-account' }),
          makeTextTrait('YouTube', 'youtube', { placeholder: 'https://youtube.com/@your-channel' }),
          makeTextTrait('TikTok', 'tiktok', { placeholder: 'https://tiktok.com/@your-account' }),
          makeTextTrait('LinkedIn', 'linkedin', { placeholder: 'https://linkedin.com/company/your-company' }),
          makeTextTrait('Pinterest', 'pinterest', { placeholder: 'https://pinterest.com/your-board' }),
          makeNumberTrait('图标尺寸', 'icon_size', { min: 8, step: 1 }),
          makeNumberTrait('图标间距', 'gap', { min: 0, step: 1 }),
          makeColorPickerTrait('图标颜色', 'icon_color'),
          makeCheckboxTrait('新标签页打开', 'open_in_new_tab'),
          makeSelectTrait('对齐方式', 'align', [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]),
          makeTextTrait('Aria 前缀', 'aria_label_prefix', { placeholder: 'Follow us on' }),
        ],
      },

      init(this: any) {
        const watchedProps = [
          ...PLATFORMS.map(platform => platform.key),
          'icon_size',
          'gap',
          'icon_color',
          'open_in_new_tab',
          'align',
          'aria_label_prefix',
        ]

        watchedProps.forEach((prop) => {
          this.on(`change:${prop}`, () => renderSocialLinks(this))
        })

        renderSocialLinks(this)
      },
    },

    view: {
      init(this: any) {
        this.listenTo(this.model, 'change:hasSocialItems', this.updatePlaceholder)
      },

      onRender(this: any) {
        this.updatePlaceholder()
      },

      updatePlaceholder(this: any) {
        const root = this.el as HTMLElement | undefined
        if (!root) return

        const selector = '.wb-social-links__placeholder'
        const placeholder = root.querySelector(selector)
        const hasItems = !!this.model.get('hasSocialItems')

        if (hasItems) {
          placeholder?.remove()
          return
        }

        if (placeholder) return

        const span = document.createElement('span')
        span.className = 'wb-social-links__placeholder'
        span.textContent = 'Social Links'
        span.setAttribute('data-gjs-placeholder', 'true')
        root.appendChild(span)
      },
    },
  })

  blockManager?.add(WB_SOCIAL_LINKS_TYPE, {
    label: 'Social Links',
    category: 'Navigation',
    content: {
      type: WB_SOCIAL_LINKS_TYPE,
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
      twitter: '',
      youtube: '',
      tiktok: '',
      pinterest: '',
      icon_size: 20,
      gap: 12,
      icon_color: '#111111',
      open_in_new_tab: true,
      align: 'left',
      aria_label_prefix: 'Follow us on',
    },
    media: BLOCK_ICON,
  })
}
