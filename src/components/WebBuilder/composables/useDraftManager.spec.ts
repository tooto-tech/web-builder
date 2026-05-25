import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/content/page', () => {
  const normalizePageResourceIdentity = (identity: any) => identity
  const hasPageResourceLocator = (identity: any) =>
    Boolean(identity?.resourceId !== undefined || identity?.resourceKey)

  return {
    getDraft: vi.fn(),
    hasPageResourceLocator,
    normalizePageResourceIdentity,
    saveDraft: vi.fn(),
  }
})

vi.mock('../utils/editorHelpers', () => ({
  getEditorSchemaJson: vi.fn(() => '{}'),
}))

vi.mock('../utils/sessionKey', () => ({
  getOrCreateSessionKey: vi.fn(() => 'fallback-session-key'),
}))

vi.mock('../components/registries/media/flipbook', () => ({
  sanitizeFlipbookProjectData: vi.fn((data: any) => data),
}))

vi.mock('../utils/draftStorage', () => ({
  loadDraft: vi.fn(),
  saveDraft: vi.fn(),
}))

vi.mock('../config/storage', () => ({
  isBackendStorageMode: vi.fn(() => true),
  isIndexedDbStorageMode: vi.fn(() => false),
}))

vi.mock('../config/templateSharedResources', () => ({
  isTempTemplateResourceType: vi.fn(() => false),
}))

vi.mock('../utils/pageSettings', () => ({
  getPageResourceNameFromEditor: vi.fn(() => 'Test page'),
}))

vi.mock('../utils/layoutSettings', () => ({
  getGrapesPageName: vi.fn(() => ''),
  getPageLayoutSlot: vi.fn(() => null),
}))

vi.mock('../config/sharedResources', () => ({
  extractLegacySharedPayloads: vi.fn(() => ({
    colors: null,
    typography: null,
    customCss: null,
    customCode: null,
  })),
  stripLegacySharedFields: vi.fn((data: any) => data),
}))

import { ElMessageBox } from 'element-plus'
import { saveDraft } from '@/api/content/page'
import { wbMessage } from '@/components/WebBuilder/utils/wbMessage'
import { isBackendStorageMode, isIndexedDbStorageMode } from '../config/storage'
import { getGrapesPageName, getPageLayoutSlot } from '../utils/layoutSettings'
import { saveDraft as saveLocalDraft } from '../utils/draftStorage'
import useDraftManager from './useDraftManager'

const mockedSaveDraft = vi.mocked(saveDraft)
const mockedMessage = vi.mocked(wbMessage)
const mockedMessageBox = vi.mocked(ElMessageBox)
const mockedIsBackendStorageMode = vi.mocked(isBackendStorageMode)
const mockedIsIndexedDbStorageMode = vi.mocked(isIndexedDbStorageMode)
const mockedGetGrapesPageName = vi.mocked(getGrapesPageName)
const mockedGetPageLayoutSlot = vi.mocked(getPageLayoutSlot)
const mockedSaveLocalDraft = vi.mocked(saveLocalDraft)

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const makeEditor = () => ({ id: 'editor' })

const makeManager = (resourceId: number) =>
  useDraftManager({
    pageResource: () => ({
      resourceId,
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
    }),
    getEditor: makeEditor,
    getSessionKey: () => 'test-session-key',
    serializeSchemaJson: () => '{}',
  })

