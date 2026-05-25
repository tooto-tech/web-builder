import {
  getMenuList,
  getAvailablePagePage,
  getAvailablePages,
  getAvailablePostPage,
  getAvailablePosts,
  getAvailableProductPage,
  getAvailableProducts
} from '@/api/content/menu'
import { getPagePage } from '@/api/content/page'
import type { Editor } from 'grapesjs'

export type TraitDataSourceOptionGroup = '页面' | '文章' | '产品'

export interface TraitDataSourceOption {
  value: string
  label: string
  group?: TraitDataSourceOptionGroup
  typeId?: number
}

export interface TraitMenuOption {
  value: string
  label: string
  id: string
  code?: string
}

export type TraitMenuOptionLabelMode =
  | 'name-code-if-present'
  | 'name-code-if-different'
  | 'name-code-always'

export interface LoadMenuOptionsParams {
  force?: boolean
  valueField?: 'id' | 'code'
  labelMode?: TraitMenuOptionLabelMode
  requireCode?: boolean
}

export interface TraitDataSourceRegistryDeps {
  getMenuList?: typeof getMenuList
  getAvailablePagePage?: typeof getAvailablePagePage
  getAvailablePages?: typeof getAvailablePages
  getAvailablePostPage?: typeof getAvailablePostPage
  getAvailablePosts?: typeof getAvailablePosts
  getAvailableProductPage?: typeof getAvailableProductPage
  getAvailableProducts?: typeof getAvailableProducts
  getPagePage?: typeof getPagePage
}

interface DataSourceCache<T> {
  value?: T
  promise?: Promise<T>
}

interface TraitDataSourceState {
  pageLinks: DataSourceCache<TraitDataSourceOption[]>
  productLinks: DataSourceCache<TraitDataSourceOption[]>
  postLinksByType: Record<string, DataSourceCache<TraitDataSourceOption[]>>
  menuOptionsByKey: Record<string, DataSourceCache<TraitMenuOption[]>>
}

export interface TraitDataSourceRegistry {
  getCachedPageLinks: () => TraitDataSourceOption[]
  hasCachedPageLinks: () => boolean
  loadPageLinks: (options?: { force?: boolean }) => Promise<TraitDataSourceOption[]>
  getCachedPostLinks: (typeId?: string) => TraitDataSourceOption[]
  hasCachedPostLinks: (typeId?: string) => boolean
  loadPostLinks: (options?: {
    force?: boolean
    typeId?: string
  }) => Promise<TraitDataSourceOption[]>
  getCachedProductLinks: () => TraitDataSourceOption[]
  hasCachedProductLinks: () => boolean
  loadProductLinks: (options?: { force?: boolean }) => Promise<TraitDataSourceOption[]>
  loadMenuOptions: (options?: LoadMenuOptionsParams) => Promise<TraitMenuOption[]>
}

type RegistryEditor = Editor & {
  __wbTraitDataSources?: TraitDataSourceState
  __wbTraitDataSourceRegistry?: TraitDataSourceRegistry
  __wbRemotePageLinkOptions?: TraitDataSourceOption[]
  __wbRemoteProductLinkOptions?: TraitDataSourceOption[]
  __wbRemotePostLinkOptionsByType?: Record<string, TraitDataSourceOption[]>
  __wbMenuOptionsByKey?: Record<string, TraitMenuOption[]>
}

const defaultDeps: Required<TraitDataSourceRegistryDeps> = {
  getMenuList,
  getAvailablePagePage,
  getAvailablePages,
  getAvailablePostPage,
  getAvailablePosts,
  getAvailableProductPage,
  getAvailableProducts,
  getPagePage
}

const toPageList = (pages: any): any[] => {
  if (Array.isArray(pages)) return pages
  if (Array.isArray(pages?.models)) return pages.models
  return []
}

