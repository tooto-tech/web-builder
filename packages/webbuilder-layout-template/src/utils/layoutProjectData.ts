import {
  getGrapesPageId,
  getPageLayoutSlot,
  normalizeLayoutSettings,
  type LayoutSlotKey,
  type WebBuilderLayoutSettings,
} from './layoutSettings'

type ProjectData = Record<string, any>

export interface LegacyLayoutBundle {
  pageProjectData: ProjectData | null
  layoutPages: Record<string, any>[]
  layoutSettings: WebBuilderLayoutSettings
}

const deepClone = <T>(value: T): T => {
  if (value == null) return value
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

const toPageList = (projectData: ProjectData | null | undefined): Record<string, any>[] =>
  Array.isArray(projectData?.pages) ? projectData.pages : []

const uniqueArrayByJson = (items: any[]) => {
  const seen = new Set<string>()
  const result: any[] = []
  items.forEach((item) => {
    const signature = JSON.stringify(item ?? null)
    if (seen.has(signature)) return
    seen.add(signature)
    result.push(item)
  })
  return result
}

const mergeArrayField = (target: ProjectData, source: ProjectData, key: string) => {
  const targetItems = Array.isArray(target[key]) ? target[key] : []
  const sourceItems = Array.isArray(source[key]) ? source[key] : []
  if (!targetItems.length && !sourceItems.length) return
  target[key] = uniqueArrayByJson([...targetItems, ...sourceItems].map((item) => deepClone(item)))
}

export const extractLegacyLayoutBundle = (
  projectData: ProjectData | null | undefined,
): LegacyLayoutBundle => {
  const nextProject = projectData ? deepClone(projectData) : null
  const pages = toPageList(nextProject)
  const layoutPages = pages.filter((page) => !!getPageLayoutSlot(page))
  const pagePages = pages.filter((page) => !getPageLayoutSlot(page))

  if (nextProject) {
    nextProject.pages = pagePages
    delete nextProject.wbLayoutSettings
  }

  return {
    pageProjectData: nextProject,
    layoutPages,
    layoutSettings: normalizeLayoutSettings(projectData?.wbLayoutSettings ?? null),
  }
}

export const mergeLayoutBundleProjectData = (
  pageProjectData: ProjectData | null | undefined,
  layoutProjectDataList: Array<ProjectData | null | undefined>,
): ProjectData => {
  const baseProject = pageProjectData ? deepClone(pageProjectData) : { assets: [], styles: [], pages: [] }
  baseProject.pages = toPageList(baseProject).map((page) => deepClone(page))

  layoutProjectDataList.forEach((layoutProject) => {
    if (!layoutProject || typeof layoutProject !== 'object') return
    mergeArrayField(baseProject, layoutProject, 'assets')
    mergeArrayField(baseProject, layoutProject, 'styles')
    mergeArrayField(baseProject, layoutProject, 'symbols')
    toPageList(layoutProject).forEach((page) => {
      const pageId = getGrapesPageId(page)
      if (!pageId) return
      const existingIndex = baseProject.pages.findIndex(
        (item: Record<string, any>) => getGrapesPageId(item) === pageId,
      )
      const clonedPage = deepClone(page)
      if (existingIndex >= 0) {
        baseProject.pages.splice(existingIndex, 1, clonedPage)
      } else {
        baseProject.pages.push(clonedPage)
      }
    })
  })

  return baseProject
}

export const buildPageOnlyProjectData = (
  fullProjectData: ProjectData | null | undefined,
): ProjectData => {
  return extractLegacyLayoutBundle(fullProjectData).pageProjectData ?? {
    assets: [],
    styles: [],
    pages: [],
  }
}

export const buildLayoutPageProjectData = (
  fullProjectData: ProjectData | null | undefined,
  layoutPageId: string,
): ProjectData | null => {
  if (!fullProjectData || !layoutPageId) return null
  const projectData = deepClone(fullProjectData)
  const targetPage = toPageList(projectData).find((page) => getGrapesPageId(page) === layoutPageId)
  if (!targetPage || !getPageLayoutSlot(targetPage)) {
    return null
  }
  projectData.pages = [deepClone(targetPage)]
  delete projectData.wbLayoutSettings
  return projectData
}

export const buildSinglePageProjectData = (
  baseProjectData: ProjectData | null | undefined,
  pageData: Record<string, any>,
): ProjectData => {
  const projectData = baseProjectData ? deepClone(baseProjectData) : { assets: [], styles: [], pages: [] }
  projectData.pages = [deepClone(pageData)]
  delete projectData.wbLayoutSettings
  return projectData
}

export const buildLayoutProjectDataMap = (
  fullProjectData: ProjectData | null | undefined,
): Record<string, ProjectData> => {
  const result: Record<string, ProjectData> = {}
  toPageList(fullProjectData).forEach((page) => {
    const layoutPageId = getGrapesPageId(page)
    if (!layoutPageId || !getPageLayoutSlot(page)) return
    const projectData = buildLayoutPageProjectData(fullProjectData, layoutPageId)
    if (projectData) {
      result[layoutPageId] = projectData
    }
  })
  return result
}

export const groupLayoutPagesBySlot = (pages: Record<string, any>[]) => {
  const grouped: Record<LayoutSlotKey, Record<string, any>[]> = {
    header: [],
    footer: [],
  }
  pages.forEach((page) => {
    const slot = getPageLayoutSlot(page)
    if (!slot) return
    grouped[slot].push(deepClone(page))
  })
  return grouped
}
