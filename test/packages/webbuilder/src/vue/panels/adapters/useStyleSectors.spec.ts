import { describe, expect, it } from 'vitest'

import {
  createProviderStyleManager,
  normalizeStyleSectors,
} from '../../../../../../../packages/webbuilder/src/vue/panels/adapters/useStyleSectors.js'

const createProperty = (
  overrides: {
    name: string
    label?: string
    type?: string
    value?: string
    options?: Array<Record<string, string>>
    min?: unknown
    max?: unknown
    step?: unknown
  },
) => {
  let value = overrides.value ?? ''

  return {
    getName: () => overrides.name,
    getId: () => overrides.name,
    getType: () => overrides.type ?? 'base',
    getLabel: () => overrides.label ?? overrides.name,
    getValue: () => value,
    getDefaultValue: () => '',
    getOptions: () => overrides.options ?? [],
    getMin: () => overrides.min,
    getMax: () => overrides.max,
    getStep: () => overrides.step,
    upValue: (nextValue: string) => {
      value = nextValue
    },
    clear: () => {
      value = ''
    },
  }
}

const createSector = (properties: unknown[]) => ({
  getId: () => 'typography',
  getName: () => 'Typography',
  isOpen: () => true,
  getProperties: () => properties,
})

describe('useStyleSectors adapters', () => {
  it('normalizes Provider sectors to WebBuilder style sector props', () => {
    const color = createProperty({ name: 'color', label: 'Text color', type: 'color' })
    const display = createProperty({
      name: 'display',
      type: 'select',
      options: [
        { id: 'block', label: 'Block' },
        { id: 'flex', label: 'Flex' },
      ],
    })

    expect(normalizeStyleSectors([createSector([color, display]) as never])).toEqual([
      {
        id: 'typography',
        label: 'Typography',
        defaultOpen: true,
        properties: [
          expect.objectContaining({ id: 'color', label: 'Text color', type: 'color' }),
          expect.objectContaining({
            id: 'display',
            label: 'display',
            type: 'select',
            options: [
              { value: 'block', label: 'Block' },
              { value: 'flex', label: 'Flex' },
            ],
          }),
        ],
      },
    ])
  })

  it('maps GrapesJS style control types to package-owned control types', () => {
    const controls = [
      createProperty({ name: 'base-prop', type: 'base' }),
      createProperty({ name: 'count', type: 'integer' }),
      createProperty({ name: 'size', type: 'number' }),
      createProperty({ name: 'choice', type: 'radio' }),
      createProperty({ name: 'opacity', type: 'slider' }),
      createProperty({ name: 'asset', type: 'file' }),
      createProperty({ name: 'compound', type: 'composite' }),
      createProperty({ name: 'layers', type: 'stack' }),
    ]

    const [sector] = normalizeStyleSectors([createSector(controls) as never])

    expect(sector.properties).toEqual([
      expect.objectContaining({ id: 'base-prop', type: 'text' }),
      expect.objectContaining({ id: 'count', type: 'integer' }),
      expect.objectContaining({ id: 'size', type: 'number' }),
      expect.objectContaining({ id: 'choice', type: 'radio' }),
      expect.objectContaining({ id: 'opacity', type: 'slider' }),
      expect.objectContaining({ id: 'asset', type: 'file' }),
      expect.objectContaining({ id: 'compound', type: 'composite' }),
      expect.objectContaining({ id: 'layers', type: 'stack' }),
    ])
  })

  it('normalizes blank numeric constraints from GrapesJS providers', () => {
    const width = createProperty({
      name: 'width',
      type: 'number',
      min: '',
      max: '',
      step: '0.5',
    })

    const [sector] = normalizeStyleSectors([createSector([width]) as never])

    expect(sector.properties[0]).toEqual(expect.objectContaining({
      id: 'width',
      min: undefined,
      max: undefined,
      step: 0.5,
    }))
  })

  it('creates a style manager that writes through GrapesJS properties', () => {
    const color = createProperty({ name: 'color', value: '#111111' })
    const styleManager = createProviderStyleManager([createSector([color]) as never])

    expect(styleManager.getValue('color')).toBe('#111111')

    styleManager.setValue('color', '#2251ff')
    expect(styleManager.getValue('color')).toBe('#2251ff')

    styleManager.clearValue('color')
    expect(styleManager.getValue('color')).toBe('')
  })
})
