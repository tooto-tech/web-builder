import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface Property extends ApiRecord {}
export interface Sku extends ApiRecord {}
export interface GiveCouponTemplate extends ApiRecord {}
export interface ProductDocument extends ApiRecord {}
export interface SpuContent extends ApiRecord {}
export interface ProductSpecification extends ApiRecord {}
export interface ProductSpecTemplateFieldConfig extends ApiRecord {}
export interface ProductSpecGroup extends ApiRecord {}
export interface ProductSpecGroupContent extends ApiRecord {}
export interface ProductSpecField extends ApiRecord {}
export interface ProductSpecFieldContent extends ApiRecord {}
export interface ProductSpecTemplate extends ApiRecord {}
export interface ProductSpecTemplateContent extends ApiRecord {}
export interface ProductSpuUpdateSpecificationsReq extends ApiRecord {}
export interface Spu extends ApiRecord {
  id?: number
  name?: string
}
export interface ImportResult extends ApiRecord {}
export interface ImportResultVO extends ApiRecord {}

const callSpu = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('mallProductSpu', method, ...args)

export const getSpuPage = (params: ApiRecord & { includeSpecifications?: boolean }) =>
  callSpu<Promise<PageResult<Spu>>>('getSpuPage', params)
export const getTabsCount = () => callSpu('getTabsCount')
export const createSpu = (data: Spu) => callSpu('createSpu', data)
export const updateSpu = (data: Spu) => callSpu('updateSpu', data)
export const updateSpuSpecifications = (data: ProductSpuUpdateSpecificationsReq) =>
  callSpu('updateSpuSpecifications', data)
export const updateStatus = (data: { id: number; status: number }) => callSpu('updateStatus', data)
export const getSpu = (id: number) => callSpu<Promise<Spu>>('getSpu', id)
export const getSpuDetailList = (ids: number[]) => callSpu<Promise<Spu[]>>('getSpuDetailList', ids)
export const deleteSpu = (id: number) => callSpu('deleteSpu', id)
export const exportSpu = (params: any) => callSpu('exportSpu', params)
export const getSpuSimpleList = () => callSpu<Promise<Spu[]>>('getSpuSimpleList')
export const importSpuFromExcel = (formData: FormData) => callSpu('importSpuFromExcel', formData)
export const getSpecGroups = (params?: { language?: string }) =>
  callSpu<Promise<ProductSpecGroup[]>>('getSpecGroups', params)
export const getSpecFields = (params?: { groupCode?: string; language?: string }) =>
  callSpu<Promise<ProductSpecField[]>>('getSpecFields', params)
export const createSpecField = (data: ProductSpecField) =>
  callSpu<Promise<number>>('createSpecField', data)
export const getSpecTemplates = (params?: { language?: string }) =>
  callSpu<Promise<ProductSpecTemplate[]>>('getSpecTemplates', params)
export const getRecommendedSpecTemplate = (params?: ApiRecord) =>
  callSpu<Promise<ProductSpecTemplate | null>>('getRecommendedSpecTemplate', params)
export const saveCategorySpecTemplate = (data: ApiRecord) =>
  callSpu('saveCategorySpecTemplate', data)
