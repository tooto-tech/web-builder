type NullablePrimitive = string | number | null | undefined

const normalizeString = (value: NullablePrimitive): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

const normalizeNumber = (value: NullablePrimitive): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export interface PageResourceIdentity {
  resourceId?: number
  resourceKey?: string
  resourceType?: string
  resourceScope?: string
  ownerType?: string
  ownerId?: number
}

type PageResourceIdentityInput =
  | PageResourceIdentity
  | (Partial<PageResourceIdentity> & Record<string, unknown>)

export const normalizePageResourceIdentity = (
  identity?: PageResourceIdentityInput | null
): PageResourceIdentity => {
  const resourceType = normalizeString(identity?.resourceType)
  const ownerId = normalizeNumber(identity?.ownerId)
  const ownerType =
    normalizeString(identity?.ownerType) || (ownerId !== undefined ? resourceType : undefined)
  const resourceId = normalizeNumber(identity?.resourceId)
  const resourceKey = normalizeString(identity?.resourceKey)
  const resourceScope =
    normalizeString(identity?.resourceScope) ||
    (ownerType && ownerId !== undefined ? 'OWNED' : undefined)

  return {
    resourceId,
    resourceKey,
    resourceType,
    resourceScope,
    ownerType,
    ownerId
  }
}

export const hasPageResourceLocator = (identity?: PageResourceIdentity | null): boolean => {
  const normalized = normalizePageResourceIdentity(identity)
  return Boolean(
    normalized.resourceId !== undefined ||
      normalized.resourceKey ||
      (normalized.ownerType && normalized.ownerId !== undefined)
  )
}

export const buildPageResourceParams = (
  identity?: PageResourceIdentityInput | null
): Record<string, string | number> => {
  const normalized = normalizePageResourceIdentity(identity)
  const params: Record<string, string | number> = {}

  if (normalized.resourceId !== undefined) params.resourceId = normalized.resourceId
  if (normalized.resourceKey) params.resourceKey = normalized.resourceKey
  if (normalized.resourceType) params.resourceType = normalized.resourceType
  if (normalized.resourceScope) params.resourceScope = normalized.resourceScope
  if (normalized.ownerType) params.ownerType = normalized.ownerType
  if (normalized.ownerId !== undefined) params.ownerId = normalized.ownerId

  return params
}

export const buildPageResourcePayload = <T extends PageResourceIdentity>(
  data: T
): T & Record<string, unknown> => {
  const normalized = normalizePageResourceIdentity(data)
  const payload = { ...data } as T & Record<string, unknown>

  if (normalized.resourceId !== undefined) payload.resourceId = normalized.resourceId
  if (normalized.resourceKey) payload.resourceKey = normalized.resourceKey
  if (normalized.resourceType) payload.resourceType = normalized.resourceType
  if (normalized.resourceScope) payload.resourceScope = normalized.resourceScope
  if (normalized.ownerType) payload.ownerType = normalized.ownerType
  if (normalized.ownerId !== undefined) payload.ownerId = normalized.ownerId

  return payload
}
