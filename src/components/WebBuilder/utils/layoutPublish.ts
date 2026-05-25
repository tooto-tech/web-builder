import {
  getGrapesPageId,
  getGrapesPageMatchIds,
  getLayoutPageAliases,
  getLayoutTargetAliases,
  getPageLayoutSlot,
  isLayoutPage,
  resolveLayoutIdForPage as resolveLayoutIdFromSlot,
  type LayoutSlotKey,
  type LayoutTarget,
  type WebBuilderLayoutSettings,
} from './layoutSettings'
import { getUsedComponentCssRules } from './editorHelpers'

export interface LayoutRenderArtifact {
  html: string
  css: string
  js: string
}

interface LayoutPublishItem {
  id: string
  slot: LayoutSlotKey
  page: any
  aliases: string[]
}

export interface ResolvedPageLayouts {
  header: LayoutRenderArtifact | null
  footer: LayoutRenderArtifact | null
}

const layoutRenderCache = new Map<string, LayoutRenderArtifact | null>()

const normalizeLayoutId = (layoutId: LayoutTarget): string => `${layoutId ?? ''}`.trim()

const toPageList = (pages: any): any[] => {
  if (Array.isArray(pages)) return pages
  if (Array.isArray(pages?.models)) return pages.models
  return []
}

const layoutIdMatchesItem = (layoutId: LayoutTarget, item: LayoutPublishItem): boolean => {
  return getLayoutTargetAliases(layoutId).some((alias) => item.aliases.includes(alias))
}

const getRulesForLayoutItem = (
  settings: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null | undefined,
  slot: LayoutSlotKey,
  item: LayoutPublishItem,
) => {
  return (settings?.[slot]?.rules ?? []).filter((rule: any) => layoutIdMatchesItem(rule?.layoutId, item))
}

