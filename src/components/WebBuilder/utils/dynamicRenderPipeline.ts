export type DynamicRenderData = Record<string, any>

export interface BindDynamicRenderOptions {
  doc?: Document
  removeBindingAttrs?: boolean
  normalizeDynamicElements?: boolean
  imageStrategy?: 'preview-background' | 'seo-img'
}

export function normalizeSiteHref(rawValue: any): string {
  let value = String(rawValue ?? '').trim()
  if (!value) return ''
  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    /^https?:\/\//i.test(value) ||
    value.startsWith('//')
  ) {
    return value
  }

  if (value.startsWith('./')) value = value.slice(2)
  return `/${value}`
}

export function composeDynamicUrl(value: unknown, template?: string | null): string {
  const raw = String(value ?? '')
  const tpl = String(template ?? '').trim()
  if (!tpl) return raw
  if (tpl.includes('{{encoded}}')) return tpl.replaceAll('{{encoded}}', encodeURIComponent(raw))
  if (tpl.includes('{{value}}')) return tpl.replaceAll('{{value}}', raw)
  return `${tpl}${raw}`
}

export function composePlaceholderUrl(field: string, template?: string | null): string {
  const token = field ? `{{${field}}}` : ''
  return composeDynamicUrl(token, template)
}

export function removeDynamicRenderCloneIds(root: Element): void {
  const nodes = [
    ...(root.hasAttribute('id') ? [root] : []),
    ...Array.from(root.querySelectorAll('[id]'))
  ]
  nodes.forEach((el) => el.removeAttribute('id'))
}

const selectBoundElements = (root: Element, selector: string): Element[] => [
  ...(root.matches(selector) ? [root] : []),
  ...Array.from(root.querySelectorAll(selector))
]

function normalizeDynamicLinkElement(el: Element, doc: Document): Element {
  if (el.tagName === 'A') return el
  const link = doc.createElement('a')
  Array.from(el.attributes).forEach((attr) => link.setAttribute(attr.name, attr.value))
  link.setAttribute('href', el.getAttribute('href') || '#')
  while (el.firstChild) link.appendChild(el.firstChild)
  el.parentNode?.replaceChild(link, el)
  return link
}

function normalizeDynamicImageElement(el: Element, doc: Document): Element {
  if (el.tagName === 'IMG') return el
  const image = doc.createElement('img')
  Array.from(el.attributes).forEach((attr) => image.setAttribute(attr.name, attr.value))
  image.setAttribute('alt', el.getAttribute('alt') || '')
  el.parentNode?.replaceChild(image, el)
  return image
}

function normalizeDynamicElements(root: Element, doc: Document): Element {
  let nextRoot = root
  selectBoundElements(root, '[data-wb-dynamic="image"]').forEach((el) => {
    const normalized = normalizeDynamicImageElement(el, doc)
    if (el === nextRoot) nextRoot = normalized
  })
  selectBoundElements(nextRoot, '[data-wb-dynamic="link"], [data-cms-bind-href]').forEach((el) => {
    const normalized = normalizeDynamicLinkElement(el, doc)
    if (el === nextRoot) nextRoot = normalized
  })
  return nextRoot
}

const removeAttr = (el: Element, attr: string, enabled: boolean) => {
  if (enabled) el.removeAttribute(attr)
}

