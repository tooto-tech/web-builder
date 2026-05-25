import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'
import type { PageResourceIdentity } from '@/api/content/page'

export type WebBuilderI18nField =
  | 'componentLabel'
  | 'componentText'
  | 'traitValue'
  | 'html'
  | 'css'
  | string
export type WebBuilderI18nEntryStatus = 'new' | 'changed' | 'unchanged' | 'removed' | string
export type WebBuilderI18nTranslationOrigin = 'machine' | 'manual'
export type WebBuilderI18nReviewStatus = 'pending_review' | 'reviewed'

export interface WebBuilderI18nEntry extends ApiRecord {
  id?: string
  field?: WebBuilderI18nField
  sourceText?: string
  translatedText?: string
}

export interface WebBuilderI18nBundleReq extends PageResourceIdentity {
  language?: string
}

export interface WebBuilderI18nBundleResp extends PageResourceIdentity {
  entries?: WebBuilderI18nEntry[]
  [key: string]: any
}

export interface WebBuilderI18nSaveBundleReq extends WebBuilderI18nBundleReq {
  entries?: WebBuilderI18nEntry[]
}

export interface WebBuilderI18nStatusResp extends PageResourceIdentity {
  [key: string]: any
}

export interface WebBuilderI18nTranslateReq extends WebBuilderI18nBundleReq {
  entries?: WebBuilderI18nEntry[]
}

export interface WebBuilderI18nTranslateResp {
  entries?: WebBuilderI18nEntry[]
  [key: string]: any
}

export interface WebBuilderI18nAutoTranslateReq extends WebBuilderI18nBundleReq {
  entries?: WebBuilderI18nEntry[]
}

export interface WebBuilderI18nAutoTranslateResp extends PageResourceIdentity {
  entries?: WebBuilderI18nEntry[]
  [key: string]: any
}

const callI18n = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('webbuilderI18n', method, ...args)

export const getBundle = (params: WebBuilderI18nBundleReq) =>
  callI18n<Promise<WebBuilderI18nBundleResp>>('getBundle', params)
export const saveBundle = (data: WebBuilderI18nSaveBundleReq) =>
  callI18n<Promise<WebBuilderI18nBundleResp>>('saveBundle', data)
export const getBundleStatus = (params: PageResourceIdentity) =>
  callI18n<Promise<WebBuilderI18nStatusResp>>('getBundleStatus', params)
export const translateEntries = (data: WebBuilderI18nTranslateReq) =>
  callI18n<Promise<WebBuilderI18nTranslateResp>>('translateEntries', data)
export const autoTranslateEntries = (data: WebBuilderI18nAutoTranslateReq) =>
  callI18n<Promise<WebBuilderI18nAutoTranslateResp>>('autoTranslateEntries', data)
