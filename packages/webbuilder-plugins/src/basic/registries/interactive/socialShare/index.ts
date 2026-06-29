/**
 * 社媒分享组件（Social Share）
 *
 * 用途：
 *   放在文章 / 产品 / 媒体等详情页底部，供访客一键将当前页面
 *   分享到 Facebook / Twitter(X) / LinkedIn / Pinterest / WhatsApp / Email 或复制链接。
 *
 * 设计要点：
 *   1. 默认分享内容取自运行时环境 —— `window.location.href` + `document.title`，
 *      天然跟随当前页面，**不依赖任何后端字段绑定**，在任何页面都可使用。
 *   2. 如需自定义分享 URL / 文案，可在 trait 中填入，会写到根元素 data-share-url /
 *      data-share-text，运行时优先使用这两个值（支持 `{{post.url}}` 这类占位符，
 *      由后端模板引擎替换）。
 *   3. 平台开关 / 按钮形状 / 大小通过 trait 配置，syncAttrs 到根元素的 data-share-*
 *      以便 CSS 精确控制按钮展示与样式。
 *   4. 按钮点击通过 script / script-export 注入，发布后的页面也能独立工作。
 *
 * 运行时输出（简化示意）：
 * ```html
 * <div data-wb-component="social-share"
 *      data-share-shape="rounded" data-share-size="md"
 *      data-share-enabled="facebook twitter linkedin copy">
 *   <h3 class="wb-social-share__title">Share</h3>
 *   <div class="wb-social-share__list">
 *     <a class="wb-social-share__btn" data-wb-share="facebook" ...>...</a>
 *     ...
 *   </div>
 * </div>
 * ```
 */

import type { Editor } from 'grapesjs'
import {
  makeCheckboxTrait,
  makeSelectTrait,
  makeTextTrait,
} from '../../../traitFactory.js'

const TYPE_SOCIAL_SHARE = 'wb-social-share'
export const WB_SOCIAL_SHARE_TYPE = TYPE_SOCIAL_SHARE

// ─────────────────────────────────────────────────────────────
// 平台元数据
// ─────────────────────────────────────────────────────────────

interface SharePlatform {
  key: string
  label: string
  traitName: string
  defaultEnabled: boolean
  icon: string
  /** copy 平台用 <button>，其他用 <a> */
  asButton?: boolean
}

const ICON_FACEBOOK =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 21v-8h3l.5-4H13V6.2c0-1.1.3-1.9 1.9-1.9H17V.9C16.6.8 15.3.6 13.8.6c-3 0-5 1.8-5 5.2V9H6v4h2.8v8H13z"/></svg>'

const ICON_TWITTER =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'

const ICON_LINKEDIN =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.65-1.85 3.4-1.85 3.64 0 4.32 2.4 4.32 5.52v6.22zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>'

const ICON_PINTEREST =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12c0 5 3.1 9.3 7.5 11-.1-.9-.2-2.4 0-3.4.2-.9 1.4-5.7 1.4-5.7s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.6 2.6-1 4-.3 1.2.6 2.1 1.7 2.1 2.1 0 3.7-2.2 3.7-5.4 0-2.8-2-4.8-4.9-4.8-3.4 0-5.3 2.5-5.3 5.1 0 1 .4 2.1.9 2.7.1.1.1.2.1.3-.1.4-.3 1.2-.3 1.3 0 .2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.7-7.2 7.9-7.2 4.1 0 7.4 3 7.4 6.9 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.4-.6-2.8-1.4l-.8 2.9c-.3 1-1 2.3-1.5 3.1 1.1.3 2.3.5 3.5.5 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg>'

const ICON_WHATSAPP =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2s-.8.9-1 1.1c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-.9 1-.9 2.4s.9 2.8 1.1 3c.2.2 1.8 2.7 4.3 3.8.6.2 1.1.4 1.4.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.6-.5zm-5.5 6.7h-.1c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4C2.5 14.9 2 13 2 11.1 2 6.1 6.1 2 11.2 2c2.4 0 4.7.9 6.4 2.6 1.7 1.7 2.6 4 2.6 6.4 0 5.1-4.2 9.1-9.2 9.1zm7.8-16.9A10.9 10.9 0 0 0 11.9 0C5.7 0 .8 4.9.8 11.1c0 1.9.5 3.8 1.4 5.5L.7 24l7.6-2c1.6.9 3.5 1.4 5.4 1.4h.1c6.2 0 11.1-5 11.1-11.2 0-2.9-1.2-5.7-3.1-7.9z"/></svg>'

