import type { Editor } from 'grapesjs'
import { getImageManager } from '../../../traitBridge.js'
import {
  makeImagePickerTrait,
  makeTextTrait,
  makeLinkTrait,
  makeLinkTargetTrait,
  makeSelectTrait,
} from '../../../traitFactory.js'

export const WB_IMAGE_TYPE = 'wb-image'

const DEFAULT_IMAGE_SRC = 'https://placehold.co/800x450'
const IMAGE_DESKTOP_DEVICE_ID = 'desktop'
const IMAGE_MOBILE_DEVICE_ID = 'mobile'
const FALLBACK_MOBILE_MEDIA = '(max-width: 767px)'

const LOCKED_INNER_NODE = {
  droppable: false,
  selectable: false,
  hoverable: false,
  highlightable: false,
  copyable: false,
  removable: false,
  draggable: false,
  badgable: false,
  layerable: false,
}

function normalizeImageUrl(value: unknown): string {
  return `${value ?? ''}`.trim()
}

function readSelectedDeviceId(editor: Editor): string {
  const selectedDevice = (editor as any)?.Devices?.getSelected?.() ?? (editor as any)?.DeviceManager?.getSelected?.()
  return `${selectedDevice?.get?.('id') ?? selectedDevice?.id ?? IMAGE_DESKTOP_DEVICE_ID}`.trim() || IMAGE_DESKTOP_DEVICE_ID
}

function readDeviceMediaQuery(editor: Editor, deviceId: string): string {
  const deviceManager = (editor as any)?.Devices ?? (editor as any)?.DeviceManager
  const device = deviceManager?.get?.(deviceId)
  const widthMedia = `${device?.getWidthMedia?.() ?? device?.get?.('widthMedia') ?? device?.widthMedia ?? ''}`.trim()
  const width = `${device?.getWidth?.() ?? device?.get?.('width') ?? device?.width ?? ''}`.trim()
  const rawMedia = widthMedia || width
  if (!rawMedia) return FALLBACK_MOBILE_MEDIA
  if (rawMedia.includes('(')) return rawMedia
  return `(max-width: ${rawMedia})`
}

function getActiveImageProp(editor: Editor): 'imageSrc' | 'imageMobileSrc' {
  return readSelectedDeviceId(editor).toLowerCase() === IMAGE_MOBILE_DEVICE_ID
    ? 'imageMobileSrc'
    : 'imageSrc'
}

function buildSourceDef(src: string, media: string) {
  return {
    tagName: 'source',
    ...LOCKED_INNER_NODE,
    attributes: {
      media,
      srcset: src,
    },
  }
}

function buildImgDef(
  src: string,
  alt: string,
  objectFit: string,
) {
  return {
    tagName: 'img',
    ...LOCKED_INNER_NODE,
    attributes: {
      src: src || DEFAULT_IMAGE_SRC,
      alt,
      decoding: 'async',
      fetchpriority: 'auto',
    },
    style: { width: '100%', height: 'auto', display: 'block', 'object-fit': objectFit },
  }
}

