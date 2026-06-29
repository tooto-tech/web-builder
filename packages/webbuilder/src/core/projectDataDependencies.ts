const BUILT_IN_COMPONENT_TYPES = new Set(['wrapper', 'textnode', 'default'])

const DATA_GJS_TYPE_PATTERN =
  /\bdata-gjs-type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi

const addComponentType = (types: Set<string>, value: unknown) => {
  if (typeof value !== 'string') return

  const type = value.trim()
  if (!type || BUILT_IN_COMPONENT_TYPES.has(type)) return

  types.add(type)
}

const collectHtmlComponentTypes = (types: Set<string>, html: string) => {
  for (const match of html.matchAll(DATA_GJS_TYPE_PATTERN)) {
    addComponentType(types, match[1] ?? match[2] ?? match[3])
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const scanComponentValue = (types: Set<string>, value: unknown) => {
  if (typeof value === 'string') {
    collectHtmlComponentTypes(types, value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => scanComponentValue(types, item))
    return
  }

  if (!isRecord(value)) return

  addComponentType(types, value.type)
  scanComponentValue(types, value.component)
  scanComponentValue(types, value.components)

  if (
    value.type === undefined &&
    value.component === undefined &&
    value.components === undefined
  ) {
    Object.values(value).forEach((item) => scanComponentValue(types, item))
  }
}

const scanPages = (types: Set<string>, pages: unknown) => {
  if (!Array.isArray(pages)) return

  pages.forEach((page) => {
    if (!isRecord(page)) return

    scanComponentValue(types, page.component)

    if (!Array.isArray(page.frames)) return
    page.frames.forEach((frame) => {
      if (isRecord(frame)) {
        scanComponentValue(types, frame.component)
      }
    })
  })
}

export const collectProjectDataComponentTypes = (
  projectData: unknown
): Set<string> => {
  const types = new Set<string>()
  if (!isRecord(projectData)) return types

  scanPages(types, projectData.pages)
  scanComponentValue(types, projectData.components)
  scanComponentValue(types, projectData.symbols)

  return types
}
