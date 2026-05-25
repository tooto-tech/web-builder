import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface PostContentVO extends ApiRecord {}
export interface PostVO extends ApiRecord {
  id?: number
  name?: string
  contents?: PostContentVO[]
}
export interface PostRelatedVO extends ApiRecord {}
export interface PostDetailVO extends PostVO {}

const callPost = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('post', method, ...args)

export const getPostPage = (params: any) => callPost<Promise<PageResult<PostVO>>>('getPostPage', params)
export const getPost = (id: number) => callPost<Promise<PostDetailVO>>('getPost', id)
export const createPost = (data: PostVO) => callPost('createPost', data)
export const updatePost = (data: PostVO) => callPost('updatePost', data)
export const deletePost = (id: number) => callPost('deletePost', id)
export const publishPost = (id: number) => callPost('publishPost', id)
