import { describe, expect, it, vi } from 'vitest'
import { registerLanguageSwitcherComponent, WB_LANGUAGE_SWITCHER_TYPE } from './index'

describe('language switcher registry', () => {
  it('registers the component type and repairs empty saved switchers', () => {
    const addType = vi.fn()
    const addBlock = vi.fn()
    const editor = {
      DomComponents: {
        getType: vi.fn(() => undefined),
        addType
      },
      BlockManager: {
        add: addBlock
      }
    }

    registerLanguageSwitcherComponent(editor as any)

    expect(addType).toHaveBeenCalledWith(WB_LANGUAGE_SWITCHER_TYPE, expect.any(Object))
    const definition = addType.mock.calls[0][1]
    const reset = vi.fn()
    const component = {
      on: vi.fn(),
      get: vi.fn(() => ''),
      addAttributes: vi.fn(),
      syncLanguageSwitcherAttrs: definition.model.syncLanguageSwitcherAttrs,
      components: vi.fn(() => ({
        models: [],
        reset
      }))
    }

    definition.model.init.call(component)

    const repairedChildren = reset.mock.calls[0][0]
    expect(repairedChildren).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tagName: 'button',
          attributes: expect.objectContaining({
            'data-wb-language-toggle': 'true'
          })
        }),
        expect.objectContaining({
          tagName: 'div',
          attributes: expect.objectContaining({
            'data-wb-language-menu': 'true'
          })
        })
      ])
    )
  })

  it('does not repair switchers nested inside a button', () => {
    const addType = vi.fn()
    const editor = {
      DomComponents: {
        getType: vi.fn(() => undefined),
        addType
      },
      BlockManager: {
        add: vi.fn()
      }
    }

    registerLanguageSwitcherComponent(editor as any)

    const definition = addType.mock.calls[0][1]
    const reset = vi.fn()
    const buttonParent = {
      get: vi.fn((key: string) => (key === 'tagName' ? 'button' : '')),
      parent: vi.fn(() => null)
    }
    const component = {
      on: vi.fn(),
      get: vi.fn(() => ''),
      addAttributes: vi.fn(),
      syncLanguageSwitcherAttrs: definition.model.syncLanguageSwitcherAttrs,
      parent: vi.fn(() => buttonParent),
      components: vi.fn(() => ({
        models: [],
        reset
      }))
    }

    definition.model.init.call(component)

    expect(reset).not.toHaveBeenCalled()
  })
})
