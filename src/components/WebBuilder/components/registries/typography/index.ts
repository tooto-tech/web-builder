import { registerHeadingComponent } from './heading'
import { registerTextEditorComponent } from './textEditor'
import type { ComponentRegistryExecutor } from '../types'

export const TYPOGRAPHY_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'heading', register: registerHeadingComponent },
  { id: 'textEditor', register: registerTextEditorComponent },
]
