import { callAdapterMethod } from '@/runtime'

const request = <T = any>(method: string, option: any): Promise<T> =>
  callAdapterMethod<Promise<T>>(['request'], method, option)

export default {
  get: <T = any>(option: any) => request<T>('get', option),
  post: <T = any>(option: any) => request<T>('post', option),
  postOriginal: (option: any) => request('postOriginal', option),
  delete: <T = any>(option: any) => request<T>('delete', option),
  put: <T = any>(option: any) => request<T>('put', option),
  download: <T = any>(option: any) => request<T>('download', option),
  upload: <T = any>(option: any) => request<T>('upload', option)
}
