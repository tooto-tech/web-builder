import { callTranslationAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export type TranslationEngineType = string

export interface TranslationProviderConfig {
  endpoint?: string
  apiType?: string
  [key: string]: unknown
}

export interface TranslationConfigVO extends ApiRecord {
  id?: number
  engineType: TranslationEngineType
  status: number
}

export interface TranslationConfigPageReqVO extends ApiRecord {}

export interface TranslationConfigPageResult {
  list: TranslationConfigVO[]
  total: number
}

export interface TranslationConfigSaveReqVO extends ApiRecord {
  engineType: TranslationEngineType
  status: number
}

const callConfig = <T = unknown>(method: string, ...args: any[]): T =>
  callTranslationAdapter<T>('config', method, ...args)

export const TranslationConfigApi = {
  createConfig: (data: TranslationConfigSaveReqVO) => callConfig('createConfig', data),
  updateConfig: (data: TranslationConfigSaveReqVO) => callConfig('updateConfig', data),
  deleteConfig: (id: number) => callConfig('deleteConfig', id),
  getConfig: () => callConfig<Promise<TranslationConfigVO | null>>('getConfig'),
  getConfigPage: (params: TranslationConfigPageReqVO) =>
    callConfig<Promise<TranslationConfigPageResult>>('getConfigPage', params),
  getEnabledConfigs: () => callConfig<Promise<TranslationConfigVO[]>>('getEnabledConfigs'),
  testConnection: (data: TranslationConfigSaveReqVO) => callConfig('testConnection', data)
}
