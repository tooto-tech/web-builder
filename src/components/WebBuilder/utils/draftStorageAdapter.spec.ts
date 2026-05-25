import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/content/page', async () => {
  const actual = await vi.importActual<typeof import('@/api/content/page/resourceIdentity')>(
    '@/api/content/page/resourceIdentity',
  )

  return {
    getDraft: vi.fn(),
    normalizePageResourceIdentity: actual.normalizePageResourceIdentity,
    saveDraft: vi.fn(),
  }
})

vi.mock('../config/storage', () => ({
  isIndexedDbStorageMode: vi.fn(() => false),
}))

vi.mock('./draftStorage', () => ({
  loadDraft: vi.fn(),
  saveDraft: vi.fn(),
}))

import { getDraft, saveDraft } from '@/api/content/page'
import { isIndexedDbStorageMode } from '../config/storage'
import { loadDraft as loadLocalDraft, saveDraft as saveLocalDraft } from './draftStorage'
import { createDraftStorageAdapter, getLocalDraftKey } from './draftStorageAdapter'

const mockedGetDraft = vi.mocked(getDraft)
const mockedSaveDraft = vi.mocked(saveDraft)
const mockedIsIndexedDbStorageMode = vi.mocked(isIndexedDbStorageMode)
const mockedLoadLocalDraft = vi.mocked(loadLocalDraft)
const mockedSaveLocalDraft = vi.mocked(saveLocalDraft)

describe('draft storage adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedIsIndexedDbStorageMode.mockReturnValue(false)
    vi.useRealTimers()
  })

  it('selects backend storage and dispatches load/save to backend API', async () => {
    const resource = { resourceId: 10, resourceType: 'PAGE', resourceScope: 'OWNED' }
    const request = {
      ...resource,
      resourceName: 'Backend page',
      schemaJson: '{"pages":[]}',
      sessionKey: 'session-1',
    }
    const loadedPage = { ...resource, schemaJson: '{"loaded":true}', updateTime: new Date('2026-01-01T00:00:00Z') }
    const savedPage = { ...resource, schemaJson: '{"saved":true}', updateTime: new Date('2026-01-01T00:00:01Z') }
    mockedGetDraft.mockResolvedValueOnce(loadedPage)
    mockedSaveDraft.mockResolvedValueOnce(savedPage)

    const adapter = createDraftStorageAdapter()

    await expect(adapter.load(resource)).resolves.toBe(loadedPage)
    await expect(adapter.save(request)).resolves.toBe(savedPage)
    expect(adapter.mode).toBe('backend')
    expect(adapter.supportsConflictOverride).toBe(true)
    expect(mockedGetDraft).toHaveBeenCalledWith(resource)
    expect(mockedSaveDraft).toHaveBeenCalledWith(request)
    expect(mockedLoadLocalDraft).not.toHaveBeenCalled()
    expect(mockedSaveLocalDraft).not.toHaveBeenCalled()
  })

  it('selects IndexedDB storage and dispatches load/save to local draft storage', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-03T04:05:06Z'))
    mockedIsIndexedDbStorageMode.mockReturnValue(true)

    const resource = { resourceKey: 'home', resourceType: 'PAGE', resourceScope: 'SHARED' }
    const request = {
      ...resource,
      resourceName: 'Home',
      schemaJson: '{"pages":[{"id":"page-1"}]}',
      sessionKey: 'session-2',
      baseUpdateTime: new Date('2026-02-03T04:00:00Z'),
      forceOverride: true,
    }
    const currentPage = {
      id: 42,
      resourceKey: 'home',
      resourceName: 'Old home',
      status: 'release',
      schemaJson: '{"old":true}',
      updateTime: new Date('2026-02-03T03:00:00Z'),
    }
    const storedPage = { ...currentPage, schemaJson: '{"loaded":true}' }
    mockedLoadLocalDraft.mockResolvedValueOnce(storedPage)
    mockedSaveLocalDraft.mockResolvedValueOnce(undefined)

    const adapter = createDraftStorageAdapter()
    const expectedKey = 'webbuilder:draft:key:home'

    await expect(adapter.load(resource)).resolves.toBe(storedPage)
    await expect(adapter.save(request, { currentPage })).resolves.toEqual({
      ...currentPage,
      resourceKey: 'home',
      resourceType: 'PAGE',
      resourceScope: 'SHARED',
      resourceName: 'Home',
      schemaJson: '{"pages":[{"id":"page-1"}]}',
      status: 'draft',
      updateTime: new Date('2026-02-03T04:05:06Z'),
    })
    expect(adapter.mode).toBe('indexedDb')
    expect(adapter.supportsConflictOverride).toBe(false)
    expect(getLocalDraftKey(resource)).toBe(expectedKey)
    expect(mockedLoadLocalDraft).toHaveBeenCalledWith(expectedKey)
    expect(mockedSaveLocalDraft).toHaveBeenCalledWith(expectedKey, {
      ...currentPage,
      resourceKey: 'home',
      resourceType: 'PAGE',
      resourceScope: 'SHARED',
      resourceName: 'Home',
      schemaJson: '{"pages":[{"id":"page-1"}]}',
      status: 'draft',
      updateTime: new Date('2026-02-03T04:05:06Z'),
    })
    expect(mockedGetDraft).not.toHaveBeenCalled()
    expect(mockedSaveDraft).not.toHaveBeenCalled()
  })

  it('falls back to backend draft loading when IndexedDB has no local draft yet', async () => {
    mockedIsIndexedDbStorageMode.mockReturnValue(true)

    const resource = {
      resourceId: 18,
      resourceKey: 'product-detail',
      resourceType: 'TEMP_PRODUCT_DETAIL',
      resourceScope: 'OWNED',
    }
    const backendPage = {
      ...resource,
      resourceName: 'Product Detail',
      schemaJson: '{"pages":[{"id":"product-detail","component":"<main>Product</main>"}]}',
      updateTime: new Date('2026-02-03T04:05:06Z'),
    }
    mockedLoadLocalDraft.mockResolvedValueOnce(null)
    mockedGetDraft.mockResolvedValueOnce(backendPage)

    const adapter = createDraftStorageAdapter()

    await expect(adapter.load(resource)).resolves.toBe(backendPage)
    expect(adapter.mode).toBe('indexedDb')
    expect(mockedLoadLocalDraft).toHaveBeenCalledWith('webbuilder:draft:resource:18')
    expect(mockedGetDraft).toHaveBeenCalledWith(resource)
  })

  it('builds stable local draft keys from normalized resource identity', () => {
    expect(getLocalDraftKey({ resourceId: '7', resourceKey: 'ignored' } as any)).toBe(
      'webbuilder:draft:resource:7',
    )
    expect(getLocalDraftKey({ resourceKey: ' product-list ' })).toBe(
      'webbuilder:draft:key:product-list',
    )
    expect(getLocalDraftKey({ ownerType: 'SITE', ownerId: '99' } as any)).toBe(
      'webbuilder:draft:owner:SITE:99',
    )
    expect(getLocalDraftKey({ resourceType: 'SITE', ownerId: 99 })).toBe(
      'webbuilder:draft:owner:SITE:99',
    )
    expect(getLocalDraftKey({})).toBe('webbuilder:draft:owner:UNKNOWN:0')
  })
})