export const normalizePageHref = (href: string): string => {
  const value = `${href ?? ''}`.trim()
  if (!value) return ''
  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    /^https?:\/\//i.test(value) ||
    value.startsWith('//')
  ) {
    return value
  }
  return `/${value.replace(/^\.?\//, '')}`
}

export const titleToPagePath = (value: string): string => {
  const slug = `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) return ''
  if (slug === 'home' || slug === 'index') return '/'
  return `/${slug}.html`
}

export const resolveRemotePageHref = (row: any): string => {
  const directUrl = normalizePageHref(`${row?.resolvedUrl ?? row?.url ?? row?.href ?? ''}`.trim())
  if (directUrl) return directUrl
  return titleToPagePath(`${row?.resourceName ?? row?.name ?? ''}`)
}

export const dedupeTraitDataSourceOptions = (
  options: TraitDataSourceOption[]
): TraitDataSourceOption[] => {
  const used = new Set<string>()
  return options.filter((option) => {
    const value = `${option.value ?? ''}`.trim()
    if (!value || used.has(value)) return false
    used.add(value)
    option.value = value
    return true
  })
}

export const getLocalPageLinkOptions = (editor: Pick<Editor, 'Pages'>): TraitDataSourceOption[] => {
  const pages = toPageList(editor.Pages?.getAll?.() ?? [])
  const options: TraitDataSourceOption[] = []
  const used = new Set<string>()

  pages.forEach((page: any, index: number) => {
    const slug = `${page?.get?.('slug') ?? page?.slug ?? page?.get?.('custom')?.slug ?? page?.custom?.slug ?? ''}`
      .trim()
      .replace(/^\/+|\/+$/g, '')
    const href = index === 0 ? '/' : slug ? `/${slug}` : '/'
    if (!href || used.has(href)) return
    used.add(href)
    const name = `${page?.get?.('name') ?? page?.name ?? page?.get?.('id') ?? page?.id ?? '未命名页面'}`
    options.push({ value: href, label: name, group: '页面' })
  })

  return dedupeTraitDataSourceOptions(options)
}

const mapRemotePageOptions = (
  items: any[],
  group: TraitDataSourceOptionGroup
): TraitDataSourceOption[] =>
  (Array.isArray(items) ? items : [])
    .map((item: any) => {
      const href = resolveRemotePageHref(item)
      if (!href) return null
      return {
        value: href,
        label: `${item.name || item.resourceName || href}`,
        group
      }
    })
    .filter(Boolean) as TraitDataSourceOption[]

const mapRemotePostOptions = (items: any[]): TraitDataSourceOption[] =>
  (Array.isArray(items) ? items : [])
    .map((item: any) => {
      const href = resolveRemotePageHref(item)
      if (!href) return null
      return {
        value: href,
        label: `${item.name || item.resourceName || href}`,
        group: '文章' as const,
        typeId: Number(item.typeId || item.postTypeId) || undefined
      }
    })
    .filter(Boolean) as TraitDataSourceOption[]

const getState = (editor: RegistryEditor): TraitDataSourceState => {
  editor.__wbTraitDataSources ||= {
    pageLinks: {},
    productLinks: {},
    postLinksByType: {},
    menuOptionsByKey: {}
  }
  editor.__wbRemotePostLinkOptionsByType ||= {}
  editor.__wbMenuOptionsByKey ||= {}
  return editor.__wbTraitDataSources
}

const getMenuOptionsCacheKey = ({
  valueField = 'id',
  labelMode = 'name-code-if-present',
  requireCode = false
}: LoadMenuOptionsParams = {}) => `${valueField}:${labelMode}:${requireCode ? 'code' : 'all'}`

const buildMenuLabel = (
  name: string,
  code: string,
  labelMode: TraitMenuOptionLabelMode
): string => {
  if (!code) return name
  if (labelMode === 'name-code-always') return `${name} (${code})`
  if (labelMode === 'name-code-if-different') return name === code ? code : `${name} (${code})`
  return code ? `${name} (${code})` : name
}

const mapMenuOptions = (
  items: any[],
  {
    valueField = 'id',
    labelMode = 'name-code-if-present',
    requireCode = false
  }: LoadMenuOptionsParams = {}
): TraitMenuOption[] =>
  (Array.isArray(items) ? items : [])
    .map((item: any) => {
      const id = item?.id != null ? String(item.id) : ''
      const code = `${item?.code ?? ''}`.trim()
      if (!id) return null
      if (requireCode && !code) return null
      const value = valueField === 'code' ? code : id
      if (!value) return null
      const name = `${item?.name ?? '未命名菜单'}`.trim() || '未命名菜单'
      return {
        value,
        label: buildMenuLabel(name, code, labelMode),
        id,
        ...(code ? { code } : {})
      }
    })
    .filter(Boolean) as TraitMenuOption[]

export const createTraitDataSourceRegistry = (
  editor: Editor,
  deps: TraitDataSourceRegistryDeps = {}
): TraitDataSourceRegistry => {
  const registryEditor = editor as RegistryEditor
  const api = { ...defaultDeps, ...deps }
  const state = getState(registryEditor)

  const setPageLinks = (options: TraitDataSourceOption[]) => {
    state.pageLinks.value = options
    registryEditor.__wbRemotePageLinkOptions = options
    return options
  }

  const setPostLinks = (key: string, options: TraitDataSourceOption[]) => {
    state.postLinksByType[key] ||= {}
    state.postLinksByType[key].value = options
    registryEditor.__wbRemotePostLinkOptionsByType ||= {}
    registryEditor.__wbRemotePostLinkOptionsByType[key] = options
    return options
  }

  const setProductLinks = (options: TraitDataSourceOption[]) => {
    state.productLinks.value = options
    registryEditor.__wbRemoteProductLinkOptions = options
    return options
  }

  const setMenuOptions = (key: string, options: TraitMenuOption[]) => {
    state.menuOptionsByKey[key] ||= {}
    state.menuOptionsByKey[key].value = options
    registryEditor.__wbMenuOptionsByKey ||= {}
    registryEditor.__wbMenuOptionsByKey[key] = options
    return options
  }

  const registry: TraitDataSourceRegistry = {
    getCachedPageLinks: () => state.pageLinks.value ?? [],
    hasCachedPageLinks: () => Array.isArray(state.pageLinks.value),
    loadPageLinks: async ({ force = false } = {}) => {
      if (!force && state.pageLinks.value) return state.pageLinks.value
      if (!force && state.pageLinks.promise) return state.pageLinks.promise

      state.pageLinks.promise = (async () => {
        try {
          const sourcePageResult = await api.getAvailablePagePage({
            pageNo: 1,
            pageSize: 200
          })
          const pagedSourceOptions = mapRemotePageOptions(sourcePageResult?.list || [], '页面')
          if (pagedSourceOptions.length > 0) {
            return setPageLinks(dedupeTraitDataSourceOptions(pagedSourceOptions))
          }

          const sourcePages = await api.getAvailablePages()
          const sourceOptions = mapRemotePageOptions(sourcePages, '页面')
          if (sourceOptions.length > 0) {
            return setPageLinks(dedupeTraitDataSourceOptions(sourceOptions))
          }
        } catch (error) {
          console.warn('[WebBuilder] 可用页面链接来源加载失败，尝试 CMS 页面列表', error)
        }

        try {
          const pageResult = await api.getPagePage({
            pageNo: 1,
            pageSize: 200,
            status: 'draft',
            resourceType: 'PAGE'
          })
          return setPageLinks(
            dedupeTraitDataSourceOptions(
              mapRemotePageOptions(pageResult?.list || [], '页面').map((option) => ({
                ...option,
                label: option.label
              }))
            )
          )
        } catch (error) {
          console.warn('[WebBuilder] 页面链接列表加载失败', error)
          return setPageLinks([])
        }
      })().finally(() => {
        state.pageLinks.promise = undefined
      })

      return state.pageLinks.promise
    },
    getCachedPostLinks: (typeId = '') => {
      const key = typeId || 'all'
      return state.postLinksByType[key]?.value ?? []
    },
    hasCachedPostLinks: (typeId = '') => {
      const key = typeId || 'all'
      return Array.isArray(state.postLinksByType[key]?.value)
    },
    loadPostLinks: async ({ force = false, typeId = '' } = {}) => {
      const key = typeId || 'all'
      state.postLinksByType[key] ||= {}
      const cache = state.postLinksByType[key]
      if (!force && cache.value) return cache.value
      if (!force && cache.promise) return cache.promise

      cache.promise = (async () => {
        try {
          const pagedPostResult = await api.getAvailablePostPage({
            pageNo: 1,
            pageSize: 200,
            ...(typeId ? { typeId: Number(typeId) } : {})
          } as any)
          const pagedPostOptions = mapRemotePostOptions(pagedPostResult?.list || [])
          if (pagedPostOptions.length > 0) {
            return setPostLinks(key, dedupeTraitDataSourceOptions(pagedPostOptions))
          }

          const posts = await api.getAvailablePosts()
          const mappedPosts = mapRemotePostOptions(posts)
          return setPostLinks(
            key,
            dedupeTraitDataSourceOptions(
              typeId ? mappedPosts.filter((option) => `${option.typeId || ''}` === typeId) : mappedPosts
            )
          )
        } catch (error) {
          console.warn('[WebBuilder] 文章链接列表加载失败', error)
          return setPostLinks(key, [])
        }
      })().finally(() => {
        cache.promise = undefined
      })

      return cache.promise
    },
    getCachedProductLinks: () => state.productLinks.value ?? [],
    hasCachedProductLinks: () => Array.isArray(state.productLinks.value),
    loadProductLinks: async ({ force = false } = {}) => {
      if (!force && state.productLinks.value) return state.productLinks.value
      if (!force && state.productLinks.promise) return state.productLinks.promise

      state.productLinks.promise = (async () => {
        try {
          const pagedProductResult = await api.getAvailableProductPage({
            pageNo: 1,
            pageSize: 200
          })
          const pagedProductOptions = mapRemotePageOptions(pagedProductResult?.list || [], '产品')
          if (pagedProductOptions.length > 0) {
            return setProductLinks(dedupeTraitDataSourceOptions(pagedProductOptions))
          }

          const products = await api.getAvailableProducts()
          return setProductLinks(
            dedupeTraitDataSourceOptions(mapRemotePageOptions(products, '产品'))
          )
        } catch (error) {
          console.warn('[WebBuilder] 产品链接列表加载失败', error)
          return setProductLinks([])
        }
      })().finally(() => {
        state.productLinks.promise = undefined
      })

      return state.productLinks.promise
    },
    loadMenuOptions: async (options = {}) => {
      const key = getMenuOptionsCacheKey(options)
      state.menuOptionsByKey[key] ||= {}
      const cache = state.menuOptionsByKey[key]
      if (!options.force && cache.value) return cache.value
      if (!options.force && cache.promise) return cache.promise

      cache.promise = api
        .getMenuList()
        .then((data: any) => setMenuOptions(key, mapMenuOptions(data, options)))
        .catch((error) => {
          console.error('[WebBuilder] Failed to load menu options', error)
          return setMenuOptions(key, [])
        })
        .finally(() => {
          cache.promise = undefined
        })

      return cache.promise
    }
  }

  registryEditor.__wbTraitDataSourceRegistry = registry
  return registry
}

export const getTraitDataSourceRegistry = (
  editor: Editor,
  deps?: TraitDataSourceRegistryDeps
): TraitDataSourceRegistry => {
  const registryEditor = editor as RegistryEditor
  if (!deps && registryEditor.__wbTraitDataSourceRegistry) {
    return registryEditor.__wbTraitDataSourceRegistry
  }
  return createTraitDataSourceRegistry(editor, deps)
}
