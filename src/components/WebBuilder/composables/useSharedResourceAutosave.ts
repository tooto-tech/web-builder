import { computed, ref, watch } from 'vue'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import {
  createPage,
  getDraft,
  saveDraft,
  type PageSaveReqVO,
  type PageVO,
} from '@/api/content/page'
import { useGlobalColorsStore } from '@/store/modules/globalColors'
import { useGlobalTypographyStore, normalizeHeadingStyles } from '@/store/modules/globalTypography'
import { useGlobalCustomCssStore } from '@/store/modules/globalCustomCss'
import { useGlobalCustomCodeStore } from '@/store/modules/globalCustomCode'
import { useFontManager } from './useFontManager'
import {
  SHARED_RESOURCE_KEYS,
  SHARED_RESOURCE_SCOPE,
  SHARED_RESOURCE_TYPES,
  createDefaultGlobalColorsPayload,
  createDefaultGlobalCustomCodePayload,
  createDefaultGlobalCustomCssPayload,
  createDefaultGlobalTypographyPayload,
  type GlobalColorsPayload,
  type GlobalCustomCodePayload,
  type GlobalCustomCssPayload,
  type GlobalTypographyPayload,
  type LegacySharedPayloads,
} from '../config/sharedResources'

const PAGE_NOT_EXISTS_CODE = 1009012000
const PAGE_CONFLICT_CODE = 1009012001
const AUTO_SAVE_DELAY_MS = 800

type SharedDescriptorKey = 'colors' | 'typography' | 'customCss' | 'customCode'

interface SharedDescriptor<TPayload> {
  key: SharedDescriptorKey
  resourceKey: string
  resourceType: string
  resourceName: string
  defaultFactory: () => TPayload
  serialize: () => TPayload
  hydrate: (payload: TPayload) => void
  getLegacyPayload: (legacy: LegacySharedPayloads) => TPayload | null
}

interface SharedResourceMeta {
  resourceId?: number
  baseUpdateTime?: Date | string
  lastSavedSerialized: string
  isLoaded: boolean
  isSaving: boolean
  hasConflict: boolean
  saveTimer: ReturnType<typeof setTimeout> | null
  savePromise: Promise<boolean> | null
}

export interface UseSharedResourceAutosaveOptions {
  getSessionKey?: () => string
}

export interface FlushPendingSavesOptions {
  blockOnError?: boolean
}

export interface FlushPendingSavesResult {
  success: boolean
  hasConflict: boolean
  hasFailure: boolean
  failedResources: string[]
}

const stringifyPayload = (value: unknown): string => JSON.stringify(value ?? null)

const isBlankPayloadJson = (schemaJson?: string) => {
  const normalized = `${schemaJson ?? ''}`.trim()
  return !normalized || normalized === '{}' || normalized === 'null'
}

const clonePayload = <T>(payload: T): T => JSON.parse(JSON.stringify(payload))

