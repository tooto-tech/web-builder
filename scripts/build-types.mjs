import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const outDir = resolve('dist/types')
const indexDts = `import type { DefineComponent } from 'vue'

export type WebBuilderStorageMode = 'backend' | 'indexeddb'
export type WebBuilderAdapterMethod = (...args: any[]) => any
export type WebBuilderAdapterValue =
  | WebBuilderAdapterMethod
  | string
  | number
  | boolean
  | null
  | undefined

export interface PageResourceIdentity {
  resourceId?: number
  resourceKey?: string
  resourceType?: string
  resourceScope?: string
  ownerType?: string
  ownerId?: number
}

export interface WebBuilderModuleAdapter {
  [method: string]: WebBuilderAdapterValue
}

export interface WebBuilderPageAdapter extends WebBuilderModuleAdapter {}

export interface WebBuilderContentAdapter {
  menu?: WebBuilderModuleAdapter
  post?: WebBuilderModuleAdapter
  postCategory?: WebBuilderModuleAdapter
  postType?: WebBuilderModuleAdapter
  postTag?: WebBuilderModuleAdapter
  mediaResource?: WebBuilderModuleAdapter
  mediaResourceCategory?: WebBuilderModuleAdapter
  faqCategory?: WebBuilderModuleAdapter
  faqItem?: WebBuilderModuleAdapter
  productCategoryContent?: WebBuilderModuleAdapter
  klaviyo?: WebBuilderModuleAdapter
  inquiry?: WebBuilderModuleAdapter
  webbuilderI18n?: WebBuilderModuleAdapter
  mallProductSpu?: WebBuilderModuleAdapter
  mallProductCategory?: WebBuilderModuleAdapter
  mallProductBrand?: WebBuilderModuleAdapter
  pageBrowser?: WebBuilderModuleAdapter
  [moduleName: string]: WebBuilderModuleAdapter | undefined
}

export interface WebBuilderAssetsAdapter extends WebBuilderModuleAdapter {}
export interface WebBuilderUploadAdapter extends WebBuilderModuleAdapter {}

export interface WebBuilderAuthAdapter extends WebBuilderModuleAdapter {
  baseUrl?: string
  apiBaseUrl?: string
}

export interface WebBuilderNavigationAdapter extends WebBuilderModuleAdapter {}

export interface WebBuilderAdapters {
  page?: WebBuilderPageAdapter
  content?: WebBuilderContentAdapter
  assets?: WebBuilderAssetsAdapter
  upload?: WebBuilderUploadAdapter
  auth?: WebBuilderAuthAdapter
  navigation?: WebBuilderNavigationAdapter
  system?: {
    language?: WebBuilderModuleAdapter
  }
  translation?: {
    config?: WebBuilderModuleAdapter
  }
  utils?: {
    tree?: WebBuilderModuleAdapter
  }
}

export interface WebBuilderProps extends PageResourceIdentity {
  resource?: PageResourceIdentity
  adapters?: WebBuilderAdapters
  storageMode?: WebBuilderStorageMode
}

export interface WebBuilderRuntime {
  adapters: WebBuilderAdapters
  resource?: PageResourceIdentity
  storageMode?: WebBuilderStorageMode
}

export declare const WebBuilder: DefineComponent<WebBuilderProps>
export default WebBuilder

export declare const webBuilderRuntimeKey: unique symbol
export declare const setWebBuilderRuntime: (runtime: WebBuilderRuntime) => void
export declare const clearWebBuilderRuntime: () => void
export declare const setWebBuilderAdapters: (adapters: WebBuilderAdapters) => void
export declare const clearWebBuilderAdapters: () => void
export declare const getWebBuilderRuntime: () => WebBuilderRuntime
export declare const getOptionalWebBuilderRuntime: () => WebBuilderRuntime | null
export declare const provideWebBuilderRuntime: (runtime: WebBuilderRuntime) => void
export declare const useWebBuilderRuntime: () => WebBuilderRuntime
export declare const callPageAdapter: <T = unknown>(method: string, ...args: any[]) => T
export declare const callContentAdapter: <T = unknown>(
  moduleName: string,
  method: string,
  ...args: any[]
) => T
export declare const callAssetsAdapter: <T = unknown>(method: string, ...args: any[]) => T
export declare const callUploadAdapter: <T = unknown>(method: string, ...args: any[]) => T
export declare const callAuthAdapter: <T = unknown>(method: string, ...args: any[]) => T
export declare const callNavigationAdapter: <T = unknown>(method: string, ...args: any[]) => T

export declare const WEB_BUILDER_STORAGE_MODE: WebBuilderStorageMode
export declare const getWebBuilderStorageMode: () => WebBuilderStorageMode
export declare const isBackendStorageMode: () => boolean
export declare const isIndexedDbStorageMode: () => boolean

export declare const LAYOUT_PAGE_RESOURCE_SCOPE: 'SHARED'
export declare const buildLayoutPageResourceKey: (slot: string, layoutPageId: string) => string

export type LayoutSlotKey = 'header' | 'footer'
export declare const createLayoutPageData: (...args: any[]) => any

export type LoopItemType = string
export type TempTemplateResourceType = string
export declare const LOOP_ITEM_RESOURCE_TYPE: string
export declare const LOOP_ITEM_TYPE_OPTIONS: readonly { label: string; value: string }[]
export declare const TEMP_TEMPLATE_RESOURCE_TYPE_OPTIONS: readonly { label: string; value: string }[]
export declare const buildLoopItemResourceExt: (...args: any[]) => string
export declare const getLoopItemTypeLabel: (value?: string | null) => string
export declare const isTempTemplateResourceType: (value?: string | null) => boolean

export declare const normalizePageResourceIdentity: (
  identity?: PageResourceIdentity | null
) => PageResourceIdentity
export declare const hasPageResourceLocator: (identity?: PageResourceIdentity | null) => boolean
export declare const buildPageResourceParams: (
  identity?: PageResourceIdentity | null
) => Record<string, string | number>
export declare const buildPageResourcePayload: <T extends PageResourceIdentity>(
  data: T
) => T & Record<string, unknown>
`

await mkdir(outDir, { recursive: true })
await writeFile(resolve(outDir, 'index.d.ts'), indexDts)
