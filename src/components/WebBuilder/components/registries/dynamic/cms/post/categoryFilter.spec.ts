import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(fileURLToPath(new URL('./categoryFilter.ts', import.meta.url)), 'utf8')
const ssgSource = readFileSync(
  fileURLToPath(new URL('../../../../../utils/ssgRenderer.ts', import.meta.url)),
  'utf8'
)

describe('cms post category filter responsive mobile layout', () => {
  it('ships a mobile filter bar and right-side drawer controls', () => {
    expect(componentSource).toContain('wb-post-category-filter__mobile-bar')
    expect(componentSource).toContain('wb-post-category-filter__drawer')
    expect(componentSource).toContain('data-wb-post-category-filter-toggle')
    expect(componentSource).toContain('data-wb-post-category-filter-close')
    expect(componentSource).toContain('aria-expanded')
    expect(componentSource).toContain('font-size: 22px')
  })

  it('binds the mobile all-category count during SSG rendering', () => {
    expect(componentSource).toContain('postCategoryFilterAllCount')
    expect(ssgSource).toContain('postCategoryFilterAllCount')
  })
})
