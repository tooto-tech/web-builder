import { describe, expect, it } from 'vitest'
import { resolveMenuTreeAttrs } from './menuTreeAttrs'

describe('cms menu tree attrs', () => {
  it('uses default menu code and preserves custom root classes', () => {
    const attrs = resolveMenuTreeAttrs({
      get: () => undefined,
      getAttributes: () => ({
        class: 'custom-menu',
        'data-menu-code': '',
        'data-menu-data-key': '',
      }),
    })

    expect(attrs['data-menu-code']).toBe('main-menu')
    expect(attrs.class).toBe('wb-menu-tree custom-menu notranslate')
    expect(attrs['data-menu-data-key']).toBe('')
    expect(attrs['data-wb-i18n-skip']).toBe('true')
    expect(attrs.translate).toBe('no')
  })

  it('keeps explicit menu code and data key', () => {
    const attrs = resolveMenuTreeAttrs({
      get: (key: string) => {
        if (key === 'menuCode') return 'products-menu'
        if (key === 'menuDataKey') return '1-products-menu-items'
        return undefined
      },
      getAttributes: () => ({ class: 'wb-menu-tree' }),
    })

    expect(attrs['data-menu-code']).toBe('products-menu')
    expect(attrs['data-menu-data-key']).toBe('_1_products_menu_items')
    expect(attrs.class).toBe('wb-menu-tree notranslate')
  })
})
