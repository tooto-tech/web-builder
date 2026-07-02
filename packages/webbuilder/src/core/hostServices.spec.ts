import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type {
  EditLockState,
  HostServices,
  LockService,
  RevisionService,
  RevisionSummary,
} from './hostServices.js'
import type { PageResourceIdentity } from './featurePlugin.js'

describe('hostServices contracts', () => {
  const source = readFileSync(fileURLToPath(new URL('./hostServices.ts', import.meta.url)), 'utf8')
  const resource: PageResourceIdentity = {
    resourceType: 'page',
    resourceId: 7,
    ownerType: 'tenant',
    ownerId: 3,
  }

  it('allows hosts to inject optional lock services', async () => {
    const heldByCurrentUser: EditLockState = {
      locked: true,
      ownedByMe: true,
      holder: {
        userId: 42,
        displayName: 'Ada',
      },
      expiresAt: '2026-07-02T12:00:00.000Z',
      heartbeatIntervalMs: 10000,
    }

    const lock: LockService = {
      acquire: vi.fn(async () => heldByCurrentUser),
      heartbeat: vi.fn(async () => heldByCurrentUser),
      release: vi.fn(async () => undefined),
      query: vi.fn(async () => heldByCurrentUser),
    }

    const services: HostServices = { lock }

    await expect(services.lock?.acquire(resource)).resolves.toEqual(heldByCurrentUser)
    expect(lock.acquire).toHaveBeenCalledWith(resource)
  })

  it('allows hosts to inject optional revision services', async () => {
    const revision: RevisionSummary = {
      id: 11,
      createdAt: '2026-07-02T12:30:00.000Z',
      createdBy: 'Ada',
      note: 'before publish',
    }

    const revisions: RevisionService = {
      list: vi.fn(async () => [revision]),
      getDetail: vi.fn(async () => ({ id: revision.id, schemaJson: '{}' })),
      snapshot: vi.fn(async () => revision),
    }

    const services: HostServices = { revision: revisions }

    await expect(services.revision?.list(resource, { pageNo: 1 })).resolves.toEqual([revision])
    await expect(services.revision?.getDetail(11)).resolves.toEqual({
      id: 11,
      schemaJson: '{}',
    })
    expect(revisions.list).toHaveBeenCalledWith(resource, { pageNo: 1 })
  })

  it('declares lock and revision contracts in the host services source', () => {
    expect(source).toContain('export interface EditLockState')
    expect(source).toContain('export interface LockService')
    expect(source).toContain('export interface RevisionSummary')
    expect(source).toContain('export interface RevisionService')
    expect(source).toContain('lock?: LockService')
    expect(source).toContain('revision?: RevisionService')
  })
})
