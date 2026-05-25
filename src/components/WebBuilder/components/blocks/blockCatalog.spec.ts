import { describe, expect, it } from 'vitest'
import {
  blockMatchesSearch,
  createWebBuilderBlockCatalog,
  groupWebBuilderBlocks,
  type WebBuilderBlockPack
} from './blockCatalog'

describe('WebBuilder block catalog', () => {
  it('returns only the minimal Basic blocks by default', () => {
    const blocks = createWebBuilderBlockCatalog()

    expect(blocks.map((block) => block.id)).toEqual([
      'section-grid-block',
      'container',
      'heading',
      'paragraph',
      'link',
      'image',
      'icon',
      'language-switcher'
    ])
  })

  it('does not expose removed built-in blocks in the default catalog', () => {
    const blocks = createWebBuilderBlockCatalog()
    const blockIds = new Set(blocks.map((block) => block.id))
    const removedBlockIds = [
      'spacer',
      'divider',
      'navbar',
      'navbar-thb',
      'logo',
      'footer',
      'cms-site-menu',
      'cms-menu-tree',
      'footer-menu',
      'banner',
      'industry-tabs',
      'product-categories',
      'our-solutions',
      'flipbook',
      'tab-media-gallery',
      'pdf-viewer',
      'history-timeline',
      'foca-history-timeline',
      'product-card-strip',
      'case-spotlight',
      'milestone-card-strip',
      'map',
      'static-pin-map',
      'factory-map',
      'accordion',
      'tabs',
      'loop-grid',
      'cms-post-list',
      'cms-product-detail',
      'dyn-text',
      'dyn-repeat'
    ]

    removedBlockIds.forEach((id) => {
      expect(blockIds).not.toContain(id)
    })
    expect(
      blocks
        .filter((block) => block.id !== 'language-switcher')
        .every((block) => block.category === 'basic')
    ).toBe(true)
    expect(blocks.find((block) => block.id === 'language-switcher')?.category).toBe('navigation')
    expect(blocks.some((block) => block.category === 'section')).toBe(false)
  })

  it('matches search queries by label, id, category, icon, and component type', () => {
    const blocks = createWebBuilderBlockCatalog()
    const image = blocks.find((block) => block.id === 'image')
    const heading = blocks.find((block) => block.id === 'heading')

    expect(image).toBeTruthy()
    expect(heading).toBeTruthy()
    expect(blockMatchesSearch(image!, '图片')).toBe(true)
    expect(blockMatchesSearch(image!, 'image')).toBe(true)
    expect(blockMatchesSearch(image!, 'basic')).toBe(true)
    expect(blockMatchesSearch(image!, 'lucide:image')).toBe(true)
    expect(blockMatchesSearch(image!, 'wb-image')).toBe(true)
    expect(blockMatchesSearch(heading!, '标题')).toBe(true)
    expect(blockMatchesSearch(heading!, 'missing')).toBe(false)
  })

  it('groups blocks by category using stable catalog ordering', () => {
    const groups = groupWebBuilderBlocks(createWebBuilderBlockCatalog())

    const blocks = createWebBuilderBlockCatalog()
    expect(groups).toEqual([
      {
        id: 'basic',
        label: 'Basic',
        items: blocks.filter((block) => block.category === 'basic')
      },
      {
        id: 'navigation',
        label: 'Navigation',
        items: blocks.filter((block) => block.category === 'navigation')
      }
    ])
  })

  it('allows project or tenant block packs to inject context-aware blocks', () => {
    const pack: WebBuilderBlockPack = {
      id: 'tenant-pack',
      blocks: (context) => [
        {
          id: 'tenant-hero',
          label: 'Tenant Hero',
          icon: 'lucide:panels-top-left',
          content: { type: 'tenant-hero' },
          category: 'project',
          visible: context.tenantId === '42'
        }
      ]
    }

    expect(
      createWebBuilderBlockCatalog({ tenantId: '42' }, [pack]).map((block) => block.id)
    ).toContain('tenant-hero')
    expect(
      createWebBuilderBlockCatalog({ tenantId: '7' }, [pack]).map((block) => block.id)
    ).not.toContain('tenant-hero')
  })
})
