import type { Editor, Component } from 'grapesjs'

type AosWindow = Window & {
  AOS?: {
    init: (opts?: Record<string, unknown>) => void
    refresh: () => void
    refreshHard?: () => void
  }
}

type AosTraitPluginOptions = {
  categoryName?: string
  traitNames?: {
    enabled: string
    type: string
    delay: string
  }
  aosOptions?: Array<{ id: string; label: string }>
  /** Options forwarded to AOS.init() inside the canvas */
  aosInitOptions?: Record<string, unknown>
  /** Override AOS CSS CDN URL */
  cssUrl?: string
  /** Override AOS JS CDN URL */
  jsUrl?: string
}

const DEFAULT_AOS_OPTIONS = [
  { id: 'fade', label: 'fade' },
  { id: 'fade-up', label: 'fade-up' },
  { id: 'fade-down', label: 'fade-down' },
  { id: 'fade-left', label: 'fade-left' },
  { id: 'fade-right', label: 'fade-right' },
  { id: 'fade-up-right', label: 'fade-up-right' },
  { id: 'fade-up-left', label: 'fade-up-left' },
  { id: 'fade-down-right', label: 'fade-down-right' },
  { id: 'fade-down-left', label: 'fade-down-left' },
  { id: 'flip-up', label: 'flip-up' },
  { id: 'flip-down', label: 'flip-down' },
  { id: 'flip-left', label: 'flip-left' },
  { id: 'flip-right', label: 'flip-right' },
  { id: 'slide-up', label: 'slide-up' },
  { id: 'slide-down', label: 'slide-down' },
  { id: 'slide-left', label: 'slide-left' },
  { id: 'slide-right', label: 'slide-right' },
  { id: 'zoom-in', label: 'zoom-in' },
  { id: 'zoom-in-up', label: 'zoom-in-up' },
  { id: 'zoom-in-down', label: 'zoom-in-down' },
  { id: 'zoom-in-left', label: 'zoom-in-left' },
  { id: 'zoom-in-right', label: 'zoom-in-right' },
  { id: 'zoom-out', label: 'zoom-out' },
  { id: 'zoom-out-up', label: 'zoom-out-up' },
  { id: 'zoom-out-down', label: 'zoom-out-down' },
  { id: 'zoom-out-left', label: 'zoom-out-left' },
  { id: 'zoom-out-right', label: 'zoom-out-right' },
]

/** IDs for injected nodes — prevent double-injection */
const AOS_CSS_ID = 'tooto-aos-css'
const AOS_JS_ID  = 'tooto-aos-js'

