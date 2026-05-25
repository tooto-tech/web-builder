import type { EditorRuntimeAdapter } from '../types/editor'

export type CmsPreviewRefreshHandler = (delay: number) => void
export type TemplatePreviewRefreshHandler = () => void

export interface WebBuilderEditorRuntime {
  readonly isManualLoad: boolean
  startManualLoad: () => () => void
  endManualLoad: () => void
  runManualLoad: <T>(operation: () => T | Promise<T>) => Promise<T>
  onCmsPreviewRefresh: (handler: CmsPreviewRefreshHandler) => () => void
  requestCmsPreviewRefresh: (delay?: number) => void
  onTemplatePreviewRefresh: (handler: TemplatePreviewRefreshHandler) => () => void
  requestTemplatePreviewRefresh: () => void
  setPreviewLanguage: (language: string) => void
  getPreviewLanguage: () => string
  getCache: <T>(key: string) => T | undefined
  setCache: <T>(key: string, value: T | undefined) => void
  deleteCache: (key: string) => void
  cleanup: () => void
}

const runtimes = new WeakMap<object, WebBuilderEditorRuntime>()

type RuntimeEditorAdapter = Partial<EditorRuntimeAdapter> & object

function createRuntime(_editor: RuntimeEditorAdapter): WebBuilderEditorRuntime {
  let manualLoadDepth = 0
  let previewLanguage = ''
  const cache = new Map<string, unknown>()
  const cmsPreviewHandlers = new Set<CmsPreviewRefreshHandler>()
  const templatePreviewHandlers = new Set<TemplatePreviewRefreshHandler>()

  const endManualLoad = () => {
    manualLoadDepth = Math.max(0, manualLoadDepth - 1)
  }

  const runtime: WebBuilderEditorRuntime = {
    get isManualLoad() {
      return manualLoadDepth > 0
    },
    startManualLoad() {
      manualLoadDepth += 1
      let ended = false
      return () => {
        if (ended) return
        ended = true
        endManualLoad()
      }
    },
    endManualLoad,
    async runManualLoad<T>(operation: () => T | Promise<T>): Promise<T> {
      const finish = runtime.startManualLoad()
      try {
        return await operation()
      } finally {
        finish()
      }
    },
    onCmsPreviewRefresh(handler: CmsPreviewRefreshHandler) {
      cmsPreviewHandlers.add(handler)
      return () => {
        cmsPreviewHandlers.delete(handler)
      }
    },
    requestCmsPreviewRefresh(delay = 450) {
      cmsPreviewHandlers.forEach((handler) => handler(delay))
    },
    onTemplatePreviewRefresh(handler: TemplatePreviewRefreshHandler) {
      templatePreviewHandlers.add(handler)
      return () => {
        templatePreviewHandlers.delete(handler)
      }
    },
    requestTemplatePreviewRefresh() {
      templatePreviewHandlers.forEach((handler) => handler())
    },
    setPreviewLanguage(language: string) {
      previewLanguage = language.trim()
    },
    getPreviewLanguage() {
      return previewLanguage
    },
    getCache<T>(key: string) {
      return cache.get(key) as T | undefined
    },
    setCache<T>(key: string, value: T | undefined) {
      if (value === undefined) {
        cache.delete(key)
        return
      }
      cache.set(key, value)
    },
    deleteCache(key: string) {
      cache.delete(key)
    },
    cleanup() {
      manualLoadDepth = 0
      previewLanguage = ''
      cache.clear()
      cmsPreviewHandlers.clear()
      templatePreviewHandlers.clear()
    },
  }

  return runtime
}

export function getEditorRuntime(editor: RuntimeEditorAdapter): WebBuilderEditorRuntime {
  const existing = runtimes.get(editor)
  if (existing) return existing

  const runtime = createRuntime(editor)
  runtimes.set(editor, runtime)
  return runtime
}

export default getEditorRuntime
