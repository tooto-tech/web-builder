import type {
  ResourceOperationResponse,
  ResourceTransactionParticipant,
} from './useResourceTransaction'

export type ResourceParticipantMode = 'save' | 'publish' | 'lifecycle'
export type PublishParticipantTarget = 'draft' | 'rules'

type MaybePromise<T> = T | Promise<T>
type BooleanRefLike = { value: boolean }
type ResourceProjectData = Record<string, unknown> | null | undefined

export interface ResourceParticipantEditor {
  getProjectData?: () => ResourceProjectData
}

export interface SharedResourcesParticipantManager {
  hasPendingChanges?: BooleanRefLike
  flushPendingSaves?: (
    options: { blockOnError: boolean },
  ) => MaybePromise<ResourceOperationResponse>
}

export interface LayoutParticipantManager {
  hasPendingChanges: BooleanRefLike
  hasUnsavedUserChanges?: BooleanRefLike
  saveLayoutResources: (
    editor: ResourceParticipantEditor | null | undefined,
    silent?: boolean,
  ) => MaybePromise<ResourceOperationResponse>
  publishLayoutRules: (silent?: boolean) => MaybePromise<ResourceOperationResponse>
  releaseAllLocks: () => MaybePromise<void>
  hasCurrentResourceChanges: (projectData: ResourceProjectData) => boolean
}

export interface LayoutParticipantContext {
  manager: LayoutParticipantManager
  getEditor: () => ResourceParticipantEditor | null | undefined
  getSaveSilent?: () => boolean
}

export interface TemplateParticipantManager {
  hasPendingChanges: BooleanRefLike
  saveTemplateRules: (silent?: boolean) => MaybePromise<ResourceOperationResponse>
  publishTemplateRules: (silent?: boolean) => MaybePromise<ResourceOperationResponse>
  releaseAllLocks: () => MaybePromise<void>
}

export interface TemplateParticipantOptions {
  getSaveSilent?: () => boolean
  publishTarget?: PublishParticipantTarget
}

export interface PageParticipantContext {
  draftManager: {
    saveDraftData: (silent?: boolean) => MaybePromise<ResourceOperationResponse>
  }
  publishManager: {
    publish: () => MaybePromise<ResourceOperationResponse>
  }
  editLock: {
    releaseEditLock: () => MaybePromise<void>
  }
  layoutBundleManager: Pick<LayoutParticipantManager, 'hasCurrentResourceChanges'>
  editorChanges: {
    hasChanges: BooleanRefLike
  }
  getEditor: () => ResourceParticipantEditor | null | undefined
  getSaveSilent?: () => boolean
}

export interface PublishTargetOptions {
  publishTarget?: PublishParticipantTarget
}

const getSaveSilent = (getSilent?: () => boolean) => Boolean(getSilent?.())

const getEditorProjectData = (
  getEditor: () => ResourceParticipantEditor | null | undefined,
) => getEditor()?.getProjectData?.() || null

export const makeSharedResourcesParticipant = (
  manager: SharedResourcesParticipantManager | null | undefined,
  mode: ResourceParticipantMode,
): ResourceTransactionParticipant => {
  if (mode === 'save') {
    return {
      id: 'shared-draft-resources',
      label: '全局样式/脚本',
      isDirty: true,
      failurePolicy: 'warning',
      flushDraft: () => manager?.flushPendingSaves?.({ blockOnError: false }),
      publish: () => true,
      releaseLock: () => undefined,
    }
  }

  if (mode === 'publish') {
    return {
      id: 'shared-publish-resources',
      label: '全局样式/脚本',
      isDirty: true,
      failurePolicy: 'blocking',
      flushDraft: () => true,
      publish: () => manager?.flushPendingSaves?.({ blockOnError: true }),
      releaseLock: () => undefined,
    }
  }

  return {
    id: 'shared-resources',
    label: '全局样式/脚本',
    isDirty: () => Boolean(manager?.hasPendingChanges?.value),
    failurePolicy: 'warning',
    flushDraft: () => true,
    publish: () => true,
    releaseLock: () => undefined,
  }
}

