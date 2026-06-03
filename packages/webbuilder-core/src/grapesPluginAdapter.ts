import type { Editor, PluginCleanupHandler, PluginDescriptor } from 'grapesjs'
import type {
  WebBuilderFeaturePlugin,
  WebBuilderPluginCleanup,
  WebBuilderPluginContext,
} from './featurePlugin.js'

const runCleanups = (cleanups: WebBuilderPluginCleanup[]) => {
  cleanups
    .slice()
    .reverse()
    .forEach((cleanup) => cleanup())
}

export function createGrapesPluginDescriptor(
  feature: WebBuilderFeaturePlugin,
  contextFactory: (editor: Editor) => WebBuilderPluginContext
): PluginDescriptor {
  return {
    id: feature.id,
    plugin(editor) {
      const context = contextFactory(editor)
      const webBuilderCleanups: WebBuilderPluginCleanup[] = []

      context.registerCleanup = (cleanup) => {
        webBuilderCleanups.push(cleanup)
      }

      try {
        const directCleanup = feature.activateEditor?.(context)
        if (directCleanup) {
          webBuilderCleanups.push(directCleanup)
        }
      } catch (error) {
        runCleanups(webBuilderCleanups)
        throw error
      }

      let cleaned = false
      const cleanupHandler: PluginCleanupHandler = ({ cleanup }) => {
        if (cleaned) return
        cleaned = true
        runCleanups(webBuilderCleanups)
        cleanup()
      }

      return cleanupHandler
    },
  }
}
