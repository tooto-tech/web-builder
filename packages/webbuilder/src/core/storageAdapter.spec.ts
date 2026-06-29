import { describe, expect, it } from 'vitest'

import {
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  type PageDraftRecord,
  type PageSaveRequest,
  type StorageAdapter,
} from './index.js'

describe('storage adapter contract', () => {
  it('normalizes string and numeric page resource locators', () => {
    expect(
      normalizePageResourceIdentity({
        resourceId: ' 42 ' as unknown as number,
        resourceKey: ' product-detail ',
        resourceType: ' PAGE ',
        ownerId: '7' as unknown as number,
      })
    ).toEqual({
      resourceId: 42,
      resourceKey: 'product-detail',
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
      ownerType: 'PAGE',
      ownerId: 7,
    })
  })

  it('detects whether a page resource can be loaded', () => {
    expect(hasPageResourceLocator({})).toBe(false)
    expect(hasPageResourceLocator({ resourceId: 1 })).toBe(true)
    expect(hasPageResourceLocator({ resourceKey: 'home' })).toBe(true)
    expect(
      hasPageResourceLocator({
        resourceType: 'PAGE',
        ownerType: 'PRODUCT',
        ownerId: 12,
      })
    ).toBe(true)
  })

  it('exposes storage adapter types from the public package root', async () => {
    const adapter: StorageAdapter = {
      mode: 'backend',
      supportsConflictOverride: true,
      getDraft: async () => null,
      saveDraft: async (request: PageSaveRequest): Promise<PageDraftRecord> => ({
        ...request,
        id: 1,
      }),
      generateCss: async () => ({}),
      getHistoryDetail: async () => ({}),
      load: async () => null,
      save: async (request: PageSaveRequest): Promise<PageDraftRecord> => ({
        ...request,
        id: 1,
      }),
    }

    await expect(
      adapter.saveDraft({
        resourceType: 'PAGE',
        schemaJson: '{}',
        sessionKey: 'session-1',
      })
    ).resolves.toMatchObject({ id: 1, resourceType: 'PAGE' })
  })
})
