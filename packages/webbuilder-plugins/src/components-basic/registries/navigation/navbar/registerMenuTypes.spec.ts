import { describe, expect, it } from 'vitest'

import { TYPE_NAVBAR_MENU } from './constants.js'
import { registerNavbarMenuTypes } from './registerMenuTypes.js'

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
})
