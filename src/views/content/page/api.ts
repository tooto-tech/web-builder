import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface PageContentVO extends ApiRecord {}
export interface PageVO extends ApiRecord {
  id?: number
  name?: string
  contents?: PageContentVO[]
}
export interface PageDetailVO extends PageVO {}
export interface PagePageReqVO extends ApiRecord {}

const callPageBrowser = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('pageBrowser', method, ...args)

export const getPagePage = (params: PagePageReqVO) =>
  callPageBrowser<Promise<PageResult<PageVO>>>('getPagePage', params)
export const getPage = (id: number) => callPageBrowser<Promise<PageVO>>('getPage', id)
export const createPage = (data: PageVO) => callPageBrowser('createPage', data)
export const updatePage = (data: PageVO) => callPageBrowser('updatePage', data)
export const deletePage = (id: number) => callPageBrowser('deletePage', id)
export const publishPage = (id: number) => callPageBrowser('publishPage', id)
export const getHeaderFooterPageList = (type: 'HEADER' | 'FOOTER') =>
  callPageBrowser<Promise<PageVO[]>>('getHeaderFooterPageList', type)
