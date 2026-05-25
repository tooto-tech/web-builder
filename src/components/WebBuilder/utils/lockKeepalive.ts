import {
  buildPageResourceParams,
  type PageResourceIdentity,
} from '@/api/content/page'
import { config as axiosConfig } from '@/config/axios/config'
import { getAccessToken, getTenantId, getVisitTenantId } from '@/utils/auth'

export const buildReleaseLockUrl = (resource: PageResourceIdentity, sessionKey: string) => {
  const baseUrl = `${axiosConfig.base_url || ''}`.trim()
  const absoluteBase = /^https?:\/\//.test(baseUrl)
    ? baseUrl
    : `${window.location.origin}${baseUrl.startsWith('/') ? '' : '/'}${baseUrl}`
  const normalizedBase = absoluteBase.endsWith('/') ? absoluteBase : `${absoluteBase}/`
  const url = new URL('cms/page/lock/release', normalizedBase)
  const params = buildPageResourceParams(resource)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })
  url.searchParams.set('sessionKey', sessionKey)
  return url.toString()
}

export const releaseLockKeepalive = (resource: PageResourceIdentity, sessionKey: string) => {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return false
  }

  try {
    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (import.meta.env.VITE_APP_TENANT_ENABLE === 'true') {
      const tenantId = getTenantId()
      if (tenantId) {
        headers['tenant-id'] = tenantId
      }
      if (token) {
        const visitTenantId = getVisitTenantId()
        if (visitTenantId) {
          headers['visit-tenant-id'] = visitTenantId
        }
      }
    }

    fetch(buildReleaseLockUrl(resource, sessionKey), {
      method: 'DELETE',
      headers,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {
      // noop
    })
    return true
  } catch {
    return false
  }
}
