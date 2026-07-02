import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const panelsRoot = fileURLToPath(new URL('./', import.meta.url))

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

  it('assembles the layers panel from ElTree wired to the GrapesJS LayerManager', () => {
    const panelSource = readPanelFile('LayersPanel.vue')
    const contentSource = readPanelFile('LayersPanelContent.vue')

    expect(panelSource).toContain('<LayersPanelContent')
    expect(contentSource).toContain("import { ElTree } from 'element-plus'")
    expect(contentSource).toContain("import { useEditor } from '@tootix/grapesjs-vue'")
    expect(contentSource).toContain('getLayerData')
    expect(contentSource).toContain('setVisible')
    expect(contentSource).toContain('setLocked')
    expect(contentSource).toContain('setName')
    expect(contentSource).toContain('setOpen')
    expect(contentSource).toContain('canMove')
    expect(contentSource).toContain('.move(resolved.target')
    expect(contentSource).toContain(':allow-drop="allowDrop"')
    expect(contentSource).toContain('@node-drop="onNodeDrop"')
  })

  it('assembles the style panel from grapesjs-vue providers and adapters', () => {
    const source = readPanelFile('StylePanel.vue')

    expect(source).toContain("import { StylesProvider } from '@tootix/grapesjs-vue'")
    expect(source).toContain('<StylesProvider')
    expect(source).toContain('<StylePanelContent')
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