export default function grapesjsAosTraits(
  editor: Editor,
  opts: AosTraitPluginOptions = {}
) {
  const categoryName = opts.categoryName || '动画'
  const traitNames = {
    enabled: 'data-anim-enabled',
    type: 'data-aos',
    delay: 'data-aos-delay',
    ...(opts.traitNames || {}),
  }

  const aosOptions    = opts.aosOptions    || DEFAULT_AOS_OPTIONS
  const cssUrl        = opts.cssUrl        || 'https://unpkg.com/aos/dist/aos.css'
  const jsUrl         = opts.jsUrl         || 'https://unpkg.com/aos/dist/aos.js'
  const aosInitOptions: Record<string, unknown> = {
    duration: 800,
    once: false,
    ...(opts.aosInitOptions || {}),
  }

  /** 防止对同一 component 重复绑定事件 */
  const aosListenersBound = new WeakMap<Component, true>()

  // ── Trait definitions ─────────────────────────────────────────────────────

  const enabledTrait = {
    type: 'checkbox',
    name: traitNames.enabled,
    label: '启用动画',
    category: categoryName,
  }

  const typeTrait = {
    type: 'select',
    name: traitNames.type,
    label: 'AOS 动画类型',
    category: categoryName,
    options: aosOptions,
  }

  const delayTrait = {
    type: 'number',
    name: traitNames.delay,
    label: '动画延迟(ms)',
    category: categoryName,
    min: 0,
    step: 50,
    placeholder: '0',
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isWrapperLike = (cmp?: Component | null) => {
    if (!cmp) return true
    if (cmp.is('wrapper')) return true
    return cmp.get('tagName') === 'body';

  }

  const isValidTarget = (cmp?: Component | null) => {
    if (!cmp || isWrapperLike(cmp)) return false
    const type = cmp.get('type')
    return !(type === 'textnode' || type === 'comment');

  }

  const hasTrait = (cmp: Component, name: string) => !!cmp.getTrait(name)

  const refreshTraitPanelIfSelected = (cmp: Component) => {
    if (editor.getSelected() === cmp) {
      editor.TraitManager.select(cmp)
    }
  }

  const getAttrRecord = (cmp: Component): Record<string, unknown> => {
    const raw = cmp.getAttributes()
    if (raw == null || typeof raw !== 'object') return {}
    return raw as Record<string, unknown>
  }

  const getEnabled = (cmp: Component) => {
    const attrs = getAttrRecord(cmp)
    const val = attrs[traitNames.enabled]
    return val === true || val === 'true' || val === 1 || val === '1'
  }

  const ensureBaseTrait = (cmp: Component) => {
    if (!hasTrait(cmp, traitNames.enabled)) {
      cmp.addTrait([enabledTrait])
    }
  }

  const ensureAdvancedTraits = (cmp: Component) => {
    if (!hasTrait(cmp, traitNames.type)) {
      cmp.addTrait([typeTrait])
    }
    if (!hasTrait(cmp, traitNames.delay)) {
      cmp.addTrait([delayTrait])
    }

    const attrs = getAttrRecord(cmp)
    if (!attrs[traitNames.type]) {
      cmp.addAttributes({ [traitNames.type]: aosOptions[0]?.id || 'fade-up' })
    }
    if (
      attrs[traitNames.delay] === undefined ||
      attrs[traitNames.delay] === null ||
      attrs[traitNames.delay] === ''
    ) {
      cmp.addAttributes({ [traitNames.delay]: '0' })
    }
  }

  const removeAdvancedTraits = (cmp: Component) => {
    cmp.removeTrait([traitNames.type, traitNames.delay])
    cmp.removeAttributes([traitNames.type, traitNames.delay])
  }

  const syncTraits = (cmp?: Component | null) => {
    if (!isValidTarget(cmp)) return
    const component = cmp as Component

    // Wrap all model mutations in UndoManager.stop/start.
    // addTrait / removeTrait / addAttributes / removeAttributes are config-level
    // operations driven by a trait toggle — they are NOT direct user edits and
    // must not be recorded in the undo history.  Without this guard, GrapesJS'
    // internal event loop (Frames._onModelEvent → addToStack → triggerEvents →
    // Frames._onModelEvent) recurses infinitely and throws RangeError.
    const um = (editor as any).UndoManager
    um?.stop()
    try {
      ensureBaseTrait(component)

      if (getEnabled(component)) {
        ensureAdvancedTraits(component)
      } else {
        removeAdvancedTraits(component)
      }
    } finally {
      um?.start()
    }

    refreshTraitPanelIfSelected(component)
  }

  const bindListeners = (cmp?: Component | null) => {
    if (!isValidTarget(cmp)) return
    const component = cmp as Component

    if (aosListenersBound.has(component)) return
    aosListenersBound.set(component, true)

    component.on(`change:attributes:${traitNames.enabled}`, () => {
      syncTraits(component)
      scheduleAosRefresh()
    })
  }

  const decorateComponent = (cmp?: Component | null) => {
    if (!isValidTarget(cmp)) return
    bindListeners(cmp)
    syncTraits(cmp)
  }

  const decorateTree = (root?: Component | null) => {
    if (!root) return
    root.onAll((cmp: Component) => decorateComponent(cmp))
  }

  // ── AOS canvas injection ──────────────────────────────────────────────────

  const getCanvasDoc = (): Document | null =>
    (editor.Canvas?.getDocument() as Document | undefined) ?? null

  const getCanvasWin = (): AosWindow | null =>
    (editor.Canvas?.getWindow() as AosWindow | undefined) ?? null

  /** Call AOS.init() inside the canvas iframe */
  const triggerAosInit = () => {
    getCanvasWin()?.AOS?.init(aosInitOptions)
  }

  /** Call AOS.refreshHard() (or refresh()) inside the canvas iframe */
  const triggerAosRefreshHard = () => {
    const win = getCanvasWin()
    if (!win?.AOS) return
    if (win.AOS.refreshHard) {
      win.AOS.refreshHard()
    } else {
      win.AOS.refresh()
    }
  }

  /**
   * Inject AOS CSS + JS into the active canvas iframe and initialise AOS.
   * Safe to call multiple times — uses element IDs to prevent duplication.
   */
  const injectAosResources = () => {
    const doc = getCanvasDoc()
    if (!doc) return

    // ── CSS ──
    if (!doc.getElementById(AOS_CSS_ID)) {
      const link = doc.createElement('link')
      link.id   = AOS_CSS_ID
      link.rel  = 'stylesheet'
      link.href = cssUrl
      doc.head.appendChild(link)
    }

    // ── JS ──
    const win = getCanvasWin()
    if (win?.AOS) {
      // Script already loaded — just (re-)initialise
      triggerAosInit()
    } else if (!doc.getElementById(AOS_JS_ID)) {
      const script    = doc.createElement('script')
      script.id       = AOS_JS_ID
      script.src      = jsUrl
      script.onload   = triggerAosInit
      doc.head.appendChild(script)
    }
    // Edge case: script tag exists but AOS not yet on window — onload will fire
  }

  /** Debounced refresh so rapid component changes don't hammer AOS */
  let _refreshTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleAosRefresh = () => {
    if (_refreshTimer) clearTimeout(_refreshTimer)
    _refreshTimer = setTimeout(() => {
      triggerAosRefreshHard()
      _refreshTimer = null
    }, 200)
  }

  // ── Editor events ─────────────────────────────────────────────────────────

  editor.on('load', () => {
    injectAosResources()
    decorateTree(editor.getWrapper())
  })

  // After storage re-loads (e.g. page reload restores saved data), new DOM
  // elements exist that AOS hasn't observed yet — force a hard refresh.
  editor.on('storage:end:load', () => {
    scheduleAosRefresh()
  })

  // Each GrapesJS page has its own iframe; re-inject when the active page changes.
  editor.on('page:select', () => {
    // Give the new frame a tick to finish loading before injecting
    setTimeout(() => {
      injectAosResources()
      decorateTree(editor.getWrapper())
    }, 150)
  })

  editor.on('component:add', (cmp: Component) => {
    decorateComponent(cmp)
    scheduleAosRefresh()
  })

  editor.on('component:selected', (cmp: Component) => {
    decorateComponent(cmp)
  })

  // Re-scan whenever any attribute/style changes (covers enabling AOS on a cmp)
  editor.on('component:update', scheduleAosRefresh)

  // Expose config so the publish pipeline can inject AOS resources into the
  // generated HTML (canvas injection only affects the editor iframe).
  ;(editor as any)._wbAosConfig = {
    cssUrl,
    jsUrl,
    initScript: `AOS.init(${JSON.stringify(aosInitOptions)})`,
  }
}
