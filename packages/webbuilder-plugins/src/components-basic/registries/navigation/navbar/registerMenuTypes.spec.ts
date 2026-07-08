import { describe, expect, it, vi } from 'vitest'

import { TYPE_NAVBAR_MENU } from './constants.js'
import { registerNavbarMenuTypes } from './registerMenuTypes.js'

const createCollection = (items: any[] = []) => ({
  length: items.length,
  at: (index: number) => items[index],
})

describe('registerNavbarMenuTypes', () => {
  it('uses the backend menu tree selector for nav menus', () => {
    const registeredTypes: Record<string, any> = {}
    const editor = {
      DomComponents: {
        addType(type: string, config: any) {
          registeredTypes[type] = config
        },
      },
    }

    registerNavbarMenuTypes(editor as any)

    const traits = registeredTypes[TYPE_NAVBAR_MENU].model.defaults.traits
    expect(traits).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'menu-tree-select',
        label: '后台菜单',
        name: 'menuCode',
        changeProp: true,
      }),
    ]))
    expect(traits).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'navbar-menu-select',
        name: 'nmMenuSourceId',
      }),
    ]))
  })

  it('replaces legacy split menu-tree repeats with a single ordered repeat container', () => {
    const registeredTypes: Record<string, any> = {}
    const editor = {
      DomComponents: {
        addType(type: string, config: any) {
          registeredTypes[type] = config
        },
      },
    }
    registerNavbarMenuTypes(editor as any)

    const reset = vi.fn()
    const props: Record<string, any> = {
      menuCode: 'main-menu',
      menuDataKey: 'menuItems',
      nmGap: 28,
      nmDrawerWidth: '360px',
      nmDrawerBg: '#ffffff',
      nmDrawerPaddingTop: 72,
      nmDrawerPaddingX: 12,
      nmDrawerPaddingBottom: 24,
    }
    const oldSplitRepeat = {
      getAttributes: vi.fn(() => ({ 'data-cms-repeat': 'menuItem@menuItems' })),
      get: vi.fn((key: string) => key === 'classes' ? ['gjs-navbar__link'] : undefined),
      components: vi.fn(() => createCollection()),
    }
    const model = {
      get: vi.fn((key: string) => props[key]),
      set: vi.fn((next: Record<string, any>) => Object.assign(props, next)),
      getAttributes: vi.fn(() => ({ 'data-cms-component': 'menu-tree' })),
      setAttributes: vi.fn(),
      getStyle: vi.fn(() => ({})),
      setStyle: vi.fn(),
      components: vi.fn(() => ({
        length: 1,
        at: vi.fn(() => oldSplitRepeat),
        reset,
      })),
      listenTo: vi.fn(),
    }

    registeredTypes[TYPE_NAVBAR_MENU].model.init.call(model)

    expect(reset).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        classes: ['gjs-navbar__menu-item'],
        attributes: expect.objectContaining({
          'data-cms-repeat': 'menuItem@menuItems',
        }),
      }),
    ]))
  })
})
