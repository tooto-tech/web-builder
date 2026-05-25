import { computed, ref } from 'vue'
import type {
  RegistryFailurePolicy,
  RegistryManifestEntry,
} from '../components/registries/registryManifest'

export interface RegistrationDiagnostic {
  entryId: string
  registeredTypes: string[]
  failurePolicy: RegistryFailurePolicy
  message: string
  error: unknown
}

const diagnostics = ref<RegistrationDiagnostic[]>([])
const blockingDiagnostic = ref<RegistrationDiagnostic | null>(null)

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || '注册失败')
  }
  return '注册失败'
}

export function clearRegistrationDiagnostics() {
  diagnostics.value = []
  blockingDiagnostic.value = null
}

export function recordRegistrationFailure(
  entry: RegistryManifestEntry,
  error: unknown,
): RegistrationDiagnostic {
  const diagnostic: RegistrationDiagnostic = {
    entryId: entry.id,
    registeredTypes: [...entry.registeredTypes],
    failurePolicy: entry.failurePolicy,
    message: `${entry.failurePolicy === 'core' ? '核心' : '可选'}组件注册失败：${
      entry.id
    }（${getErrorMessage(error)}）`,
    error,
  }
  diagnostics.value = [...diagnostics.value, diagnostic]
  if (entry.failurePolicy === 'core') {
    blockingDiagnostic.value = diagnostic
  }
  return diagnostic
}

export function createBlockingRegistrationError(diagnostic: RegistrationDiagnostic): Error {
  const error = new Error(diagnostic.message)
  ;(error as Error & { cause?: unknown }).cause = diagnostic.error
  return error
}

export default function useRegistrationDiagnostics() {
  const optionalDiagnostics = computed(() =>
    diagnostics.value.filter((item) => item.failurePolicy === 'optional')
  )

  return {
    diagnostics,
    optionalDiagnostics,
    blockingDiagnostic,
    clear: clearRegistrationDiagnostics,
  }
}