const getRuleSourceUpdatedAt = (rule: any): number => {
  const value = `${rule?.sourceUpdatedAt ?? ''}`.trim()
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

export const resetLayoutPublishCache = () => {
  layoutRenderCache.clear()
}

export const resolveLayoutIdForPage = (
  settings: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null | undefined,
  pageId: string | string[],
  slot: LayoutSlotKey,
  availableLayoutIds: LayoutTarget[] = [],
): LayoutTarget => {
  const slotSettings = settings?.[slot] ?? null
  return resolveLayoutIdFromSlot(slotSettings as any, pageId, availableLayoutIds)
}

export const getPublishPages = (editor: any): any[] => {
  const pageList = toPageList(editor?.Pages?.getAll?.())
  return pageList.filter((page: any) => !isLayoutPage(page))
}

export const getLayoutPageById = (editor: any, layoutId: LayoutTarget): any | null => {
  const targetId = normalizeLayoutId(layoutId)
  if (!targetId) return null

  const pageList = toPageList(editor?.Pages?.getAll?.())
  return pageList.find((page: any) => {
    return getLayoutTargetAliases(targetId).some((alias) => getLayoutPageAliases(page).includes(alias))
  }) ?? null
}

export const getLayoutPageIds = (editor: any, slot: LayoutSlotKey): LayoutTarget[] => {
  const pageList = toPageList(editor?.Pages?.getAll?.())
  return pageList
    .filter((page: any) => getPageLayoutSlot(page) === slot)
    .map((page: any) => getGrapesPageId(page))
    .filter((layoutId: string) => !!layoutId)
}

const getLayoutArtifactFromPage = (
  editor: any,
  page: any,
  cacheId: string,
): LayoutRenderArtifact | null => {
  const targetId = normalizeLayoutId(cacheId)
  if (!targetId) return null

  if (layoutRenderCache.has(targetId)) {
    return layoutRenderCache.get(targetId) ?? null
  }

  if (!page) {
    console.warn(`[WebBuilder] 找不到布局页面 ${targetId}，已跳过`)
    layoutRenderCache.set(targetId, null)
    return null
  }

  try {
    const component = page?.getMainComponent?.()
    const exportedHtml = component ? (editor.getHtml?.({ component }) || '') : ''
    const fallbackHtml =
      !exportedHtml && typeof component?.toHTML === 'function'
        ? (component.toHTML() || '')
        : ''
    const artifact = {
      html: exportedHtml || fallbackHtml,
      css: component
        ? (editor.getCss?.({ component, rules: getUsedComponentCssRules(editor, component) }) || '')
        : '',
      js: component ? (editor.getJs?.({ component }) || '') : '',
    }

    layoutRenderCache.set(targetId, artifact)
    return artifact
  } catch (error) {
    console.warn(`[WebBuilder] 布局页面 ${targetId} 导出失败，已跳过:`, error)
    layoutRenderCache.set(targetId, null)
    return null
  }
}

export const getLayoutArtifactFromEditor = (
  editor: any,
  layoutId: LayoutTarget,
): LayoutRenderArtifact | null => {
  const targetId = normalizeLayoutId(layoutId)
  if (!targetId) return null
  return getLayoutArtifactFromPage(editor, getLayoutPageById(editor, targetId), targetId)
}

export const createLayoutPublishContext = (
  editor: any,
  settings: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null | undefined,
) => {
  const pageList = toPageList(editor?.Pages?.getAll?.())
  const layoutItems: Record<LayoutSlotKey, LayoutPublishItem[]> = {
    header: [],
    footer: [],
  }

  pageList.forEach((page: any) => {
    const slot = getPageLayoutSlot(page)
    if (!slot) return
    const aliases = getLayoutPageAliases(page)
    const id = aliases[0] || getGrapesPageId(page)
    if (!id) return
    layoutItems[slot].push({
      id,
      slot,
      page,
      aliases,
    })
  })

  const findItemByLayoutId = (slot: LayoutSlotKey, layoutId: LayoutTarget) => {
    return layoutItems[slot].find((item) => layoutIdMatchesItem(layoutId, item)) ?? null
  }

  const resolveItemForPage = (page: any, slot: LayoutSlotKey): LayoutPublishItem | null => {
    const items = layoutItems[slot]
    if (items.length === 0) return null

    const pageIds = getGrapesPageMatchIds(page)
    const rules = [...(settings?.[slot]?.rules ?? [])]
      .filter((rule: any) => rule?.enabled !== false)
      .sort((a: any, b: any) => {
        const priorityA = typeof a?.priority === 'number' && Number.isFinite(a.priority) ? a.priority : 0
        const priorityB = typeof b?.priority === 'number' && Number.isFinite(b.priority) ? b.priority : 0
        if (priorityA !== priorityB) return priorityB - priorityA

        const updatedAtDiff = getRuleSourceUpdatedAt(b) - getRuleSourceUpdatedAt(a)
        if (updatedAtDiff !== 0) return updatedAtDiff

        const resourceIdA =
          typeof a?.sourceResourceId === 'number' && Number.isFinite(a.sourceResourceId)
            ? a.sourceResourceId
            : 0
        const resourceIdB =
          typeof b?.sourceResourceId === 'number' && Number.isFinite(b.sourceResourceId)
            ? b.sourceResourceId
            : 0
        if (resourceIdA !== resourceIdB) return resourceIdB - resourceIdA

        return `${a?.id ?? ''}`.localeCompare(`${b?.id ?? ''}`)
      })

    for (const rule of rules) {
      const normalizedLayoutId = normalizeLayoutId(rule?.layoutId)
      // Ignore invalid "exclude + no layout" rules to avoid disabling almost every page unexpectedly.
      if (!normalizedLayoutId && rule?.matchMode === 'exclude') continue

      const target = normalizedLayoutId ? findItemByLayoutId(slot, rule.layoutId) : null
      if (normalizedLayoutId && !target) continue

      const rulePageIds = Array.isArray(rule?.pageIds)
        ? rule.pageIds.map((item: any) => `${item ?? ''}`.trim()).filter(Boolean)
        : []
      const hasMatchedPage = pageIds.some((pageId) => rulePageIds.includes(pageId))
      const matched = rule?.matchMode === 'exclude' ? !hasMatchedPage : hasMatchedPage

      if (matched) return target
    }

    return null
  }

  const getArtifact = (item: LayoutPublishItem | null) => {
    return item ? getLayoutArtifactFromPage(editor, item.page, item.id) : null
  }

  return {
    getLayoutItems: (slot: LayoutSlotKey) => layoutItems[slot],
    resolve: (page: any): ResolvedPageLayouts => ({
      header: getArtifact(resolveItemForPage(page, 'header')),
      footer: getArtifact(resolveItemForPage(page, 'footer')),
    }),
  }
}
