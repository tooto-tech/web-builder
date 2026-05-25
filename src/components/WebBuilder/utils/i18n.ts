import type {
  WebBuilderI18nEntry,
  WebBuilderI18nReviewStatus,
  WebBuilderI18nEntryStatus,
  WebBuilderI18nField
} from '@/api/content/webbuilderI18n'

export const WB_I18N_KEY_ATTR = 'data-wb-i18n-key'
export const WB_I18N_SKIP_ATTR = 'data-wb-i18n-skip'

const TRANSLATION_ONLY_KEYS = new Set(['wbI18nTranslations', 'i18nTranslations', '__wbI18nPreview'])

const TRANSLATION_ONLY_ATTRS = new Set(['data-wb-i18n-locale', 'data-wb-i18n-translation'])

const ATTRIBUTE_FIELDS: Array<{ field: WebBuilderI18nField; attr: string }> = [
  { field: 'alt', attr: 'alt' },
  { field: 'title', attr: 'title' },
  { field: 'placeholder', attr: 'placeholder' },
  { field: 'aria-label', attr: 'aria-label' }
]

const PROP_FIELD_PREFIX = 'prop:'

const STRUCTURAL_COMPONENT_KEYS = new Set([
  'attributes',
  'components',
  'content',
  'style',
  'styles',
  'script',
  'script-props',
  'classes',
  'selectors',
  'traits',
  'toolbar',
  'type',
  'tagName',
  'void',
  'removable',
  'copyable',
  'selectable',
  'draggable',
  'droppable',
  'editable',
  'stylable',
  'unstylable'
])

const NON_PROJECT_CONFIG_KEYS = new Set([
  '_changing',
  '_events',
  '_listenId',
  '_listeners',
  '_pending',
  '_previousAttributes',
  'changed',
  'children',
  'collection',
  'delegate',
  'editor',
  'el',
  'em',
  'model',
  'models',
  'parent',
  'previousModels',
  'view',
  'views',
  '$el'
])

const MAX_CONFIG_SCAN_DEPTH = 12
const MAX_CONFIG_VALUE_COUNT = 200
const MAX_MODEL_KEY_SCAN_NODES = 3000
const MAX_PROJECT_SCAN_NODES = 12000

const MODEL_VISIBLE_CONFIG_KEYS = [
  'ariaLabel',
  'caption',
  'description',
  'emptyText',
  'errorMessage',
  'eyebrow',
  'heading',
  'label',
  'linkText',
  'placeholder',
  'subtitle',
  'successMessage',
  'summary',
  'text',
  'title',
  'buttonText',
  'ctaText',
  'submitText',
  'moreText'
]

const VISIBLE_KEY_PATTERN =
  /(ariaLabel|aria-label|alt|caption|description|emptyText|errorMessage|eyebrow|heading|label|linkText|name|placeholder|subtitle|successMessage|summary|text|title|buttonText|ctaText|submitText|moreText)$/i

const NON_TRANSLATABLE_KEY_PATTERN =
  /(url|href|src|path|route|resource|id|key|type|target|mode|sort|order|index|count|width|height|color|icon|image|file|mime|query|filter|code|class|style|css|js|html)$/i

const TEXT_NODE_TYPES = new Set(['textnode', '#text'])

const GENERATED_CHILD_TRANSLATION_OWNER_TYPES = new Set(['wb-image'])

const SEO_FIELDS: Array<{
  field: WebBuilderI18nField
  customKey: string
  legacyKey?: string
}> = [
  { field: 'seo.title', customKey: 'tdkTitle', legacyKey: 'title' },
  { field: 'seo.description', customKey: 'tdkDescription', legacyKey: 'description' },
  { field: 'seo.keywords', customKey: 'tdkKeywords', legacyKey: 'keywords' }
]

const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.models)) return value.models
  return []
}

const normalizeText = (value: unknown): string => `${value ?? ''}`.replace(/\s+/g, ' ').trim()

const isTruthyAttr = (value: unknown): boolean => /^(1|true|yes|on)$/i.test(`${value ?? ''}`.trim())

