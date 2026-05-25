import { getOptionalWebBuilderRuntime } from '@/runtime'

const getBaseUrl = (): string => {
  const auth = getOptionalWebBuilderRuntime()?.adapters.auth
  return auth?.apiBaseUrl || auth?.baseUrl || ''
}

const config = {
  get base_url() {
    return getBaseUrl()
  },
  result_code: 200 as number | string,
  default_headers: 'application/json',
  request_timeout: 300000
}

export { config }
