import { describe, expect, it, vi } from 'vitest'
import { registerDynamicHtmlBlock } from './htmlBlock'
import { WB_CMS_DYN_HTML_TYPE } from '../constants'

const createEditor = () => {
  let definition: any = null
  const editor = {
    DomComponents: {
      getType: vi.fn(() => null),
      addType: vi.fn((_type: string, def: any) => {
        definition = def
      })
    },
    on: vi.fn()
  }
  return { editor, getDefinition: () => definition }
}

const createModel = (initial: Record<string, any> = {}) => {
  const props: Record<string, any> = { ...initial }
  let attrs: Record<string, string> = {}
  const trait = { set: vi.fn() }
  const model = {
    get: vi.fn((key: string) => props[key]),
    set: vi.fn((key: string, value: any) => {
      props[key] = value
    }),
    getAttributes: vi.fn(() => attrs),
    addAttributes: vi.fn((next: Record<string, string>) => {
      attrs = { ...attrs, ...next }
    }),
    setAttributes: vi.fn((next: Record<string, string>) => {
      attrs = { ...next }
    }),
    getTrait: vi.fn(() => trait),
    on: vi.fn(),
    parent: vi.fn(() => null),
    em: { trigger: vi.fn() },
    __props: props,
    __trait: trait
  }
  return model
}

describe('cms dynamic html block', () => {
  it('offers html fields plus the same dynamic data source kinds as dynamic text', () => {
    const { editor, getDefinition } = createEditor()
    registerDynamicHtmlBlock(editor)

    expect(editor.DomComponents.addType).toHaveBeenCalledWith(
      WB_CMS_DYN_HTML_TYPE,
      expect.any(Object)
    )

    const model = createModel()
    getDefinition().model.init.call(model)
    const options = model.__trait.set.mock.calls.find(([key]) => key === 'options')?.[1] || []
    const values = options.map((option: any) => option.value)

    expect(values).toContain('post.content')
    expect(values).toContain('post.name')
    expect(values).toContain('post.url')
    expect(values).toContain('post.views')
    expect(values).toContain('post.tagNames')
    expect(values).not.toContain('post.image')
    expect(values).not.toContain('post.publishTime')
  })

  it('clears unsupported saved fields on init', () => {
    const { editor, getDefinition } = createEditor()
    registerDynamicHtmlBlock(editor)

    const model = createModel({ dynField: 'post.image' })
    getDefinition().model.init.call(model)

    expect(model.__props.dynField).toBe('')
  })
})
