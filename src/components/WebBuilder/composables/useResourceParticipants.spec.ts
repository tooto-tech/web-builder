import { describe, expect, it, vi } from 'vitest'
import type { ResourceTransactionParticipant } from './useResourceTransaction'
import {
  makeLayoutParticipant,
  makePageParticipant,
  makeSharedResourcesParticipant,
  makeTemplateParticipant,
} from './useResourceParticipants'

const resolveDirty = (participant: ResourceTransactionParticipant) => {
  const dirty = participant.isDirty
  if (typeof dirty === 'function') return dirty()
  if (typeof dirty === 'object' && dirty !== null && 'value' in dirty) return dirty.value
  return dirty
}

const refValue = (value: boolean) => ({ value })

const editorProjectData = { pages: [{ id: 'home' }] }
const makeEditor = () => ({
  getProjectData: vi.fn(() => editorProjectData),
})

describe('makeSharedResourcesParticipant', () => {
  it('builds save mode as a warning draft flush participant', async () => {
    const flushPendingSaves = vi.fn(async () => true)
    const participant = makeSharedResourcesParticipant(
      { hasPendingChanges: refValue(false), flushPendingSaves },
      'save',
    )

    expect(participant).toMatchObject({
      id: 'shared-draft-resources',
      label: '全局样式/脚本',
      failurePolicy: 'warning',
      isDirty: true,
    })
    await expect(participant.flushDraft()).resolves.toBe(true)
    expect(flushPendingSaves).toHaveBeenCalledWith({ blockOnError: false })
    expect(participant.publish()).toBe(true)
    expect(participant.releaseLock()).toBeUndefined()
  })

  it('builds publish mode as a blocking publish participant', async () => {
    const flushPendingSaves = vi.fn(async () => true)
    const participant = makeSharedResourcesParticipant(
      { hasPendingChanges: refValue(false), flushPendingSaves },
      'publish',
    )

    expect(participant).toMatchObject({
      id: 'shared-publish-resources',
      label: '全局样式/脚本',
      failurePolicy: 'blocking',
      isDirty: true,
    })
    expect(participant.flushDraft()).toBe(true)
    await expect(participant.publish()).resolves.toBe(true)
    expect(flushPendingSaves).toHaveBeenCalledWith({ blockOnError: true })
  })

  it('builds lifecycle mode with pending shared-resource dirtiness', () => {
    const pending = refValue(true)
    const participant = makeSharedResourcesParticipant(
      { hasPendingChanges: pending, flushPendingSaves: vi.fn() },
      'lifecycle',
    )

    expect(participant).toMatchObject({
      id: 'shared-resources',
      label: '全局样式/脚本',
      failurePolicy: 'warning',
    })
    expect(resolveDirty(participant)).toBe(true)
    pending.value = false
    expect(resolveDirty(participant)).toBe(false)
    expect(participant.flushDraft()).toBe(true)
    expect(participant.publish()).toBe(true)
    expect(participant.releaseLock()).toBeUndefined()
  })
})

