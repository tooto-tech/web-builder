import { computed, reactive, ref, type Ref } from 'vue'
import { useHeartbeatTimer } from './useHeartbeatTimer'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import {
  getDraft,
  getPagePage,
  publishVersion,
  saveDraft,
  type PagePublishReqVO,
  type PageResourceIdentity,
  type PageVO,
  type PageSaveReqVO,
} from '@/api/content/page'
import { useLockableResource, type ResourceLockState } from './useLockableResource'
import useLayoutSettings from './useLayoutSettings'
import {
  createDefaultLayoutRulesPayload,
  LAYOUT_PAGE_RESOURCE_SCOPE,
  LAYOUT_PAGE_RESOURCE_TYPES,
  LAYOUT_RULES_RESOURCE_TYPE,
  LAYOUT_RULES_RESOURCE_SCOPE,
  normalizeLayoutRulesPayload,
} from '../config/layoutSharedResources'
import {
  buildLayoutPageProjectData,
  buildPageOnlyProjectData,
  buildSinglePageProjectData,
  extractLegacyLayoutBundle,
  mergeLayoutBundleProjectData,
} from '../utils/layoutProjectData'
import {
  getGrapesPageId,
  getPageLayoutSlot,
  layoutTargetMatchesPage,
  type LayoutRule,
  type LayoutSlotKey,
  type WebBuilderLayoutSettings,
} from '../utils/layoutSettings'
import type { EditSession } from './useEditSession'

const LIST_PAGE_SIZE = 200

type EditorMode = 'content' | 'layout'

export interface UseLayoutBundleManagerOptions {
  session?: Ref<EditSession | null>
  getSessionKey?: () => string
  getPageResource?: () => PageResourceIdentity
  getEditorMode?: () => EditorMode
}

const stringifyPayload = (value: unknown): string => JSON.stringify(value ?? null)

