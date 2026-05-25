import { registerContainerComponent } from './container'
import { registerDividerComponent } from './divider'
import { registerGridComponent } from './grid'
import { registerLayoutBase } from './layoutBase'
import { registerSectionComponent } from './section'
import { registerSectionGridBlockComponent } from './sectionGridBlock'
import { registerSpacerComponent } from './spacer'
import type { ComponentRegistryExecutor } from '../types'

export const LAYOUT_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'layoutBase', register: registerLayoutBase },
  { id: 'container', register: registerContainerComponent },
  { id: 'section', register: registerSectionComponent },
  { id: 'grid', register: registerGridComponent },
  { id: 'sectionGridBlock', register: registerSectionGridBlockComponent },
  { id: 'spacer', register: registerSpacerComponent },
  { id: 'divider', register: registerDividerComponent },
]
