import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface FaqItemVO extends ApiRecord {}
export interface FaqItemContentVO extends ApiRecord {}
export interface FaqItemSaveVO extends ApiRecord {}
export interface FaqItemPageVO extends ApiRecord {}

const callFaqItem = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('faqItem', method, ...args)

export const getFaqItemPage = (params: FaqItemPageVO) =>
  callFaqItem<Promise<PageResult<FaqItemVO>>>('getFaqItemPage', params)
export const getFaqItem = (id: number) => callFaqItem<Promise<FaqItemVO>>('getFaqItem', id)
export const getAllFaqItemList = (params?: { language?: string }) =>
  callFaqItem<Promise<FaqItemVO[]>>('getAllFaqItemList', params)
export const createFaqItem = (data: FaqItemSaveVO) => callFaqItem('createFaqItem', data)
export const updateFaqItem = (data: FaqItemSaveVO) => callFaqItem('updateFaqItem', data)
export const deleteFaqItem = (id: number) => callFaqItem('deleteFaqItem', id)
