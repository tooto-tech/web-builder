import { registerHeadingComponent } from './heading/index.js'
import { registerTextEditorComponent } from './textEditor/index.js'
import type { ComponentRegistryExecutor } from '../types.js'

export const TYPOGRAPHY_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'heading', register: registerHeadingComponent },
  { id: 'textEditor', register: registerTextEditorComponent },
]
