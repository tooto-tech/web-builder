import { markRaw, shallowReactive } from 'vue'

const toModelList = (input: any): any[] => {
  if (Array.isArray(input)) return input
  if (Array.isArray(input?.models)) return input.models
  return []
}

/**
 * Reactive representation of the GrapesJS pages state
 * @typedef ReactivePages
 * @memberof module:usePages
 * @inner
 * @property {Object[]} pages A reactive list of all pages
 * @property {Object} selected The currently selected page
 * @property {Function} select Select page
 * @property {Function} add Add page
 * @property {Function} remove Remove page
 * @property {Function} move Move page to target index
 */

/**
 * Provide reactive object that contains the state of the GrapesJs pages.
 * @exports usePages
 * @param {VGCconfig} grapes Response of useGrapes
 * @returns {module:usePages~ReactivePages}
 */
export default function usePages(grapes: any) {
  if (!grapes._cache.pages) {
    const pm = (grapes._cache.pages = shallowReactive({
      pages: [] as any[],
      selected: null as any,
      select: ((_pageOrId: any) => {}) as (pageOrId: any) => void,
      add: (() => {}) as (page: any) => void,
      remove: (() => {}) as (page: any) => void,
      move: ((_pageOrId: any, _at: number) => {}) as (pageOrId: any, at: number) => void,
    }))

    grapes.onInit((editor: any) => {
      const toRawPage = (page: any) => (page ? markRaw(page) : null)
      const readPageId = (page: any) =>
        page?.get?.('id') ?? page?.id ?? page?.get?.('name') ?? page?.name ?? null

      const refreshPages = () => {
        const pages = toModelList(editor.Pages.getAll?.())
        pm.pages = pages.map((page: any) => markRaw(page))
      }

      function updateSelected(page: any) {
        const currentPageId = readPageId(pm.selected)
        const nextPageId = readPageId(page)
        if (currentPageId && nextPageId && currentPageId === nextPageId) {
          return
        }
        pm.selected = toRawPage(page)
      }

      pm.select = (pageOrId: any) => {
        try {
          const rawPage = pageOrId?._model ?? pageOrId
          if (rawPage && typeof rawPage.get === 'function') {
            editor.Pages.select(rawPage)
            updateSelected(rawPage)
          } else if (typeof rawPage === 'string') {
            editor.Pages.select(rawPage)
            const selectedPage = editor.Pages.getSelected()
            if (selectedPage) {
              updateSelected(selectedPage)
            }
          }
        } catch {}
      }

      pm.add = editor.Pages.add.bind(editor.Pages)
      pm.remove = editor.Pages.remove.bind(editor.Pages)
      pm.move = (pageOrId: any, at: number) => {
        const page = pageOrId?._model ?? pageOrId
        if (!page || !Number.isInteger(at)) return
        editor.Pages.move(page, { at })
        refreshPages()
        updateSelected(editor.Pages.getSelected())
      }

      refreshPages()
      updateSelected(editor.Pages.getSelected())

      let refreshTimer: ReturnType<typeof setTimeout> | null = null
      const scheduleRefreshPages = () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer)
        }
        refreshTimer = setTimeout(() => {
          refreshPages()
          updateSelected(editor.Pages.getSelected())
          refreshTimer = null
        }, 50)
      }

      const updateSelectedOnly = () => {
        updateSelected(editor.Pages.getSelected())
      }

      const cleanup = () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer)
          refreshTimer = null
        }
        if (editor && typeof editor.off === 'function') {
          try {
            editor.off('page:select', updateSelectedOnly)
            editor.off('page:add', scheduleRefreshPages)
            editor.off('page:remove', scheduleRefreshPages)
            editor.off('page:update', updateSelectedOnly)
            editor.off('destroy', cleanup)
          }
          catch {}
        }
      }

      editor.on('page:select', updateSelectedOnly)
      editor.on('page:add', scheduleRefreshPages)
      editor.on('page:remove', scheduleRefreshPages)
      editor.on('page:update', updateSelectedOnly)

      if (editor.on && typeof editor.on === 'function') {
        editor.on('destroy', cleanup)
      }

      ;(pm as any)._cleanup = cleanup
    })
  }

  return grapes._cache.pages
}
