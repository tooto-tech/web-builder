import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export interface PostTypeVO extends ApiRecord {}
export interface PostTypeContentVO extends ApiRecord {}

const callPostType = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('postType', method, ...args)

export const getPostTypeList = () => callPostType<Promise<PostTypeVO[]>>('getPostTypeList')
export const getAllPostTypeList = () => callPostType<Promise<PostTypeVO[]>>('getAllPostTypeList')
export const getPostType = (id: number) => callPostType<Promise<PostTypeVO>>('getPostType', id)
export const createPostType = (data: PostTypeVO) => callPostType('createPostType', data)
export const updatePostType = (data: PostTypeVO) => callPostType('updatePostType', data)
export const deletePostType = (id: number) => callPostType('deletePostType', id)
