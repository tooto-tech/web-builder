import type { Editor } from 'grapesjs'
import { makeSvgIconPickerTrait, makeTextTrait } from '../../../traitFactory.js'
import { normalizeSvgMarkup } from '../../../svgIcon.js'

export const WB_ICON_TYPE = 'wb-icon'

const DEFAULT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 3.75l2.548 5.164 5.702.829-4.125 4.021.974 5.679L12 16.762l-5.099 2.681.974-5.679-4.125-4.021 5.702-.829L12 3.75z"/>
</svg>`

function lockInnerSvgTree(model: any) {
  if (!model) return

  model.set?.({
    draggable: false,
    droppable: false,
    selectable: false,
    editable: false,
    hoverable: false,
    highlightable: false,
    copyable: false,
    removable: false,
    layerable: false,
    badgable: false,
    toolbar: [],
  })

  const tagName = `${model.get?.('tagName') ?? ''}`.toLowerCase()
  if (tagName === 'svg') {
    model.addStyle?.({
      width: '100%',
      height: '100%',
      display: 'block',
      'pointer-events': 'none',
    })
    model.addAttributes?.({
      focusable: 'false',
      'aria-hidden': 'true',
    })
  }

  const children = model.components?.()?.models ?? []
  children.forEach((child: any) => lockInnerSvgTree(child))
}

function syncAccessibility(model: any) {
  const attrs = { ...(model.getAttributes?.() ?? {}) }
  const label = `${model.get('iconAriaLabel') ?? ''}`.trim()

  if (label) {
    delete attrs['aria-hidden']
    attrs.role = 'img'
    attrs['aria-label'] = label
    if (typeof model.setAttributes === 'function') {
      model.setAttributes(attrs)
    } else {
      model.addAttributes?.(attrs)
    }
    return
  }

  delete attrs.role
  delete attrs['aria-label']
  attrs['aria-hidden'] = 'true'
  if (typeof model.setAttributes === 'function') {
    model.setAttributes(attrs)
  } else {
    model.addAttributes?.(attrs)
  }
}

export function registerIconComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_ICON_TYPE)) return

  domComponents.addType(WB_ICON_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'icon') {
        return { type: WB_ICON_TYPE }
      }
      return false
    },

    model: {
      defaults: {
        name: '图标',
        tagName: 'span',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        resizable: {
          tl: 0, tc: 1, tr: 1,
          ml: 1, mr: 1,
          bl: 1, bc: 1, br: 1,
        },
        attributes: {
          'data-wb-component': 'icon',
          'aria-hidden': 'true',
        },
        style: {
          display: 'inline-flex',
          width: '32px',
          height: '32px',
          'align-items': 'center',
          'justify-content': 'center',
          color: '#111827',
          'line-height': '0',
          'vertical-align': 'middle',
        },
        iconSource: 'lucide:star',
        iconSvg: DEFAULT_ICON_SVG,
        iconAriaLabel: '',
        traits: [
          makeSvgIconPickerTrait('图标', 'iconSvg', { sourceName: 'iconSource' }),
          makeTextTrait('无障碍标签', 'iconAriaLabel', { placeholder: '例如：搜索图标' }),
        ],
      },

      init(this: any) {
        this._syncSvg()
        syncAccessibility(this)
        this.on('change:iconSvg', this._syncSvg)
        this.on('change:iconAriaLabel', () => syncAccessibility(this))
      },

      _syncSvg(this: any) {
        const svgMarkup = `${this.get('iconSvg') ?? ''}`.trim()
        if (!svgMarkup) {
          this.components().reset([])
          return
        }

        this.components(normalizeSvgMarkup(svgMarkup))
        const children = this.components().models ?? []
        children.forEach((child: any) => lockInnerSvgTree(child))
      },
    },
  })
}
