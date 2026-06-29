import { describe, expect, it } from 'vitest'

import { createCmsComponentsPlugin } from './plugin'

const collectDefaultBlocks = (canInsertComponentType: (type: string) => boolean = () => true) => {
  const plugin = createCmsComponentsPlugin()
  const [provider] = plugin.blockPacks ?? []

  return provider?.({ canInsertComponentType } as any)?.flatMap(pack => pack.blocks) ?? []
}

describe('cms components plugin blocks', () => {
  it('exposes the post card as a WebBuilder component block', () => {
    const blocks = collectDefaultBlocks()

    expect(blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'cms-post-card',
        label: '文章卡片',
        category: 'CMS',
        media: 'lucide:newspaper',
        content: { type: 'wb-cms-post-card' },
        componentTypes: ['wb-cms-post-card'],
      }),
    ]))
  })

  it('filters the post card block by insert capability', () => {
    const blocks = collectDefaultBlocks(type => type !== 'wb-cms-post-card')

    expect(blocks.some(block => block.id === 'cms-post-card')).toBe(false)
  })
})
