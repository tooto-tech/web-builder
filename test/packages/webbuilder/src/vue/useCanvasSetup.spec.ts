import { describe, expect, it } from 'vitest'

import { useCanvasSetup } from '../../../../../packages/webbuilder/src/vue/useCanvasSetup.js'

class FakeElement {
  id = ''
  textContent = ''
  readonly children: FakeElement[] = []
  readonly style: Record<string, string> = {}

  appendChild(child: FakeElement) {
    this.children.push(child)
    return child
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

  const editor = {
    Canvas: {
      getDocument: () => document,
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
  }
}

describe('useCanvasSetup', () => {
  it('registers and cleans up only the frame load event', () => {
    const { editor, document, listeners, removedListeners } = createEditor()

    const cleanup = useCanvasSetup(editor as never)

    expect(listeners.map(([event]) => event)).toEqual(['canvas:frame:load'])
    expect(document.getElementById('wb-canvas-drop-zone')).toBeNull()
    expect(document.getElementById('wb-drop-zone-styles')).toBeNull()

    cleanup()

    expect(removedListeners.map(([event]) => event)).toEqual(['canvas:frame:load'])
  })

  it('does not inject frame reset styles when frameReset is false', () => {
    const { editor, document } = createEditor()

    const cleanup = useCanvasSetup(editor as never, { frameReset: false })

    expect(document.getElementById('wb-canvas-frame-reset')).toBeNull()

    cleanup()
  })
})
