import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const webBuilderSource = readFileSync(
  fileURLToPath(new URL('./WebBuilder.vue', import.meta.url)),
  'utf-8',
)
const blocksPanelSource = readFileSync(
  fileURLToPath(new URL('./panels/BlocksPanel.vue', import.meta.url)),
  'utf-8',
)
const panelsIndexSource = readFileSync(
  fileURLToPath(new URL('./panels/index.ts', import.meta.url)),
  'utf-8',
)
const deviceSwitcherSource = readFileSync(
  fileURLToPath(new URL('./DeviceSwitcher.vue', import.meta.url)),
  'utf-8',
)
const vueIndexSource = readFileSync(
  fileURLToPath(new URL('./index.ts', import.meta.url)),
  'utf-8',
)

describe('WebBuilder default panels', () => {
  it('renders package-owned panels through host-overridable slot fallbacks', () => {
    expect(webBuilderSource).toContain('getBuiltinPanelComponent')
    expect(webBuilderSource).toContain('ModalHost')
    expect(webBuilderSource).toContain('AssetsModalHost')
    expect(webBuilderSource).toContain('<slot')
    expect(webBuilderSource).toContain('name="rail"')
    expect(webBuilderSource).toContain('name="side-panel"')
    expect(webBuilderSource).toContain('<component')
    expect(webBuilderSource).toContain('builtinPanelFor(activePanel)')
    expect(panelsIndexSource).toContain('blocks: BlocksPanel')
    expect(panelsIndexSource).toContain('AssetsModalHost')
    expect(webBuilderSource).not.toContain('No panel provider is registered.')
  })

  it('uses grapesjs-vue BlocksProvider drag helpers for block insertion', () => {
    expect(blocksPanelSource).toContain("import { BlocksProvider } from '@tootix/grapesjs-vue'")
    expect(blocksPanelSource).toContain('mapCategoryBlocks')
    expect(blocksPanelSource).toContain('dragStart(block, event)')
    expect(blocksPanelSource).toContain('dragStop()')
  })

  it('uses DevicesProvider for device selection', () => {
    expect(deviceSwitcherSource).toContain("import { DevicesProvider } from '@tootix/grapesjs-vue'")
    expect(deviceSwitcherSource).toContain('<DevicesProvider')
    expect(webBuilderSource).not.toContain(':devices="devices"')
    expect(webBuilderSource).not.toContain(':selected-device="selectedDevice"')
  })

  it('exports package-owned panels and controls for slot overrides', () => {
    expect(vueIndexSource).toContain("export * from './panels/index.js'")
    expect(vueIndexSource).toContain("export * from './controls/index.js'")
  })

  it('wires package-owned controllers into WebBuilder context and top bar actions', () => {
    expect(webBuilderSource).toContain('useDraftController')
    expect(webBuilderSource).toContain('useAutosaveController')
    expect(webBuilderSource).toContain('usePublishController')
    expect(webBuilderSource).toContain('useLockController')
    expect(webBuilderSource).toContain('useRevisionController')
    expect(webBuilderSource).toContain('get controllers()')
    expect(webBuilderSource).toContain("event: 'save-success'")
    expect(webBuilderSource).toContain("event: 'publish-success'")
    expect(webBuilderSource).toContain("event: 'lock-changed'")
    expect(webBuilderSource).toContain('@save-draft="handleSaveDraft"')
    expect(webBuilderSource).toContain('@publish="handlePublish"')
  })
})