const ICON_EMAIL =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 6c0-1.1-.9-2-2-2H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zM4 18V8l8 5 8-5v10H4z"/></svg>'

const ICON_COPY =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71"/></svg>'

const PLATFORMS: SharePlatform[] = [
  { key: 'facebook', label: 'Facebook', traitName: 'enableFacebook', defaultEnabled: true, icon: ICON_FACEBOOK },
  { key: 'twitter', label: 'Twitter (X)', traitName: 'enableTwitter', defaultEnabled: true, icon: ICON_TWITTER },
  { key: 'linkedin', label: 'LinkedIn', traitName: 'enableLinkedIn', defaultEnabled: true, icon: ICON_LINKEDIN },
  { key: 'pinterest', label: 'Pinterest', traitName: 'enablePinterest', defaultEnabled: false, icon: ICON_PINTEREST },
  { key: 'whatsapp', label: 'WhatsApp', traitName: 'enableWhatsapp', defaultEnabled: false, icon: ICON_WHATSAPP },
  { key: 'email', label: 'Email', traitName: 'enableEmail', defaultEnabled: false, icon: ICON_EMAIL },
  { key: 'copy', label: '复制链接', traitName: 'enableCopy', defaultEnabled: true, icon: ICON_COPY, asButton: true },
]

const SHAPE_OPTIONS = [
  { value: 'rounded', label: '圆角方形' },
  { value: 'square', label: '直角方形' },
  { value: 'circle', label: '圆形' },
]

const SIZE_OPTIONS = [
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
]

const BLOCK_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1B160C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>`

// ─────────────────────────────────────────────────────────────
// 默认子组件
// ─────────────────────────────────────────────────────────────

const LOCKED_CHILD = {
  selectable: false,
  hoverable: false,
  draggable: false,
  droppable: false,
  removable: false,
  copyable: false,
  editable: false,
  highlightable: false,
  layerable: false,
} as const

function buildListChildren() {
  return PLATFORMS.map(p => ({
    tagName: p.asButton ? 'button' : 'a',
    classes: ['wb-social-share__btn'],
    attributes: p.asButton
      ? {
          type: 'button',
          'data-wb-share': p.key,
          'aria-label': p.label,
        }
      : {
          'data-wb-share': p.key,
          'aria-label': p.label,
          href: '#',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
    components: [
      {
        tagName: 'span',
        classes: ['wb-social-share__icon'],
        ...LOCKED_CHILD,
        components: p.icon,
      },
    ],
    ...LOCKED_CHILD,
  }))
}

function buildDefaultChildren(titleText: string) {
  return [
    {
      tagName: 'h3',
      classes: ['wb-social-share__title'],
      components: titleText,
      draggable: false,
      droppable: false,
      removable: false,
      copyable: false,
    },
    {
      tagName: 'div',
      classes: ['wb-social-share__list'],
      ...LOCKED_CHILD,
      components: buildListChildren(),
    },
  ]
}

// ─────────────────────────────────────────────────────────────
// 运行时脚本：click → 打开分享弹窗 / 复制链接
// ─────────────────────────────────────────────────────────────

const shareScript = function (this: HTMLElement) {
  const root = this as HTMLElement & { __wbShareInit?: boolean }
  if (root.__wbShareInit) return
  root.__wbShareInit = true
  // 编辑器 iframe 里不拦截，方便选中 / 调整
  if (window.parent !== window) return

  const OPEN_OPTS = 'noopener,noreferrer,width=720,height=560'

  const getUrl = () =>
    (root.getAttribute('data-share-url') || '').trim() || window.location.href
  const getText = () =>
    (root.getAttribute('data-share-text') || '').trim() || document.title || ''

  const showCopied = (btn: HTMLElement) => {
    btn.setAttribute('data-share-copied', 'true')
    window.setTimeout(() => btn.removeAttribute('data-share-copied'), 1500)
  }

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } catch (_err) {
      // ignore
    }
    document.body.removeChild(ta)
  }

  const triggers = root.querySelectorAll<HTMLElement>('[data-wb-share]')
  triggers.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault()
      const platform = btn.getAttribute('data-wb-share') || ''
      const url = getUrl()
      const text = getText()
      const u = encodeURIComponent(url)
      const t = encodeURIComponent(text)

      switch (platform) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank', OPEN_OPTS)
          break
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`, '_blank', OPEN_OPTS)
          break
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`, '_blank', OPEN_OPTS)
          break
        case 'pinterest':
          window.open(
            `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`,
            '_blank',
            OPEN_OPTS,
          )
          break
        case 'whatsapp':
          window.open(`https://api.whatsapp.com/send?text=${t}%20${u}`, '_blank', OPEN_OPTS)
          break
        case 'email':
          window.location.href = `mailto:?subject=${t}&body=${u}`
          break
        case 'copy': {
          const nav = navigator as Navigator & {
            clipboard?: { writeText: (s: string) => Promise<void> }
          }
          if (nav.clipboard?.writeText) {
            nav.clipboard.writeText(url).then(() => showCopied(btn)).catch(() => {
              fallbackCopy(url)
              showCopied(btn)
            })
          } else {
            fallbackCopy(url)
            showCopied(btn)
          }
          break
        }
        default:
          break
      }
    })
  })
}

