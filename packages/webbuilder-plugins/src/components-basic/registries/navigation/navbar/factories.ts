import {
  DEFAULT_NAVBAR_MENU_CODE,
  DEFAULT_NAVBAR_MENU_DATA_KEY,
  NAV_GROUP_CHEVRON,
  TYPE_DROPDOWN,
  TYPE_DROPDOWN_ITEM,
  TYPE_MEGA,
  TYPE_MEGA_COL,
  TYPE_MEGA_INNER,
  TYPE_MEGA_ITEM,
  TYPE_MEGA_LEFT,
  TYPE_MEGA_RIGHT,
  TYPE_NAVBAR_CENTER,
  TYPE_NAVBAR_LEFT,
  TYPE_NAVBAR_LINK,
  TYPE_NAVBAR_MENU,
  TYPE_NAVBAR_RIGHT,
  TYPE_NAV_GROUP,
  type NavGroupMenuType,
} from './constants.js'

export function uiEl(tagName: string, classes: string[], extra: Record<string, unknown> = {}) {
  return {
    tagName,
    classes,
    selectable: false,
    hoverable: false,
    draggable: false,
    droppable: false,
    layerable: false,
    highlightable: false,
    ...extra,
  }
}

export function makeLink(text: string, href = '#', cta = false) {
  return {
    type: TYPE_NAVBAR_LINK,
    tagName: 'a',
    attributes: { href, ...(cta ? { 'data-cta': '' } : {}) },
    classes: cta ? ['gjs-navbar__link--cta'] : ['gjs-navbar__link'],
    components: [{ type: 'textnode', content: text }],
  }
}

export function makeBurger() {
  return {
    ...uiEl('button', ['gjs-navbar__burger'], {
      attributes: { 'aria-label': 'Open menu', type: 'button' },
    }),
    components: [
      uiEl('span', []),
      uiEl('span', []),
      uiEl('span', []),
    ],
  }
}

export function makeDropdownItem(text: string, href = '#') {
  return {
    type: TYPE_DROPDOWN_ITEM,
    tagName: 'a',
    classes: ['gjs-nav-group__dropdown-item'],
    attributes: { href },
    components: [{ type: 'textnode', content: text }],
  }
}

export function makeDropdown(items: Array<{ text: string, href?: string }> = []) {
  const resolvedItems = items.length
    ? items
    : [
        { text: 'Item 1' },
        { text: 'Item 2' },
        { text: 'Item 3' },
      ]

  return {
    type: TYPE_DROPDOWN,
    tagName: 'div',
    classes: ['gjs-nav-group__dropdown'],
    components: [
      {
        tagName: 'div',
        classes: ['gjs-nav-group__dropdown-inner'],
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        selectable: true,
        hoverable: true,
        layerable: true,
        highlightable: true,
        components: resolvedItems.map((item) => makeDropdownItem(item.text, item.href ?? '#')),
      },
    ],
  }
}

export function makeMegaItem(
  text: string,
  href = '#',
  options?: { imageSrc?: string, imageAlt?: string },
) {
  return {
    type: TYPE_MEGA_ITEM,
    tagName: 'a',
    classes: ['gjs-nav-group__mega-item'],
    attributes: {
      href,
      'data-mega-image-src': options?.imageSrc ?? '',
      'data-mega-image-alt': options?.imageAlt ?? text,
    },
    components: [
      {
        tagName: 'span',
        classes: ['gjs-nav-group__mega-item-label'],
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        selectable: false,
        hoverable: false,
        layerable: false,
        components: [{ type: 'textnode', content: text }],
      },
      {
        tagName: 'span',
        classes: ['gjs-nav-group__mega-item-icon'],
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        selectable: false,
        hoverable: false,
        layerable: false,
        components: [{ type: 'textnode', content: '+' }],
      },
    ],
  }
}

