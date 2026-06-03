import {
  WEB_BUILDER_PROJECT_PAINT_EVENT,
  type WebBuilderFeaturePlugin,
} from '@tooto-tech/webbuilder-core'
import { renderGlobalSettingsPublishedAssets } from './publisher.js'
import { injectGlobalSettingsIntoDocument } from './runtime/canvasInjection.js'

export const GLOBAL_SETTINGS_PLUGIN_ID = 'global-settings'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const getFrameDocument = (context: unknown): Document | null => {
  if (!isRecord(context)) return null
  const frame = isRecord(context.frame) ? context.frame : context
  const view = isRecord(frame.view) ? frame.view : null
  const element = isRecord(view?.el) ? view.el : null
  const contentDocument = element?.contentDocument

  if (contentDocument && typeof contentDocument === 'object') {
    return contentDocument as Document
  }

  const getDocument = view?.getDocument
  if (typeof getDocument === 'function') {
    return getDocument.call(view) as Document | null
  }

  return null
}

export const createGlobalSettingsPlugin = (): WebBuilderFeaturePlugin => ({
  id: GLOBAL_SETTINGS_PLUGIN_ID,
  label: 'Global Settings',
  order: 20,
  alwaysEnabled: true,
  publisher: {
    id: 'publisher:global-settings',
    order: 20,
    render: context =>
      context.globalSettings
        ? renderGlobalSettingsPublishedAssets(context.globalSettings)
        : null,
  },
  activateEditor(context) {
    let cleanupCanvasInjection: (() => void) | null = null

    const cleanupCurrentInjection = () => {
      cleanupCanvasInjection?.()
      cleanupCanvasInjection = null
    }

    const injectSnapshot = (eventData?: unknown) => {
      const snapshot = context.settings.getSnapshot()
      const doc =
        getFrameDocument(eventData) ??
        context.editor.Canvas?.getDocument?.() ??
        null

      cleanupCurrentInjection()
      if (snapshot && doc) {
        cleanupCanvasInjection = injectGlobalSettingsIntoDocument(doc, snapshot)
      }
    }

    const handleLoad = () => injectSnapshot()
    const handleFrameLoad = (eventData?: unknown) => injectSnapshot(eventData)
    const handleProjectPaint = () => injectSnapshot()
    const unsubscribe = context.settings.subscribe(() => injectSnapshot())

    context.editor.on('load', handleLoad)
    context.editor.on('canvas:frame:load', handleFrameLoad)
    context.editor.on(WEB_BUILDER_PROJECT_PAINT_EVENT, handleProjectPaint)
    injectSnapshot()

    return () => {
      context.editor.off('load', handleLoad)
      context.editor.off('canvas:frame:load', handleFrameLoad)
      context.editor.off(WEB_BUILDER_PROJECT_PAINT_EVENT, handleProjectPaint)
      unsubscribe()
      cleanupCurrentInjection()
    }
  },
  async beforeProjectLoad(context) {
    if (context.settings.getSnapshot()) return

    const service = context.hostServices.globalSettings
    if (!service) return

    const snapshot = await service.loadDraft({
      resource: context.resource,
      tenantId: context.tenant.tenantId,
    })
    context.settings.hydrate(snapshot)
  },
})
