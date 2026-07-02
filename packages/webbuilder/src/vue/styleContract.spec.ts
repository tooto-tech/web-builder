import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const distStylePath = resolve(__dirname, '../../dist/style.css')

describe('@toototech/webbuilder style contract', () => {
  it('ships prefixed shell utilities without Tailwind base reset', () => {
    const css = readFileSync(distStylePath, 'utf8')

    expect(css).toContain('var(--wb-topbar-bg)')
    expect(css).toContain('var(--wb-primary)')
    expect(css).toContain('var(--wb-btn-hover-bg)')
    expect(css).not.toContain('tw-bg-editor-panel')
    expect(css).toContain('.tw-h-screen')
    expect(css).toContain(':where(.wb-shell, .wb-shell-popper) button')
    expect(css).not.toContain('.wb-shell button')
    expect(css).not.toContain('.wb-shell-popper button')
    expect(css).not.toContain('*, ::before, ::after')
    expect(css).not.toContain('html, :host')
  })
})
