import { getOptionalWebBuilderRuntime } from '@/runtime'

export type WebBuilderStorageMode = 'backend' | 'indexeddb'

/**
 * WebBuilder 存储模式切换。
 *
 * - `backend`: 走现有 `/cms/page/*` 草稿接口
 * - `indexeddb`: 优先走浏览器本地 IndexedDB；本地缺失时读取后端草稿作为初始内容
 *
 * 只需要改这里即可切换。
 */
export const WEB_BUILDER_STORAGE_MODE = 'backend' as WebBuilderStorageMode

export const getWebBuilderStorageMode = (): WebBuilderStorageMode =>
  getOptionalWebBuilderRuntime()?.storageMode || WEB_BUILDER_STORAGE_MODE

export const isBackendStorageMode = () => getWebBuilderStorageMode() === 'backend'
export const isIndexedDbStorageMode = () => getWebBuilderStorageMode() === 'indexeddb'
