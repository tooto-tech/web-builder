import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export interface ProductCategoryContentVO extends ApiRecord {}
export interface ProductCategoryContentSaveVO extends ApiRecord {}

const callProductCategoryContent = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('productCategoryContent', method, ...args)

export const getProductCategoryContent = (categoryId: number) =>
  callProductCategoryContent<Promise<ProductCategoryContentVO>>('getProductCategoryContent', categoryId)
export const saveProductCategoryContent = (data: ProductCategoryContentSaveVO) =>
  callProductCategoryContent('saveProductCategoryContent', data)
