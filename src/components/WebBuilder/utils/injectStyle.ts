/**
 * 向 GrapesJS editor 注入全局 CSS，保证每个 key 只注入一次。
 * 使用 editor.__wbStyles Map 跟踪已注入的样式，避免污染 editor 对象的任意属性。
 *
 * 同时注入到：
 * 1. editor.addStyle() — 用于发布/导出时的 CSS 输出
 * 2. canvas iframe <head> — 用于编辑器画布中的实时预览
 */
export function injectStyleOnce(editor: any, key: string, css: string): void {
  const styles: Map<string, boolean> = (editor.__wbStyles ??= new Map())
  if (styles.has(key)) return
  styles.set(key, true)

  // 1. 注入到编辑器 CSS 输出（发布/导出用）
  editor.addStyle?.(css)

  // 2. 收集所有需要注入的 CSS（供 canvas:frame:load 时批量注入）
  const pending: Array<{ key: string; css: string }> = (editor.__wbPendingStyles ??= [])
  pending.push({ key, css })

  // 只在第一次调用时注册事件监听
  if (!editor.__wbStyleListenersReady) {
    editor.__wbStyleListenersReady = true

    // canvas:frame:load — 每次 iframe 加载时注入所有已注册的 CSS
    editor.on('canvas:frame:load', (eventData: any) => {
      // 从事件参数获取 frame document（避免 Canvas.getDocument() 指向旧 frame）
      const frame = eventData?.frame ?? eventData
      const frameDoc: Document | null | undefined =
        frame?.view?.el?.contentDocument ?? frame?.view?.getDocument?.()

      if (frameDoc) {
        injectAllToDoc(frameDoc, pending)
      }

      // 兜底：延迟后通过 Canvas API 再注入一次
      setTimeout(() => {
        try {
          const canvasDoc = editor.Canvas?.getDocument?.()
          if (canvasDoc) injectAllToDoc(canvasDoc, pending)
        } catch (_e) { /* ignore */ }
      }, 80)
    })

    // page:select — 切换页面时新 frame 需要重新注入
    editor.on('page:select', () => {
      setTimeout(() => {
        try {
          const canvasDoc = editor.Canvas?.getDocument?.()
          if (canvasDoc) injectAllToDoc(canvasDoc, pending)
        } catch (_e) { /* ignore */ }
      }, 100)
    })
  }

  // 立即尝试注入（如果 canvas 已就绪）
  try {
    const canvasDoc = editor.Canvas?.getDocument?.()
    if (canvasDoc) injectOneToDoc(canvasDoc, key, css)
  } catch (_e) { /* canvas not ready yet, will be injected on frame load */ }
}

/**
 * 读取通过 injectStyleOnce 注册的发布样式。
 * 这类样式会注入编辑器 iframe，但在 component 级别 getCss({ component }) 场景下
 * 可能不会完整出现在导出结果里，因此发布和代码预览需要手动补入。
 */
export function getInjectedPublishCss(editor: any, html = '', existingCss = ''): string {
  const pending = Array.isArray(editor?.__wbPendingStyles) ? editor.__wbPendingStyles : []
  const markup = `${html || ''}`
  const currentCss = `${existingCss || ''}`

  return pending
    .map((item: any) => ({
      key: `${item?.key || ''}`.trim(),
      css: `${item?.css || ''}`.trim(),
    }))
    .filter((item: { key: string; css: string }) => !!item.css)
    .filter((item: { key: string; css: string }) => !item.key || !markup || markup.includes(item.key))
    .map((item: { key: string; css: string }) => item.css)
    .filter((css: string) => !currentCss.includes(css))
    .join('\n\n')
}

/**
 * 仅向画布 iframe 注入 CSS，不写入 editor CSS 输出/项目 schema。
 * 适用于网格辅助线这类纯编辑器预览样式。
 */
export function injectCanvasStyleOnce(editor: any, key: string, css: string): void {
  const styles: Map<string, boolean> = (editor.__wbCanvasStyles ??= new Map())
  if (styles.has(key)) return
  styles.set(key, true)

  const pending: Array<{ key: string; css: string }> = (editor.__wbCanvasPendingStyles ??= [])
  pending.push({ key, css })

  if (!editor.__wbCanvasStyleListenersReady) {
    editor.__wbCanvasStyleListenersReady = true

    editor.on('canvas:frame:load', (eventData: any) => {
      const frame = eventData?.frame ?? eventData
      const frameDoc: Document | null | undefined =
        frame?.view?.el?.contentDocument ?? frame?.view?.getDocument?.()

      if (frameDoc) {
        injectAllToDoc(frameDoc, pending)
      }

      setTimeout(() => {
        try {
          const canvasDoc = editor.Canvas?.getDocument?.()
          if (canvasDoc) injectAllToDoc(canvasDoc, pending)
        } catch (_e) { /* ignore */ }
      }, 80)
    })

    editor.on('page:select', () => {
      setTimeout(() => {
        try {
          const canvasDoc = editor.Canvas?.getDocument?.()
          if (canvasDoc) injectAllToDoc(canvasDoc, pending)
        } catch (_e) { /* ignore */ }
      }, 100)
    })
  }

  try {
    const canvasDoc = editor.Canvas?.getDocument?.()
    if (canvasDoc) injectOneToDoc(canvasDoc, key, css)
  } catch (_e) { /* canvas not ready yet */ }
}

/** 将所有已注册的 CSS 注入到指定 document 的 <head> 中 */
function injectAllToDoc(doc: Document, items: Array<{ key: string; css: string }>): void {
  for (const item of items) {
    injectOneToDoc(doc, item.key, item.css)
  }
}

/** 将单条 CSS 注入到指定 document 的 <head> 中（去重） */
function injectOneToDoc(doc: Document, key: string, css: string): void {
  const styleId = `wb-style-${key}`
  if (doc.getElementById(styleId)) return

  const styleEl = doc.createElement('style')
  styleEl.id = styleId
  styleEl.textContent = css
  doc.head.appendChild(styleEl)
}