describe('makeLayoutParticipant', () => {
  it('builds save mode with layout draft saving and save-silent lookup', async () => {
    const editor = makeEditor()
    const saveLayoutResources = vi.fn(async () => true)
    const releaseAllLocks = vi.fn()
    let silent = false
    const participant = makeLayoutParticipant(
      {
        manager: {
          hasPendingChanges: refValue(true),
          saveLayoutResources,
          publishLayoutRules: vi.fn(),
          releaseAllLocks,
          hasCurrentResourceChanges: vi.fn(() => false),
        },
        getEditor: () => editor,
        getSaveSilent: () => silent,
      },
      'save',
    )

    expect(participant).toMatchObject({
      id: 'layout-draft-resources',
      label: '布局共享资源',
      failurePolicy: 'warning',
    })
    expect(resolveDirty(participant)).toBe(true)
    await participant.flushDraft()
    silent = true
    await participant.flushDraft()
    expect(saveLayoutResources).toHaveBeenNthCalledWith(1, editor, false)
    expect(saveLayoutResources).toHaveBeenNthCalledWith(2, editor, true)
    expect(participant.publish()).toBe(true)
    participant.releaseLock()
    expect(releaseAllLocks).toHaveBeenCalledTimes(1)
  })

  it('builds publish mode for layout draft and layout rule publishing', async () => {
    const editor = makeEditor()
    const saveLayoutResources = vi.fn(async () => true)
    const publishLayoutRules = vi.fn(async () => true)
    const releaseAllLocks = vi.fn()
    const context = {
      manager: {
        hasPendingChanges: refValue(false),
        saveLayoutResources,
        publishLayoutRules,
        releaseAllLocks,
        hasCurrentResourceChanges: vi.fn(() => false),
      },
      getEditor: () => editor,
    }

    const draftParticipant = makeLayoutParticipant(context, 'publish', { publishTarget: 'draft' })
    const rulesParticipant = makeLayoutParticipant(context, 'publish', { publishTarget: 'rules' })

    expect(draftParticipant).toMatchObject({
      id: 'layout-publish-draft',
      label: '布局共享资源',
      failurePolicy: 'blocking',
      isDirty: true,
    })
    expect(rulesParticipant).toMatchObject({
      id: 'layout-publish-rules',
      label: '布局规则',
      failurePolicy: 'blocking',
      isDirty: true,
    })
    expect(draftParticipant.flushDraft()).toBe(true)
    await draftParticipant.publish()
    await rulesParticipant.publish()
    expect(saveLayoutResources).toHaveBeenCalledWith(editor, true)
    expect(publishLayoutRules).toHaveBeenCalledWith(true)
  })

  it('builds lifecycle mode with pending layout dirtiness and lock release', () => {
    const pending = refValue(true)
    const releaseAllLocks = vi.fn()
    const participant = makeLayoutParticipant(
      {
        manager: {
          hasPendingChanges: pending,
          saveLayoutResources: vi.fn(),
          publishLayoutRules: vi.fn(),
          releaseAllLocks,
          hasCurrentResourceChanges: vi.fn(() => false),
        },
        getEditor: () => null,
      },
      'lifecycle',
    )

    expect(participant).toMatchObject({
      id: 'layout-resources',
      label: '布局共享资源',
      failurePolicy: 'warning',
    })
    expect(resolveDirty(participant)).toBe(true)
    pending.value = false
    expect(resolveDirty(participant)).toBe(false)
    expect(participant.flushDraft()).toBe(true)
    expect(participant.publish()).toBe(true)
    participant.releaseLock()
    expect(releaseAllLocks).toHaveBeenCalledTimes(1)
  })

  it('uses user layout dirtiness for lifecycle prompts when available', () => {
    const participant = makeLayoutParticipant(
      {
        manager: {
          hasPendingChanges: refValue(true),
          hasUnsavedUserChanges: refValue(false),
          saveLayoutResources: vi.fn(),
          publishLayoutRules: vi.fn(),
          releaseAllLocks: vi.fn(),
          hasCurrentResourceChanges: vi.fn(() => false),
        },
        getEditor: () => null,
      },
      'lifecycle',
    )

    expect(resolveDirty(participant)).toBe(false)
  })
})

describe('makeTemplateParticipant', () => {
  it('builds save mode with template rule saving and save-silent lookup', async () => {
    const saveTemplateRules = vi.fn(async () => true)
    const releaseAllLocks = vi.fn()
    let silent = false
    const participant = makeTemplateParticipant(
      {
        hasPendingChanges: refValue(true),
        saveTemplateRules,
        publishTemplateRules: vi.fn(),
        releaseAllLocks,
      },
      'save',
      { getSaveSilent: () => silent },
    )

    expect(participant).toMatchObject({
      id: 'template-draft-rules',
      label: '模板规则',
      failurePolicy: 'warning',
    })
    await participant.flushDraft()
    silent = true
    await participant.flushDraft()
    expect(saveTemplateRules).toHaveBeenNthCalledWith(1, false)
    expect(saveTemplateRules).toHaveBeenNthCalledWith(2, true)
    expect(participant.publish()).toBe(true)
    participant.releaseLock()
    expect(releaseAllLocks).toHaveBeenCalledTimes(1)
  })

  it('builds publish mode for template draft and template rule publishing', async () => {
    const saveTemplateRules = vi.fn(async () => true)
    const publishTemplateRules = vi.fn(async () => true)
    const manager = {
      hasPendingChanges: refValue(false),
      saveTemplateRules,
      publishTemplateRules,
      releaseAllLocks: vi.fn(),
    }

    const draftParticipant = makeTemplateParticipant(manager, 'publish', { publishTarget: 'draft' })
    const rulesParticipant = makeTemplateParticipant(manager, 'publish', { publishTarget: 'rules' })

    expect(draftParticipant).toMatchObject({
      id: 'template-publish-draft',
      label: '模板规则草稿',
      failurePolicy: 'blocking',
      isDirty: true,
    })
    expect(rulesParticipant).toMatchObject({
      id: 'template-publish-rules',
      label: '模板规则',
      failurePolicy: 'blocking',
      isDirty: true,
    })
    expect(draftParticipant.flushDraft()).toBe(true)
    await draftParticipant.publish()
    await rulesParticipant.publish()
    expect(saveTemplateRules).toHaveBeenCalledWith(true)
    expect(publishTemplateRules).toHaveBeenCalledWith(true)
  })

  it('builds lifecycle mode with pending template dirtiness and lock release', () => {
    const pending = refValue(true)
    const releaseAllLocks = vi.fn()
    const participant = makeTemplateParticipant(
      {
        hasPendingChanges: pending,
        saveTemplateRules: vi.fn(),
        publishTemplateRules: vi.fn(),
        releaseAllLocks,
      },
      'lifecycle',
    )

    expect(participant).toMatchObject({
      id: 'template-rules',
      label: '模板规则',
      failurePolicy: 'warning',
    })
    expect(resolveDirty(participant)).toBe(true)
    pending.value = false
    expect(resolveDirty(participant)).toBe(false)
    expect(participant.flushDraft()).toBe(true)
    expect(participant.publish()).toBe(true)
    participant.releaseLock()
    expect(releaseAllLocks).toHaveBeenCalledTimes(1)
  })
})

