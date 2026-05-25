import { describe, expect, it, vi } from 'vitest'
import { getPost } from '@/api/content/post/index'
import { registerCmsPostLatest } from './latest'

vi.mock('@/api/content/post/index', () => ({
  getPost: vi.fn(),
  getPostPage: vi.fn(),
}))

class FakeComponent {
  attrs: Record<string, string>
  content = ''
  children: FakeComponent[]
  props: Record<string, unknown>

  constructor(options: {
    attrs?: Record<string, string>
    children?: FakeComponent[]
    props?: Record<string, unknown>
  }) {
    this.attrs = options.attrs ?? {}
    this.children = options.children ?? []
    this.props = options.props ?? {}
  }

  get(key: string) {
    return this.props[key]
  }

  set(key: string, value: unknown) {
    if (key === 'content') {
      this.content = String(value ?? '')
      return
    }
    this.props[key] = value
  }

  getAttributes() {
    return this.attrs
  }

  addAttributes(attrs: Record<string, string>) {
    this.attrs = { ...this.attrs, ...attrs }
  }

  components() {
    return {
      models: this.children,
      length: this.children.length,
      reset: (children: FakeComponent[]) => {
        this.children = children
      },
    }
  }
}

function getLatestCardModel() {
  const types = new Map<string, any>()
  const editor = {
    DomComponents: {
      getType: vi.fn((type: string) => types.get(type)),
      addType: vi.fn((type: string, definition: any) => {
        types.set(type, definition)
      }),
    },
  }

  registerCmsPostLatest(editor as any)

  return types.get('wb-cms-post-latest-card').model
}

describe('cms post latest card', () => {
  it('keeps selected post title excerpt and cover empty instead of using placeholders', async () => {
    vi.mocked(getPost).mockResolvedValue({
      post: {
        id: 42,
        image: '',
        imageAlt: '',
        publishTime: '2026-05-01T00:00:00Z',
        contents: [{ name: '', excerpt: '' }],
      },
    } as any)

    const image = new FakeComponent({ attrs: { class: 'wb-post-latest__image' } })
    const title = new FakeComponent({ attrs: { class: 'wb-post-latest__title-link' } })
    const excerpt = new FakeComponent({ attrs: { class: 'wb-post-latest__desc' } })
    const date = new FakeComponent({ attrs: { class: 'wb-post-latest__date' } })
    const model = new FakeComponent({
      props: { postId: '42' },
      children: [image, title, excerpt, date],
    })

    await getLatestCardModel()._loadPostData.call(model)

    expect(image.attrs.src).toBe('')
    expect(image.attrs.alt).toBe('')
    expect(title.content).toBe('')
    expect(excerpt.content).toBe('')
  })
})
