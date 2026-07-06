import type { MediaAssetPage, MediaAssetRecord } from '../core/index.js'

interface AssetModelLike {
  cid?: string
  get?: (key: string) => unknown
  getSrc?: () => string
}

interface AssetManagerLike {
  add?: (asset: Record<string, unknown>) => unknown
  remove?: (asset: unknown) => unknown
}

interface ComponentLike {
  is?: (type: string) => boolean
  get?: (key: string) => unknown
  set?: (key: string, value: unknown) => void
  addAttributes?: (attributes: Record<string, unknown>) => void
}

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {}

const getAssetManager = (editor: unknown): AssetManagerLike | undefined =>
  toRecord(editor).AssetManager as AssetManagerLike | undefined

const getSelectedComponent = (editor: unknown): ComponentLike | null | undefined => {
  const getSelected = toRecord(editor).getSelected
  return typeof getSelected === 'function'
    ? getSelected.call(editor) as ComponentLike | null | undefined
    : null
}

const readAssetValue = (asset: unknown, key: string): unknown => {
  const model = asset as AssetModelLike | null | undefined
  const fromGetter = model?.get?.(key)
  if (fromGetter != null) return fromGetter
  return toRecord(asset)[key]
}

const readString = (value: unknown): string => `${value ?? ''}`.trim()

const readOptionalNumber = (value: unknown): number | undefined => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

const nameFromUrl = (url: string): string => {
  const cleanUrl = url.split('?')[0] ?? url
  const lastSegment = cleanUrl.split('/').filter(Boolean).pop()
  return decodeURIComponent(lastSegment || cleanUrl || 'asset')
}

export const getMediaAssetSrc = (asset: unknown): string => {
  if (typeof asset === 'string') return asset.trim()

  const model = asset as AssetModelLike | null | undefined
  const fromMethod = readString(model?.getSrc?.())
  if (fromMethod) return fromMethod

  const src = readString(readAssetValue(asset, 'src'))
  if (src) return src

  const urlValue = readAssetValue(asset, 'url')
  if (typeof urlValue === 'function') return readString(urlValue())
  return readString(urlValue)
}

export const normalizeMediaAssetRecord = (asset: unknown): MediaAssetRecord | null => {
  const src = getMediaAssetSrc(asset)
  if (!src) return null

  const id =
    readAssetValue(asset, 'id') ??
    (asset as AssetModelLike | null | undefined)?.cid ??
    src
  const name = readString(readAssetValue(asset, 'name')) || nameFromUrl(src)
  const url = readString(readAssetValue(asset, 'url')) || src
  const type = readString(readAssetValue(asset, 'type')) || undefined
  const createdAt = readString(readAssetValue(asset, 'createTime') ?? readAssetValue(asset, 'createdAt')) || undefined
  const updatedAt = readString(readAssetValue(asset, 'updateTime') ?? readAssetValue(asset, 'updatedAt')) || undefined

  return {
    id: typeof id === 'number' || typeof id === 'string' ? id : src,
    name,
    src,
    url,
    type,
    size: readOptionalNumber(readAssetValue(asset, 'size')),
    width: readOptionalNumber(readAssetValue(asset, 'width')),
    height: readOptionalNumber(readAssetValue(asset, 'height')),
    createdAt,
    updatedAt,
  }
}

const toList = (result: unknown): unknown[] => {
  if (Array.isArray(result)) return result
  const record = toRecord(result)
  if (Array.isArray(record.list)) return record.list
  if (Array.isArray(record.data)) return record.data
  return []
}

export const normalizeMediaAssetPage = (result: unknown): MediaAssetPage => {
  const record = toRecord(result)
  const list = toList(result)
    .map(normalizeMediaAssetRecord)
    .filter((asset): asset is MediaAssetRecord => Boolean(asset))

  return {
    list,
    total: Number(record.total ?? list.length) || list.length,
  }
}

export const isImageAsset = (asset: MediaAssetRecord): boolean =>
  !asset.type || asset.type.includes('image') || /\.(?:apng|avif|gif|jpe?g|png|svg|webp)$/i.test(asset.src)

export const isSvgAsset = (asset: MediaAssetRecord): boolean =>
  asset.type?.includes('svg') || /\.svg(?:$|\?)/i.test(asset.src)

export const getMediaAssetThumbnailUrl = (asset: MediaAssetRecord, size = 240): string => {
  if (!isImageAsset(asset) || isSvgAsset(asset) || asset.src.includes('?')) return asset.src
  return `${asset.src}?imageMogr2/thumbnail/${size}x`
}

export const mediaAssetMatchesFilter = (asset: MediaAssetRecord, filterType: string): boolean => {
  if (filterType === 'svg') return isSvgAsset(asset)
  if (filterType === 'image') return isImageAsset(asset)
  return true
}

export const toGrapesAssetInput = (asset: MediaAssetRecord): Record<string, unknown> => ({
  id: asset.id,
  name: asset.name,
  src: asset.src,
  type: asset.type?.includes('svg') ? 'image/svg+xml' : 'image',
})

export const syncMediaAssetToEditor = (
  editor: unknown,
  asset: MediaAssetRecord,
): unknown => getAssetManager(editor)?.add?.(toGrapesAssetInput(asset)) ?? toGrapesAssetInput(asset)

export const applyMediaAssetToSelectedImage = (
  editor: unknown,
  asset: MediaAssetRecord,
): boolean => {
  const selected = getSelectedComponent(editor)
  if (!selected) return false

  const isImage =
    selected.is?.('image') ||
    selected.get?.('type') === 'image' ||
    selected.get?.('tagName') === 'img'
  if (!isImage) return false

  selected.set?.('src', asset.src)
  selected.addAttributes?.({
    src: asset.src,
    alt: asset.name,
  })
  return true
}
