import type { Editor } from 'grapesjs'
import { makeSelectTrait, makeTextTrait } from '../../../traitFactory.js'

export const WB_POPUP_TYPE = 'wb-popup'
export const WB_POPUP_TEMPLATE_REF_TYPE = 'wb-popup-template-ref'
export const WB_POPUP_TRIGGER_TYPE = 'wb-popup-trigger'

const DEFAULT_POPUP_ID = 'wb-popup-template'
const DEFAULT_POPUP_TITLE = 'Popup title'
const DEFAULT_POPUP_TEXT = 'Design any popup content here.'

const popupRuntimeScript = function (this: HTMLElement) {
  type PopupRoot = HTMLElement & {
    __wbPopupCloseTimer?: number
    __wbPopupCancelHandler?: (event: Event) => void
  }
  const doc = document as Document & {
    __wbPopupRuntimeInit?: boolean
    __wbActivePopup?: HTMLElement | null
  }
  const frameElement = window.frameElement as HTMLElement | null
  if (frameElement && /\bgjs\b|\bgjs-frame\b/.test(`${frameElement.className || ''}`)) return
  if (doc.__wbPopupRuntimeInit) return
  doc.__wbPopupRuntimeInit = true

  const CLOSE_ANIMATION_MS = 220

  const isDialogRoot = (root: HTMLElement | null | undefined): root is HTMLDialogElement => {
    return !!root && `${root.tagName || ''}`.toLowerCase() === 'dialog'
  }

  const findTriggerForRoot = (root: HTMLElement) => {
    if (!root.id) return null
    return document.querySelector<HTMLElement>(
      `[data-wb-popup-open][aria-controls="${root.id}"]`,
    )
  }

  const clearCloseTimer = (root: PopupRoot) => {
    if (!root.__wbPopupCloseTimer) return
    window.clearTimeout(root.__wbPopupCloseTimer)
    root.__wbPopupCloseTimer = undefined
  }

  const closePopup = (root: HTMLElement | null | undefined, immediate = false) => {
    if (!root) return
    const popupRoot = root as PopupRoot
    clearCloseTimer(popupRoot)
    const trigger = findTriggerForRoot(root)
    trigger?.setAttribute('aria-expanded', 'false')
    root.setAttribute('aria-hidden', 'true')

    const finishClose = () => {
      clearCloseTimer(popupRoot)
      root.classList.remove('is-open', 'is-closing')
      if (isDialogRoot(root)) {
        if (root.open && typeof root.close === 'function') {
          root.close()
        }
        root.removeAttribute('open')
      }
      root.setAttribute('hidden', 'hidden')
      root.hidden = true
      if (doc.__wbActivePopup === root) {
        doc.__wbActivePopup = null
        document.body?.classList.remove('wb-popup-open')
      }
    }

    if (immediate || !root.classList.contains('is-open')) {
      finishClose()
      return
    }

    root.classList.remove('is-open')
    root.classList.add('is-closing')

    const finishOnTransitionEnd = (event: Event) => {
      if (event.target === root) {
        root.removeEventListener('transitionend', finishOnTransitionEnd)
        finishClose()
      }
    }
    root.addEventListener('transitionend', finishOnTransitionEnd)
    popupRoot.__wbPopupCloseTimer = window.setTimeout(() => {
      root.removeEventListener('transitionend', finishOnTransitionEnd)
      finishClose()
    }, CLOSE_ANIMATION_MS + 80)
  }

  const openPopup = (root: HTMLElement | null | undefined, trigger?: HTMLElement | null) => {
    if (!root) return
    if (doc.__wbActivePopup && doc.__wbActivePopup !== root) {
      closePopup(doc.__wbActivePopup, true)
    }
    const popupRoot = root as PopupRoot
    clearCloseTimer(popupRoot)
    root.classList.remove('is-closing')
    root.hidden = false
    root.removeAttribute('hidden')
    root.setAttribute('aria-hidden', 'false')
    if (isDialogRoot(root)) {
      try {
        if (!root.open && typeof root.showModal === 'function') {
          root.showModal()
        } else {
          root.setAttribute('open', '')
        }
      } catch (_error) {
        root.setAttribute('open', '')
      }
    }
    document.body?.classList.add('wb-popup-open')
    doc.__wbActivePopup = root
    trigger?.setAttribute('aria-expanded', 'true')
    window.requestAnimationFrame(() => {
      root.classList.add('is-open')
    })
    const focusTarget = root.querySelector<HTMLElement>(
      '[data-wb-popup-close], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    window.setTimeout(() => focusTarget?.focus?.(), 0)
  }

  const findPopupRoot = (trigger: HTMLElement) => {
    const target = `${trigger.getAttribute('data-wb-popup-target') || ''}`.trim()
    if (target) {
      const byId = document.getElementById(target)
      if (byId) return byId
    }
    const resourceId = `${trigger.getAttribute('data-wb-popup-resource-id') || ''}`.trim()
    if (!resourceId) return null
    return document.querySelector<HTMLElement>(
      `[data-wb-popup-root][data-wb-popup-resource-id="${resourceId}"]`,
    )
  }

  const setupPopupRoot = (root: HTMLElement) => {
    const popupRoot = root as PopupRoot
    if (!popupRoot.__wbPopupCancelHandler) {
      popupRoot.__wbPopupCancelHandler = (event: Event) => {
        event.preventDefault()
        closePopup(root)
      }
      root.addEventListener('cancel', popupRoot.__wbPopupCancelHandler)
    }
    if (!root.classList.contains('is-open')) {
      closePopup(root, true)
    }
  }

  document.querySelectorAll<HTMLElement>('[data-wb-popup-root]').forEach((root) => {
    setupPopupRoot(root)
  })

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    const trigger = target?.closest?.('[data-wb-popup-open]') as HTMLElement | null
    if (trigger) {
      event.preventDefault()
      openPopup(findPopupRoot(trigger), trigger)
      return
    }

    if (target?.matches?.('dialog[data-wb-popup-root]')) {
      event.preventDefault()
      closePopup(target)
      return
    }

    const close = target?.closest?.('[data-wb-popup-close]') as HTMLElement | null
    if (close) {
      event.preventDefault()
      closePopup(close.closest('[data-wb-popup-root]') as HTMLElement | null)
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePopup(doc.__wbActivePopup)
    }
  })
}

