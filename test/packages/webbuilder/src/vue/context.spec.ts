import { describe, expect, it, vi } from 'vitest'

import { WEB_BUILDER_CONTEXT, useWebBuilderContext } from '../../../../../packages/webbuilder/src/vue/context.js'

describe('webbuilder vue context', () => {
  it('uses a stable injection key name', () => {
    expect(WEB_BUILDER_CONTEXT.description).toBe('webbuilder-context')
  })

  it('throws when consumed outside <WebBuilder>', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(() => useWebBuilderContext()).toThrow(
      'useWebBuilderContext must be used inside <WebBuilder>',
    )
    warn.mockRestore()
  })
})
