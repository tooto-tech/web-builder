import { computed, ref } from 'vue'

import {
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  type EditLockState,
  type HostServices,
  type HostUi,
  type PageResourceIdentity,
} from '../../core/index.js'

export interface UseLockControllerOptions {
  editor: unknown | (() => unknown)
  resource: PageResourceIdentity | (() => PageResourceIdentity)
  hostServices: HostServices
  ui: Pick<HostUi, 'message'>
  getSessionKey?: () => string
  heartbeatIntervalMs?: number
  onTakenOver?: (state: EditLockState) => void | Promise<void>
}

const DEFAULT_HEARTBEAT_INTERVAL_MS = 10000

const getValue = <T>(value: T | (() => T)): T =>
  typeof value === 'function' ? (value as () => T)() : value

const createUnlockedState = (): EditLockState => ({
  locked: false,
  ownedByMe: false,
})

const getMessage = (state: EditLockState) =>
  state.message ||
  (state.holder?.displayName
    ? `${state.holder.displayName} 正在编辑`
    : '当前资源已被其他会话编辑')

export const useLockController = (options: UseLockControllerOptions) => {
  const lockState = ref<EditLockState>(createUnlockedState())
  const heartbeatInFlight = ref(false)
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  const getEditor = () => getValue(options.editor)
  const getResource = () => normalizePageResourceIdentity(getValue(options.resource))
  const sessionOptions = () => ({ sessionKey: options.getSessionKey?.() ?? '' })

  const isLockedByOther = computed(() =>
    lockState.value.locked && !lockState.value.ownedByMe
  )

  const applyReadonly = (readonly: boolean) => {
    const editor = getEditor()
    if (
      editor &&
      typeof editor === 'object' &&
      'setReadOnly' in editor &&
      typeof editor.setReadOnly === 'function'
    ) {
      editor.setReadOnly(readonly)
    }
  }

  const stopHeartbeat = () => {
    if (!heartbeatTimer) return
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
    heartbeatInFlight.value = false
  }

  const handleState = async (state: EditLockState) => {
    lockState.value = state
    applyReadonly(state.locked && !state.ownedByMe)
    if (state.locked && !state.ownedByMe) {
      stopHeartbeat()
      options.ui.message.warning(getMessage(state))
      await options.onTakenOver?.(state)
      return false
    }
    return true
  }

  const heartbeat = async () => {
    if (!options.hostServices.lock?.heartbeat) return
    if (heartbeatInFlight.value) return
    if (!lockState.value.locked || !lockState.value.ownedByMe) return

    heartbeatInFlight.value = true
    try {
      const nextState = await options.hostServices.lock.heartbeat(getResource(), sessionOptions())
      await handleState(nextState)
    } finally {
      heartbeatInFlight.value = false
    }
  }

  const startHeartbeat = (intervalMs?: number) => {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      void heartbeat()
    }, intervalMs ?? options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS)
  }

  const acquire = async (forceTakeover = false, immediateTakeover = false) => {
    const resource = getResource()
    if (!hasPageResourceLocator(resource)) return true
    if (!options.hostServices.lock?.acquire) {
      options.ui.message.error('缺少 hostServices.lock.acquire')
      return false
    }

    const state = await options.hostServices.lock.acquire(resource, {
      ...sessionOptions(),
      forceTakeover,
      immediateTakeover,
    })
    const acquired = await handleState(state)
    if (acquired && state.locked && state.ownedByMe) {
      startHeartbeat(state.heartbeatIntervalMs)
    }
    return acquired
  }

  const release = async () => {
    stopHeartbeat()
    const resource = getResource()
    if (lockState.value.locked && lockState.value.ownedByMe) {
      await options.hostServices.lock?.release?.(resource, sessionOptions())
    }
    lockState.value = createUnlockedState()
    applyReadonly(false)
  }

  return {
    lockState,
    heartbeatInFlight,
    isLockedByOther,
    acquire,
    heartbeat,
    release,
    startHeartbeat,
    stopHeartbeat,
  }
}
