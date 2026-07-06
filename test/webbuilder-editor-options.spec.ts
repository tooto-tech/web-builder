import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WEB_BUILDER_CANVAS_FRAME_STYLE,
  resolveWebBuilderOptions,
} from '@toototech/webbuilder/core'
import { FRAME_RESET_CSS } from '../packages/webbuilder/src/vue/useCanvasSetup'

describe('resolveWebBuilderOptions', () => {
  it('does not customize canvas scrollbars by default', () => {
    const resolved = resolveWebBuilderOptions()

    expect(resolved.grapesjs.canvas).toMatchObject({
      frameStyle: DEFAULT_WEB_BUILDER_CANVAS_FRAME_STYLE,
    })
    expect(DEFAULT_WEB_BUILDER_CANVAS_FRAME_STYLE).not.toContain('::-webkit-scrollbar')
    expect(DEFAULT_WEB_BUILDER_CANVAS_FRAME_STYLE).not.toContain('scrollbar-width')
  })

  it('allows hosts to override canvas frameStyle', () => {
    const resolved = resolveWebBuilderOptions({
      canvas: {
        frameStyle: 'html::-webkit-scrollbar { width: 32px; }',
      },
    })

    expect(resolved.grapesjs.canvas).toMatchObject({
      frameStyle: 'html::-webkit-scrollbar { width: 32px; }',
    })
  })

  it('does not override frameStyle scrollbar rules during frame reset', () => {
    expect(FRAME_RESET_CSS).not.toContain('::-webkit-scrollbar')
    expect(FRAME_RESET_CSS).not.toContain('scrollbar-width')
  })
})
