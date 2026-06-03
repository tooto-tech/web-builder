import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { extractGoogleFontLinks } from './useGoogleFonts.js'

describe('global-settings Google Fonts utilities', () => {
  it('extracts Google Font links from CSS font-family declarations', () => {
    expect(
      extractGoogleFontLinks(`
        .hero { font-family: "Inter", sans-serif; }
        .title { font-family: 'Playfair Display', serif; }
      `)
    ).toEqual([
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700&display=swap',
    ])
  })

  it('does not hardcode a Google Fonts API key in the package source', () => {
    const source = readFileSync(
      fileURLToPath(new URL('./useGoogleFonts.ts', import.meta.url)),
      'utf-8'
    )

    expect(source).not.toContain(['AI', 'za'].join(''))
  })
})