const POPUP_STYLES = `
  .wb-popup {
    position: fixed;
    inset: 0;
    z-index: 2147483000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
  }
  .wb-popup[hidden] {
    display: none !important;
  }
  dialog.wb-popup {
    width: 100vw;
    max-width: none;
    height: 100vh;
    height: 100dvh;
    max-height: none;
    margin: 0;
    border: 0;
    background: transparent;
    color: inherit;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s ease;
  }
  dialog.wb-popup[open] {
    display: flex;
  }
  dialog.wb-popup[open].is-open {
    opacity: 1;
    pointer-events: auto;
  }
  dialog.wb-popup[open].is-closing {
    opacity: 0;
    pointer-events: none;
  }
  dialog.wb-popup::backdrop {
    background: rgba(15, 23, 42, 0.58);
    opacity: 0;
    transition: opacity 0.22s ease;
  }
  dialog.wb-popup.is-open::backdrop {
    opacity: 1;
  }
  dialog.wb-popup.is-closing::backdrop {
    opacity: 0;
  }
  .wb-popup__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.58);
  }
  dialog.wb-popup .wb-popup__backdrop {
    background: transparent;
  }
  .wb-popup__dialog {
    position: relative;
    z-index: 1;
    width: min(640px, 100%);
    max-height: min(720px, calc(100vh - 48px));
    overflow: auto;
    background: #ffffff;
    color: #111827;
    border-radius: 8px;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
    padding: 32px;
    box-sizing: border-box;
  }
  dialog.wb-popup .wb-popup__dialog {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
    transition: opacity 0.22s ease, transform 0.22s ease;
  }
  dialog.wb-popup.is-open .wb-popup__dialog {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  dialog.wb-popup.is-closing .wb-popup__dialog {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  .wb-popup__close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
  }
  .wb-popup__content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .wb-popup__title {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
    font-weight: 700;
  }
  .wb-popup__text {
    margin: 0;
    color: #4b5563;
    line-height: 1.7;
  }
  body.wb-popup-open {
    overflow: hidden;
  }
  @media (max-width: 767px) {
    .wb-popup {
      padding: 16px;
    }
    .wb-popup__dialog {
      max-height: calc(100vh - 32px);
      padding: 28px 20px;
    }
  }
`

const TRIGGER_STYLES = `
  .wb-popup-trigger {
    transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  }
  .wb-popup-trigger--link {
    background: transparent !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    color: #2563eb;
    text-decoration: underline;
  }
`

const normalizePopupTemplateId = (value: unknown) => `${value ?? ''}`.trim()

const popupTargetId = (resourceId: string) => resourceId ? `wb-popup-${resourceId}` : ''

const escapeHtml = (value: unknown) => `${value ?? ''}`
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

function popupTemplateTrait(label = '关联弹窗') {
  return {
    type: 'popup-template-select',
    label,
    name: 'popupTemplateId',
    changeProp: true,
  }
}

function buildTriggerText(text: string) {
  return [{ type: 'textnode', content: text }]
}

