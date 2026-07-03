import { ref } from 'vue'

import { evaluateAutosavePolicy } from '../../core/autosavePolicy.js'

export interface AutosaveControllerOptions {
  enabled?: boolean
  debounceMs?: number
  retryBackoffMs?: number
  autosaveChanges?: number
}

export interface UseAutosaveControllerOptions {
  saveDraft: (options?: { silent?: boolean }) => Promise<boolean>
  options?: AutosaveControllerOptions
  now?: () => number
}

const DEFAULT_DEBOUNCE_MS = 800

export const useAutosaveController = (input: UseAutosaveControllerOptions) => {
  const hasPendingChange = ref(false)
  const isAutosaving = ref(false)
  const failureCount = ref(0)
  const lastSavedAtMs = ref<number | null>(null)

  let pendingSinceMs: number | null = null
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let pendingChangeCount = 0

  const now = () => input.now?.() ?? Date.now()
  const getOptions = () => ({
    enabled: input.options?.enabled !== false,
    debounceMs: input.options?.debounceMs ?? DEFAULT_DEBOUNCE_MS,
    retryBackoffMs: input.options?.retryBackoffMs ?? 0,
    autosaveChanges:
      typeof input.options?.autosaveChanges === 'number' && input.options.autosaveChanges > 0
        ? Math.floor(input.options.autosaveChanges)
        : undefined,
  })

  const clearTimer = () => {
    if (!saveTimer) return
    clearTimeout(saveTimer)
    saveTimer = null
  }

  const runSave = async () => {
    clearTimer()
    if (!hasPendingChange.value) return true

    isAutosaving.value = true
    try {
      const saved = await input.saveDraft({ silent: true })
      lastSavedAtMs.value = now()
      if (saved) {
        hasPendingChange.value = false
        pendingSinceMs = null
        pendingChangeCount = 0
        failureCount.value = 0
        return true
      }
      failureCount.value += 1
      return false
    } finally {
      isAutosaving.value = false
    }
  }

  const schedule = () => {
    clearTimer()
    const options = getOptions()
    const decision = evaluateAutosavePolicy({
      enabled: options.enabled,
      nowMs: now(),
      pendingSinceMs,
      lastSavedAtMs: lastSavedAtMs.value,
      isSaving: isAutosaving.value,
      debounceMs: options.debounceMs,
      retryBackoffMs: options.retryBackoffMs,
      failureCount: failureCount.value,
    })

    if (decision.shouldSave) {
      saveTimer = setTimeout(() => {
        void runSave()
      }, 0)
      return
    }

    if (decision.reason === 'disabled') {
      hasPendingChange.value = false
      pendingSinceMs = null
      pendingChangeCount = 0
      return
    }

    if (decision.waitMs !== undefined) {
      saveTimer = setTimeout(() => {
        void runSave()
      }, decision.waitMs)
    }
  }

  const recordChange = () => {
    const options = getOptions()
    if (!options.enabled) {
      hasPendingChange.value = false
      pendingSinceMs = null
      pendingChangeCount = 0
      clearTimer()
      return
    }

    hasPendingChange.value = true
    pendingSinceMs = pendingSinceMs ?? now()

    if (options.autosaveChanges) {
      pendingChangeCount += 1
      clearTimer()
      if (pendingChangeCount >= options.autosaveChanges) {
        saveTimer = setTimeout(() => {
          void runSave()
        }, 0)
      }
      return
    }

    pendingSinceMs = now()
    schedule()
  }

  const flush = () => runSave()

  const stop = () => {
    clearTimer()
  }

  return {
    hasPendingChange,
    isAutosaving,
    recordChange,
    flush,
    stop,
  }
}
