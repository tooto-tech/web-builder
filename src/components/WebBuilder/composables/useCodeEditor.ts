import { ref, shallowRef } from 'vue'
import { getPageSettingsFromPage } from '../utils/pageSettings'
import { formatHtml, formatCss } from '../utils/formatCode'
import { getInjectedPublishCss } from '../utils/injectStyle'
import { getUsedComponentCssRules } from '../utils/editorHelpers'

const HTML_FORMAT_LIMIT = 200_000
const CSS_FORMAT_LIMIT = 300_000

const formatHtmlForModal = (html: string) => {
  return html.length > HTML_FORMAT_LIMIT ? html : formatHtml(html)
}

const formatCssForModal = (css: string) => {
  return css.length > CSS_FORMAT_LIMIT ? css : formatCss(css)
}

/**
 * Hook for managing code editor (HTML/CSS/JS)
 */
export default function useCodeEditor(grapes: any) {
  const editorRef = shallowRef<any>(null)
  const html = ref('')
  const css = ref('')
  const js = ref('')

  /**
   * 生成完整的 HTML 文档
   */
  const generateFullHtml = (bodyHtml: string, pageJs: string, page: any): string => {
    const settings = getPageSettingsFromPage(page)
    const pageName = settings.name || page?.getName?.() || page?.name || 'Page'
    const title = settings.tdkTitle || pageName
    const description = settings.tdkDescription || ''
    const keywords = settings.tdkKeywords || ''
    const customHead = settings.customHead || ''
    const customBody = settings.customBody || ''

    // 构建 meta 标签
    const metaTags = [
      '<meta charset="utf-8"/>',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
    ]
    
    if (description) {
      metaTags.push(`<meta name="description" content="${description.replace(/"/g, '&quot;')}"/>`)
    }
    
    if (keywords) {
      metaTags.push(`<meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}"/>`)
    }

    // 构建完整的 HTML 文档（不含内联 style，CSS 在 CSS tab 单独展示）
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    ${metaTags.join('\n    ')}
    <title>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    ${customHead ? `${customHead}\n    ` : ''}<link rel="stylesheet" href="styles.css">
  </head>
  <body>
${bodyHtml}${customBody ? `\n${customBody}` : ''}
    ${pageJs ? `<script>\n${pageJs}\n    </script>` : ''}
  </body>
</html>`

    return fullHtml
  }

  /**
   * 从完整 HTML 文档中提取 body 内容
   */
  const extractBodyFromHtml = (fullHtml: string): string => {
    try {
      // 尝试使用正则表达式提取 body 内容
      const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch && bodyMatch[1]) {
        let bodyContent = bodyMatch[1].trim()
        // 移除可能的 script 标签（JS 会单独处理）
        bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '')
        return bodyContent
      }
      // 如果没有找到 body 标签，返回原内容
      return fullHtml
    } catch (error) {
      // 如果解析失败，返回原内容
      return fullHtml
    }
  }

  const refreshCode = () => {
    const editor = editorRef.value
    if (!editor) return
    
    try {
      const page = editor.Pages?.getSelected?.()
      const component = page?.getMainComponent?.()
      const rawBodyHtml = component ? editor.getHtml({ component }) : editor.getHtml()
      const cssRules = getUsedComponentCssRules(editor, component)
      const baseCss = component
        ? editor.getCss({ component, avoidProtected: true, rules: cssRules })
        : editor.getCss({ avoidProtected: true, rules: cssRules })
      const injectedCss = getInjectedPublishCss(editor, rawBodyHtml, baseCss)
      const rawCss = [baseCss, injectedCss].filter(Boolean).join('\n\n')
      const pageJs = editor.getJs() || ''

      const bodyHtml = formatHtmlForModal(rawBodyHtml)
      const pageStyles = formatCssForModal(rawCss)

      // 生成完整的 HTML 文档
      html.value = generateFullHtml(bodyHtml, pageJs, page)
      css.value = pageStyles
      js.value = pageJs
    } catch (error) {
      // 静默处理错误
    }
  }

  const updateCode = (type: 'html' | 'css' | 'js', value: string) => {
    const editor = editorRef.value
    if (!editor) return
    
    try {
      if (type === 'html') {
        // 如果传入的是完整的 HTML 文档，提取 body 内容
        const bodyContent = extractBodyFromHtml(value)
        editor.setComponents(bodyContent)
        // 重新生成完整的 HTML（包含最新的页面设置）
        const page = editor.Pages?.getSelected?.()
        const pageJs = editor.getJs() || ''
        html.value = generateFullHtml(bodyContent, pageJs, page)
      } else if (type === 'css') {
        if (editor.setStyle) {
          editor.setStyle(value || '')
        }
        css.value = value
        // 更新 HTML 以包含新的 CSS
        const page = editor.Pages?.getSelected?.()
        const bodyHtml = editor.getHtml() || ''
        const pageJs = editor.getJs() || ''
        html.value = generateFullHtml(bodyHtml, pageJs, page)
      } else if (type === 'js') {
        editor.setJs(value)
        js.value = value
        // 更新 HTML 以包含新的 JS
        const page = editor.Pages?.getSelected?.()
        const bodyHtml = editor.getHtml() || ''
        html.value = generateFullHtml(bodyHtml, value, page)
      }
    } catch (error) {
      // 静默处理错误
    }
  }

  grapes.onInit((editor: any) => {
    editorRef.value = editor
  })

  return {
    html,
    css,
    js,
    updateCode,
    refreshCode,
  }
}
