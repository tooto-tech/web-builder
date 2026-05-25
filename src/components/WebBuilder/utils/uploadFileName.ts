const SHOPIFY_RESERVED_IMAGE_SUFFIXES = new Set([
  'pico',
  'icon',
  'thumb',
  'testing',
  'small',
  'compact',
  'medium',
  'large',
  'grande',
])

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

const getExtension = (file: File) => {
  const name = file.name || ''
  const dotIndex = name.lastIndexOf('.')
  const rawExtension = dotIndex > 0 ? name.slice(dotIndex + 1) : MIME_EXTENSION_MAP[file.type]
  return `${rawExtension || 'jpg'}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'jpg'
}

const getBaseName = (file: File) => {
  const name = file.name || ''
  const dotIndex = name.lastIndexOf('.')
  return dotIndex > 0 ? name.slice(0, dotIndex) : name
}

const toShopifyStyleHandle = (value: string) => {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase()
}

const avoidReservedShopifySuffix = (baseName: string) => {
  const lastToken = baseName.split('-').filter(Boolean).pop()
  return lastToken && SHOPIFY_RESERVED_IMAGE_SUFFIXES.has(lastToken)
    ? `${baseName}-file`
    : baseName
}

const truncateBaseName = (baseName: string, maxLength = 80) => {
  if (baseName.length <= maxLength) return baseName
  return baseName.slice(0, maxLength).replace(/-+$/g, '') || 'image'
}

const makeUniqueFileName = (baseName: string, extension: string, usedNames: Set<string>) => {
  let candidateBase = baseName
  let candidate = `${candidateBase}.${extension}`
  let suffix = 2

  while (usedNames.has(candidate)) {
    const nextSuffix = `-${suffix}`
    candidateBase = truncateBaseName(baseName, 80 - nextSuffix.length)
    candidate = `${candidateBase}${nextSuffix}.${extension}`
    suffix += 1
  }

  usedNames.add(candidate)
  return candidate
}

export const getShopifyStyleUploadFileName = (
  file: File,
  usedNames: Set<string>,
  fallbackIndex: number,
) => {
  const extension = getExtension(file)
  const rawBaseName = getBaseName(file)
  const fallbackBaseName = `image-${fallbackIndex + 1}`
  const safeBaseName = toShopifyStyleHandle(rawBaseName) || fallbackBaseName
  const baseName = truncateBaseName(avoidReservedShopifySuffix(safeBaseName))

  return makeUniqueFileName(baseName, extension, usedNames)
}

export const renameFileForUpload = (file: File, fileName: string) => {
  if (file.name === fileName) return file

  return new File([file], fileName, {
    type: file.type,
    lastModified: file.lastModified,
  })
}
