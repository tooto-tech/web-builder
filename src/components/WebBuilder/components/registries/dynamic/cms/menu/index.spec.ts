import { describe, expect, it } from 'vitest'
import { resolveSiteMenuAttrs } from './siteMenuAttrs'

describe('cms site menu attrs', () => {
  it('falls back to the default menu code for legacy schema without menuCode prop', () => {
    const attrs = resolveSiteMenuAttrs({
      get: (key: string) => {
        if (key === 'menuLayout') return undefined
        if (key === 'submenuTrigger') return undefined
        if (key === 'menuCode') return undefined
        return undefined
      },
      getAttributes: () => ({
        'data-menu-code': '',
        'data-layout': 'horizontal',
        'data-submenu-trigger': 'hover',
      }),
      getId: () => 'iacp',
      cid: 'iacp',
    })

    expect(attrs['data-menu-code']).toBe('main-menu')
    expect(attrs['data-menu-bind-key']).toBe('menu_html_iacp')
    expect(attrs['data-cms-html']).toBe('menu_html_iacp')
    expect(attrs.class).toBe('wb-site-menu notranslate')
    expect(attrs['data-wb-i18n-skip']).toBe('true')
    expect(attrs.translate).toBe('no')
  })

  it('keeps an explicitly configured menu code', () => {
    const attrs = resolveSiteMenuAttrs({
      get: (key: string) => {
        if (key === 'menuCode') return 'tenant-2-header'
        if (key === 'menuLayout') return 'vertical'
        if (key === 'submenuTrigger') return 'click'
        return undefined
      },
      getAttributes: () => ({}),
      getId: () => 'menu-2',
      cid: 'menu-2',
    })

    expect(attrs['data-menu-code']).toBe('tenant-2-header')
    expect(attrs['data-layout']).toBe('vertical')
    expect(attrs['data-submenu-trigger']).toBe('click')
  })
})
