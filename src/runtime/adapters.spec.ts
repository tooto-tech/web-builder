import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  callContentAdapter,
  callPageAdapter,
  clearWebBuilderAdapters,
  setWebBuilderAdapters
} from './adapters'

describe('web builder runtime adapters', () => {
  afterEach(() => {
    clearWebBuilderAdapters()
  })

  it('forwards page adapter calls with arguments', async () => {
    const getDraft = vi.fn().mockResolvedValue({ id: 1 })

    setWebBuilderAdapters({
      page: {
        getDraft
      }
    })

    await expect(callPageAdapter('getDraft', { resourceId: 1 })).resolves.toEqual({ id: 1 })
    expect(getDraft).toHaveBeenCalledWith({ resourceId: 1 })
  })

  it('forwards nested content adapter calls', async () => {
    const getPost = vi.fn().mockResolvedValue({ id: 2 })

    setWebBuilderAdapters({
      content: {
        post: {
          getPost
        }
      }
    })

    await expect(callContentAdapter('post', 'getPost', 2)).resolves.toEqual({ id: 2 })
    expect(getPost).toHaveBeenCalledWith(2)
  })

  it('throws a clear error when a method is missing', () => {
    setWebBuilderAdapters({
      page: {}
    })

    expect(() => callPageAdapter('saveDraft')).toThrow(
      '[WebBuilder] Missing runtime adapter method: page.saveDraft'
    )
  })
})
