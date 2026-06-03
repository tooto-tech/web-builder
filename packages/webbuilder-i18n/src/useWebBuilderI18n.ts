import { computed, ref, unref, watch, type Ref } from 'vue'
import { sortLanguagesByOrder } from './languageOrder.js'
import {
  WB_I18N_KEY_ATTR,
  applyI18nTranslationsToProjectData,
  ensureModelI18nKeys,
  extractI18nEntriesFromProjectData,
  getWebBuilderI18nEntryId,
  isUnchangedNonIdentityTranslation,
  mergeI18nEntries,
  resolveI18nEntryStatus
} from './i18n.js'
import type {
  HostServices,
  HostUi,
  PageResourceIdentity,
  WebBuilderPluginAction
} from '@tooto-tech/webbuilder-core'
import type {
  WebBuilderI18nBundleResp,
  WebBuilderI18nEntry,
  WebBuilderI18nEntryStatus,
  WebBuilderI18nHostService,
  WebBuilderI18nLanguageRecord,
  WebBuilderI18nReviewStatus,
  WebBuilderI18nTranslationOrigin,
  WebBuilderTranslationProviderConfig
} from './types.js'

type MaybeRef<T> = T | Ref<T>
type BlockingProcessAction = WebBuilderPluginAction
type BlockingProcessMessage = string | string[]
type RefreshSourceEntriesOptions = {
  ensureKeys?: boolean
}

type AutoTranslateOptions = {
  publishReady?: boolean
  reloadCurrentLocale?: boolean
  silent?: boolean
}

type StoredDraftEntry = {
  translation: string
  sourceHash?: string
  status?: WebBuilderI18nEntryStatus
  reviewStatus?: WebBuilderI18nReviewStatus
  translationOrigin?: WebBuilderI18nTranslationOrigin
  updatedAt?: number
}

type StoredDraftBundle = {
  version: 1
  entries: Record<string, StoredDraftEntry>
}

export interface WebBuilderI18nLanguage {
  label: string
  value: string
  id?: number
  code?: string
  slug?: string
  sortOrder?: number
  defaultLang?: number
}

export interface UseWebBuilderI18nOptions {
  grapes: any
  resource: MaybeRef<PageResourceIdentity>
  hostServices?: HostServices
  hostUi?: HostUi
  sourceLocale?: string
  defaultLocale?: string
  languages?: WebBuilderI18nLanguage[]
  blockingProcess?: {
    start: (action: BlockingProcessAction, message?: BlockingProcessMessage) => void
    stop: () => void
    setMessage: (message: BlockingProcessMessage) => void
  }
}

const normalizeEntries = (bundle?: WebBuilderI18nBundleResp | null): WebBuilderI18nEntry[] => {
  return Array.isArray(bundle?.entries) ? bundle.entries : []
}

const noopMessage = {
  success: () => undefined,
  warning: () => undefined,
  info: () => undefined,
  error: () => undefined
}

const fallbackHostUi: HostUi = {
  confirm: async () => false,
  message: noopMessage
}

const normalizeLanguageValue = (language: Pick<WebBuilderI18nLanguageRecord, 'code' | 'slug'>) =>
  `${language.code || language.slug || ''}`.trim()

const languageCodeLabel = (language: Pick<WebBuilderI18nLanguageRecord, 'code' | 'slug'>) =>
  `${language.code || language.slug || ''}`.trim()

const hasOwn = (source: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(source, key)

type NullablePrimitive = string | number | null | undefined

const normalizeString = (value: NullablePrimitive): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

const normalizeNumber = (value: NullablePrimitive): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

const hasPageResourceLocator = (identity?: PageResourceIdentity | null): boolean => {
  const resourceId = normalizeNumber(identity?.resourceId)
  const resourceKey = normalizeString(identity?.resourceKey)
  const resourceType = normalizeString(identity?.resourceType)
  const ownerId = normalizeNumber(identity?.ownerId)
  const ownerType = normalizeString(identity?.ownerType) || (ownerId !== undefined ? resourceType : undefined)
  return Boolean(resourceId !== undefined || resourceKey || (ownerType && ownerId !== undefined))
}

const isLayoutPageResource = (identity: PageResourceIdentity): boolean => {
  const resourceType = `${identity.resourceType ?? ''}`.trim()
  return resourceType === 'LAYOUT_PAGE_HEADER' || resourceType === 'LAYOUT_PAGE_FOOTER'
}

const I18N_DRAFT_STORAGE_PREFIX = 'wb:i18n:drafts:v1'

const getLocalStorage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

const resourceSignature = (resource: PageResourceIdentity) =>
  [
    resource.resourceId ?? '',
    resource.resourceKey ?? '',
    resource.resourceType ?? '',
    resource.resourceScope ?? '',
    resource.ownerType ?? '',
    resource.ownerId ?? ''
  ].join('|')

const toModelArray = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.models)) return value.models
  return []
}

