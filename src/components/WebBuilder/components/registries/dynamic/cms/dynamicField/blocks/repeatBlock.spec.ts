import { describe, expect, it } from 'vitest'
import { buildPresetComponents } from './repeatBlock'

describe('cms dynamic repeat block presets', () => {
  it('builds a usable Popular Models item template for product category pages', () => {
    const components = buildPresetComponents('popular@productCategory.popularModels')
    const serialized = JSON.stringify(components)

    expect(serialized).toContain('popular.picUrl')
    expect(serialized).toContain('popular.name')
    expect(serialized).toContain('popular.introduction')
    expect(serialized).toContain('popular.url')
    expect(serialized).not.toContain('在此拖入动态文本')
  })

  it('builds a usable Popular Models item template for product detail pages', () => {
    const components = buildPresetComponents('popular@product.popularModels')
    const serialized = JSON.stringify(components)

    expect(serialized).toContain('popular.picUrl')
    expect(serialized).toContain('popular.name')
    expect(serialized).toContain('popular.introduction')
    expect(serialized).toContain('popular.url')
  })
})