function buildPopupContent() {
  return [
    {
      tagName: 'div',
      attributes: { class: 'wb-popup__backdrop', 'data-wb-popup-close': '' },
    },
    {
      tagName: 'div',
      attributes: {
        class: 'wb-popup__dialog',
        role: 'dialog',
        'aria-modal': 'true',
      },
      components: [
        {
          tagName: 'button',
          attributes: {
            class: 'wb-popup__close',
            type: 'button',
            'aria-label': 'Close',
            'data-wb-popup-close': '',
          },
          components: [{ type: 'textnode', content: '×' }],
        },
        {
          tagName: 'div',
          attributes: { class: 'wb-popup__content' },
          components: [
            {
              type: 'wb-heading',
              headingTag: 'h2',
              attributes: { class: 'wb-popup__title', 'data-wb-component': 'heading' },
              components: DEFAULT_POPUP_TITLE,
            },
            {
              type: 'wb-text-editor',
              attributes: { class: 'wb-popup__text', 'data-wb-component': 'text-editor' },
              editorContent: `<p>${DEFAULT_POPUP_TEXT}</p>`,
              components: `<p>${DEFAULT_POPUP_TEXT}</p>`,
            },
          ],
        },
      ],
    },
  ]
}

function getComponentChildren(model: any): any[] {
  const collection = model?.components?.()
  if (!collection) return []
  if (Array.isArray(collection)) return collection
  if (Array.isArray(collection.models)) return collection.models
  const children: any[] = []
  collection.forEach?.((child: any) => children.push(child))
  return children
}

function hasClass(model: any, className: string): boolean {
  return ((model?.getClasses?.() as string[]) || []).includes(className)
}

function getComponentText(model: any, fallback: string): string {
  const collect = (item: any): string => {
    const content = item?.get?.('content')
    if (content != null) return `${content}`
    return getComponentChildren(item).map(collect).join('')
  }
  const text = collect(model).trim()
  return text || fallback
}

function upgradeDefaultPopupTextComponents(model: any) {
  const visit = (item: any) => {
    if (hasClass(item, 'wb-popup__title') && item.get?.('type') !== 'wb-heading') {
      item.replaceWith?.({
        type: 'wb-heading',
        headingTag: 'h2',
        attributes: { class: 'wb-popup__title', 'data-wb-component': 'heading' },
        components: getComponentText(item, DEFAULT_POPUP_TITLE),
      })
      return
    }
    if (hasClass(item, 'wb-popup__text') && item.get?.('type') !== 'wb-text-editor') {
      const text = getComponentText(item, DEFAULT_POPUP_TEXT)
      item.replaceWith?.({
        type: 'wb-text-editor',
        attributes: { class: 'wb-popup__text', 'data-wb-component': 'text-editor' },
        editorContent: `<p>${escapeHtml(text)}</p>`,
        components: `<p>${escapeHtml(text)}</p>`,
      })
      return
    }
    getComponentChildren(item).forEach(visit)
  }
  getComponentChildren(model).forEach(visit)
}

function applyPopupReferenceAttributes(model: any) {
  const resourceId = normalizePopupTemplateId(model.get?.('popupTemplateId'))
  const target = popupTargetId(resourceId)
  model.addAttributes?.({
    'data-wb-popup-resource-id': resourceId,
    'data-wb-popup-target': target,
  })
}

function applyPopupTriggerAttributes(model: any) {
  const resourceId = normalizePopupTemplateId(model.get?.('popupTemplateId'))
  const target = popupTargetId(resourceId)
  const attributes = { ...(model.getAttributes?.() ?? {}) }
  delete attributes.href
  delete attributes.target
  delete attributes.rel
  delete attributes.role
  model.setAttributes?.(attributes)
  model.addAttributes?.({
    type: 'button',
    'aria-controls': target,
    'aria-expanded': 'false',
    'data-wb-popup-open': '',
    'data-wb-popup-resource-id': resourceId,
    'data-wb-popup-target': target,
  })
}

function applyTriggerVariant(model: any) {
  const triggerType = `${model.get?.('triggerType') ?? 'button'}`
  const classes = new Set<string>((model.getClasses?.() as string[]) || [])
  classes.add('wb-popup-trigger')
  classes.delete('wb-popup-trigger--link')

  const style = { ...(model.getStyle?.() ?? {}) } as Record<string, string>
  if (triggerType === 'link') {
    classes.add('wb-popup-trigger--link')
    style.display = 'inline'
    style.padding = '0'
    style['background-color'] = 'transparent'
    style.color = style.color || '#2563eb'
    style['text-decoration'] = 'underline'
    style.border = '0'
  } else {
    style.display = 'inline-flex'
    style['align-items'] = 'center'
    style['justify-content'] = 'center'
    style.padding = style.padding || '12px 24px'
    style['background-color'] = style['background-color'] || '#2563eb'
    style.color = style.color || '#ffffff'
    style['border-radius'] = style['border-radius'] || '8px'
    style['text-decoration'] = 'none'
    style.border = style.border || '0'
  }
  model.setClass?.(Array.from(classes))
  model.setStyle?.(style)
}

