import { widthTraits } from '@/components/WebBuilder/components/registries/shared/sharedTraits'
import { WB_LAYOUT_BASE_TYPE } from '@/components/WebBuilder/components/registries/layout/layoutBase'
import type { Editor } from 'grapesjs'

export const WB_CONTAINER_TYPE = 'wb-container'

export function createContainerBlockContent(overrides: Record<string, any> = {}) {
  const { style = {}, ...restOverrides } = overrides

  return {
    type: WB_CONTAINER_TYPE,
    contentWidth: 'boxed',
    boxedWidth: 1280,
    widthValue: 100,
    widthUnit: '%',
    style: {
      ...style,
    },
    ...restOverrides,
  }
}

/**
 * 注册容器组件（参考 Elementor Container 的核心布局能力）
 *
 * flex 布局属性（flex-direction、justify-content、align-items、flex-wrap、gap）
 * 和背景属性已迁移到 StyleManager（wb-layout / wb-background sector），
 * 初始值通过 defaults.style 提供，用户通过"样式"面板修改。
 * Traits 仅保留宽度相关属性（contentWidth / boxed 模式）。
 */
export function registerContainerComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_CONTAINER_TYPE)) {
    return
  }

  domComponents.addType(WB_CONTAINER_TYPE, {
    extend: WB_LAYOUT_BASE_TYPE,
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'container') {
        return { type: WB_CONTAINER_TYPE }
      }
      return false
    },
    model: {
      defaults: {
        name: '容器',
        tagName: 'div',
        draggable: '*',
        droppable: '*',
        selectable: true,
        stylable: true,
        attributes: {
          'data-wb-component': 'container',
        },
        style: {
          display: 'flex',
          'flex-direction': 'column',
          'justify-content': 'flex-start',
          'align-items': 'stretch',
          'flex-wrap': 'nowrap',
          'column-gap': '0',
          'row-gap': '0',
          'min-height': '0',
          width: '100%',
          'box-sizing': 'border-box',
          padding: '0',
          'background-color': 'transparent',
        },
        traits: [
          ...widthTraits,
        ],
      },
      init(this: any) {
        this.on(
          'change:contentWidth change:boxedWidth change:widthValue change:widthUnit',
          this.handleWidthTraitChange,
        )
        this.applyWidthStyles()
      },
    },
  })
}
