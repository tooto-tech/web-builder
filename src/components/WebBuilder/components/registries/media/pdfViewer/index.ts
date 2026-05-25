import type { Editor } from 'grapesjs'
import { getImageManager } from '@/components/WebBuilder/utils/traitBridge'
import { makeImagePickerTrait, makeNumberTrait, makeTextareaTrait, makeTextTrait } from '@/components/WebBuilder/utils/traitFactory'

export const WB_PDF_VIEWER_TYPE = 'wb-pdf-viewer'

const INNER_NODE = {
  selectable: false,
  hoverable: false,
  draggable: false,
  droppable: false,
  layerable: false,
  highlightable: false,
  copyable: false,
  removable: false,
  badgable: false,
} as const

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;">
  <path d="M7 3.75h6.25L18 8.5v11.75H7V3.75Z" />
  <path d="M13 3.75V8.5h5" />
  <path d="M9.5 13.25h5" />
  <path d="M9.5 16h3.25" />
</svg>`

const script = function (this: HTMLElement) {
  const root = this as HTMLElement & { __wbPdfViewerInit?: boolean; __wbPdfViewerReload?: () => void }
  const viewerEl = root.querySelector('.wb-pdf-viewer__viewer') as HTMLElement | null
  const canvas = root.querySelector('.wb-pdf-viewer__canvas') as HTMLCanvasElement | null
  const placeholder = root.querySelector('.wb-pdf-viewer__placeholder') as HTMLElement | null
  const loadingEl = root.querySelector('.wb-pdf-viewer__loading') as HTMLElement | null
  const pageInfo = root.querySelector('.wb-pdf-viewer__page-info') as HTMLElement | null
  const scaleInfo = root.querySelector('.wb-pdf-viewer__scale-info') as HTMLElement | null
  const prevBtn = root.querySelector('.wb-pdf-viewer__prev') as HTMLButtonElement | null
  const nextBtn = root.querySelector('.wb-pdf-viewer__next') as HTMLButtonElement | null
  const fitBtn = root.querySelector('.wb-pdf-viewer__fit') as HTMLButtonElement | null
  const zoomOutBtn = root.querySelector('.wb-pdf-viewer__zoom-out') as HTMLButtonElement | null
  const zoomInBtn = root.querySelector('.wb-pdf-viewer__zoom-in') as HTMLButtonElement | null

  if (!viewerEl || !canvas || !placeholder || !loadingEl || !pageInfo || !scaleInfo || !prevBtn || !nextBtn || !fitBtn || !zoomOutBtn || !zoomInBtn) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let pdfjsLib: any = null
  let pdfDoc: any = null
  let pageNum = 1
  let pageCount = 0
  let userZoom = 1
  let isRendering = false
  let pendingPageNum: number | null = null
  let activeUrl = ''

  function getPdfUrlFromQuery() {
    const params = new URLSearchParams(location.search)
    const raw = params.get('url') || params.get('src')
    if (!raw || !raw.trim()) return ''
    try {
      return new URL(raw.trim(), location.href).href
    } catch {
      return ''
    }
  }

  function getPdfUrl() {
    const raw = root.getAttribute('data-pdf-src') || getPdfUrlFromQuery()
    if (!raw || !raw.trim()) return ''
    try {
      return new URL(raw.trim(), location.href).href
    } catch {
      return raw.trim()
    }
  }

  function debounce(fn: () => void, ms: number) {
    let t: number | undefined
    return function () {
      window.clearTimeout(t)
      t = window.setTimeout(fn, ms)
    }
  }

  function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[char] || char
    })
  }

  function updatePlaceholder() {
    const text = root.getAttribute('data-placeholder') || 'Open a PDF via the component settings or the query string.'
    const hint = root.getAttribute('data-placeholder-hint') || 'Remote files require CORS on the host. Encode full URLs before passing them in url.'
    placeholder.innerHTML = '<p>' + escapeHtml(text) + '</p><p><code>?url=/path/to/document.pdf</code></p><p class="wb-pdf-viewer__placeholder-hint">' + escapeHtml(hint) + '</p>'
  }

  function updateButtons() {
    const hasPdf = !!pdfDoc
    prevBtn.disabled = !hasPdf || pageNum <= 1
    nextBtn.disabled = !hasPdf || pageNum >= pageCount
    fitBtn.disabled = !hasPdf
    zoomOutBtn.disabled = !hasPdf || userZoom <= 0.5
    zoomInBtn.disabled = !hasPdf || userZoom >= 3
  }

  function setLoading(loading: boolean, message?: string) {
    loadingEl.hidden = !loading
    root.classList.toggle('is-loading', loading)
    if (loading && message) {
      const text = loadingEl.querySelector('.wb-pdf-viewer__loading-text') as HTMLElement | null
      if (text) text.textContent = message
    }
  }

  function showEmpty() {
    pdfDoc = null
    pageNum = 1
    pageCount = 0
    userZoom = 1
    canvas.hidden = true
    placeholder.hidden = false
    setLoading(false)
    pageInfo.textContent = 'No PDF loaded'
    scaleInfo.textContent = '100%'
    updateButtons()
  }

  async function getPdfJs() {
    const win = window as any
    if (win.__wbPdfJsLib) return win.__wbPdfJsLib
    if (!win.__wbPdfJsLibPromise) {
      const pdfjsUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.mjs'
      // Keep the published component self-contained: hide dynamic import from Vite
      // so it won't rewrite it to __vite__injectQuery, which doesn't exist online.
      const nativeImport = new Function('url', 'return import(url)')
      win.__wbPdfJsLibPromise = nativeImport(pdfjsUrl).then((lib: any) => {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + lib.version + '/build/pdf.worker.mjs'
        win.__wbPdfJsLib = lib
        return lib
      })
    }
    return win.__wbPdfJsLibPromise
  }

  async function afterPdfLoaded() {
    pageNum = 1
    pageCount = pdfDoc.numPages
    userZoom = 1
    canvas.hidden = false
    placeholder.hidden = true
    updateButtons()
    await renderPage(pageNum)
  }

  async function loadPdfFromUrl(url: string) {
    pdfjsLib = await getPdfJs()
    const loadingTask = pdfjsLib.getDocument({ url })
    pdfDoc = await loadingTask.promise
    await afterPdfLoaded()
  }

  async function renderPage(num: number) {
    if (!pdfDoc) return
    if (isRendering) {
      pendingPageNum = num
      return
    }

    isRendering = true
    setLoading(true, 'Rendering page...')
    try {
      const page = await pdfDoc.getPage(num)
      const baseViewport = page.getViewport({ scale: 1 })
      const horizontalPad = window.matchMedia('(min-width: 640px)').matches ? 48 : 32
      const verticalPad = window.matchMedia('(min-width: 640px)').matches ? 48 : 32
      const availW = Math.max(160, viewerEl.clientWidth - horizontalPad)
      const availH = Math.max(160, viewerEl.clientHeight - verticalPad)
      const widthScale = availW / baseViewport.width
      const heightScale = availH / baseViewport.height
      const fitScale = Math.min(widthScale, heightScale)
      const scale = Math.min(Math.max(fitScale * userZoom, 0.2), 4)
      const viewport = page.getViewport({ scale })
      const outputScale = window.devicePixelRatio || 1

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = Math.floor(viewport.width) + 'px'
      canvas.style.height = Math.floor(viewport.height) + 'px'

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
      await page.render({ canvasContext: ctx, viewport, transform }).promise

      pageInfo.textContent = 'Page ' + pageNum + ' / ' + pageCount
      scaleInfo.textContent = Math.round(userZoom * 100) + '%'
      updateButtons()
    } catch (error) {
      console.error('[WebBuilder] PDF render failed', error)
      pageInfo.textContent = 'Failed to render PDF'
    } finally {
      isRendering = false
      if (pendingPageNum === null) setLoading(false)
    }

    if (pendingPageNum !== null) {
      const nextPage = pendingPageNum
      pendingPageNum = null
      await renderPage(nextPage)
    }
  }

  async function reloadPdf() {
    updatePlaceholder()
    const nextUrl = getPdfUrl()
    if (!nextUrl) {
      activeUrl = ''
      showEmpty()
      return
    }
    if (nextUrl === activeUrl && pdfDoc) return
    activeUrl = nextUrl
    pageInfo.textContent = 'Loading PDF...'
    setLoading(true, 'Loading PDF...')
    placeholder.hidden = true
    canvas.hidden = true
    try {
      await loadPdfFromUrl(nextUrl)
    } catch (error) {
      console.error('[WebBuilder] PDF load failed', error)
      pageInfo.textContent = 'Failed to load PDF'
      setLoading(false)
      placeholder.hidden = false
      canvas.hidden = true
      updateButtons()
    }
  }

  updatePlaceholder()
  updateButtons()

  if (root.__wbPdfViewerInit) {
    root.__wbPdfViewerReload?.()
    return
  }
  root.__wbPdfViewerInit = true
  root.__wbPdfViewerReload = function () {
    reloadPdf()
  }

  prevBtn.addEventListener('click', function () {
    if (pageNum <= 1) return
    pageNum--
    renderPage(pageNum)
  })
  nextBtn.addEventListener('click', function () {
    if (pageNum >= pageCount) return
    pageNum++
    renderPage(pageNum)
  })
  fitBtn.addEventListener('click', function () {
    userZoom = 1
    renderPage(pageNum)
  })
  zoomOutBtn.addEventListener('click', function () {
    userZoom = Math.max(0.5, Math.round((userZoom - 0.15) * 100) / 100)
    renderPage(pageNum)
  })
  zoomInBtn.addEventListener('click', function () {
    userZoom = Math.min(3, Math.round((userZoom + 0.15) * 100) / 100)
    renderPage(pageNum)
  })

  const onResize = debounce(function () {
    if (pdfDoc) renderPage(pageNum)
  }, 120)
  window.addEventListener('resize', onResize)
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize)

  const observer = new MutationObserver(function (mutations) {
    for (let i = 0; i < mutations.length; i++) {
      const attr = mutations[i].attributeName
      if (attr === 'data-pdf-src' || attr === 'data-placeholder' || attr === 'data-placeholder-hint') {
        reloadPdf()
        break
      }
    }
  })
  observer.observe(root, { attributes: true, attributeFilter: ['data-pdf-src', 'data-placeholder', 'data-placeholder-hint'] })

  reloadPdf()
}

export function registerPdfViewerComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_PDF_VIEWER_TYPE)) return

  domComponents.addType(WB_PDF_VIEWER_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'pdf-viewer'
        ? { type: WB_PDF_VIEWER_TYPE }
        : false,

    model: {
      defaults: {
        name: 'PDF 预览',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        resizable: {
          tl: 0, tc: 0, tr: 0,
          ml: 1, mr: 1,
          bl: 0, bc: 0, br: 1,
        },
        attributes: {
          'data-wb-component': 'pdf-viewer',
          'data-pdf-src': '',
          'data-placeholder': 'Open a PDF via the component settings or the query string.',
          'data-placeholder-hint': 'Remote files require CORS on the host. Encode full URLs before passing them in url.',
        },
        style: {
          display: 'block',
          width: '100%',
          'max-width': '100%',
          '--wb-pdf-viewer-height': '720px',
        },

        pdfSrc: '',
        viewerHeight: 720,
        placeholderText: 'Open a PDF via the component settings or the query string.',
        placeholderHint: 'Remote files require CORS on the host. Encode full URLs before passing them in url.',

        traits: [
          makeImagePickerTrait('PDF 文件地址', 'pdfSrc', { showPreview: false }),
          makeNumberTrait('预览高度(px)', 'viewerHeight', { min: 320, max: 2400, step: 20 }),
          makeTextTrait('空状态文案', 'placeholderText'),
          makeTextareaTrait('空状态提示', 'placeholderHint', { rows: 2 }),
        ],

        script,
        'script-export': script,

        styles: `
          .wb-pdf-viewer {
            --wb-pdf-viewer-height: 720px;
            --wb-pdf-viewer-toolbar-bg: #ffffff;
            --wb-pdf-viewer-border: #e5e7eb;
            --wb-pdf-viewer-text: #111827;
            --wb-pdf-viewer-muted: #6b7280;
            --wb-pdf-viewer-bg: #f4f4f5;
            box-sizing: border-box;
            width: 100%;
            color: var(--wb-pdf-viewer-text);
            background: var(--wb-pdf-viewer-bg);
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .wb-pdf-viewer *,
          .wb-pdf-viewer *::before,
          .wb-pdf-viewer *::after {
            box-sizing: border-box;
          }
          .wb-pdf-viewer__toolbar {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px 10px;
            padding: 10px 12px;
            background: var(--wb-pdf-viewer-toolbar-bg);
            border-bottom: 1px solid var(--wb-pdf-viewer-border);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          .wb-pdf-viewer__controls {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
          }
          .wb-pdf-viewer__info {
            flex: 1 1 100%;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px 12px;
            font-size: 13px;
            color: var(--wb-pdf-viewer-muted);
          }
          .wb-pdf-viewer__button {
            border: 1px solid #d1d5db;
            background: #fff;
            padding: 8px 14px;
            min-height: 40px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          .wb-pdf-viewer__button:hover:not(:disabled) {
            background: #f3f4f6;
          }
          .wb-pdf-viewer__button:active:not(:disabled) {
            background: #e5e7eb;
          }
          .wb-pdf-viewer__button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }
          .wb-pdf-viewer__viewer-wrap {
            min-height: var(--wb-pdf-viewer-height);
          }
          .wb-pdf-viewer__viewer {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: var(--wb-pdf-viewer-height);
            padding: 16px 12px;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
          }
          .wb-pdf-viewer__canvas {
            display: block;
            max-width: 100%;
            height: auto;
            background: #fff;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            border-radius: 4px;
          }
          .wb-pdf-viewer__loading {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            min-height: var(--wb-pdf-viewer-height);
            padding: 24px;
            color: var(--wb-pdf-viewer-muted);
            background: rgba(244, 244, 245, 0.82);
            backdrop-filter: blur(2px);
          }
          .wb-pdf-viewer__loading[hidden] {
            display: none;
          }
          .wb-pdf-viewer__spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #d1d5db;
            border-top-color: #2563eb;
            border-radius: 999px;
            animation: wb-pdf-viewer-spin 0.8s linear infinite;
          }
          .wb-pdf-viewer__loading-text {
            margin: 0;
            font-size: 14px;
            line-height: 1.4;
          }
          @keyframes wb-pdf-viewer-spin {
            to {
              transform: rotate(360deg);
            }
          }
          .wb-pdf-viewer__placeholder {
            max-width: 28rem;
            margin: 48px auto 0;
            padding: 0 16px;
            text-align: center;
            color: var(--wb-pdf-viewer-muted);
            font-size: 15px;
            line-height: 1.6;
          }
          .wb-pdf-viewer__placeholder code {
            font-size: 0.85em;
            padding: 2px 6px;
            background: #e5e7eb;
            border-radius: 4px;
            word-break: break-all;
          }
          .wb-pdf-viewer__placeholder-hint {
            margin-top: 1rem;
            font-size: 13px;
            opacity: 0.9;
          }
          @media (min-width: 640px) {
            .wb-pdf-viewer__toolbar {
              gap: 12px;
              padding: 12px 16px;
            }
            .wb-pdf-viewer__info {
              flex: 0 1 auto;
              margin-left: auto;
              justify-content: flex-end;
              font-size: 14px;
            }
            .wb-pdf-viewer__button {
              padding: 6px 12px;
              min-height: 36px;
              border-radius: 6px;
            }
            .wb-pdf-viewer__viewer {
              padding: 24px 16px;
            }
          }
        `,

        components: [
          {
            tagName: 'div',
            attributes: { class: 'wb-pdf-viewer__toolbar' },
            ...INNER_NODE,
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-pdf-viewer__controls' },
                ...INNER_NODE,
                components: [
                  { tagName: 'button', attributes: { class: 'wb-pdf-viewer__button wb-pdf-viewer__prev', type: 'button', disabled: 'true', 'aria-label': 'Previous page' }, content: 'Previous', ...INNER_NODE },
                  { tagName: 'button', attributes: { class: 'wb-pdf-viewer__button wb-pdf-viewer__next', type: 'button', disabled: 'true', 'aria-label': 'Next page' }, content: 'Next', ...INNER_NODE },
                  { tagName: 'button', attributes: { class: 'wb-pdf-viewer__button wb-pdf-viewer__fit', type: 'button', disabled: 'true', 'aria-label': 'Fit page' }, content: 'Fit page', ...INNER_NODE },
                  { tagName: 'button', attributes: { class: 'wb-pdf-viewer__button wb-pdf-viewer__zoom-out', type: 'button', disabled: 'true', 'aria-label': 'Zoom out' }, content: 'Zoom out', ...INNER_NODE },
                  { tagName: 'button', attributes: { class: 'wb-pdf-viewer__button wb-pdf-viewer__zoom-in', type: 'button', disabled: 'true', 'aria-label': 'Zoom in' }, content: 'Zoom in', ...INNER_NODE },
                ],
              },
              {
                tagName: 'div',
                attributes: { class: 'wb-pdf-viewer__info' },
                ...INNER_NODE,
                components: [
                  { tagName: 'span', attributes: { class: 'wb-pdf-viewer__page-info' }, content: 'No PDF loaded', ...INNER_NODE },
                  { tagName: 'span', attributes: { 'aria-hidden': 'true' }, content: '.', ...INNER_NODE },
                  {
                    tagName: 'span',
                    ...INNER_NODE,
                    components: [
                      { type: 'textnode', content: 'Zoom ' },
                      { tagName: 'span', attributes: { class: 'wb-pdf-viewer__scale-info' }, content: '100%', ...INNER_NODE },
                    ],
                  },
                ],
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-pdf-viewer__viewer-wrap' },
            ...INNER_NODE,
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-pdf-viewer__viewer' },
                ...INNER_NODE,
                components: [
                  { tagName: 'canvas', attributes: { class: 'wb-pdf-viewer__canvas', hidden: 'true' }, ...INNER_NODE },
                  {
                    tagName: 'div',
                    attributes: { class: 'wb-pdf-viewer__loading', hidden: 'true', 'aria-live': 'polite' },
                    ...INNER_NODE,
                    components: [
                      { tagName: 'span', attributes: { class: 'wb-pdf-viewer__spinner', 'aria-hidden': 'true' }, ...INNER_NODE },
                      { tagName: 'p', attributes: { class: 'wb-pdf-viewer__loading-text' }, content: 'Loading PDF...', ...INNER_NODE },
                    ],
                  },
                  {
                    tagName: 'div',
                    attributes: { class: 'wb-pdf-viewer__placeholder' },
                    ...INNER_NODE,
                    components: [
                      { tagName: 'p', content: 'Open a PDF via the component settings or the query string.', ...INNER_NODE },
                      { tagName: 'p', components: [{ tagName: 'code', content: '?url=/path/to/document.pdf', ...INNER_NODE }], ...INNER_NODE },
                      { tagName: 'p', attributes: { class: 'wb-pdf-viewer__placeholder-hint' }, content: 'Remote files require CORS on the host. Encode full URLs before passing them in url.', ...INNER_NODE },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      init(this: any) {
        this._restoreFromAttrs()
        this._syncDataAttrs()
        this.on('change:pdfSrc change:viewerHeight change:placeholderText change:placeholderHint', this._syncDataAttrs)
      },

      _restoreFromAttrs(this: any) {
        const attrs = this.getAttributes?.() || {}
        if (attrs['data-pdf-src'] !== undefined) this.set('pdfSrc', attrs['data-pdf-src'], { silent: true })
        if (attrs['data-placeholder'] !== undefined) this.set('placeholderText', attrs['data-placeholder'], { silent: true })
        if (attrs['data-placeholder-hint'] !== undefined) this.set('placeholderHint', attrs['data-placeholder-hint'], { silent: true })
        const style = this.getStyle?.() || {}
        const heightRaw = style['--wb-pdf-viewer-height'] || style.minHeight || ''
        const height = Number(String(heightRaw).replace('px', ''))
        if (Number.isFinite(height) && height > 0) this.set('viewerHeight', height, { silent: true })
      },

      _syncDataAttrs(this: any) {
        const height = Math.max(320, Number(this.get('viewerHeight')) || 720)
        this.addAttributes({
          'data-pdf-src': this.get('pdfSrc') || '',
          'data-placeholder': this.get('placeholderText') || '',
          'data-placeholder-hint': this.get('placeholderHint') || '',
        })
        this.addStyle({ '--wb-pdf-viewer-height': height + 'px' })
      },

      openAssetsDialog(this: any) {
        const im = getImageManager()
        if (!im) return
        im.openAssetsDialogWithTarget({
          selectCallback: (asset: any) => {
            const src = asset?.getSrc?.() ?? asset?.src ?? ''
            if (src) this.set('pdfSrc', src)
          },
        })
      },
    },

    view: {
      events() {
        return { dblclick: 'onDblClick' }
      },
      onDblClick(this: any, e: MouseEvent) {
        e.stopPropagation()
        this.model.openAssetsDialog()
      },
    },
  })

  editor.BlockManager?.add?.(WB_PDF_VIEWER_TYPE, {
    label: 'PDF 预览',
    category: 'Media',
    content: { type: WB_PDF_VIEWER_TYPE },
    media: BLOCK_ICON,
  })
}
