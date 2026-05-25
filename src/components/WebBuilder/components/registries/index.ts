import { DYNAMIC_REGISTRIES } from './dynamic'
import { INTERACTIVE_REGISTRIES } from './interactive'
import { LAYOUT_REGISTRIES } from './layout'
import { MEDIA_REGISTRIES } from './media'
import { NAVIGATION_REGISTRIES } from './navigation'
import { REGISTRY_MANIFEST } from './registryManifest'
import { SECTION_REGISTRIES } from './section'
import { TRAIT_REGISTRIES } from './traits'
import { TYPOGRAPHY_REGISTRIES } from './typography'
import type { ComponentRegistryExecutor } from './types'

const GROUPED_REGISTRIES: ComponentRegistryExecutor[] = [
  ...TRAIT_REGISTRIES,
  ...LAYOUT_REGISTRIES,
  ...TYPOGRAPHY_REGISTRIES,
  ...MEDIA_REGISTRIES,
  ...INTERACTIVE_REGISTRIES,
  ...SECTION_REGISTRIES,
  ...DYNAMIC_REGISTRIES,
  ...NAVIGATION_REGISTRIES,
]

const createRegistryMap = () => {
  const manifestIds = new Set(REGISTRY_MANIFEST.map(entry => entry.id))
  const registries = new Map<string, ComponentRegistryExecutor>()

  for (const registry of GROUPED_REGISTRIES) {
    if (!manifestIds.has(registry.id)) {
      throw new Error(`[WebBuilder] Unknown registry executor ${registry.id}`)
    }
    if (registries.has(registry.id)) {
      throw new Error(`[WebBuilder] Duplicate registry executor ${registry.id}`)
    }
    registries.set(registry.id, registry)
  }

  return registries
}

const REGISTRIES_BY_ID = createRegistryMap()

export const COMPONENT_REGISTRIES: ComponentRegistryExecutor[] = REGISTRY_MANIFEST.map((entry) => {
  const registry = REGISTRIES_BY_ID.get(entry.id)
  if (!registry) {
    throw new Error(`[WebBuilder] Missing registry executor for ${entry.id}`)
  }
  return registry
})

export type { ComponentRegistryExecutor }
