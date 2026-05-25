const BLOCK_ELEMENTS = new Set([
  'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'details',
  'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'legend',
  'li', 'main', 'nav', 'noscript', 'ol', 'p', 'section', 'select', 'summary',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul', 'script', 'style',
  'head', 'body', 'html',
])

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
])

const PRE_ELEMENTS = new Set(['pre', 'script', 'style', 'textarea'])

function serializeNode(node: Node, depth: number, indent: string): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const trimmed = (node.textContent || '').trim()
    return trimmed
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const isBlock = BLOCK_ELEMENTS.has(tag)
  const isPre = PRE_ELEMENTS.has(tag)
  const isVoid = VOID_ELEMENTS.has(tag)
  const pad = indent.repeat(depth)
  const childPad = indent.repeat(depth + 1)

  // 构建开标签（含属性）
  let openTag = `<${tag}`
  for (const attr of Array.from(el.attributes)) {
    openTag += ` ${attr.name}="${attr.value}"`
  }

  if (isVoid) {
    return isBlock ? `${pad}<${tag}${openTag.slice(tag.length + 1)}>` : `${openTag}>`
  }

  openTag += '>'

  // 预格式化内容（script/style/pre/textarea）保留原内容
  if (isPre) {
    const inner = el.innerHTML
    return `${pad}${openTag}${inner}</${tag}>`
  }

  // 序列化子节点
  const children: string[] = []
  let hasBlockChild = false

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childTag = (child as Element).tagName.toLowerCase()
      if (BLOCK_ELEMENTS.has(childTag)) hasBlockChild = true
    }
    const serialized = serializeNode(child, depth + 1, indent)
    if (serialized) children.push(serialized)
  }

  if (children.length === 0) {
    return isBlock ? `${pad}${openTag}</${tag}>` : `${openTag}</${tag}>`
  }

  // 有块级子元素，或自身是块级元素 → 多行展开
  if (hasBlockChild || isBlock) {
    const inner = children.map(c => `${childPad}${c}`).join('\n')
    return `${pad}${openTag}\n${inner}\n${pad}</${tag}>`
  }

  // 纯内联内容 → 单行
  return `${openTag}${children.join('')}</${tag}>`
}

/**
 * 格式化 HTML 字符串（增加缩进和换行，使层级结构清晰）
 */
export function formatHtml(html: string, indent = '  '): string {
  if (!html?.trim()) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const body = doc.body

  const parts: string[] = []
  for (const child of Array.from(body.childNodes)) {
    const serialized = serializeNode(child, 0, indent)
    if (serialized) parts.push(serialized)
  }

  return parts.join('\n')
}

/**
 * 格式化 CSS 字符串（每条规则和属性各占一行）
 */
export function formatCss(css: string, indent = '  '): string {
  if (!css?.trim()) return css

  let depth = 0
  return css
    // 统一换行
    .replace(/\r\n/g, '\n')
    // 左括号后换行
    .replace(/\{/g, ' {\n')
    // 分号后换行（不在字符串里的）
    .replace(/;(?!\s*\n)/g, ';\n')
    // 右括号前后换行
    .replace(/\}/g, '\n}\n')
    // 逗号分隔的选择器换行
    .replace(/,\s*(?=[^{]*\{)/g, ',\n')
    // 对 { } 内的每一行加缩进
    .split('\n')
    .reduce((acc: string[], line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return acc
      if (trimmed.startsWith('}')) {
        depth = Math.max(0, depth - 1)
        acc.push('}')
        return acc
      }

      acc.push(`${indent.repeat(depth)}${trimmed}`)
      if (trimmed.endsWith('{')) {
        depth += 1
      }
      return acc
    }, [])
    .join('\n')
    // 合并多个空行
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
