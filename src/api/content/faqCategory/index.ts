import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface FaqCategoryVO extends ApiRecord {}
export interface FaqCategoryContentVO extends ApiRecord {}
export interface FaqCategorySaveVO extends ApiRecord {}
export interface FaqCategoryPageVO extends ApiRecord {}

const callFaqCategory = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('faqCategory', method, ...args)

export const getFaqCategoryPage = (params: FaqCategoryPageVO) =>
  callFaqCategory<Promise<PageResult<FaqCategoryVO>>>('getFaqCategoryPage', params)
export const getFaqCategory = (id: number) =>
  callFaqCategory<Promise<FaqCategoryVO>>('getFaqCategory', id)
export const getAllFaqCategoryList = (params?: { language?: string }) =>
  callFaqCategory<Promise<FaqCategoryVO[]>>('getAllFaqCategoryList', params)
export const createFaqCategory = (data: FaqCategorySaveVO) =>
  callFaqCategory('createFaqCategory', data)
export const updateFaqCategory = (data: FaqCategorySaveVO) =>
  callFaqCategory('updateFaqCategory', data)
export const deleteFaqCategory = (id: number) => callFaqCategory('deleteFaqCategory', id)