export function bindDynamicRenderData(
  root: Element,
  data: DynamicRenderData,
  options: BindDynamicRenderOptions = {}
): Element {
  const doc = options.doc ?? root.ownerDocument
  const removeAttrs = options.removeBindingAttrs === true
  const imageStrategy = options.imageStrategy ?? 'preview-background'
  let boundRoot = options.normalizeDynamicElements && doc ? normalizeDynamicElements(root, doc) : root

  selectBoundElements(boundRoot, '[data-cms-bind]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind')!
    if (key in data) el.textContent = String(data[key] ?? '')
    removeAttr(el, 'data-cms-bind', removeAttrs)
  })

  selectBoundElements(boundRoot, '[data-cms-html]').forEach((el) => {
    const key = el.getAttribute('data-cms-html')!
    if (key in data) (el as HTMLElement).innerHTML = String(data[key] ?? '')
    removeAttr(el, 'data-cms-html', removeAttrs)
  })

  selectBoundElements(boundRoot, '[data-cms-bind-src]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-src')!
    const altKey = el.getAttribute('data-cms-bind-alt') || ''
    const src = data[key]
    removeAttr(el, 'data-cms-bind-src', removeAttrs)
    if (!src) return

    if (el.tagName === 'IMG') {
      ;(el as HTMLImageElement).src = String(src)
      return
    }

    if (imageStrategy === 'seo-img' && doc) {
      const img = doc.createElement('img')
      img.src = String(src)
      img.alt = altKey && altKey in data ? String(data[altKey] ?? '') : ''
      const style = el.getAttribute('style')
      if (style) img.setAttribute('style', style)
      const cls = el.getAttribute('class')
      if (cls) img.setAttribute('class', cls)
      el.parentNode?.replaceChild(img, el)
      if (el === boundRoot) boundRoot = img
      return
    }

    const htmlEl = el as HTMLElement
    htmlEl.style.backgroundImage = `url('${String(src)}')`
    htmlEl.style.backgroundSize = 'cover'
    htmlEl.style.backgroundPosition = 'center'
    htmlEl.textContent = ''
  })

  const bindAttribute = (selector: string, sourceAttr: string, targetAttr: string) => {
    selectBoundElements(boundRoot, selector).forEach((el) => {
      const key = el.getAttribute(sourceAttr)!
      if (key in data) {
        const value = data[key]
        if (value) el.setAttribute(targetAttr, String(value))
        else el.removeAttribute(targetAttr)
      }
      removeAttr(el, sourceAttr, removeAttrs)
    })
  }

  bindAttribute('[data-cms-bind-alt]', 'data-cms-bind-alt', 'alt')
  bindAttribute('[data-cms-bind-target]', 'data-cms-bind-target', 'target')
  bindAttribute('[data-cms-bind-content]', 'data-cms-bind-content', 'content')
  bindAttribute('[data-cms-bind-title]', 'data-cms-bind-title', 'title')
  bindAttribute('[data-cms-bind-value]', 'data-cms-bind-value', 'value')
  bindAttribute('[data-cms-bind-style]', 'data-cms-bind-style', 'style')
  bindAttribute('[data-cms-bind-aria-current]', 'data-cms-bind-aria-current', 'aria-current')
  bindAttribute(
    '[data-cms-bind-data-product-spec-values]',
    'data-cms-bind-data-product-spec-values',
    'data-product-spec-values'
  )

  selectBoundElements(boundRoot, '[data-cms-bind-class]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-class')!
    if (key in data) {
      const value = data[key]
      if (value) el.setAttribute('class', String(value))
      else el.removeAttribute('class')
    }
    removeAttr(el, 'data-cms-bind-class', removeAttrs)
  })

  selectBoundElements(boundRoot, '[data-cms-bind-classappend]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-classappend')!
    if (key in data) {
      const value = data[key]
      if (value) {
        String(value)
          .split(/\s+/)
          .filter(Boolean)
          .forEach((className) => el.classList.add(className))
      }
    }
    removeAttr(el, 'data-cms-bind-classappend', removeAttrs)
  })

  selectBoundElements(boundRoot, '[data-cms-bind-href]').forEach((el) => {
    const key = el.getAttribute('data-cms-bind-href')!
    const template = el.getAttribute('data-cms-bind-href-template') || ''
    if (key in data) {
      ;(el as HTMLAnchorElement).href = composeDynamicUrl(data[key], template) || '#'
    }
    removeAttr(el, 'data-cms-bind-href', removeAttrs)
    removeAttr(el, 'data-cms-bind-href-template', removeAttrs)
  })

  return boundRoot
}
