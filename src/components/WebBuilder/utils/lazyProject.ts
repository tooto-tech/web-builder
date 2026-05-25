import { computed, shallowRef } from 'vue'

const PAGE_KEYS = new Set(['pages'])

const deepClone = <T>(value: T): T => {
  if (value == null) return value
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

const toPages = (projectData: Record<string, any> | null | undefined): any[] =>
  Array.isArray(projectData?.pages) ? projectData.pages : []

const readPageId = (page: any): string =>
  `${page?.id ?? page?.get?.('id') ?? page?.name ?? page?.get?.('name') ?? ''}`.trim()

const readPageName = (page: any): string =>
  `${page?.name ?? page?.get?.('name') ?? page?.id ?? page?.get?.('id') ?? 'Page'}`.trim()

const buildSinglePageProjectData = (
  fullProjectData: Record<string, any>,
  pageId?: string,
): { projectData: Record<string, any>; pageId: string } => {
  const pages = toPages(fullProjectData)
  const selectedPage =
    pages.find((page) => readPageId(page) === pageId) ??
    pages[0] ??
    { id: 'home', name: 'Home', component: '' }
  const selectedPageId = readPageId(selectedPage) || 'home'

  return {
    pageId: selectedPageId,
    projectData: {
      ...deepClone(fullProjectData),
      pages: [deepClone({ ...selectedPage, id: selectedPageId })],
    },
  }
}

const mergeProjectTopLevel = (
  baseProjectData: Record<string, any>,
  currentProjectData: Record<string, any>,
) => {
  const merged = { ...baseProjectData }
  Object.keys(currentProjectData || {}).forEach((key) => {
    if (PAGE_KEYS.has(key)) return
    merged[key] = deepClone(currentProjectData[key])
  })
  return merged
}

export const useLazyProjectData = () => {
  const fullProjectData = shallowRef<Record<string, any> | null>(null)
  const activePageId = shallowRef<string>('')

  const pages = computed(() => toPages(fullProjectData.value))
  const hasProject = computed(() => !!fullProjectData.value)

  const setFullProjectData = (projectData: Record<string, any> | null, pageId?: string) => {
    if (!projectData) {
      fullProjectData.value = null
      activePageId.value = ''
      return null
    }

    fullProjectData.value = deepClone(projectData)
    const result = buildSinglePageProjectData(fullProjectData.value, pageId)
    activePageId.value = result.pageId
    return result
  }

  const mergeCurrentEditorPage = (editor: any) => {
    if (!editor?.getProjectData || !fullProjectData.value || !activePageId.value) {
      return fullProjectData.value
    }

    const currentProjectData = editor.getProjectData()
    const currentPages = toPages(currentProjectData)
    if (currentPages.length > 1) {
      fullProjectData.value = deepClone(currentProjectData)
      const selectedPageId = readPageId(editor.Pages?.getSelected?.())
      if (selectedPageId) {
        activePageId.value = selectedPageId
      }
      return fullProjectData.value
    }

    const loadedPage = currentPages[0]
    if (!loadedPage) return fullProjectData.value

    const nextProjectData = mergeProjectTopLevel(fullProjectData.value, currentProjectData)
    const loadedPageData = deepClone({ ...loadedPage, id: activePageId.value })
    const nextPages = toPages(nextProjectData)
    const pageIndex = nextPages.findIndex((page) => readPageId(page) === activePageId.value)

    if (pageIndex >= 0) {
      nextPages[pageIndex] = {
        ...deepClone(nextPages[pageIndex]),
        ...loadedPageData,
        id: activePageId.value,
      }
    } else {
      nextPages.push(loadedPageData)
    }

    nextProjectData.pages = nextPages
    fullProjectData.value = nextProjectData
    return nextProjectData
  }

  const getMergedProjectData = (editor?: any) => {
    if (editor) {
      mergeCurrentEditorPage(editor)
    }
    return fullProjectData.value ? deepClone(fullProjectData.value) : null
  }

  const getMergedSchemaJson = (editor?: any) => {
    const projectData = getMergedProjectData(editor)
    return projectData ? JSON.stringify(projectData) : ''
  }

  const getSinglePageProjectData = (pageId?: string) => {
    if (!fullProjectData.value) return null
    return buildSinglePageProjectData(fullProjectData.value, pageId)
  }

  const upsertPage = (pageData: Record<string, any>, at?: number) => {
    if (!fullProjectData.value) return
    const id = readPageId(pageData)
    if (!id) return

    const nextProjectData = deepClone(fullProjectData.value)
    const nextPages = toPages(nextProjectData)
    const existingIndex = nextPages.findIndex((page) => readPageId(page) === id)
    if (existingIndex >= 0) {
      nextPages[existingIndex] = { ...nextPages[existingIndex], ...deepClone(pageData), id }
    } else if (Number.isInteger(at)) {
      nextPages.splice(Math.max(0, Math.min(at as number, nextPages.length)), 0, deepClone({ ...pageData, id }))
    } else {
      nextPages.push(deepClone({ ...pageData, id }))
    }
    nextProjectData.pages = nextPages
    fullProjectData.value = nextProjectData
  }

  const updatePage = (pageId: string, patch: Record<string, any>) => {
    if (!fullProjectData.value || !pageId) return
    const nextProjectData = deepClone(fullProjectData.value)
    nextProjectData.pages = toPages(nextProjectData).map((page) =>
      readPageId(page) === pageId ? { ...page, ...deepClone(patch), id: pageId } : page,
    )
    fullProjectData.value = nextProjectData
  }

  const removePage = (pageId: string) => {
    if (!fullProjectData.value || !pageId) return
    const nextProjectData = deepClone(fullProjectData.value)
    const nextPages = toPages(nextProjectData).filter((page) => readPageId(page) !== pageId)
    nextProjectData.pages = nextPages.length > 0
      ? nextPages
      : [{ id: 'home', name: 'Home', component: '' }]
    fullProjectData.value = nextProjectData
    if (activePageId.value === pageId) {
      activePageId.value = readPageId(nextProjectData.pages[0])
    }
  }

  const movePage = (pageId: string, at: number) => {
    if (!fullProjectData.value || !pageId || !Number.isInteger(at)) return
    const nextProjectData = deepClone(fullProjectData.value)
    const nextPages = toPages(nextProjectData)
    const index = nextPages.findIndex((page) => readPageId(page) === pageId)
    if (index < 0) return
    const [page] = nextPages.splice(index, 1)
    nextPages.splice(Math.max(0, Math.min(at, nextPages.length)), 0, page)
    nextProjectData.pages = nextPages
    fullProjectData.value = nextProjectData
  }

  const setActivePageId = (pageId: string) => {
    activePageId.value = pageId
  }

  return {
    activePageId,
    fullProjectData,
    hasProject,
    pages,
    getMergedProjectData,
    getMergedSchemaJson,
    getSinglePageProjectData,
    mergeCurrentEditorPage,
    movePage,
    removePage,
    setActivePageId,
    setFullProjectData,
    updatePage,
    upsertPage,
    readPageId,
    readPageName,
  }
}
