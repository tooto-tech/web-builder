import type { EditorConfig } from 'grapesjs'

import {
  createWebBuilderCapabilitySnapshot,
  type StaticEntitlementMap,
  type WebBuilderCapabilitySnapshot,
} from './capabilityAdapter.js'
import type { WebBuilderCommandContext } from './commandContext.js'
import type {
  HostServices,
  HostUi,
  RouteAdapter,
  SettingsSource,
} from './hostServices.js'
import { createMemorySettingsSource } from './hostServices.js'
import type {
  PageResourceIdentity,
  TenantContext,
  WebBuilderFeaturePlugin,
} from './featurePlugin.js'

export interface WebBuilderDeviceOption {
  id: string
  name: string
  width: string
  widthMedia?: string
}

export interface WebBuilderCanvasOptions {
  initialComponents?: string
  styles?: string[]
  scripts?: string[]
  frameReset?: boolean
  bottomDropZone?: boolean
}

export interface WebBuilderOptions {
  grapesjs?: Partial<EditorConfig>
  plugins?: WebBuilderFeaturePlugin[]
  devices?: WebBuilderDeviceOption[]
  canvas?: WebBuilderCanvasOptions
  commands?: WebBuilderCommandContext
  hostServices?: HostServices
  settings?: SettingsSource
  resource?: PageResourceIdentity
  tenant?: TenantContext
  capabilities?: {
    entitlements?: StaticEntitlementMap
    superAdminRoles?: readonly string[]
  }
  ui?: HostUi
  route?: RouteAdapter
}

export interface ResolvedWebBuilderOptions extends WebBuilderOptions {
  grapesjs: Partial<EditorConfig>
  plugins: WebBuilderFeaturePlugin[]
  devices: WebBuilderDeviceOption[]
  canvas: WebBuilderCanvasOptions
  commands: WebBuilderCommandContext
  hostServices: HostServices
  settings: SettingsSource
  resource: PageResourceIdentity
  tenant: TenantContext
  capabilities: WebBuilderOptions['capabilities'] & {
    snapshot: WebBuilderCapabilitySnapshot
    capabilityIds: Set<string>
  }
  ui: HostUi
  route: RouteAdapter
}

export const DEFAULT_WEB_BUILDER_DEVICES: WebBuilderDeviceOption[] = [
  { id: 'desktop', name: 'Desktop', width: '' },
  { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
  { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
]

const createDefaultTenant = (): TenantContext => ({
  roles: [],
  permissions: new Set<string>(),
})

const createDefaultUi = (): HostUi => ({
  confirm: async () => false,
  message: {
    success: () => undefined,
    warning: () => undefined,
    info: () => undefined,
    error: () => undefined,
  },
})

const createDefaultRoute = (): RouteAdapter => ({
  getQuery: () => ({}),
  replaceQuery: () => undefined,
  onBeforeLeave: () => () => undefined,
})

const assertUniquePluginIds = (plugins: WebBuilderFeaturePlugin[]) => {
  const seen = new Set<string>()

  for (const plugin of plugins) {
    if (seen.has(plugin.id)) {
      throw new Error(`Duplicate WebBuilder feature plugin id "${plugin.id}"`)
    }
    seen.add(plugin.id)
  }
}

export const resolveWebBuilderOptions = (
  options: WebBuilderOptions = {},
): ResolvedWebBuilderOptions => {
  const plugins = options.plugins ?? []
  assertUniquePluginIds(plugins)

  const devices = options.devices ?? DEFAULT_WEB_BUILDER_DEVICES
  const tenant = options.tenant ?? createDefaultTenant()
  const resource = options.resource ?? {}
  const capabilitySnapshot = createWebBuilderCapabilitySnapshot({
    tenant,
    resource,
    entitlements: options.capabilities?.entitlements,
    superAdminRoles: options.capabilities?.superAdminRoles,
  })

  return {
    ...options,
    grapesjs: {
      height: '100%',
      storageManager: false,
      panels: { defaults: [] },
      deviceManager: { devices },
      canvas: {
        styles: options.canvas?.styles,
        scripts: options.canvas?.scripts,
      },
      ...options.grapesjs,
    },
    plugins,
    devices,
    canvas: {
      frameReset: true,
      bottomDropZone: true,
      ...options.canvas,
    },
    commands: options.commands ?? {},
    hostServices: options.hostServices ?? {},
    settings: options.settings ?? createMemorySettingsSource(),
    resource,
    tenant,
    capabilities: {
      ...options.capabilities,
      snapshot: capabilitySnapshot,
      capabilityIds: capabilitySnapshot.capabilityIds,
    },
    ui: options.ui ?? createDefaultUi(),
    route: options.route ?? createDefaultRoute(),
  }
}
