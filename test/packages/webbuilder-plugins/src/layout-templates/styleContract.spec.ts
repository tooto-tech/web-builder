import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const distStylePath = resolve(__dirname, '../../../../../packages/webbuilder-plugins/dist/style.css')
const distVueEntryPath = resolve(__dirname, '../../../../../packages/webbuilder-plugins/dist/vue.js')

describe('@toototech/webbuilder-plugins/layout-template style contract', () => {
  it('loads panel styles from the vue sub-entry without app-level style imports', () => {
    const css = readFileSync(distStylePath, 'utf8')
    const vueEntry = readFileSync(distVueEntryPath, 'utf8')

    expect(vueEntry).toContain("import './style.css';")
    expect(css).toContain('.layout-panel')
    expect(css).toContain('.layout-rule-card')
  })
})
