import { describe, expect, it } from 'vitest'

import {
  createProviderStyleManager,
  normalizeStyleSectors,
} from './useStyleSectors.js'

const createProperty = (
  overrides: {
    name: string
    label?: string
    type?: string
    value?: string
    options?: Array<Record<string, string>>
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
