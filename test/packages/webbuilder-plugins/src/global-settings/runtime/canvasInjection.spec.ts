import { describe, expect, it } from 'vitest'

import {
  GLOBAL_SETTINGS_STYLE_IDS,
  injectGlobalSettingsIntoDocument,
} from '../../../../../../packages/webbuilder-plugins/src/global-settings/runtime/canvasInjection.js'
import type { GlobalSettingsSnapshot } from '@toototech/webbuilder/core'

class FakeElement {
  id = ''
  rel = ''
  href = ''
  textContent = ''
  private readonly attributes = new Map<string, string>()
  private parent: FakeHead | null = null

  constructor(readonly tagName: string) {}

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }

  attachTo(parent: FakeHead) {
    this.parent = parent
  }

  remove() {
    this.parent?.removeChild(this)
    this.parent = null
  }
}

class FakeHead {
  readonly children: FakeElement[] = []

  appendChild(element: FakeElement) {
    this.children.push(element)
    element.attachTo(this)
    return element
  }

  removeChild(element: FakeElement) {
    const index = this.children.indexOf(element)
    if (index >= 0) {
      this.children.splice(index, 1)
    }
  }

  insertBefore(element: FakeElement, reference: FakeElement | null) {
    if (!reference) {
      return this.appendChild(element)
    }
    const index = this.children.indexOf(reference)
    if (index < 0) {
      return this.appendChild(element)
    }
    this.children.splice(index, 0, element)
    element.attachTo(this)
    return element
  }

  querySelector(selector: string) {
    const googleFontMatch = selector.match(/^link\[data-wb-gf="([^"]+)"\]$/)
    if (googleFontMatch) {
      return (
        this.children.find(
          element =>
            element.tagName === 'link' &&
            element.getAttribute('data-wb-gf') === googleFontMatch[1]
        ) ?? null
      )
    }
    const customCodeMatch = selector.match(
      /^template\[data-wb-global-custom-code-position="([^"]+)"\]$/
    )
    if (customCodeMatch) {
      return (
        this.children.find(
          element =>
            element.tagName === 'template' &&
            element.getAttribute('data-wb-global-custom-code-position') === customCodeMatch[1]
        ) ?? null
      )
    }
    return null
  }
}

class FakeDocument {
  readonly head = new FakeHead()
  readonly body = new FakeHead()
  readonly documentElement = new FakeHead()

  createElement(tagName: string) {
    return new FakeElement(tagName)
  }

  getElementById(id: string) {
    return this.head.children.find(element => element.id === id) ?? null
  }
}

const createSnapshot = (
  overrides: Partial<GlobalSettingsSnapshot> = {}
): GlobalSettingsSnapshot => ({
  colors: [{ id: 'brand', value: '#ff0000' }],
  typography: {
    fontFamily: 'Inter',
    googleName: 'Inter',
    headingStyles: {
      h1: {
        fontFamily: '',
        fontSize: '48px',
        lineHeight: '1.1',
        fontWeight: '700',
        textTransform: 'none',
        fontStyle: 'normal',
        textDecoration: 'none',
        letterSpacing: '0px',
      },
    },
  },
  customCss: '.demo { color: var(--wb-gc-brand); }',
  customCode: [],
  ...overrides,
})

describe('global settings canvas injection', () => {
  it('injects color variables, typography CSS, custom CSS, and google font link', () => {
    const doc = new FakeDocument()

    injectGlobalSettingsIntoDocument(doc as unknown as Document, createSnapshot())

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.colors)?.textContent).toContain(
      '--wb-gc-brand: #ff0000;'
    )
    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.typography)?.textContent).toContain(
      '--wb-global-font-family: Inter, sans-serif;'
    )
    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.customCss)?.textContent).toBe(
      '.demo { color: var(--wb-gc-brand); }'
    )
    expect(doc.head.querySelector('link[data-wb-gf="Inter"]')?.href).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    )
  })

  it('updates existing style tags and cleanup removes injected nodes', () => {
    const doc = new FakeDocument()
    const cleanup = injectGlobalSettingsIntoDocument(
      doc as unknown as Document,
      createSnapshot({ customCss: '' })
    )

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.customCss)).toBeNull()
    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.colors)).not.toBeNull()

    cleanup()

    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.colors)).toBeNull()
    expect(doc.getElementById(GLOBAL_SETTINGS_STYLE_IDS.typography)).toBeNull()
    expect(doc.head.querySelector('link[data-wb-gf="Inter"]')).toBeNull()
  })

  it('injects enabled custom code snippets as inert templates without executing scripts', () => {
    const doc = new FakeDocument()
    const cleanup = injectGlobalSettingsIntoDocument(
      doc as unknown as Document,
      createSnapshot({
        customCode: [
          {
            id: 'analytics',
            label: 'Analytics',
            position: 'head',
            enabled: true,
            code: '<script>window.analyticsLoaded = true</script>',
          },
          {
            id: 'disabled',
            label: 'Disabled',
            position: 'head',
            enabled: false,
            code: '<script>window.disabledLoaded = true</script>',
          },
          {
            id: 'body-start',
            label: 'Body start',
            position: 'body-start',
            enabled: true,
            code: '<div data-banner="top"></div>',
          },
          {
            id: 'body-end',
            label: 'Body end',
            position: 'body-end',
            enabled: true,
            code: '<script>window.tailLoaded = true</script>',
          },
        ],
      })
    )

    const headTemplate = doc.head.querySelector(
      'template[data-wb-global-custom-code-position="head"]'
    )
    const bodyStartTemplate = doc.body.querySelector(
      'template[data-wb-global-custom-code-position="body-start"]'
    )
    const bodyEndTemplate = doc.body.querySelector(
      'template[data-wb-global-custom-code-position="body-end"]'
    )

    expect(headTemplate?.textContent).toContain('<script>window.analyticsLoaded = true</script>')
    expect(headTemplate?.textContent).not.toContain('disabledLoaded')
    expect(bodyStartTemplate?.textContent).toBe('<div data-banner="top"></div>')
    expect(bodyEndTemplate?.textContent).toContain('<script>window.tailLoaded = true</script>')
    expect(doc.head.children.some(element => element.tagName === 'script')).toBe(false)
    expect(doc.body.children.some(element => element.tagName === 'script')).toBe(false)

    cleanup()

    expect(doc.head.querySelector('template[data-wb-global-custom-code-position="head"]')).toBeNull()
    expect(
      doc.body.querySelector('template[data-wb-global-custom-code-position="body-start"]')
    ).toBeNull()
    expect(
      doc.body.querySelector('template[data-wb-global-custom-code-position="body-end"]')
    ).toBeNull()
  })
})
