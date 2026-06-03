import type { PageResourceIdentity } from '@tooto-tech/webbuilder-core'

export interface LayoutTemplatePageRecord extends PageResourceIdentity {
  id?: number
  resourceId?: number
  resourceKey?: string
  resourceName?: string
  resourceType?: string
  resourceScope?: string
  ownerType?: string
  ownerId?: number
  schemaJson?: string
  extJson?: string
  createTime?: Date | string
  updateTime?: Date | string
}

export interface LayoutTemplatePageListResult<T = LayoutTemplatePageRecord> {
  list?: T[]
  total?: number
}

export interface LayoutTemplateSaveRequest extends PageResourceIdentity {
  resourceId?: number
  resourceKey?: string
  resourceName?: string
  resourceType?: string
  resourceScope?: string
  schemaJson?: string
  extJson?: string
  baseUpdateTime?: Date | string
  forceOverride?: boolean
  sessionKey?: string
}

export interface LayoutTemplatePublishRequest extends LayoutTemplateSaveRequest {}

export interface LayoutTemplatePageQuery extends PageResourceIdentity {
  pageNo?: number
  pageSize?: number
  resourceTypes?: string[]
  resourceType?: string
  resourceScope?: string
  status?: string | number
}

export interface LayoutTemplateStorageAdapter {
  getDraft: (resource: PageResourceIdentity) => Promise<LayoutTemplatePageRecord | null>
  saveDraft: (request: LayoutTemplateSaveRequest) => Promise<LayoutTemplatePageRecord>
  publishVersion: (request: LayoutTemplatePublishRequest) => Promise<unknown>
}

export interface LayoutTemplateListStorageAdapter extends LayoutTemplateStorageAdapter {
  getPagePage: (
    params: LayoutTemplatePageQuery
  ) => Promise<LayoutTemplatePageListResult>
}