const isNoTranslateAttr = (value: unknown): boolean => /^no$/i.test(`${value ?? ''}`.trim())

const isCopyrightNotice = (value: string): boolean => {
  const normalized = normalizeText(value)
  if (!normalized) return false
  return (
    /(?:^|\s)(?:©|\(c\)|copyright)\s*\d{4}/i.test(normalized) ||
    /\ball rights reserved\b/i.test(normalized) ||
    /\bdesigned and developed by\b/i.test(normalized)
  )
}

const isNonTranslatableLiteral = (value: string): boolean => {
  const normalized = normalizeText(value)
  if (!normalized) return false
  if (!/[\p{L}\p{N}]/u.test(normalized)) return true
  if (isCopyrightNotice(normalized)) return true
  if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/|\.\/|#)/i.test(normalized)) return true
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(normalized)) return true
  if (/^\+?[\d\s().-]{6,}$/.test(normalized)) return true
  return false
}

export const isIdentityTranslationAllowed = (source: unknown): boolean => {
  const normalized = normalizeText(source)
  if (!normalized) return false
  if (isNonTranslatableLiteral(normalized)) return true
  let hasLetter = false
  let hasLowercase = false
  for (const char of normalized) {
    if (!/\p{L}/u.test(char)) continue
    hasLetter = true
    if (char.toLocaleLowerCase() === char && char.toLocaleUpperCase() !== char) {
      hasLowercase = true
    }
  }
  if (!hasLetter) return true
  if (hasLowercase) return false
  return /^[A-Z0-9][A-Z0-9\s+\-_/&.()]*$/.test(normalized)
}

export const isUnchangedNonIdentityTranslation = (
  source: unknown,
  translation: unknown
): boolean => {
  const normalizedSource = normalizeText(source)
  const normalizedTranslation = normalizeText(translation)
  if (!normalizedSource || !normalizedTranslation) return false
  return (
    normalizedSource.toLocaleLowerCase() === normalizedTranslation.toLocaleLowerCase() &&
    !isIdentityTranslationAllowed(normalizedSource)
  )
}

const isExplicitTranslatedIdentity = (
  source: Pick<WebBuilderI18nEntry, 'sourceHash'> & Partial<Pick<WebBuilderI18nEntry, 'source'>>,
  saved?: Pick<WebBuilderI18nEntry, 'sourceHash' | 'translation' | 'status'> | null
): boolean =>
  saved?.status === 'translated' &&
  (!saved.sourceHash || saved.sourceHash === source.sourceHash) &&
  isUnchangedNonIdentityTranslation(source.source, saved.translation)

const hasHtmlTag = (value: string): boolean => /<[a-z][\s\S]*>/i.test(value)

const encodePropPath = (segments: Array<string | number>): string =>
  segments.map((segment) => encodeURIComponent(String(segment))).join('/')

const decodePropPath = (path: string): Array<string | number> =>
  path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      const decoded = decodeURIComponent(segment)
      return /^\d+$/.test(decoded) ? Number(decoded) : decoded
    })

const makePropField = (segments: Array<string | number>): WebBuilderI18nField =>
  `${PROP_FIELD_PREFIX}${encodePropPath(segments)}` as WebBuilderI18nField

const isPropField = (field: WebBuilderI18nField): boolean =>
  `${field}`.startsWith(PROP_FIELD_PREFIX)

const entryId = (entry: Pick<WebBuilderI18nEntry, 'key' | 'field'>) =>
  `${entry.key}::${entry.field}`

export const getWebBuilderI18nEntryId = entryId

