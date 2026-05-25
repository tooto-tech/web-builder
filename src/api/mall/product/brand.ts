import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export interface BrandContentVO extends ApiRecord {}
export interface BrandVO extends ApiRecord {}

const callBrand = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('mallProductBrand', method, ...args)

export const createBrand = (data: BrandVO) => callBrand('createBrand', data)
export const updateBrand = (data: BrandVO) => callBrand('updateBrand', data)
export const deleteBrand = (id: number) => callBrand('deleteBrand', id)
export const getBrand = (id: number) => callBrand<Promise<BrandVO>>('getBrand', id)
export const getBrandParam = (params: ApiRecord) => callBrand('getBrandParam', params)
export const getSimpleBrandList = () => callBrand<Promise<BrandVO[]>>('getSimpleBrandList')
