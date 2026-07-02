import type { Editor } from 'grapesjs'

const FRAME_RESET_STYLE_ID = 'wb-canvas-frame-reset'
const DROP_ZONE_ID = 'wb-canvas-drop-zone'
const DROP_ZONE_STYLE_ID = 'wb-drop-zone-styles'

const DEFAULT_DROP_ZONE_CONTENT = `
  <section style="min-height:120px;padding:32px;text-align:center;">
    <p style="margin:0;color:#6b7280;font-family:Arial,sans-serif;">New section</p>
  </section>
`

const FRAME_RESET_CSS = `
  html {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    scrollbar-gutter: auto;
    scrollbar-width: auto;
    -ms-overflow-style: auto;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    min-height: 100% !important;
    overflow: visible !important;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    width: auto;
    height: auto;
  }
  html::-webkit-scrollbar-track,
  body::-webkit-scrollbar-track,
  html::-webkit-scrollbar-thumb,
  body::-webkit-scrollbar-thumb {
    background: initial;
  }
`

const DROP_ZONE_CSS = `
  body {
    min-height: 100vh;
  }
  #${DROP_ZONE_ID} {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 72px;
    margin: 16px 12px 12px;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    pointer-events: auto;
  }
  #${DROP_ZONE_ID}:hover {
    border-color: #60a5fa;
    color: #3b82f6;
    background: #eff6ff;
  }
  #${DROP_ZONE_ID}.wb-drop-highlight {
    border-color: #3b82f6;
    color: #2563eb;
    background: #dbeafe;
    border-style: solid;
  }
  #${DROP_ZONE_ID} .wb-dz-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
  }
`

export interface UseCanvasSetupOptions {
  frameReset?: boolean
  bottomDropZone?: boolean
  createBottomDropContent?: () => unknown
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

export const setupCanvasDropZone = (
  editor: Editor,
  options: Pick<UseCanvasSetupOptions, 'createBottomDropContent'> = {},
): () => void => {
  const frameDocument = editor.Canvas.getDocument()
  const frameBody = editor.Canvas.getBody()

  if (!frameDocument || !frameBody) return () => undefined

  ensureStyle(frameDocument, DROP_ZONE_STYLE_ID, DROP_ZONE_CSS)

  frameDocument.getElementById(DROP_ZONE_ID)?.remove()

  const dropZoneElement = frameDocument.createElement('div')
  dropZoneElement.id = DROP_ZONE_ID
  dropZoneElement.setAttribute('data-wb-editor-only', 'true')
  dropZoneElement.setAttribute('data-gjs-type', 'none')
  dropZoneElement.innerHTML = '<span class="wb-dz-icon">+</span><span>点击此处添加新组件</span>'
  frameBody.appendChild(dropZoneElement)

  const handleClick = () => {
    const wrapper = editor.getWrapper()
    if (!wrapper) return

    const added = wrapper.append(
      options.createBottomDropContent?.() ?? DEFAULT_DROP_ZONE_CONTENT,
    )
    if (Array.isArray(added) && added.length > 0) {
      editor.select(added[added.length - 1])
      return
    }
    if (added) {
      editor.select(added)
    }
  }

  dropZoneElement.addEventListener('click', handleClick)

  const setHighlight = (enabled: boolean) => {
    dropZoneElement.classList.toggle('wb-drop-highlight', enabled)
  }

  const onDragStart = () => setHighlight(true)
  const onDragStop = () => setHighlight(false)

  const editorHandlers: Array<[string, (...args: unknown[]) => void]> = [
    ['block:drag:start', onDragStart],
    ['block:drag:stop', onDragStop],
    ['component:drag:start', onDragStart],
    ['component:drag:end', onDragStop],
  ]

  editorHandlers.forEach(([event, handler]) => editor.on(event, handler))

  const MutationObserverCtor =
    frameDocument.defaultView?.MutationObserver ??
    globalThis.MutationObserver
  const observer = MutationObserverCtor
    ? new MutationObserverCtor(() => {
      if (frameBody.lastElementChild !== dropZoneElement) {
        frameBody.appendChild(dropZoneElement)
      }
    })
    : null

  observer?.observe(frameBody, { childList: true })

  return () => {
    dropZoneElement.removeEventListener('click', handleClick)
    editorHandlers.forEach(([event, handler]) => editor.off(event, handler))
    observer?.disconnect()
    dropZoneElement.remove()
    frameDocument.getElementById(DROP_ZONE_STYLE_ID)?.remove()
  }
}

export const useCanvasSetup = (
  editor: Editor,
  options: UseCanvasSetupOptions = {},
): () => void => {
  const frameReset = options.frameReset !== false
  const bottomDropZone = options.bottomDropZone !== false
  let dropZoneCleanup: (() => void) | null = null

  const setupForFrame = (eventData?: unknown) => {
    if (frameReset) {
      applyCanvasFrameDocumentReset(editor, eventData)
    }
    if (bottomDropZone) {
      dropZoneCleanup?.()
      dropZoneCleanup = setupCanvasDropZone(editor, options)
    }
  }

  setupForFrame()

  const handleFrameLoad = (eventData?: unknown) => {
    setupForFrame(eventData)
  }

  editor.on('canvas:frame:load', handleFrameLoad)

  return () => {
    dropZoneCleanup?.()
    dropZoneCleanup = null
    editor.off('canvas:frame:load', handleFrameLoad)
  }
}
