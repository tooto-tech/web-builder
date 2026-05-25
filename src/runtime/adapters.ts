import { inject, provide, type InjectionKey } from 'vue'

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

export interface WebBuilderRuntime {
  adapters: WebBuilderAdapters
  resource?: PageResourceIdentity
  storageMode?: WebBuilderStorageMode
}

export const webBuilderRuntimeKey: InjectionKey<WebBuilderRuntime> = Symbol('WebBuilderRuntime')

let currentRuntime: WebBuilderRuntime | null = null

export const setWebBuilderRuntime = (runtime: WebBuilderRuntime): void => {
  currentRuntime = runtime
}

export const clearWebBuilderRuntime = (): void => {
  currentRuntime = null
}

export const setWebBuilderAdapters = (adapters: WebBuilderAdapters): void => {
  currentRuntime = {
    ...(currentRuntime || {}),
    adapters
  }
}

export const clearWebBuilderAdapters = clearWebBuilderRuntime

export const getWebBuilderRuntime = (): WebBuilderRuntime => {
  if (!currentRuntime) {
    throw new Error('[WebBuilder] Runtime adapters are not configured')
  }
  return currentRuntime
}

export const getOptionalWebBuilderRuntime = (): WebBuilderRuntime | null => currentRuntime

export const provideWebBuilderRuntime = (runtime: WebBuilderRuntime): void => {
  setWebBuilderRuntime(runtime)
  provide(webBuilderRuntimeKey, runtime)
}

export const useWebBuilderRuntime = (): WebBuilderRuntime => {
  const runtime = inject(webBuilderRuntimeKey, null)
  if (runtime) return runtime
  return getWebBuilderRuntime()
}

const resolveModule = (
  adapters: WebBuilderAdapters,
  path: string[]
): WebBuilderModuleAdapter | undefined => {
  let current: unknown = adapters
  for (const segment of path) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current && typeof current === 'object' ? (current as WebBuilderModuleAdapter) : undefined
}

export const getAdapterMethod = (
  path: string[],
  method: string
): WebBuilderAdapterMethod | undefined => {
  const runtime = getWebBuilderRuntime()
  const moduleAdapter = resolveModule(runtime.adapters, path)
  const adapterMethod = moduleAdapter?.[method]
  return typeof adapterMethod === 'function' ? adapterMethod : undefined
}

export const getOptionalAdapterMethod = (
  path: string[],
  method: string
): WebBuilderAdapterMethod | undefined => {
  const runtime = getOptionalWebBuilderRuntime()
  if (!runtime) return undefined
  const moduleAdapter = resolveModule(runtime.adapters, path)
  const adapterMethod = moduleAdapter?.[method]
  return typeof adapterMethod === 'function' ? adapterMethod : undefined
}

export const requireAdapterMethod = (
  path: string[],
  method: string
): WebBuilderAdapterMethod => {
  const adapterMethod = getAdapterMethod(path, method)
  if (!adapterMethod) {
    throw new Error(`[WebBuilder] Missing runtime adapter method: ${[...path, method].join('.')}`)
  }
  return adapterMethod
}

export const callAdapterMethod = <T = unknown>(
  path: string[],
  method: string,
  ...args: any[]
): T => requireAdapterMethod(path, method)(...args) as T

export const callPageAdapter = <T = unknown>(method: string, ...args: any[]): T =>
  callAdapterMethod<T>(['page'], method, ...args)

export const callContentAdapter = <T = unknown>(
  moduleName: keyof WebBuilderContentAdapter | string,
  method: string,
  ...args: any[]
): T => callAdapterMethod<T>(['content', `${moduleName}`], method, ...args)

export const callAssetsAdapter = <T = unknown>(method: string, ...args: any[]): T =>
  callAdapterMethod<T>(['assets'], method, ...args)

export const callUploadAdapter = <T = unknown>(method: string, ...args: any[]): T =>
  callAdapterMethod<T>(['upload'], method, ...args)

export const callAuthAdapter = <T = unknown>(method: string, ...args: any[]): T =>
  callAdapterMethod<T>(['auth'], method, ...args)

export const callNavigationAdapter = <T = unknown>(method: string, ...args: any[]): T =>
  callAdapterMethod<T>(['navigation'], method, ...args)

export const callSystemAdapter = <T = unknown>(
  moduleName: string,
  method: string,
  ...args: any[]
): T => callAdapterMethod<T>(['system', moduleName], method, ...args)

export const callTranslationAdapter = <T = unknown>(
  moduleName: string,
  method: string,
  ...args: any[]
): T => callAdapterMethod<T>(['translation', moduleName], method, ...args)

export const callUtilsAdapter = <T = unknown>(
  moduleName: string,
  method: string,
  ...args: any[]
): T => callAdapterMethod<T>(['utils', moduleName], method, ...args)
