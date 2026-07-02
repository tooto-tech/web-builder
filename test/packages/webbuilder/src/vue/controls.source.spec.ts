import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const controlsRoot = fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/controls/', import.meta.url))
const vueRoot = fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/', import.meta.url))
const controlFiles = [
  'BorderRadiusControl.vue',
  'SpacingControl.vue',
  'fields/FieldIconSelect.vue',
  'fields/FieldWrapper.vue',
  'fields/WbColorPicker.vue',
  'fields/index.ts',
  'fontControls.ts',
  'globalSettings.ts',
  'index.ts',
  'WbSector.vue',
  'WbStyleControl.vue',
  'style-controls/WbCtrlBgImage.vue',
  'style-controls/WbCtrlBorderRadius.vue',
  'style-controls/WbCtrlColor.vue',
  'style-controls/WbCtrlFile.vue',
  'style-controls/WbCtrlFont.vue',
  'style-controls/WbCtrlIconRadio.vue',
  'style-controls/WbCtrlNumber.vue',
  'style-controls/WbCtrlRadio.vue',
  'style-controls/WbCtrlSelect.vue',
  'style-controls/WbCtrlShadow.vue',
  'style-controls/WbCtrlSlider.vue',
  'style-controls/WbCtrlSpacing.vue',
  'style-controls/WbCtrlText.vue',
  'style-controls/WbCtrlTypography.vue',
  'style-controls/index.ts',
]

const readControlFile = (relativePath: string) => {
  const fullPath = `${controlsRoot}${relativePath}`
  if (!existsSync(fullPath)) return ''
  return readFileSync(fullPath, 'utf-8')
}

const readVueFile = (relativePath: string) => {
  const fullPath = `${vueRoot}${relativePath}`
  if (!existsSync(fullPath)) return ''
  return readFileSync(fullPath, 'utf-8')
}

const appAliasSingleQuoteImport = `from '${'@'}/`
const appAliasDoubleQuoteImport = `from "${'@'}/`

describe('migrated WebBuilder controls', () => {
  it('keeps the expected style controls and fields in the package', () => {
    controlFiles.forEach((file) => {
      expect(existsSync(`${controlsRoot}${file}`), file).toBe(true)
    })
  })

  it('exports the migrated controls from one package-owned entry', () => {
    const source = readControlFile('index.ts')

    expect(source).toContain("export * from './fields/index.js'")
    expect(source).toContain("export * from './style-controls/index.js'")
    expect(source).toContain("export { default as SpacingControl } from './SpacingControl.vue'")
    expect(source).toContain("export { default as BorderRadiusControl } from './BorderRadiusControl.vue'")
    expect(source).toContain("export { default as WbSector } from './WbSector.vue'")
  })

  it('does not keep admin alias imports in package controls', () => {
    controlFiles.forEach((file) => {
      const source = readControlFile(file)
      expect(source, file).not.toContain(appAliasSingleQuoteImport)
      expect(source, file).not.toContain(appAliasDoubleQuoteImport)
    })
  })

  it('does not depend on webbuilder plugin packages from package controls', () => {
    controlFiles.forEach((file) => {
      const source = readControlFile(file)
      expect(source, file).not.toContain('@toototech/webbuilder-plugins')
    })
  })

  it('does not import Element Plus from package shell UI', () => {
    const packageRoot = fileURLToPath(new URL('../../../../../packages/webbuilder/', import.meta.url))
    const source = readFileSync(`${packageRoot}package.json`, 'utf-8')

    expect(source).toContain('"naive-ui"')
    expect(source).not.toContain('"element-plus"')

    const shellFiles = [
      'TopBar.vue',
      'WebBuilderShell.vue',
      'panels/BlocksPanelContent.vue',
      'panels/LayersPanelContent.vue',
      'panels/StylePanelContent.vue',
      'panels/TraitSection.vue',
      ...controlFiles.map(file => `controls/${file}`),
    ]

    shellFiles.forEach((file) => {
      const source = readVueFile(file)
      expect(source, file).not.toContain('element-plus')
      expect(source, file).not.toContain('<El')
      expect(source, file).not.toContain('<el-')
    })
  })

  it('routes style control types through Naive UI form controls where possible', () => {
    const sectorSource = readControlFile('WbSector.vue')
    const styleControlSource = readControlFile('WbStyleControl.vue')

    expect(sectorSource).toContain('<WbStyleControl')
    expect(styleControlSource).toContain('<WbCtrlText')
    expect(styleControlSource).toContain('<WbCtrlNumber')
    expect(styleControlSource).toContain('<WbCtrlRadio')
    expect(styleControlSource).toContain('<WbCtrlSlider')
    expect(styleControlSource).toContain('<WbCtrlFile')
    expect(styleControlSource).toContain("property.type === 'composite'")
    expect(styleControlSource).toContain("property.type === 'stack'")
    expect(styleControlSource).toContain('<WbStyleControl')

    expect(readControlFile('style-controls/WbCtrlNumber.vue')).toContain('NInputNumber')
    expect(readControlFile('style-controls/WbCtrlRadio.vue')).toContain('NTabs')
    expect(readControlFile('style-controls/WbCtrlRadio.vue')).toContain('NTab')
    expect(readControlFile('style-controls/WbCtrlRadio.vue')).toContain('type="segment"')
    expect(readControlFile('style-controls/WbCtrlSlider.vue')).toContain('NSlider')
    expect(readControlFile('style-controls/WbCtrlFile.vue')).toContain('NButton')
  })

  it('renders stack-style shadow controls with structured Naive UI layer controls', () => {
    const source = readControlFile('style-controls/WbCtrlShadow.vue')

    expect(source).toContain('NButton')
    expect(source).toContain('NCheckbox')
    expect(source).toContain('NCollapse')
    expect(source).toContain('NCollapseItem')
    expect(source).toContain('NInput')
    expect(source).toContain('<NCollapse')
    expect(source).toContain('<NCollapseItem')
    expect(source).toContain('moveLayer')
    expect(source).toContain('duplicateLayer')
    expect(source).toContain('<WbCtrlColor')
    expect(source).not.toContain('<input')
  })
})
