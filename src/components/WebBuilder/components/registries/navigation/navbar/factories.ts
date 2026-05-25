import {
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
} from './constants'

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
            {
              type: TYPE_NAVBAR_MENU,
              tagName: 'nav',
              classes: ['gjs-navbar__menu'],
              components: [
                uiEl('button', ['gjs-navbar__close'], {
                  attributes: { 'aria-label': 'Close menu', type: 'button' },
                  content: '✕',
                }),
                makeNavGroup('Products', 'mega', {
                  megaTitle: '',
                  megaItems: [
                    { text: 'Bathroom Mirrors', imageSrc: 'https://placehold.co/800x560/ded8d0/6b7280?text=Bathroom+Mirrors' },
                    { text: 'Shower Doors', imageSrc: 'https://placehold.co/800x560/d9d6d1/6b7280?text=Shower+Doors' },
                    { text: 'Bathtub Doors', imageSrc: 'https://placehold.co/800x560/d4d1cb/6b7280?text=Bathtub+Doors' },
                    { text: 'Medicine Cabinets', imageSrc: 'https://placehold.co/800x560/e2ddd6/6b7280?text=Medicine+Cabinets' },
                    { text: 'Ceiling Fan', imageSrc: 'https://placehold.co/800x560/d7d3ce/6b7280?text=Ceiling+Fan' },
                    { text: 'Chandelier', imageSrc: 'https://placehold.co/800x560/ddd8d2/6b7280?text=Chandelier' },
                  ],
                  megaFooterLinkText: 'View All',
                  megaImageSrc: 'https://placehold.co/800x560/ded8d0/6b7280?text=Bathroom+Mirrors',
                  megaImageAlt: 'Bathroom mirrors',
                }),
                makeNavGroup('Solutions', 'mega', {
                  megaTitle: '',
                  megaItems: [
                    { text: 'Public & Commercial Buildings', imageSrc: 'https://placehold.co/800x560/d5d2cd/6b7280?text=Public+%26+Commercial+Buildings' },
                    { text: 'High-end Residences & Real Estate', imageSrc: 'https://placehold.co/800x560/d7d4cf/6b7280?text=High-end+Residences' },
                    { text: 'Healthcare & Wellness Spaces', imageSrc: 'https://placehold.co/800x560/dcd8d2/6b7280?text=Healthcare+%26+Wellness' },
                    { text: 'Hotels & Resorts', imageSrc: 'https://placehold.co/800x560/d4d1cb/6b7280?text=Hotels+%26+Resorts' },
                    { text: 'Small Houses & Apartments', imageSrc: 'https://placehold.co/800x560/ddd7d0/6b7280?text=Small+Houses+%26+Apartments' },
                    { text: 'Customization', imageSrc: 'https://placehold.co/800x560/d9d4ce/6b7280?text=Customization' },
                  ],
                  megaFooterLinkText: 'View All',
                  megaImageSrc: 'https://placehold.co/800x560/d5d2cd/6b7280?text=Public+%26+Commercial+Buildings',
                  megaImageAlt: 'Hotels and resorts',
                }),
                makeLink('Cases'),
                makeNavGroup('Why Foca', 'mega', {
                  megaTitle: '',
                  megaItems: [
                    { text: 'About FOCA', imageSrc: 'https://placehold.co/800x560/d8d4cf/6b7280?text=About+FOCA' },
                    { text: 'Company Structure', imageSrc: 'https://placehold.co/800x560/ded9d2/6b7280?text=Company+Structure' },
                    { text: 'Foca Team', imageSrc: 'https://placehold.co/800x560/d4d0ca/6b7280?text=Foca+Team' },
                    { text: 'Location', imageSrc: 'https://placehold.co/800x560/d9d5ce/6b7280?text=Location' },
                    { text: 'Partnership', imageSrc: 'https://placehold.co/800x560/dcd6cf/6b7280?text=Partnership' },
                  ],
                  megaImageSrc: 'https://placehold.co/800x560/d8d4cf/6b7280?text=About+FOCA',
                  megaImageAlt: 'About FOCA',
                }),
                makeNavGroup('Resources', 'mega', {
                  megaTitle: '',
                  megaItems: [
                    { text: 'Technical Support', imageSrc: 'https://placehold.co/800x560/d7d3cc/6b7280?text=Technical+Support' },
                    { text: 'FAQs', imageSrc: 'https://placehold.co/800x560/ddd8d1/6b7280?text=FAQs' },
                  ],
                  megaImageSrc: 'https://placehold.co/800x560/d7d3cc/6b7280?text=Technical+Support',
                  megaImageAlt: 'Technical Support',
                }),
                makeLink('Contact'),
              ],
            },
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
