import { describe, expect, it, vi } from 'vitest'
import { syncLayoutStyleOverride, syncLayoutStyleOverrides } from './useLayoutStyleAdapter'

const createComponent = (wbType: string) => ({
  set: vi.fn(),
  getAttributes: vi.fn(() => ({ 'data-wb-component': wbType })),
})

describe('useLayoutStyleAdapter', () => {
  it('syncs container and grid max-width changes into manualMaxWidth', () => {
    const container = createComponent('container')
    const grid = createComponent('grid')

    syncLayoutStyleOverride(container, 'max-width', '1200px')
    syncLayoutStyleOverride(grid, 'max-width', '960px')

    expect(container.set).toHaveBeenCalledWith('manualMaxWidth', '1200px', { silent: true })
    expect(grid.set).toHaveBeenCalledWith('manualMaxWidth', '960px', { silent: true })
  })

  it('syncs grid template column and row CSS changes into grid overrides only', () => {
    const grid = createComponent('grid')
    const container = createComponent('container')

    syncLayoutStyleOverride(grid, 'grid-template-columns', '1fr 2fr')
    syncLayoutStyleOverride(grid, 'grid-template-rows', 'auto 1fr')
    syncLayoutStyleOverride(container, 'grid-template-columns', 'repeat(3, 1fr)')

    expect(grid.set).toHaveBeenCalledWith('manualGridTemplateColumns', '1fr 2fr', { silent: true })
    expect(grid.set).toHaveBeenCalledWith('manualGridTemplateRows', 'auto 1fr', { silent: true })
    expect(container.set).not.toHaveBeenCalledWith(
      'manualGridTemplateColumns',
      expect.anything(),
      expect.anything(),
    )
  })

  it('syncs a batch of layout style overrides and ignores generic CSS', () => {
    const grid = createComponent('grid')

    syncLayoutStyleOverrides(grid, {
      color: 'red',
      'max-width': '1100px',
      'grid-template-columns': 'repeat(4, 1fr)',
    })

    expect(grid.set).toHaveBeenCalledTimes(2)
    expect(grid.set).toHaveBeenCalledWith('manualMaxWidth', '1100px', { silent: true })
    expect(grid.set).toHaveBeenCalledWith('manualGridTemplateColumns', 'repeat(4, 1fr)', {
      silent: true,
    })
  })
})
