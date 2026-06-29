import type { Editor } from 'grapesjs'
import type { WebBuilderFeaturePlugin } from '@toototech/webbuilder/core'
import { registerInquiryFormComponent } from './registries/interactive/inquiryForm/index.js'
import { BASIC_INTERACTIVE_REGISTRIES } from './registries/interactive/index.js'
import { registerKlaviyoSubscribeComponent } from './registries/interactive/klaviyoSubscribe/index.js'
import { LAYOUT_REGISTRIES } from './registries/layout/index.js'
import { BASIC_MEDIA_REGISTRIES } from './registries/media/index.js'
import { BASIC_NAVIGATION_REGISTRIES } from './registries/navigation/index.js'
import { BASIC_SECTION_REGISTRIES } from './registries/section/index.js'
import { TYPOGRAPHY_REGISTRIES } from './registries/typography/index.js'
import type { ComponentRegistryExecutor } from './registries/types.js'
import {
  assertUniqueBasicRegistryTypes,
  BASIC_REGISTRY_MANIFEST,
  getBasicRegistryTypes,
  type BasicRegistryManifestEntry,
} from './registryManifest.js'

export const BASIC_COMPONENTS_PLUGIN_ID = 'components-basic'

export interface BasicRegistryFailureDiagnostic {
  registryId: string
  message: string
  error: unknown
}

export interface ComponentsBasicPluginOptions {
  alwaysEnabled?: boolean
  includeOptional?: boolean
  throwOnOptionalFailure?: boolean
  registries?: readonly ComponentRegistryExecutor[]
  manifest?: readonly BasicRegistryManifestEntry[]
  onRegistrationFailure?: (diagnostic: BasicRegistryFailureDiagnostic) => void
}

export const BASIC_COMPONENT_REGISTRIES: ComponentRegistryExecutor[] = [
  ...LAYOUT_REGISTRIES,
  ...TYPOGRAPHY_REGISTRIES,
  ...BASIC_MEDIA_REGISTRIES,
  ...BASIC_INTERACTIVE_REGISTRIES,
  { id: 'inquiryForm', register: registerInquiryFormComponent },
  { id: 'klaviyoSubscribe', register: registerKlaviyoSubscribeComponent },
  ...BASIC_SECTION_REGISTRIES,
  ...BASIC_NAVIGATION_REGISTRIES,
]

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Registration failed')
  }
  return 'Registration failed'
}

const createRegistryMap = (
  registries: readonly ComponentRegistryExecutor[],
  manifest: readonly BasicRegistryManifestEntry[],
) => {
  const manifestIds = new Set(manifest.map(entry => entry.id))
  const registriesById = new Map<string, ComponentRegistryExecutor>()

  for (const registry of registries) {
    if (!manifestIds.has(registry.id)) {
      throw new Error(`[WebBuilder Basic] Unknown registry executor ${registry.id}`)
    }
    if (registriesById.has(registry.id)) {
      throw new Error(`[WebBuilder Basic] Duplicate registry executor ${registry.id}`)
    }
    registriesById.set(registry.id, registry)
  }

  return registriesById
}

const getOrderedRegistries = (
  registries: readonly ComponentRegistryExecutor[],
  manifest: readonly BasicRegistryManifestEntry[],
) => {
  const registriesById = createRegistryMap(registries, manifest)

  return manifest.map((entry) => {
    const registry = registriesById.get(entry.id)
    if (!registry) {
      throw new Error(`[WebBuilder Basic] Missing registry executor for ${entry.id}`)
    }
    return { entry, registry }
  })
}

const registerBasicComponents = (
  editor: Editor,
  options: Required<Pick<ComponentsBasicPluginOptions, 'throwOnOptionalFailure'>> &
    Pick<ComponentsBasicPluginOptions, 'onRegistrationFailure'> & {
      registries: readonly ComponentRegistryExecutor[]
      manifest: readonly BasicRegistryManifestEntry[]
    },
) => {
  for (const { entry, registry } of getOrderedRegistries(options.registries, options.manifest)) {
    try {
      registry.register(editor)
    } catch (error) {
      const message = getErrorMessage(error)
      if (entry.failurePolicy === 'core' || options.throwOnOptionalFailure) {
        throw new Error(`[WebBuilder Basic] Failed to register ${entry.id}: ${message}`)
      }
      options.onRegistrationFailure?.({
        registryId: entry.id,
        message: `[WebBuilder Basic] Optional registry ${entry.id} failed: ${message}`,
        error,
      })
    }
  }
}

export const componentsBasic = (
  options: ComponentsBasicPluginOptions = {},
): WebBuilderFeaturePlugin => {
  const includeOptional = options.includeOptional ?? true
  const manifest = (options.manifest ?? BASIC_REGISTRY_MANIFEST)
    .filter(entry => includeOptional || entry.failurePolicy === 'core')
  const registries = options.registries ?? BASIC_COMPONENT_REGISTRIES

  assertUniqueBasicRegistryTypes(manifest)

  const componentTypes = getBasicRegistryTypes(manifest)

  return {
    id: BASIC_COMPONENTS_PLUGIN_ID,
    label: 'Basic Components',
    order: 10,
    alwaysEnabled: options.alwaysEnabled ?? true,
    loadComponentTypes: componentTypes,
    insertComponentTypes: componentTypes,
    activateEditor: ({ editor }) => {
      registerBasicComponents(editor, {
        registries,
        manifest,
        throwOnOptionalFailure: options.throwOnOptionalFailure ?? false,
        onRegistrationFailure: options.onRegistrationFailure,
      })
    },
  }
}
