import { callContentAdapter } from '@/runtime'
import type { ApiRecord } from '@/api/types'

export interface KlaviyoConfigVO extends ApiRecord {}
export interface KlaviyoConfigSaveReqVO extends ApiRecord {}
export interface KlaviyoListVO extends ApiRecord {}
export interface KlaviyoReportReqVO extends ApiRecord {}
export interface KlaviyoOverviewVO extends ApiRecord {}
export interface KlaviyoCampaignVO extends ApiRecord {}
export interface KlaviyoGrowthItem extends ApiRecord {}

const callKlaviyo = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('klaviyo', method, ...args)

export const saveKlaviyoConfig = (data: KlaviyoConfigSaveReqVO) =>
  callKlaviyo('saveKlaviyoConfig', data)
export const getKlaviyoConfig = () => callKlaviyo<Promise<KlaviyoConfigVO | null>>('getKlaviyoConfig')
export const deleteKlaviyoConfig = () => callKlaviyo('deleteKlaviyoConfig')
export const updateKlaviyoConfigStatus = (status: number) =>
  callKlaviyo('updateKlaviyoConfigStatus', status)
export const testKlaviyoConnection = () => callKlaviyo('testKlaviyoConnection')
export const getKlaviyoLists = () => callKlaviyo<Promise<KlaviyoListVO[]>>('getKlaviyoLists')
export const generateSubscribeCode = (listId?: string) =>
  callKlaviyo<Promise<ApiRecord>>('generateSubscribeCode', listId)
export const getKlaviyoOverview = () => callKlaviyo<Promise<KlaviyoOverviewVO>>('getKlaviyoOverview')
export const getKlaviyoReportLists = () => callKlaviyo<Promise<KlaviyoListVO[]>>('getKlaviyoReportLists')
export const getKlaviyoCampaigns = (params: KlaviyoReportReqVO) =>
  callKlaviyo<Promise<KlaviyoCampaignVO[]>>('getKlaviyoCampaigns', params)
export const getKlaviyoSubscriberGrowth = (params: KlaviyoReportReqVO) =>
  callKlaviyo<Promise<KlaviyoGrowthItem[]>>('getKlaviyoSubscriberGrowth', params)
