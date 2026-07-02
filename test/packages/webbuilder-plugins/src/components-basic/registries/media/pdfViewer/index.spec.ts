import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('../../../../../../../../packages/webbuilder-plugins/src/components-basic/registries/media/pdfViewer/index.ts', import.meta.url)), 'utf8')

describe('pdf viewer component', () => {
  it('fits each rendered page inside both viewer width and height by default', () => {
    expect(source).toContain('const availH = Math.max(160, viewerNode.clientHeight - verticalPad)')
    expect(source).toContain('const widthScale = availW / baseViewport.width')
    expect(source).toContain('const heightScale = availH / baseViewport.height')
    expect(source).toContain('const fitScale = Math.min(widthScale, heightScale)')
  })

  it('labels the default reset action as fitting the full page', () => {
    expect(source).toContain("content: 'Fit page'")
    expect(source).toContain("'aria-label': 'Fit page'")
    expect(source).not.toContain("content: 'Fit width'")
    expect(source).not.toContain("'aria-label': 'Fit to width'")
  })
})