const getModelChildren = (component: any): any[] => {
  const children = component?.components?.() ?? component?.get?.('components') ?? []
  return toModelArray(children)
}

const getModelI18nKey = (component: any): string =>
  `${
    component?.getAttributes?.()?.[WB_I18N_KEY_ATTR] ??
    component?.get?.('attributes')?.[WB_I18N_KEY_ATTR] ??
    ''
  }`.trim()

const findComponentByI18nKey = (root: any, key: string): any => {
  if (!root || !key) return null
  const stack = [root]
  const seen = new WeakSet<object>()
  while (stack.length) {
    const current = stack.shift()
    if (!current || typeof current !== 'object' || seen.has(current)) continue
    seen.add(current)
    if (getModelI18nKey(current) === key) return current
    stack.push(...getModelChildren(current))
  }
  return null
}

const toI18nLanguage = (language: WebBuilderI18nLanguageRecord): WebBuilderI18nLanguage | null => {
  const value = normalizeLanguageValue(language)
  if (!value) return null
  const code = languageCodeLabel(language)
  const suffix = code ? ` / ${code}` : ''
  return {
    label: `${language.name || value}${suffix}`,
    value,
    id: language.id,
    code: language.code,
    slug: language.slug,
    sortOrder: language.sortOrder,
    defaultLang: language.defaultLang
  }
}

