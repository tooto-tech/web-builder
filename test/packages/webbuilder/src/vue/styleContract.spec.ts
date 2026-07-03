import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const distStylePath = resolve(__dirname, '../../../../../packages/webbuilder/dist/style.css')

describe('@toototech/webbuilder style contract', () => {
  it('ships prefixed shell utilities without Tailwind base reset', () => {
    const css = readFileSync(distStylePath, 'utf8')

    expect(css).toContain('var(--wb-topbar-bg)')
    expect(css).toContain('var(--wb-primary)')
    expect(css).toContain('var(--wb-btn-hover-bg)')
    expect(css).toContain('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap')
    expect(css).toMatch(/font-family:\s*["']Open Sans["'],\s*Arial,\s*sans-serif/)
    expect(css).not.toContain('tw-bg-editor-panel')
    expect(css).toContain('.tw-h-screen')
    expect(css).toContain(':where(.wb-shell, .wb-shell-popper) button')
    expect(css).not.toContain('.wb-shell button')
    expect(css).not.toContain('.wb-shell-popper button')
    expect(css).not.toContain('*, ::before, ::after')
    expect(css).not.toContain('html, :host')
  })
})
