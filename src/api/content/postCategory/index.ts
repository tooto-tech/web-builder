import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export interface PostCategoryVO extends ApiRecord {}
export interface PostCategoryContentVO extends ApiRecord {}

const callPostCategory = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('postCategory', method, ...args)

export const getPostCategoryList = (params: any) => callPostCategory('getPostCategoryList', params)
export const getAllPostCategoryList = () => callPostCategory<Promise<PostCategoryVO[]>>('getAllPostCategoryList')
export const getPostCategory = (id: number) => callPostCategory<Promise<PostCategoryVO>>('getPostCategory', id)
export const createPostCategory = (data: PostCategoryVO) => callPostCategory('createPostCategory', data)
export const updatePostCategory = (data: PostCategoryVO) => callPostCategory('updatePostCategory', data)
export const deletePostCategory = (id: number) => callPostCategory('deletePostCategory', id)
