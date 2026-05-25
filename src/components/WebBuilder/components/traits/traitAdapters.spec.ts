import { describe, expect, it, vi } from 'vitest'
import { registerPageLinkTrait } from './pageLinkTrait'
import { registerColorPickerTrait } from './colorPickerTrait'
import { registerCodeEditorTrait } from './codeEditorTrait'
import { registerImagePickerTrait } from './imagePickerTrait'
import { registerSvgIconPickerTrait } from './svgIconPickerTrait'

vi.mock('../../utils/traitDataSourceRegistry', () => ({
  dedupeTraitDataSourceOptions: (options: unknown[]) => options,
  getLocalPageLinkOptions: () => [],
  getTraitDataSourceRegistry: () => ({
    getCachedPageLinks: () => [],
    hasCachedPageLinks: () => true,
    loadPageLinks: async () => [],
    getCachedPostLinks: () => [],
    hasCachedPostLinks: () => true,
    loadPostLinks: async () => [],
    getCachedProductLinks: () => [],
    hasCachedProductLinks: () => true,
    loadProductLinks: async () => [],
  }),
}))

vi.mock('../../utils/traitBridge', () => ({
  openColorPicker: vi.fn(),
  getImageManager: vi.fn(),
}))

vi.mock('../../utils/svgIcon', () => ({
  fetchSvgMarkupFromUrl: vi.fn(),
  getSolarIconSvg: vi.fn(),
  searchSolarIcons: vi.fn(),
}))

vi.mock('@monaco-editor/loader', () => ({
  default: {
    init: vi.fn(),
  },
}))

function createEditorStub(existingTypes: string[] = []) {
  const registered = new Map<string, unknown>()
  const existing = new Set(existingTypes)

  return {
    editor: {
      TraitManager: {
        getType: (type: string) => existing.has(type) || registered.has(type),
        addType: (type: string, definition: unknown) => {
          registered.set(type, definition)
        },
      },
    },
    registered,
  }
}

describe('trait adapters', () => {
  it.each([
    ['page-link', registerPageLinkTrait],
    ['color-picker', registerColorPickerTrait],
    ['code-editor', registerCodeEditorTrait],
    ['image-picker', registerImagePickerTrait],
    ['svg-icon-picker', registerSvgIconPickerTrait],
  ])('registers %s once', (type, registerTrait) => {
    const { editor, registered } = createEditorStub()

    registerTrait(editor as any, {} as any)
    registerTrait(editor as any, {} as any)

    expect(registered.size).toBe(1)
    expect(registered.has(type)).toBe(true)
  })

  it.each([
    ['page-link', registerPageLinkTrait],
    ['color-picker', registerColorPickerTrait],
    ['code-editor', registerCodeEditorTrait],
    ['image-picker', registerImagePickerTrait],
    ['svg-icon-picker', registerSvgIconPickerTrait],
  ])('does not replace an existing %s type', (type, registerTrait) => {
    const { editor, registered } = createEditorStub([type])

    registerTrait(editor as any, {} as any)

    expect(registered.size).toBe(0)
  })
})