export default function useSharedResourceAutosave(options: UseSharedResourceAutosaveOptions = {}) {
  const globalColorsStore = useGlobalColorsStore()
  const globalTypographyStore = useGlobalTypographyStore()
  const globalCustomCssStore = useGlobalCustomCssStore()
  const globalCustomCodeStore = useGlobalCustomCodeStore()
  const fontManager = useFontManager()

  const isHydrating = ref(false)
  const hasLoaded = ref(false)

  const metaMap: Record<SharedDescriptorKey, SharedResourceMeta> = {
    colors: createMeta(),
    typography: createMeta(),
    customCss: createMeta(),
    customCode: createMeta(),
  }

  const descriptors: SharedDescriptor<any>[] = [
    {
      key: 'colors',
      resourceKey: SHARED_RESOURCE_KEYS.colors,
      resourceType: SHARED_RESOURCE_TYPES.colors,
      resourceName: '全局颜色',
      defaultFactory: createDefaultGlobalColorsPayload,
      serialize: (): GlobalColorsPayload => ({
        version: 1,
        colors: clonePayload(globalColorsStore.colors),
      }),
      hydrate: (payload: GlobalColorsPayload) => {
        globalColorsStore.$patch({ colors: Array.isArray(payload?.colors) ? payload.colors : [] })
      },
      getLegacyPayload: (legacy) =>
        legacy.colors ? { version: 1, colors: clonePayload(legacy.colors) } : null,
    },
    {
      key: 'typography',
      resourceKey: SHARED_RESOURCE_KEYS.typography,
      resourceType: SHARED_RESOURCE_TYPES.typography,
      resourceName: '全局排版',
      defaultFactory: createDefaultGlobalTypographyPayload,
      serialize: (): GlobalTypographyPayload => ({
        version: 1,
        fontFamily: globalTypographyStore.fontFamily,
        googleName: globalTypographyStore.googleName,
        headingStyles: clonePayload(globalTypographyStore.headingStyles),
        installedFonts: clonePayload(fontManager.installedFonts.value),
      }),
      hydrate: (payload: GlobalTypographyPayload) => {
        const next = payload ?? createDefaultGlobalTypographyPayload()
        if (next.fontFamily) {
          globalTypographyStore.setGlobalFont(next.fontFamily, next.googleName || '')
        } else {
          globalTypographyStore.resetGlobalFont()
        }
        globalTypographyStore.hydrateHeadingStyles(normalizeHeadingStyles(next.headingStyles))
        fontManager.restoreFromSaved(next.installedFonts)
      },
      getLegacyPayload: (legacy) =>
        legacy.typography
          ? {
              version: 1,
              fontFamily: legacy.typography.fontFamily,
              googleName: legacy.typography.googleName,
              headingStyles: normalizeHeadingStyles(legacy.typography.headingStyles),
              installedFonts: clonePayload(legacy.typography.installedFonts),
            }
          : null,
    },
    {
      key: 'customCss',
      resourceKey: SHARED_RESOURCE_KEYS.customCss,
      resourceType: SHARED_RESOURCE_TYPES.customCss,
      resourceName: '全局自定义 CSS',
      defaultFactory: createDefaultGlobalCustomCssPayload,
      serialize: (): GlobalCustomCssPayload => ({
        version: 1,
        css: globalCustomCssStore.css,
      }),
      hydrate: (payload: GlobalCustomCssPayload) => {
        globalCustomCssStore.setCss(`${payload?.css ?? ''}`)
      },
      getLegacyPayload: (legacy) =>
        legacy.customCss !== null
          ? { version: 1, css: legacy.customCss }
          : null,
    },
    {
      key: 'customCode',
      resourceKey: SHARED_RESOURCE_KEYS.customCode,
      resourceType: SHARED_RESOURCE_TYPES.customCode,
      resourceName: '全局自定义代码',
      defaultFactory: createDefaultGlobalCustomCodePayload,
      serialize: (): GlobalCustomCodePayload => ({
        version: 1,
        snippets: clonePayload(globalCustomCodeStore.snippets),
      }),
      hydrate: (payload: GlobalCustomCodePayload) => {
        globalCustomCodeStore.setSnippets(Array.isArray(payload?.snippets) ? payload.snippets : [])
      },
      getLegacyPayload: (legacy) =>
        legacy.customCode ? { version: 1, snippets: clonePayload(legacy.customCode) } : null,
    },
  ]

  const descriptorMap = descriptors.reduce<Record<SharedDescriptorKey, SharedDescriptor<any>>>(
    (acc, descriptor) => {
      acc[descriptor.key] = descriptor
      return acc
    },
    {} as Record<SharedDescriptorKey, SharedDescriptor<any>>,
  )

  const hasPendingChanges = computed(() => {
    if (!hasLoaded.value || isHydrating.value) return false
    return descriptors.some((descriptor) => {
      const meta = metaMap[descriptor.key]
      return Boolean(meta.saveTimer || meta.isSaving)
        || stringifyPayload(descriptor.serialize()) !== meta.lastSavedSerialized
    })
  })

  descriptors.forEach((descriptor) => {
    watch(
      () => stringifyPayload(descriptor.serialize()),
      (currentSerialized, previousSerialized) => {
        if (currentSerialized === previousSerialized) return
        if (!hasLoaded.value || isHydrating.value) return
        queueAutoSave(descriptor.key)
      },
    )
  })

  async function loadSharedDrafts(legacyPayloads: LegacySharedPayloads) {
    isHydrating.value = true
    try {
      for (const descriptor of descriptors) {
        const meta = metaMap[descriptor.key]
        try {
          const page = await ensureSharedDraft(descriptor)
          meta.resourceId = page.resourceId
          meta.baseUpdateTime = page.updateTime
          meta.hasConflict = false

          const persistedPayload = parseSharedPayload(descriptor, page.schemaJson)
          const persistedSerialized = stringifyPayload(persistedPayload)
          const migratedPayload =
            page.id == null ? descriptor.getLegacyPayload(legacyPayloads) : null
          const nextPayload = migratedPayload ?? persistedPayload

          descriptor.hydrate(clonePayload(nextPayload))
          meta.lastSavedSerialized = persistedSerialized
          meta.isLoaded = true

          if (migratedPayload) {
            await saveSharedResource(descriptor.key, true)
          }
        } catch (error) {
          const fallbackPayload = descriptor.defaultFactory()
          meta.resourceId = undefined
          meta.baseUpdateTime = undefined
          meta.hasConflict = false
          descriptor.hydrate(clonePayload(fallbackPayload))
          meta.lastSavedSerialized = stringifyPayload(fallbackPayload)
          meta.isLoaded = true
          ElMessage.warning(`${descriptor.resourceName} 加载失败，已回退到默认值`)
        }
      }
      hasLoaded.value = true
    } finally {
      isHydrating.value = false
    }
  }

  async function flushPendingSaves(
    options: FlushPendingSavesOptions = {},
  ): Promise<FlushPendingSavesResult> {
    const { blockOnError = true } = options
    const failedResources = new Set<string>()
    let hasConflict = false
    let hasFailure = false

    for (const descriptor of descriptors) {
      const meta = metaMap[descriptor.key]
      if (meta.saveTimer) {
        clearTimeout(meta.saveTimer)
        meta.saveTimer = null
      }
    }

    for (const descriptor of descriptors) {
      const result = await saveSharedResource(descriptor.key, true)
      if (!result) {
        hasFailure = true
        if (metaMap[descriptor.key].hasConflict) {
          hasConflict = true
        }
        failedResources.add(descriptor.resourceName)
        if (blockOnError) {
          break
        }
      }
    }

    return {
      success: !hasFailure,
      hasConflict,
      hasFailure,
      failedResources: Array.from(failedResources),
    }
  }

  function queueAutoSave(key: SharedDescriptorKey) {
    const meta = metaMap[key]
    if (meta.saveTimer) {
      clearTimeout(meta.saveTimer)
    }
    meta.saveTimer = setTimeout(() => {
      meta.saveTimer = null
      saveSharedResource(key, true)
    }, AUTO_SAVE_DELAY_MS)
  }

  async function saveSharedResource(key: SharedDescriptorKey, silent = false) {
    const descriptor = descriptorMap[key]
    const meta = metaMap[key]
    if (!meta.isLoaded) return true

    const payload = descriptor.serialize()
    const serialized = stringifyPayload(payload)
    if (serialized === meta.lastSavedSerialized && !meta.saveTimer && !meta.isSaving) {
      return true
    }

    if (meta.isSaving && meta.savePromise) {
      return meta.savePromise
    }

    const request: PageSaveReqVO = {
      resourceId: meta.resourceId,
      resourceKey: descriptor.resourceKey,
      resourceName: descriptor.resourceName,
      resourceType: descriptor.resourceType,
      resourceScope: SHARED_RESOURCE_SCOPE,
      schemaJson: serialized,
      baseUpdateTime: meta.baseUpdateTime,
      forceOverride: false,
      sessionKey: options.getSessionKey?.() || '',
    }

    meta.isSaving = true
    meta.savePromise = saveDraft(request)
      .then((result) => {
        meta.resourceId = result.resourceId
        meta.baseUpdateTime = result.updateTime
        meta.lastSavedSerialized = serialized
        meta.hasConflict = false
        return true
      })
      .catch((error: any) => {
        meta.hasConflict = error?.code === PAGE_CONFLICT_CODE
        if (error?.code === PAGE_CONFLICT_CODE) {
          ElMessage.error(`${descriptor.resourceName} 保存冲突，请刷新页面后重试`)
        } else if (!silent) {
          ElMessage.error(error?.message || `${descriptor.resourceName} 保存失败`)
        } else {
          ElMessage.error(`${descriptor.resourceName} 自动保存失败`)
        }
        return false
      })
      .finally(() => {
        meta.isSaving = false
        meta.savePromise = null
      })

    return meta.savePromise
  }

  async function ensureSharedDraft(descriptor: SharedDescriptor<any>) {
    try {
      return await getDraft({
        resourceKey: descriptor.resourceKey,
        resourceType: descriptor.resourceType,
        resourceScope: SHARED_RESOURCE_SCOPE,
      })
    } catch (error: any) {
      if (error?.code !== PAGE_NOT_EXISTS_CODE) {
        throw error
      }
      return createPage({
        resourceKey: descriptor.resourceKey,
        resourceType: descriptor.resourceType,
        resourceScope: SHARED_RESOURCE_SCOPE,
        name: descriptor.resourceName,
        schemaJson: stringifyPayload(descriptor.defaultFactory()),
      })
    }
  }

  function parseSharedPayload<TPayload>(descriptor: SharedDescriptor<TPayload>, schemaJson?: string): TPayload {
    if (isBlankPayloadJson(schemaJson)) {
      return descriptor.defaultFactory()
    }

    try {
      const parsed = JSON.parse(schemaJson as string)
      if (!parsed || typeof parsed !== 'object') {
        return descriptor.defaultFactory()
      }
      return {
        ...descriptor.defaultFactory(),
        ...parsed,
      }
    } catch {
      return descriptor.defaultFactory()
    }
  }

  return {
    hasLoaded,
    isHydrating,
    hasPendingChanges,
    loadSharedDrafts,
    flushPendingSaves,
    saveSharedResource,
  }
}

function createMeta(): SharedResourceMeta {
  return {
    lastSavedSerialized: '',
    isLoaded: false,
    isSaving: false,
    hasConflict: false,
    saveTimer: null,
    savePromise: null,
  }
}
