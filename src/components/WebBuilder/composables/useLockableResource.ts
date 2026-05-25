import { ref } from 'vue'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import {
  acquireLock,
  releaseLock,
  updateHeartbeat,
  type PageEditLockRespVO,
  type PageResourceIdentity,
} from '@/api/content/page'
import { releaseLockKeepalive } from '../utils/lockKeepalive'

export const PAGE_CONFLICT_CODE = 1009012001
export const PAGE_LOCK_REQUIRED_CODE = 1009013000
export const PAGE_LOCK_NOT_ACQUIRED_CODE = 1009013001
export const PAGE_LOCK_HELD_BY_OTHER_CODE = 1009013002

export interface ResourceLockState {
  status: 'idle' | 'acquiring' | 'holding' | 'conflict' | 'error'
  holder: PageEditLockRespVO | null
  resource: PageResourceIdentity | null
  message: string
}

export interface UseLockableResourceOptions {
  resourceName: string
  getResource: () => PageResourceIdentity
  getSessionKey: () => string
  onWarning?: (message: string) => void
  onError?: (message: string) => void
}

export const createLockState = (): ResourceLockState => ({
  status: 'idle',
  holder: null,
  resource: null,
  message: '',
})

export const cloneLockState = (state?: Partial<ResourceLockState>): ResourceLockState => ({
  ...createLockState(),
  ...state,
})

export const lockErrorMessage = (resourceName: string, error: any) => {
  if (error?.code === PAGE_LOCK_REQUIRED_CODE) {
    return `${resourceName} 缺少编辑锁，会话已失效，请刷新后重试`
  }
  if (error?.code === PAGE_LOCK_NOT_ACQUIRED_CODE || error?.code === PAGE_LOCK_HELD_BY_OTHER_CODE) {
    return error?.message || `${resourceName} 已被其他人占用`
  }
  if (error?.code === PAGE_CONFLICT_CODE) {
    return `${resourceName} 保存冲突，请刷新后重试`
  }
  return error?.message || `${resourceName} 操作失败`
}

export const mapLockOperationError = (resourceName: string, error: any) => ({
  hasConflict: error?.code === PAGE_CONFLICT_CODE,
  message: lockErrorMessage(resourceName, error),
})

export interface LockableResourceOperationOptions<TResult> {
  silent?: boolean
  onSuccess?: (result: TResult) => void
}

export interface LockableResourceOperationResult<TResult> {
  success: boolean
  hasConflict: boolean
  hasFailure: boolean
  result?: TResult
  message?: string
}

export function useLockableResource(options: UseLockableResourceOptions) {
  const state = ref<ResourceLockState>(createLockState())

  const warn = (message: string) => {
    if (options.onWarning) {
      options.onWarning(message)
      return
    }
    ElMessage.warning(message)
  }

  const error = (message: string) => {
    if (options.onError) {
      options.onError(message)
      return
    }
    ElMessage.error(message)
  }

  const getState = (): ResourceLockState => cloneLockState(state.value)

  const reset = () => {
    state.value = createLockState()
  }

  const markHolding = (resource: PageResourceIdentity = options.getResource()) => {
    state.value = {
      status: 'holding',
      holder: null,
      resource,
      message: '',
    }
  }

  const ensureEditable = async (silent = false) => {
    if (state.value.status === 'holding') return true

    const resource = options.getResource()
    state.value = {
      ...state.value,
      status: 'acquiring',
      resource,
      message: '',
    }

    try {
      const result = await acquireLock({
        ...resource,
        sessionKey: options.getSessionKey(),
      })
      if (result === null) {
        markHolding(resource)
        return true
      }

      state.value = {
        status: 'conflict',
        holder: result,
        resource,
        message: result.isCurrentUser
          ? `${options.resourceName}正在其他浏览器或标签页中编辑`
          : `${options.resourceName}正在由 ${result.username} 编辑`,
      }
      if (!silent) warn(state.value.message)
      return false
    } catch (err: any) {
      state.value = {
        status: 'error',
        holder: null,
        resource,
        message: lockErrorMessage(options.resourceName, err),
      }
      if (!silent) error(state.value.message)
      return false
    }
  }

  const heartbeat = async () => {
    const sessionKey = options.getSessionKey()
    if (!sessionKey) return
    if (state.value.status !== 'holding' || !state.value.resource) return

    const resource = state.value.resource
    try {
      const result = await updateHeartbeat(resource, sessionKey)
      if (result.takenOver && result.takeoverInfo) {
        state.value = {
          status: 'conflict',
          holder: result.takeoverInfo,
          resource,
          message: result.takeoverInfo.isCurrentUser
            ? `${options.resourceName}已被其他浏览器或标签页接管`
            : `${options.resourceName}已被 ${result.takeoverInfo.username} 接管`,
        }
      }
    } catch {
      // noop
    }
  }

  const release = async () => {
    const sessionKey = options.getSessionKey()
    if (!sessionKey) return
    if (state.value.status === 'holding' && state.value.resource) {
      await releaseLock(state.value.resource, sessionKey).catch(() => undefined)
    }
    reset()
  }

  const releaseKeepalive = () => {
    const sessionKey = options.getSessionKey()
    if (!sessionKey) return
    if (state.value.status === 'holding' && state.value.resource) {
      const resource = state.value.resource
      const keepaliveTriggered = releaseLockKeepalive(resource, sessionKey)
      if (!keepaliveTriggered) {
        releaseLock(resource, sessionKey).catch(() => undefined)
      }
    }
  }

  const runOperation = async <TResult>(
    operation: () => Promise<TResult>,
    operationOptions: LockableResourceOperationOptions<TResult> = {},
  ): Promise<LockableResourceOperationResult<TResult>> => {
    try {
      const result = await operation()
      operationOptions.onSuccess?.(result)
      markHolding()
      return {
        success: true,
        hasConflict: false,
        hasFailure: false,
        result,
      }
    } catch (err: any) {
      const operationError = mapLockOperationError(options.resourceName, err)
      if (!operationOptions.silent) {
        error(operationError.message)
      }
      return {
        success: false,
        hasConflict: operationError.hasConflict,
        hasFailure: true,
        message: operationError.message,
      }
    }
  }

  const save = <TResult>(
    operation: () => Promise<TResult>,
    operationOptions?: LockableResourceOperationOptions<TResult>,
  ) => runOperation(operation, operationOptions)

  const publish = <TResult>(
    operation: () => Promise<TResult>,
    operationOptions?: LockableResourceOperationOptions<TResult>,
  ) => runOperation(operation, operationOptions)

  return {
    state,
    getState,
    ensureEditable,
    heartbeat,
    release,
    releaseKeepalive,
    save,
    publish,
    markHolding,
    reset,
  }
}

export default useLockableResource