export function makeMegaCol(
  title: string,
  items: Array<{ text: string, href?: string, imageSrc?: string, imageAlt?: string }> = [],
) {
  const resolvedItems = items.length
    ? items
    : [
        { text: 'Item 1' },
        { text: 'Item 2' },
        { text: 'Item 3' },
        { text: 'Item 4' },
        { text: 'Item 5' },
      ]

  return {
    type: TYPE_MEGA_COL,
    tagName: 'div',
    classes: ['gjs-nav-group__mega-col'],
    components: [
      ...(title
        ? [{
            tagName: 'div',
            classes: ['gjs-nav-group__mega-col-title'],
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            selectable: false,
            hoverable: false,
            layerable: false,
            components: [{ type: 'textnode', content: title }],
          }]
        : []),
      ...resolvedItems.map((item) =>
        makeMegaItem(item.text, item.href ?? '#', {
          imageSrc: item.imageSrc,
          imageAlt: item.imageAlt,
        })),
    ],
  }
}

export function makeMegaFooterLink(text: string, href = '#') {
  return {
    tagName: 'a',
    classes: ['gjs-nav-group__mega-footer-link'],
    attributes: { href },
    components: [
      { type: 'textnode', content: text },
      {
        tagName: 'span',
        classes: ['gjs-nav-group__mega-footer-icon'],
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        selectable: false,
        hoverable: false,
        layerable: false,
        components: [{ type: 'textnode', content: '→' }],
      },
    ],
  }
}

export function makeMegaRightImage(
  src = 'https://placehold.co/630x420/e2e8f0/94a3b8?text=Feature+Image',
  alt = 'Feature Image',
) {
  return {
    tagName: 'img',
    classes: ['gjs-nav-group__mega-img'],
    attributes: {
      src,
      alt,
      width: '630',
      height: '420',
    },
    draggable: false,
    copyable: false,
    removable: false,
  }
}

export function makeMega(options?: {
  title?: string
  items?: Array<{ text: string, href?: string, imageSrc?: string, imageAlt?: string }>
  footerLinkText?: string
  footerLinkHref?: string
  imageSrc?: string
  imageAlt?: string
}) {
  return {
    type: TYPE_MEGA,
    tagName: 'div',
    classes: ['gjs-nav-group__mega'],
    components: [
      {
        type: TYPE_MEGA_INNER,
        tagName: 'div',
        classes: ['gjs-nav-group__mega-inner'],
        components: [
          {
            type: TYPE_MEGA_LEFT,
            tagName: 'div',
            classes: ['gjs-nav-group__mega-left'],
            components: [
              {
                tagName: 'div',
                classes: ['gjs-nav-group__mega-left-stack'],
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                selectable: true,
                hoverable: true,
                layerable: true,
                components: [
                  makeMegaCol(options?.title ?? 'Classification', options?.items ?? []),
                  ...(options?.footerLinkText
                    ? [makeMegaFooterLink(options.footerLinkText, options.footerLinkHref ?? '#')]
                    : []),
                ],
              },
            ],
          },
          {
            type: TYPE_MEGA_RIGHT,
            tagName: 'div',
            classes: ['gjs-nav-group__mega-right'],
            components: [
              makeMegaRightImage(options?.imageSrc, options?.imageAlt),
            ],
          },
        ],
      },
    ],
  }
}

export function makeNavGroup(
  label: string,
  menuType: NavGroupMenuType = 'dropdown',
  options?: {
    dropdownItems?: Array<{ text: string, href?: string }>
    megaTitle?: string
    megaItems?: Array<{ text: string, href?: string, imageSrc?: string, imageAlt?: string }>
    megaFooterLinkText?: string
    megaFooterLinkHref?: string
    megaImageSrc?: string
    megaImageAlt?: string
  },
) {
  return {
    type: TYPE_NAV_GROUP,
    tagName: 'div',
    classes: menuType === 'mega' ? ['gjs-nav-group', 'gjs-nav-group--mega'] : ['gjs-nav-group'],
    ngLabel: label,
    ngType: menuType,
    components: [
      {
        tagName: 'button',
        classes: ['gjs-nav-group__btn'],
        attributes: { type: 'button' },
        selectable: false,
        hoverable: false,
        draggable: false,
        droppable: false,
        layerable: false,
        highlightable: false,
        components: [
          { type: 'textnode', content: label },
          uiEl('span', ['gjs-nav-group__btn-chevron'], { content: NAV_GROUP_CHEVRON }),
        ],
      },
      menuType === 'mega'
        ? makeMega({
            title: options?.megaTitle,
            items: options?.megaItems,
            footerLinkText: options?.megaFooterLinkText,
            footerLinkHref: options?.megaFooterLinkHref,
            imageSrc: options?.megaImageSrc,
            imageAlt: options?.megaImageAlt,
          })
        : makeDropdown(options?.dropdownItems),
    ],
  }
}

