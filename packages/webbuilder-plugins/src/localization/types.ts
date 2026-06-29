import type { PageResourceIdentity } from '@toototech/webbuilder/core'

export type WebBuilderI18nField =
  | 'text'
  | 'html'
  | 'alt'
  | 'title'
  | 'placeholder'
  | 'aria-label'
  | 'seo.title'
  | 'seo.description'
  | 'seo.keywords'
  | `attr:${string}`
  | `prop:${string}`

export type WebBuilderI18nEntryStatus =
  | 'translated'
  | 'missing'
  | 'stale'
  | 'pending'
  | 'source_changed'
  | 'draft'
  | 'empty'
  | 'error'

export type WebBuilderI18nTranslationOrigin = 'machine' | 'manual'

export type WebBuilderI18nReviewStatus = 'pending_review' | 'reviewed'

export interface WebBuilderI18nEntry {
  key: string
  field: WebBuilderI18nField
  source: string
  sourceHash: string
  translation?: string
  status?: WebBuilderI18nEntryStatus
  translationOrigin?: WebBuilderI18nTranslationOrigin
  reviewStatus?: WebBuilderI18nReviewStatus
  translatedAt?: Date | string
  reviewedAt?: Date | string
  pageId?: string
  componentType?: string
  label?: string
}

export interface WebBuilderI18nBundleReq extends PageResourceIdentity {
  locale: string
  sourceLocale?: string
}

export interface WebBuilderI18nBundleResp extends PageResourceIdentity {
  locale: string
  sourceLocale?: string
  entries: WebBuilderI18nEntry[]
  updateTime?: Date | string
}

export interface WebBuilderI18nSaveBundleReq extends WebBuilderI18nBundleReq {
  entries: WebBuilderI18nEntry[]
  partial?: boolean
}

export interface WebBuilderI18nTranslateReq extends WebBuilderI18nBundleReq {
  entries: WebBuilderI18nEntry[]
  provider?: string
  engine?: string
}

export interface WebBuilderI18nTranslateResp {
  success?: boolean
  errorMessage?: string
  entries?: WebBuilderI18nEntry[]
}

export interface WebBuilderI18nAutoTranslateReq extends WebBuilderI18nBundleReq {
  entries: WebBuilderI18nEntry[]
  locales?: string[]
  provider?: string
  engine?: string
  publishReady?: boolean
}

export interface WebBuilderI18nAutoTranslateResp extends PageResourceIdentity {
  success?: boolean
  errorMessage?: string
  translatedCount?: number
  skippedCount?: number
  failedCount?: number
  locales?: Array<{
    locale: string
    languageId?: number
    total?: number
    translated?: number
    skipped?: number
    failed?: number
    errorMessage?: string
  }>
}

export interface WebBuilderI18nLanguageRecord {
  id?: number
  name?: string
  code?: string
  slug?: string
  sortOrder?: number
  status?: number
  defaultLang?: number
  createTime?: Date | string
}

export interface WebBuilderTranslationProviderConfig {
  id?: number
  engineType?: string
  model?: string
  endpoint?: string
  apiKey?: string
  apiType?: string
  apiEndpoint?: string
  status?: number
  config?: Record<string, unknown> | string
  usageCount?: number
  characterCount?: number
  createTime?: string
  updateTime?: string
}

export interface WebBuilderI18nHostService {
  loadBundle?: (
    context: WebBuilderI18nBundleReq
  ) => Promise<WebBuilderI18nBundleResp | null> | WebBuilderI18nBundleResp | null
  saveBundle?: (
    context: WebBuilderI18nSaveBundleReq
  ) => Promise<WebBuilderI18nBundleResp | null> | WebBuilderI18nBundleResp | null
  translateEntries?: (
    context: WebBuilderI18nTranslateReq
  ) => Promise<WebBuilderI18nTranslateResp | null> | WebBuilderI18nTranslateResp | null
  autoTranslateEntries?: (
    context: WebBuilderI18nAutoTranslateReq
  ) =>
    | Promise<WebBuilderI18nAutoTranslateResp | null>
    | WebBuilderI18nAutoTranslateResp
    | null
  getEnabledLanguages?: () => Promise<WebBuilderI18nLanguageRecord[]> | WebBuilderI18nLanguageRecord[]
  getTranslationConfig?: () => Promise<unknown> | unknown
  getEnabledProviderConfigs?: () =>
    | Promise<WebBuilderTranslationProviderConfig[]>
    | WebBuilderTranslationProviderConfig[]
}
