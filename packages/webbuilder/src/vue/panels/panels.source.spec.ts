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
      ['PagesPanel.vue', 'PagesProvider'],
      ['AssetsPanel.vue', 'AssetsProvider'],
      ['ModalHost.vue', 'ModalProvider'],
    ] as const

    expectedPanels.forEach(([file, provider]) => {
      const source = readPanelFile(file)
      expect(source, file).toContain(provider)
      expect(source, file).toContain('@tootix/grapesjs-vue')
    })
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
