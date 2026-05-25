import type { Editor } from 'grapesjs'
import { COMPONENT_REGISTRIES } from '../components/registries'
import {
  REGISTRY_MANIFEST,
  assertUniqueRegistryTypes,
  type RegistryManifestEntry,
} from '../components/registries/registryManifest'
import {
  clearRegistrationDiagnostics,
  createBlockingRegistrationError,
  recordRegistrationFailure,
} from './useRegistrationDiagnostics'

function safeRegister(entry: RegistryManifestEntry, fn: () => void) {
  try {
    fn()
  } catch (err) {
    const diagnostic = recordRegistrationFailure(entry, err)
    if (entry.failurePolicy === 'core') {
      throw createBlockingRegistrationError(diagnostic)
    }
    console.warn(diagnostic.message, err)
  }
}

/**
 * 统一注册所有自定义组件类型和 trait 类型。
 * 顺序和失败策略由 registryManifest 管理。
 */
export function registerAllComponents(editor: Editor) {
  clearRegistrationDiagnostics()
  assertUniqueRegistryTypes()

  COMPONENT_REGISTRIES.forEach((registry, index) => {
    const entry = REGISTRY_MANIFEST[index]
    if (!entry || entry.id !== registry.id) {
      throw new Error(`[WebBuilder] Registry manifest mismatch at index ${index}`)
    }
    safeRegister(entry, () => registry.register(editor))
  })
}
