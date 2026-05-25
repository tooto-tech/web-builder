import { ref, unref, type ComputedRef, type Ref } from 'vue'
import type { PageResourceIdentity } from '@/api/content/page'
import {
  buildSelectedPageRouteQuery,
  findEditorPageByRoute,
  isSelectedPageRouteQueryCurrent,
  toEditorPageList,
  type PageResourceRouteQuery,
  type WebBuilderEditorMode
} from '@/components/WebBuilder/utils/pageResourceIdentity'
import { getPageLayoutSlot } from '@/components/WebBuilder/utils/layoutSettings'
import { getPrimaryContentPageFromEditor } from '@/components/WebBuilder/utils/pageSettings'
import {
  createLayoutPublishContext,
  resetLayoutPublishCache
} from '@/components/WebBuilder/utils/layoutPublish'

type RefLike<T> = Ref<T> | ComputedRef<T>

export interface UseEditorPageSyncOptions {
  routeQuery: RefLike<PageResourceRouteQuery>
  replaceRouteQuery: (
    query: PageResourceRouteQuery
  ) => Promise<unknown> | unknown
  getPageResource: () => PageResourceIdentity
  getEditorMode: () => WebBuilderEditorMode
  isEditorReady: RefLike<boolean>
  isLoopItemTemplateResource: RefLike<boolean>
  getSelectedPage: () => any
  exportLayoutSettings: () => any
  grapes?: {
    onInit?: (callback: (editor: any) => void) => void
  }
}

export interface UseEditorPageSyncReturn {
  isRestoringRoutePage: Ref<boolean>
  isPageSwitching: Ref<boolean>
  restoreSelectedPage: (editor: any) => void
  syncSelectedPageToRoute: (page: any) => void
  clearReadonlyLayoutPreview: (editor?: any) => void
  renderReadonlyLayoutPreview: () => void
  cleanup: () => void
}

