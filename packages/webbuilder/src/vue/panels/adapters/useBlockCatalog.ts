import type { Block } from 'grapesjs'

export interface BlockCatalogGroup {
  id: string
  label: string
  blocks: Block[]
}

export const normalizeBlockCatalog = (
  mapCategoryBlocks: Map<string, Block[]>,
): BlockCatalogGroup[] =>
  Array.from(mapCategoryBlocks.entries()).map(([category, blocks]) => ({
    id: category || 'blocks',
    label: category || 'Blocks',
    blocks,
  }))