/** 构建内部子组件定义（picture 或 a > picture） */
function buildInnerDef(
  src: string,
  mobileSrc: string,
  alt: string,
  objectFit: string,
  link: string,
  linkTarget: string,
  mobileMedia: string,
) {
  const pictureDef: any = {
    tagName: 'picture',
    ...LOCKED_INNER_NODE,
    attributes: {
      class: 'wb-image__picture',
    },
    style: { display: 'block', width: '100%', height: 'auto' },
    components: [
      ...(mobileSrc ? [buildSourceDef(mobileSrc, mobileMedia)] : []),
      buildImgDef(src, alt, objectFit),
    ],
  }

  if (link) {
    return {
      tagName: 'a',
      ...LOCKED_INNER_NODE,
      attributes: { href: link, target: linkTarget },
      style: { display: 'block', width: '100%', height: '100%' },
      components: [pictureDef],
    }
  }
  return pictureDef
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
          width: '100%',
          height: 'auto',
          overflow: 'hidden',
        },

        // ── 属性面板（仅内容相关）──
        imageSrc: DEFAULT_IMAGE_SRC,
        imageMobileSrc: '',
        imageActiveSrc: DEFAULT_IMAGE_SRC,
        imageAlt: '',
        imageLink: '',
        imageLinkTarget: '_blank',
        // object-fit 作用于内层 img，无法通过样式面板直接设置，故保留为 trait
        imageObjectFit: 'cover',

        traits: [
          makeImagePickerTrait('当前设备图片', 'imageActiveSrc', { showPreview: true }),
          makeImagePickerTrait('桌面图片', 'imageSrc', { showPreview: true }),
          makeImagePickerTrait('移动端图片', 'imageMobileSrc', { showPreview: true }),
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
        this._wbImageSyncingActiveSrc = false
        this._syncActiveImageTrait()
        this._rebuildInner()
        this.on(
          'change:imageSrc change:imageMobileSrc change:imageAlt change:imageLink change:imageLinkTarget change:imageObjectFit',
          this._syncInner,
        )
        this.on('change:imageSrc change:imageMobileSrc', this._syncActiveImageTrait)
        this.on('change:imageActiveSrc', this._syncCurrentDeviceImage)
        this._wbImageDeviceSelectHandler = () => {
          this._syncActiveImageTrait()
        }
        ;(editor as any).on?.('device:select', this._wbImageDeviceSelectHandler)
        this.on('remove', () => (editor as any).off?.('device:select', this._wbImageDeviceSelectHandler))
      },

      /** 重建内部子组件（切换 link 有无时使用） */
      _rebuildInner(this: any) {
        const src        = normalizeImageUrl(this.get('imageSrc')) || DEFAULT_IMAGE_SRC
        const mobileSrc  = normalizeImageUrl(this.get('imageMobileSrc'))
        const alt        = this.get('imageAlt') || ''
        const link       = this.get('imageLink') || ''
        const linkTarget = this.get('imageLinkTarget') || '_blank'
        const objectFit  = this.get('imageObjectFit') || 'cover'
        const mobileMedia = readDeviceMediaQuery(editor, IMAGE_MOBILE_DEVICE_ID)
        this.components().reset([buildInnerDef(src, mobileSrc, alt, objectFit, link, linkTarget, mobileMedia)])
      },

      /** 同步内容属性到子组件，link 状态切换时重建 */
      _syncInner(this: any) {
        const src        = normalizeImageUrl(this.get('imageSrc')) || DEFAULT_IMAGE_SRC
        const mobileSrc  = normalizeImageUrl(this.get('imageMobileSrc'))
        const alt        = this.get('imageAlt') || ''
        const link       = this.get('imageLink') || ''
        const objectFit  = this.get('imageObjectFit') || 'cover'

        const children   = this.components().models || []
        const firstChild = children[0]
        const currentTag = firstChild?.get?.('tagName')
        const needLink   = !!link

        if ((currentTag === 'a') !== needLink) {
          this._rebuildInner()
          return
        }

        const picture = needLink ? firstChild?.components?.()?.models?.[0] : firstChild
        if (!picture || picture.get?.('tagName') !== 'picture') {
          this._rebuildInner()
          return
        }

        this._rebuildInner()

        if (mobileSrc || src || alt || objectFit) {
          this._syncActiveImageTrait?.()
        }
      },

      _syncActiveImageTrait(this: any) {
        const activeProp = getActiveImageProp(editor)
        const fallback = normalizeImageUrl(this.get('imageSrc')) || DEFAULT_IMAGE_SRC
        const activeValue = activeProp === 'imageMobileSrc'
          ? normalizeImageUrl(this.get('imageMobileSrc')) || fallback
          : fallback

        this._wbImageSyncingActiveSrc = true
        this.set?.('imageActiveSrc', activeValue, { silent: true })
        this._wbImageSyncingActiveSrc = false
        this._syncActiveImageTraitLabel?.(activeProp)
      },

      _syncActiveImageTraitLabel(this: any, activeProp: 'imageSrc' | 'imageMobileSrc') {
        const trait = this.getTrait?.('imageActiveSrc')
        trait?.set?.('label', activeProp === 'imageMobileSrc' ? '当前设备图片（移动端）' : '当前设备图片（桌面）')
        const selected = (editor as any).getSelected?.()
        if (selected === this) {
          ;(editor as any).TraitManager?.render?.()
        }
      },

      _syncCurrentDeviceImage(this: any) {
        if (this._wbImageSyncingActiveSrc) return
        const activeProp = getActiveImageProp(editor)
        this.set?.(activeProp, normalizeImageUrl(this.get('imageActiveSrc')))
      },

      _setImageForCurrentDevice(this: any, src: string) {
        const activeProp = getActiveImageProp(editor)
        this.set(activeProp, src)
        this._syncActiveImageTrait()
      },

      /** 双击时打开素材库 */
      openAssetsDialog(this: any) {
        const im = getImageManager()
        if (!im) return
        im.openAssetsDialogWithTarget({
          selectCallback: (asset: any) => {
            const src = asset?.getSrc?.() ?? asset?.src ?? ''
            if (src) this._setImageForCurrentDevice(src)
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
