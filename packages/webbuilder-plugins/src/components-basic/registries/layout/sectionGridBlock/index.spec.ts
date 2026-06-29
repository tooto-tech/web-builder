import { describe, expect, it, vi } from 'vitest'

import { registerSectionGridBlockComponent } from './index.js'

describe('registerSectionGridBlockComponent', () => {
  it('registers the legacy section background type used by saved project data', () => {
    const editor = {
      DomComponents: {
        getType: vi.fn(() => undefined),
        addType: vi.fn(),
      },
      BlockManager: {
        add: vi.fn(),
      },
      on: vi.fn(),
    }

    registerSectionGridBlockComponent(editor as any)

    expect(editor.DomComponents.addType).toHaveBeenCalledWith(
      'wb-section-bg',
      expect.any(Object),
    )
  })
})
