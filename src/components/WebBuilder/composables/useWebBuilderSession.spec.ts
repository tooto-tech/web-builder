import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

import { ElMessageBox } from 'element-plus'
import { wbMessage } from '@/components/WebBuilder/utils/wbMessage'
import useWebBuilderSession from './useWebBuilderSession'

const mockedConfirm = vi.mocked(ElMessageBox.confirm)
const mockedMessage = vi.mocked(wbMessage)

const makeEditor = () => ({
  getProjectData: vi.fn(() => ({ pages: [{ id: 'home' }] })),
  runCommand: vi.fn(),
  stopCommand: vi.fn(),
})

const makeOptions = (overrides: Record<string, any> = {}) => {
  const editor = overrides.editor ?? makeEditor()
  return {
    editor,
    options: {
      getEditor: () => editor,
      blockingProcessingActive: ref(false),
      startBlockingProcess: vi.fn(),
      stopBlockingProcess: vi.fn(),
      setBlockingProcessMessage: vi.fn(),
      ensureI18nReadyOrConfirmed: vi.fn(async () => true),
      getI18nEntries: vi.fn(() => [{ translation: 'translated' }]),
      getI18nPreviewProjectData: vi.fn(() => ({ pages: [{ id: 'preview' }] })),
      loadI18nPreviewProjectData: vi.fn(async () => undefined),
      refreshI18nSourceEntries: vi.fn(),
      autoTranslateMissing: vi.fn(async () => true),
      resourceTransaction: {
        flushDrafts: vi.fn(async () => ({ success: true, failures: [], warnings: [] })),
        publish: vi.fn(async () => ({ success: true, failures: [], warnings: [] })),
      },
      hasCurrentResourceChanges: vi.fn(() => true),
      updateCurrentResourceBaseline: vi.fn(),
      markEditorSaved: vi.fn(),
      markEditorChanged: vi.fn(),
      resumeEditorTracking: vi.fn(),
      hasEditorChanges: vi.fn(() => false),
      hasUnsavedEditorWork: vi.fn(() => false),
      parseProjectData: vi.fn((raw: string) => JSON.parse(raw)),
      applyProjectDataToEditor: vi.fn(async () => undefined),
      ...overrides.options,
    },
  }
}

describe('useWebBuilderSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedConfirm.mockResolvedValue('confirm' as any)
  })

  it('loads and restores preview project data while preserving dirty state', async () => {
    const ctx = makeOptions({
      options: {
        hasEditorChanges: vi.fn(() => true),
      },
    })
    const session = useWebBuilderSession(ctx.options)

    await session.openPreview()
    expect(ctx.options.loadI18nPreviewProjectData).toHaveBeenCalledWith({
      pages: [{ id: 'preview' }],
    })
    expect(ctx.editor.runCommand).toHaveBeenCalledWith('core:preview')

    await session.exitPreview()
    expect(ctx.editor.stopCommand).toHaveBeenCalledWith('core:preview')
    expect(ctx.options.loadI18nPreviewProjectData).toHaveBeenLastCalledWith({
      pages: [{ id: 'home' }],
    })
    expect(ctx.options.markEditorChanged).toHaveBeenCalled()
  })

  it('handles failed preview load without blocking editor preview mode', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const ctx = makeOptions({
      options: {
        loadI18nPreviewProjectData: vi.fn(async () => {
          throw new Error('preview failed')
        }),
      },
    })
    const session = useWebBuilderSession(ctx.options)

    await session.openPreview()

    expect(mockedMessage.warning).toHaveBeenCalledWith('多语言预览加载失败，已使用默认语言预览')
    expect(session.isPreviewMode.value).toBe(true)
    expect(ctx.editor.runCommand).toHaveBeenCalledWith('core:preview')
    warn.mockRestore()
  })

  it('saves dirty resources through the resource transaction', async () => {
    const ctx = makeOptions()
    const session = useWebBuilderSession(ctx.options)

    await expect(session.handleSaveDraft()).resolves.toBe(true)

    expect(ctx.options.startBlockingProcess).toHaveBeenCalledWith('save', [
      '正在准备保存',
      '正在读取当前页面内容',
    ])
    expect(ctx.options.resourceTransaction.flushDrafts).toHaveBeenCalledWith(false)
    expect(ctx.options.updateCurrentResourceBaseline).toHaveBeenCalledWith({
      pages: [{ id: 'home' }],
    })
    expect(ctx.options.markEditorSaved).toHaveBeenCalled()
  })

  it('publishes with non-blocking transaction warnings', async () => {
    const ctx = makeOptions({
      options: {
        resourceTransaction: {
          flushDrafts: vi.fn(),
          publish: vi.fn(async () => ({
            success: true,
            failures: [],
            warnings: [{ message: 'optional resource skipped' }],
          })),
        },
      },
    })
    const session = useWebBuilderSession(ctx.options)

    await expect(session.handlePublish()).resolves.toBe(true)

    expect(mockedMessage.warning).toHaveBeenCalledWith('optional resource skipped')
    expect(ctx.options.markEditorSaved).toHaveBeenCalled()
  })

  it('returns leave confirmation data from the session dirty check', () => {
    const ctx = makeOptions({
      options: {
        hasUnsavedEditorWork: vi.fn(() => true),
      },
    })
    const session = useWebBuilderSession(ctx.options)

    expect(session.getLeaveConfirmationState()).toMatchObject({
      hasUnsavedChanges: true,
      title: '未保存提醒',
    })
  })
})
