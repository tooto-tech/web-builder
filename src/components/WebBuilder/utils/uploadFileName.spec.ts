import { describe, expect, it } from 'vitest'
import {
  getShopifyStyleUploadFileName,
  renameFileForUpload,
} from './uploadFileName'

const makeFile = (name: string, type = 'image/png') =>
  new File(['test'], name, { type, lastModified: 1 })

describe('uploadFileName', () => {
  it('normalizes spaces and special characters to Shopify-style handles', () => {
    const usedNames = new Set<string>()
    const file = makeFile(' My Product Image @ 2x.PNG ')

    expect(getShopifyStyleUploadFileName(file, usedNames, 0)).toBe('my-product-image-2x.png')
  })

  it('falls back for Chinese-only file names and preserves the extension', () => {
    const usedNames = new Set<string>()
    const file = makeFile('产品 主图.webp', 'image/webp')

    expect(getShopifyStyleUploadFileName(file, usedNames, 0)).toBe('image-1.webp')
  })

  it('deduplicates file names within the same upload batch', () => {
    const usedNames = new Set<string>()
    const file = makeFile('Hero Image.jpg', 'image/jpeg')

    expect(getShopifyStyleUploadFileName(file, usedNames, 0)).toBe('hero-image.jpg')
    expect(getShopifyStyleUploadFileName(file, usedNames, 1)).toBe('hero-image-2.jpg')
  })

  it('avoids Shopify reserved image suffixes', () => {
    const usedNames = new Set<string>()
    const file = makeFile('banner_small.png')

    expect(getShopifyStyleUploadFileName(file, usedNames, 0)).toBe('banner-small-file.png')
  })

  it('renames the File object used for upload', () => {
    const original = makeFile('产品 主图.png')
    const renamed = renameFileForUpload(original, 'image-1.png')

    expect(renamed.name).toBe('image-1.png')
    expect(renamed.type).toBe(original.type)
    expect(renamed.lastModified).toBe(original.lastModified)
  })
})
