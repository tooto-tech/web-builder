import { describe, expect, it } from 'vitest'
import {
  REGISTRY_MANIFEST,
  assertUniqueRegistryTypes,
  getCoreRegistryEntries,
  getOptionalRegistryEntries,
  getRegistryEntryIds,
  type RegistryManifestEntry,
} from './registryManifest'

describe('registry manifest', () => {
  it('preserves registration ordering outside the editor execution path', () => {
    expect(getRegistryEntryIds().slice(0, 12)).toEqual([
      'trait:pageLink',
      'trait:inquiryType',
      'trait:menuTreeSelect',
      'trait:navbarMenuSelect',
      'trait:navbarThbMenuSelect',
      'trait:loopItemTemplate',
      'trait:hotspotShowcaseItems',
      'trait:flipbookPages',
      'trait:linkPatch',
      'layoutBase',
      'container',
      'section',
    ])

    expect(getRegistryEntryIds().slice(-7)).toEqual([
      'trait:customAttributes',
      'trait:colorPicker',
      'trait:codeEditor',
      'trait:imagePicker',
      'trait:svgIconPicker',
      'trait:iconRadio',
      'trait:footerMenuSelect',
    ])

    expect(getRegistryEntryIds().indexOf('cmsComponents')).toBeLessThan(
      getRegistryEntryIds().indexOf('loopGrid')
    )
    expect(getRegistryEntryIds().indexOf('inquiryForm')).toBeLessThan(
      getRegistryEntryIds().indexOf('contactBlock')
    )
  })

  it('classifies D5 core registries separately from optional section packs', () => {
    const coreIds = getCoreRegistryEntries().map(entry => entry.id)
    const optionalIds = getOptionalRegistryEntries().map(entry => entry.id)

    expect(coreIds).toEqual(expect.arrayContaining([
      'layoutBase',
      'container',
      'section',
      'grid',
      'heading',
      'textEditor',
      'image',
      'languageSwitcher',
      'carousel',
      'video',
      'pdfViewer',
      'cmsComponents',
      'loopGrid',
      'inquiryForm',
    ]))

    expect(optionalIds).toEqual(expect.arrayContaining([
      'historyTimeline',
      'productCardStrip',
      'statsCards',
      'contactBlock',
      'faqSection',
    ]))
    expect(coreIds).not.toContain('historyTimeline')
    expect(optionalIds).not.toContain('inquiryForm')
  })

  it('detects duplicate GrapesJS or trait type identifiers in manifest entries', () => {
    const duplicateManifest: RegistryManifestEntry[] = [
      {
        id: 'first',
        registeredTypes: ['wb-duplicate'],
        failurePolicy: 'core',
      },
      {
        id: 'second',
        registeredTypes: ['wb-duplicate'],
        failurePolicy: 'optional',
      },
    ]

    expect(() => assertUniqueRegistryTypes(duplicateManifest)).toThrow(
      'Duplicate registry type "wb-duplicate" in first and second'
    )
    expect(() => assertUniqueRegistryTypes(REGISTRY_MANIFEST)).not.toThrow()
  })
})