describe('makePageParticipant', () => {
  it('builds save mode with current layout-resource dirtiness and page draft saving', async () => {
    const editor = makeEditor()
    const saveDraftData = vi.fn(async () => true)
    const releaseEditLock = vi.fn()
    const hasCurrentResourceChanges = vi.fn(() => true)
    let silent = false
    const participant = makePageParticipant(
      {
        draftManager: { saveDraftData },
        publishManager: { publish: vi.fn() },
        editLock: { releaseEditLock },
        layoutBundleManager: { hasCurrentResourceChanges },
        editorChanges: { hasChanges: refValue(false) },
        getEditor: () => editor,
        getSaveSilent: () => silent,
      },
      'save',
    )

    expect(participant).toMatchObject({
      id: 'page-draft',
      label: '页面草稿',
      failurePolicy: 'blocking',
    })
    expect(resolveDirty(participant)).toBe(true)
    expect(hasCurrentResourceChanges).toHaveBeenCalledWith(editorProjectData)
    await participant.flushDraft()
    silent = true
    await participant.flushDraft()
    expect(saveDraftData).toHaveBeenNthCalledWith(1, false)
    expect(saveDraftData).toHaveBeenNthCalledWith(2, true)
    expect(participant.publish()).toBe(true)
    participant.releaseLock()
    expect(releaseEditLock).toHaveBeenCalledTimes(1)
  })

  it('builds publish mode with page publish operation', async () => {
    const publish = vi.fn(async () => true)
    const releaseEditLock = vi.fn()
    const participant = makePageParticipant(
      {
        draftManager: { saveDraftData: vi.fn() },
        publishManager: { publish },
        editLock: { releaseEditLock },
        layoutBundleManager: { hasCurrentResourceChanges: vi.fn(() => false) },
        editorChanges: { hasChanges: refValue(false) },
        getEditor: () => null,
      },
      'publish',
    )

    expect(participant).toMatchObject({
      id: 'page-publish',
      label: '页面发布',
      failurePolicy: 'blocking',
      isDirty: true,
    })
    expect(participant.flushDraft()).toBe(true)
    await participant.publish()
    expect(publish).toHaveBeenCalledTimes(1)
    participant.releaseLock()
    expect(releaseEditLock).toHaveBeenCalledTimes(1)
  })

  it('builds lifecycle mode using editor changes or current layout-resource changes', () => {
    const editor = makeEditor()
    const hasChanges = refValue(false)
    const hasCurrentResourceChanges = vi.fn(() => false)
    const participant = makePageParticipant(
      {
        draftManager: { saveDraftData: vi.fn() },
        publishManager: { publish: vi.fn() },
        editLock: { releaseEditLock: vi.fn() },
        layoutBundleManager: { hasCurrentResourceChanges },
        editorChanges: { hasChanges },
        getEditor: () => editor,
      },
      'lifecycle',
    )

    expect(participant).toMatchObject({
      id: 'page-draft',
      label: '页面草稿',
      failurePolicy: 'blocking',
    })
    expect(resolveDirty(participant)).toBe(false)
    expect(hasCurrentResourceChanges).toHaveBeenCalledWith(editorProjectData)

    hasChanges.value = true
    expect(resolveDirty(participant)).toBe(true)
    expect(participant.flushDraft()).toBe(true)
    expect(participant.publish()).toBe(true)
  })
})
