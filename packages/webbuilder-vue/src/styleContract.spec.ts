import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const distStylePath = resolve(__dirname, '../dist/style.css')

describe('@tooto-tech/webbuilder-vue style contract', () => {
  it('ships prefixed shell utilities without Tailwind base reset', () => {
    const css = readFileSync(distStylePath, 'utf8')

    expect(css).toContain('.tw-bg-editor-panel')
    expect(css).toContain('.tw-h-screen')
    expect(css).not.toContain('*, ::before, ::after')
    expect(css).not.toContain('html, :host')
  })
})