export const makeLayoutParticipant = (
  context: LayoutParticipantContext,
  mode: ResourceParticipantMode,
  options: PublishTargetOptions = {},
): ResourceTransactionParticipant => {
  const { manager } = context

  if (mode === 'save') {
    return {
      id: 'layout-draft-resources',
      label: '布局共享资源',
      isDirty: () => Boolean(manager.hasPendingChanges.value),
      failurePolicy: 'warning',
      flushDraft: () =>
        manager.saveLayoutResources(
          context.getEditor(),
          getSaveSilent(context.getSaveSilent),
        ),
      publish: () => true,
      releaseLock: () => manager.releaseAllLocks(),
    }
  }

  if (mode === 'publish' && options.publishTarget === 'rules') {
    return {
      id: 'layout-publish-rules',
      label: '布局规则',
      isDirty: true,
      failurePolicy: 'blocking',
      flushDraft: () => true,
      publish: () => manager.publishLayoutRules(true),
      releaseLock: () => manager.releaseAllLocks(),
    }
  }

  if (mode === 'publish') {
    return {
      id: 'layout-publish-draft',
      label: '布局共享资源',
      isDirty: true,
      failurePolicy: 'blocking',
      flushDraft: () => true,
      publish: () => manager.saveLayoutResources(context.getEditor(), true),
      releaseLock: () => manager.releaseAllLocks(),
    }
  }

  return {
    id: 'layout-resources',
    label: '布局共享资源',
    isDirty: () => Boolean(manager.hasUnsavedUserChanges?.value ?? manager.hasPendingChanges.value),
    failurePolicy: 'warning',
    flushDraft: () => true,
    publish: () => true,
    releaseLock: () => manager.releaseAllLocks(),
  }
}

export const makeTemplateParticipant = (
  manager: TemplateParticipantManager,
  mode: ResourceParticipantMode,
  options: TemplateParticipantOptions = {},
): ResourceTransactionParticipant => {
  if (mode === 'save') {
    return {
      id: 'template-draft-rules',
      label: '模板规则',
      isDirty: () => Boolean(manager.hasPendingChanges.value),
      failurePolicy: 'warning',
      flushDraft: () => manager.saveTemplateRules(getSaveSilent(options.getSaveSilent)),
      publish: () => true,
      releaseLock: () => manager.releaseAllLocks(),
    }
  }

  if (mode === 'publish' && options.publishTarget === 'rules') {
    return {
      id: 'template-publish-rules',
      label: '模板规则',
      isDirty: true,
      failurePolicy: 'blocking',
      flushDraft: () => true,
      publish: () => manager.publishTemplateRules(true),
      releaseLock: () => manager.releaseAllLocks(),
    }
  }

  if (mode === 'publish') {
    return {
      id: 'template-publish-draft',
      label: '模板规则草稿',
      isDirty: true,
      failurePolicy: 'blocking',
      flushDraft: () => true,
      publish: () => manager.saveTemplateRules(true),
      releaseLock: () => manager.releaseAllLocks(),
    }
  }

  return {
    id: 'template-rules',
    label: '模板规则',
    isDirty: () => Boolean(manager.hasPendingChanges.value),
    failurePolicy: 'warning',
    flushDraft: () => true,
    publish: () => true,
    releaseLock: () => manager.releaseAllLocks(),
  }
}

export const makePageParticipant = (
  context: PageParticipantContext,
  mode: ResourceParticipantMode,
): ResourceTransactionParticipant => {
  if (mode === 'save') {
    return {
      id: 'page-draft',
      label: '页面草稿',
      isDirty: () =>
        context.layoutBundleManager.hasCurrentResourceChanges(
          getEditorProjectData(context.getEditor),
        ),
      failurePolicy: 'blocking',
      flushDraft: () => context.draftManager.saveDraftData(getSaveSilent(context.getSaveSilent)),
      publish: () => true,
      releaseLock: () => context.editLock.releaseEditLock(),
    }
  }

  if (mode === 'publish') {
    return {
      id: 'page-publish',
      label: '页面发布',
      isDirty: true,
      failurePolicy: 'blocking',
      flushDraft: () => true,
      publish: () => context.publishManager.publish(),
      releaseLock: () => context.editLock.releaseEditLock(),
    }
  }

  return {
    id: 'page-draft',
    label: '页面草稿',
    isDirty: () =>
      context.editorChanges.hasChanges.value ||
      context.layoutBundleManager.hasCurrentResourceChanges(
        getEditorProjectData(context.getEditor),
      ),
    failurePolicy: 'blocking',
    flushDraft: () => true,
    publish: () => true,
    releaseLock: () => context.editLock.releaseEditLock(),
  }
}
