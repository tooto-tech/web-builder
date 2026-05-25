/**
 * Canvas 内部 Drop Zone
 * 在 GrapesJS canvas iframe 内部注入一个"添加组件"区域，
 * 始终显示在页面内容底部，不影响导出 HTML/CSS。
 */

import { createContainerBlockContent } from '../components/registries/layout/container'

const DROP_ZONE_ID = 'wb-canvas-drop-zone'
const STYLE_ID = 'wb-drop-zone-styles'

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
    /* 排除出 GrapesJS 选择 */
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

export function setupCanvasDropZone(editor: any): () => void {
  let observer: MutationObserver | null = null
  let dropZoneEl: HTMLElement | null = null
  let styleEl: HTMLStyleElement | null = null
  const eventHandlers: Array<[string, (...args: any[]) => void]> = []

  const iframeDoc = editor.Canvas.getDocument() as Document | null
  const iframeBody = editor.Canvas.getBody() as HTMLElement | null

  if (!iframeDoc || !iframeBody) {
    return () => {}
  }

  // 1. 注入样式到 iframe <head>（不用 editor.addStyle，避免导出）
  styleEl = iframeDoc.createElement('style')
  styleEl.id = STYLE_ID
  styleEl.textContent = DROP_ZONE_CSS
  iframeDoc.head.appendChild(styleEl)

  // 2. 创建 drop zone 元素
  dropZoneEl = iframeDoc.createElement('div')
  dropZoneEl.id = DROP_ZONE_ID
  dropZoneEl.setAttribute('data-wb-editor-only', 'true')
  // 排除出 GrapesJS 组件识别
  dropZoneEl.setAttribute('data-gjs-type', 'none')
  dropZoneEl.innerHTML = `<span class="wb-dz-icon">+</span><span>点击此处添加新组件</span>`
  iframeBody.appendChild(dropZoneEl)

  // 3. 点击 → 追加容器组件
  const handleClick = () => {
    const wrapper = editor.getWrapper()
    if (!wrapper) return
    const added = wrapper.append(createContainerBlockContent())
    if (Array.isArray(added) && added.length > 0) {
      editor.select(added[added.length - 1])
    } else if (added) {
      editor.select(added)
    }
  }
  dropZoneEl.addEventListener('click', handleClick)

  // 4. 拖拽高亮
  const setHighlight = (on: boolean) => {
    dropZoneEl?.classList.toggle('wb-drop-highlight', on)
  }

  const onDragStart = () => setHighlight(true)
  const onDragStop = () => setHighlight(false)

  editor.on('block:drag:start', onDragStart)
  editor.on('block:drag:stop', onDragStop)
  editor.on('component:drag:start', onDragStart)
  editor.on('component:drag:end', onDragStop)
  eventHandlers.push(
    ['block:drag:start', onDragStart],
    ['block:drag:stop', onDragStop],
    ['component:drag:start', onDragStart],
    ['component:drag:end', onDragStop],
  )

  // 5. MutationObserver — 确保 drop zone 始终在 body 最后
  const ensureLast = () => {
    if (dropZoneEl && iframeBody && iframeBody.lastElementChild !== dropZoneEl) {
      iframeBody.appendChild(dropZoneEl)
    }
  }

  observer = new MutationObserver(ensureLast)
  observer.observe(iframeBody, { childList: true })

  // 6. 返回 cleanup 函数
  return () => {
    // 移除事件
    dropZoneEl?.removeEventListener('click', handleClick)
    for (const [event, handler] of eventHandlers) {
      editor.off(event, handler)
    }
    // 断开 observer
    observer?.disconnect()
    observer = null
    // 移除 DOM
    dropZoneEl?.remove()
    dropZoneEl = null
    styleEl?.remove()
    styleEl = null
  }
}
