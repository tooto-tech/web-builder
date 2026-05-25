import { computed, ref } from 'vue'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import { useHeartbeatTimer } from './useHeartbeatTimer'
import {
  getDraft,
  publishVersion,
  saveDraft,
  type PagePublishReqVO,
  type PageResourceIdentity,
  type PageSaveReqVO,
} from '@/api/content/page'
import { useLockableResource, type ResourceLockState } from './useLockableResource'
import {
  LOOP_ITEM_RESOURCE_TYPE,
  TEMP_RULES_RESOURCE_TYPE,
  TEMP_RULES_RESOURCE_SCOPE,
  isTempTemplateResourceType,
  type TempTemplateResourceType,
} from '../config/templateSharedResources'
import {
  cloneTemplateRulesPayload,
  createDefaultTemplateRulesPayload,
  getTemplateRulesForType,
  normalizeTemplateRulesPayload,
  setTemplateRulesForType,
  type TemplateRule,
  type WebBuilderTemplateRules,
} from '../utils/templateRules'

export interface UseTemplateRulesManagerOptions {
  getSessionKey?: () => string
  getPageResource?: () => PageResourceIdentity
}

const stringifyPayload = (value: unknown): string => JSON.stringify(value ?? null)

export default function useTemplateRulesManager(options: UseTemplateRulesManagerOptions = {}) {
  const payload = ref<WebBuilderTemplateRules>(createDefaultTemplateRulesPayload())
  const hasLoaded = ref(false)
  const isHydrating = ref(false)
  const rulesMeta = ref({
    resourceId: undefined as number | undefined,
    baseUpdateTime: undefined as Date | string | undefined,
    lastSavedSerialized: stringifyPayload(createDefaultTemplateRulesPayload()),
    /**
     * Last payload we know is materialised as a TEMP_RULES *release*. We start
     * with `null` (= unknown) so the very first publish always pushes a
     * release, ensuring downstream renderers see the latest rules even if the
     * page-level publish carried no further rule edits.
     */
    lastPublishedSerialized: null as string | null,
  })
  const currentTemplateType = computed<TempTemplateResourceType | null>(() => {
    const resourceType = options.getPageResource?.()?.resourceType
    if (resourceType === LOOP_ITEM_RESOURCE_TYPE) return null
    return isTempTemplateResourceType(resourceType) ? resourceType : null
  })

  const isTemplateEditor = computed(() => currentTemplateType.value !== null)

  const getRulesResource = (): PageResourceIdentity => {
    const pageResource = options.getPageResource?.()
    const ownerType = `${pageResource?.resourceType ?? ''}`.trim()
    const ownerId = pageResource?.resourceId
    return {
      resourceId: rulesMeta.value.resourceId,
      resourceType: TEMP_RULES_RESOURCE_TYPE,
      resourceScope: TEMP_RULES_RESOURCE_SCOPE,
      ...(ownerType ? { ownerType } : {}),
      ...(ownerId !== undefined ? { ownerId } : {}),
    }
  }

  const rulesLock = useLockableResource({
    resourceName: '模板规则',
    getResource: getRulesResource,
    getSessionKey: () => options.getSessionKey?.() || '',
  })

  const currentRules = computed<TemplateRule[]>(() => {
    const templateType = currentTemplateType.value
    if (!templateType) return []

    return getTemplateRulesForType(payload.value, templateType)
      .slice()
      .sort((left, right) => {
        const priorityDiff = Number(right.priority || 0) - Number(left.priority || 0)
        if (priorityDiff !== 0) return priorityDiff
        return `${left.id}`.localeCompare(`${right.id}`)
      })
  })

  const hasPendingChanges = computed(() => {
    if (!isTemplateEditor.value || !hasLoaded.value || isHydrating.value) return false
    return stringifyPayload(payload.value) !== rulesMeta.value.lastSavedSerialized
  })

  const hasPendingPublish = computed(() => {
    if (!isTemplateEditor.value || !hasLoaded.value || isHydrating.value) return false
    if (rulesMeta.value.resourceId === undefined) return false
    const serialized = stringifyPayload(payload.value)
    if (rulesMeta.value.lastPublishedSerialized === null) {
      // First publish in this session — push to make sure backend release reflects current draft.
      return true
    }
    return serialized !== rulesMeta.value.lastPublishedSerialized
  })

  const getRulesLockState = (): ResourceLockState => rulesLock.getState()

  const mutatePayload = (
    mutator: (nextPayload: WebBuilderTemplateRules, templateType: TempTemplateResourceType) => void,
  ) => {
    const templateType = currentTemplateType.value
    if (!templateType) return
    const nextPayload = cloneTemplateRulesPayload(payload.value)
    mutator(nextPayload, templateType)
    payload.value = nextPayload
  }

  const addRule = async () => {
    const templateType = currentTemplateType.value
    const resource = options.getPageResource?.()
    if (!templateType || !resource) return
    if (!(await ensureRulesEditable())) return

    mutatePayload((nextPayload) => {
      const current = getTemplateRulesForType(nextPayload, templateType).slice()
      const maxPriority = current.reduce((max, rule) => Math.max(max, Number(rule.priority || 0)), 0)
      current.push({
        id: `temp-rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: `规则 ${current.length + 1}`,
        templateType,
        ...(resource.resourceId !== undefined ? { templateResourceId: Number(resource.resourceId) } : {}),
        ...(resource.resourceKey ? { templateResourceKey: resource.resourceKey } : {}),
        enabled: true,
        priority: maxPriority + 10 || 100,
        conditions: {},
      })
      Object.assign(nextPayload, setTemplateRulesForType(nextPayload, templateType, current))
    })
  }

  const patchRule = async (ruleId: string, patch: Partial<TemplateRule>) => {
    const templateType = currentTemplateType.value
    if (!templateType) return
    if (!(await ensureRulesEditable(true))) return

    mutatePayload((nextPayload) => {
      const current = getTemplateRulesForType(nextPayload, templateType).map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule,
      )
      Object.assign(nextPayload, setTemplateRulesForType(nextPayload, templateType, current))
    })
  }

  const removeRule = async (ruleId: string) => {
    const templateType = currentTemplateType.value
    if (!templateType) return
    if (!(await ensureRulesEditable())) return

    mutatePayload((nextPayload) => {
      const current = getTemplateRulesForType(nextPayload, templateType)
        .filter((rule) => rule.id !== ruleId)
      Object.assign(nextPayload, setTemplateRulesForType(nextPayload, templateType, current))
    })
  }

  const ensureRulesEditable = async (silent = false) => {
    if (!isTemplateEditor.value) return true
    return rulesLock.ensureEditable(silent)
  }

  const loadTemplateRules = async () => {
    if (!isTemplateEditor.value) {
      hasLoaded.value = false
      return
    }

    isHydrating.value = true
    hasLoaded.value = false
    try {
      const draft = await getDraft(getRulesResource())
      payload.value = normalizeTemplateRulesPayload(draft.schemaJson ? JSON.parse(draft.schemaJson) : null)
      rulesMeta.value = {
        resourceId: draft.resourceId,
        baseUpdateTime: draft.updateTime,
        lastSavedSerialized: stringifyPayload(payload.value),
        lastPublishedSerialized: null,
      }
      rulesLock.reset()
      hasLoaded.value = true
    } catch (error) {
      payload.value = createDefaultTemplateRulesPayload()
      rulesMeta.value = {
        resourceId: undefined,
        baseUpdateTime: undefined,
        lastSavedSerialized: stringifyPayload(payload.value),
        lastPublishedSerialized: null,
      }
      hasLoaded.value = true
    } finally {
      isHydrating.value = false
    }
  }

  const saveTemplateRules = async (silent = false) => {
    if (!isTemplateEditor.value) {
      return { success: true, hasConflict: false, hasFailure: false }
    }

    const serialized = stringifyPayload(payload.value)
    if (serialized === rulesMeta.value.lastSavedSerialized) {
      return { success: true, hasConflict: false, hasFailure: false }
    }

    const editable = await ensureRulesEditable(true)
    if (!editable) {
      if (!silent) ElMessage.warning(rulesLock.getState().message || '模板规则当前不可编辑')
      return { success: false, hasConflict: true, hasFailure: true }
    }

    const request: PageSaveReqVO = {
      ...getRulesResource(),
      resourceName: '模板规则',
      schemaJson: serialized,
      baseUpdateTime: rulesMeta.value.baseUpdateTime,
      sessionKey: options.getSessionKey?.() || '',
    }

    const saveResult = await rulesLock.save(() => saveDraft(request), {
      silent,
      onSuccess: (saved) => {
        rulesMeta.value = {
          ...rulesMeta.value,
          resourceId: saved.resourceId,
          baseUpdateTime: saved.updateTime,
          lastSavedSerialized: serialized,
        }
      },
    })

    if (saveResult.success) {
      return { success: true, hasConflict: false, hasFailure: false }
    }

    return {
      success: false,
      hasConflict: saveResult.hasConflict,
      hasFailure: true,
    }
  }

  const publishTemplateRules = async (silent = false) => {
    if (!isTemplateEditor.value || !hasPendingPublish.value) {
      return { success: true, hasConflict: false, hasFailure: false }
    }

    const editable = await ensureRulesEditable(true)
    if (!editable) {
      if (!silent) ElMessage.warning(rulesLock.getState().message || '模板规则当前不可编辑')
      return { success: false, hasConflict: true, hasFailure: true }
    }

    const serialized = stringifyPayload(payload.value)
    const request: PagePublishReqVO = {
      ...getRulesResource(),
      resourceName: '模板规则',
      schemaJson: serialized,
      baseUpdateTime: rulesMeta.value.baseUpdateTime,
      sessionKey: options.getSessionKey?.() || '',
    }

    const publishResult = await rulesLock.publish(
      async () => {
        await publishVersion(request)
        return getDraft(getRulesResource())
      },
      {
        silent,
        onSuccess: (latestDraft) => {
          rulesMeta.value = {
            ...rulesMeta.value,
            resourceId: latestDraft.resourceId,
            baseUpdateTime: latestDraft.updateTime,
            lastSavedSerialized: serialized,
            lastPublishedSerialized: serialized,
          }
        },
      },
    )

    if (publishResult.success) {
      return { success: true, hasConflict: false, hasFailure: false }
    }

    return {
      success: false,
      hasConflict: publishResult.hasConflict,
      hasFailure: true,
    }
  }

  const releaseAllLocks = async () => {
    await rulesLock.release()
  }

  const releaseAllLocksKeepalive = () => {
    rulesLock.releaseKeepalive()
  }

  const { start: startHeartbeat, stop: stopHeartbeat } = useHeartbeatTimer({
    beatFn: () => rulesLock.heartbeat(),
  })

  const startTimers = () => {
    startHeartbeat()
  }

  const stopTimers = () => {
    stopHeartbeat()
  }

  return {
    isTemplateEditor,
    currentTemplateType,
    currentRules,
    hasLoaded,
    isHydrating,
    hasPendingChanges,
    getRulesLockState,
    ensureRulesEditable,
    loadTemplateRules,
    saveTemplateRules,
    publishTemplateRules,
    addRule,
    patchRule,
    removeRule,
    startTimers,
    stopTimers,
    releaseAllLocks,
    releaseAllLocksKeepalive,
  }
}
