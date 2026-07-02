import { describe, expect, it, vi } from 'vitest'
import useWebBuilderI18n from '../../../../../packages/webbuilder-plugins/src/localization/useWebBuilderI18n'

const makeHostUi = () => ({
  confirm: vi.fn(async () => true),
  message: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
})

describe('useWebBuilderI18n package runtime', () => {
  it('uses HostServices for language loading and draft saves', async () => {
    const sourceEntry = {
      key: 'hero.title',
      field: 'text',
      source: 'Hello',
      sourceHash: 'hash',
    } as const
    const i18nService = {
      getEnabledLanguages: vi.fn(async () => [
        { id: 1, name: 'English', code: 'en', defaultLang: 1 },
        { id: 2, name: 'Chinese', code: 'zh', defaultLang: 0 },
      ]),
      loadBundle: vi.fn(async () => ({ locale: 'zh', entries: [] })),
      saveBundle: vi.fn(async (payload: any) => ({ ...payload, entries: payload.entries })),
      autoTranslateEntries: vi.fn(async () => ({ success: false, errorMessage: 'missing text' })),
    }
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED',
      },
      sourceLocale: 'en',
      defaultLocale: 'zh',
      hostServices: { i18n: i18nService },
      hostUi: makeHostUi(),
    })

    await manager.loadLanguages()
    manager.sourceEntries.value = [sourceEntry]
    manager.setTranslation(sourceEntry, '你好')
    await expect(manager.flushDirtyTranslations()).resolves.toBe(true)

    expect(i18nService.getEnabledLanguages).toHaveBeenCalled()
    expect(i18nService.saveBundle).toHaveBeenCalledWith(expect.objectContaining({ partial: true }))
  })

  it('reports failed draft saves through HostUi', async () => {
    const sourceEntry = {
      key: 'hero.title',
      field: 'text',
      source: 'Hello',
      sourceHash: 'hash',
    } as const
    const i18nService = {
      saveBundle: vi.fn(async () => {
        throw new Error('save down')
      }),
    }
    const hostUi = makeHostUi()
    const blockingProcess = {
      start: vi.fn(),
      stop: vi.fn(),
      setMessage: vi.fn(),
    }
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED',
      },
      sourceLocale: 'en',
      defaultLocale: 'zh',
      languages: [
        { label: 'English', value: 'en', defaultLang: 1 },
        { label: 'Chinese', value: 'zh', defaultLang: 0 },
      ],
      hostServices: { i18n: i18nService },
      hostUi,
      blockingProcess,
    })

    manager.sourceEntries.value = [sourceEntry]
    manager.setTranslation(sourceEntry, '你好')

    await expect(manager.ensureReadyOrConfirm('save')).resolves.toBe(false)

    expect(blockingProcess.stop).toHaveBeenCalled()
    expect(hostUi.message.error).toHaveBeenCalledWith('save down')
  })
})
