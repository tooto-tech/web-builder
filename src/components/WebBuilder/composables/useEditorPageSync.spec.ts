import { computed, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useEditorPageSync from './useEditorPageSync'

const makePage = (options: {
  id: string
  name?: string
  slug?: string
  custom?: Record<string, unknown>
}) => ({
  id: options.id,
  name: options.name ?? options.id,
  slug: options.slug ?? options.id,
  custom: options.custom ?? {},
  get(key: string) {
    return (this as any)[key]
  },
  getMainComponent: vi.fn(() => ({ id: `${options.id}-main` })),
})

const makeEditor = (pages: any[], selected = pages[0]) => {
  const handlers: Record<string, (...args: any[]) => void> = {}
  let selectedPage = selected
  const editor = {
    Pages: {
      getAll: vi.fn(() => pages),
      getSelected: vi.fn(() => selectedPage),
      select: vi.fn((page: any) => {
        selectedPage = typeof page === 'string' ? pages.find((item) => item.id === page) : page
      }),
    },
    Canvas: {
      getDocument: vi.fn(() => null),
      getBody: vi.fn(() => null),
    },
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      handlers[event] = handler
    }),
    off: vi.fn(),
    __handlers: handlers,
  }
  return editor
}

const makeOptions = (overrides: Record<string, any> = {}) => {
  const routeQuery = ref<Record<string, unknown>>(overrides.routeQuery ?? {})
  const replace = vi.fn()
  const initCallbacks: Array<(editor: any) => void> = []
  return {
    routeQuery,
    replace,
    initCallbacks,
    options: {
      routeQuery: computed(() => routeQuery.value),
      replaceRouteQuery: replace,
      getPageResource: () => ({
        resourceId: 1,
        resourceKey: 'page-key',
        resourceType: 'PAGE',
        resourceScope: 'OWNED',
      }),
      getEditorMode: () => 'content' as const,
      isEditorReady: ref(true),
      isLoopItemTemplateResource: ref(false),
      getSelectedPage: () => null,
      exportLayoutSettings: () => ({}),
      grapes: {
        onInit: (callback: (editor: any) => void) => initCallbacks.push(callback),
      },
      ...overrides.options,
    },
  }
}

describe('useEditorPageSync', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('restores the selected editor page from the route and then syncs route identity', () => {
    vi.useFakeTimers()
    const header = makePage({ id: 'wb-header', name: 'Header', custom: { wbLayoutSlot: 'header' } })
    const home = makePage({ id: 'home', name: 'Home' })
    const editor = makeEditor([home, header], home)
    const ctx = makeOptions({
      routeQuery: { type: 'navbar', id: 'wb-header' },
      options: { getEditorMode: () => 'layout' as const },
    })
    const sync = useEditorPageSync(ctx.options)

    sync.restoreSelectedPage(editor)

    expect(editor.Pages.select).toHaveBeenCalledWith(header)
    expect(sync.isRestoringRoutePage.value).toBe(true)

    vi.runOnlyPendingTimers()

    expect(sync.isRestoringRoutePage.value).toBe(false)
    expect(ctx.replace).toHaveBeenCalledWith(expect.objectContaining({
      type: 'navbar',
      id: 'wb-header',
      sourceResourceKey: 'page-key',
    }))
  })

  it('replaces the route query when the selected page changes', () => {
    const home = makePage({ id: 'home', name: 'Home', slug: 'home' })
    const ctx = makeOptions({
      routeQuery: { type: 'page', id: 'old' },
    })
    const sync = useEditorPageSync(ctx.options)

    sync.syncSelectedPageToRoute(home)

    expect(ctx.replace).toHaveBeenCalledWith(expect.objectContaining({
      type: 'page',
      id: 'home',
      sourceResourceKey: 'page-key',
    }))
  })

  it('tracks page switching until frame load or fallback timer and cleans up listeners', () => {
    vi.useFakeTimers()
    const home = makePage({ id: 'home', name: 'Home' })
    const about = makePage({ id: 'about', name: 'About' })
    const editor = makeEditor([home, about], home)
    const ctx = makeOptions()
    const sync = useEditorPageSync(ctx.options)
    ctx.initCallbacks[0](editor)
    sync.restoreSelectedPage(editor)
    vi.runOnlyPendingTimers()

    editor.__handlers['page:select'](about)

    expect(sync.isPageSwitching.value).toBe(true)

    editor.__handlers['canvas:frame:load']()
    expect(sync.isPageSwitching.value).toBe(false)

    editor.__handlers['page:select'](home)
    expect(sync.isPageSwitching.value).toBe(true)

    sync.cleanup()
    vi.advanceTimersByTime(30)

    expect(sync.isPageSwitching.value).toBe(false)
    expect(editor.off).toHaveBeenCalledWith('page:select', expect.any(Function))
    expect(editor.off).toHaveBeenCalledWith('canvas:frame:load', expect.any(Function))
  })
})
