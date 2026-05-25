import type { LocationQueryValueRaw } from 'vue-router'
import {
  normalizePageResourceIdentity,
  type PageResourceIdentity
} from '@/api/content/page/resourceIdentity'
import { LAYOUT_PAGE_RESOURCE_TYPES } from '../config/layoutSharedResources'
import {
  LOOP_ITEM_RESOURCE_TYPE,
  isTempTemplateResourceType
} from '../config/templateSharedResources'
import {
  getGrapesPageId,
  getGrapesPageMatchIds,
  getGrapesPageName,
  getGrapesPageRouteId,
  getLayoutPageFallbackName,
  getPageLayoutSlot
} from './layoutSettings'
import { getPageResourceNameFromEditor } from './pageSettings'

export type WebBuilderEditorMode = 'content' | 'layout'
export type PageResourceRouteQuery = Record<
  string,
  LocationQueryValueRaw | LocationQueryValueRaw[]
>
export type PageResourceRouteProps = Partial<PageResourceIdentity>

export interface EditorPageRouteQuery {
  type: 'page' | 'navbar' | 'footer'
  id: string
}

export interface BuildSelectedPageRouteQueryOptions {
  currentQuery: PageResourceRouteQuery
  page: any
  resource: PageResourceIdentity
  editorMode: WebBuilderEditorMode
}

const normalizeResourceType = (resourceType?: string | null) => `${resourceType ?? ''}`.trim()

const layoutPageResourceTypeSet = new Set<string>(Object.values(LAYOUT_PAGE_RESOURCE_TYPES))

export const firstQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return firstQueryValue(value[0])
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export const firstQueryNumber = (value: unknown): number | undefined => {
  const normalized = firstQueryValue(value)
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const resolvePageResourceIdentityFromRoute = (
  query: PageResourceRouteQuery,
  props: PageResourceRouteProps = {}
): PageResourceIdentity =>
  normalizePageResourceIdentity({
    resourceId:
      props.resourceId ??
      firstQueryNumber(query.sourceResourceId) ??
      firstQueryNumber(query.source_resource_id) ??
      firstQueryNumber(query.resourceId) ??
      firstQueryNumber(query.resource_id),
    resourceKey:
      props.resourceKey ||
      firstQueryValue(query.sourceResourceKey) ||
      firstQueryValue(query.source_resource_key) ||
      firstQueryValue(query.resourceKey) ||
      firstQueryValue(query.resource_key),
    resourceType:
      props.resourceType ||
      firstQueryValue(query.sourceResourceType) ||
      firstQueryValue(query.source_resource_type) ||
      firstQueryValue(query.resourceType) ||
      firstQueryValue(query.resource_type),
    resourceScope:
      props.resourceScope ||
      firstQueryValue(query.sourceResourceScope) ||
      firstQueryValue(query.source_resource_scope) ||
      firstQueryValue(query.resourceScope) ||
      firstQueryValue(query.resource_scope),
    ownerType:
      props.ownerType ||
      firstQueryValue(query.sourceOwnerType) ||
      firstQueryValue(query.source_owner_type) ||
      firstQueryValue(query.ownerType) ||
      firstQueryValue(query.owner_type),
    ownerId:
      props.ownerId ??
      firstQueryNumber(query.sourceOwnerId) ??
      firstQueryNumber(query.source_owner_id) ??
      firstQueryNumber(query.ownerId) ??
      firstQueryNumber(query.owner_id)
  })

export const isPageResourceType = (resourceType?: string | null): boolean =>
  normalizeResourceType(resourceType) === 'PAGE'

export const isLayoutPageResourceType = (resourceType?: string | null): boolean =>
  layoutPageResourceTypeSet.has(normalizeResourceType(resourceType))

export const isLoopItemTemplateResourceType = (resourceType?: string | null): boolean =>
  normalizeResourceType(resourceType) === LOOP_ITEM_RESOURCE_TYPE

export const isTemplateResourceType = (resourceType?: string | null): boolean =>
  isTempTemplateResourceType(normalizeResourceType(resourceType))

export const isPageResource = (resource: PageResourceIdentity): boolean =>
  isPageResourceType(resource.resourceType)

export const isLayoutPageResource = (resource: PageResourceIdentity): boolean =>
  isLayoutPageResourceType(resource.resourceType)

export const isTemplateResource = (resource: PageResourceIdentity): boolean =>
  isTemplateResourceType(resource.resourceType)

export const isLoopItemTemplateResource = (resource: PageResourceIdentity): boolean =>
  isLoopItemTemplateResourceType(resource.resourceType)

export const isTemplateRulesPanelResource = (resource: PageResourceIdentity): boolean =>
  isTemplateResource(resource) && !isLoopItemTemplateResource(resource)

export const getEditorModeForResource = (resource: PageResourceIdentity): WebBuilderEditorMode =>
  isLayoutPageResource(resource) ? 'layout' : 'content'

export const toEditorPageList = (pages: any): any[] => {
  if (Array.isArray(pages)) return pages
  if (Array.isArray(pages?.models)) return pages.models
  return []
}

export const findEditorPageByRoute = (
  editor: any,
  routeType: unknown,
  routeId: unknown,
  allowLayoutPage = true
) => {
  const id = `${routeId ?? ''}`.trim()
  if (!id) return null

  const expectedSlot = routeType === 'navbar' ? 'header' : routeType === 'footer' ? 'footer' : null
  if (!allowLayoutPage && expectedSlot) return null

  const pages = toEditorPageList(editor?.Pages?.getAll?.())
  const fallbackName = getLayoutPageFallbackName(id)
  return (
    pages.find((page: any) => {
      if (expectedSlot && getPageLayoutSlot(page) !== expectedSlot) return false
      if (!expectedSlot && getPageLayoutSlot(page)) return false

      const pageIds = [
        ...getGrapesPageMatchIds(page),
        getGrapesPageId(page),
        getGrapesPageRouteId(page),
        page?.get?.('name'),
        page?.name
      ]
        .map((item) => `${item ?? ''}`.trim())
        .filter(Boolean)

      return pageIds.includes(id) || (!!fallbackName && pageIds.includes(fallbackName))
    }) ?? null
  )
}

export const getSelectedEditorPageQuery = (
  page: any,
  editorMode: WebBuilderEditorMode
): EditorPageRouteQuery => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  const layoutSlot = custom?.wbLayoutSlot
  const id = getGrapesPageRouteId(page)

  if (editorMode === 'content') {
    return {
      type: 'page',
      id
    }
  }

  if (layoutSlot === 'header') {
    return { type: 'navbar', id: `${page?.get?.('id') ?? page?.id ?? id}`.trim() }
  }

  if (layoutSlot === 'footer') {
    return { type: 'footer', id: `${page?.get?.('id') ?? page?.id ?? id}`.trim() }
  }

  return {
    type: 'page',
    id
  }
}

