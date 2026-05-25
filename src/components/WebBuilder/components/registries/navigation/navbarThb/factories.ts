/**
 * Factory functions for Navbar-THB components
 */

const BACK_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>`

export type ThbNavItem = { text: string; href?: string; target?: string }
export type ThbMegaColumn = {
  title: string
  href?: string
  target?: string
  items?: ThbNavItem[]
  isMedia?: boolean
  imageSrc?: string
  imageAlt?: string
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Leaf Elements ──────────────────────────────────────────────────────────

function linkAttributes(href = '#', target?: string, extra: Record<string, string> = {}) {
  return {
    href,
    ...extra,
    ...(target ? { target } : {}),
  }
}

export function makeTHBDropdownLink(text: string, href = '#', target?: string) {
  return {
    type: 'navbar-thb-dropdown-link',
    tagName: 'a',
    classes: ['site-header__dropdown-link'],
    attributes: linkAttributes(href, target, { role: 'menuitem' }),
    components: [{ type: 'textnode', content: text }],
  }
}

export function makeTHBMegaItem(text: string, href = '#', target?: string) {
  return {
    type: 'navbar-thb-mega-item',
    tagName: 'a',
    classes: ['site-header__mega-item'],
    attributes: linkAttributes(href, target),
    components: [{ type: 'textnode', content: text }],
  }
}

function hasMegaColumns(items: Array<ThbNavItem | ThbMegaColumn>): items is ThbMegaColumn[] {
  return items.some((item) => Array.isArray((item as ThbMegaColumn).items) || 'isMedia' in item)
}

// ── Panel structures ───────────────────────────────────────────────────────

export function makeTHBDropdown(items: ThbNavItem[] = []) {
  const resolvedItems = items.length
    ? items
    : [{ text: 'Item 1' }, { text: 'Item 2' }, { text: 'Item 3' }]
  return {
    type: 'navbar-thb-dropdown',
    tagName: 'div',
    classes: ['site-header__dropdown-wrap'],
    attributes: { 'aria-hidden': 'true' },
    selectable: false,
    hoverable: false,
    layerable: false,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    components: [
      {
        tagName: 'div',
        classes: ['site-header__dropdown'],
        attributes: { role: 'menu' },
        selectable: true,
        hoverable: true,
        layerable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        components: resolvedItems.map((item) => makeTHBDropdownLink(item.text, item.href ?? '#', item.target)),
      },
    ],
  }
}

export function makeTHBMegaCol(
  title: string,
  items: ThbNavItem[] = [],
  isRight = false,
  options: { href?: string; target?: string; imageSrc?: string; imageAlt?: string; keepEmptyItems?: boolean } = {},
) {
  const resolvedItems = items.length || options.keepEmptyItems
    ? items
    : [{ text: 'Item 1' }, { text: 'Item 2' }, { text: 'Item 3' }]
  const listClasses = resolvedItems.length > 5
    ? ['site-header__mega-list', 'site-header__mega-list--split']
    : ['site-header__mega-list']

  return {
    type: 'navbar-thb-mega-col',
    tagName: 'div',
    classes: isRight
      ? ['site-header__mega-col', 'site-header__mega-col--right']
      : ['site-header__mega-col'],
    selectable: true,
    hoverable: true,
    layerable: true,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: isRight ? false : true,
    components: [
      title
        ? {
            tagName: 'a',
            classes: ['site-header__mega-head'],
            attributes: linkAttributes(options.href || '#', options.target),
            selectable: false,
            hoverable: false,
            layerable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            components: [
              {
                tagName: 'span',
                selectable: false,
                hoverable: false,
                layerable: false,
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                components: [{ type: 'textnode', content: title }],
              },
              {
                tagName: 'i',
                attributes: { 'aria-hidden': 'true' },
                selectable: false,
                hoverable: false,
                layerable: false,
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                components: [{ type: 'textnode', content: '›' }],
              },
            ],
          }
        : {
            tagName: 'div',
            classes: ['site-header__mega-head', 'site-header__mega-head--empty'],
            attributes: { 'aria-hidden': 'true' },
            selectable: false,
            hoverable: false,
            layerable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
          },
      ...(isRight
        ? [
            {
              tagName: 'a',
              classes: ['site-header__mega-media'],
              attributes: linkAttributes(options.href || '#', options.target),
              selectable: true,
              hoverable: true,
              layerable: true,
              draggable: false,
              droppable: true,
              copyable: false,
              removable: false,
              components: [
                {
                  type: 'image',
                  tagName: 'img',
                  attributes: {
                    src: options.imageSrc || 'https://placehold.co/520x360/f3f4f6/94a3b8?text=Feature',
                    alt: options.imageAlt || title || 'Feature Image',
                  },
                  selectable: false,
                  hoverable: false,
                  layerable: false,
                  draggable: false,
                  droppable: false,
                  copyable: false,
                  removable: false,
                },
              ],
            },
          ]
        : [
            {
              tagName: 'div',
              classes: listClasses,
              selectable: true,
              hoverable: true,
              layerable: true,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              components: resolvedItems.map((item) => makeTHBMegaItem(item.text, item.href ?? '#', item.target)),
            },
          ]),
    ],
  }
}

export function makeTHBMega(items: Array<ThbNavItem | ThbMegaColumn> = []) {
  const columns: ThbMegaColumn[] = hasMegaColumns(items)
    ? items as ThbMegaColumn[]
    : (() => {
        const flatItems = items as ThbNavItem[]
        const half = Math.ceil(flatItems.length / 2) || 0
        return [
          {
            title: 'Category',
            items: flatItems.length
              ? flatItems.slice(0, half || flatItems.length)
              : [{ text: 'Item 1' }, { text: 'Item 2' }],
          },
          ...(flatItems.length > 1 ? [{ title: '', items: flatItems.slice(half) }] : []),
          { title: '', isMedia: true },
        ]
      })()

  const contentColumns = columns.length
    ? columns
    : [
        { title: 'Category', items: [{ text: 'Item 1' }, { text: 'Item 2' }] },
        { title: '', isMedia: true },
      ]

  return {
    type: 'navbar-thb-mega',
    tagName: 'div',
    classes: ['site-header__dropdown-wrap'],
    attributes: { 'aria-hidden': 'true' },
    selectable: false,
    hoverable: false,
    layerable: false,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    components: [
      {
        tagName: 'div',
        classes: ['site-header__dropdown', 'site-header__dropdown--mega'],
        attributes: { role: 'menu' },
        selectable: true,
        hoverable: true,
        layerable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        components: [
          {
            tagName: 'div',
            classes: ['site-header__mega'],
            selectable: false,
            hoverable: false,
            layerable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            components: contentColumns.map((column, index) => {
              const isMediaColumn =
                column.isMedia || (index === contentColumns.length - 1 && !(column.items || []).length)
              return makeTHBMegaCol(
                column.title,
                column.items || [],
                isMediaColumn,
                {
                  href: column.href,
                  target: column.target,
                  imageSrc: column.imageSrc,
                  imageAlt: column.imageAlt,
                  keepEmptyItems: hasMegaColumns(items),
                },
              )
            }),
          },
        ],
      },
    ],
  }
}

// ── Top-level nav items ────────────────────────────────────────────────────

export function makeTHBNavItem(text: string, href = '#', target?: string) {
  return {
    type: 'navbar-thb-nav-item',
    tagName: 'li',
    classes: ['site-header__nav-item'],
    components: [
      {
        tagName: 'a',
        classes: ['site-header__nav-link'],
        attributes: linkAttributes(href, target),
        selectable: false,
        hoverable: false,
        layerable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        components: [{ type: 'textnode', content: text }],
      },
    ],
  }
}

export function makeTHBNavGroup(
  text: string,
  href = '#',
  menuType: 'dropdown' | 'mega' = 'dropdown',
  items: Array<ThbNavItem | ThbMegaColumn> = [],
  target?: string,
) {
  return {
    type: 'navbar-thb-nav-group',
    tagName: 'li',
    classes: ['site-header__nav-item', 'site-header__nav-item--has-dropdown'],
    thbNgLabel: text,
    thbNgHref: href,
    thbNgType: menuType,
    components: [
      {
        tagName: 'a',
        classes: ['site-header__nav-link'],
        attributes: linkAttributes(href, target),
        selectable: false,
        hoverable: false,
        layerable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        components: [{ type: 'textnode', content: text }],
      },
      menuType === 'mega' ? makeTHBMega(items) : makeTHBDropdown(items),
    ],
  }
}

// ── Mobile nav HTML generation ─────────────────────────────────────────────

function buildMobileItem(item: any, depth = 0): string {
  const title = String(item.resolvedTitle || item.title || item.name || '').trim()
  const url = String(item.resolvedUrl || item.url || item.href || '#').trim() || '#'
  const children = (Array.isArray(item.children) ? item.children : []).filter(
    (c: any) => c.isVisible !== false,
  )
  if (!title) return ''

  const safeTitle = escapeHtml(title)
  const safeUrl = escapeHtml(url)
  const target = String(item.target || '').trim()
  const targetAttr = target ? ` target="${escapeHtml(target)}"` : ''
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const panelId = `${safeId}-d${depth}`

  if (children.length > 0) {
    const childItems = children.map((c: any) => buildMobileItem(c, depth + 1)).join('\n')
    return `<li>
  <a class="nav-mobile__link" href="${safeUrl}"${targetAttr}>${safeTitle}</a>
  <button class="nav-mobile__expand" type="button" data-target="${panelId}" aria-label="Open ${safeTitle} submenu">
    <span class="nav-mobile__entry-icon" aria-hidden="true">+</span>
  </button>
  <section class="nav-mobile__panel" data-panel="${panelId}">
    <div class="nav-mobile__heading-row">
      <button class="nav-mobile__back" type="button" data-back aria-label="Back">${BACK_SVG}</button>
      <h2 class="nav-mobile__heading">${safeTitle}</h2>
    </div>
    <ul class="nav-mobile__list">${childItems}</ul>
    <a class="nav-mobile__viewall" href="${safeUrl}"${targetAttr}>View All <span aria-hidden="true">»</span></a>
  </section>
</li>`
  }
  return `<li><a class="nav-mobile__link" href="${safeUrl}"${targetAttr}>${safeTitle}</a></li>`
}

/**
 * Generate mobile nav content HTML from API menu items.
 * The nested panel structure will be flattened at runtime by flattenMobilePanels().
 */
export function generateMobileNavContent(items: any[]): string {
  const listItems = items.map((item) => buildMobileItem(item)).filter(Boolean).join('\n')
  return `<section class="nav-mobile__panel is-active" data-panel="root">
  <h2 class="nav-mobile__heading">Menu</h2>
  <ul class="nav-mobile__list">${listItems}</ul>
</section>`
}
