import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  fileURLToPath(new URL('./cmsFactory.ts', import.meta.url)),
  'utf-8'
)

describe('cmsFactory module boundaries', () => {
  it('keeps host auth out of CMS factory runtime', () => {
    expect(source).not.toContain(['@', 'utils/auth'].join('/'))
    expect(source).not.toContain(['@', 'api/'].join('/'))
    expect(source).not.toContain("/post/list")
    expect(source).not.toContain("/product/list")
  })

  it('does not publish host API paths or tenant headers as package defaults', () => {
    expect(source).not.toContain('/app-api')
    expect(source).not.toContain('tenant-id')
  })

  it('loads shared CMS registration helpers without importing concrete post/product registries', async () => {
    await expect(import('./cmsFactory.js')).resolves.toMatchObject({
      registerCmsComponent: expect.any(Function),
      registerCmsTypeEntry: expect.any(Function),
      setCmsFactoryDataProvider: expect.any(Function)
    })
  })
})
