import { ref, type Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

import { ElMessageBox } from 'element-plus'
import { wbMessage } from '@/components/WebBuilder/utils/wbMessage'
import useEditorActions, {
  type UseEditorActionsOptions,
  type UseEditorActionsResourceTransaction,
} from './useEditorActions'
import useResourceTransaction, {
  type ResourceTransactionParticipant,
  type ResourceTransactionResult,
} from './useResourceTransaction'

const mockedConfirm = vi.mocked(ElMessageBox.confirm)
const mockedMessage = vi.mocked(wbMessage)

const okResult = (): ResourceTransactionResult => ({ success: true, failures: [], warnings: [] })

interface MakeOptionsOverrides {
  projectData?: Record<string, unknown> | null
  active?: Ref<boolean>
  options?: Partial<UseEditorActionsOptions>
}

const makeOptions = (overrides: MakeOptionsOverrides = {}) => {
  const projectData = overrides.projectData ?? { pages: [{ id: 'home' }] }
  const active = overrides.active ?? ref(false)
  const resourceTransaction: UseEditorActionsResourceTransaction = {
    flushDrafts: vi.fn(async () => okResult()),
    publish: vi.fn(async () => okResult()),
  }
  const options: UseEditorActionsOptions = {
    blockingProcess: {
      active,
      start: vi.fn(),
      stop: vi.fn(),
      setMessage: vi.fn(),
    },
    ensureReadyOrConfirm: vi.fn(async () => true),
    resourceTransaction,
    getProjectData: vi.fn(() => projectData),
    hasCurrentResourceChanges: vi.fn(() => true),
    updateCurrentResourceBaseline: vi.fn(),
    markEditorSaved: vi.fn(),
    refreshI18nSourceEntries: vi.fn(),
    autoTranslateMissing: vi.fn(async () => true),
    hasI18nPreview: vi.fn(() => false),
    restoreI18nPreview: vi.fn(async () => undefined),
    ...overrides.options,
  }

  return {
    active,
    options,
  }
}

const makeParticipant = (
  overrides: Partial<ResourceTransactionParticipant> & Pick<ResourceTransactionParticipant, 'id'>,
): ResourceTransactionParticipant => ({
  id: overrides.id,
  label: overrides.label ?? overrides.id,
  failurePolicy: overrides.failurePolicy ?? 'blocking',
  isDirty: overrides.isDirty ?? (() => true),
  flushDraft: overrides.flushDraft ?? vi.fn(async () => true),
  publish: overrides.publish ?? vi.fn(async () => true),
  releaseLock: overrides.releaseLock ?? vi.fn(async () => undefined),
})

describe('useEditorActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedConfirm.mockResolvedValue('confirm' as any)
  })

  it('saves through i18n readiness and four ordered resource participants', async () => {
    const calls: string[] = []
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'shared-save-resources',
          label: '共享资源草稿',
          flushDraft: vi.fn(async () => {
            calls.push('shared-save-resources')
            return true
          }),
        }),
        makeParticipant({
          id: 'layout-draft',
          label: '布局草稿',
          flushDraft: vi.fn(async () => {
            calls.push('layout-draft')
            return true
          }),
        }),
        makeParticipant({
          id: 'template-draft',
          label: '模板草稿',
          flushDraft: vi.fn(async () => {
            calls.push('template-draft')
            return true
          }),
        }),
        makeParticipant({
          id: 'page-draft',
          label: '页面草稿',
          flushDraft: vi.fn(async () => {
            calls.push('page-draft')
            return true
          }),
        }),
      ],
    })
    const ctx = makeOptions({
      options: {
        resourceTransaction: {
          flushDrafts: () => transaction.flushDrafts(),
          publish: vi.fn(async () => okResult()),
        },
      },
    })
    const actions = useEditorActions(ctx.options)

    await expect(actions.save()).resolves.toBe(true)

    expect(ctx.options.blockingProcess.start).toHaveBeenCalledWith('save', [
      '正在准备保存',
      '正在读取当前页面内容',
    ])
    expect(ctx.options.ensureReadyOrConfirm).toHaveBeenCalledWith('save')
    expect(ctx.options.refreshI18nSourceEntries).toHaveBeenCalled()
    expect(calls).toEqual([
      'shared-save-resources',
      'layout-draft',
      'template-draft',
      'page-draft',
    ])
    expect(actions.lastSaveResult.value).toMatchObject({ success: true })
    expect(ctx.options.updateCurrentResourceBaseline).toHaveBeenCalledWith({
      pages: [{ id: 'home' }],
    })
    expect(ctx.options.markEditorSaved).toHaveBeenCalled()
    expect(ctx.options.blockingProcess.stop).toHaveBeenCalled()
  })

  it('restores i18n preview before saving', async () => {
    const ctx = makeOptions({
      options: {
        hasI18nPreview: vi.fn(() => true),
      },
    })
    const actions = useEditorActions(ctx.options)

    await actions.save()

    expect(ctx.options.blockingProcess.setMessage).toHaveBeenCalledWith([
      '正在恢复默认编辑画布',
      '正在还原多语言预览状态',
    ])
    expect(ctx.options.restoreI18nPreview).toHaveBeenCalled()
  })

  it('keeps silent saves non-blocking and schedules silent auto translation after success', async () => {
    const ctx = makeOptions()
    const actions = useEditorActions(ctx.options)

    await expect(actions.save(true)).resolves.toBe(true)

    expect(ctx.options.blockingProcess.start).not.toHaveBeenCalled()
    expect(ctx.options.ensureReadyOrConfirm).not.toHaveBeenCalled()
    expect(ctx.options.resourceTransaction.flushDrafts).toHaveBeenCalledWith(true)
    expect(ctx.options.autoTranslateMissing).toHaveBeenCalledWith({
      publishReady: false,
      reloadCurrentLocale: false,
      silent: true,
    })
    expect(ctx.options.blockingProcess.stop).not.toHaveBeenCalled()
  })

  it('publishes after confirmation, i18n readiness, and resource transaction warnings', async () => {
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
    const actions = useEditorActions(ctx.options)

    await expect(actions.publish()).resolves.toBe(true)

    expect(mockedConfirm).toHaveBeenCalledWith(
      '确认发布当前版本？确认后将检查并补齐多语言内容，然后生成HTML并创建新的草稿版本。',
      '确认发布',
      expect.any(Object),
    )
    expect(ctx.options.blockingProcess.start).toHaveBeenCalledWith('publish', [
      '正在准备发布',
      '正在锁定发布流程',
    ])
    expect(ctx.options.ensureReadyOrConfirm).toHaveBeenCalledWith('publish')
    expect(ctx.options.resourceTransaction.publish).toHaveBeenCalled()
    expect(actions.lastPublishResult.value).toMatchObject({ success: true })
    expect(mockedMessage.warning).toHaveBeenCalledWith('optional resource skipped')
    expect(ctx.options.updateCurrentResourceBaseline).toHaveBeenCalledWith({
      pages: [{ id: 'home' }],
    })
    expect(ctx.options.markEditorSaved).toHaveBeenCalled()
    expect(ctx.options.blockingProcess.stop).toHaveBeenCalled()
  })

  it('does not start a new visible save while another blocking process is active', async () => {
    const ctx = makeOptions({ active: ref(true) })
    const actions = useEditorActions(ctx.options)

    await expect(actions.save()).resolves.toBe(false)

    expect(ctx.options.blockingProcess.start).not.toHaveBeenCalled()
    expect(ctx.options.resourceTransaction.flushDrafts).not.toHaveBeenCalled()
    expect(actions.lastSaveResult.value).toBeNull()
  })

  it('aborts publishing and exposes failures when shared publish resources fail', async () => {
    const pagePublish = vi.fn(async () => true)
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'shared-publish-resources',
          label: '共享资源发布',
          publish: vi.fn(async () => ({
            success: false,
            hasFailure: true,
            message: '共享资源发布失败',
            failedResources: ['全局颜色'],
          })),
        }),
        makeParticipant({
          id: 'page-publish',
          label: '页面发布',
          publish: pagePublish,
        }),
      ],
    })
    const ctx = makeOptions({
      options: {
        resourceTransaction: {
          flushDrafts: vi.fn(async () => okResult()),
          publish: () => transaction.publish(),
        },
      },
    })
    const actions = useEditorActions(ctx.options)

    await expect(actions.publish()).resolves.toBe(false)

    expect(pagePublish).not.toHaveBeenCalled()
    expect(mockedMessage.error).toHaveBeenCalledWith('共享资源发布失败')
    expect(actions.lastPublishResult.value?.failures).toMatchObject([
      {
        participantId: 'shared-publish-resources',
        participantLabel: '共享资源发布',
        operation: 'publish',
        failedResources: ['全局颜色'],
      },
    ])
    expect(ctx.options.markEditorSaved).not.toHaveBeenCalled()
  })

  it('keeps save conflicts out of the commit path and exposes conflict diagnostics', async () => {
    mockedConfirm.mockRejectedValueOnce('cancel' as never)
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'page-draft',
          label: '页面草稿',
          flushDraft: vi.fn(async () => {
            try {
              await ElMessageBox.confirm('页面已被他人修改，是否强制覆盖？', '保存冲突', {
                confirmButtonText: '强制覆盖',
                cancelButtonText: '取消',
                type: 'warning',
              })
              return true
            } catch {
              return {
                success: false,
                hasFailure: true,
                hasConflict: true,
                message: '页面已被他人修改，是否强制覆盖？',
                failedResources: ['页面草稿'],
              }
            }
          }),
        }),
      ],
    })
    const ctx = makeOptions({
      options: {
        resourceTransaction: {
          flushDrafts: () => transaction.flushDrafts(),
          publish: vi.fn(async () => okResult()),
        },
      },
    })
    const actions = useEditorActions(ctx.options)

    await expect(actions.save()).resolves.toBe(false)

    expect(mockedConfirm).toHaveBeenCalledWith(
      '页面已被他人修改，是否强制覆盖？',
      '保存冲突',
      expect.objectContaining({ confirmButtonText: '强制覆盖' }),
    )
    expect(actions.lastSaveResult.value?.failures).toMatchObject([
      {
        participantId: 'page-draft',
        operation: 'flushDraft',
        hasConflict: true,
      },
    ])
    expect(ctx.options.updateCurrentResourceBaseline).not.toHaveBeenCalled()
    expect(ctx.options.markEditorSaved).not.toHaveBeenCalled()
  })

  it('returns a clear publish failure when edit lock contention blocks publishing', async () => {
    const lockFailure: ResourceTransactionResult = {
      success: false,
      failures: [
        {
          participantId: 'page-publish',
          participantLabel: '页面发布',
          operation: 'publish',
          message: '编辑锁被其他会话持有，无法发布',
          hasConflict: false,
          failedResources: ['页面发布'],
        },
      ],
      warnings: [],
    }
    const ctx = makeOptions({
      options: {
        resourceTransaction: {
          flushDrafts: vi.fn(async () => okResult()),
          publish: vi.fn(async () => lockFailure),
        },
      },
    })
    const actions = useEditorActions(ctx.options)

    await expect(actions.publish()).resolves.toBe(false)

    expect(mockedMessage.error).toHaveBeenCalledWith('编辑锁被其他会话持有，无法发布')
    expect(actions.lastPublishResult.value?.failures[0]?.message).toBe('编辑锁被其他会话持有，无法发布')
    expect(ctx.options.markEditorSaved).not.toHaveBeenCalled()
  })

  it('publishes dirty participants in dependency order through the orchestration surface', async () => {
    const calls: string[] = []
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'shared-publish-resources',
          label: '共享资源',
          publish: vi.fn(async () => {
            calls.push('shared-publish-resources')
            return true
          }),
        }),
        makeParticipant({
          id: 'layout-draft',
          label: '布局草稿',
          publish: vi.fn(async () => {
            calls.push('layout-draft')
            return true
          }),
        }),
        makeParticipant({
          id: 'layout-rules',
          label: '布局规则',
          publish: vi.fn(async () => {
            calls.push('layout-rules')
            return true
          }),
        }),
        makeParticipant({
          id: 'template-draft',
          label: '模板草稿',
          publish: vi.fn(async () => {
            calls.push('template-draft')
            return true
          }),
        }),
        makeParticipant({
          id: 'template-rules',
          label: '模板规则',
          publish: vi.fn(async () => {
            calls.push('template-rules')
            return true
          }),
        }),
        makeParticipant({
          id: 'page-publish',
          label: '页面发布',
          publish: vi.fn(async () => {
            calls.push('page-publish')
            return true
          }),
        }),
      ],
    })
    const ctx = makeOptions({
      options: {
        resourceTransaction: {
          flushDrafts: vi.fn(async () => okResult()),
          publish: () => transaction.publish(),
        },
      },
    })
    const actions = useEditorActions(ctx.options)

    await expect(actions.publish()).resolves.toBe(true)

    expect(calls).toEqual([
      'shared-publish-resources',
      'layout-draft',
      'layout-rules',
      'template-draft',
      'template-rules',
      'page-publish',
    ])
    expect(actions.lastPublishResult.value).toMatchObject({ success: true })
  })

  it('surfaces visible save warnings without failing the save', async () => {
    const ctx = makeOptions({
      options: {
        resourceTransaction: {
          flushDrafts: vi.fn(async () => ({
            success: true,
            failures: [],
            warnings: [{ message: '可选资源保存失败' }],
          })),
          publish: vi.fn(async () => okResult()),
        },
      },
    })
    const actions = useEditorActions(ctx.options)

    await expect(actions.save()).resolves.toBe(true)

    expect(mockedMessage.warning).toHaveBeenCalledWith('可选资源保存失败')
  })

  it('stops before saving when i18n readiness is rejected', async () => {
    const ctx = makeOptions({
      options: {
        ensureReadyOrConfirm: vi.fn(async () => false),
      },
    })
    const actions = useEditorActions(ctx.options)

    await expect(actions.save()).resolves.toBe(false)

    expect(ctx.options.resourceTransaction.flushDrafts).not.toHaveBeenCalled()
    expect(actions.lastSaveResult.value).toBeNull()
  })

  it('keeps publish cancellation quiet before starting the blocking process', async () => {
    mockedConfirm.mockRejectedValueOnce('cancel' as never)
    const ctx = makeOptions()
    const actions = useEditorActions(ctx.options)

    await expect(actions.publish()).resolves.toBe(false)

    expect(mockedMessage.error).not.toHaveBeenCalled()
    expect(ctx.options.blockingProcess.start).not.toHaveBeenCalled()
    expect(ctx.options.resourceTransaction.publish).not.toHaveBeenCalled()
  })

  it('reports unexpected publish confirmation errors', async () => {
    mockedConfirm.mockRejectedValueOnce(new Error('confirm unavailable') as never)
    const ctx = makeOptions()
    const actions = useEditorActions(ctx.options)

    await expect(actions.publish()).resolves.toBe(false)

    expect(mockedMessage.error).toHaveBeenCalledWith('confirm unavailable')
    expect(ctx.options.resourceTransaction.publish).not.toHaveBeenCalled()
  })
})