export function registerPopupComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_POPUP_TYPE)) {
    return
  }

  domComponents.addType(WB_POPUP_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'popup' || el?.hasAttribute?.('data-wb-popup-root')) {
        return { type: WB_POPUP_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '弹窗',
        tagName: 'div',
        draggable: '*',
        droppable: true,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          id: DEFAULT_POPUP_ID,
          'data-wb-component': 'popup',
          'data-wb-popup-root': '',
          'aria-hidden': 'false',
        },
        classes: ['wb-popup'],
        styles: POPUP_STYLES,
        components: buildPopupContent(),
        script: popupRuntimeScript,
        'script-export': popupRuntimeScript,
      },
      init(this: any) {
        upgradeDefaultPopupTextComponents(this)
      },
    },
  })

  domComponents.addType(WB_POPUP_TEMPLATE_REF_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'popup-template-ref') {
        return { type: WB_POPUP_TEMPLATE_REF_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '弹窗引用',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'popup-template-ref',
          'data-wb-popup-resource-id': '',
          'data-wb-popup-target': '',
        },
        style: {
          display: 'inline-flex',
          'align-items': 'center',
          padding: '8px 12px',
          border: '1px dashed #93c5fd',
          'border-radius': '6px',
          color: '#1d4ed8',
          'background-color': '#eff6ff',
          'font-size': '12px',
        },
        popupTemplateId: '',
        components: [{ type: 'textnode', content: '弹窗引用' }],
        traits: [popupTemplateTrait()],
      },
      init(this: any) {
        this.on('change:popupTemplateId', () => applyPopupReferenceAttributes(this))
        applyPopupReferenceAttributes(this)
      },
    },
  })

  domComponents.addType(WB_POPUP_TRIGGER_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'popup-trigger') {
        return { type: WB_POPUP_TRIGGER_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '弹窗按钮/链接',
        tagName: 'button',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'popup-trigger',
          type: 'button',
          'aria-expanded': 'false',
          'data-wb-popup-open': '',
          'data-wb-popup-resource-id': '',
          'data-wb-popup-target': '',
        },
        style: {
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: '12px 24px',
          'background-color': '#2563eb',
          color: '#ffffff',
          'border-radius': '8px',
          'text-decoration': 'none',
          'font-size': '16px',
          'font-weight': '600',
          cursor: 'pointer',
          border: '0',
          'line-height': '1.4',
          'white-space': 'nowrap',
        },
        classes: ['wb-popup-trigger'],
        styles: TRIGGER_STYLES,
        triggerText: '打开弹窗',
        triggerType: 'button',
        popupTemplateId: '',
        components: buildTriggerText('打开弹窗'),
        script: popupRuntimeScript,
        'script-export': popupRuntimeScript,
        traits: [
          makeTextTrait('显示文字', 'triggerText', { placeholder: '打开弹窗' }),
          makeSelectTrait('显示类型', 'triggerType', [
            { value: 'button', label: '按钮' },
            { value: 'link', label: '文本链接' },
          ]),
          popupTemplateTrait('关联弹窗'),
        ],
      },
      init(this: any) {
        if (this.get?.('tagName') !== 'button') {
          this.set?.('tagName', 'button')
        }
        this.on('change:triggerText', this.applyText)
        this.on('change:triggerType', this.applyVariant)
        this.on('change:popupTemplateId', this.applyPopup)
        this.applyText()
        this.applyVariant()
        this.applyPopup()
      },
      applyText(this: any) {
        const text = `${this.get('triggerText') ?? '打开弹窗'}`
        const children = this.components?.()
        if (children?.reset) {
          children.reset(buildTriggerText(text))
        } else {
          this.components(buildTriggerText(text))
        }
      },
      applyVariant(this: any) {
        applyTriggerVariant(this)
      },
      applyPopup(this: any) {
        applyPopupTriggerAttributes(this)
      },
    },
  })

  editor.BlockManager.add(WB_POPUP_TRIGGER_TYPE, {
    label: '弹窗按钮/链接',
    category: 'Interactive',
    content: { type: WB_POPUP_TRIGGER_TYPE },
    media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 6h16v4H4V6Zm2 2v0h12V8H6Zm-2 5h10v5H4v-5Zm2 2v1h6v-1H6Zm10-2h4v2h-4v-2Zm0 4h4v2h-4v-2Z"/></svg>',
  })
}