export default function useEditorPageSync(
  options: UseEditorPageSyncOptions
): UseEditorPageSyncReturn {
  const isRestoringRoutePage = ref(true)
  const isPageSwitching = ref(false)
  let pageSwitchTimer: ReturnType<typeof setTimeout> | null = null
  let routeRestoreTimer: ReturnType<typeof setTimeout> | null = null
  let currentEditor: any = null
  const editorCleanups: Array<() => void> = []

  const clearPageSwitchTimer = () => {
    if (!pageSwitchTimer) return
    clearTimeout(pageSwitchTimer)
    pageSwitchTimer = null
  }

  const clearRouteRestoreTimer = () => {
    if (!routeRestoreTimer) return
    clearTimeout(routeRestoreTimer)
    routeRestoreTimer = null
  }

  const syncSelectedPageToRoute = (page: any) => {
    const currentQuery = unref(options.routeQuery)
    const nextQuery = buildSelectedPageRouteQuery({
      currentQuery,
      page,
      resource: options.getPageResource(),
      editorMode: options.getEditorMode()
    })
    if (!nextQuery || isSelectedPageRouteQueryCurrent(currentQuery, nextQuery)) return

    void options.replaceRouteQuery(nextQuery)
  }

  const clearReadonlyLayoutPreview = (editor?: any) => {
    const frameDoc = editor?.Canvas?.getDocument?.() as Document | null
    if (!frameDoc) return
    frameDoc.querySelectorAll('[data-wb-layout-preview]').forEach((node) => node.remove())
    frameDoc.getElementById('wb-layout-preview-style')?.remove()
  }

  const renderReadonlyLayoutPreview = () => {
    const editor = currentEditor
    if (!editor) return

    clearReadonlyLayoutPreview(editor)
    if (unref(options.isLoopItemTemplateResource)) return
    if (options.getEditorMode() !== 'content') return

    const selectedPage = options.getSelectedPage() || getPrimaryContentPageFromEditor(editor)
    if (!selectedPage || getPageLayoutSlot(selectedPage)) return

    const frameDoc = editor.Canvas?.getDocument?.() as Document | null
    const frameBody = editor.Canvas?.getBody?.() as HTMLElement | null
    if (!frameDoc || !frameBody) return

    const wrapperEl = frameBody.querySelector('[data-gjs-type="wrapper"]') as HTMLElement | null
    if (!wrapperEl) return

    resetLayoutPublishCache()
    const layoutPublishContext = createLayoutPublishContext(editor, options.exportLayoutSettings())
    const resolvedLayouts = layoutPublishContext.resolve(selectedPage)
    if (!resolvedLayouts.header && !resolvedLayouts.footer) return

    const styleEl = frameDoc.createElement('style')
    styleEl.id = 'wb-layout-preview-style'
    styleEl.textContent = `
    [data-wb-layout-preview] { pointer-events: none !important; user-select: none !important; }
    [data-wb-layout-preview] * { pointer-events: none !important; }
    [data-wb-layout-preview="header"] { position: relative; z-index: 1; }
    [data-wb-layout-preview="footer"] { position: relative; z-index: 1; }
    ${resolvedLayouts.header?.css || ''}
    ${resolvedLayouts.footer?.css || ''}
  `.trim()
    frameDoc.head.appendChild(styleEl)

    const buildPreviewNode = (slotKey: 'header' | 'footer', html: string) => {
      const container = frameDoc.createElement('div')
      container.setAttribute('data-wb-layout-preview', slotKey)
      container.setAttribute('data-gjs-type', 'none')
      container.innerHTML = html
      return container
    }

    if (resolvedLayouts.header?.html) {
      const headerNode = buildPreviewNode('header', resolvedLayouts.header.html)
      frameBody.insertBefore(headerNode, wrapperEl)
    }
    if (resolvedLayouts.footer?.html) {
      const footerNode = buildPreviewNode('footer', resolvedLayouts.footer.html)
      wrapperEl.insertAdjacentElement('afterend', footerNode)
    }
  }

  const restoreSelectedPage = (editor: any) => {
    currentEditor = editor
    isRestoringRoutePage.value = true
    const currentQuery = unref(options.routeQuery)
    const targetPageId = (currentQuery.page || currentQuery.id) as string | undefined
    const targetPage = findEditorPageByRoute(
      editor,
      currentQuery.type,
      targetPageId,
      options.getEditorMode() === 'layout'
    )

    if (targetPage) {
      editor.Pages?.select?.(targetPage)
    } else if (options.getEditorMode() === 'content') {
      const contentPage = getPrimaryContentPageFromEditor(editor)
      if (contentPage) {
        editor.Pages?.select?.(contentPage)
      }
    } else {
      const firstPage = toEditorPageList(editor.Pages?.getAll?.())[0]
      if (firstPage) {
        editor.Pages?.select?.(firstPage)
      }
    }

    clearRouteRestoreTimer()
    routeRestoreTimer = setTimeout(() => {
      routeRestoreTimer = null
      isRestoringRoutePage.value = false
      syncSelectedPageToRoute(editor.Pages?.getSelected?.())
      renderReadonlyLayoutPreview()
    }, 0)
  }

  const registerEditor = (editor: any) => {
    currentEditor = editor

    const handlePageSelect = (page: any) => {
      if (options.getEditorMode() === 'content' && getPageLayoutSlot(page)) {
        const contentPage = getPrimaryContentPageFromEditor(editor)
        if (contentPage && contentPage !== page) {
          editor.Pages?.select?.(contentPage)
        }
        return
      }

      if (isRestoringRoutePage.value) return
      syncSelectedPageToRoute(page || editor.Pages?.getSelected?.())
      renderReadonlyLayoutPreview()
      if (!unref(options.isEditorReady)) return

      isPageSwitching.value = true
      clearPageSwitchTimer()
      pageSwitchTimer = setTimeout(() => {
        isPageSwitching.value = false
        pageSwitchTimer = null
      }, 30)
    }

    const handleFrameLoad = () => {
      renderReadonlyLayoutPreview()
      if (!isPageSwitching.value) return
      clearPageSwitchTimer()
      isPageSwitching.value = false
    }

    editor.on?.('page:select', handlePageSelect)
    editor.on?.('canvas:frame:load', handleFrameLoad)

    editorCleanups.push(() => {
      editor.off?.('page:select', handlePageSelect)
      editor.off?.('canvas:frame:load', handleFrameLoad)
    })
  }

  const cleanup = () => {
    clearPageSwitchTimer()
    clearRouteRestoreTimer()
    isPageSwitching.value = false
    while (editorCleanups.length) {
      editorCleanups.pop()?.()
    }
    currentEditor = null
  }

  options.grapes?.onInit?.(registerEditor)

  return {
    isRestoringRoutePage,
    isPageSwitching,
    restoreSelectedPage,
    syncSelectedPageToRoute,
    clearReadonlyLayoutPreview,
    renderReadonlyLayoutPreview,
    cleanup
  }
}
