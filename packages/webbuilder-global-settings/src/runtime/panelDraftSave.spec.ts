import { describe, expect, it, vi } from 'vitest'

import { createGlobalSettingsSource } from './settingsSource.js'
import { saveGlobalSettingsPanelDraft } from './panelDraftSave.js'
import type { GlobalSettingsSnapshot, GlobalSettingsService } from '@tooto-tech/webbuilder-core'

const createSnapshot = (
  overrides: Partial<GlobalSettingsSnapshot> = {}
): GlobalSettingsSnapshot => ({
  version: 'draft-1',
  hash: 'hash-1',
  colors: [{ id: 'before' }],
  typography: { fontFamily: 'Before' },
  customCss: '.before {}',
  customCode: [],
  updatedAt: '2026-06-02T00:00:00.000Z',
  ...overrides,
})

describe('global settings panel draft save runtime', () => {
  it('saves the next draft through the host service and hydrates the returned snapshot', async () => {
    const settings = createGlobalSettingsSource()
    const baseSnapshot = createSnapshot()
    const returnedSnapshot = createSnapshot({
      version: 'draft-2',
      hash: 'hash-2',
      customCss: '.after {}',
    })
    settings.hydrate(baseSnapshot)
    const saveDraft = vi.fn(async () => returnedSnapshot)
    const publish = vi.fn()
    const service: GlobalSettingsService = {
      loadDraft: vi.fn(),
      saveDraft,
      publish,
    }

    await expect(
      saveGlobalSettingsPanelDraft({
        settings,
        service,
        resource: { resourceType: 'PAGE', resourceId: 12 },
        tenantId: 'tenant-1',
        sessionKey: 'session-1',
        cacheSnapshot: {
          colors: [{ id: 'after', name: 'After', value: '#111111' }],
          typography: { fontFamily: 'After' },
          customCss: '.after {}',
          customCode: [{ id: 'head', position: 'head', enabled: true, code: '<script></script>' }],
        },
      })
    ).resolves.toBe(returnedSnapshot)

    expect(saveDraft).toHaveBeenCalledWith(
      {
        ...baseSnapshot,
        colors: [{ id: 'after', name: 'After', value: '#111111' }],
        typography: { fontFamily: 'After' },
        customCss: '.after {}',
        customCode: [{ id: 'head', position: 'head', enabled: true, code: '<script></script>' }],
      },
      {
        resource: { resourceType: 'PAGE', resourceId: 12 },
        tenantId: 'tenant-1',
        sessionKey: 'session-1',
      }
    )
    expect(publish).not.toHaveBeenCalled()
    expect(settings.getSnapshot()).toBe(returnedSnapshot)
  })
})
