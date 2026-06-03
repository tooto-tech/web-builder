import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const distStylePath = resolve(__dirname, '../dist/style.css')
const distVueEntryPath = resolve(__dirname, '../dist/vue.js')

describe('@tooto-tech/webbuilder-i18n style contract', () => {
  it('loads panel styles from the vue sub-entry without app-level style imports', () => {
    const css = readFileSync(distStylePath, 'utf8')
    const vueEntry = readFileSync(distVueEntryPath, 'utf8')

    expect(vueEntry).toContain("import './style.css';")
    expect(css).toContain('.wb-i18n-panel')
    expect(css).toContain('.wb-i18n-select-ui')
  })
})
