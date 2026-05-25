import type { Editor } from 'grapesjs'
import { getImageManager } from '@/components/WebBuilder/utils/traitBridge'
import {
  makeImagePickerTrait,
  makeTextTrait,
  makeLinkTrait,
  makeLinkTargetTrait,
  makeSelectTrait,
} from '@/components/WebBuilder/utils/traitFactory'

export const WB_IMAGE_TYPE = 'wb-image'

/** 构建内部子组件定义（img 或 a > img） */
function buildInnerDef(
  src: string,
  alt: string,
  objectFit: string,
  link: string,
  linkTarget: string,
) {
  const imgDef: any = {
    tagName: 'img',
    droppable: false,
    selectable: false,
    hoverable: false,
    highlightable: false,
    copyable: false,
    removable: false,
    draggable: false,
    badgable: false,
    layerable: false,
    attributes: {
      src: src || 'https://placehold.co/800x450',
      alt,
      decoding: 'async',
      fetchpriority: 'auto',
    },
    style: { width: '100%', height: '100%', display: 'block', 'object-fit': objectFit },
  }

  if (link) {
    return {
      tagName: 'a',
      droppable: false,
      selectable: false,
      hoverable: false,
      highlightable: false,
      copyable: false,
      removable: false,
      draggable: false,
      badgable: false,
      layerable: false,
      attributes: { href: link, target: linkTarget },
      style: { display: 'block', width: '100%', height: '100%' },
      components: [imgDef],
    }
  }
  return imgDef
}

export function registerImageComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_IMAGE_TYPE)) return

  domComponents.addType(WB_IMAGE_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'image') {
        return { type: WB_IMAGE_TYPE }
      }
      return false
    },

    model: {
      defaults: {
        name: '图片',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        resizable: {
          tl: 0, tc: 0, tr: 0,
          ml: 1, mr: 1,
          bl: 0, bc: 0, br: 1,
        },
        attributes: {
          'data-wb-component': 'image',
        },
        // 初始默认样式：居中、最大宽度 100%，其余通过样式面板调整
        style: {
          display: 'block',
          width: 'auto',
          'max-width': '100%',
          height: 'auto',
          'margin-left': 'auto',
          'margin-right': 'auto',
          overflow: 'hidden',
        },

        // ── 属性面板（仅内容相关）──
        imageSrc: 'https://placehold.co/800x450',
        imageAlt: '',
        imageLink: '',
        imageLinkTarget: '_blank',
        // object-fit 作用于内层 img，无法通过样式面板直接设置，故保留为 trait
        imageObjectFit: 'cover',

        traits: [
          makeImagePickerTrait('图片', 'imageSrc', { showPreview: true }),
          makeTextTrait('替代文字', 'imageAlt', { placeholder: '图片描述（无障碍）' }),
          makeLinkTrait({ name: 'imageLink' }),
          makeLinkTargetTrait({ label: '链接打开方式', name: 'imageLinkTarget' }),
          makeSelectTrait('图片填充', 'imageObjectFit', [
            { value: 'cover',   label: '覆盖 (cover)' },
            { value: 'contain', label: '包含 (contain)' },
            { value: 'fill',    label: '拉伸 (fill)' },
            { value: 'none',    label: '原始 (none)' },
          ]),
        ],
      },

      init(this: any) {
        this._rebuildInner()
        this.on(
          'change:imageSrc change:imageAlt change:imageLink change:imageLinkTarget change:imageObjectFit',
          this._syncInner,
        )
      },

      /** 重建内部子组件（切换 link 有无时使用） */
      _rebuildInner(this: any) {
        const src        = this.get('imageSrc') || 'https://placehold.co/800x450'
        const alt        = this.get('imageAlt') || ''
        const link       = this.get('imageLink') || ''
        const linkTarget = this.get('imageLinkTarget') || '_blank'
        const objectFit  = this.get('imageObjectFit') || 'cover'
        this.components().reset([buildInnerDef(src, alt, objectFit, link, linkTarget)])
      },

      /** 同步内容属性到子组件，link 状态切换时重建 */
      _syncInner(this: any) {
        const src        = this.get('imageSrc') || 'https://placehold.co/800x450'
        const alt        = this.get('imageAlt') || ''
        const link       = this.get('imageLink') || ''
        const linkTarget = this.get('imageLinkTarget') || '_blank'
        const objectFit  = this.get('imageObjectFit') || 'cover'

        const children   = this.components().models || []
        const firstChild = children[0]
        const currentTag = firstChild?.get?.('tagName')
        const needLink   = !!link

        if ((currentTag === 'a') !== needLink) {
          this._rebuildInner()
          return
        }

        if (needLink) {
          firstChild?.addAttributes?.({ href: link, target: linkTarget })
          const img = firstChild?.components?.()?.models?.[0]
          img?.addAttributes?.({ src, alt, decoding: 'async', fetchpriority: 'auto' })
          img?.addStyle?.({ 'object-fit': objectFit })
        } else {
          firstChild?.addAttributes?.({ src, alt, decoding: 'async', fetchpriority: 'auto' })
          firstChild?.addStyle?.({ 'object-fit': objectFit })
        }
      },

      /** 双击时打开素材库 */
      openAssetsDialog(this: any) {
        const im = getImageManager()
        if (!im) return
        im.openAssetsDialogWithTarget({
          selectCallback: (asset: any) => {
            const src = asset?.getSrc?.() ?? asset?.src ?? ''
            if (src) this.set('imageSrc', src)
          },
        })
      },
    },

    view: {
      events() {
        return { dblclick: 'onDblClick' }
      },
      onDblClick(this: any, e: MouseEvent) {
        e.stopPropagation()
        this.model.openAssetsDialog()
      },
    },
  })
}
