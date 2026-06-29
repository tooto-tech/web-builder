import type { Editor } from 'grapesjs'
import { makeTextTrait, makeLinkTrait, makeLinkTargetTrait, makeSelectTrait } from '../../../traitFactory.js'

export const WB_BUTTON_TYPE = 'wb-button'

const BUTTON_EFFECT_STYLES = `
  .wb-btn--link {
    transition: color 0.18s ease, text-decoration-color 0.18s ease;
  }
  .wb-btn--hover-underline {
    position: relative;
    text-decoration: none !important;
  }
  .wb-btn--hover-underline::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 0;
    height: 1px;
    background: currentColor;
    transition: width 0.18s ease;
  }
  .wb-btn--hover-underline:hover::after {
    width: 100%;
  }
  .wb-btn--hover-bg-fade {
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
  }
  .wb-btn--hover-bg-fade:hover {
    background-color: rgba(64, 158, 255, 0.08);
    box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.25);
  }
  .wb-btn--hover-scale-sm {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .wb-btn--hover-scale-sm:hover {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.14);
  }
  .wb-btn--hover-scale-md {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .wb-btn--hover-scale-md:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  }
  .wb-btn--hover-raise {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .wb-btn--hover-raise:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.2);
  }
  .wb-btn--hover-border-glow {
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .wb-btn--hover-border-glow:hover {
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.6), 0 0 18px rgba(56, 189, 248, 0.55);
    border-color: rgba(56, 189, 248, 0.9);
  }
  .wb-btn--hover-fill-left {
    position: relative;
    overflow: hidden;
  }
  .wb-btn--hover-fill-left::before {
    content: '';
    position: absolute;
    inset: 0;
    width: 0;
    background: rgba(59, 130, 246, 0.12);
    transition: width 0.22s ease;
    z-index: -1;
  }
  .wb-btn--hover-fill-left:hover::before {
    width: 100%;
  }
  .wb-btn--hover-fill-bottom {
    position: relative;
  }
  .wb-btn--hover-fill-bottom::after {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    bottom: -2px;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, #22c55e);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.22s ease;
  }
  .wb-btn--hover-fill-bottom:hover::after {
    transform: scaleX(1);
  }
  .wb-btn--hover-pulse {
    position: relative;
    z-index: 0;
  }
  .wb-btn--hover-pulse::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: currentColor;
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.24s ease, transform 0.24s ease;
    z-index: -1;
  }
  .wb-btn--hover-pulse:hover::after {
    opacity: 0.12;
    transform: scale(1.05);
  }
`

function getButtonTraits() {
  return [
    makeTextTrait('按钮文字', 'buttonText', { placeholder: '请输入按钮文字' }),
    makeSelectTrait('类型', 'buttonType', [
      { value: 'default', label: '默认按钮' },
      { value: 'link', label: '文本链接' },
    ]),
    makeSelectTrait('效果', 'buttonEffect', [
      { value: 'none', label: '无' },
      { value: 'hover-underline', label: '下划线出现' },
      { value: 'hover-bg-fade', label: '背景淡入' },
      { value: 'hover-scale-sm', label: '轻微放大' },
      { value: 'hover-scale-md', label: '明显放大' },
      { value: 'hover-raise', label: '轻微上浮阴影' },
      { value: 'hover-border-glow', label: '描边高亮' },
      { value: 'hover-fill-left', label: '左向填充背景' },
      { value: 'hover-fill-bottom', label: '底部高亮条' },
      { value: 'hover-pulse', label: '柔和呼吸' },
    ]),
    makeLinkTrait(),
    makeLinkTargetTrait({ name: 'linkTarget' }),
  ]
}

/**
 * 注册按钮组件（参考 Elementor Button Widget）
 *
 * 视觉样式属性（background-color、color、border-radius、padding、font-size）
 * 已迁移到 StyleManager，初始值通过 defaults.style 提供。
 * Traits 仅保留逻辑属性：buttonText、linkUrl、linkTarget。
 */