describe('useDraftManager save lock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedIsBackendStorageMode.mockReturnValue(true)
    mockedIsIndexedDbStorageMode.mockReturnValue(false)
    mockedGetGrapesPageName.mockReturnValue('')
    mockedGetPageLayoutSlot.mockReturnValue(null)
  })

  it('allows different draft manager instances to save concurrently', async () => {
    const firstSave = createDeferred<any>()
    const secondSave = createDeferred<any>()
    mockedSaveDraft
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise)

    const firstManager = makeManager(1)
    const secondManager = makeManager(2)

    const firstResult = firstManager.saveDraftData()
    expect(mockedSaveDraft).toHaveBeenCalledTimes(1)

    const secondResult = secondManager.saveDraftData()

    firstSave.resolve({ resourceId: 1, updateTime: new Date('2026-01-01T00:00:00Z') })
    secondSave.resolve({ resourceId: 2, updateTime: new Date('2026-01-01T00:00:01Z') })

    await expect(firstResult).resolves.toBe(true)
    await expect(secondResult).resolves.toBe(true)
    expect(mockedSaveDraft).toHaveBeenCalledTimes(2)
    expect(mockedMessage.warning).not.toHaveBeenCalledWith('正在保存中，请稍候...')
  })

  it('blocks re-entrant concurrent saves on the same draft manager instance', async () => {
    const firstSave = createDeferred<any>()
    mockedSaveDraft.mockReturnValueOnce(firstSave.promise)

    const manager = makeManager(1)

    const firstResult = manager.saveDraftData()
    expect(mockedSaveDraft).toHaveBeenCalledTimes(1)

    const secondResult = manager.saveDraftData()

    await expect(secondResult).resolves.toBe(false)
    expect(mockedSaveDraft).toHaveBeenCalledTimes(1)
    expect(mockedMessage.warning).toHaveBeenCalledWith('正在保存中，请稍候...')

    firstSave.resolve({ resourceId: 1, updateTime: new Date('2026-01-01T00:00:00Z') })
    await expect(firstResult).resolves.toBe(true)
  })

  it('does not log raw schema content when save succeeds', async () => {
    const schemaJson = JSON.stringify({ secretContent: 'draft-schema-sentinel' })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    mockedSaveDraft.mockResolvedValueOnce({
      resourceId: 1,
      updateTime: new Date('2026-01-01T00:00:00Z'),
    })

    const manager = useDraftManager({
      pageResource: () => ({
        resourceId: 1,
        resourceType: 'PAGE',
        resourceScope: 'OWNED',
      }),
      getEditor: makeEditor,
      getSessionKey: () => 'test-session-key',
      serializeSchemaJson: () => schemaJson,
    })

    try {
      await expect(manager.saveDraftData()).resolves.toBe(true)

      const loggedText = logSpy.mock.calls.map((args) => JSON.stringify(args)).join('\n')
      expect(loggedText).not.toContain('draft-schema-sentinel')
      expect(loggedText).not.toContain(schemaJson)
    } finally {
      logSpy.mockRestore()
    }
  })

  it('uses the explicit edit session key when saving drafts', async () => {
    mockedSaveDraft.mockResolvedValueOnce({
      resourceId: 1,
      updateTime: new Date('2026-01-01T00:00:00Z'),
    })
    const manager = useDraftManager({
      pageResource: () => ({
        resourceId: 1,
        resourceType: 'PAGE',
        resourceScope: 'OWNED',
      }),
      getEditor: makeEditor,
      session: ref({
        sessionKey: 'explicit-session-key',
        hasEditLock: true,
        hasUnsavedChanges: false,
      }),
      getSessionKey: () => 'legacy-session-key',
      serializeSchemaJson: () => '{}',
    })

    await expect(manager.saveDraftData()).resolves.toBe(true)

    expect(mockedSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionKey: 'explicit-session-key',
      }),
    )
  })

  it('retries backend conflict saves through the selected storage adapter with force override', async () => {
    const savedPage = {
      resourceId: 1,
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
      schemaJson: '{}',
      updateTime: new Date('2026-01-01T00:00:00Z'),
    }
    mockedSaveDraft
      .mockRejectedValueOnce({ code: 1009012001, message: 'conflict' })
      .mockResolvedValueOnce(savedPage)
    mockedMessageBox.confirm.mockResolvedValueOnce('confirm' as any)

    const onConflictStart = vi.fn()
    const onConflictEnd = vi.fn()
    const manager = useDraftManager({
      pageResource: () => ({
        resourceId: 1,
        resourceType: 'PAGE',
        resourceScope: 'OWNED',
      }),
      getEditor: makeEditor,
      getSessionKey: () => 'test-session-key',
      serializeSchemaJson: () => '{}',
      onSaveConflictConfirmStart: onConflictStart,
      onSaveConflictConfirmEnd: onConflictEnd,
    })

    await expect(manager.saveDraftData()).resolves.toBe(true)

    expect(mockedSaveDraft).toHaveBeenCalledTimes(2)
    expect(mockedSaveDraft).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        resourceId: 1,
        forceOverride: false,
        sessionKey: 'test-session-key',
      }),
    )
    expect(mockedSaveDraft).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        resourceId: 1,
        forceOverride: true,
        sessionKey: 'test-session-key',
      }),
    )
    expect(mockedMessageBox.confirm).toHaveBeenCalledWith(
      '页面已被他人修改，是否强制覆盖？',
      '保存冲突',
      expect.objectContaining({ confirmButtonText: '强制覆盖' }),
    )
    expect(onConflictStart).toHaveBeenCalledWith(false)
    expect(onConflictEnd).toHaveBeenCalledWith(false)
    expect(manager.baseUpdateTime.value).toEqual(savedPage.updateTime)
    expect(manager.currentPage.value).toEqual(savedPage)
    expect(mockedMessage.success).toHaveBeenCalledWith('强制保存成功')
  })

  it('keeps the derived layout page name on backend conflict force override saves', async () => {
    const layoutPage = { id: 'layout-page' }
    const editor = {
      Pages: {
        getAll: vi.fn(() => [layoutPage]),
      },
    }
    mockedGetPageLayoutSlot.mockReturnValue('header')
    mockedGetGrapesPageName.mockReturnValue(' Product Detail ')
    mockedSaveDraft
      .mockRejectedValueOnce({ code: 1009012001, message: 'conflict' })
      .mockResolvedValueOnce({
        resourceId: 11,
        resourceType: 'LAYOUT_PAGE_HEADER',
        resourceScope: 'OWNED',
        resourceName: 'Product Detail',
        schemaJson: '{}',
        updateTime: new Date('2026-01-01T00:00:00Z'),
      })
    mockedMessageBox.confirm.mockResolvedValueOnce('confirm' as any)

    const manager = useDraftManager({
      pageResource: () => ({
        resourceId: 11,
        resourceType: 'LAYOUT_PAGE_HEADER',
        resourceScope: 'OWNED',
      }),
      getEditor: () => editor,
      getSessionKey: () => 'test-session-key',
      serializeSchemaJson: () => '{}',
    })

    await expect(manager.saveDraftData()).resolves.toBe(true)

    expect(mockedSaveDraft).toHaveBeenCalledTimes(2)
    expect(mockedSaveDraft).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        resourceId: 11,
        resourceType: 'LAYOUT_PAGE_HEADER',
        resourceName: 'Product Detail',
        forceOverride: false,
      }),
    )
    expect(mockedSaveDraft).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        resourceId: 11,
        resourceType: 'LAYOUT_PAGE_HEADER',
        resourceName: 'Product Detail',
        forceOverride: true,
      }),
    )
  })

  it('does not attempt conflict override when the selected adapter is IndexedDB', async () => {
    mockedIsBackendStorageMode.mockReturnValue(false)
    mockedIsIndexedDbStorageMode.mockReturnValue(true)
    mockedSaveLocalDraft.mockRejectedValueOnce({ code: 1009012001, message: 'conflict' })

    const manager = makeManager(1)

    await expect(manager.saveDraftData()).resolves.toBe(false)

    expect(mockedMessageBox.confirm).not.toHaveBeenCalled()
    expect(mockedSaveDraft).not.toHaveBeenCalled()
    expect(mockedMessage.error).toHaveBeenCalledWith('本地存储模式下不支持冲突覆盖分支')
  })
})