export const hashI18nSource = (source: string): string => {
  let hash = 2166136261
  const normalized = `${source ?? ''}`
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const makeKey = (seed: string): string => `wb_${hashI18nSource(seed)}`

const clonePlain = <T>(value: T): T => JSON.parse(JSON.stringify(value ?? null))

const getComponentAttrs = (component: any): Record<string, any> => {
  return (
    component?.getAttributes?.() ?? component?.get?.('attributes') ?? component?.attributes ?? {}
  )
}

const setComponentAttrs = (component: any, attrs: Record<string, any>) => {
  if (component?.addAttributes) {
    component.addAttributes(attrs)
    return
  }
  const current = getComponentAttrs(component)
  component?.set?.('attributes', { ...current, ...attrs })
}

const removeComponentAttrs = (component: any, attrs: string[]) => {
  if (component?.removeAttributes) {
    component.removeAttributes(attrs)
    return
  }
  const current = getComponentAttrs(component)
  const next = { ...current }
  attrs.forEach((attr) => {
    delete next[attr]
  })
  if (component?.set) {
    component.set('attributes', next)
    return
  }
  attrs.forEach((attr) => {
    delete current[attr]
  })
}

const getModelChildren = (component: any): any[] => {
  const children = component?.components?.() ?? component?.get?.('components') ?? []
  return toArray(children)
}

const getModelParent = (component: any): any => {
  if (!component || typeof component !== 'object') return null
  return component.parent?.() ?? component.collection?.parent ?? component.get?.('parent') ?? null
}

const getProjectChildren = (component: any): any[] => {
  return Array.isArray(component?.components) ? component.components : []
}

const getComponentType = (component: any): string => {
  return `${component?.get?.('type') ?? component?.type ?? component?.tagName ?? ''}`.trim()
}

const isTextNodeComponent = (component: any): boolean =>
  TEXT_NODE_TYPES.has(getComponentType(component).toLowerCase())

const ownsGeneratedTranslatableChildren = (component: any): boolean =>
  GENERATED_CHILD_TRANSLATION_OWNER_TYPES.has(getComponentType(component))

const isI18nSkippedAttrs = (attrs: Record<string, any> | null | undefined): boolean => {
  if (!attrs || typeof attrs !== 'object') return false
  return (
    isTruthyAttr(attrs[WB_I18N_SKIP_ATTR]) ||
    isNoTranslateAttr(attrs.translate) ||
    `${attrs.class ?? ''}`.split(/\s+/).includes('notranslate')
  )
}

const isModelNodeI18nSkipped = (component: any): boolean =>
  isI18nSkippedAttrs(getComponentAttrs(component))

const isProjectNodeI18nSkipped = (component: any): boolean =>
  isI18nSkippedAttrs(component?.attributes ?? {})

const getModelI18nControlTarget = (component: any): any => {
  if (!component || typeof component !== 'object') return null
  if (!isTextNodeComponent(component)) return component
  return getModelParent(component) ?? component
}

export const isModelI18nSkipped = (component: any): boolean => {
  let current = component
  let depth = 0
  while (current && typeof current === 'object' && depth < 20) {
    if (isModelNodeI18nSkipped(current)) return true
    current = getModelParent(current)
    depth += 1
  }
  return false
}

export const setModelI18nSkipped = (component: any, skipped: boolean): boolean => {
  const target = getModelI18nControlTarget(component)
  if (!target) return false
  if (skipped) {
    setComponentAttrs(target, {
      [WB_I18N_SKIP_ATTR]: 'true',
      translate: 'no'
    })
  } else {
    removeComponentAttrs(target, [WB_I18N_SKIP_ATTR])
    if (isNoTranslateAttr(getComponentAttrs(target).translate)) {
      removeComponentAttrs(target, ['translate'])
    }
  }
  return true
}

const getComponentLabel = (component: any): string => {
  const attrs = getComponentAttrs(component)
  return (
    `${component?.get?.('name') ?? component?.name ?? ''}`.trim() ||
    `${attrs.class ?? attrs.id ?? getComponentType(component) ?? 'Component'}`.trim()
  )
}

const getDirectTextSourceFromModel = (component: any): string => {
  const content = component?.get?.('content')
  if (typeof content === 'string' && normalizeText(content)) return content

  const children = component?.get?.('components')
  if (typeof children === 'string' && normalizeText(children)) return children

  return ''
}

const getDirectTextSourceFromProject = (component: any): string => {
  if (typeof component?.content === 'string' && normalizeText(component.content)) {
    return component.content
  }
  if (typeof component?.components === 'string' && normalizeText(component.components)) {
    return component.components
  }
  return ''
}

const isLikelyTranslatableConfigString = (value: string): boolean => {
  const normalized = normalizeText(value)
  if (!normalized) return false
  if (/^#(?:[0-9a-f]{3,8})$/i.test(normalized)) return false
  if (isNonTranslatableLiteral(normalized)) return false
  if (/^<svg[\s>]/i.test(normalized)) return false
  if (/^[\w-]+\/[\w./-]+$/.test(normalized)) return false
  if (/^\{\{[\s\S]*\}\}$/.test(normalized)) return false
  if (/^[\d\s.,:%+*/()[\]-]+$/.test(normalized)) return false
  return true
}

const isVisibleConfigKey = (key: string, path: Array<string | number>): boolean => {
  if (!VISIBLE_KEY_PATTERN.test(key)) return false
  if (
    NON_TRANSLATABLE_KEY_PATTERN.test(key) &&
    !/(alt|ariaLabel|aria-label|label|name|placeholder|text|title|description)$/i.test(key)
  ) {
    return false
  }

  // Top-level component `name` is usually an editor label, not published text.
  if (path.length === 1 && key === 'name') return false
  return true
}

const collectVisibleConfigValues = (
  value: any,
  basePath: Array<string | number> = [],
  result: Array<{ field: WebBuilderI18nField; source: string; label: string }> = [],
  seen: WeakSet<object> = new WeakSet()
): Array<{ field: WebBuilderI18nField; source: string; label: string }> => {
  if (basePath.length > MAX_CONFIG_SCAN_DEPTH) return result
  if (result.length >= MAX_CONFIG_VALUE_COUNT) return result

  if (Array.isArray(value)) {
    if (seen.has(value)) return result
    seen.add(value)
    value.some((item, index) => {
      collectVisibleConfigValues(item, [...basePath, index], result, seen)
      return result.length >= MAX_CONFIG_VALUE_COUNT
    })
    return result
  }
  if (!value || typeof value !== 'object') return result
  if (seen.has(value)) return result
  seen.add(value)

  Object.entries(value).some(([key, childValue]) => {
    if (STRUCTURAL_COMPONENT_KEYS.has(key)) return
    if (NON_PROJECT_CONFIG_KEYS.has(key)) return
    const path = [...basePath, key]

    if (typeof childValue === 'string') {
      if (isVisibleConfigKey(key, path) && isLikelyTranslatableConfigString(childValue)) {
        result.push({
          field: makePropField(path),
          source: childValue,
          label: path.map(String).join(' > ')
        })
      }
      return result.length >= MAX_CONFIG_VALUE_COUNT
    }

    if (childValue && typeof childValue === 'object') {
      collectVisibleConfigValues(childValue, path, result, seen)
    }
    return result.length >= MAX_CONFIG_VALUE_COUNT
  })

  return result
}

const hasVisibleModelConfigString = (component: any): boolean =>
  MODEL_VISIBLE_CONFIG_KEYS.some((key) => {
    const value = component?.get?.(key)
    return (
      typeof value === 'string' &&
      isVisibleConfigKey(key, [key]) &&
      isLikelyTranslatableConfigString(value)
    )
  })

const isComponentTranslatableModel = (component: any): boolean => {
  if (isModelI18nSkipped(component)) return false
  if (isTextNodeComponent(component)) return false
  const attrs = getComponentAttrs(component)
  if (ATTRIBUTE_FIELDS.some(({ attr }) => normalizeText(attrs[attr]))) return true
  if (hasVisibleModelConfigString(component)) return true
  if (
    getModelChildren(component).some(
      (child) => isTextNodeComponent(child) && normalizeText(getDirectTextSourceFromModel(child))
    )
  ) {
    return true
  }
  return Boolean(normalizeText(getDirectTextSourceFromModel(component)))
}

export const collectI18nKeysFromModel = (
  component: any,
  options: { includeAncestors?: boolean } = {}
): Set<string> => {
  const keys = new Set<string>()
  const seen = new WeakSet<object>()
  let scannedNodes = 0
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (seen.has(node) || scannedNodes >= MAX_MODEL_KEY_SCAN_NODES) return
    seen.add(node)
    scannedNodes += 1

    if (isModelNodeI18nSkipped(node)) return
    const key = `${getComponentAttrs(node)[WB_I18N_KEY_ATTR] ?? ''}`.trim()
    if (key) keys.add(key)
    getModelChildren(node).forEach(walk)
  }
  if (component) {
    if (isModelI18nSkipped(component)) return keys
    walk(component)
    if (options.includeAncestors && !keys.size) {
      let current = component
      let depth = 0
      while (current && typeof current === 'object' && depth < 20) {
        const key = `${getComponentAttrs(current)[WB_I18N_KEY_ATTR] ?? ''}`.trim()
        if (isModelNodeI18nSkipped(current)) break
        if (key) {
          keys.add(key)
          break
        }
        current = getModelParent(current)
        depth += 1
      }
    }
  }
  return keys
}

export const ensureModelI18nKeys = (editor: any): string[] => {
  const changed: string[] = []
  const used = new Set<string>()
  const seen = new WeakSet<object>()
  let scannedNodes = 0

  const ensureNode = (component: any, path: string) => {
    if (!component || typeof component !== 'object') return
    if (seen.has(component) || scannedNodes >= MAX_MODEL_KEY_SCAN_NODES) return
    seen.add(component)
    scannedNodes += 1
    if (isModelNodeI18nSkipped(component)) return

    const attrs = getComponentAttrs(component)
    const current = `${attrs[WB_I18N_KEY_ATTR] ?? ''}`.trim()
    const needsKey = isComponentTranslatableModel(component)
    let nextKey = current

    if (needsKey && (!nextKey || used.has(nextKey))) {
      const seed = [
        path,
        getComponentType(component),
        getComponentLabel(component),
        getDirectTextSourceFromModel(component)
      ].join('|')
      let candidate = makeKey(seed)
      let index = 1
      while (used.has(candidate)) {
        candidate = `${makeKey(seed)}_${index}`
        index += 1
      }
      nextKey = candidate
      setComponentAttrs(component, { [WB_I18N_KEY_ATTR]: nextKey })
      changed.push(nextKey)
    }

    if (nextKey) used.add(nextKey)
    if (ownsGeneratedTranslatableChildren(component)) return
    getModelChildren(component).forEach((child, index) => ensureNode(child, `${path}.${index}`))
  }

  const pages = toArray(editor?.Pages?.getAll?.())
  if (pages.length) {
    pages.forEach((page, pageIndex) => {
      const pageId = `${page?.get?.('id') ?? page?.id ?? pageIndex}`.trim()
      const root = page?.getMainComponent?.()
      ensureNode(root, `page:${pageId}`)
    })
    return changed
  }

  ensureNode(editor?.getWrapper?.(), 'wrapper')
  return changed
}

const pushEntry = (
  entries: WebBuilderI18nEntry[],
  usedIds: Set<string>,
  entry: Omit<WebBuilderI18nEntry, 'sourceHash'>
) => {
  const source = `${entry.source ?? ''}`
  if (!isLikelyTranslatableConfigString(source)) return

  const next: WebBuilderI18nEntry = {
    ...entry,
    source,
    sourceHash: hashI18nSource(source)
  }
  const id = entryId(next)
  if (usedIds.has(id)) return
  usedIds.add(id)
  entries.push(next)
}

const extractPageSeoEntries = (page: any, entries: WebBuilderI18nEntry[], usedIds: Set<string>) => {
  const pageId = `${page?.id ?? page?.get?.('id') ?? ''}`.trim() || 'page'
  const custom = page?.custom ?? page?.get?.('custom') ?? {}
  const tdk = custom?.tdk ?? {}
  const label = `${page?.name ?? page?.get?.('name') ?? pageId}`.trim()

  SEO_FIELDS.forEach(({ field, customKey, legacyKey }) => {
    const source = `${custom?.[customKey] ?? (legacyKey ? tdk?.[legacyKey] : '') ?? ''}`.trim()
    pushEntry(entries, usedIds, {
      key: `page:${pageId}:seo`,
      field,
      source,
      pageId,
      componentType: 'page-seo',
      label: label ? `${label} SEO` : 'Page SEO'
    })
  })
}

const extractProjectComponentEntries = (
  component: any,
  entries: WebBuilderI18nEntry[],
  usedIds: Set<string>,
  pageId: string,
  path: string,
  context: { seen: WeakSet<object>; scannedNodes: number }
) => {
  if (!component || typeof component !== 'object') return
  if (context.seen.has(component) || context.scannedNodes >= MAX_PROJECT_SCAN_NODES) return
  context.seen.add(component)
  context.scannedNodes += 1

  if (isProjectNodeI18nSkipped(component)) return
  if (isTextNodeComponent(component)) return
  const attrs = component.attributes ?? {}
  const source = getDirectTextSourceFromProject(component)
  const fallbackSeed = [pageId, path, component.type, component.tagName, source].join('|')
  const key = `${attrs[WB_I18N_KEY_ATTR] ?? ''}`.trim() || makeKey(fallbackSeed)
  const componentType = `${component.type ?? component.tagName ?? ''}`.trim()
  const label =
    `${component.name ?? attrs.class ?? attrs.id ?? componentType ?? 'Component'}`.trim()

  const textField: WebBuilderI18nField = hasHtmlTag(source) ? 'html' : 'text'
  pushEntry(entries, usedIds, {
    key,
    field: textField,
    source,
    pageId,
    componentType,
    label
  })

  ATTRIBUTE_FIELDS.forEach(({ field, attr }) => {
    pushEntry(entries, usedIds, {
      key,
      field,
      source: `${attrs[attr] ?? ''}`,
      pageId,
      componentType,
      label
    })
  })

  collectVisibleConfigValues(component).forEach((configEntry) => {
    pushEntry(entries, usedIds, {
      key,
      field: configEntry.field,
      source: configEntry.source,
      pageId,
      componentType,
      label: label ? `${label} ${configEntry.label}` : configEntry.label
    })
  })

  if (ownsGeneratedTranslatableChildren(component)) return

  getProjectChildren(component).forEach((child, index) => {
    if (isTextNodeComponent(child)) {
      const childSource = getDirectTextSourceFromProject(child)
      const propKey = typeof child?.content === 'string' ? 'content' : 'components'
      pushEntry(entries, usedIds, {
        key,
        field: makePropField(['components', index, propKey]),
        source: childSource,
        pageId,
        componentType,
        label: label ? `${label} text` : 'Text'
      })
      return
    }
    extractProjectComponentEntries(child, entries, usedIds, pageId, `${path}.${index}`, context)
  })
}

export const extractI18nEntriesFromProjectData = (projectData: Record<string, any> | null) => {
  const entries: WebBuilderI18nEntry[] = []
  const usedIds = new Set<string>()
  const pages = Array.isArray(projectData?.pages) ? projectData?.pages : []
  const context = { seen: new WeakSet<object>(), scannedNodes: 0 }

  pages.forEach((page: any, pageIndex: number) => {
    const pageId = `${page?.id ?? pageIndex}`.trim()
    extractPageSeoEntries(page, entries, usedIds)
    const frames = Array.isArray(page?.frames) ? page.frames : []
    frames.forEach((frame: any, frameIndex: number) => {
      const components = Array.isArray(frame?.component?.components)
        ? frame.component.components
        : Array.isArray(frame?.components)
          ? frame.components
          : []
      components.forEach((component: any, index: number) => {
        extractProjectComponentEntries(
          component,
          entries,
          usedIds,
          pageId,
          `page.${pageIndex}.frame.${frameIndex}.${index}`,
          context
        )
      })
    })
  })

  if (!pages.length) {
    const components = Array.isArray(projectData?.components) ? projectData?.components : []
    components.forEach((component: any, index: number) => {
      extractProjectComponentEntries(
        component,
        entries,
        usedIds,
        'default',
        `root.${index}`,
        context
      )
    })
  }

  return entries
}

const stripNodeTranslationData = (node: any): any => {
  if (Array.isArray(node)) return node.map(stripNodeTranslationData)
  if (!node || typeof node !== 'object') return node

  const next: Record<string, any> = {}
  Object.entries(node).forEach(([key, value]) => {
    if (TRANSLATION_ONLY_KEYS.has(key)) return
    if (key === 'attributes' && value && typeof value === 'object' && !Array.isArray(value)) {
      next.attributes = Object.fromEntries(
        Object.entries(value).filter(([attr]) => !TRANSLATION_ONLY_ATTRS.has(attr))
      )
      return
    }
    next[key] = stripNodeTranslationData(value)
  })
  return next
}

export const stripI18nTranslationsFromProjectData = <T extends Record<string, any> | null>(
  projectData: T
): T => {
  return stripNodeTranslationData(clonePlain(projectData)) as T
}

const buildTranslationMap = (entries: WebBuilderI18nEntry[]) => {
  const map = new Map<string, WebBuilderI18nEntry>()
  entries.forEach((entry) => {
    if (normalizeText(entry.translation)) map.set(entryId(entry), entry)
  })
  return map
}

const setComponentPropByField = (
  component: Record<string, any>,
  field: WebBuilderI18nField,
  translation: string
) => {
  const rawField = `${field}`
  if (!rawField.startsWith(PROP_FIELD_PREFIX)) return
  const path = decodePropPath(rawField.slice(PROP_FIELD_PREFIX.length))
  if (!path.length) return

  let target: any = component
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index]
    if (target == null || typeof target !== 'object') return
    target = target[segment as any]
  }

  const leaf = path[path.length - 1]
  if (target != null && typeof target === 'object' && typeof target[leaf as any] === 'string') {
    target[leaf as any] = translation
  }
}

