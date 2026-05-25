import { callAssetsAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface FilePresignedUrlRespVO extends ApiRecord {
  uploadUrl: string
  url: string
  path?: string
  configId?: number
}

export const getFilePage = (params: ApiRecord) =>
  callAssetsAdapter<Promise<PageResult<ApiRecord>>>('getFilePage', params)
export const deleteFile = (id: number) => callAssetsAdapter<Promise<void>>('deleteFile', id)
export const deleteFileList = (ids: number[]) =>
  callAssetsAdapter<Promise<void>>('deleteFileList', ids)
export const getFilePresignedUrl = (name: string, directory?: string) =>
  callAssetsAdapter<Promise<FilePresignedUrlRespVO>>('getFilePresignedUrl', name, directory)
export const createFile = (data: any) => callAssetsAdapter<Promise<ApiRecord>>('createFile', data)
export const updateFile = (data: any, onUploadProgress?: Function) =>
  callAssetsAdapter<Promise<ApiRecord>>('updateFile', data, onUploadProgress)
