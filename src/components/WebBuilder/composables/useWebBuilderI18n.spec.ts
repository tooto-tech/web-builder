import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/content/webbuilderI18n', () => ({
  autoTranslateEntries: vi.fn(),
  getBundle: vi.fn(),
  saveBundle: vi.fn(),
  translateEntries: vi.fn()
}))

vi.mock('@/api/system/language', () => ({
  getEnabledLanguageList: vi.fn()
}))

vi.mock('@/api/content/page', () => ({
  hasPageResourceLocator: (resource: any) => Boolean(resource?.resourceId && resource?.resourceKey)
}))

vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn() }
}))

vi.mock('@/components/WebBuilder/utils/wbMessage', () => ({
  wbMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import useWebBuilderI18n from './useWebBuilderI18n'
import {
  autoTranslateEntries,
  getBundle,
  saveBundle,
  translateEntries
} from '@/api/content/webbuilderI18n'
import { getEnabledLanguageList } from '@/api/system/language'
import { WB_I18N_KEY_ATTR } from '@/components/WebBuilder/utils/i18n'
import { ElMessageBox } from 'element-plus'
import { wbMessage } from '@/components/WebBuilder/utils/wbMessage'

const createMemoryStorage = (): Storage => {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    clear: () => {
      store = {}
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key]
    },
    setItem: (key: string, value: string) => {
      store[key] = value
    }
  }
}

const makeReadyOptions = (overrides: Record<string, any> = {}) => ({
  grapes: null,
  resource: {
    resourceId: 1,
    resourceKey: 'page-key',
    resourceType: 'PAGE',
    resourceScope: 'OWNED'
  } as any,
  sourceLocale: 'en',
  defaultLocale: 'zh',
  languages: [
    { label: 'English', value: 'en', defaultLang: 1 },
    { label: 'Chinese', value: 'zh', defaultLang: 0 }
  ],
  blockingProcess: {
    start: vi.fn(),
    stop: vi.fn(),
    setMessage: vi.fn()
  },
  ...overrides
})

class MockComponent {
  attrs: Record<string, any>
  children: MockComponent[]
  content: string
  type: string

  constructor(options: {
    attrs?: Record<string, any>
    children?: MockComponent[]
    content?: string
    type?: string
  }) {
    this.attrs = options.attrs ?? {}
    this.children = options.children ?? []
    this.content = options.content ?? ''
    this.type = options.type ?? 'text'
  }

  get(key: string) {
    if (key === 'attributes') return this.attrs
    if (key === 'components') return this.children
    if (key === 'content') return this.content
    if (key === 'type') return this.type
    return undefined
  }

  getAttributes() {
    return this.attrs
  }

  addAttributes(attrs: Record<string, any>) {
    this.attrs = { ...this.attrs, ...attrs }
  }

  components() {
    return this.children
  }
}

describe('useWebBuilderI18n', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps i18n scans lazy and debounced after GrapesJS init', () => {
    vi.useFakeTimers()
    const initCallbacks: Array<(editor: any) => void> = []
    const handlers: Record<string, () => void> = {}
    const grapes = {
      onInit: (callback: (editor: any) => void) => initCallbacks.push(callback)
    }
    const component = new MockComponent({ content: 'Headline' }) as any
    component.toJSON = () => {
      throw new Error('live model serialization should not run')
    }
    const wrapper = new MockComponent({ children: [component] })
    let projectDataReads = 0
    const editor = {
      getWrapper: () => wrapper,
      getProjectData: () => {
        projectDataReads += 1
        return { pages: [] }
      },
      on: (event: string, handler: () => void) => {
        handlers[event] = handler
      },
      off: vi.fn()
    }

    const manager = useWebBuilderI18n({
      grapes,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      languages: [{ label: 'English', value: 'en', defaultLang: 1 }]
    })

    initCallbacks[0](editor)

    expect(projectDataReads).toBe(0)
    expect(handlers['component:update']).toBeUndefined()
    expect(handlers['component:update:attributes']).toBeTypeOf('function')

    handlers['component:update:attributes']()
    vi.advanceTimersByTime(300)
    expect(projectDataReads).toBe(0)

    manager.refreshSourceEntries()
    expect(projectDataReads).toBe(1)

    handlers['component:update:attributes']()
    handlers['component:update:content']()
    handlers['component:remove']()
    expect(projectDataReads).toBe(1)

    vi.advanceTimersByTime(299)
    expect(projectDataReads).toBe(1)
    vi.advanceTimersByTime(1)
    expect(projectDataReads).toBe(2)
  })

  it('omits translation provider by default so backend uses current config', async () => {
    vi.mocked(translateEntries).mockResolvedValue({ success: true, entries: [] })
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'en',
      defaultLocale: 'zh',
      languages: [
        { label: 'English', value: 'en', defaultLang: 1 },
        { label: 'Chinese', value: 'zh', defaultLang: 0 }
      ]
    })

    await manager.machineTranslateEntries([
      { key: 'hero.title', field: 'text', source: 'Hello', sourceHash: 'hash' }
    ])

    const payload = vi.mocked(translateEntries).mock.calls[0][0]
    expect(payload).not.toHaveProperty('provider')
  })

  it('sends translation provider only after the user selects one', async () => {
    vi.mocked(translateEntries).mockResolvedValue({ success: true, entries: [] })
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'en',
      defaultLocale: 'zh',
      languages: [
        { label: 'English', value: 'en', defaultLang: 1 },
        { label: 'Chinese', value: 'zh', defaultLang: 0 }
      ]
    })

    manager.setProvider('deepseek')
    await manager.machineTranslateEntries([
      { key: 'hero.title', field: 'text', source: 'Hello', sourceHash: 'hash' }
    ])

    expect(vi.mocked(translateEntries).mock.calls[0][0].provider).toBe('deepseek')
  })

  it('uses default language code as source and excludes it from target languages', async () => {
    vi.mocked(getEnabledLanguageList).mockResolvedValue([
      {
        id: 1,
        name: 'English (United States)',
        code: 'en_US',
        slug: 'en',
        sortOrder: 0,
        status: 0,
        defaultLang: 1,
        createTime: new Date()
      },
      {
        id: 2,
        name: '简体中文 (Chinese)',
        code: 'zh_CN',
        slug: 'zh',
        sortOrder: 1,
        status: 0,
        defaultLang: 0,
        createTime: new Date()
      }
    ])
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any
    })

    await manager.loadLanguages()

    expect(manager.sourceLocale.value).toBe('en_US')
    expect(manager.locale.value).toBe('zh_CN')
    expect(manager.targetLanguages.value.map((lang) => lang.value)).toEqual(['zh_CN'])
    expect(manager.languages.value.map((lang) => lang.label)).toEqual([
      'English (United States) / en_US',
      '简体中文 (Chinese) / zh_CN'
    ])
  })

  it('selects the GrapesJS component that owns an i18n entry', () => {
    const initCallbacks: Array<(editor: any) => void> = []
    const grapes = {
      onInit: (callback: (editor: any) => void) => initCallbacks.push(callback)
    }
    const translated = new MockComponent({
      attrs: { [WB_I18N_KEY_ATTR]: 'translated' },
      content: 'Translated'
    })
    const missing = new MockComponent({
      attrs: { [WB_I18N_KEY_ATTR]: 'missing' },
      content: 'Missing'
    })
    const wrapper = new MockComponent({
      children: [translated, new MockComponent({ children: [missing] })]
    })
    const editor = {
      Pages: {
        getAll: () => [{ getMainComponent: () => wrapper }]
      },
      getProjectData: () => ({ pages: [] }),
      select: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    }
    const manager = useWebBuilderI18n({
      grapes,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'en',
      defaultLocale: 'zh',
      languages: [
        { label: 'English', value: 'en', defaultLang: 1 },
        { label: 'Chinese', value: 'zh', defaultLang: 0 }
      ]
    })

    initCallbacks[0](editor)

    expect(manager.selectEntryComponent({ key: 'missing' } as any)).toBe(true)
    expect(editor.select).toHaveBeenCalledWith(missing)
  })

  it('rejects unchanged sentence results when backend does not mark them translated', async () => {
    vi.mocked(translateEntries).mockResolvedValue({
      success: true,
      entries: [
        {
          key: 'hero.title',
          field: 'text',
          source: 'More than bearings. Support your bearing decisions.',
          sourceHash: 'hash',
          translation: 'More than bearings. Support your bearing decisions.',
          status: 'missing'
        }
      ]
    })
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'en',
      defaultLocale: 'zh',
      languages: [
        { label: 'English', value: 'en', defaultLang: 1 },
        { label: 'Chinese', value: 'zh', defaultLang: 0 }
      ]
    })
    manager.sourceEntries.value = [
      {
        key: 'hero.title',
        field: 'text',
        source: 'More than bearings. Support your bearing decisions.',
        sourceHash: 'hash'
      }
    ]

    await manager.machineTranslateEntries([manager.sourceEntries.value[0]])

    expect(manager.entries.value[0].translation).toBe('')
    expect(manager.entries.value[0].status).toBe('error')
    expect(manager.lastError.value).toContain('翻译引擎未返回目标语言内容')
  })

  it('keeps backend translated identity results from machine translation', async () => {
    vi.mocked(translateEntries).mockResolvedValue({
      success: true,
      entries: [
        {
          key: 'hero.title',
          field: 'text',
          source: 'Heading hello',
          sourceHash: 'hash',
          translation: 'Heading hello',
          status: 'translated',
          translationOrigin: 'machine',
          reviewStatus: 'reviewed'
        }
      ]
    })
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'zh_CN',
      defaultLocale: 'en_US',
      languages: [
        { label: '简体中文', value: 'zh_CN', defaultLang: 1 },
        { label: 'English', value: 'en_US', defaultLang: 0 }
      ]
    })
    manager.sourceEntries.value = [
      {
        key: 'hero.title',
        field: 'text',
        source: 'Heading hello',
        sourceHash: 'hash'
      }
    ]

    await manager.machineTranslateEntries([manager.sourceEntries.value[0]])

    expect(manager.entries.value[0].translation).toBe('Heading hello')
    expect(manager.entries.value[0].status).toBe('translated')
    expect(manager.lastError.value).toBe('')
  })

  it('omits provider during save-time auto translation by default', async () => {
    vi.mocked(autoTranslateEntries).mockResolvedValue({ success: true })
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'en',
      defaultLocale: 'zh',
      languages: [
        { label: 'English', value: 'en', defaultLang: 1 },
        { label: 'Chinese', value: 'zh', defaultLang: 0 }
      ]
    })
    manager.sourceEntries.value = [
      { key: 'hero.title', field: 'text', source: 'Hello', sourceHash: 'hash' }
    ]

    await manager.autoTranslateMissing({ reloadCurrentLocale: false })

    const payload = vi.mocked(autoTranslateEntries).mock.calls[0][0]
    expect(payload).not.toHaveProperty('provider')
  })

  it('skips publish-time auto translation when the only target locale is already translated', async () => {
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'zh_CN',
      defaultLocale: 'en_US',
      languages: [
        { label: '简体中文', value: 'zh_CN', defaultLang: 1 },
        { label: 'English', value: 'en_US', defaultLang: 0 }
      ]
    })
    manager.sourceEntries.value = [
      { key: 'hero.title', field: 'text', source: 'Heading hello', sourceHash: 'hash' }
    ]
    manager.savedEntries.value = [
      {
        key: 'hero.title',
        field: 'text',
        source: 'Heading hello',
        sourceHash: 'hash',
        translation: 'Heading hello',
        status: 'translated'
      }
    ]

    await expect(
      manager.autoTranslateMissing({ publishReady: true, reloadCurrentLocale: false })
    ).resolves.toBe(true)

    expect(autoTranslateEntries).not.toHaveBeenCalled()
  })

  it('keeps manual translation drafts in browser storage until page save', async () => {
    const localStorage = createMemoryStorage()
    vi.stubGlobal('window', { localStorage })
    vi.mocked(getBundle).mockResolvedValue({
      resourceId: 1,
      resourceKey: 'page-key',
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
      locale: 'zh_CN',
      sourceLocale: 'en_US',
      entries: []
    })
    const sourceEntry = {
      key: 'hero.title',
      field: 'text',
      source: 'Hello',
      sourceHash: 'hash'
    } as const
    const baseOptions = {
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'en_US',
      defaultLocale: 'zh_CN',
      languages: [
        { label: 'English', value: 'en_US', defaultLang: 1 },
        { label: 'Chinese', value: 'zh_CN', defaultLang: 0 }
      ]
    }

    const manager = useWebBuilderI18n(baseOptions)
    manager.sourceEntries.value = [sourceEntry]
    manager.setTranslation(sourceEntry, '你好')

    const restored = useWebBuilderI18n(baseOptions)
    restored.sourceEntries.value = [sourceEntry]
    await restored.loadBundle()

    expect(restored.entries.value[0].translation).toBe('你好')
    expect(restored.entries.value[0].translationOrigin).toBe('manual')
    expect(restored.dirty.value).toBe(true)
    expect(vi.mocked(saveBundle)).not.toHaveBeenCalled()
  })

  it('flushes browser translation drafts through the bundle save API', async () => {
    const localStorage = createMemoryStorage()
    vi.stubGlobal('window', { localStorage })
    vi.mocked(saveBundle).mockImplementation(async (payload: any) => ({
      ...payload,
      updateTime: new Date(),
      entries: payload.entries
    }))
    const sourceEntry = {
      key: 'hero.title',
      field: 'text',
      source: 'Hello',
      sourceHash: 'hash'
    } as const
    const manager = useWebBuilderI18n({
      grapes: null,
      resource: {
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED'
      } as any,
      sourceLocale: 'en_US',
      defaultLocale: 'zh_CN',
      languages: [
        { label: 'English', value: 'en_US', defaultLang: 1 },
        { label: 'Chinese', value: 'zh_CN', defaultLang: 0 }
      ]
    })
    manager.sourceEntries.value = [sourceEntry]
    manager.setTranslation(sourceEntry, '你好')

    expect(await manager.flushDirtyTranslations()).toBe(true)

    const payload = vi.mocked(saveBundle).mock.calls[0][0]
    expect(payload.entries[0]).toMatchObject({
      key: 'hero.title',
      field: 'text',
      translation: '你好',
      status: 'translated',
      translationOrigin: 'manual',
      reviewStatus: 'reviewed'
    })
    expect(manager.dirty.value).toBe(false)
    expect(localStorage.length).toBe(0)
  })

  it('ensureReadyOrConfirm stops the blocking process and reports failed manual draft flush', async () => {
    const localStorage = createMemoryStorage()
    vi.stubGlobal('window', { localStorage })
    vi.mocked(saveBundle).mockRejectedValue(new Error('save down'))
    const options = makeReadyOptions()
    const manager = useWebBuilderI18n(options)
    const sourceEntry = {
      key: 'hero.title',
      field: 'text',
      source: 'Hello',
      sourceHash: 'hash'
    } as const
    manager.sourceEntries.value = [sourceEntry]
    manager.setTranslation(sourceEntry, '你好')

    await expect(manager.ensureReadyOrConfirm('save')).resolves.toBe(false)

    expect(options.blockingProcess.setMessage).toHaveBeenCalledWith([
      '正在检索翻译内容',
      '正在同步手工译文草稿',
      '正在保存多语言草稿',
      '正在检查缺失翻译',
      '正在自动翻译缺失片段',
      '正在校验多语言保存状态'
    ])
    expect(options.blockingProcess.stop).toHaveBeenCalled()
    expect(wbMessage.error).toHaveBeenCalledWith('save down')
  })

  it('ensureReadyOrConfirm asks for confirmation after auto translation issues and resumes blocking messages', async () => {
    vi.mocked(autoTranslateEntries).mockResolvedValue({
      success: false,
      errorMessage: '仍存在缺失翻译'
    } as any)
    vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm' as any)
    const options = makeReadyOptions()
    const manager = useWebBuilderI18n(options)
    manager.sourceEntries.value = [
      { key: 'hero.title', field: 'text', source: 'Hello', sourceHash: 'hash' }
    ]

    await expect(manager.ensureReadyOrConfirm('publish')).resolves.toBe(true)

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      '多语言自动翻译未全部完成：仍存在缺失翻译。继续发布后，缺失或异常片段可能显示源语言内容或旧译文。是否继续发布？',
      '多语言发布提醒',
      expect.objectContaining({
        confirmButtonText: '继续发布',
        cancelButtonText: '取消发布',
        type: 'warning'
      })
    )
    expect(options.blockingProcess.stop).toHaveBeenCalled()
    expect(options.blockingProcess.start).toHaveBeenCalledWith('publish', [
      '正在继续发布前检查',
      '正在同步发布前资源'
    ])
  })

  it('ensureReadyOrConfirm warns and cancels when the user rejects the i18n warning', async () => {
    vi.mocked(autoTranslateEntries).mockResolvedValue({
      success: false,
      errorMessage: '仍存在缺失翻译'
    } as any)
    vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel')
    const options = makeReadyOptions()
    const manager = useWebBuilderI18n(options)
    manager.sourceEntries.value = [
      { key: 'hero.title', field: 'text', source: 'Hello', sourceHash: 'hash' }
    ]

    await expect(manager.ensureReadyOrConfirm('save')).resolves.toBe(false)

    expect(wbMessage.warning).toHaveBeenCalledWith('已取消保存，当前编辑内容仍保留在页面中')
    expect(options.blockingProcess.start).not.toHaveBeenCalled()
  })
})
