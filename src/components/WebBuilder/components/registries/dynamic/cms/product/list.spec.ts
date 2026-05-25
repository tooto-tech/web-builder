import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./styles.ts', import.meta.url)), 'utf8')

describe('cms product list styles', () => {
  it('does not reserve the filter column with a huge implicit grid row span', () => {
    expect(source).not.toContain('span 999')
    expect(source).toContain('.wb-product-list__grid')
    expect(source).toContain('grid-template-columns: 220px minmax(0, 1fr)')
  })
})
