import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface MenuVO extends ApiRecord {}
export interface MenuContentVO extends ApiRecord {}
export interface MenuItemVO extends ApiRecord {}
export interface MenuItemContentVO extends ApiRecord {}
export interface MenuTreeVO extends ApiRecord {}
export interface ContentSourceVO extends ApiRecord {}
export interface ContentSourcePageReqVO extends ApiRecord {}
export type { PageResult }

const callMenu = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('menu', method, ...args)

export const createMenu = (data: MenuVO) => callMenu('createMenu', data)
export const updateMenu = (data: MenuVO) => callMenu('updateMenu', data)
export const deleteMenu = (id: number) => callMenu('deleteMenu', id)
export const getMenu = (id: number) => callMenu<Promise<MenuVO>>('getMenu', id)
export const getMenuList = () => callMenu<Promise<MenuVO[]>>('getMenuList')
export const getMenuPage = (params: any) => callMenu<Promise<PageResult<MenuVO>>>('getMenuPage', params)
export const getMenuByCode = (code: string, language?: string) =>
  callMenu<Promise<MenuVO | null>>('getMenuByCode', code, language)
export const createMenuItem = (data: MenuItemVO) => callMenu('createMenuItem', data)
export const batchCreateMenuItems = (menuId: number, items: MenuItemVO[]) =>
  callMenu('batchCreateMenuItems', menuId, items)
export const updateMenuItem = (data: MenuItemVO) => callMenu('updateMenuItem', data)
export const deleteMenuItem = (id: number, deleteChildren = true) =>
  callMenu('deleteMenuItem', id, deleteChildren)
export const batchDeleteMenuItems = (ids: number[]) => callMenu('batchDeleteMenuItems', ids)
export const getMenuItem = (id: number, language?: string) =>
  callMenu<Promise<MenuItemVO>>('getMenuItem', id, language)
export const getMenuItemTree = (menuId: number, language?: string) =>
  callMenu<Promise<MenuTreeVO[]>>('getMenuItemTree', menuId, language)
export const resolveMenuItemLink = (id: number, language?: string) =>
  callMenu<Promise<ApiRecord>>('resolveMenuItemLink', id, language)
export const moveMenuItem = (data: { id: number; newParentId?: number; sortOrder?: number }) =>
  callMenu('moveMenuItem', data)
export const updateSortOrder = (items: MenuItemVO[]) => callMenu('updateSortOrder', items)
export const clearMenuSourceCache = (cacheKey?: string) => callMenu('clearMenuSourceCache', cacheKey)
export const getAvailablePagePage = (params: ContentSourcePageReqVO) =>
  callMenu<Promise<PageResult<ContentSourceVO>>>('getAvailablePagePage', params)
export const getAvailablePages = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getAvailablePages', language)
export const getAvailablePostPage = (params: ContentSourcePageReqVO) =>
  callMenu<Promise<PageResult<ContentSourceVO>>>('getAvailablePostPage', params)
export const getAvailablePosts = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getAvailablePosts', language)
export const getPostTypes = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getPostTypes', language)
export const getPostCategories = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getPostCategories', language)
export const getAvailableProductPage = (params: ContentSourcePageReqVO) =>
  callMenu<Promise<PageResult<ContentSourceVO>>>('getAvailableProductPage', params)
export const getAvailableProducts = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getAvailableProducts', language)
export const getProductCategories = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getProductCategories', language)
export const getAvailableMediaPage = (params: ContentSourcePageReqVO) =>
  callMenu<Promise<PageResult<ContentSourceVO>>>('getAvailableMediaPage', params)
export const getAvailableMedia = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getAvailableMedia', language)
export const getMediaCategories = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getMediaCategories', language)
export const getAvailableFaqPage = (params: ContentSourcePageReqVO) =>
  callMenu<Promise<PageResult<ContentSourceVO>>>('getAvailableFaqPage', params)
export const getAvailableFaqs = (language?: string) =>
  callMenu<Promise<ContentSourceVO[]>>('getAvailableFaqs', language)
