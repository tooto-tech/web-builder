import type { PageResourceIdentity, TenantContext } from './featurePlugin.js'

export const ALL_SYSTEM_PERMISSION = '*:*:*'
export const WEBBUILDER_ALL_CAPABILITY = 'webbuilder:*'
export const WEBBUILDER_INSERT_ALL_CAPABILITY = 'webbuilder:insert:*'
export const WEBBUILDER_INSERT_CAPABILITY_PREFIX = 'webbuilder:insert:'

export type StaticEntitlementMap = Record<string, readonly string[]>

export interface WebBuilderCapabilitySnapshot {
  resource: PageResourceIdentity
  tenant: TenantContext
  capabilityIds: Set<string>
}

export interface CreateWebBuilderCapabilitySnapshotOptions {
  tenant: TenantContext
  resource?: PageResourceIdentity
  usedComponentTypes?: Set<string>
  entitlements?: StaticEntitlementMap
  superAdminRoles?: readonly string[]
}

export interface WebBuilderCapabilityAdapter {
  resolve: (
    resource?: PageResourceIdentity,
    options?: { usedComponentTypes?: Set<string> }
  ) => WebBuilderCapabilitySnapshot
  canInsertComponentType: (
    type: string,
    snapshot?: WebBuilderCapabilitySnapshot
  ) => boolean
}

export const createInsertCapabilityId = (type: string) =>
  `${WEBBUILDER_INSERT_CAPABILITY_PREFIX}${`${type}`.trim()}`

const normalizeCapabilityId = (value: unknown) => `${value ?? ''}`.trim()

const addCapability = (capabilityIds: Set<string>, value: unknown) => {
  const capabilityId = normalizeCapabilityId(value)
  if (capabilityId) {
    capabilityIds.add(capabilityId)
  }
}

const getTenantEntitlements = (
  tenantId: TenantContext['tenantId'],
  entitlements?: StaticEntitlementMap
) => {
  if (tenantId === undefined || tenantId === null || !entitlements) return []
  return entitlements[String(tenantId)] ?? []
}

export const createWebBuilderCapabilitySnapshot = (
  options: CreateWebBuilderCapabilitySnapshotOptions
): WebBuilderCapabilitySnapshot => {
  const capabilityIds = new Set<string>()
  const permissions = options.tenant.permissions ?? new Set<string>()
  const superAdminRoles = new Set(options.superAdminRoles ?? ['super_admin'])

  permissions.forEach((permission) => {
    if (permission === ALL_SYSTEM_PERMISSION) {
      capabilityIds.add(WEBBUILDER_ALL_CAPABILITY)
      capabilityIds.add(WEBBUILDER_INSERT_ALL_CAPABILITY)
      return
    }
    if (permission.startsWith('webbuilder:')) {
      capabilityIds.add(permission)
    }
  })

  if (options.tenant.roles.some(role => superAdminRoles.has(role))) {
    capabilityIds.add(WEBBUILDER_ALL_CAPABILITY)
    capabilityIds.add(WEBBUILDER_INSERT_ALL_CAPABILITY)
  }

  getTenantEntitlements(options.tenant.tenantId, options.entitlements).forEach(entitlement => {
    addCapability(capabilityIds, entitlement)
  })

  return {
    resource: options.resource ?? {},
    tenant: options.tenant,
    capabilityIds,
  }
}

export const canInsertComponentType = (
  snapshot: WebBuilderCapabilitySnapshot,
  type: string
) => {
  const componentType = `${type}`.trim()
  if (!componentType) return false

  return (
    snapshot.capabilityIds.has(WEBBUILDER_ALL_CAPABILITY) ||
    snapshot.capabilityIds.has(WEBBUILDER_INSERT_ALL_CAPABILITY) ||
    snapshot.capabilityIds.has(createInsertCapabilityId(componentType))
  )
}

export const hasWebBuilderCapability = (
  capabilityIds: Set<string>,
  capabilityId: string
) => capabilityIds.has(capabilityId) || capabilityIds.has(WEBBUILDER_ALL_CAPABILITY)