const syncGeneratedWbImageAlt = (component: Record<string, any>, alt: string) => {
  if (getComponentType(component) !== 'wb-image') return

  const updateImageNode = (node: any): boolean => {
    if (!node || typeof node !== 'object') return false
    if (`${node.tagName ?? node.type ?? ''}`.toLowerCase() === 'img') {
      node.attributes = {
        ...(node.attributes ?? {}),
        alt
      }
      return true
    }
    return getProjectChildren(node).some(updateImageNode)
  }

  getProjectChildren(component).some(updateImageNode)
}

const applyTranslatedEntry = (
  component: any,
  key: string,
  map: Map<string, WebBuilderI18nEntry>
) => {
  const applyField = (field: WebBuilderI18nField) => {
    const translation = map.get(`${key}::${field}`)?.translation
    return translation === undefined ? undefined : translation
  }

  const text = applyField('text') ?? applyField('html')
  if (text !== undefined) {
    if (typeof component.content === 'string') component.content = text
    else if (typeof component.components === 'string') component.components = text
  }

  ATTRIBUTE_FIELDS.forEach(({ field, attr }) => {
    const translation = applyField(field)
    if (translation === undefined) return
    component.attributes = {
      ...(component.attributes ?? {}),
      [attr]: translation
    }
  })

  Array.from(map.values())
    .filter((entry) => entry.key === key && isPropField(entry.field))
    .forEach((entry) => {
      const translation = `${entry.translation ?? ''}`
      if (!normalizeText(translation)) return
      setComponentPropByField(component, entry.field, translation)
      if (entry.field === 'prop:imageAlt') {
        syncGeneratedWbImageAlt(component, translation)
      }
    })
}

