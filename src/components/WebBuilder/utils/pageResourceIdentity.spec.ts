import { describe, expect, it } from 'vitest'
import {
  applySourceResourceQuery,
  buildSelectedPageRouteQuery,
  findEditorPageByRoute,
  getEditorModeForResource,
  getSelectedEditorPageQuery,
  isLayoutPageResource,
  isLoopItemTemplateResource,
  isTemplateResource,
  isTemplateRulesPanelResource,
  resolvePageResourceIdentityFromRoute,
} from './pageResourceIdentity'

const makePage = (attrs: Record<string, any>) => ({
  ...attrs,
  get: (key: string) => attrs[key],
})

describe('pageResourceIdentity', () => {
  it('normalizes route query aliases and lets explicit props override query values', () => {
    expect(
      resolvePageResourceIdentityFromRoute(
        {
          resourceType: 'PAGE',
          source_resource_id: '12',
          source_resource_key: 'from-query',
          source_resource_scope: 'OWNED',
          source_owner_type: 'SITE',
          source_owner_id: '7',
        },
        {
          resourceKey: 'from-props',
        },
      ),
    ).toEqual({
      resourceId: 12,
      resourceKey: 'from-props',
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
      ownerType: 'SITE',
      ownerId: 7,
    })
  })

  it('classifies page, layout, template, and loop-item resource modes', () => {
    expect(getEditorModeForResource({ resourceType: 'PAGE' })).toBe('content')
    expect(isLayoutPageResource({ resourceType: 'PAGE' })).toBe(false)

    expect(isLayoutPageResource({ resourceType: 'LAYOUT_PAGE_HEADER' })).toBe(true)
    expect(isLayoutPageResource({ resourceType: 'LAYOUT_PAGE_FOOTER' })).toBe(true)
    expect(getEditorModeForResource({ resourceType: 'LAYOUT_PAGE_FOOTER' })).toBe('layout')

    expect(isTemplateResource({ resourceType: 'TEMP_POST_DETAIL' })).toBe(true)
    expect(isTemplateRulesPanelResource({ resourceType: 'TEMP_POST_DETAIL' })).toBe(true)

    expect(isTemplateResource({ resourceType: 'TEMP_LOOP_ITEM' })).toBe(true)
    expect(isLoopItemTemplateResource({ resourceType: 'TEMP_LOOP_ITEM' })).toBe(true)
    expect(isTemplateRulesPanelResource({ resourceType: 'TEMP_LOOP_ITEM' })).toBe(false)
  })

  it('builds editor page route query for page, header, and footer selections', () => {
    const page = makePage({ id: 'page-1', slug: 'about', name: 'About', custom: {} })
    expect(getSelectedEditorPageQuery(page, 'content')).toEqual({ type: 'page', id: 'about' })

    const header = makePage({
      id: 'wb-header',
      name: 'Header',
      custom: { wbLayoutSlot: 'header' },
    })
    expect(getSelectedEditorPageQuery(header, 'layout')).toEqual({
      type: 'navbar',
      id: 'wb-header',
    })

    const footer = makePage({
      id: 'wb-footer',
      name: 'Footer',
      custom: { wbLayoutSlot: 'footer' },
    })
    expect(getSelectedEditorPageQuery(footer, 'layout')).toEqual({
      type: 'footer',
      id: 'wb-footer',
    })
  })

  it('applies canonical source resource query fields and removes aliases', () => {
    const query = {
      resourceId: 'old',
      resource_key: 'old',
      source_resource_type: 'old',
      ownerId: 'old',
      page: 'legacy',
    }

    applySourceResourceQuery(query, {
      resourceId: 5,
      resourceKey: 'home',
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
      ownerType: 'SITE',
      ownerId: 1,
    })

    expect(query).toEqual({
      page: 'legacy',
      sourceResourceId: '5',
      sourceResourceKey: 'home',
      sourceResourceType: 'PAGE',
      sourceOwnerType: 'SITE',
      sourceOwnerId: '1',
      sourceResourceScope: 'OWNED',
    })
  })

  it('builds selected page route query and removes stale page param', () => {
    const page = makePage({ id: 'page-1', slug: 'about', name: 'About', custom: {} })

    expect(
      buildSelectedPageRouteQuery({
        currentQuery: { page: 'old', keep: 'yes' },
        page,
        resource: { resourceKey: 'about', resourceType: 'PAGE' },
        editorMode: 'content',
      }),
    ).toEqual({
      keep: 'yes',
      type: 'page',
      id: 'about',
      sourceResourceKey: 'about',
      sourceResourceType: 'PAGE',
    })
  })

  it('finds route pages while respecting layout-slot routing', () => {
    const content = makePage({ id: 'home', slug: 'home', name: 'Home', custom: {} })
    const header = makePage({
      id: 'wb-header',
      name: 'Header',
      custom: { wbLayoutSlot: 'header' },
    })
    const footer = makePage({
      id: 'wb-footer-2',
      name: 'Footer 2',
      custom: { wbLayoutSlot: 'footer' },
    })
    const editor = { Pages: { getAll: () => [content, header, footer] } }

    expect(findEditorPageByRoute(editor, 'page', 'home')).toBe(content)
    expect(findEditorPageByRoute(editor, 'navbar', 'wb-header')).toBe(header)
    expect(findEditorPageByRoute(editor, 'footer', 'Footer 2')).toBe(footer)
    expect(findEditorPageByRoute(editor, 'navbar', 'wb-header', false)).toBeNull()
  })
})
