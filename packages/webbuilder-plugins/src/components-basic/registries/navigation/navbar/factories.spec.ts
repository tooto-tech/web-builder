import { describe, expect, it } from 'vitest'

import { TYPE_NAVBAR_MENU } from './constants.js'
import { createNavbarStructure } from './factories.js'

function flattenComponents(component: any): any[] {
  const children = Array.isArray(component?.components) ? component.components : []
  return [component, ...children.flatMap((child) => flattenComponents(child))]
}

describe('navbar factories', () => {
  it('creates a backend-rendered menu tree skeleton for the default nav menu', () => {
    const allComponents = createNavbarStructure().flatMap((component) => flattenComponents(component))
    const menu = allComponents.find((component) => component.type === TYPE_NAVBAR_MENU)

    expect(menu?.attributes).toMatchObject({
      'data-cms-component': 'menu-tree',
      'data-menu-code': 'main-menu',
      'data-menu-data-key': 'menuItems',
      'data-wb-i18n-skip': 'true',
      translate: 'no',
    })

    const menuComponents = flattenComponents(menu)
    const rootMenuRepeats = menuComponents.filter(
      component => component?.attributes?.['data-cms-repeat'] === 'menuItem@menuItems',
    )
    expect(rootMenuRepeats).toHaveLength(1)
    expect(rootMenuRepeats[0]).toMatchObject({
      classes: ['gjs-navbar__menu-item'],
    })
    expect(menuComponents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        classes: ['gjs-navbar__link'],
        attributes: expect.objectContaining({
          'data-cms-if': '!menuItem.hasChildren',
          'data-cms-bind-href': 'menuItem.url',
          'data-cms-bind-target': 'menuItem.target',
          'data-cms-bind-rel': 'menuItem.rel',
        }),
      }),
      expect.objectContaining({
        classes: ['gjs-nav-group'],
        attributes: expect.objectContaining({
          'data-cms-if': 'menuItem.hasChildren',
          'data-cms-bind-classappend': 'menuItem.submenuTypeClass',
        }),
      }),
      expect.objectContaining({
        classes: ['gjs-nav-group__dropdown'],
        attributes: expect.objectContaining({
          'data-cms-if': "menuItem.submenuType == 'dropdown'",
        }),
      }),
      expect.objectContaining({
        classes: ['gjs-nav-group__mega'],
        attributes: expect.objectContaining({
          'data-cms-if': "menuItem.submenuType == 'mega'",
        }),
      }),
      expect.objectContaining({
        classes: ['gjs-nav-group__mega-item'],
        attributes: expect.objectContaining({
          'data-cms-repeat': 'child@menuItem.children',
          'data-cms-bind-data-mega-image-src': 'child.menuImage',
          'data-cms-bind-data-mega-image-alt': 'child.menuImageAlt',
        }),
      }),
    ]))
  })
})
