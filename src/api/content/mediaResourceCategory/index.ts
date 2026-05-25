import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface MediaResourceCategoryVO extends ApiRecord {}
export interface MediaResourceCategoryContentVO extends ApiRecord {}

const callMediaResourceCategory = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('mediaResourceCategory', method, ...args)

export const getMediaResourceCategoryList = () =>
  callMediaResourceCategory<Promise<MediaResourceCategoryVO[]>>('getMediaResourceCategoryList')
export const getAllMediaResourceCategoryList = () =>
  callMediaResourceCategory<Promise<MediaResourceCategoryVO[]>>('getAllMediaResourceCategoryList')
export const getMediaResourceCategoryPage = (params: any) =>
  callMediaResourceCategory<Promise<PageResult<MediaResourceCategoryVO>>>('getMediaResourceCategoryPage', params)
export const getMediaResourceCategory = (id: number) =>
  callMediaResourceCategory<Promise<MediaResourceCategoryVO>>('getMediaResourceCategory', id)
export const createMediaResourceCategory = (data: MediaResourceCategoryVO) =>
  callMediaResourceCategory('createMediaResourceCategory', data)
export const updateMediaResourceCategory = (data: MediaResourceCategoryVO) =>
  callMediaResourceCategory('updateMediaResourceCategory', data)
export const deleteMediaResourceCategory = (id: number) =>
  callMediaResourceCategory('deleteMediaResourceCategory', id)
