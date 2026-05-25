import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface MediaResourceContentVO extends ApiRecord {}
export interface MediaResourceItemVO extends ApiRecord {}
export interface MediaResourceVO extends ApiRecord {
  id?: number
  name?: string
  contents?: MediaResourceContentVO[]
}

const callMediaResource = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('mediaResource', method, ...args)

export const getMediaResourcePage = (params: any) =>
  callMediaResource<Promise<PageResult<MediaResourceVO>>>('getMediaResourcePage', params)
export const getMediaResource = (id: number) =>
  callMediaResource<Promise<MediaResourceVO>>('getMediaResource', id)
export const getMediaResourceDetail = (id: number, language?: string) =>
  callMediaResource<Promise<MediaResourceVO>>('getMediaResourceDetail', id, language)
export const createMediaResource = (data: MediaResourceVO) =>
  callMediaResource('createMediaResource', data)
export const updateMediaResource = (data: MediaResourceVO) =>
  callMediaResource('updateMediaResource', data)
export const deleteMediaResource = (id: number) => callMediaResource('deleteMediaResource', id)
