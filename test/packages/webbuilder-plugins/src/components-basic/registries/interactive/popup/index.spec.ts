import { describe, expect, it, vi } from 'vitest'
import { registerPopupComponent, WB_POPUP_TYPE } from '../../../../../../../../packages/webbuilder-plugins/src/components-basic/registries/interactive/popup/index.js'

describe('popup registry', () => {
  it('keeps the editor popup editable while exporting dialog-aware runtime assets', () => {
    let definition: any = null
    const editor = {
      DomComponents: {
        getType: vi.fn(() => null),
        addType: vi.fn((type: string, nextDefinition: any) => {
          if (type === WB_POPUP_TYPE) definition = nextDefinition
        }),
      },
      BlockManager: {
        add: vi.fn(),
      },
    }

    registerPopupComponent(editor as any)

    expect(definition.model.defaults.tagName).toBe('div')
    expect(`${definition.model.defaults.script}`).toContain('showModal')
    expect(`${definition.model.defaults.script}`).toContain('is-closing')
    expect(definition.model.defaults.styles).toContain('dialog.wb-popup::backdrop')
    expect(definition.model.defaults.styles).toContain('dialog.wb-popup[open].is-open')
  })
})