const applyProjectComponentTranslations = (
  component: any,
  map: Map<string, WebBuilderI18nEntry>
) => {
  if (!component || typeof component !== 'object') return
  if (isProjectNodeI18nSkipped(component)) return
  const key = `${component.attributes?.[WB_I18N_KEY_ATTR] ?? ''}`.trim()
  if (key) applyTranslatedEntry(component, key, map)
  getProjectChildren(component).forEach((child) => applyProjectComponentTranslations(child, map))
}

const applyPageSeoTranslations = (page: any, map: Map<string, WebBuilderI18nEntry>) => {
  const pageId = `${page?.id ?? ''}`.trim() || 'page'
  const key = `page:${pageId}:seo`
  const custom = { ...(page.custom ?? {}) }
  const tdk = { ...(custom.tdk ?? {}) }

  SEO_FIELDS.forEach(({ field, customKey, legacyKey }) => {
    const translation = map.get(`${key}::${field}`)?.translation
    if (translation === undefined) return
    custom[customKey] = translation
    if (legacyKey) tdk[legacyKey] = translation
  })

  page.custom = { ...custom, tdk }
}

export const applyI18nTranslationsToProjectData = (
  projectData: Record<string, any> | null,
  entries: WebBuilderI18nEntry[]
): Record<string, any> | null => {
  const next = stripI18nTranslationsFromProjectData(projectData)
  const map = buildTranslationMap(entries)
  if (!next || !map.size) return next

  const pages = Array.isArray(next.pages) ? next.pages : []
  pages.forEach((page: any) => {
    applyPageSeoTranslations(page, map)
    const frames = Array.isArray(page?.frames) ? page.frames : []
    frames.forEach((frame: any) => {
      const components = Array.isArray(frame?.component?.components)
        ? frame.component.components
        : Array.isArray(frame?.components)
          ? frame.components
          : []
      components.forEach((component: any) => applyProjectComponentTranslations(component, map))
    })
  })

  if (!pages.length && Array.isArray(next.components)) {
    next.components.forEach((component: any) => applyProjectComponentTranslations(component, map))
  }

  return next
}