// ─────────────────────────────────────────────────────────────
// 组件注册
// ─────────────────────────────────────────────────────────────

const DEFAULT_TITLE = 'Share'

const DEFAULT_STYLES = `
  .wb-social-share {
    display: block;
    box-sizing: border-box;
    color: #111827;
  }
  .wb-social-share__title {
    margin: 0 0 16px;
    font-size: 20px;
    font-weight: 700;
    color: inherit;
    line-height: 1.2;
  }
  .wb-social-share__title:empty {
    display: none;
  }
  .wb-social-share__list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  .wb-social-share__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    color: #111827;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
  }
  .wb-social-share__btn:hover {
    border-color: #4f5ae4;
    color: #4f5ae4;
    transform: translateY(-1px);
  }
  .wb-social-share__btn:focus-visible {
    outline: 2px solid #4f5ae4;
    outline-offset: 2px;
  }
  .wb-social-share__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    line-height: 0;
  }
  .wb-social-share__icon svg {
    width: 100%;
    height: 100%;
  }
  /* 形状 */
  .wb-social-share[data-share-shape="square"] .wb-social-share__btn { border-radius: 0; }
  .wb-social-share[data-share-shape="circle"] .wb-social-share__btn { border-radius: 9999px; }
  /* 尺寸 */
  .wb-social-share[data-share-size="sm"] .wb-social-share__btn { width: 36px; height: 36px; }
  .wb-social-share[data-share-size="sm"] .wb-social-share__icon { width: 16px; height: 16px; }
  .wb-social-share[data-share-size="lg"] .wb-social-share__btn { width: 52px; height: 52px; }
  .wb-social-share[data-share-size="lg"] .wb-social-share__icon { width: 24px; height: 24px; }
  /* 平台启用 —— 默认隐藏所有按钮，仅展示 data-share-enabled 中列出的 */
  .wb-social-share .wb-social-share__btn { display: none; }
  .wb-social-share[data-share-enabled~="facebook"]  .wb-social-share__btn[data-wb-share="facebook"],
  .wb-social-share[data-share-enabled~="twitter"]   .wb-social-share__btn[data-wb-share="twitter"],
  .wb-social-share[data-share-enabled~="linkedin"]  .wb-social-share__btn[data-wb-share="linkedin"],
  .wb-social-share[data-share-enabled~="pinterest"] .wb-social-share__btn[data-wb-share="pinterest"],
  .wb-social-share[data-share-enabled~="whatsapp"]  .wb-social-share__btn[data-wb-share="whatsapp"],
  .wb-social-share[data-share-enabled~="email"]     .wb-social-share__btn[data-wb-share="email"],
  .wb-social-share[data-share-enabled~="copy"]      .wb-social-share__btn[data-wb-share="copy"] {
    display: inline-flex;
  }
  /* 复制成功反馈 */
  .wb-social-share__btn[data-share-copied="true"] {
    color: #16a34a;
    border-color: #16a34a;
  }
  @media (max-width: 639px) {
    .wb-social-share__btn { width: 40px; height: 40px; }
    .wb-social-share[data-share-size="lg"] .wb-social-share__btn { width: 48px; height: 48px; }
    .wb-social-share[data-share-size="sm"] .wb-social-share__btn { width: 34px; height: 34px; }
  }
`

