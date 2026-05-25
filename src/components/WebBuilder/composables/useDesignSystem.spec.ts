import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGlobalColorsStore } from '@/store/modules/globalColors'
import { useGlobalCustomCssStore } from '@/store/modules/globalCustomCss'
import { useGlobalTypographyStore } from '@/store/modules/globalTypography'
import useDesignSystem from './useDesignSystem'

interface FakeDocumentResult {
  doc: Document
  elements: Map<string, any>
}

const makeFakeDocument = (): FakeDocumentResult => {
  const elements = new Map<string, any>()
  const appendChild = vi.fn((el: any) => {
    if (el.id) elements.set(el.id, el)
    return el
  })
  const head = {
    appendChild,
    querySelector: vi.fn(() => null),
  }
  const doc: any = {
    head,
    documentElement: { appendChild },
    createElement: vi.fn(() => ({
      id: '',
      textContent: '',
      rel: '',
      href: '',
      setAttribute(key: string, value: string) {
        this[key] = value
      },
      remove() {
        if (this.id) elements.delete(this.id)
      },
    })),
    getElementById: vi.fn((id: string) => elements.get(id) ?? null),
  }
  return { doc: doc as Document, elements }
}

const makeGrapes = () => {
  const initHandlers: Array<(editor: any) => void> = []
  return {
    _cache: {} as Record<string, any>,
    onInit: vi.fn((handler: (editor: any) => void) => {
      initHandlers.push(handler)
    }),
    emitInit(editor: any) {
      initHandlers.forEach((handler) => handler(editor))
    },
    initHandlers,
  }
}

const makeEditor = (canvasDoc: Document) => {
  const handlers = new Map<string, Array<(eventData?: any) => void>>()
  return {
    Canvas: { getDocument: vi.fn(() => canvasDoc) },
    on: vi.fn((event: string, handler: (eventData?: any) => void) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler])
    }),
    trigger(event: string, eventData?: any) {
      handlers.get(event)?.forEach((handler) => handler(eventData))
    },
  }
}

describe('useDesignSystem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useRealTimers()
  })

  it('syncs colors, typography, and custom css after the editor is ready', () => {
    const main = makeFakeDocument()
    const canvas = makeFakeDocument()
    vi.stubGlobal('document', main.doc)

    useGlobalColorsStore().$patch({
      colors: [{ id: 'brand', name: 'Brand', value: '#123456' }],
    })
    useGlobalTypographyStore().setGlobalFont('Inter')
    useGlobalCustomCssStore().setCss('.hero { color: red; }')

    const grapes = makeGrapes()
    const editor = makeEditor(canvas.doc)
    const designSystem = useDesignSystem(grapes)

    expect(designSystem.isReady.value).toBe(false)

    grapes.emitInit(editor)

    expect(designSystem.isReady.value).toBe(true)
    expect(main.elements.get('wb-global-colors')?.textContent).toContain('--wb-gc-brand: #123456')
    expect(main.elements.has('wb-global-custom-css')).toBe(false)
    expect(canvas.elements.get('wb-global-colors')?.textContent).toContain('--wb-gc-brand: #123456')
    expect(canvas.elements.get('wb-global-font-family')?.textContent).toContain('Inter, sans-serif')
    expect(canvas.elements.get('wb-global-custom-css')?.textContent).toBe('.hero { color: red; }')
  })

  it('keeps syncing store updates and frame loads through one cached facade', async () => {
    const main = makeFakeDocument()
    const canvas = makeFakeDocument()
    const frame = makeFakeDocument()
    vi.stubGlobal('document', main.doc)

    const colorsStore = useGlobalColorsStore()
    const customCssStore = useGlobalCustomCssStore()
    colorsStore.$patch({ colors: [{ id: 'brand', name: 'Brand', value: '#123456' }] })
    customCssStore.setCss('.before { color: red; }')

    const grapes = makeGrapes()
    const editor = makeEditor(canvas.doc)
    const designSystem = useDesignSystem(grapes)

    expect(useDesignSystem(grapes)).toBe(designSystem)
    expect(grapes.initHandlers).toHaveLength(1)

    grapes.emitInit(editor)
    colorsStore.updateColor('brand', { value: '#abcdef' })
    customCssStore.setCss('.after { color: blue; }')
    await nextTick()

    expect(canvas.elements.get('wb-global-colors')?.textContent).toContain('--wb-gc-brand: #abcdef')
    expect(canvas.elements.get('wb-global-custom-css')?.textContent).toBe('.after { color: blue; }')

    editor.trigger('canvas:frame:load', {
      frame: { view: { getDocument: () => frame.doc } },
    })

    expect(frame.elements.get('wb-global-colors')?.textContent).toContain('--wb-gc-brand: #abcdef')
    expect(frame.elements.get('wb-global-custom-css')?.textContent).toBe('.after { color: blue; }')
  })

  it('does not throw when the editor canvas is not ready yet', async () => {
    const main = makeFakeDocument()
    vi.stubGlobal('document', main.doc)
    useGlobalColorsStore().$patch({
      colors: [{ id: 'brand', name: 'Brand', value: '#123456' }],
    })

    const grapes = makeGrapes()
    const editor = {
      Canvas: {
        getDocument: vi.fn(() => {
          throw new Error('canvas not ready')
        }),
      },
      on: vi.fn(),
    }
    const designSystem = useDesignSystem(grapes)

    expect(() => grapes.emitInit(editor)).not.toThrow()
    useGlobalCustomCssStore().setCss('.after { color: blue; }')
    await nextTick()

    expect(designSystem.isReady.value).toBe(true)
    expect(main.elements.get('wb-global-colors')?.textContent).toContain('--wb-gc-brand: #123456')
  })
})
