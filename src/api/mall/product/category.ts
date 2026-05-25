import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export interface CategoryVO extends ApiRecord {}
export interface CategoryContentVO extends ApiRecord {}

const callCategory = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('mallProductCategory', method, ...args)

export const createCategory = (data: CategoryVO) => callCategory('createCategory', data)
export const updateCategory = (data: CategoryVO) => callCategory('updateCategory', data)
export const deleteCategory = (id: number) => callCategory('deleteCategory', id)
export const getCategory = (id: number, params?: { language?: string }) =>
  callCategory<Promise<CategoryVO>>('getCategory', id, params)
export const getCategoryList = (params: any = {}) =>
  callCategory<Promise<CategoryVO[]>>('getCategoryList', params)
