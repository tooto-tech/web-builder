import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const controlsRoot = fileURLToPath(new URL('./controls/', import.meta.url))
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
  'style-controls/WbCtrlBgImage.vue',
  'style-controls/WbCtrlBorderRadius.vue',
  'style-controls/WbCtrlColor.vue',
  'style-controls/WbCtrlFont.vue',
  'style-controls/WbCtrlIconRadio.vue',
  'style-controls/WbCtrlNumber.vue',
  'style-controls/WbCtrlSelect.vue',
  'style-controls/WbCtrlShadow.vue',
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
})
