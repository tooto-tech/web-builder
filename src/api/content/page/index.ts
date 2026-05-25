import { callPageAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'
export {
  buildPageResourceParams,
  buildPageResourcePayload,
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  type PageResourceIdentity
} from './resourceIdentity'
import type { PageResourceIdentity } from './resourceIdentity'

export interface PageVO extends PageResourceIdentity {
  id?: number
  name?: string
  resourceName?: string
  schemaJson?: string
  status?: string
  updateTime?: Date | string
  extJson?: string
  [key: string]: any
}

export type { PageResult }

export interface PageCreateReqVO extends PageResourceIdentity {
  resourceName?: string
  name?: string
  [key: string]: any
}

export interface PageNameUpdateReqVO {
  id: number
  name: string
  [key: string]: any
}

export interface PageDeleteReqVO {
  id: number
  [key: string]: any
}

export interface PageResourceDeleteReqVO extends PageResourceIdentity {
  [key: string]: any
}

export interface PageSaveReqVO extends PageResourceIdentity {
  resourceName?: string
  schemaJson?: string
  baseUpdateTime?: Date | string
  sessionKey?: string
  forceOverride?: boolean
  [key: string]: any
}

export interface PagePublishReqVO extends PageSaveReqVO {}

export interface PagePageReqVO extends PageResourceIdentity {
  pageNo?: number
  pageSize?: number
  [key: string]: any
}

export interface PageHistoryPageReqVO extends PagePageReqVO {
  pageId?: number
}

export interface PageHistoryRespVO extends PageResourceIdentity {
  id?: number
  status?: string
  publishStatus?: string
  updateTime?: Date | string
  [key: string]: any
}

export interface PageHistoryDetailRespVO extends PageHistoryRespVO {
  schemaJson?: string
}

export interface PageEditLockReqVO extends PageResourceIdentity {
  sessionKey: string
  [key: string]: any
}

export interface PageEditLockRespVO extends PageResourceIdentity {
  locked?: boolean
  sessionKey?: string
  [key: string]: any
}

export interface PageHeartbeatRespVO {
  locked?: boolean
  [key: string]: any
}

export interface TailwindCssReqVO {
  html?: string
  css?: string
  [key: string]: any
}

export interface TailwindCssRespVO {
  css?: string
  [key: string]: any
}

export const getPagePage = (params: PagePageReqVO) =>
  callPageAdapter<Promise<PageResult<PageVO>>>('getPagePage', params)
export const getDraft = (resource: PageResourceIdentity) =>
  callPageAdapter<Promise<PageVO | null>>('getDraft', resource)
export const getHistoryPage = (params: PageHistoryPageReqVO) =>
  callPageAdapter<Promise<PageResult<PageHistoryRespVO>>>('getHistoryPage', params)
export const getHistoryDetail = (id: number) =>
  callPageAdapter<Promise<PageHistoryDetailRespVO>>('getHistoryDetail', id)
export const createPage = (data: PageCreateReqVO) =>
  callPageAdapter<Promise<PageVO>>('createPage', data)
export const updatePageName = (data: PageNameUpdateReqVO) =>
  callPageAdapter<Promise<PageVO>>('updatePageName', data)
export const deletePage = (data: PageDeleteReqVO) =>
  callPageAdapter<Promise<void>>('deletePage', data)
export const deleteResource = (data: PageResourceDeleteReqVO) =>
  callPageAdapter<Promise<void>>('deleteResource', data)
export const saveDraft = (data: PageSaveReqVO) =>
  callPageAdapter<Promise<PageVO>>('saveDraft', data)
export const publishVersion = (data: PagePublishReqVO) =>
  callPageAdapter<Promise<PageVO>>('publishVersion', data)
export const publishContentPage = (id: number) =>
  callPageAdapter<Promise<void>>('publishContentPage', id)
export const releaseAllSitePages = () =>
  callPageAdapter<Promise<ApiRecord>>('releaseAllSitePages')
export const getSitePublishTask = (taskId: number | string) =>
  callPageAdapter<Promise<ApiRecord>>('getSitePublishTask', taskId)
export const acquireLock = (data: PageEditLockReqVO) =>
  callPageAdapter<Promise<PageEditLockRespVO>>('acquireLock', data)
export const releaseLock = (resource: PageResourceIdentity, sessionKey: string) =>
  callPageAdapter<Promise<void>>('releaseLock', resource, sessionKey)
export const updateHeartbeat = (resource: PageResourceIdentity, sessionKey: string) =>
  callPageAdapter<Promise<PageHeartbeatRespVO>>('updateHeartbeat', resource, sessionKey)
export const getLockHolder = (resource: PageResourceIdentity, sessionKey: string) =>
  callPageAdapter<Promise<PageEditLockRespVO | null>>('getLockHolder', resource, sessionKey)
export const generateCss = (data: TailwindCssReqVO) =>
  callPageAdapter<Promise<TailwindCssRespVO>>('generateCss', data)
