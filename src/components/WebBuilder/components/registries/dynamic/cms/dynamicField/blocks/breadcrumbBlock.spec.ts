import { describe, expect, it, vi } from 'vitest'
import { registerDynamicBreadcrumbBlock } from './breadcrumbBlock'
import { WB_CMS_DYN_BREADCRUMB_TYPE } from '../constants'
import { DYNAMIC_FIELD_STYLES, DYNAMIC_FIELD_STYLE_KEY } from '../styles'
import { getInjectedPublishCss } from '../../../../../../utils/injectStyle'

describe('cms dynamic breadcrumb block', () => {
  it('repeats breadcrumb list items instead of the list container', () => {
    let definition: any = null
    const editor = {
      DomComponents: {
        getType: vi.fn(() => null),
        addType: vi.fn((_type: string, def: any) => {
          definition = def
        })
      },
      on: vi.fn()
    }

    registerDynamicBreadcrumbBlock(editor)

    expect(editor.DomComponents.addType).toHaveBeenCalledWith(
      WB_CMS_DYN_BREADCRUMB_TYPE,
      expect.any(Object)
    )
    const ol = definition.model.defaults.components[0]
    const li = ol.components[0]
    const link = li.components[0]

    expect(ol.attributes['data-cms-repeat']).toBeUndefined()
    expect(li.attributes['data-cms-repeat']).toBe('breadcrumb@breadcrumbs')
    expect(li.attributes['data-cms-bind-classappend']).toBe('breadcrumb.currentClass')
    expect(link.attributes['data-cms-bind-title']).toBe('breadcrumb.label')
    expect(link.attributes['data-cms-bind-aria-current']).toBe('breadcrumb.ariaCurrent')
  })

  it('uses publishable class selectors for the default breadcrumb style', () => {
    expect(DYNAMIC_FIELD_STYLE_KEY).toBe('data-wb-dynamic')
    expect(DYNAMIC_FIELD_STYLES).toContain('.wb-cms-dynamic-breadcrumb__list')
    expect(DYNAMIC_FIELD_STYLES).not.toContain('[data-wb-dynamic="breadcrumb"] .wb-cms-dynamic-breadcrumb__list')
    expect(DYNAMIC_FIELD_STYLES).toContain('--wb-breadcrumb-font-size, 12px')
    expect(DYNAMIC_FIELD_STYLES).toContain('--wb-breadcrumb-mobile-font-size, 12px')
    expect(DYNAMIC_FIELD_STYLES).toContain('[data-wb-dynamic="text"]')
    expect(DYNAMIC_FIELD_STYLES).toContain('white-space: pre-line')
  })

  it('includes the default breadcrumb style in publish css when dynamic markup is present', () => {
    const editor = {
      __wbPendingStyles: [{ key: DYNAMIC_FIELD_STYLE_KEY, css: DYNAMIC_FIELD_STYLES }]
    }
    const css = getInjectedPublishCss(
      editor,
      '<nav data-wb-dynamic="breadcrumb" class="wb-cms-dynamic-breadcrumb"></nav>',
      ''
    )

    expect(css).toContain('.wb-cms-dynamic-breadcrumb')
    expect(css).toContain('display: flex')
  })
})