const setRouteQueryValue = (
  query: PageResourceRouteQuery,
  key: string,
  value?: string | number
) => {
  if (value === undefined || value === null || value === '') {
    delete query[key]
    return
  }
  query[key] = String(value)
}

export const applySourceResourceQuery = (
  query: PageResourceRouteQuery,
  resource: PageResourceIdentity
) => {
  const normalized = normalizePageResourceIdentity(resource)

  delete query.source_resource_id
  delete query.resourceId
  delete query.resource_id
  delete query.source_resource_key
  delete query.resourceKey
  delete query.resource_key
  delete query.source_resource_type
  delete query.resourceType
  delete query.resource_type
  delete query.source_owner_type
  delete query.ownerType
  delete query.owner_type
  delete query.source_owner_id
  delete query.ownerId
  delete query.owner_id
  delete query.source_resource_scope
  delete query.resourceScope
  delete query.resource_scope

  setRouteQueryValue(query, 'sourceResourceId', normalized.resourceId)
  setRouteQueryValue(query, 'sourceResourceKey', normalized.resourceKey)
  setRouteQueryValue(query, 'sourceResourceType', normalized.resourceType)
  setRouteQueryValue(query, 'sourceOwnerType', normalized.ownerType)
  setRouteQueryValue(query, 'sourceOwnerId', normalized.ownerId)
  setRouteQueryValue(query, 'sourceResourceScope', normalized.resourceScope)
}

export const buildSelectedPageRouteQuery = ({
  currentQuery,
  page,
  resource,
  editorMode
}: BuildSelectedPageRouteQueryOptions): PageResourceRouteQuery | null => {
  if (!page) return null

  const editorPageQuery = getSelectedEditorPageQuery(page, editorMode)
  if (!editorPageQuery.id) return null

  const nextQuery: PageResourceRouteQuery = {
    ...currentQuery,
    type: editorPageQuery.type,
    id: editorPageQuery.id
  }

  applySourceResourceQuery(nextQuery, resource)
  delete nextQuery.page

  return nextQuery
}

export const isSelectedPageRouteQueryCurrent = (
  currentQuery: PageResourceRouteQuery,
  nextQuery: PageResourceRouteQuery
): boolean =>
  firstQueryValue(currentQuery.type) === firstQueryValue(nextQuery.type) &&
  firstQueryValue(currentQuery.id) === firstQueryValue(nextQuery.id) &&
  firstQueryValue(currentQuery.sourceResourceId) === firstQueryValue(nextQuery.sourceResourceId) &&
  firstQueryValue(currentQuery.sourceResourceKey) ===
    firstQueryValue(nextQuery.sourceResourceKey) &&
  firstQueryValue(currentQuery.sourceResourceType) ===
    firstQueryValue(nextQuery.sourceResourceType) &&
  firstQueryValue(currentQuery.sourceOwnerType) === firstQueryValue(nextQuery.sourceOwnerType) &&
  firstQueryValue(currentQuery.sourceOwnerId) === firstQueryValue(nextQuery.sourceOwnerId) &&
  firstQueryValue(currentQuery.sourceResourceScope) ===
    firstQueryValue(nextQuery.sourceResourceScope) &&
  !currentQuery.page

export const getWebBuilderResourceNameFromEditor = (
  editor: any,
  resource: PageResourceIdentity
): string | undefined => {
  if (isPageResource(resource) || isTemplateResource(resource)) {
    return getPageResourceNameFromEditor(editor)
  }

  if (isLayoutPageResource(resource)) {
    const pages = toEditorPageList(editor?.Pages?.getAll?.())
    const page = pages.find((item: any) => !!getPageLayoutSlot(item)) ?? pages[0]
    const name = getGrapesPageName(page).trim()
    return name || undefined
  }

  return undefined
}
