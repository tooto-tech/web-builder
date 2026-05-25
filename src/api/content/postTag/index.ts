import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export interface PostTagVO extends ApiRecord {}
export interface PostTagContentVO extends ApiRecord {}

const callPostTag = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('postTag', method, ...args)

export const getPostTagList = () => callPostTag<Promise<PostTagVO[]>>('getPostTagList')
export const getAllPostTagList = () => callPostTag<Promise<PostTagVO[]>>('getAllPostTagList')
export const getPostTagItemList = () => callPostTag<Promise<PostTagVO[]>>('getPostTagItemList')
export const getPostTag = (id: number) => callPostTag<Promise<PostTagVO>>('getPostTag', id)
export const createPostTag = (data: PostTagVO) => callPostTag('createPostTag', data)
export const updatePostTag = (data: PostTagVO) => callPostTag('updatePostTag', data)
export const deletePostTag = (id: number) => callPostTag('deletePostTag', id)
