import { callContentAdapter } from '@/runtime'
import type { ApiRecord, PageResult } from '@/api/types'

export interface InquiryTypeVO extends ApiRecord {}
export interface InquiryTypeCreateVO extends ApiRecord {}
export interface InquiryTypeUpdateVO extends ApiRecord {}
export interface InquiryTypePageVO extends ApiRecord {}
export interface InquiryTypeFieldVO extends ApiRecord {}
export interface InquiryTypeFieldCreateVO extends ApiRecord {}
export interface InquiryTypeFieldUpdateVO extends ApiRecord {}
export interface InquiryDataPageVO extends ApiRecord {}
export interface InquiryDataUpdateVO extends ApiRecord {}
export interface InquiryDataStatusUpdateVO extends ApiRecord {}
export interface InquiryDataRemarkUpdateVO extends ApiRecord {}
export interface InquiryDataFollowUpUpdateVO extends ApiRecord {}
export interface InquiryDataExportVO extends ApiRecord {}
export interface TenantMailConfigVO extends ApiRecord {}
export interface InquiryReplySendVO extends ApiRecord {}
export interface TenantMailTestVO extends ApiRecord {}

const callInquiry = <T = unknown>(method: string, ...args: any[]): T =>
  callContentAdapter<T>('inquiry', method, ...args)

export const getInquiryTypePage = (params: InquiryTypePageVO) =>
  callInquiry<Promise<PageResult<InquiryTypeVO>>>('getInquiryTypePage', params)
export const getInquiryTypeList = () => callInquiry<Promise<InquiryTypeVO[]>>('getInquiryTypeList')
export const getInquiryType = (id: number) => callInquiry<Promise<InquiryTypeVO>>('getInquiryType', id)
export const createInquiryType = (data: InquiryTypeCreateVO) => callInquiry('createInquiryType', data)
export const updateInquiryType = (data: InquiryTypeUpdateVO) => callInquiry('updateInquiryType', data)
export const deleteInquiryType = (id: number) => callInquiry('deleteInquiryType', id)
export const getFieldList = (inquiryTypeId: number) =>
  callInquiry<Promise<InquiryTypeFieldVO[]>>('getFieldList', inquiryTypeId)
export const createField = (data: InquiryTypeFieldCreateVO) => callInquiry('createField', data)
export const updateField = (data: InquiryTypeFieldUpdateVO) => callInquiry('updateField', data)
export const deleteField = (id: number) => callInquiry('deleteField', id)
export const generateFormCode = (id: number) => callInquiry('generateFormCode', id)
export const getInquiryDataPage = (data: InquiryDataPageVO) => callInquiry('getInquiryDataPage', data)
export const getInquiryData = (inquiryTypeId: number, id: number) =>
  callInquiry('getInquiryData', inquiryTypeId, id)
export const updateInquiryData = (data: InquiryDataUpdateVO) => callInquiry('updateInquiryData', data)
export const updateInquiryStatus = (data: InquiryDataStatusUpdateVO) =>
  callInquiry('updateInquiryStatus', data)
export const updateInquiryRemark = (data: InquiryDataRemarkUpdateVO) =>
  callInquiry('updateInquiryRemark', data)
export const updateInquiryFollowUp = (data: InquiryDataFollowUpUpdateVO) =>
  callInquiry('updateInquiryFollowUp', data)
export const deleteInquiryData = (inquiryTypeId: number, id: number) =>
  callInquiry('deleteInquiryData', inquiryTypeId, id)
export const batchDeleteInquiryData = (inquiryTypeId: number, ids: number[]) =>
  callInquiry('batchDeleteInquiryData', inquiryTypeId, ids)
export const exportInquiryData = (params: InquiryDataExportVO) =>
  callInquiry('exportInquiryData', params)
export const saveTenantMailConfig = (data: TenantMailConfigVO) =>
  callInquiry('saveTenantMailConfig', data)
export const getTenantMailConfig = () => callInquiry('getTenantMailConfig')
export const sendTenantMailTest = (data: TenantMailTestVO) => callInquiry('sendTenantMailTest', data)
export const sendInquiryReply = (data: InquiryReplySendVO) => callInquiry('sendInquiryReply', data)
