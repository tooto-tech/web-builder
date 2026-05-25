import { describe, expect, it } from 'vitest'
import {
  clearRegistrationDiagnostics,
  createBlockingRegistrationError,
  recordRegistrationFailure,
} from './useRegistrationDiagnostics'
import useRegistrationDiagnostics from './useRegistrationDiagnostics'
import type { RegistryManifestEntry } from '../components/registries/registryManifest'

const makeEntry = (
  id: string,
  failurePolicy: RegistryManifestEntry['failurePolicy'],
): RegistryManifestEntry => ({
  id,
  failurePolicy,
  registeredTypes: [`type:${id}`],
})

describe('useRegistrationDiagnostics', () => {
  it('records optional registration failures as visible diagnostics', () => {
    clearRegistrationDiagnostics()
    const diagnostics = useRegistrationDiagnostics()

    const diagnostic = recordRegistrationFailure(
      makeEntry('optionalPack', 'optional'),
      new Error('missing dependency'),
    )

    expect(diagnostics.blockingDiagnostic.value).toBeNull()
    expect(diagnostics.optionalDiagnostics.value).toEqual([diagnostic])
    expect(diagnostic.message).toContain('可选组件注册失败')
    expect(diagnostic.message).toContain('missing dependency')
  })

  it('records core failures and creates a blocking error that preserves the cause', () => {
    clearRegistrationDiagnostics()
    const diagnostics = useRegistrationDiagnostics()
    const cause = new Error('core trait unavailable')

    const diagnostic = recordRegistrationFailure(makeEntry('coreTrait', 'core'), cause)
    const error = createBlockingRegistrationError(diagnostic)

    expect(diagnostics.blockingDiagnostic.value).toEqual(diagnostic)
    expect(diagnostics.optionalDiagnostics.value).toEqual([])
    expect(error.message).toBe(diagnostic.message)
    expect((error as Error & { cause?: unknown }).cause).toBe(cause)
  })
})
