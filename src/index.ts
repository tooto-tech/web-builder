import WebBuilder from './components/WebBuilder/index.vue'
import './components/WebBuilder/assets/vue-grapes.css'
import './components/WebBuilder/assets/webbuilder-shell.scss'

export { WebBuilder }
export default WebBuilder

export type { WebBuilderControllerProps as WebBuilderProps } from './components/WebBuilder/composables/useWebBuilderController'
export * from './runtime'
export * from './components/WebBuilder/config/layoutSharedResources'
export * from './components/WebBuilder/config/templateSharedResources'
export {
  WEB_BUILDER_STORAGE_MODE,
  getWebBuilderStorageMode,
  isBackendStorageMode,
  isIndexedDbStorageMode
} from './components/WebBuilder/config/storage'
export * from './components/WebBuilder/utils/layoutSettings'
export * from './components/WebBuilder/utils/pageResourceIdentity'
export {
  buildPageResourceParams,
  buildPageResourcePayload,
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  type PageResourceIdentity
} from './api/content/page'
