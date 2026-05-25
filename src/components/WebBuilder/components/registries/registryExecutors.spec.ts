import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { getRegistryEntryIds } from './registryManifest'

const __dirname = dirname(fileURLToPath(import.meta.url))

vi.mock('element-plus', () => ({
  ElButton: 'ElButton',
  ElOption: 'ElOption',
  ElSelect: 'ElSelect',
}))

vi.mock('@/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/utils/auth', () => ({
  getAccessToken: vi.fn(() => ''),
  getEffectiveTenantId: vi.fn(() => ''),
  getTenantId: vi.fn(() => ''),
  getVisitTenantId: vi.fn(() => ''),
}))

interface RegistryExecutor {
  id: string
  register: unknown
}

describe('component registry executors', () => {
  it('provides one executor for every manifest entry in registration order', async () => {
    vi.stubGlobal('window', globalThis)
    vi.stubGlobal('navigator', { userAgent: 'vitest' })
    const registryModule = await import('./index')
    const COMPONENT_REGISTRIES = registryModule.COMPONENT_REGISTRIES as RegistryExecutor[]

    expect(COMPONENT_REGISTRIES.map(entry => entry.id)).toEqual(getRegistryEntryIds())
    expect(COMPONENT_REGISTRIES.every(entry => typeof entry.register === 'function')).toBe(true)
  })

  it('keeps useComponentRegistration as a small orchestration layer', () => {
    const source = readFileSync(
      resolve(__dirname, '../../composables/useComponentRegistration.ts'),
      'utf8',
    )

    expect(source.trimEnd().split(/\r?\n/).length).toBeLessThanOrEqual(80)
  })
})
