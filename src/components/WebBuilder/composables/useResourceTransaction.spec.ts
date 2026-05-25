import { describe, expect, it, vi } from 'vitest'
import useResourceTransaction, {
  type ResourceTransactionParticipant,
} from './useResourceTransaction'

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

describe('useResourceTransaction', () => {
  it('flushes dirty resources in participant order and skips clean resources', async () => {
    const calls: string[] = []
    const clean = makeParticipant({
      id: 'clean',
      label: 'Clean resource',
      isDirty: () => false,
      flushDraft: vi.fn(async () => {
        calls.push('clean')
        return true
      }),
    })
    const first = makeParticipant({
      id: 'first',
      flushDraft: vi.fn(async () => {
        calls.push('first')
        return true
      }),
    })
    const second = makeParticipant({
      id: 'second',
      flushDraft: vi.fn(async () => {
        calls.push('second')
        return true
      }),
    })

    const transaction = useResourceTransaction({
      participants: [first, clean, second],
    })

    await expect(transaction.flushDrafts()).resolves.toMatchObject({
      success: true,
      failures: [],
      warnings: [],
    })
    expect(calls).toEqual(['first', 'second'])
    expect(clean.flushDraft).not.toHaveBeenCalled()
  })

  it('stops ordered flush on a blocking failure', async () => {
    const afterFailure = makeParticipant({
      id: 'after-failure',
      flushDraft: vi.fn(async () => true),
    })
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'layout',
          label: 'Layout rules',
          failurePolicy: 'blocking',
          flushDraft: vi.fn(async () => ({
            success: false,
            hasConflict: true,
            hasFailure: true,
            failedResources: ['Layout rules'],
          })),
        }),
        afterFailure,
      ],
    })

    const result = await transaction.flushDrafts()

    expect(result.success).toBe(false)
    expect(result.failures).toMatchObject([
      {
        participantId: 'layout',
        participantLabel: 'Layout rules',
        operation: 'flushDraft',
        hasConflict: true,
      },
    ])
    expect(result.warnings).toEqual([])
    expect(afterFailure.flushDraft).not.toHaveBeenCalled()
  })

  it('collects non-blocking warnings and continues to later participants', async () => {
    const calls: string[] = []
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'shared',
          label: 'Shared resources',
          failurePolicy: 'warning',
          flushDraft: vi.fn(async () => {
            calls.push('shared')
            return false
          }),
        }),
        makeParticipant({
          id: 'page',
          label: 'Page draft',
          failurePolicy: 'blocking',
          flushDraft: vi.fn(async () => {
            calls.push('page')
            return true
          }),
        }),
      ],
    })

    const result = await transaction.flushDrafts()

    expect(result.success).toBe(true)
    expect(result.failures).toEqual([])
    expect(result.warnings).toMatchObject([
      {
        participantId: 'shared',
        participantLabel: 'Shared resources',
        operation: 'flushDraft',
      },
    ])
    expect(calls).toEqual(['shared', 'page'])
  })

  it('publishes dirty resources with the same ordering and failure semantics', async () => {
    const calls: string[] = []
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'layout',
          publish: vi.fn(async () => {
            calls.push('layout')
            return true
          }),
        }),
        makeParticipant({
          id: 'template',
          failurePolicy: 'blocking',
          publish: vi.fn(async () => {
            calls.push('template')
            throw new Error('publish failed')
          }),
        }),
        makeParticipant({
          id: 'page',
          publish: vi.fn(async () => {
            calls.push('page')
            return true
          }),
        }),
      ],
    })

    const result = await transaction.publish()

    expect(result.success).toBe(false)
    expect(result.failures).toMatchObject([
      {
        participantId: 'template',
        operation: 'publish',
        message: 'publish failed',
      },
    ])
    expect(calls).toEqual(['layout', 'template'])
  })

  it('reports dirty participants without running resource operations', () => {
    const flushDraft = vi.fn(async () => true)
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({ id: 'clean', isDirty: () => false, flushDraft }),
        makeParticipant({ id: 'dirty-ref', label: 'Dirty ref', isDirty: { value: true } }),
        makeParticipant({ id: 'dirty-bool', label: 'Dirty bool', isDirty: true }),
      ],
    })

    expect(transaction.hasDirtyResources()).toBe(true)
    expect(transaction.getDirtyParticipants().map((participant) => participant.id)).toEqual([
      'dirty-ref',
      'dirty-bool',
    ])
    expect(flushDraft).not.toHaveBeenCalled()
  })

  it('releases locks for every participant and reports release failures as warnings', async () => {
    const calls: string[] = []
    const transaction = useResourceTransaction({
      participants: [
        makeParticipant({
          id: 'layout',
          releaseLock: vi.fn(async () => {
            calls.push('layout')
            throw new Error('release failed')
          }),
        }),
        makeParticipant({
          id: 'template',
          releaseLock: vi.fn(async () => {
            calls.push('template')
          }),
        }),
      ],
    })

    const result = await transaction.releaseLocks()

    expect(result.success).toBe(true)
    expect(result.failures).toEqual([])
    expect(result.warnings).toMatchObject([
      {
        participantId: 'layout',
        participantLabel: 'layout',
        operation: 'releaseLock',
        message: 'release failed',
      },
    ])
    expect(calls).toEqual(['layout', 'template'])
  })
})