export function registerButtonComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_BUTTON_TYPE)) {
    return
  }

  domComponents.addType(WB_BUTTON_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'button') {
        return { type: WB_BUTTON_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '按钮',
        tagName: 'a',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'button',
          href: '#',
          target: '_self',
        },
        style: {
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          gap: '8px',
          padding: '12px 24px',
          'background-color': '#409eff',
          color: '#ffffff',
          'border-radius': '8px',
          'text-decoration': 'none',
          'font-size': '16px',
          'font-weight': '500',
          cursor: 'pointer',
          'line-height': '1.5',
          'white-space': 'nowrap',
          border: 'none',
        },
        buttonText: '按钮',
        buttonType: 'default',
        buttonEffect: 'none',
        linkUrl: '#',
        linkTarget: '_self',
        components: [{ type: 'textnode', content: '按钮' }],
        styles: BUTTON_EFFECT_STYLES,
        traits: getButtonTraits(),
      },
      init(this: any) {
        // 兼容老项目历史数据：若按钮实例携带旧版 text 链接 trait，启动时强制升级为 page-link。
        const traits = this.get?.('traits')
        const hasPageLink = Array.isArray(traits)
          && traits.some((t: any) => typeof t === 'object' && t?.name === 'linkUrl' && t?.type === 'page-link')
        if (!hasPageLink) {
          this.set?.('traits', getButtonTraits())
        }

        this.on('change:buttonText', this.applyButtonText)
        this.on('change:linkUrl change:linkTarget', this.applyLinkAttrs)
        this.on('change:buttonType', this.applyButtonVariant)
        this.on('change:buttonEffect', this.applyButtonVariant)
        this.applyButtonText()
        this.applyLinkAttrs()
        this.applyButtonVariant()
      },
      applyButtonText(this: any) {
        const text = `${this.get('buttonText') ?? '按钮'}`
        const children = this.components?.()
        if (children?.reset) {
          children.reset([{ type: 'textnode', content: text }])
        } else {
          this.components(text)
        }
      },
      applyLinkAttrs(this: any) {
        const url = `${this.get('linkUrl') ?? '#'}`
        const target = `${this.get('linkTarget') ?? '_self'}`
        this.addAttributes({ href: url, target })
      },
      applyButtonVariant(this: any) {
        const type = `${this.get('buttonType') ?? 'default'}`
        const effect = `${this.get('buttonEffect') ?? 'none'}`

        // Base reset for classes and styles that depend on type/effect.
        const classes = new Set<string>((this.getClasses?.() as string[]) || [])

        // Remove all effect-related classes first
        ;[
          'wb-btn--hover-underline',
          'wb-btn--hover-bg-fade',
          'wb-btn--hover-scale-sm',
          'wb-btn--hover-scale-md',
          'wb-btn--hover-raise',
          'wb-btn--hover-border-glow',
          'wb-btn--hover-fill-left',
          'wb-btn--hover-fill-bottom',
          'wb-btn--hover-pulse',
        ].forEach(c => classes.delete(c))

        // Remove type-related classes
        classes.delete('wb-btn--link')

        // Apply type styles
        const style = { ...(this.getStyle?.() ?? {}) } as Record<string, string>

        if (type === 'link') {
          // 文本链接：类似普通 a 标签，带下划线
          classes.add('wb-btn--link')
          style['display'] = 'inline';
          style['padding'] = '0';
          style['background-color'] = 'transparent';
          style['color'] = style['color'] || '#409eff';
          style['border-radius'] = '0';
          style['text-decoration'] = 'underline';
          style['font-weight'] = style['font-weight'] || '400';
        } else {
          // 默认按钮：保留原本的按钮感
          style['display'] = style['display'] || 'inline-flex';
          style['padding'] = style['padding'] || '10px 24px';
          style['background-color'] = style['background-color'] || '#409eff';
          style['color'] = style['color'] || '#ffffff';
          style['border-radius'] = style['border-radius'] || '4px';
          style['text-decoration'] = 'none';
          style['font-weight'] = style['font-weight'] || '500';
        }

        // Apply hover effect class (only meaningful for default type, but允许 link 也用)
        const effectClassMap: Record<string, string> = {
          'hover-underline': 'wb-btn--hover-underline',
          'hover-bg-fade': 'wb-btn--hover-bg-fade',
          'hover-scale-sm': 'wb-btn--hover-scale-sm',
          'hover-scale-md': 'wb-btn--hover-scale-md',
          'hover-raise': 'wb-btn--hover-raise',
          'hover-border-glow': 'wb-btn--hover-border-glow',
          'hover-fill-left': 'wb-btn--hover-fill-left',
          'hover-fill-bottom': 'wb-btn--hover-fill-bottom',
          'hover-pulse': 'wb-btn--hover-pulse',
        }
        const cls = effectClassMap[effect]
        if (cls) classes.add(cls)

        this.setClass?.(Array.from(classes))
        this.setStyle?.(style)
      },
    },
  })
}
