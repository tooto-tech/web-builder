import { registerContainerComponent } from './container/index.js'
import { registerDividerComponent } from './divider/index.js'
import { registerGridComponent } from './grid/index.js'
import { registerLayoutBase } from './layoutBase/index.js'
import { registerSectionComponent } from './section/index.js'
import { registerSectionGridBlockComponent } from './sectionGridBlock/index.js'
import { registerSpacerComponent } from './spacer/index.js'
import type { ComponentRegistryExecutor } from '../types.js'

export const LAYOUT_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'layoutBase', register: registerLayoutBase },
  { id: 'container', register: registerContainerComponent },
  { id: 'section', register: registerSectionComponent },
  { id: 'grid', register: registerGridComponent },
  { id: 'sectionGridBlock', register: registerSectionGridBlockComponent },
  { id: 'spacer', register: registerSpacerComponent },
  { id: 'divider', register: registerDividerComponent },
]
