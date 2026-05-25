import { computed, type ComputedRef, type Ref } from 'vue'
import type { PageResourceIdentity } from '@/api/content/page'
import useEditLock, { type UseEditLockOptions } from './useEditLock'

type BooleanRefLike = Ref<boolean> | ComputedRef<boolean>

export interface EditSession {
  sessionKey: string
  hasEditLock: boolean
  hasUnsavedChanges: boolean
}

export interface UseEditSessionOptions {
  pageResource: () => PageResourceIdentity
  editorChanges: {
    hasChanges: BooleanRefLike
  }
  hasDirtyResources?: () => boolean
  onTakenOver?: () => void | Promise<void>
  _deps?: UseEditLockOptions['_deps']
}

export interface UseEditSessionReturn {
  session: ComputedRef<EditSession | null>
  hasEditLock: ReturnType<typeof useEditLock>['hasEditLock']
  currentSessionKey: ReturnType<typeof useEditLock>['currentSessionKey']
  hasUnsavedChanges: ComputedRef<boolean>
  tryAcquireLock: ReturnType<typeof useEditLock>['tryAcquireLock']
  releaseEditLock: ReturnType<typeof useEditLock>['releaseEditLock']
  sendHeartbeat: ReturnType<typeof useEditLock>['sendHeartbeat']
  startTimers: ReturnType<typeof useEditLock>['startTimers']
  stopTimers: ReturnType<typeof useEditLock>['stopTimers']
  allowNextBeforeUnload: ReturnType<typeof useEditLock>['allowNextBeforeUnload']
  handleBeforeUnload: ReturnType<typeof useEditLock>['handleBeforeUnload']
}

export default function useEditSession(options: UseEditSessionOptions): UseEditSessionReturn {
  const hasUnsavedChanges = computed(() =>
    options.editorChanges.hasChanges.value || Boolean(options.hasDirtyResources?.())
  )

  const editLock = useEditLock({
    pageResource: options.pageResource,
    onTakenOver: options.onTakenOver,
    hasUnsavedChanges: () => hasUnsavedChanges.value,
    _deps: options._deps,
  })

  const session = computed<EditSession | null>(() => {
    const sessionKey = editLock.currentSessionKey.value
    if (!sessionKey) return null
    return {
      sessionKey,
      hasEditLock: editLock.hasEditLock.value,
      hasUnsavedChanges: hasUnsavedChanges.value,
    }
  })

  return {
    session,
    hasEditLock: editLock.hasEditLock,
    currentSessionKey: editLock.currentSessionKey,
    hasUnsavedChanges,
    tryAcquireLock: editLock.tryAcquireLock,
    releaseEditLock: editLock.releaseEditLock,
    sendHeartbeat: editLock.sendHeartbeat,
    startTimers: editLock.startTimers,
    stopTimers: editLock.stopTimers,
    allowNextBeforeUnload: editLock.allowNextBeforeUnload,
    handleBeforeUnload: editLock.handleBeforeUnload,
  }
}
