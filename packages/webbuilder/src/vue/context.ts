import type { Editor } from 'grapesjs'
import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import type {
  useAutosaveController,
  useDraftController,
  useLockController,
  usePublishController,
  useRevisionController,
} from './controllers/index.js'

import type {
  HostServices,
  HostUi,
  SettingsSource,
  WebBuilderCapabilitySnapshot,
} from '../core/index.js'

export interface WebBuilderControllers {
  draft: ReturnType<typeof useDraftController>
  autosave: ReturnType<typeof useAutosaveController>
  publish: ReturnType<typeof usePublishController>
  lock: ReturnType<typeof useLockController>
  revision: ReturnType<typeof useRevisionController>
}

export interface WebBuilderContext {
  readonly editor: Editor
  readonly capabilities: WebBuilderCapabilitySnapshot
  readonly hostServices: HostServices
  readonly settings: SettingsSource
  readonly ui: HostUi
  readonly controllers: WebBuilderControllers
}

export const WEB_BUILDER_CONTEXT: InjectionKey<WebBuilderContext> = Symbol('webbuilder-context')

export const useWebBuilderContext = (): WebBuilderContext => {
  const context = inject(WEB_BUILDER_CONTEXT)
  if (!context) {
    throw new Error('useWebBuilderContext must be used inside <WebBuilder>')
  }
  return context
}
