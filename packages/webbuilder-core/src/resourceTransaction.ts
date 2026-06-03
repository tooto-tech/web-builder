export type ResourceFailurePolicy = 'blocking' | 'warning'
export type ResourceTransactionOperation = 'flushDraft' | 'publish' | 'releaseLock'

export type ResourceDirtyState =
  | boolean
  | { value: boolean }
  | (() => boolean)

export interface ResourceOperationResult {
  success?: boolean
  hasFailure?: boolean
  hasConflict?: boolean
  failedResources?: string[]
  message?: string
}

export type ResourceOperationResponse =
  | boolean
  | ResourceOperationResult
  | void

export interface ResourceTransactionParticipant {
  id: string
  label: string
  isDirty: ResourceDirtyState
  flushDraft: () => Promise<ResourceOperationResponse> | ResourceOperationResponse
  publish: () => Promise<ResourceOperationResponse> | ResourceOperationResponse
  releaseLock: () => Promise<void> | void
  failurePolicy: ResourceFailurePolicy
}

export interface ResourceTransactionDiagnostic {
  participantId: string
  participantLabel: string
  operation: ResourceTransactionOperation
  message: string
  hasConflict: boolean
  failedResources: string[]
  error?: unknown
}

export interface ResourceTransactionResult {
  success: boolean
  failures: ResourceTransactionDiagnostic[]
  warnings: ResourceTransactionDiagnostic[]
}

export interface UseResourceTransactionOptions {
  participants:
    | ResourceTransactionParticipant[]
    | (() => ResourceTransactionParticipant[])
}

const getParticipants = (options: UseResourceTransactionOptions) =>
  typeof options.participants === 'function'
    ? options.participants()
    : options.participants

const isParticipantDirty = (participant: ResourceTransactionParticipant) => {
  const dirty = participant.isDirty
  if (typeof dirty === 'function') return Boolean(dirty())
  if (typeof dirty === 'object' && dirty !== null && 'value' in dirty) {
    return Boolean(dirty.value)
  }
  return Boolean(dirty)
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || '资源操作失败')
  }
  return '资源操作失败'
}

const normalizeOperationFailure = (
  participant: ResourceTransactionParticipant,
  operation: ResourceTransactionOperation,
  response: ResourceOperationResponse,
): ResourceTransactionDiagnostic | null => {
  if (response === false) {
    return {
      participantId: participant.id,
      participantLabel: participant.label,
      operation,
      message: `${participant.label} 操作失败`,
      hasConflict: false,
      failedResources: [participant.label],
    }
  }

  if (!response || typeof response !== 'object') return null

  const failed = response.success === false || response.hasFailure === true
  if (!failed) return null

  const failedResources = Array.isArray(response.failedResources) && response.failedResources.length
    ? response.failedResources
    : [participant.label]

  return {
    participantId: participant.id,
    participantLabel: participant.label,
    operation,
    message: response.message || `${failedResources.join('、')} 操作失败`,
    hasConflict: response.hasConflict === true,
    failedResources,
  }
}

const normalizeThrownFailure = (
  participant: ResourceTransactionParticipant,
  operation: ResourceTransactionOperation,
  error: unknown,
): ResourceTransactionDiagnostic => ({
  participantId: participant.id,
  participantLabel: participant.label,
  operation,
  message: getErrorMessage(error),
  hasConflict: false,
  failedResources: [participant.label],
  error,
})

export function createResourceTransaction(options: UseResourceTransactionOptions) {
  const getDirtyParticipants = () => getParticipants(options).filter(isParticipantDirty)

  const runDirtyOperation = async (
    operation: Exclude<ResourceTransactionOperation, 'releaseLock'>,
  ): Promise<ResourceTransactionResult> => {
    const failures: ResourceTransactionDiagnostic[] = []
    const warnings: ResourceTransactionDiagnostic[] = []

    for (const participant of getParticipants(options)) {
      if (!isParticipantDirty(participant)) continue

      let diagnostic: ResourceTransactionDiagnostic | null = null
      try {
        diagnostic = normalizeOperationFailure(
          participant,
          operation,
          await participant[operation](),
        )
      } catch (error) {
        diagnostic = normalizeThrownFailure(participant, operation, error)
      }

      if (!diagnostic) continue

      if (participant.failurePolicy === 'warning') {
        warnings.push(diagnostic)
        continue
      }

      failures.push(diagnostic)
      break
    }

    return {
      success: failures.length === 0,
      failures,
      warnings,
    }
  }

  const releaseLocks = async (): Promise<ResourceTransactionResult> => {
    const warnings: ResourceTransactionDiagnostic[] = []

    for (const participant of getParticipants(options)) {
      try {
        await participant.releaseLock()
      } catch (error) {
        warnings.push(normalizeThrownFailure(participant, 'releaseLock', error))
      }
    }

    return {
      success: true,
      failures: [],
      warnings,
    }
  }

  return {
    getDirtyParticipants,
    hasDirtyResources: () => getDirtyParticipants().length > 0,
    flushDrafts: () => runDirtyOperation('flushDraft'),
    publish: () => runDirtyOperation('publish'),
    releaseLocks,
  }
}
