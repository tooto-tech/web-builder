import type { Editor } from 'grapesjs'

export const WB_PROCESS_TIMELINE_TYPE = 'wb-process-timeline'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 12h16" />
  <path d="M6 12v-4" />
  <path d="M10 12v4" />
  <path d="M14 12v-4" />
  <path d="M18 12v4" />
  <circle cx="4" cy="12" r="1.5" />
  <circle cx="10" cy="12" r="1.5" />
  <circle cx="14" cy="12" r="1.5" />
  <circle cx="20" cy="12" r="1.5" />
</svg>`

const DEFAULT_TITLE = 'Customization Process'

const TEXT_STYLABLE_PROPS = [
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration'
] as const

const DEFAULT_STEPS = [
  {
    step: 'STEP 1',
    title: 'Requirement Discussion',
    meta: '[1-2 business days]'
  },
  {
    step: 'STEP 2',
    title: 'Design Proposal & Drawing',
    meta: '[2-5 business days]'
  },
  {
    step: 'STEP 3',
    title: 'Sample Production & Confirmation',
    meta: '[7-15 days]'
  },
  {
    step: 'STEP 4',
    title: 'Mass Production',
    meta: '[25-45 days]'
  },
  {
    step: 'STEP 5',
    title: 'Quality Inspection',
    meta: '[2-3 days]'
  },
  {
    step: 'STEP 6',
    title: 'Shipping & Delivery',
    meta: '[15-35 days]'
  }
] as const

const DESKTOP_INSET_PERCENT = 1.5

function makeProcessTimelineScript() {
  return function () {
    const root = this as HTMLElement & {
      __wbProcessTimelineObserver?: IntersectionObserver | null
      __wbProcessTimelineCleanup?: (() => void) | null
    }
    if (!root) return

    root.classList.remove('is-visible')

    root.__wbProcessTimelineCleanup?.()

    const reveal = () => {
      requestAnimationFrame(() => {
        root.classList.add('is-visible')
      })
    }

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      reveal()
      root.__wbProcessTimelineCleanup = null
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) return
        reveal()
        observer.disconnect()
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    observer.observe(root)

    root.__wbProcessTimelineObserver = observer
    root.__wbProcessTimelineCleanup = () => {
      observer.disconnect()
      root.__wbProcessTimelineObserver = null
      root.__wbProcessTimelineCleanup = null
    }
  }
}

const PROCESS_TIMELINE_CSS = `
  .wb-process-timeline {
    width: 100%;
    padding: 96px 0 88px;
    background: #ffffff;
    box-sizing: border-box;
  }
  .wb-process-timeline,
  .wb-process-timeline *,
  .wb-process-timeline *::before,
  .wb-process-timeline *::after {
    box-sizing: border-box;
  }
  .wb-process-timeline__inner {
    width: 100%;
    max-width: 1720px;
    margin: 0 auto;
    padding: 0 56px;
  }
  .wb-process-timeline__title {
    margin: 0 0 88px;
    color: #000a11;
    text-align: center;
    font-size: clamp(42px, 4vw, 74px);
    line-height: 1.08;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .wb-process-timeline__rail {
    position: relative;
    min-height: 560px;
  }
  .wb-process-timeline__rail::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: #003152;
    transform: translateY(-50%);
    z-index: 0;
    transform-origin: left center;
    transition:
      opacity 700ms ease,
      transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wb-process-timeline__item {
    position: absolute;
    top: 50%;
    width: 0;
    height: 0;
    transform: translate(-50%, -50%);
    z-index: 2;
    --wb-process-delay: 0ms;
  }
  .wb-process-timeline__anchor {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: #003152;
    transform: translate(-50%, -50%);
    z-index: 3;
    transition:
      opacity 420ms ease,
      transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wb-process-timeline__stem {
    position: absolute;
    left: 0;
    width: 1px;
    height: 46px;
    background: #c7d0d6;
    transform: translateX(-50%);
    z-index: 1;
    transition:
      opacity 460ms ease,
      transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wb-process-timeline__item--top .wb-process-timeline__stem {
    top: -52px;
  }
  .wb-process-timeline__item--bottom .wb-process-timeline__stem {
    top: 6px;
  }
  .wb-process-timeline__card {
    position: absolute;
    left: -28px;
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 4;
    transition:
      opacity 520ms ease,
      transform 760ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wb-process-timeline__item--top .wb-process-timeline__card {
    top: -252px;
  }
  .wb-process-timeline__item--bottom .wb-process-timeline__card {
    top: 52px;
    left: -72px;
  }
  .wb-process-timeline__item[data-wb-process-index='6'] .wb-process-timeline__card {
    left: -212px;
  }
  .wb-process-timeline__step {
    margin: 0;
    color: #003152;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0;
    text-transform: uppercase;
    font-variation-settings: 'opsz' auto;
  }
  .wb-process-timeline__heading {
    margin: 0;
    color: #000a11;
    font-size: 24px;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0;
    font-variation-settings: 'opsz' auto;
    text-wrap: balance;
  }
  .wb-process-timeline__meta {
    margin: 0;
    color: #768389;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: 0;
    font-variation-settings: 'opsz' auto;
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__title {
    opacity: 0;
    transform: translateY(22px);
  }
  .wb-process-timeline.is-visible .wb-process-timeline__title {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 560ms ease,
      transform 760ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__rail::before {
    opacity: 0;
    transform: translateY(-50%) scaleX(0.08);
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__anchor {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
    transition-delay: var(--wb-process-delay);
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__stem {
    opacity: 0;
    transition-delay: var(--wb-process-delay);
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__item--top .wb-process-timeline__stem {
    transform: translateX(-50%) scaleY(0.2);
    transform-origin: bottom center;
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__item--bottom .wb-process-timeline__stem {
    transform: translateX(-50%) scaleY(0.2);
    transform-origin: top center;
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__item--top .wb-process-timeline__card {
    opacity: 0;
    transform: translateY(24px);
    transition-delay: calc(var(--wb-process-delay) + 70ms);
  }
  .wb-process-timeline:not(.is-visible) .wb-process-timeline__item--bottom .wb-process-timeline__card {
    opacity: 0;
    transform: translateY(-24px);
    transition-delay: calc(var(--wb-process-delay) + 70ms);
  }
  .wb-process-timeline.is-visible .wb-process-timeline__anchor,
  .wb-process-timeline.is-visible .wb-process-timeline__stem,
  .wb-process-timeline.is-visible .wb-process-timeline__card {
    opacity: 1;
  }
  .wb-process-timeline.is-visible .wb-process-timeline__anchor {
    transform: translate(-50%, -50%) scale(1);
  }
  .wb-process-timeline.is-visible .wb-process-timeline__stem {
    transform: translateX(-50%) scaleY(1);
  }
  .wb-process-timeline.is-visible .wb-process-timeline__card {
    transform: translateY(0);
  }
  @media (max-width: 1023px) {
    .wb-process-timeline {
      padding: 72px 0 64px;
    }
    .wb-process-timeline__inner {
      padding: 0 24px;
    }
    .wb-process-timeline__title {
      margin-bottom: 56px;
      font-size: 56px;
    }
    .wb-process-timeline__inner {
      overflow-x: auto;
    }
    .wb-process-timeline__rail {
      min-width: 1180px;
      min-height: 540px;
    }
    .wb-process-timeline__card {
      width: 280px;
      left: -18px;
    }
    .wb-process-timeline__item--top .wb-process-timeline__card {
      top: -232px;
    }
    .wb-process-timeline__item--bottom .wb-process-timeline__card {
      left: -56px;
    }
    .wb-process-timeline__item[data-wb-process-index='6'] .wb-process-timeline__card {
      left: -176px;
    }
  }
  @media (max-width: 767px) {
    .wb-process-timeline {
      padding: 40px 0 28px;
    }
    .wb-process-timeline__inner {
      padding: 0 20px;
    }
    .wb-process-timeline__title {
      margin-bottom: 34px;
      font-size: 24px;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    .wb-process-timeline__rail {
      min-width: 0;
      min-height: auto;
      padding: 6px 0 0;
    }
    .wb-process-timeline__rail::before {
      display: block;
      left: 50%;
      right: auto;
      top: 18px;
      bottom: 18px;
      width: 1px;
      height: auto;
      transform: none;
    }
    .wb-process-timeline__item {
      position: relative;
      top: auto;
      left: auto !important;
      width: 100%;
      height: auto;
      min-height: 100px;
      padding: 0;
      transform: none;
    }
    .wb-process-timeline__anchor {
      left: 50%;
      top: 18px;
      transform: translate(-50%, 0);
    }
    .wb-process-timeline__stem {
      display: none;
    }
    .wb-process-timeline__card,
    .wb-process-timeline__item--top .wb-process-timeline__card,
    .wb-process-timeline__item--bottom .wb-process-timeline__card {
      position: absolute;
      top: 0;
      bottom: auto;
      width: calc(50% - 28px);
      max-width: none;
      padding-top: 0;
    }
    .wb-process-timeline__item--top .wb-process-timeline__card {
      left: 0;
      right: auto;
    }
    .wb-process-timeline__item--bottom .wb-process-timeline__card {
      left: calc(50% + 34px) !important;
      right: 0;
    }
    .wb-process-timeline__item[data-wb-process-index='6'] .wb-process-timeline__card {
      left: calc(50% + 34px) !important;
    }
    .wb-process-timeline:not(.is-visible) .wb-process-timeline__rail::before {
      transform: scaleY(0.08);
      transform-origin: center top;
    }
    .wb-process-timeline:not(.is-visible) .wb-process-timeline__item--top .wb-process-timeline__card {
      transform: translateX(-18px);
    }
    .wb-process-timeline:not(.is-visible) .wb-process-timeline__item--bottom .wb-process-timeline__card {
      transform: translateX(18px);
    }
    .wb-process-timeline.is-visible .wb-process-timeline__anchor {
      transform: translate(-50%, 0) scale(1);
    }
    .wb-process-timeline__step {
      font-size: 11px;
    }
    .wb-process-timeline__heading {
      font-size: 18px;
      line-height: 1.38;
    }
    .wb-process-timeline__meta {
      font-size: 12px;
      line-height: 1.4;
    }
  }
  @media (max-width: 479px) {
    .wb-process-timeline__inner {
      padding: 0 16px;
    }
    .wb-process-timeline__title {
      font-size: 22px;
    }
    .wb-process-timeline__item {
      min-height: 100px;
    }
    .wb-process-timeline__card,
    .wb-process-timeline__item--top .wb-process-timeline__card,
    .wb-process-timeline__item--bottom .wb-process-timeline__card {
      width: calc(50% - 22px);
    }
    .wb-process-timeline__item--bottom .wb-process-timeline__card {
      left: calc(50% + 26px) !important;
    }
    .wb-process-timeline__item[data-wb-process-index='6'] .wb-process-timeline__card {
      left: calc(50% + 26px) !important;
    }
    .wb-process-timeline__heading {
      font-size: 16px;
    }
    .wb-process-timeline__meta {
      font-size: 11px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .wb-process-timeline__title,
    .wb-process-timeline__rail::before,
    .wb-process-timeline__anchor,
    .wb-process-timeline__stem,
    .wb-process-timeline__card {
      transition: none !important;
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`

function createTextNode(
  tagName: string,
  className: string,
  content: string,
  style: Record<string, string>
) {
  return {
    tagName,
    type: 'text',
    selectable: true,
    droppable: false,
    draggable: false,
    copyable: false,
    removable: false,
    editable: true,
    stylable: [...TEXT_STYLABLE_PROPS],
    attributes: { class: className },
    style,
    components: content
  }
}

function buildStepCard(step: string, title: string, meta: string) {
  return {
    tagName: 'div',
    selectable: true,
    droppable: true,
    draggable: false,
    attributes: { class: 'wb-process-timeline__card' },
    components: [
      createTextNode('p', 'wb-process-timeline__step', step, {
        margin: '0',
        color: '#003152',
        'font-size': '14px',
        'font-weight': '600',
        'line-height': '140%',
        'letter-spacing': '0',
        'text-transform': 'uppercase'
      }),
      createTextNode('h3', 'wb-process-timeline__heading', title, {
        margin: '0',
        color: '#000A11',
        'font-size': '24px',
        'font-weight': '500',
        'line-height': '140%',
        'letter-spacing': '0'
      }),
      createTextNode('p', 'wb-process-timeline__meta', meta, {
        margin: '0',
        color: '#768389',
        'font-size': '16px',
        'font-weight': '400',
        'line-height': '140%',
        'letter-spacing': '0'
      })
    ]
  }
}

function buildTimelineItem(
  index: number,
  total: number,
  item: { step: string; title: string; meta: string }
) {
  const position = index % 2 === 0 ? 'top' : 'bottom'
  return {
    tagName: 'article',
    selectable: true,
    droppable: false,
    draggable: '.wb-process-timeline__rail',
    copyable: true,
    removable: true,
    attributes: {
      class: `wb-process-timeline__item wb-process-timeline__item--${position}`,
      'data-wb-process-index': `${index + 1}`,
      'data-wb-process-position': position
    },
    style: {
      left: `${getPointPercent(index, total)}%`,
      '--wb-process-delay': `${index * 110}ms`
    },
    components: [
      {
        tagName: 'span',
        selectable: false,
        hoverable: false,
        highlightable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-process-timeline__stem' }
      },
      {
        tagName: 'span',
        selectable: false,
        hoverable: false,
        highlightable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-process-timeline__anchor' }
      },
      buildStepCard(item.step, item.title, item.meta)
    ]
  }
}

function buildTimelineTree() {
  return [
    {
      tagName: 'div',
      selectable: false,
      hoverable: false,
      highlightable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-process-timeline__inner' },
      components: [
        createTextNode('h2', 'wb-process-timeline__title', DEFAULT_TITLE, {
          margin: '0 0 88px',
          color: '#000A11',
          'text-align': 'center',
          'font-size': '74px',
          'font-weight': '700',
          'line-height': '108%',
          'letter-spacing': '-0.03em'
        }),
        {
          tagName: 'div',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-process-timeline__rail' },
          components: DEFAULT_STEPS.map((item, index) =>
            buildTimelineItem(index, DEFAULT_STEPS.length, item)
          )
        }
      ]
    }
  ]
}

function getPointPercent(index: number, total: number) {
  if (total <= 1) return 50
  return DESKTOP_INSET_PERCENT + (index * (100 - DESKTOP_INSET_PERCENT * 2)) / (total - 1)
}

function syncTimelineLayout(root: any) {
  const rail = root?._getRail?.()
  const items = rail?.components?.()
  if (!items?.length) return

  const total = items.length
  for (let index = 0; index < total; index++) {
    const item = items.at?.(index)
    if (!item) continue
    const position = index % 2 === 0 ? 'top' : 'bottom'
    const currentAttrs = item.getAttributes?.() || {}
    item.setAttributes?.({
      ...currentAttrs,
      class: `wb-process-timeline__item wb-process-timeline__item--${position}`,
      'data-wb-process-index': `${index + 1}`,
      'data-wb-process-position': position
    })
    item.addStyle?.({
      left: `${getPointPercent(index, total)}%`
    })
  }
}

function resolveProcessTimelineTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_PROCESS_TIMELINE_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_PROCESS_TIMELINE_TYPE) as any
  if (fromSelected?.get?.('type') === WB_PROCESS_TIMELINE_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_PROCESS_TIMELINE_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_PROCESS_TIMELINE_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_PROCESS_TIMELINE_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_PROCESS_TIMELINE_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_PROCESS_TIMELINE_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_PROCESS_TIMELINE_TYPE) return fromTraitTarget

  return null
}

function createAddStepTrait() {
  return {
    type: 'button' as any,
    name: 'add-step',
    label: false as const,
    text: '+ 添加步骤',
    full: true,
    command(this: any, editor: Editor) {
      const timeline = resolveProcessTimelineTarget(editor, this)
      const rail = timeline?._getRail?.()
      const items = rail?.components?.()
      if (!items) return

      const nextIndex = (items.length || 0) + 1
      const created = items.add(
        buildTimelineItem(items.length || 0, nextIndex, {
          step: `STEP ${nextIndex}`,
          title: 'New Process Step',
          meta: '[3-5 business days]'
        })
      )
      syncTimelineLayout(timeline)
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    }
  }
}

export function registerProcessTimelineComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_PROCESS_TIMELINE_TYPE)) return

  domComponents.addType(WB_PROCESS_TIMELINE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'process-timeline'
        ? { type: WB_PROCESS_TIMELINE_TYPE }
        : false,

    model: {
      defaults: {
        name: '流程时间线',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: PROCESS_TIMELINE_CSS,
        attributes: {
          'data-wb-component': 'process-timeline',
          class: 'wb-process-timeline'
        },
        script: makeProcessTimelineScript(),
        'script-export': makeProcessTimelineScript(),
        traits: [createAddStepTrait()],
        components: buildTimelineTree()
      },
      init(this: any) {
        const runWithoutUndo = (task: () => void) => {
          if (typeof editor.UndoManager?.skip === 'function') {
            editor.UndoManager.skip(task)
            return
          }
          task()
        }

        runWithoutUndo(() => {
          syncTimelineLayout(this)
        })

        const rail = this._getRail?.()
        const items = rail?.components?.()
        if (items?.on) {
          items.on('add remove reset', () => syncTimelineLayout(this))
        }
        this.on('change:components', () => syncTimelineLayout(this))
      },
      _getRail(this: any) {
        return this.components?.().at?.(0)?.components?.().at?.(1) ?? null
      }
    }
  })

  blockManager?.add?.(WB_PROCESS_TIMELINE_TYPE, {
    label: '流程时间线',
    category: 'Section',
    content: { type: WB_PROCESS_TIMELINE_TYPE },
    media: BLOCK_ICON
  })
}
