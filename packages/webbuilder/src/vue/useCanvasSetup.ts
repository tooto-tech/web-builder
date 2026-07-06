import type { Editor } from 'grapesjs'

const FRAME_RESET_STYLE_ID = 'wb-canvas-frame-reset'

export const FRAME_RESET_CSS = `
  html {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    scrollbar-gutter: auto;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    min-height: 100% !important;
    overflow: visible !important;
  }
`

export interface UseCanvasSetupOptions {
  frameReset?: boolean
}

const getFrameDocument = (editor: Editor, eventData?: unknown): Document | null => {
  const frame = (eventData as { frame?: unknown } | undefined)?.frame ?? eventData
  const frameView = (frame as { view?: { el?: HTMLIFrameElement; getDocument?: () => Document | null } } | undefined)?.view

  return (
    frameView?.el?.contentDocument ??
    frameView?.getDocument?.() ??
    editor.Canvas.getDocument() ??
    null
  )
}

const ensureStyle = (document: Document, id: string, css: string) => {
  const existing = document.getElementById(id)
  if (existing) return existing

  const style = document.createElement('style')
  style.id = id
  style.textContent = css
  document.head.appendChild(style)
  return style
}

export const applyCanvasFrameDocumentReset = (
  editor: Editor,
  eventData?: unknown,
) => {
  const frameDocument = getFrameDocument(editor, eventData)
  if (!frameDocument) return

  ensureStyle(frameDocument, FRAME_RESET_STYLE_ID, FRAME_RESET_CSS)

  const htmlElement = frameDocument.documentElement
  const bodyElement = frameDocument.body

  if (htmlElement) {
    htmlElement.style.margin = '0'
    htmlElement.style.padding = '0'
    htmlElement.style.overflowX = 'hidden'
    htmlElement.style.overflowY = 'auto'
    htmlElement.style.scrollbarGutter = 'auto'
  }

  if (bodyElement) {
    bodyElement.style.margin = '0'
    bodyElement.style.padding = '0'
    bodyElement.style.minHeight = '100%'
    bodyElement.style.overflow = 'visible'
  }
}

export const useCanvasSetup = (
  editor: Editor,
  options: UseCanvasSetupOptions = {},
): () => void => {
  const frameReset = options.frameReset !== false

  const setupForFrame = (eventData?: unknown) => {
    if (frameReset) {
      applyCanvasFrameDocumentReset(editor, eventData)
    }
  }

  setupForFrame()

  const handleFrameLoad = (eventData?: unknown) => {
    setupForFrame(eventData)
  }

  editor.on('canvas:frame:load', handleFrameLoad)

  return () => {
    editor.off('canvas:frame:load', handleFrameLoad)
  }
}
