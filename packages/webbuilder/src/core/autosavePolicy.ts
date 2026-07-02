export type AutosaveDecisionReason =
  | 'ready'
  | 'disabled'
  | 'no-pending-change'
  | 'debouncing'
  | 'saving'
  | 'backoff'

export interface AutosavePolicyInput {
  enabled: boolean
  nowMs: number
  pendingSinceMs: number | null
  lastSavedAtMs: number | null
  isSaving: boolean
  debounceMs: number
  retryBackoffMs: number
  failureCount: number
}

export interface AutosavePolicyDecision {
  shouldSave: boolean
  reason: AutosaveDecisionReason
  waitMs?: number
}

const positiveWait = (waitMs: number) => Math.max(0, Math.ceil(waitMs))

export const evaluateAutosavePolicy = (input: AutosavePolicyInput): AutosavePolicyDecision => {
  if (!input.enabled) return { shouldSave: false, reason: 'disabled' }
  if (input.pendingSinceMs === null) return { shouldSave: false, reason: 'no-pending-change' }
  if (input.isSaving) return { shouldSave: false, reason: 'saving' }

  const elapsedSinceChange = input.nowMs - input.pendingSinceMs
  if (elapsedSinceChange < input.debounceMs) {
    return {
      shouldSave: false,
      reason: 'debouncing',
      waitMs: positiveWait(input.debounceMs - elapsedSinceChange),
    }
  }

  if (
    input.failureCount > 0 &&
    input.retryBackoffMs > 0 &&
    input.lastSavedAtMs !== null
  ) {
    const elapsedSinceFailure = input.nowMs - input.lastSavedAtMs
    if (elapsedSinceFailure < input.retryBackoffMs) {
      return {
        shouldSave: false,
        reason: 'backoff',
        waitMs: positiveWait(input.retryBackoffMs - elapsedSinceFailure),
      }
    }
  }

  return { shouldSave: true, reason: 'ready' }
}
