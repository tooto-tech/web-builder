export interface ApiRecord {
  [key: string]: any
}

export interface PageResult<T = ApiRecord> {
  list: T[]
  total: number
  [key: string]: any
}

export type ApiList<T = ApiRecord> = T[]