function resolveTitleChild(model: any): any | null {
  const children = model?.components?.()
  if (!children || !children.length) return null
  for (let i = 0; i < children.length; i += 1) {
    const child = children.at ? children.at(i) : children.models?.[i]
    if (!child) continue
    const tag = `${child.get?.('tagName') ?? ''}`.toLowerCase()
    const classes: any[] = child.getClasses?.() ?? []
    const classNames = classes.map((c: any) =>
      typeof c === 'string' ? c : `${c?.get?.('name') ?? c?.id ?? ''}`,
    )
    if (tag === 'h3' && classNames.includes('wb-social-share__title')) return child
  }
  return null
}

function buildEnabledAttr(model: any): string {
  return PLATFORMS.filter((p) => !!model.get?.(p.traitName))
    .map((p) => p.key)
    .join(' ')
}

export function registerSocialShareComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(TYPE_SOCIAL_SHARE)) {
    return
  }

  const defaultEnabledProps: Record<string, boolean> = {}
  PLATFORMS.forEach((p) => {
    defaultEnabledProps[p.traitName] = p.defaultEnabled
  })

  domComponents.addType(TYPE_SOCIAL_SHARE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'social-share') {
        return { type: TYPE_SOCIAL_SHARE }
      }
      return false
    },
    model: {
      defaults: {
        name: '社媒分享',
        tagName: 'div',
        classes: ['wb-social-share'],
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'social-share',
          'data-share-shape': 'rounded',
          'data-share-size': 'md',
          'data-share-enabled': PLATFORMS.filter((p) => p.defaultEnabled)
            .map((p) => p.key)
            .join(' '),
        },
        styles: DEFAULT_STYLES,
        shareTitle: DEFAULT_TITLE,
        shareShape: 'rounded',
        shareSize: 'md',
        shareUrl: '',
        shareText: '',
        ...defaultEnabledProps,
        components: buildDefaultChildren(DEFAULT_TITLE),
        script: shareScript,
        'script-export': shareScript,
        traits: [
          makeTextTrait('标题文字', 'shareTitle', { placeholder: '留空则不显示标题' }),
          makeSelectTrait('按钮形状', 'shareShape', SHAPE_OPTIONS),
          makeSelectTrait('按钮大小', 'shareSize', SIZE_OPTIONS),
          ...PLATFORMS.map((p) => makeCheckboxTrait(`启用 ${p.label}`, p.traitName)),
          makeTextTrait('自定义分享 URL', 'shareUrl', {
            placeholder: '留空使用当前页面 URL，支持 {{post.url}}',
          }),
          makeTextTrait('自定义分享文案', 'shareText', {
            placeholder: '留空使用当前页面标题，支持 {{post.name}}',
          }),
        ],
      },
      init(this: any) {
        this.on('change:shareTitle', this.applyShareTitle)
        this.on('change:shareShape change:shareSize change:shareUrl change:shareText', this.applyShareAttrs)
        PLATFORMS.forEach((p) => {
          this.on(`change:${p.traitName}`, this.applyShareAttrs)
        })
        this.applyShareTitle()
        this.applyShareAttrs()
      },
      applyShareTitle(this: any) {
        const text = `${this.get('shareTitle') ?? ''}`
        const titleChild = resolveTitleChild(this)
        if (!titleChild) return
        // components(string) 会将文本作为 innerHTML 替换到节点；
        // 空字符串使 h3 变为空节点，CSS :empty 自动隐藏标题行。
        titleChild.components(text)
      },
      applyShareAttrs(this: any) {
        const shape = `${this.get('shareShape') ?? 'rounded'}`
        const size = `${this.get('shareSize') ?? 'md'}`
        const url = `${this.get('shareUrl') ?? ''}`.trim()
        const text = `${this.get('shareText') ?? ''}`.trim()
        const enabled = buildEnabledAttr(this)

        const attrs: Record<string, string> = {
          'data-wb-component': 'social-share',
          'data-share-shape': shape,
          'data-share-size': size,
          'data-share-enabled': enabled,
        }
        if (url) attrs['data-share-url'] = url
        if (text) attrs['data-share-text'] = text

        const prev = this.getAttributes?.() || {}
        const next = { ...prev, ...attrs }
        if (!url && prev['data-share-url']) delete next['data-share-url']
        if (!text && prev['data-share-text']) delete next['data-share-text']

        this.setAttributes?.(next)
      },
    },
  })

  editor.BlockManager.add(TYPE_SOCIAL_SHARE, {
    label: '社媒分享',
    category: 'Interactive',
    content: { type: TYPE_SOCIAL_SHARE },
    media: BLOCK_ICON,
  })
}
