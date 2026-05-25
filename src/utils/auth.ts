import { callAuthAdapter, getOptionalAdapterMethod } from '@/runtime'

export type LoginFormType = {
  tenantName: string
  username: string
  password: string
  rememberMe: boolean
}

const optionalAuthCall = <T = unknown>(method: string, ...args: any[]): T | undefined => {
  const adapterMethod = getOptionalAdapterMethod(['auth'], method)
  return adapterMethod ? (adapterMethod(...args) as T) : undefined
}

export const getAccessToken = () => callAuthAdapter<string | undefined>('getAccessToken')
export const getRefreshToken = () => optionalAuthCall<string>('getRefreshToken')
export const setToken = (token: unknown) => optionalAuthCall('setToken', token)
export const removeToken = () => optionalAuthCall('removeToken')
export const formatToken = (token: string): string => (token ? `Bearer ${token}` : '')
export const getLoginForm = () => optionalAuthCall<LoginFormType>('getLoginForm')
export const setLoginForm = (loginForm: LoginFormType) => optionalAuthCall('setLoginForm', loginForm)
export const removeLoginForm = () => optionalAuthCall('removeLoginForm')
export const getTenantId = () => optionalAuthCall<number | string>('getTenantId')
export const setTenantId = (tenantId: number) => optionalAuthCall('setTenantId', tenantId)
export const getVisitTenantId = () => optionalAuthCall<number | string>('getVisitTenantId')
export const setVisitTenantId = (visitTenantId: number) =>
  optionalAuthCall('setVisitTenantId', visitTenantId)
export const getEffectiveTenantId = () => {
  const explicit = optionalAuthCall<number | string>('getEffectiveTenantId')
  return explicit ?? getVisitTenantId() ?? getTenantId()
}
