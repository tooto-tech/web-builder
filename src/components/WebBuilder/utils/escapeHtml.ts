/**
 * HTML 实体转义工具
 *
 * 用于防止将 CMS 后端数据直接插入 innerHTML 时产生 XSS 漏洞。
 * 只对文本节点内容使用此函数；URL / CSS 类名等通过双引号属性包裹即可。
 *
 * 使用场景：
 *   - 后端 CMS 数据字段（title、name、description、label、excerpt 等）插入 HTML 字符串
 *   - 模板字面量中动态插入后端文本
 *
 * 不需要使用的场景：
 *   - 图片 URL（src 属性）—— 已由 encodeURIComponent 或双引号包裹保护
 *   - GrapesJS 静态组件模板（不含后端数据）
 *   - 编辑器内部占位符（hardcoded 固定字符串）
 *
 * 富文本字段（data-cms-html、format='html' 的字段）需要额外 DOMPurify 净化，
 * 而不是使用此函数（此函数会破坏合法的 HTML 标签）。
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
