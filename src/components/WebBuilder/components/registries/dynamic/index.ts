import { registerAllCmsComponents } from './cms'
import { registerLoopGridComponent } from './loopGrid'
import type { ComponentRegistryExecutor } from '../types'

export const DYNAMIC_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'cmsComponents', register: registerAllCmsComponents },
  { id: 'loopGrid', register: registerLoopGridComponent },
]
