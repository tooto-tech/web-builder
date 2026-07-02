import { describe, expect, it } from 'vitest'

import { normalizeTraitRows } from '../../../../../../../packages/webbuilder/src/vue/panels/adapters/useTraitRows.js'

const createTrait = (
  overrides: {
    name: string
    type?: string
    label?: string
    value?: unknown
    placeholder?: string
    ui?: Record<string, unknown>
    options?: Array<Record<string, unknown>>
  },
) => {
  let value = overrides.value ?? ''

  return {
    getId: () => overrides.name,
    getName: () => overrides.name,
    getType: () => overrides.type ?? 'text',
    getLabel: () => overrides.label ?? overrides.name,
    get: (key: string) => {
      if (key === 'placeholder') return overrides.placeholder
      if (key === 'ui') return overrides.ui
      return undefined
    },
    getValue: () => value,
    getDefault: () => '',
    getOptions: () => overrides.options ?? [],
    setValue: (nextValue: unknown) => {
      value = nextValue
    },
  }
}

describe('useTraitRows adapters', () => {
  it('normalizes TraitsProvider models into Vue field rows', () => {
    const rows = normalizeTraitRows([
      createTrait({ name: 'href', type: 'text', label: 'Href', value: '/about' }) as never,
      createTrait({
        name: 'target',
        type: 'select',
        options: [
          { id: '_self', label: 'Same tab' },
          { id: '_blank', label: 'New tab' },
        ],
      }) as never,
    ])

    expect(rows).toEqual([
      expect.objectContaining({
        id: 'href',
        name: 'href',
        type: 'text',
        label: 'Href',
        value: '/about',
      }),
      expect.objectContaining({
        id: 'target',
        name: 'target',
        type: 'select',
        options: [
          { value: '_self', label: 'Same tab' },
          { value: '_blank', label: 'New tab' },
        ],
      }),
    ])
  })

  it('writes field changes back to the source trait', () => {
    const trait = createTrait({ name: 'alt', value: 'Before' })
    const [row] = normalizeTraitRows([trait as never])

    row.setValue('After')

    expect(normalizeTraitRows([trait as never])[0].value).toBe('After')
  })

  it('preserves metadata required by package-owned special trait fields', () => {
    const rows = normalizeTraitRows([
      createTrait({
        name: 'heroImage',
        type: 'image-picker',
        value: 'https://cdn.example.com/hero.png',
        placeholder: 'https://example.com/image.png',
        ui: { showPreview: true, filterType: 'svg' },
      }) as never,
      createTrait({
        name: 'href',
        type: 'page-link',
        value: '/about',
        placeholder: 'https://example.com',
      }) as never,
      createTrait({
        name: 'customHtml',
        type: 'code-editor',
        value: '<section />',
        ui: { language: 'html' },
      }) as never,
      createTrait({
        name: 'iconSvg',
        type: 'svg-icon-picker',
        value: '<svg />',
        ui: { sourceName: 'iconSource' },
      }) as never,
    ])

    expect(rows.map(row => row.kind)).toEqual([
      'image',
      'page-link',
      'code',
      'svg-icon',
    ])
    expect(rows[0]).toEqual(expect.objectContaining({
      placeholder: 'https://example.com/image.png',
      ui: { showPreview: true, filterType: 'svg' },
    }))
    expect(rows[1]).toEqual(expect.objectContaining({
      placeholder: 'https://example.com',
    }))
    expect(rows[2]).toEqual(expect.objectContaining({
      language: 'html',
    }))
    expect(rows[3]).toEqual(expect.objectContaining({
      sourceName: 'iconSource',
    }))
  })
})
