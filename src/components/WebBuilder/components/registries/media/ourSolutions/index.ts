import type { Editor } from 'grapesjs'
import { injectStyleOnce } from '@/components/WebBuilder/utils/injectStyle'
import {
  buildOurSolutionsTree,
  getOurSolutionsSlideRoot,
  getOurSolutionsSlideTraits,
  syncRootContent,
  syncSolutionItem,
  WB_OUR_SOLUTIONS_ITEM_TYPE,
  WB_OUR_SOLUTIONS_TYPE,
} from './helpers'
import { makeOurSolutionsScript } from './script'
import { SOLUTIONS_CSS } from './style'

export {
  WB_OUR_SOLUTIONS_ITEM_TYPE,
  WB_OUR_SOLUTIONS_TYPE,
} from './helpers'

export { SOLUTIONS_CSS } from './style'

export function registerOurSolutionsComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_OUR_SOLUTIONS_TYPE)) return

  injectStyleOnce(editor, 'our-solutions', SOLUTIONS_CSS)

  domComponents.addType(WB_OUR_SOLUTIONS_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.classList?.contains('wb-our-solutions__slide')
        ? { type: WB_OUR_SOLUTIONS_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '解决方案轮播项',
        tagName: 'div',
        selectable: true,
        layerable: true,
        draggable: '.swiper-wrapper',
        droppable: false,
        osTitle: 'Solution',
        osImageSrc: '',
        osHref: '#',
        osLinkText: 'Details',
        traits: getOurSolutionsSlideTraits(),
      },
      init(this: any) {
        this.syncSolutionItem = () => {
          if (this.__wbSyncingSolutionItem) return
          this.__wbSyncingSolutionItem = true
          try {
            syncSolutionItem(this)
          } finally {
            this.__wbSyncingSolutionItem = false
          }
        }
        this.listenTo(
          this,
          'change:osTitle change:osImageSrc change:osHref change:osLinkText',
          this.syncSolutionItem,
        )
        this.syncSolutionItem()
      },
    },
  })

  domComponents.addType(WB_OUR_SOLUTIONS_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.classList?.contains('wb-our-solutions')
        ? { type: WB_OUR_SOLUTIONS_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Our Solutions',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        solTitle: 'Our Solutions',
        solPrimaryText: 'Inquiry Now',
        solPrimaryHref: '#',
        solSecondaryText: 'View All',
        solSecondaryHref: '#',
        attributes: {
          class: 'wb-our-solutions',
        },
        styles: SOLUTIONS_CSS,
        traits: [
          { type: 'text', label: '标题', name: 'solTitle', changeProp: true },
          { type: 'text', label: '主按钮文案', name: 'solPrimaryText', changeProp: true },
          { type: 'page-link', label: '主按钮链接', name: 'solPrimaryHref', placeholder: '#', changeProp: true },
          { type: 'text', label: '次按钮文案', name: 'solSecondaryText', changeProp: true },
          { type: 'page-link', label: '次按钮链接', name: 'solSecondaryHref', placeholder: '#', changeProp: true },
        ],
        script: makeOurSolutionsScript(),
        components: buildOurSolutionsTree(),
      },
      init(this: any) {
        this.listenTo(this, 'change:solTitle change:solPrimaryText change:solPrimaryHref change:solSecondaryText change:solSecondaryHref', () => syncRootContent(this))
        syncRootContent(this)
      },
    },
  })

  editor.on('component:selected', (component: any) => {
    const type = component?.get?.('type')
    if (type === WB_OUR_SOLUTIONS_TYPE || type === WB_OUR_SOLUTIONS_ITEM_TYPE) return

    const slide = getOurSolutionsSlideRoot(component)
    if (slide && slide !== component) {
      editor.select?.(slide)
    }
  })

  editor.on('rte:enable', (view: any) => {
    const slide = getOurSolutionsSlideRoot(view?.model)
    if (slide) {
      editor.select?.(slide)
    }
  })
}
