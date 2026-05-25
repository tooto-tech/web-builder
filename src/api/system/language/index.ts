import { callSystemAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface LanguageVO extends ApiRecord {
  id?: number
  code?: string
  locale?: string
  name?: string
}

const callLanguage = <T = unknown>(method: string, ...args: any[]): T =>
  callSystemAdapter<T>('language', method, ...args)

export const getLanguagePage = (params: ApiRecord) =>
  callLanguage<Promise<PageResult<LanguageVO>>>('getLanguagePage', params)
export const getLanguage = (id: number) => callLanguage<Promise<LanguageVO>>('getLanguage', id)
export const createLanguage = (data: LanguageVO) => callLanguage('createLanguage', data)
export const updateLanguage = (data: LanguageVO) => callLanguage('updateLanguage', data)
export const deleteLanguage = (id: number) => callLanguage('deleteLanguage', id)
export const deleteLanguageList = (ids: number[]) => callLanguage('deleteLanguageList', ids)
export const getLanguageList = () => callLanguage<Promise<LanguageVO[]>>('getLanguageList')
export const getEnabledLanguageList = () =>
  callLanguage<Promise<LanguageVO[]>>('getEnabledLanguageList')
