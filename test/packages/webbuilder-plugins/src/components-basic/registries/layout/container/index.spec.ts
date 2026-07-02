import { describe, expect, it, vi } from 'vitest'
import { createContainerBlockContent, registerContainerComponent, WB_CONTAINER_TYPE } from '../../../../../../../../packages/webbuilder-plugins/src/components-basic/registries/layout/container/index.js'

describe('container component block content', () => {
  it('creates boxed containers without a margin shorthand', () => {
    const content = createContainerBlockContent()

    expect(content.contentWidth).toBe('boxed')
    expect(content.boxedWidth).toBe(1280)
    expect(content.style).toMatchObject({
      'max-width': '1280px',
      'margin-left': 'auto',
      'margin-right': 'auto',
    })
    expect(content.style).not.toHaveProperty('margin')
  })

  it('lets caller style overrides win over width presets', () => {
    const content = createContainerBlockContent({
      boxedWidth: 1440,
      style: {
        'max-width': '960px',
        'margin-left': '24px',
      },
    })

    expect(content.boxedWidth).toBe(1440)
    expect(content.style).toMatchObject({
      'max-width': '960px',
      'margin-left': '24px',
      'margin-right': 'auto',
    })
  })

  it('does not re-apply width styles during model init', () => {
    let definition: any = null
    const editor = {
      DomComponents: {
        getType: vi.fn(() => null),
        addType: vi.fn((_type: string, nextDefinition: any) => {
          definition = nextDefinition
        }),
      },
    }

    registerContainerComponent(editor as any)

    expect(editor.DomComponents.addType).toHaveBeenCalledWith(WB_CONTAINER_TYPE, expect.any(Object))

    const model = {
      on: vi.fn(),
      applyWidthStyles: vi.fn(),
    }

    definition.model.init.call(model)

    expect(model.on).toHaveBeenCalledWith(
      'change:contentWidth change:boxedWidth change:widthValue change:widthUnit',
      definition.model.handleWidthTraitChange,
    )
    expect(model.applyWidthStyles).not.toHaveBeenCalled()
  })
})
