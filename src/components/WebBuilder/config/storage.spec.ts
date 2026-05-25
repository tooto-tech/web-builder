import { afterEach, describe, expect, it } from 'vitest'

import { clearWebBuilderRuntime, setWebBuilderRuntime } from '@/runtime'

import {
  WEB_BUILDER_STORAGE_MODE,
  isBackendStorageMode,
  isIndexedDbStorageMode,
} from './storage'

describe('storage mode config', () => {
  afterEach(() => {
    clearWebBuilderRuntime()
  })

  it('reports backend mode by default', () => {
    expect(WEB_BUILDER_STORAGE_MODE).toBe('backend')
    expect(isIndexedDbStorageMode()).toBe(false)
    expect(isBackendStorageMode()).toBe(true)
  })

  it('reports IndexedDB mode when configured by runtime props', () => {
    setWebBuilderRuntime({ adapters: {}, storageMode: 'indexeddb' })

    expect(isIndexedDbStorageMode()).toBe(true)
    expect(isBackendStorageMode()).toBe(false)
  })
})
