/*
 * Legacy b2b-admin WebBuilder inputs -> WebBuilderOptions mapping
 *
 * WebBuilderControllerProps:
 * - resourceId/resourceKey/resourceType/resourceScope/ownerType/ownerId
 *   -> resource: PageResourceIdentity. The legacy route-derived fallback is
 *      supplied by the host route adapter and normalized before passing options.
 *
 * Legacy browser adapters and capability context:
 * - createBrowserHostServices(...)
 *   -> hostServices, settings, ui, route.
 * - createBrowserCapabilityAdapter().resolve(pageResource)
 *   -> tenant and capabilities snapshots.
 *
 * Legacy GrapesJS initialization:
 * - container -> package-owned <Canvas>; not exposed to hosts.
 * - panels.defaults, height -> package defaults in resolveWebBuilderOptions.
 * - deviceManager.devices -> devices.
 * - canvas.styles/canvas.scripts -> canvas.styles/canvas.scripts.
 * - canvas.frameStyle -> grapesjs.canvas.frameStyle.
 * - dragMode/showOffsets/showOffsetsSelected/stylePrefix/selectorManager
 *   /assetManager/parser/plugins/storageManager -> grapesjs.
 * - storageManager.type:'' -> default grapesjs.storageManager:false plus
 *   storage for host persistence adapters.
 *
 * Legacy useEditorInit responsibilities:
 * - canvas frame reset -> canvas.frameReset.
 * - registerCommands -> commands.
 * - setupAssetManager, font manager, component style synchronization,
 *   project load/save/publish hooks, page settings, preview/template lifecycle
 *   -> TODO(P3): migrate from admin controller/plugins into package plugins
 *      and host services as those feature areas are lifted.
 *
 * Legacy config files:
 * - config/storage.ts -> storage.
 * - config/sharedResources.ts -> TODO(P3): plugin/resource participants.
 * - config/globalStyles.ts and config/wbStyleSectors.ts -> TODO(P4): theme
 *   tokens and style manager schema.
 */
import type { EditorConfig } from 'grapesjs'

import type { WebBuilderThemeTokens } from '../vue/theme.js'

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
import type { WebBuilderStorageOptions } from './storageAdapter.js'

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
  frameStyle?: string
  frameReset?: boolean
}

export type { WebBuilderThemeTokens } from '../vue/theme.js'

export interface WebBuilderBrandingOptions {
  /** Logo image URL rendered in the top-left dashboard button. */
  logo?: string
  /** Iconify icon name for the dashboard button (default `clarity:dashboard-line`). */
  homeIcon?: string
  /** Publish button label; overrides the i18n message. */
  publishLabel?: string
  /** Hide the top-left dashboard button entirely when `false`. */
  showDashboardButton?: boolean
}

export interface WebBuilderI18nOptions {
  locale?: string
  messages?: Record<string, unknown>
}

export interface WebBuilderAutosaveOptions {
  enabled?: boolean
  debounceMs?: number
  retryBackoffMs?: number
  autosaveChanges?: number
}

export interface WebBuilderSessionOptions {
  getSessionKey: () => string
}

export interface WebBuilderOptions {
  grapesjs?: Partial<EditorConfig>
  plugins?: WebBuilderFeaturePlugin[]
  devices?: WebBuilderDeviceOption[]
  canvas?: WebBuilderCanvasOptions
  autosave?: WebBuilderAutosaveOptions
  commands?: WebBuilderCommandContext
  hostServices?: HostServices
  storage?: WebBuilderStorageOptions
  session?: WebBuilderSessionOptions
  settings?: SettingsSource
  resource?: PageResourceIdentity
  tenant?: TenantContext
  capabilities?: {
    entitlements?: StaticEntitlementMap
    superAdminRoles?: readonly string[]
  }
  theme?: Partial<WebBuilderThemeTokens>
  branding?: WebBuilderBrandingOptions
  i18n?: WebBuilderI18nOptions
  ui?: HostUi
  route?: RouteAdapter
}

export interface ResolvedWebBuilderOptions extends WebBuilderOptions {
  grapesjs: Partial<EditorConfig>
  plugins: WebBuilderFeaturePlugin[]
  devices: WebBuilderDeviceOption[]
  canvas: WebBuilderCanvasOptions
  autosave?: WebBuilderAutosaveOptions
  commands: WebBuilderCommandContext
  hostServices: HostServices
  storage: WebBuilderOptions['storage']
  session: WebBuilderOptions['session']
  settings: SettingsSource
  resource: PageResourceIdentity
  tenant: TenantContext
  capabilities: WebBuilderOptions['capabilities'] & {
    snapshot: WebBuilderCapabilitySnapshot
    capabilityIds: Set<string>
  }
  theme: Partial<WebBuilderThemeTokens>
  branding: WebBuilderBrandingOptions
  i18n: WebBuilderI18nOptions & { messages: Record<string, unknown> }
  ui: HostUi
  route: RouteAdapter
}

export const DEFAULT_WEB_BUILDER_DEVICES: WebBuilderDeviceOption[] = [
  { id: 'desktop', name: 'Desktop', width: '' },
  // { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
  { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
]

export const DEFAULT_WEB_BUILDER_CANVAS_FRAME_STYLE = `
     body{background:#ffffff;}
     body .tooto-selected{
        outline: 2px solid #2251ff !important;
    }
  `

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
      stylePrefix: 'tooto-',
      storageManager: false,
      panels: { defaults: [] },
      deviceManager: { devices },
      canvas: {
        styles: options.canvas?.styles,
        scripts: options.canvas?.scripts,
        frameStyle: options.canvas?.frameStyle ?? DEFAULT_WEB_BUILDER_CANVAS_FRAME_STYLE,
      },
      ...options.grapesjs,
    },
    plugins,
    devices,
    canvas: {
      frameReset: true,
      ...options.canvas,
    },
    commands: options.commands ?? {},
    hostServices: options.hostServices ?? {},
    storage: options.storage,
    session: options.session,
    settings: options.settings ?? createMemorySettingsSource(),
    resource,
    tenant,
    capabilities: {
      ...options.capabilities,
      snapshot: capabilitySnapshot,
      capabilityIds: capabilitySnapshot.capabilityIds,
    },
    theme: options.theme ?? {},
    branding: options.branding ?? {},
    i18n: {
      messages: {},
      ...options.i18n,
    },
    ui: options.ui ?? createDefaultUi(),
    route: options.route ?? createDefaultRoute(),
  }
}
