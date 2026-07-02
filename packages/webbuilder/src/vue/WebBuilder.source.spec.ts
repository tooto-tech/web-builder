import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const webBuilderSource = readFileSync(
  fileURLToPath(new URL('./WebBuilder.vue', import.meta.url)),
  'utf-8',
)
const blocksPanelSource = readFileSync(
  fileURLToPath(new URL('./DefaultBlocksPanel.vue', import.meta.url)),
  'utf-8',
)

describe('WebBuilder default panels', () => {
  it('renders a package-owned blocks panel for the default blocks tab', () => {
    expect(webBuilderSource).toContain("import DefaultBlocksPanel from './DefaultBlocksPanel.vue'")
    expect(webBuilderSource).toContain('activePanel === \'blocks\'')
    expect(webBuilderSource).toContain('<DefaultBlocksPanel')
    expect(webBuilderSource).not.toContain('No panel provider is registered.')
  })

  it('uses grapesjs-vue BlocksProvider drag helpers for block insertion', () => {
    expect(blocksPanelSource).toContain("import { BlocksProvider } from '@tootix/grapesjs-vue'")
    expect(blocksPanelSource).toContain('mapCategoryBlocks')
    expect(blocksPanelSource).toContain('dragStart(block, event)')
    expect(blocksPanelSource).toContain('dragStop()')
  })
})