export const resolveI18nEntryStatus = (
  source: Pick<WebBuilderI18nEntry, 'sourceHash'> & Partial<Pick<WebBuilderI18nEntry, 'source'>>,
  saved?: Pick<WebBuilderI18nEntry, 'sourceHash' | 'translation' | 'status'> | null
): WebBuilderI18nEntryStatus => {
  if (!normalizeText(saved?.translation)) return 'missing'
  if (
    isUnchangedNonIdentityTranslation(source.source, saved?.translation) &&
    !isExplicitTranslatedIdentity(source, saved)
  ) {
    return 'missing'
  }
  if (saved?.sourceHash && saved.sourceHash !== source.sourceHash) return 'stale'
  return 'translated'
}

export const resolveI18nReviewStatus = (
  source: Pick<WebBuilderI18nEntry, 'sourceHash'>,
  saved?: Pick<WebBuilderI18nEntry, 'sourceHash' | 'translation' | 'status' | 'reviewStatus'> | null
): WebBuilderI18nReviewStatus | undefined => {
  const status = resolveI18nEntryStatus(source, saved)
  if (status === 'missing') return undefined
  return 'reviewed'
}

export const mergeI18nEntries = (
  sourceEntries: WebBuilderI18nEntry[],
  savedEntries: WebBuilderI18nEntry[]
): WebBuilderI18nEntry[] => {
  const savedMap = new Map(savedEntries.map((entry) => [entryId(entry), entry]))
  return sourceEntries.map((source) => {
    const saved = savedMap.get(entryId(source))
    const status = resolveI18nEntryStatus(source, saved)
    const translation =
      isUnchangedNonIdentityTranslation(source.source, saved?.translation) &&
      !isExplicitTranslatedIdentity(source, saved)
        ? ''
        : (saved?.translation ?? '')
    return {
      ...source,
      translation,
      status,
      translationOrigin: saved?.translationOrigin,
      reviewStatus: resolveI18nReviewStatus(source, saved),
      translatedAt: saved?.translatedAt,
      reviewedAt: saved?.reviewedAt
    }
  })
}
