import { generateCss } from '@/api/content/page'

// 缓存上次生成结果，key 为排序后 classList 的 join，避免重复 API 调用
const tailwindCssCache = new Map<string, string>()

/**
 * 收集编辑器中使用的所有 Tailwind CSS 类名
 * @param editor GrapesJS 编辑器实例
 * @returns 使用的类名数组
 */
export const collectUsedClasses = (editor: any): string[] => {
  const classes = new Set<string>()

  const addClasses = (value?: string) => {
    if (!value) return
    value
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => classes.add(c))
  }

  const addFromHtml = (html?: string) => {
    if (!html) return
    const classAttrRegex = /class\s*=\s*["']([^"']+)["']/g
    let match: RegExpExecArray | null
    while ((match = classAttrRegex.exec(html))) {
      addClasses(match[1])
    }
  }

  const walk = (comp: any) => {
    if (!comp) return
    if (typeof comp.getClasses === 'function') {
      comp.getClasses().forEach((cls: any) => {
        const name = cls?.get?.('name') ?? cls?.name
        if (name) classes.add(name)
      })
    }
    if (typeof comp.getAttributes === 'function') {
      const attrs = comp.getAttributes()
      addClasses(attrs?.class)
    }
    const children = comp.get?.('components') ?? comp.components
    const list = Array.isArray(children?.models) ? children.models : children
    if (Array.isArray(list)) list.forEach(walk)
  }

  walk(editor?.getWrapper?.())

  // Fallback: extract classes from rendered HTML
  try {
    addFromHtml(editor?.getHtml?.())
  } catch {
    // noop
  }

  return Array.from(classes)
}

/**
 * 通过服务端接口生成 Tailwind CSS 样式
 * @param classList Tailwind CSS 类名数组
 * @returns 生成的 CSS 字符串，失败时返回空字符串
 */
export const buildTailwindCss = async (classList: string[]): Promise<string> => {
  // 如果没有类名，直接返回空字符串
  if (!classList || classList.length === 0) {
    return ''
  }

  // 用排序后的 classList 作为缓存 key，避免顺序差异导致重复请求
  const cacheKey = [...classList].sort().join('|')
  if (tailwindCssCache.has(cacheKey)) {
    return tailwindCssCache.get(cacheKey)!
  }

  try {
    // 调用服务端接口生成 CSS
    const response = await generateCss({ classes: classList })

    // 确保返回的数据包含 css 字段
    if (response && typeof response.css === 'string') {
      tailwindCssCache.set(cacheKey, response.css)
      return response.css
    }

    console.warn('[Tailwind CSS] 服务端返回的数据格式不正确:', response)
    return ''
  } catch (apiError: any) {
    // 记录错误信息，但不抛出异常，返回空字符串
    console.error('[Tailwind CSS] 生成失败:', {
      error: apiError,
      message: apiError?.message || '未知错误',
      classCount: classList.length,
      classes: classList.slice(0, 10) // 只记录前10个类名用于调试
    })
    return ''
  }
}