export default function useWebBuilderI18n(options: UseWebBuilderI18nOptions) {
  let loadBundleRequestSeq = 0
  let sourceEntriesRefreshTimer: ReturnType<typeof setTimeout> | undefined
  let sourceEntriesInitialized = false
  let sourceEntriesDirty = true
  const editorRef = ref<any>(null)
  const locale = ref(options.defaultLocale || '')
  const sourceLocale = ref(options.sourceLocale || '')
  const provider = ref('')
  const languages = ref<WebBuilderI18nLanguage[]>(sortLanguagesByOrder(options.languages))
  const sourceEntries = ref<WebBuilderI18nEntry[]>([])
  const sourceRevision = ref(0)
  const savedEntries = ref<WebBuilderI18nEntry[]>([])
  const draftTranslations = ref<Record<string, string>>({})
  const draftStatuses = ref<Record<string, WebBuilderI18nEntryStatus>>({})
  const draftReviewStatuses = ref<Record<string, WebBuilderI18nReviewStatus>>({})
  const draftTranslationOrigins = ref<Record<string, WebBuilderI18nTranslationOrigin>>({})
  const loading = ref(false)
  const saving = ref(false)
  const translating = ref(false)
  const autoTranslating = ref(false)
  const lastError = ref('')
  const lastSavedAt = ref<Date | string | null>(null)
  const hostUi = options.hostUi ?? fallbackHostUi

  const resource = computed(() => unref(options.resource))
  const getI18nService = (): WebBuilderI18nHostService | undefined =>
    options.hostServices?.i18n as WebBuilderI18nHostService | undefined

  const normalizeProviderConfigs = (
    value: unknown
  ): WebBuilderTranslationProviderConfig[] => {
    if (Array.isArray(value)) return value as WebBuilderTranslationProviderConfig[]
    if (Array.isArray((value as { list?: unknown[] } | null)?.list)) {
      return (value as { list: WebBuilderTranslationProviderConfig[] }).list
    }
    if (value && typeof value === 'object' && 'engineType' in value) {
      return [value as WebBuilderTranslationProviderConfig]
    }
    return []
  }

  const loadProviderConfigs = async (): Promise<WebBuilderTranslationProviderConfig[]> => {
    const service = getI18nService()
    if (service?.getEnabledProviderConfigs) {
      return service.getEnabledProviderConfigs()
    }
    if (!service?.getTranslationConfig) return []
    return normalizeProviderConfigs(await service.getTranslationConfig())
  }

  const draftStorageKey = () => {
    const signature = resourceSignature(resource.value)
    if (!signature || !sourceLocale.value || !locale.value) return ''
    return [
      I18N_DRAFT_STORAGE_PREFIX,
      encodeURIComponent(signature),
      encodeURIComponent(sourceLocale.value),
      encodeURIComponent(locale.value)
    ].join(':')
  }

  const readStoredDrafts = (): StoredDraftBundle | null => {
    const key = draftStorageKey()
    const storage = getLocalStorage()
    if (!key || !storage) return null
    try {
      const raw = storage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as StoredDraftBundle
      if (parsed?.version !== 1 || !parsed.entries || typeof parsed.entries !== 'object') {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  const clearStoredDrafts = () => {
    const key = draftStorageKey()
    const storage = getLocalStorage()
    if (!key || !storage) return
    try {
      storage.removeItem(key)
    } catch {
      // localStorage might be full or blocked; keep the in-memory draft intact.
    }
  }

  const persistDrafts = (
    translations = draftTranslations.value,
    statuses = draftStatuses.value,
    reviewStatuses = draftReviewStatuses.value,
    origins = draftTranslationOrigins.value
  ) => {
    const key = draftStorageKey()
    const storage = getLocalStorage()
    if (!key || !storage) return
    const sourceMap = new Map(
      sourceEntries.value.map((entry) => [getWebBuilderI18nEntryId(entry), entry])
    )
    const entryIds = Array.from(
      new Set([
        ...Object.keys(translations),
        ...Object.keys(statuses),
        ...Object.keys(reviewStatuses),
        ...Object.keys(origins)
      ])
    )
    const storedEntries = entryIds.reduce<Record<string, StoredDraftEntry>>((result, id) => {
      if (!hasOwn(translations, id)) return result
      const translation = translations[id]
      const sourceEntry = sourceMap.get(id)
      result[id] = {
        translation,
        sourceHash: sourceEntry?.sourceHash,
        status: statuses[id],
        reviewStatus: reviewStatuses[id],
        translationOrigin: origins[id],
        updatedAt: Date.now()
      }
      return result
    }, {})

    try {
      if (!Object.keys(storedEntries).length) {
        storage.removeItem(key)
        return
      }
      storage.setItem(
        key,
        JSON.stringify({
          version: 1,
          entries: storedEntries
        } satisfies StoredDraftBundle)
      )
    } catch {
      // Browser persistence is a convenience. The live editor still keeps the draft in memory.
    }
  }

  const replaceDraftState = (
    translations: Record<string, string>,
    statuses: Record<string, WebBuilderI18nEntryStatus>,
    reviewStatuses: Record<string, WebBuilderI18nReviewStatus>,
    origins: Record<string, WebBuilderI18nTranslationOrigin>,
    shouldPersist = true
  ) => {
    draftTranslations.value = translations
    draftStatuses.value = statuses
    draftReviewStatuses.value = reviewStatuses
    draftTranslationOrigins.value = origins
    if (shouldPersist) {
      persistDrafts(translations, statuses, reviewStatuses, origins)
    }
  }

  const resetDraftState = (options: { clearStorage?: boolean } = {}) => {
    replaceDraftState({}, {}, {}, {}, false)
    if (options.clearStorage) {
      clearStoredDrafts()
    }
  }

  const restoreStoredDrafts = () => {
    const stored = readStoredDrafts()
    if (!stored) {
      resetDraftState()
      return
    }
    const sourceMap = new Map(
      sourceEntries.value.map((entry) => [getWebBuilderI18nEntryId(entry), entry])
    )
    const nextTranslations: Record<string, string> = {}
    const nextStatuses: Record<string, WebBuilderI18nEntryStatus> = {}
    const nextReviewStatuses: Record<string, WebBuilderI18nReviewStatus> = {}
    const nextOrigins: Record<string, WebBuilderI18nTranslationOrigin> = {}

    Object.entries(stored.entries).forEach(([id, draft]) => {
      const sourceEntry = sourceMap.get(id)
      if (!sourceEntry || typeof draft?.translation !== 'string') return
      if (draft.sourceHash && draft.sourceHash !== sourceEntry.sourceHash) return
      nextTranslations[id] = draft.translation
      nextStatuses[id] =
        draft.status ??
        resolveI18nEntryStatus(sourceEntry, {
          sourceHash: sourceEntry.sourceHash,
          translation: draft.translation
        })
      if (draft.reviewStatus) {
        nextReviewStatuses[id] = draft.reviewStatus
      }
      if (draft.translationOrigin) {
        nextOrigins[id] = draft.translationOrigin
      }
    })

    replaceDraftState(nextTranslations, nextStatuses, nextReviewStatuses, nextOrigins, false)
  }

  const entries = computed<WebBuilderI18nEntry[]>(() => {
    const merged = mergeI18nEntries(sourceEntries.value, savedEntries.value)
    return merged.map((entry) => {
      const id = getWebBuilderI18nEntryId(entry)
      const hasDraftTranslation = hasOwn(draftTranslations.value, id)
      const hasDraftStatus = hasOwn(draftStatuses.value, id)
      const hasDraftReviewStatus = hasOwn(draftReviewStatuses.value, id)
      const hasDraftTranslationOrigin = hasOwn(draftTranslationOrigins.value, id)
      const translation = draftTranslations.value[id] ?? entry.translation ?? ''
      const reviewStatus = hasDraftReviewStatus ? draftReviewStatuses.value[id] : entry.reviewStatus
      const translationOrigin = hasDraftTranslationOrigin
        ? draftTranslationOrigins.value[id]
        : entry.translationOrigin
      return {
        ...entry,
        translation,
        translationOrigin,
        reviewStatus,
        status:
          (hasDraftStatus ? draftStatuses.value[id] : undefined) ??
          (hasDraftTranslation
            ? resolveI18nEntryStatus(entry, { sourceHash: entry.sourceHash, translation })
            : entry.status)
      }
    })
  })

  const dirtyEntryIds = computed(() => {
    const savedMap = new Map(
      savedEntries.value.map((entry) => [getWebBuilderI18nEntryId(entry), entry])
    )
    return entries.value
      .filter((entry) => {
        const id = getWebBuilderI18nEntryId(entry)
        const saved = savedMap.get(id)
        return (
          (hasOwn(draftTranslations.value, id) &&
            (draftTranslations.value[id] ?? '') !== (saved?.translation ?? '')) ||
          (hasOwn(draftReviewStatuses.value, id) &&
            (draftReviewStatuses.value[id] ?? '') !== (saved?.reviewStatus ?? '')) ||
          (hasOwn(draftTranslationOrigins.value, id) &&
            (draftTranslationOrigins.value[id] ?? '') !== (saved?.translationOrigin ?? '')) ||
          (hasOwn(draftStatuses.value, id) &&
            (draftStatuses.value[id] ?? '') !== (saved?.status ?? ''))
        )
      })
      .map(getWebBuilderI18nEntryId)
  })

  const actionableEntries = computed(() =>
    entries.value.filter(
      (entry) => entry.status === 'missing' || entry.status === 'stale' || entry.status === 'error'
    )
  )

  const dirty = computed(() => dirtyEntryIds.value.length > 0)
  const missingCount = computed(
    () => entries.value.filter((entry) => entry.status === 'missing').length
  )
  const staleCount = computed(
    () => entries.value.filter((entry) => entry.status === 'stale').length
  )
  const translatedCount = computed(
    () => entries.value.filter((entry) => entry.status === 'translated').length
  )
  const pendingReviewCount = computed(
    () => entries.value.filter((entry) => entry.reviewStatus === 'pending_review').length
  )
  const reviewedCount = computed(
    () => entries.value.filter((entry) => entry.reviewStatus === 'reviewed').length
  )
  const targetLanguages = computed(() =>
    languages.value.filter(
      (lang) => lang.value && lang.value !== sourceLocale.value && lang.defaultLang !== 1
    )
  )

  const applyLanguageSelection = (nextLanguages: WebBuilderI18nLanguage[]) => {
    languages.value = nextLanguages
    if (!nextLanguages.length) {
      locale.value = ''
      sourceLocale.value = ''
      return
    }

    const defaultLanguage = nextLanguages.find((lang) => lang.defaultLang === 1) || nextLanguages[0]
    sourceLocale.value = defaultLanguage.value

    const targetLanguageCandidates = nextLanguages.filter(
      (lang) => lang.value && lang.value !== sourceLocale.value && lang.defaultLang !== 1
    )
    const preferredTarget =
      targetLanguageCandidates.find((lang) => lang.value === options.defaultLocale) ||
      targetLanguageCandidates[0]
    if (!nextLanguages.some((lang) => lang.value === locale.value)) {
      locale.value = preferredTarget?.value || ''
    }
    if (locale.value === sourceLocale.value) {
      locale.value = preferredTarget?.value || ''
    }
  }

  const loadLanguages = async () => {
    if (options.languages?.length) {
      applyLanguageSelection(sortLanguagesByOrder(options.languages))
      return
    }
    try {
      const service = getI18nService()
      if (!service?.getEnabledLanguages) {
        throw new Error('缺少系统语言加载服务')
      }
      const list = await service.getEnabledLanguages()
      const enabledLanguages = sortLanguagesByOrder(list)
        .map(toI18nLanguage)
        .filter(Boolean) as WebBuilderI18nLanguage[]
      applyLanguageSelection(enabledLanguages)
    } catch (error: any) {
      languages.value = []
      lastError.value = error?.message || '加载系统语言失败'
    }
  }

  const clearSourceEntriesRefreshTimer = () => {
    if (!sourceEntriesRefreshTimer) return
    clearTimeout(sourceEntriesRefreshTimer)
    sourceEntriesRefreshTimer = undefined
  }

  const refreshSourceEntries = (refreshOptions: RefreshSourceEntriesOptions = {}) => {
    const editor = editorRef.value
    if (!editor?.getProjectData) return
    const includeLayoutPages = isLayoutPageResource(resource.value)
    if (refreshOptions.ensureKeys !== false) {
      ensureModelI18nKeys(editor, { includeLayoutPages })
    }
    sourceEntries.value = extractI18nEntriesFromProjectData(editor.getProjectData?.() || null, {
      includeLayoutPages
    })
    sourceRevision.value += 1
    sourceEntriesDirty = false
    sourceEntriesInitialized = true
  }

  const scheduleSourceEntriesRefresh = () => {
    sourceEntriesDirty = true
    if (!sourceEntriesInitialized) return

    clearSourceEntriesRefreshTimer()
    sourceEntriesRefreshTimer = setTimeout(() => {
      sourceEntriesRefreshTimer = undefined
      if (!sourceEntriesDirty) return
      refreshSourceEntries({ ensureKeys: false })
    }, 300)
  }

  const loadBundle = async () => {
    const requestId = ++loadBundleRequestSeq
    const currentResource = resource.value
    const requestedLocale = locale.value
    const requestedSourceLocale = sourceLocale.value
    const requestedResourceSignature = resourceSignature(currentResource)
    if (!locale.value) {
      refreshSourceEntries({ ensureKeys: true })
      savedEntries.value = []
      resetDraftState()
      loading.value = false
      return
    }
    if (!hasPageResourceLocator(currentResource)) {
      refreshSourceEntries({ ensureKeys: true })
      savedEntries.value = []
      resetDraftState()
      loading.value = false
      return
    }

    loading.value = true
    lastError.value = ''
    try {
      refreshSourceEntries({ ensureKeys: true })
      const service = getI18nService()
      if (!service?.loadBundle) {
        throw new Error('缺少多语言 bundle 加载服务')
      }
      const bundle = await service.loadBundle({
        ...currentResource,
        locale: requestedLocale,
        sourceLocale: requestedSourceLocale
      })
      if (
        requestId !== loadBundleRequestSeq ||
        requestedLocale !== locale.value ||
        requestedSourceLocale !== sourceLocale.value ||
        requestedResourceSignature !== resourceSignature(resource.value)
      ) {
        return
      }
      savedEntries.value = normalizeEntries(bundle)
      restoreStoredDrafts()
      lastSavedAt.value = bundle?.updateTime ?? null
    } catch (error: any) {
      if (requestId !== loadBundleRequestSeq) return
      savedEntries.value = []
      restoreStoredDrafts()
      lastError.value = error?.message || '加载翻译 bundle 失败'
    } finally {
      if (requestId === loadBundleRequestSeq) {
        loading.value = false
      }
    }
  }

  const setTranslation = (
    entry: WebBuilderI18nEntry,
    translation: string,
    options: {
      origin?: WebBuilderI18nTranslationOrigin
      reviewStatus?: WebBuilderI18nReviewStatus
      status?: WebBuilderI18nEntryStatus
    } = {}
  ) => {
    const id = getWebBuilderI18nEntryId(entry)
    const nextTranslations = {
      ...draftTranslations.value,
      [id]: translation
    }
    const nextOrigins = {
      ...draftTranslationOrigins.value,
      [id]: options.origin ?? 'manual'
    }
    const nextReviewStatuses = {
      ...draftReviewStatuses.value,
      [id]: options.reviewStatus ?? 'reviewed'
    }
    const nextStatuses = {
      ...draftStatuses.value,
      [id]:
        options.status ??
        resolveI18nEntryStatus(entry, {
          sourceHash: entry.sourceHash,
          translation
        })
    }
    replaceDraftState(nextTranslations, nextStatuses, nextReviewStatuses, nextOrigins)
  }

  const confirmTranslation = (entry: WebBuilderI18nEntry) => {
    const id = getWebBuilderI18nEntryId(entry)
    const translation = draftTranslations.value[id] ?? entry.translation ?? ''
    if (!`${translation ?? ''}`.trim()) {
      lastError.value = '当前片段没有译文，无法确认'
      return
    }
    lastError.value = ''
    const nextReviewStatuses: Record<string, WebBuilderI18nReviewStatus> = {
      ...draftReviewStatuses.value,
      [id]: 'reviewed'
    }
    const nextOrigins: Record<string, WebBuilderI18nTranslationOrigin> = {
      ...draftTranslationOrigins.value,
      [id]: 'manual'
    }
    replaceDraftState(draftTranslations.value, draftStatuses.value, nextReviewStatuses, nextOrigins)
  }

  const setLocale = (nextLocale: string) => {
    locale.value = nextLocale
  }

  const setProvider = (nextProvider: string) => {
    provider.value = nextProvider
  }

  const buildProviderPayload = () => {
    const currentProvider = provider.value.trim()
    return currentProvider ? { provider: currentProvider } : {}
  }

  const requireResourceLocator = () => {
    if (hasPageResourceLocator(resource.value)) return true
    lastError.value = '缺少页面资源标识，无法保存或翻译多语言内容'
    return false
  }

  const saveTranslations = async () => {
    const currentResource = resource.value
    if (!requireResourceLocator()) return false
    if (!locale.value) {
      lastError.value = '请先启用至少一个系统语言'
      return false
    }
    saving.value = true
    lastError.value = ''
    try {
      const dirtyIds = new Set(dirtyEntryIds.value)
      const payloadEntries = entries.value
        .filter((entry) => dirtyIds.has(getWebBuilderI18nEntryId(entry)))
        .map((entry) => ({
          ...entry,
          translation:
            draftTranslations.value[getWebBuilderI18nEntryId(entry)] ?? entry.translation ?? '',
          translationOrigin:
            draftTranslationOrigins.value[getWebBuilderI18nEntryId(entry)] ??
            entry.translationOrigin,
          reviewStatus:
            draftReviewStatuses.value[getWebBuilderI18nEntryId(entry)] ?? entry.reviewStatus,
          status: resolveI18nEntryStatus(entry, {
            sourceHash: entry.sourceHash,
            translation:
              draftTranslations.value[getWebBuilderI18nEntryId(entry)] ?? entry.translation ?? ''
          })
        }))
      const service = getI18nService()
      if (!service?.saveBundle) {
        throw new Error('缺少多语言 bundle 保存服务')
      }
      const bundle = await service.saveBundle({
        ...currentResource,
        locale: locale.value,
        sourceLocale: sourceLocale.value,
        entries: payloadEntries,
        partial: true
      })
      savedEntries.value = normalizeEntries(bundle)
      if (!savedEntries.value.length) savedEntries.value = payloadEntries
      resetDraftState({ clearStorage: true })
      lastSavedAt.value = bundle?.updateTime ?? new Date()
      return true
    } catch (error: any) {
      lastError.value = error?.message || '保存翻译 bundle 失败'
      throw error
    } finally {
      saving.value = false
    }
  }

  const machineTranslateEntries = async (targetEntries: WebBuilderI18nEntry[]) => {
    if (!requireResourceLocator()) return
    if (!locale.value) {
      lastError.value = '请先启用至少一个系统语言'
      return
    }
    const targets = targetEntries.filter(Boolean)
    if (!targets.length) return

    translating.value = true
    lastError.value = ''
    try {
      const service = getI18nService()
      if (!service?.translateEntries) {
        throw new Error('缺少机器翻译服务')
      }
      const res = await service.translateEntries({
        ...resource.value,
        locale: locale.value,
        sourceLocale: sourceLocale.value,
        ...buildProviderPayload(),
        entries: targets
      })
      if (res?.success === false && res.errorMessage) {
        lastError.value = res.errorMessage
      }
      const translated = Array.isArray(res?.entries) ? res.entries : []
      const nextDrafts = { ...draftTranslations.value }
      const nextStatuses = { ...draftStatuses.value }
      const nextReviewStatuses = { ...draftReviewStatuses.value }
      const nextTranslationOrigins = { ...draftTranslationOrigins.value }
      let rejectedUnchangedCount = 0
      translated.forEach((entry) => {
        const id = getWebBuilderI18nEntryId(entry)
        const sourceEntry =
          targets.find((target) => getWebBuilderI18nEntryId(target) === id) ?? entry
        const translation = entry.translation ?? ''
        if (
          entry.status === 'error' ||
          (entry.status !== 'translated' &&
            isUnchangedNonIdentityTranslation(sourceEntry.source, translation))
        ) {
          rejectedUnchangedCount += entry.status === 'error' ? 0 : 1
          nextDrafts[id] = ''
          nextStatuses[id] = 'error'
          delete nextReviewStatuses[id]
          delete nextTranslationOrigins[id]
          return
        }
        nextDrafts[id] = translation
        nextStatuses[id] = resolveI18nEntryStatus(sourceEntry, {
          sourceHash: sourceEntry.sourceHash,
          translation,
          status: entry.status
        })
        nextReviewStatuses[id] = 'reviewed'
        nextTranslationOrigins[id] = entry.translationOrigin ?? 'machine'
      })
      if (rejectedUnchangedCount > 0 && !lastError.value) {
        lastError.value = '翻译引擎未返回目标语言内容，请检查翻译配置或换一个引擎'
      }
      replaceDraftState(nextDrafts, nextStatuses, nextReviewStatuses, nextTranslationOrigins)
    } catch (error: any) {
      lastError.value = error?.message || '机器翻译接口暂不可用'
    } finally {
      translating.value = false
    }
  }

  const machineTranslate = async (mode: 'missing' | 'stale' | 'all' = 'missing') => {
    const targets = entries.value.filter((entry) => {
      if (mode === 'all') return true
      return entry.status === mode
    })
    await machineTranslateEntries(targets)
  }

  const runAutoTranslateMissing = async (autoOptions: AutoTranslateOptions = {}) => {
    autoTranslating.value = true
    if (!autoOptions.silent) {
      lastError.value = ''
    }
    try {
      const service = getI18nService()
      if (!service?.autoTranslateEntries) {
        throw new Error('缺少自动翻译服务')
      }
      const response = await service.autoTranslateEntries({
        ...resource.value,
        locale: locale.value || targetLanguages.value[0]?.value || sourceLocale.value,
        sourceLocale: sourceLocale.value,
        ...buildProviderPayload(),
        publishReady: autoOptions.publishReady ?? false,
        locales: targetLanguages.value.map((lang) => lang.value),
        entries: sourceEntries.value
      })
      if (response?.success === false) {
        const message = response.errorMessage || '自动翻译未全部完成'
        if (!autoOptions.silent) {
          lastError.value = message
        }
        return false
      }
      if (autoOptions.reloadCurrentLocale !== false) {
        await loadBundle()
      }
      return true
    } catch (error: any) {
      const message = error?.message || '自动翻译任务启动失败'
      if (autoOptions.silent) {
        console.warn('[WebBuilder] auto translate failed:', message)
      } else {
        lastError.value = message
      }
      return false
    } finally {
      autoTranslating.value = false
    }
  }

  const autoTranslateMissing = async (autoOptions: AutoTranslateOptions = {}) => {
    if (!requireResourceLocator()) return false
    if (!languages.value.length) {
      await loadLanguages()
    }
    refreshSourceEntries({ ensureKeys: true })
    if (!sourceEntries.value.length || !targetLanguages.value.length) return true
    if (targetLanguages.value.length === 1 && !actionableEntries.value.length) return true

    return await runAutoTranslateMissing(autoOptions)
  }

  const flushDirtyTranslations = async () => {
    if (!dirty.value) {
      clearStoredDrafts()
      return true
    }
    return saveTranslations()
  }

  const i18nActionText: Record<BlockingProcessAction, string> = {
    publish: '发布',
    save: '保存'
  }

  const confirmContinueAfterI18nIssue = async (action: BlockingProcessAction, reason: string) => {
    const actionText = i18nActionText[action]
    const cancelText = action === 'publish' ? '取消发布' : '取消保存'
    options.blockingProcess?.stop()
    try {
      const confirmed = await hostUi.confirm({
        message: `多语言自动翻译未全部完成：${reason}。继续${actionText}后，缺失或异常片段可能显示源语言内容或旧译文。是否继续${actionText}？`,
        title: `多语言${actionText}提醒`,
        confirmText: `继续${actionText}`,
        cancelText
      })
      if (!confirmed) {
        hostUi.message.warning(`已${cancelText}，当前编辑内容仍保留在页面中`)
        return false
      }
      options.blockingProcess?.start(
        action,
        action === 'publish'
          ? ['正在继续发布前检查', '正在同步发布前资源']
          : ['正在继续保存流程', '正在同步保存资源']
      )
      return true
    } catch {
      hostUi.message.warning(`已${cancelText}，当前编辑内容仍保留在页面中`)
      return false
    }
  }

  const ensureReadyOrConfirm = async (action: BlockingProcessAction) => {
    options.blockingProcess?.setMessage([
      '正在检索翻译内容',
      '正在同步手工译文草稿',
      '正在保存多语言草稿',
      '正在检查缺失翻译',
      '正在自动翻译缺失片段',
      action === 'publish' ? '正在校验多语言发布状态' : '正在校验多语言保存状态'
    ])

    let flushed = false
    try {
      flushed = await flushDirtyTranslations()
    } catch {
      flushed = false
    }

    if (!flushed) {
      options.blockingProcess?.stop()
      hostUi.message.error(lastError.value || '多语言手工译文保存失败，已中止当前操作')
      return false
    }

    const ready = await autoTranslateMissing({
      publishReady: action === 'publish',
      reloadCurrentLocale: true,
      silent: false
    })
    if (ready) return true

    return confirmContinueAfterI18nIssue(action, lastError.value || '仍存在缺失翻译或翻译错误')
  }

  const getPreviewProjectData = () => {
    const editor = editorRef.value
    refreshSourceEntries({ ensureKeys: true })
    const projectData = editor?.getProjectData?.() || null
    return applyI18nTranslationsToProjectData(projectData, entries.value)
  }

  const selectEntryComponent = (entry: Pick<WebBuilderI18nEntry, 'key'> | null | undefined) => {
    const editor = editorRef.value
    const key = `${entry?.key ?? ''}`.trim()
    if (!editor || !key || key.startsWith('page:')) {
      editor?.select?.(null)
      return false
    }

    const pages = toModelArray(editor?.Pages?.getAll?.())
    const roots = pages.length
      ? pages.map((page) => page?.getMainComponent?.()).filter(Boolean)
      : [editor?.getWrapper?.()].filter(Boolean)
    const component = roots.map((root) => findComponentByI18nKey(root, key)).find(Boolean)
    if (!component) {
      editor.select?.(null)
      return false
    }

    editor.select?.(component)
    const element = component?.view?.el
    if (element?.scrollIntoView) {
      element.scrollIntoView({ block: 'center', inline: 'center' })
    }
    return true
  }

  options.grapes?.onInit?.((editor: any) => {
    editorRef.value = editor

    const refresh = () => scheduleSourceEntriesRefresh()
    editor.on?.('component:add', refresh)
    editor.on?.('component:remove', refresh)
    editor.on?.('component:update:attributes', refresh)
    editor.on?.('component:update:content', refresh)
    editor.on?.('page', refresh)
    editor.on?.('destroy', () => {
      clearSourceEntriesRefreshTimer()
      editor.off?.('component:add', refresh)
      editor.off?.('component:remove', refresh)
      editor.off?.('component:update:attributes', refresh)
      editor.off?.('component:update:content', refresh)
      editor.off?.('page', refresh)
      editorRef.value = null
      sourceEntriesInitialized = false
      sourceEntriesDirty = true
    })
  })

  watch(locale, () => {
    void loadBundle()
  })

  watch(sourceLocale, () => {
    void loadBundle()
  })

  watch(
    resource,
    () => {
      void loadBundle()
    },
    { deep: true }
  )

  return {
    locale,
    sourceLocale,
    provider,
    languages,
    entries,
    sourceEntries,
    sourceRevision,
    savedEntries,
    loading,
    saving,
    translating,
    autoTranslating,
    dirty,
    dirtyEntryIds,
    actionableEntries,
    missingCount,
    staleCount,
    translatedCount,
    pendingReviewCount,
    reviewedCount,
    targetLanguages,
    lastError,
    lastSavedAt,
    hostUi,
    setLocale,
    setProvider,
    refreshSourceEntries,
    loadBundle,
    setTranslation,
    confirmTranslation,
    saveTranslations,
    flushDirtyTranslations,
    ensureReadyOrConfirm,
    machineTranslate,
    machineTranslateEntries,
    autoTranslateMissing,
    getPreviewProjectData,
    selectEntryComponent,
    loadLanguages,
    loadProviderConfigs
  }
}
