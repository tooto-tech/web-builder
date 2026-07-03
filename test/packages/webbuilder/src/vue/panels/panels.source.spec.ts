import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const panelsRoot = fileURLToPath(new URL('../../../../../../packages/webbuilder/src/vue/panels/', import.meta.url))

const readPanelFile = (relativePath: string) => {
  const fullPath = `${panelsRoot}${relativePath}`
  if (!existsSync(fullPath)) return ''
  return readFileSync(fullPath, 'utf-8')
}

describe('built-in Provider panels', () => {
  it('keeps each built-in panel Provider-backed inside the package panels directory', () => {
    const expectedPanels = [
      ['BlocksPanel.vue', 'BlocksProvider'],
      ['StylePanel.vue', 'StylesProvider'],
      ['LayersPanel.vue', 'LayersProvider'],
      ['AssetsPanel.vue', 'AssetsProvider'],
      ['ModalHost.vue', 'ModalProvider'],
    ] as const

    expectedPanels.forEach(([file, provider]) => {
      const source = readPanelFile(file)
      expect(source, file).toContain(provider)
      expect(source, file).toContain('@tootix/grapesjs-vue')
    })
  })

  it('assembles the layers panel from NTree wired to the GrapesJS LayerManager', () => {
    const panelSource = readPanelFile('LayersPanel.vue')
    const contentSource = readPanelFile('LayersPanelContent.vue')

    expect(panelSource).toContain('<LayersPanelContent')
    expect(contentSource).toContain("import { NTree } from 'naive-ui'")
    expect(contentSource).toContain("import { useEditor } from '@tootix/grapesjs-vue'")
    expect(contentSource).toContain('getLayerData')
    expect(contentSource).toContain('setVisible')
    expect(contentSource).toContain('setLocked')
    expect(contentSource).toContain('setName')
    expect(contentSource).toContain('setOpen')
    expect(contentSource).toContain('canMove')
    expect(contentSource).toContain('.move(resolved.target')
    expect(contentSource).toContain(':allow-drop="allowDrop"')
    expect(contentSource).toContain('@drop="onNodeDrop"')
  })

  it('renders layers with leaf-safe tree data and a separated action layout', () => {
    const contentSource = readPanelFile('LayersPanelContent.vue')

    expect(contentSource).toContain('children?: LayerNode[]')
    expect(contentSource).toContain('const buildNode = (')
    expect(contentSource).toContain('treeData.value = [buildNode(props.root, expanded, selected, byId, true)]')
    expect(contentSource).toContain('...(children.length ? { children } : {})')
    expect(contentSource).toContain('grid-template-columns: minmax(0, 1fr) auto')
    expect(contentSource).toContain('width: 48px')
    expect(contentSource).toContain('visibility: visible')
    expect(contentSource).not.toContain('children: buildNodes(child, expanded, selected, byId)')
    expect(contentSource).not.toContain('treeData.value = buildNodes(props.root, expanded, selected, byId)')
  })

  it('assembles the style panel from grapesjs-vue providers and adapters', () => {
    const panelSource = readPanelFile('StylePanel.vue')
    const source = readPanelFile('StylePanelContent.vue')

    expect(panelSource).toContain("import { StylesProvider } from '@tootix/grapesjs-vue'")
    expect(panelSource).toContain('<StylesProvider')
    expect(panelSource).toContain('<StylePanelContent')
    expect(source).toContain("import { NCollapse, NCollapseItem, NTab, NTabs } from 'naive-ui'")
    expect(source).toContain('<NTabs')
    expect(source).toContain('type="segment"')
    expect(source).toContain('animated')
    expect(source).toContain('<NTab')
    expect(source).toContain("value: 'style-manager'")
    expect(source).toContain("value: 'traits'")
    expect(source).toContain('<TraitSection')
    expect(source).toContain('<NCollapse')
    expect(source).toContain('<NCollapseItem')
    expect(source).not.toContain('accordion')
    expect(source).toContain('<WbSector')
  })

  it('renders blocks with media inside non-accordion Naive UI collapse groups', () => {
    const panelSource = readPanelFile('BlocksPanel.vue')
    const source = readPanelFile('BlocksPanelContent.vue')

    expect(panelSource).toContain('<BlocksPanelContent')
    expect(source).toContain("import { NCollapse, NCollapseItem } from 'naive-ui'")
    expect(source).toContain('<NCollapse')
    expect(source).toContain('<NCollapseItem')
    expect(source).not.toContain('accordion')
    expect(source).toContain('getBlockMedia')
    expect(source).toContain('v-html="getBlockMedia(block)"')
  })

  it('renders block entries as dense cell rows inside each collapse group', () => {
    const source = readPanelFile('BlocksPanelContent.vue')

    expect(source).toContain('wb-blocks-panel__list')
    expect(source).toContain('wb-blocks-panel__cell')
    expect(source).toContain('wb-blocks-panel__cell-media')
    expect(source).toContain('wb-blocks-panel__cell-body')
    expect(source).toContain('wb-blocks-panel__cell-label')
    expect(source).toContain('grid-template-columns: 24px minmax(0, 1fr)')
    expect(source).toContain('width: 16px')
    expect(source).toContain('max-width: 16px')
    expect(source).not.toContain('grid-template-columns: repeat(2')
    expect(source).not.toContain('grid-template-columns: 32px minmax(0, 1fr)')
    expect(source).not.toContain('min-height: 40px')
    expect(source).not.toContain('min-height: 86px')
  })

  it('keeps selectors and traits as Provider-backed package panels', () => {
    expect(existsSync(`${panelsRoot}SelectorSection.vue`)).toBe(true)
    expect(existsSync(`${panelsRoot}TraitSection.vue`)).toBe(true)

    const selectorSource = readPanelFile('SelectorSection.vue')
    const traitSource = readPanelFile('TraitSection.vue')

    expect(selectorSource).toContain("import { SelectorsProvider } from '@tootix/grapesjs-vue'")
    expect(selectorSource).toContain('<SelectorsProvider')
    expect(traitSource).toContain("import { TraitsProvider } from '@tootix/grapesjs-vue'")
    expect(traitSource).toContain('normalizeTraitRows')
  })

  it('renders special trait types through package-owned field components', () => {
    const traitSource = readPanelFile('TraitSection.vue')
    const expectedFields = [
      'TraitImagePickerField.vue',
      'TraitPageLinkField.vue',
      'TraitCodeField.vue',
      'TraitSvgIconField.vue',
    ]

    expectedFields.forEach((file) => {
      expect(existsSync(`${panelsRoot}trait-fields/${file}`), file).toBe(true)
    })
    expect(traitSource).toContain('<TraitImagePickerField')
    expect(traitSource).toContain('<TraitPageLinkField')
    expect(traitSource).toContain('<TraitCodeField')
    expect(traitSource).toContain('<TraitSvgIconField')
    expect(traitSource).not.toContain('@toototech/webbuilder-plugins')

    const imageFieldSource = readPanelFile('trait-fields/TraitImagePickerField.vue')
    expect(imageFieldSource).toContain('AssetManager.open')
  })
})
