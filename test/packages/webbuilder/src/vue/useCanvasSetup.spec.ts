import { describe, expect, it } from 'vitest'

import { useCanvasSetup } from '../../../../../packages/webbuilder/src/vue/useCanvasSetup.js'

class FakeClassList {
  private readonly values = new Set<string>()

  toggle(value: string, force?: boolean) {
    if (force === false) {
      this.values.delete(value)
      return false
    }
    if (force === true || !this.values.has(value)) {
      this.values.add(value)
      return true
    }
    this.values.delete(value)
    return false
  }
}

class FakeElement {
  id = ''
  textContent = ''
  innerHTML = ''
  lastElementChild: FakeElement | null = null
  readonly children: FakeElement[] = []
  readonly style: Record<string, string> = {}
  readonly classList = new FakeClassList()
  readonly listeners: Array<[string, EventListener]> = []

  appendChild(child: FakeElement) {
    this.children.push(child)
    this.lastElementChild = child
    return child
  }

  remove() {
    return undefined
  }

  setAttribute() {
    return undefined
  }

  addEventListener(event: string, listener: EventListener) {
    this.listeners.push([event, listener])
  }

  removeEventListener(event: string, listener: EventListener) {
    const index = this.listeners.findIndex(
      ([registeredEvent, registeredListener]) =>
        registeredEvent === event && registeredListener === listener,
    )
    if (index >= 0) this.listeners.splice(index, 1)
  }
}

class FakeDocument {
  readonly head = new FakeElement()
  readonly body = new FakeElement()
  readonly documentElement = new FakeElement()

  createElement() {
    return new FakeElement()
  }

  getElementById(id: string) {
    const all = [
      ...this.head.children,
      ...this.body.children,
    ]
    return all.find(child => child.id === id) ?? null
  }
}

const createEditor = () => {
  const document = new FakeDocument()
  const listeners: Array<[string, (...args: unknown[]) => void]> = []
  const removedListeners: Array<[string, (...args: unknown[]) => void]> = []
  const selected: unknown[] = []
  const appended: unknown[] = []

  const editor = {
    Canvas: {
      getDocument: () => document,
      getBody: () => document.body,
    },
    getWrapper: () => ({
      append(content: unknown) {
        appended.push(content)
        return content
      },
    }),
    select(value: unknown) {
      selected.push(value)
    },
    on(event: string, handler: (...args: unknown[]) => void) {
      listeners.push([event, handler])
    },
    off(event: string, handler: (...args: unknown[]) => void) {
      removedListeners.push([event, handler])
    },
  }

  return {
    editor,
    document,
    listeners,
    removedListeners,
    selected,
    appended,
  }
}

describe('useCanvasSetup', () => {
  it('registers and cleans up frame load and drag events', () => {
    const { editor, listeners, removedListeners } = createEditor()

    const cleanup = useCanvasSetup(editor as never)

    expect(listeners.map(([event]) => event)).toEqual([
      'block:drag:start',
      'block:drag:stop',
      'component:drag:start',
      'component:drag:end',
      'canvas:frame:load',
    ])

    cleanup()

    expect(removedListeners.map(([event]) => event)).toEqual([
      'block:drag:start',
      'block:drag:stop',
      'component:drag:start',
      'component:drag:end',
      'canvas:frame:load',
    ])
  })

  it('does not inject frame reset styles when frameReset is false', () => {
    const { editor, document } = createEditor()

    const cleanup = useCanvasSetup(editor as never, { frameReset: false })

    expect(document.getElementById('wb-canvas-frame-reset')).toBeNull()

    cleanup()
  })
})
