const DISALLOWED_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
])

const URL_ATTRS = new Set(['href', 'xlink:href'])

function sanitizeSvgTree(element: Element): void {
  Array.from(element.attributes).forEach((attr) => {
    const attrName = attr.name.toLowerCase()
    const attrValue = attr.value.trim()

    if (attrName.startsWith('on')) {
      element.removeAttribute(attr.name)
      return
    }

    if (URL_ATTRS.has(attrName) && /^javascript:/i.test(attrValue)) {
      element.removeAttribute(attr.name)
    }
  })

  Array.from(element.children).forEach((child) => {
    const tagName = child.tagName.toLowerCase()
    if (DISALLOWED_TAGS.has(tagName)) {
      child.remove()
      return
    }

    sanitizeSvgTree(child)
  })
}

function ensureViewBox(svg: SVGElement): void {
  if (svg.getAttribute('viewBox')) return

  const width = Number.parseFloat(svg.getAttribute('width') || '')
  const height = Number.parseFloat(svg.getAttribute('height') || '')

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
}

function ensureSvgSizing(svg: SVGElement): void {
  ensureViewBox(svg)
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')

  if (!svg.getAttribute('preserveAspectRatio')) {
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  }

  const style = svg.getAttribute('style') || ''
  if (!/display\s*:/.test(style)) {
    const suffix = style && !style.trim().endsWith(';') ? ';' : ''
    svg.setAttribute('style', `${style}${suffix}display:block;`)
  }
}

function getSvgRoot(rawSvg: string): SVGElement {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawSvg.trim(), 'image/svg+xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error('无法解析 SVG 内容')
  }

  const rootEl = doc.documentElement
  const fallbackSvg = doc.querySelector('svg')
  const svg = rootEl instanceof SVGElement
    ? rootEl
    : (fallbackSvg instanceof SVGElement ? fallbackSvg : null)

  if (!svg) {
    throw new Error('未找到有效的 <svg> 根节点')
  }

  return svg
}

function svgElementToComponentDef(element: Element): any {
  const attributes = Array.from(element.attributes).reduce<Record<string, string>>((acc, attr) => {
    acc[attr.name] = attr.value
    return acc
  }, {})

  const components = Array.from(element.childNodes)
    .map((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return svgElementToComponentDef(node as Element)
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const content = node.textContent ?? ''
        if (content.trim()) {
          return {
            type: 'textnode',
            content,
          }
        }
      }

      return null
    })
    .filter(Boolean)

  return {
    tagName: element.tagName.toLowerCase(),
    attributes,
    draggable: false,
    droppable: false,
    selectable: false,
    hoverable: false,
    highlightable: false,
    copyable: false,
    removable: false,
    layerable: false,
    badgable: false,
    ...(components.length ? { components } : {}),
  }
}

let solarIconNamesPromise: Promise<string[]> | null = null

const SOLAR_ICON_NAMES = [
  'home-bold',
  'home-2-bold',
  'gallery-bold',
  'gallery-add-bold',
  'gallery-check-bold',
  'camera-bold',
  'cart-large-bold',
  'cart-plus-bold',
  'bag-4-bold',
  'card-bold',
  'wallet-money-bold',
  'tag-bold',
  'star-bold',
  'heart-bold',
  'magnifer-linear',
  'rounded-magnifer-zoom-in-linear',
  'user-bold',
  'users-group-rounded-bold',
  'phone-bold',
  'letter-bold',
  'map-point-bold',
  'global-bold',
  'chat-round-dots-bold',
  'calendar-bold',
  'clock-circle-bold',
  'check-circle-bold',
  'close-circle-bold',
  'info-circle-bold',
  'danger-triangle-bold',
  'settings-bold',
  'upload-bold',
  'download-bold',
  'file-text-bold',
  'document-add-bold',
  'link-bold',
  'share-bold',
  'menu-dots-bold',
  'hamburger-menu-bold',
  'arrow-right-linear',
  'arrow-left-linear',
  'alt-arrow-right-linear',
  'alt-arrow-left-linear'
]

export function normalizeIconName(rawIcon: string): string {
  return `${rawIcon ?? ''}`.trim()
}

export function iconifySvgUrl(icon: string, size = 24): string {
  const normalized = normalizeIconName(icon)
  if (!normalized || !normalized.includes(':')) return ''

  const [prefix, name] = normalized.split(':')
  return `https://api.iconify.design/${prefix}/${name}.svg?width=${size}&height=${size}`
}

export async function fetchIconifySvg(icon: string): Promise<string> {
  const normalized = normalizeIconName(icon)
  const url = iconifySvgUrl(normalized, 64)
  if (!url) {
    throw new Error('请输入有效的 Iconify 图标名，例如 lucide:star')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('图标库请求失败')
  }

  return normalizeSvgMarkup(await response.text())
}

export async function fetchSvgMarkupFromUrl(url: string): Promise<string> {
  const normalizedUrl = `${url ?? ''}`.trim()
  if (!normalizedUrl) {
    throw new Error('缺少 SVG 地址')
  }

  const response = await fetch(normalizedUrl)
  if (!response.ok) {
    throw new Error('SVG 资源加载失败')
  }

  return normalizeSvgMarkup(await response.text())
}

export async function getSolarIconSvg(icon: string): Promise<string> {
  const normalized = normalizeIconName(icon)
  const iconName = normalized.startsWith('solar:') ? normalized : `solar:${normalized}`
  return fetchIconifySvg(iconName)
}

export async function searchSolarIcons(
  query = '',
  offset = 0,
  limit = 48,
): Promise<{ icons: string[]; total: number }> {
  if (!solarIconNamesPromise) {
    solarIconNamesPromise = Promise.resolve(SOLAR_ICON_NAMES)
  }

  const iconNames = await solarIconNamesPromise
  const normalizedQuery = `${query ?? ''}`.trim().toLowerCase()
  const matchedNames = normalizedQuery
    ? iconNames.filter(name => name.toLowerCase().includes(normalizedQuery))
    : iconNames

  return {
    icons: matchedNames.slice(offset, offset + limit).map(name => `solar:${name}`),
    total: matchedNames.length,
  }
}

export function normalizeSvgMarkup(rawSvg: string): string {
  const svg = getSvgRoot(rawSvg)
  sanitizeSvgTree(svg)
  ensureSvgSizing(svg)
  return new XMLSerializer().serializeToString(svg)
}

export function svgMarkupToComponentDefs(rawSvg: string): any[] {
  const normalized = normalizeSvgMarkup(rawSvg)
  const svg = getSvgRoot(normalized)
  return [svgElementToComponentDef(svg)]
}