function makeBackendMenuText(binding: string, text: string, classes: string[]) {
  return {
    tagName: 'span',
    classes: [...classes, 'wb-menu-tree-text'],
    attributes: { 'data-cms-bind': binding },
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    selectable: false,
    hoverable: false,
    layerable: false,
    components: [{ type: 'textnode', content: text }],
  }
}

function makeBackendLeafLink() {
  return {
    type: TYPE_NAVBAR_LINK,
    tagName: 'a',
    classes: ['gjs-navbar__link'],
    attributes: {
      href: '#',
      'data-cms-if': '!menuItem.hasChildren',
      'data-cms-bind-href': 'menuItem.url',
      'data-cms-bind-target': 'menuItem.target',
      'data-cms-bind-rel': 'menuItem.rel',
    },
    components: [
      makeBackendMenuText('menuItem.title', 'Menu', ['gjs-navbar__link-label']),
    ],
  }
}

function makeBackendDropdown() {
  return {
    type: TYPE_DROPDOWN,
    tagName: 'div',
    classes: ['gjs-nav-group__dropdown'],
    attributes: {
      'data-cms-if': "menuItem.submenuType == 'dropdown'",
    },
    components: [
      {
        tagName: 'div',
        classes: ['gjs-nav-group__dropdown-inner'],
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        selectable: true,
        hoverable: true,
        layerable: true,
        highlightable: true,
        components: [
          {
            type: TYPE_DROPDOWN_ITEM,
            tagName: 'a',
            classes: ['gjs-nav-group__dropdown-item'],
            attributes: {
              href: '#',
              'data-cms-repeat': 'child@menuItem.children',
              'data-cms-bind-href': 'child.url',
              'data-cms-bind-target': 'child.target',
              'data-cms-bind-rel': 'child.rel',
            },
            components: [
              makeBackendMenuText('child.title', 'Child', ['gjs-nav-group__dropdown-item-label']),
            ],
          },
        ],
      },
    ],
  }
}

