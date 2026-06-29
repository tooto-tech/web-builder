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

type IconifyCollectionLike = {
  prefix?: string
  width?: number
  height?: number
  icons?: Record<string, any>
  aliases?: Record<string, any>
}

let solarCollectionPromise: Promise<IconifyCollectionLike> | null = null
let solarIconNamesPromise: Promise<string[]> | null = null
let iconifyRuntimePromise: Promise<{
  addCollection: (collection: unknown) => unknown
  getIcon: (icon: string) => unknown
}> | null = null

function loadIconifyRuntime() {
  if (!iconifyRuntimePromise) {
    iconifyRuntimePromise = import('@iconify/iconify').then(module => ({
      addCollection: (collection: unknown) => module.addCollection(collection as any),
      getIcon: (icon: string) => module.getIcon(icon),
    }))
  }

  return iconifyRuntimePromise
}

async function loadSolarCollection(): Promise<IconifyCollectionLike> {
  if (!solarCollectionPromise) {
    solarCollectionPromise = Promise.all([
      loadIconifyRuntime(),
      import('@iconify/json/json/solar.json'),
    ])
      .then(([iconify, module]) => {
        const collection = ((module as any)?.default ?? module) as IconifyCollectionLike
        iconify.addCollection(collection as any)
        return collection
      })
  }

  return solarCollectionPromise
}

function iconDataToSvgMarkup(iconData: any, fallbackWidth = 24, fallbackHeight = 24): string {
  if (!iconData?.body) {
    throw new Error('未找到有效的图标数据')
  }

  const left = Number.isFinite(iconData.left) ? iconData.left : 0
  const top = Number.isFinite(iconData.top) ? iconData.top : 0
  const width = Number.isFinite(iconData.width) ? iconData.width : fallbackWidth
  const height = Number.isFinite(iconData.height) ? iconData.height : fallbackHeight

  return normalizeSvgMarkup(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}" fill="currentColor">${iconData.body}</svg>`,
  )
}

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
  const [collection, iconify] = await Promise.all([
    loadSolarCollection(),
    loadIconifyRuntime(),
  ])
  const iconData = iconify.getIcon(iconName)

  if (!iconData) {
    throw new Error('未找到 Solar 图标')
  }

  return iconDataToSvgMarkup(
    iconData,
    collection.width || 24,
    collection.height || 24,
  )
}

export async function searchSolarIcons(
  query = '',
  offset = 0,
  limit = 48,
): Promise<{ icons: string[]; total: number }> {
  const collection = await loadSolarCollection()

  if (!solarIconNamesPromise) {
    solarIconNamesPromise = Promise.resolve([
      ...Object.keys(collection.icons || {}),
      ...Object.keys(collection.aliases || {}),
    ])
      .then((names) => Array.from(new Set(names)).sort())
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
