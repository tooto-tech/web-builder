import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  fileURLToPath(new URL('./I18nPanel.vue', import.meta.url)),
  'utf-8',
)

describe('I18nPanel source contract', () => {
  it('uses the package select UI instead of native select controls', () => {
    expect(source).not.toContain('<select')
    expect(source).not.toContain('<option')
    expect(source).toContain('wb-i18n-select-ui')
  })
})