function makeBackendMega() {
  return {
    type: TYPE_MEGA,
    tagName: 'div',
    classes: ['gjs-nav-group__mega'],
    attributes: {
      'data-cms-if': "menuItem.submenuType == 'mega'",
    },
    components: [
      {
        type: TYPE_MEGA_INNER,
        tagName: 'div',
        classes: ['gjs-nav-group__mega-inner'],
        components: [
          {
            type: TYPE_MEGA_LEFT,
            tagName: 'div',
            classes: ['gjs-nav-group__mega-left'],
            components: [
              {
                tagName: 'div',
                classes: ['gjs-nav-group__mega-left-stack'],
                draggable: false,
                droppable: false,
                copyable: false,
                removable: false,
                selectable: true,
                hoverable: true,
                layerable: true,
                components: [
                  {
                    type: TYPE_MEGA_COL,
                    tagName: 'div',
                    classes: ['gjs-nav-group__mega-col'],
                    components: [
                      {
                        type: TYPE_MEGA_ITEM,
                        tagName: 'a',
                        classes: ['gjs-nav-group__mega-item'],
                        attributes: {
                          href: '#',
                          'data-cms-repeat': 'child@menuItem.children',
                          'data-cms-bind-href': 'child.url',
                          'data-cms-bind-target': 'child.target',
                          'data-cms-bind-rel': 'child.rel',
                          'data-cms-bind-data-mega-image-src': 'child.menuImage',
                          'data-cms-bind-data-mega-image-alt': 'child.menuImageAlt',
                        },
                        components: [
                          makeBackendMenuText('child.title', 'Child', ['gjs-nav-group__mega-item-label']),
                          {
                            tagName: 'span',
                            classes: ['gjs-nav-group__mega-item-icon'],
                            draggable: false,
                            droppable: false,
                            copyable: false,
                            removable: false,
                            selectable: false,
                            hoverable: false,
                            layerable: false,
                            components: [{ type: 'textnode', content: '+' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: TYPE_MEGA_RIGHT,
            tagName: 'div',
            classes: ['gjs-nav-group__mega-right'],
            components: [
              {
                tagName: 'img',
                classes: ['gjs-nav-group__mega-img'],
                attributes: {
                  src: 'https://placehold.co/630x420/e2e8f0/94a3b8?text=Feature+Image',
                  alt: 'Feature Image',
                  width: '630',
                  height: '420',
                  'data-cms-bind-src': 'menuItem.children[0].menuImage',
                  'data-cms-bind-alt': 'menuItem.children[0].menuImageAlt',
                },
                draggable: false,
                copyable: false,
                removable: false,
              },
            ],
          },
        ],
      },
    ],
  }
}

function makeBackendMenuItem() {
  return {
    tagName: 'div',
    classes: ['gjs-navbar__menu-item'],
    attributes: {
      'data-cms-repeat': 'menuItem@menuItems',
    },
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    selectable: false,
    hoverable: false,
    layerable: false,
    components: [
      makeBackendLeafLink(),
      {
        type: TYPE_NAV_GROUP,
        tagName: 'div',
        classes: ['gjs-nav-group'],
        attributes: {
          'data-cms-if': 'menuItem.hasChildren',
          'data-cms-bind-classappend': 'menuItem.submenuTypeClass',
        },
        components: [
          {
            tagName: 'button',
            classes: ['gjs-nav-group__btn'],
            attributes: { type: 'button' },
            selectable: false,
            hoverable: false,
            draggable: false,
            droppable: false,
            layerable: false,
            highlightable: false,
            components: [
              makeBackendMenuText('menuItem.title', 'Menu', ['gjs-nav-group__btn-label']),
              uiEl('span', ['gjs-nav-group__btn-chevron'], { content: NAV_GROUP_CHEVRON }),
            ],
          },
          makeBackendDropdown(),
          makeBackendMega(),
        ],
      },
    ],
  }
}

export function makeBackendNavbarMenuComponents() {
  return [
    uiEl('button', ['gjs-navbar__close'], {
      attributes: { 'aria-label': 'Close menu', type: 'button' },
      content: '✕',
    }),
    makeBackendMenuItem(),
  ]
}

export function makeBackendNavbarMenu() {
  return {
    type: TYPE_NAVBAR_MENU,
    tagName: 'nav',
    classes: ['gjs-navbar__menu'],
    menuCode: DEFAULT_NAVBAR_MENU_CODE,
    menuDataKey: DEFAULT_NAVBAR_MENU_DATA_KEY,
    attributes: {
      'data-cms-component': 'menu-tree',
      'data-menu-code': DEFAULT_NAVBAR_MENU_CODE,
      'data-menu-data-key': DEFAULT_NAVBAR_MENU_DATA_KEY,
      'data-wb-i18n-skip': 'true',
      translate: 'no',
    },
    components: makeBackendNavbarMenuComponents(),
  }
}

export function createNavbarStructure() {
  return [
    {
      tagName: 'div',
      classes: ['gjs-navbar__inner'],
      selectable: false,
      hoverable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      highlightable: false,
      components: [
        {
          type: TYPE_NAVBAR_LEFT,
          tagName: 'div',
          classes: ['gjs-navbar__left'],
          components: [
            makeBurger(),
            {
              type: 'logo-brand',
              tagName: 'a',
              classes: ['gjs-logo'],
              attributes: { href: '/' },
              components: [
                {
                  type: 'image',
                  tagName: 'img',
                  classes: ['gjs-logo__img'],
                  attributes: { src: '', alt: 'Logo' },
                  selectable: false,
                  hoverable: false,
                  draggable: false,
                  droppable: false,
                  layerable: false,
                  highlightable: false,
                },
              ],
            },
          ],
        },
        {
          type: TYPE_NAVBAR_CENTER,
          tagName: 'div',
          classes: ['gjs-navbar__center'],
          components: [
            makeBackendNavbarMenu(),
          ],
        },
        {
          type: TYPE_NAVBAR_RIGHT,
          tagName: 'div',
          classes: ['gjs-navbar__right'],
          components: [
            {
              type: 'search-spotlight',
            },
            makeLink('Request a Quote', '/contact-us', true),
          ],
        },
      ],
    },
    uiEl('div', ['gjs-navbar__overlay']),
  ]
}
