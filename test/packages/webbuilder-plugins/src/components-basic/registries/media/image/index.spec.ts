import { describe, expect, it, vi } from 'vitest'
import { registerImageComponent, WB_IMAGE_TYPE } from '../../../../../../../../packages/webbuilder-plugins/src/components-basic/registries/media/image/index.js'

function registerImageForTest(selectedDeviceId = 'desktop') {
  let definition: any = null
  const editor = {
    Devices: {
      getSelected: vi.fn(() => ({
        get: (name: string) => (name === 'id' ? selectedDeviceId : undefined),
      })),
      get: vi.fn((deviceId: string) => ({
        getWidthMedia: () => (deviceId === 'mobile' ? '767px' : ''),
      })),
    },
    DomComponents: {
      getType: vi.fn(() => null),
      addType: vi.fn((_type: string, nextDefinition: any) => {
        definition = nextDefinition
      }),
    },
  }

  registerImageComponent(editor as any)

  expect(editor.DomComponents.addType).toHaveBeenCalledWith(WB_IMAGE_TYPE, expect.any(Object))
  return definition
}

function createModelHarness(definition: any, values: Record<string, unknown>) {
  const reset = vi.fn()
  const attributes: Record<string, string> = {}
  const styles: Record<string, string> = {}
  const state = {
    ...definition.model.defaults,
    ...values,
  }

  const model = {
    ...definition.model,
    ...definition.model.defaults,
    reset,
    get(name: string) {
      return state[name]
    },
    set(name: string, value: unknown) {
      state[name] = value
    },
    components() {
      return { reset, models: [] }
    },
    addAttributes(next: Record<string, string>) {
      Object.assign(attributes, next)
    },
    addStyle(next: Record<string, string>) {
      Object.assign(styles, next)
    },
  }

  return { reset, state, model }
}

describe('image component', () => {
  it('registers responsive image traits and renders picture source before img', () => {
    const definition = registerImageForTest()
    const traitNames = definition.model.defaults.traits.map((trait: any) => trait.name)

    expect(traitNames).toEqual(expect.arrayContaining(['imageSrc', 'imageMobileSrc']))
    expect(definition.model.defaults.imageMobileSrc).toBe('')

    const { model, reset } = createModelHarness(definition, {
      imageSrc: 'https://example.com/desktop.jpg',
      imageMobileSrc: 'https://example.com/mobile.jpg',
      imageAlt: 'Responsive product photo',
      imageObjectFit: 'contain',
    })

    definition.model._rebuildInner.call(model)

    const renderedTree = reset.mock.calls[0][0]
    expect(renderedTree).toHaveLength(1)
    expect(renderedTree[0]).toMatchObject({
      tagName: 'picture',
      attributes: { class: 'wb-image__picture' },
    })
    expect(renderedTree[0].components[0]).toMatchObject({
      tagName: 'source',
      attributes: {
        media: '(max-width: 767px)',
        srcset: 'https://example.com/mobile.jpg',
      },
    })
    expect(renderedTree[0].components[1]).toMatchObject({
      tagName: 'img',
      attributes: {
        src: 'https://example.com/desktop.jpg',
        alt: 'Responsive product photo',
      },
      style: expect.objectContaining({
        'object-fit': 'contain',
      }),
    })
  })

  it('wraps the responsive picture in a link without making inner nodes selectable', () => {
    const definition = registerImageForTest()
    const { model, reset } = createModelHarness(definition, {
      imageSrc: 'https://example.com/desktop.jpg',
      imageMobileSrc: 'https://example.com/mobile.jpg',
      imageLink: '/products',
      imageLinkTarget: '_self',
    })

    definition.model._rebuildInner.call(model)

    const renderedTree = reset.mock.calls[0][0]
    expect(renderedTree[0]).toMatchObject({
      tagName: 'a',
      selectable: false,
      layerable: false,
      attributes: {
        href: '/products',
        target: '_self',
      },
    })
    expect(renderedTree[0].components[0]).toMatchObject({
      tagName: 'picture',
      selectable: false,
      layerable: false,
    })
  })

  it('writes asset selections to the current device image source', () => {
    const definition = registerImageForTest('mobile')
    const { model, reset, state } = createModelHarness(definition, {
      imageSrc: 'https://example.com/desktop.jpg',
      imageMobileSrc: '',
    })

    definition.model._setImageForCurrentDevice.call(model, 'https://example.com/mobile-picked.jpg')
    definition.model._rebuildInner.call(model)

    expect(state.imageSrc).toBe('https://example.com/desktop.jpg')
    expect(state.imageMobileSrc).toBe('https://example.com/mobile-picked.jpg')
    const renderedTree = reset.mock.calls[0][0]
    expect(renderedTree[0].components[0]).toMatchObject({
      tagName: 'source',
      attributes: {
        media: '(max-width: 767px)',
        srcset: 'https://example.com/mobile-picked.jpg',
      },
    })
    expect(renderedTree[0].components[1]).toMatchObject({
      tagName: 'img',
      attributes: {
        src: 'https://example.com/desktop.jpg',
      },
    })
  })
})
