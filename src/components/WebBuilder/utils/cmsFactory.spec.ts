import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/auth', () => ({
  getEffectiveTenantId: () => ''
}))

vi.mock('../components/registries/dynamic/cms/post/list', () => {
  throw new Error('cmsFactory imported concrete post registry')
})

vi.mock('../components/registries/dynamic/cms/product/list', () => {
  throw new Error('cmsFactory imported concrete product registry')
})

describe('cmsFactory module boundaries', () => {
  it('loads shared CMS registration helpers without importing concrete post/product registries', async () => {
    await expect(import('./cmsFactory')).resolves.toMatchObject({
      registerCmsComponent: expect.any(Function),
      registerCmsTypeEntry: expect.any(Function)
    })
  })
})
