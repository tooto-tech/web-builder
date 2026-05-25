import { callUploadAdapter, getOptionalAdapterMethod, getOptionalWebBuilderRuntime } from '@/runtime'

export const IMAGE_UPLOAD_CACHE_CONTROL = 'public, max-age=31536000, immutable'

export const getUploadUrl = (): string => {
  const method = getOptionalAdapterMethod(['upload'], 'getUploadUrl')
  if (method) return `${method()}`

  const auth = getOptionalWebBuilderRuntime()?.adapters.auth
  const baseUrl = auth?.apiBaseUrl || auth?.baseUrl || ''
  return baseUrl ? `${baseUrl.replace(/\/$/, '')}/infra/file/upload` : '/infra/file/upload'
}

export const useUpload = (directory?: string) => {
  const method = getOptionalAdapterMethod(['upload'], 'useUpload')
  if (method) return method(directory)

  return {
    uploadUrl: getUploadUrl(),
    httpRequest: (options: unknown) => callUploadAdapter('httpRequest', options, directory)
  }
}