const normalizeProjectData = (schemaJson?: string | null): Record<string, any> | null => {
  const source = `${schemaJson ?? ''}`.trim()
  if (!source || source === '{}' || source === 'null') return null
  try {
    const parsed = JSON.parse(source)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const getLayoutPageIdFromResourceKey = (resourceKey?: string | null): string => {
  const normalized = `${resourceKey ?? ''}`.trim()
  const match = /^layout\.(?:header|footer)\.(.+)$/.exec(normalized)
  return match?.[1]?.trim() || ''
}

const isLayoutRulesPayloadEmpty = (
  payload: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null | undefined,
) => {
  const normalized = normalizeLayoutRulesPayload(payload)
  return normalized.header.rules.length === 0 && normalized.footer.rules.length === 0
}

const getLayoutRuleOwnerResource = (resource?: PageResourceIdentity | null): PageResourceIdentity => {
  const ownerType = `${resource?.resourceType ?? ''}`.trim()
  const ownerId = resource?.resourceId
  return {
    resourceType: LAYOUT_RULES_RESOURCE_TYPE,
    resourceScope: LAYOUT_RULES_RESOURCE_SCOPE,
    ...(ownerType ? { ownerType } : {}),
    ...(ownerId !== undefined ? { ownerId } : {}),
  }
}

const getLayoutSlotByResourceType = (resourceType?: string | null): LayoutSlotKey | null => {
  if (resourceType === LAYOUT_PAGE_RESOURCE_TYPES.header) return 'header'
  if (resourceType === LAYOUT_PAGE_RESOURCE_TYPES.footer) return 'footer'
  return null
}

const buildCurrentLayoutRulesPayload = (
  slotKey: LayoutSlotKey,
  rules: LayoutRule[],
): WebBuilderLayoutSettings => {
  const payload = createDefaultLayoutRulesPayload()
  payload[slotKey].rules = rules
  return payload
}

const buildLegacyPayloadForLayoutPage = (
  page: any,
  settings: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null | undefined,
): WebBuilderLayoutSettings => {
  const slotKey = getPageLayoutSlot(page)
  if (!slotKey) return createDefaultLayoutRulesPayload()
  const source = normalizeLayoutRulesPayload(settings)
  return buildCurrentLayoutRulesPayload(
    slotKey,
    source[slotKey].rules.filter((rule) => layoutTargetMatchesPage(rule.layoutId, page)),
  )
}

const enrichRulesForRuntime = (
  rules: LayoutRule[],
  sourcePage: PageVO | null,
): LayoutRule[] => {
  const sourceUpdatedAt = `${sourcePage?.updateTime ?? sourcePage?.createTime ?? ''}`.trim()
  const sourceResourceId = sourcePage?.resourceId
  return rules.map((rule) => ({
    ...rule,
    ...(sourceUpdatedAt ? { sourceUpdatedAt } : {}),
    ...(sourceResourceId !== undefined ? { sourceResourceId } : {}),
  }))
}

const stripRuntimeRuleMeta = (
  payload: WebBuilderLayoutSettings | Partial<WebBuilderLayoutSettings> | null | undefined,
): WebBuilderLayoutSettings => {
  const normalized = normalizeLayoutRulesPayload(payload)
  const cleanRule = (rule: LayoutRule): LayoutRule => ({
    id: rule.id,
    name: rule.name,
    layoutId: rule.layoutId,
    matchMode: rule.matchMode,
    pageIds: [...rule.pageIds],
    enabled: rule.enabled,
    priority: rule.priority,
  })
  return {
    version: 1,
    header: {
      defaultLayoutId: normalized.header.defaultLayoutId,
      rules: normalized.header.rules.map(cleanRule),
    },
    footer: {
      defaultLayoutId: normalized.footer.defaultLayoutId,
      rules: normalized.footer.rules.map(cleanRule),
    },
  }
}

export default function useLayoutBundleManager(options: UseLayoutBundleManagerOptions = {}) {
  const layoutSettingsStore = useLayoutSettings()

  const isHydrating = ref(false)
  const hasLoaded = ref(false)
  const currentResourceBaseline = ref('')
  const rulesMeta = reactive({
    resourceId: undefined as number | undefined,
    baseUpdateTime: undefined as Date | string | undefined,
    lastSavedSerialized: stringifyPayload(createDefaultLayoutRulesPayload()),
    lastLoadedSerialized: stringifyPayload(createDefaultLayoutRulesPayload()),
    lastPublishedSerialized: null as string | null,
  })
  const currentMode = () => options.getEditorMode?.() || 'content'
  const currentLayoutSlot = () => getLayoutSlotByResourceType(options.getPageResource?.()?.resourceType)
  const resolveSessionKey = () => options.session?.value?.sessionKey || options.getSessionKey?.() || ''

  const getRulesResource = (): PageResourceIdentity => ({
    resourceId: rulesMeta.resourceId,
    ...getLayoutRuleOwnerResource(options.getPageResource?.()),
  })

  const rulesLock = useLockableResource({
    resourceName: '布局规则',
    getResource: getRulesResource,
    getSessionKey: resolveSessionKey,
  })

  const { start: startHeartbeat, stop: stopHeartbeat } = useHeartbeatTimer({
    beatFn: () => rulesLock.heartbeat(),
  })

  const currentRulesSerialized = () => {
    const slotKey = currentLayoutSlot()
    if (!slotKey) {
      return stringifyPayload(createDefaultLayoutRulesPayload())
    }
    return stringifyPayload(
      buildCurrentLayoutRulesPayload(
        slotKey,
        stripRuntimeRuleMeta(layoutSettingsStore.exportSettings())[slotKey].rules,
      ),
    )
  }

  const buildCurrentResourceProjectData = (
    projectData: Record<string, any> | null | undefined,
  ): Record<string, any> => {
    if (currentMode() !== 'layout') {
      return buildPageOnlyProjectData(projectData)
    }

    const resource = options.getPageResource?.()
    const expectedPageId = getLayoutPageIdFromResourceKey(resource?.resourceKey)
    const pages = Array.isArray(projectData?.pages) ? projectData.pages : []
    const targetPage =
      pages.find((page) => getGrapesPageId(page) === expectedPageId)
      || pages.find((page) => !!getPageLayoutSlot(page))
      || pages[0]

    if (!targetPage) {
      return {
        assets: [],
        styles: [],
        pages: [],
      }
    }

    return (
      buildLayoutPageProjectData(projectData, getGrapesPageId(targetPage))
      || {
        assets: [],
        styles: [],
        pages: [targetPage],
      }
    )
  }

  const updateCurrentResourceBaseline = (projectData: Record<string, any> | null | undefined) => {
    currentResourceBaseline.value = stringifyPayload(buildCurrentResourceProjectData(projectData))
  }

  const hasCurrentResourceChanges = (projectData: Record<string, any> | null | undefined) =>
    stringifyPayload(buildCurrentResourceProjectData(projectData)) !== currentResourceBaseline.value

  const hasPendingChanges = computed(() => {
    if (!hasLoaded.value || isHydrating.value) return false
    if (currentMode() !== 'layout') return false
    return currentRulesSerialized() !== rulesMeta.lastSavedSerialized
  })

  const hasUnsavedUserChanges = computed(() => {
    if (!hasLoaded.value || isHydrating.value) return false
    if (currentMode() !== 'layout') return false
    return currentRulesSerialized() !== rulesMeta.lastLoadedSerialized
  })

  const hasPendingPublish = computed(() => {
    if (!hasLoaded.value || isHydrating.value) return false
    if (currentMode() !== 'layout') return false
    if (rulesMeta.resourceId === undefined) return false
    const serialized = currentRulesSerialized()
    return rulesMeta.lastPublishedSerialized === null
      ? true
      : serialized !== rulesMeta.lastPublishedSerialized
  })

  const getRulesLockState = (): ResourceLockState => rulesLock.getState()

  async function queryLayoutDraftRows(resourceType: string) {
    const page = await getPagePage({
      pageNo: 1,
      pageSize: LIST_PAGE_SIZE,
      status: 'draft',
      resourceType,
      resourceScope: LAYOUT_PAGE_RESOURCE_SCOPE,
    })
    return page.list || []
  }

  async function loadOwnedLayoutRulesDraft(resource: PageResourceIdentity | null | undefined) {
    const locator = getLayoutRuleOwnerResource(resource)
    if (!locator.ownerType || locator.ownerId === undefined) {
      return {
        draft: null as PageVO | null,
        payload: createDefaultLayoutRulesPayload(),
      }
    }
    try {
      const draft = await getDraft(locator)
      return {
        draft,
        payload: normalizeLayoutRulesPayload(normalizeProjectData(draft.schemaJson)),
      }
    } catch (error) {
      return {
        draft: null as PageVO | null,
        payload: createDefaultLayoutRulesPayload(),
      }
    }
  }

  const setRulesBaseline = (savedPayload: unknown, loadedPayload: unknown = savedPayload) => {
    rulesMeta.lastSavedSerialized = stringifyPayload(savedPayload)
    rulesMeta.lastLoadedSerialized = stringifyPayload(loadedPayload)
  }

  const ensureRulesEditable = (silent = false) => rulesLock.ensureEditable(silent)

  async function loadRules(projectData: Record<string, any> | null) {
    if (currentMode() !== 'layout') {
      rulesMeta.resourceId = undefined
      rulesMeta.baseUpdateTime = undefined
      rulesMeta.lastPublishedSerialized = null
      rulesLock.reset()
      layoutSettingsStore.hydrate(createDefaultLayoutRulesPayload())
      setRulesBaseline(createDefaultLayoutRulesPayload())
      return
    }

    const legacyBundle = extractLegacyLayoutBundle(projectData)
    const rulesDraftResult = await loadOwnedLayoutRulesDraft(options.getPageResource?.())
    rulesMeta.resourceId = rulesDraftResult.draft?.resourceId
    rulesMeta.baseUpdateTime = rulesDraftResult.draft?.updateTime
    rulesMeta.lastPublishedSerialized = null
    rulesLock.reset()

    const persistedRulesPayload = rulesDraftResult.payload
    const slotKey = currentLayoutSlot()
    const currentProjectPage =
      buildCurrentResourceProjectData(projectData)?.pages?.[0]
      || extractLegacyLayoutBundle(projectData).layoutPages.find((page) => !!getPageLayoutSlot(page))
      || null
    const legacyRulesPayload =
      slotKey && currentProjectPage
        ? buildLegacyPayloadForLayoutPage(currentProjectPage, legacyBundle.layoutSettings)
        : createDefaultLayoutRulesPayload()
    const nextRulesPayload =
      isLayoutRulesPayloadEmpty(persistedRulesPayload) && !isLayoutRulesPayloadEmpty(legacyRulesPayload)
        ? legacyRulesPayload
        : persistedRulesPayload

    layoutSettingsStore.hydrate(nextRulesPayload)
    setRulesBaseline(
      isLayoutRulesPayloadEmpty(persistedRulesPayload) && !isLayoutRulesPayloadEmpty(legacyRulesPayload)
        ? createDefaultLayoutRulesPayload()
        : stripRuntimeRuleMeta(persistedRulesPayload),
      stripRuntimeRuleMeta(nextRulesPayload),
    )
  }

  async function loadContentModeLayoutDrafts(projectData: Record<string, any> | null) {
    const legacyBundle = extractLegacyLayoutBundle(projectData)
    const legacyPageMap = legacyBundle.layoutPages.reduce<Record<string, Record<string, any>>>((acc, page) => {
      const pageId = getGrapesPageId(page)
      if (pageId) acc[pageId] = page
      return acc
    }, {})

    const fetchedProjectDataList: Record<string, any>[] = []
    const aggregatedRules = createDefaultLayoutRulesPayload()

    for (const slotKey of ['header', 'footer'] as LayoutSlotKey[]) {
      const draftRows = await queryLayoutDraftRows(LAYOUT_PAGE_RESOURCE_TYPES[slotKey])
      for (const row of draftRows) {
        const draft = await getDraft({
          resourceId: row.resourceId,
          resourceKey: row.resourceKey,
          resourceType: row.resourceType,
          resourceScope: row.resourceScope,
        })
        const parsed = normalizeProjectData(draft.schemaJson)
        const parsedPage = parsed?.pages?.[0]
        const fallbackPage = draft.resourceKey
          ? legacyPageMap[draft.resourceKey.split('.').pop() || '']
          : null
        const targetPage = parsedPage || fallbackPage
        if (!targetPage) continue
        const layoutPageId = getGrapesPageId(targetPage)
        if (!layoutPageId) continue
        fetchedProjectDataList.push(parsed || buildSinglePageProjectData(legacyBundle.pageProjectData, targetPage))
        delete legacyPageMap[layoutPageId]

        const rulesDraftResult = await loadOwnedLayoutRulesDraft({
          resourceId: draft.resourceId,
          resourceKey: draft.resourceKey,
          resourceType: draft.resourceType,
          resourceScope: draft.resourceScope,
        })
        const legacyRulesPayload = buildLegacyPayloadForLayoutPage(targetPage, legacyBundle.layoutSettings)
        const pageRulesPayload =
          isLayoutRulesPayloadEmpty(rulesDraftResult.payload) && !isLayoutRulesPayloadEmpty(legacyRulesPayload)
            ? legacyRulesPayload
            : rulesDraftResult.payload
        aggregatedRules[slotKey].rules.push(
          ...enrichRulesForRuntime(
            pageRulesPayload[slotKey].rules.filter((rule) => layoutTargetMatchesPage(rule.layoutId, targetPage)),
            rulesDraftResult.draft,
          ),
        )
      }
    }

    Object.values(legacyPageMap).forEach((page) => {
      if (!getPageLayoutSlot(page)) return
      fetchedProjectDataList.push(buildSinglePageProjectData(legacyBundle.pageProjectData, page))
      const slotKey = getPageLayoutSlot(page)
      if (!slotKey) return
      aggregatedRules[slotKey].rules.push(
        ...buildLegacyPayloadForLayoutPage(page, legacyBundle.layoutSettings)[slotKey].rules,
      )
    })

    layoutSettingsStore.hydrate(aggregatedRules)
    setRulesBaseline(createDefaultLayoutRulesPayload())
    return mergeLayoutBundleProjectData(legacyBundle.pageProjectData, fetchedProjectDataList)
  }

  async function loadLayoutDrafts(projectData: Record<string, any> | null) {
    isHydrating.value = true
    hasLoaded.value = false
    try {
      await loadRules(projectData)
      const nextProjectData =
        currentMode() === 'layout'
          ? buildCurrentResourceProjectData(projectData)
          : await loadContentModeLayoutDrafts(projectData)
      updateCurrentResourceBaseline(nextProjectData)
      hasLoaded.value = true
      return nextProjectData
    } finally {
      isHydrating.value = false
    }
  }

  async function saveLayoutResources(_editor: any, silent = false) {
    if (currentMode() !== 'layout') {
      return {
        success: true,
        hasConflict: false,
        hasFailure: false,
        failedResources: [] as string[],
      }
    }

    const slotKey = currentLayoutSlot()
    const currentRules = slotKey
      ? buildCurrentLayoutRulesPayload(
          slotKey,
          stripRuntimeRuleMeta(layoutSettingsStore.exportSettings())[slotKey].rules,
        )
      : createDefaultLayoutRulesPayload()
    const serialized = stringifyPayload(currentRules)
    if (serialized === rulesMeta.lastSavedSerialized) {
      return {
        success: true,
        hasConflict: false,
        hasFailure: false,
        failedResources: [] as string[],
      }
    }

    const editable = await ensureRulesEditable(true)
    if (!editable) {
      if (!silent) ElMessage.warning(rulesLock.getState().message || '布局规则当前不可编辑')
      return {
        success: false,
        hasConflict: true,
        hasFailure: true,
        failedResources: ['布局规则'],
      }
    }

    const request: PageSaveReqVO = {
      ...getRulesResource(),
      resourceName: '布局规则',
      schemaJson: serialized,
      baseUpdateTime: rulesMeta.baseUpdateTime,
      sessionKey: resolveSessionKey(),
    }

    const saveResult = await rulesLock.save(() => saveDraft(request), {
      silent,
      onSuccess: (saved) => {
        rulesMeta.resourceId = saved.resourceId
        rulesMeta.baseUpdateTime = saved.updateTime
        rulesMeta.lastSavedSerialized = serialized
        rulesMeta.lastLoadedSerialized = serialized
      },
    })

    if (saveResult.success) {
      return {
        success: true,
        hasConflict: false,
        hasFailure: false,
        failedResources: [] as string[],
      }
    }

    return {
      success: false,
      hasConflict: saveResult.hasConflict,
      hasFailure: true,
      failedResources: ['布局规则'],
    }
  }

  async function publishLayoutRules(silent = false) {
    if (currentMode() !== 'layout' || !hasPendingPublish.value) {
      return {
        success: true,
        hasConflict: false,
        hasFailure: false,
        failedResources: [] as string[],
      }
    }

    const editable = await ensureRulesEditable(true)
    if (!editable) {
      if (!silent) ElMessage.warning(rulesLock.getState().message || '布局规则当前不可编辑')
      return {
        success: false,
        hasConflict: true,
        hasFailure: true,
        failedResources: ['布局规则'],
      }
    }

    const serialized = currentRulesSerialized()
    const request: PagePublishReqVO = {
      ...getRulesResource(),
      resourceName: '布局规则',
      schemaJson: serialized,
      baseUpdateTime: rulesMeta.baseUpdateTime,
      sessionKey: resolveSessionKey(),
    }

    const publishResult = await rulesLock.publish(
      async () => {
        await publishVersion(request)
        return getDraft(getRulesResource())
      },
      {
        silent,
        onSuccess: (latestDraft) => {
          rulesMeta.resourceId = latestDraft.resourceId
          rulesMeta.baseUpdateTime = latestDraft.updateTime
          rulesMeta.lastSavedSerialized = serialized
          rulesMeta.lastLoadedSerialized = serialized
          rulesMeta.lastPublishedSerialized = serialized
        },
      },
    )

    if (publishResult.success) {
      return {
        success: true,
        hasConflict: false,
        hasFailure: false,
        failedResources: [] as string[],
      }
    }

    return {
      success: false,
      hasConflict: publishResult.hasConflict,
      hasFailure: true,
      failedResources: ['布局规则'],
    }
  }

  async function releaseAllLocks() {
    await rulesLock.release()
  }

  function releaseAllLocksKeepalive() {
    rulesLock.releaseKeepalive()
  }

  const startTimers = () => startHeartbeat()

  const stopTimers = () => stopHeartbeat()

  return {
    hasLoaded,
    isHydrating,
    hasPendingChanges,
    hasUnsavedUserChanges,
    getRulesLockState,
    ensureRulesEditable,
    loadLayoutDrafts,
    saveLayoutResources,
    publishLayoutRules,
    buildCurrentResourceProjectData,
    updateCurrentResourceBaseline,
    hasCurrentResourceChanges,
    startTimers,
    stopTimers,
    releaseAllLocks,
    releaseAllLocksKeepalive,
  }
}
