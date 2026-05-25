/**
 * video.ts — Video Modal Player 组件
 *
 * 封面图 + 播放按钮，点击后弹窗播放视频。
 * 支持从素材库选取封面图和本地视频。
 * 支持外部视频链接（YouTube embed / 其他 iframe URL）。
 *
 * Traits: 视频来源（本地/外部）、视频 URL、封面图、播放图标样式、播放图标大小
 */
import type { GrapesEditor } from '../../../../types/editor'
import { getImageManager } from '@/components/WebBuilder/utils/traitBridge'
import {
  makeImagePickerTrait,
  makeSelectTrait,
} from '@/components/WebBuilder/utils/traitFactory'

export const WB_VIDEO_TYPE = 'wb-video'

/* ── 子组件标记 ─────────────────────────────────────────── */
const CHILD = {
  selectable: false,
  hoverable: false,
  draggable: false,
  droppable: false,
  layerable: false,
  highlightable: false,
  copyable: false,
  removable: false,
  badgable: false,
} as const

/* ── 关闭图标 SVG ──────────────────────────────────────── */
const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
  width="24" height="24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

/* ── 组件脚本（在 iframe 和发布页面都执行）───────────────── */
const script = function (this: HTMLElement) {
  const el = this as HTMLElement & { __videoInit?: boolean }

  const thumb = el.querySelector('.wb-video__thumb') as HTMLImageElement | null
  const play  = el.querySelector('.wb-video__play')  as HTMLElement | null
  const modal = el.querySelector('.wb-video__modal') as HTMLElement | null
  const close = el.querySelector('.wb-video__close') as HTMLElement | null
  const cover = el.querySelector('.wb-video__cover') as HTMLElement | null
  const iframe = el.querySelector('.wb-video__iframe') as HTMLIFrameElement | null
  const nativeVideo = el.querySelector('.wb-video__native') as HTMLVideoElement | null

  if (!cover || !play || !modal) return

  /* ── 播放图标 SVG ────────────────────────────────────── */
  const ICONS: Record<string, string> = {
    'circle-outline': '<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="40" cy="40" r="38" stroke="white" stroke-width="3" fill="rgba(0,0,0,0.35)"/>' +
      '<polygon points="32,24 58,40 32,56" fill="white"/></svg>',
    'circle-filled': '<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="40" cy="40" r="38" fill="white"/>' +
      '<polygon points="33,24 59,40 33,56" fill="#111827"/></svg>',
    'minimal': '<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<filter id="ds"><feDropShadow dx="0" dy="1" stdDeviation="3" flood-opacity="0.5"/></filter>' +
      '<polygon points="20,10 70,40 20,70" fill="white" filter="url(#ds)"/></svg>',
  }

  /* ── 视觉更新 ────────────────────────────────────────── */
  function updateVisuals() {
    const coverUrl  = el.getAttribute('data-cover') || ''
    const iconStyle = el.getAttribute('data-play-icon') || 'circle-outline'
    const iconSize  = el.getAttribute('data-play-size') || '64'

    if (thumb) {
      if (coverUrl) {
        thumb.src = coverUrl
        thumb.style.display = 'block'
      } else {
        thumb.removeAttribute('src')
        thumb.style.display = 'none'
      }
    }

    if (play) {
      play.innerHTML = ICONS[iconStyle] || ICONS['circle-outline']
      play.style.width  = iconSize + 'px'
      play.style.height = iconSize + 'px'
    }
  }

  updateVisuals()

  /* ── MutationObserver 响应编辑器 trait 修改 ────────────── */
  const observer = new MutationObserver(function (mutations) {
    for (let i = 0; i < mutations.length; i++) {
      const attr = mutations[i].attributeName
      if (attr === 'data-cover' || attr === 'data-play-icon' || attr === 'data-play-size') {
        updateVisuals()
        break
      }
    }
  })
  observer.observe(el, { attributes: true, attributeFilter: ['data-cover', 'data-play-icon', 'data-play-size'] })

  /* ── 弹窗事件（只绑定一次）─────────────────────────────── */
  if (el.__videoInit) return
  el.__videoInit = true

  function openModal() {
    const url    = el.getAttribute('data-video-url') || ''
    const source = el.getAttribute('data-video-source') || 'external'

    if (!url) return

    if (source === 'local') {
      // 本地视频：用 <video> 播放
      if (nativeVideo) {
        nativeVideo.src = url
        nativeVideo.style.display = 'block'
        nativeVideo.play()
      }
      if (iframe) iframe.style.display = 'none'
    } else {
      // 外部视频：用 <iframe>（YouTube embed 等）
      if (iframe) {
        const sep = url.indexOf('?') >= 0 ? '&' : '?'
        iframe.src = url + sep + 'autoplay=1'
        iframe.style.display = 'block'
      }
      if (nativeVideo) nativeVideo.style.display = 'none'
    }

    modal!.classList.add('is-open')
  }

  function closeModal() {
    modal!.classList.remove('is-open')
    if (iframe) iframe.src = ''
    if (nativeVideo) {
      nativeVideo.pause()
      nativeVideo.src = ''
    }
  }

  cover!.addEventListener('click', openModal)
  if (close) close.addEventListener('click', closeModal)
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal()
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal()
  })
}

/* ── 组件注册 ──────────────────────────────────────────── */

export function registerVideoComponent(editor: GrapesEditor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_VIDEO_TYPE)) return

  domComponents.addType(WB_VIDEO_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'video'
        ? { type: WB_VIDEO_TYPE }
        : false,

    model: {
      defaults: {
        name: '视频',
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
          'data-wb-component': 'video',
          'data-video-source': 'external',
          'data-video-url': '',
          'data-cover': '',
          'data-play-icon': 'circle-outline',
          'data-play-size': '64',
        },

        style: {
          display: 'block',
          width: '100%',
          'max-width': '100%',
        },

        // ── model props（changeProp traits）
        videoSource: 'external',
        videoUrl: '',
        videoCover: '',
        playIcon: 'circle-outline',
        playSize: '64',

        traits: [
          makeSelectTrait('视频来源', 'videoSource', [
            { value: 'external', label: '外部链接（YouTube 等）' },
            { value: 'local', label: '本地视频（素材库）' },
          ]),
          makeImagePickerTrait('视频地址', 'videoUrl', { showPreview: false }),
          makeImagePickerTrait('封面图', 'videoCover', { showPreview: true }),
          makeSelectTrait('播放图标', 'playIcon', [
            { value: 'circle-outline', label: '圆形描边' },
            { value: 'circle-filled', label: '圆形实心' },
            { value: 'minimal', label: '简约三角' },
          ]),
          makeSelectTrait('图标大小', 'playSize', [
            { value: '48', label: '小 (48px)' },
            { value: '64', label: '中 (64px)' },
            { value: '80', label: '大 (80px)' },
          ]),
        ],

        script,
        'script-export': script,

        styles: `
          .wb-video { box-sizing: border-box; font-family: system-ui, sans-serif; }

          /* ── Cover ──────────────────────────────────────── */
          .wb-video__cover {
            position: relative; width: 100%; padding-bottom: 56.25%;
            overflow: hidden; border-radius: 8px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            cursor: pointer;
          }
          .wb-video__cover::after {
            content: ''; position: absolute; inset: 0;
            background: rgba(0,0,0,0.25); transition: background 0.2s;
          }
          .wb-video__cover:hover::after { background: rgba(0,0,0,0.15); }

          .wb-video__thumb {
            position: absolute; inset: 0;
            width: 100%; height: 100%; object-fit: cover;
          }
          .wb-video__play {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%,-50%); z-index: 2;
            transition: transform 0.2s ease; line-height: 0;
          }
          .wb-video__play svg { width: 100%; height: 100%; }
          .wb-video__cover:hover .wb-video__play {
            transform: translate(-50%,-50%) scale(1.1);
          }

          /* ── Modal ──────────────────────────────────────── */
          .wb-video__modal {
            position: fixed; inset: 0; z-index: 1000;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
            opacity: 0; visibility: hidden;
            transition: opacity 0.25s, visibility 0.25s;
          }
          .wb-video__modal.is-open { opacity: 1; visibility: visible; }

          .wb-video__modal-inner { position: relative; width: 90%; max-width: 960px; }

          .wb-video__close {
            position: absolute; top: -44px; right: 0;
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            border: none; background: transparent; cursor: pointer;
            color: rgba(255,255,255,0.7); border-radius: 6px; padding: 0;
            transition: color 0.15s;
          }
          .wb-video__close:hover { color: #fff; }

          .wb-video__player-wrap {
            position: relative; width: 100%; padding-bottom: 56.25%;
            border-radius: 8px; overflow: hidden; background: #000;
          }
          .wb-video__iframe,
          .wb-video__native {
            position: absolute; inset: 0;
            width: 100%; height: 100%; border: 0;
          }
          @media (max-width: 1023px) {
            .wb-video__modal-inner { width: calc(100% - 48px); }
            .wb-video__close {
              top: -40px;
            }
          }
          @media (max-width: 767px) {
            .wb-video__modal-inner { width: calc(100% - 24px); }
            .wb-video__close {
              top: -36px;
              width: 32px;
              height: 32px;
            }
          }
        `,

        components: [
          {
            tagName: 'div',
            attributes: { class: 'wb-video__cover' },
            ...CHILD,
            components: [
              {
                tagName: 'img',
                attributes: { class: 'wb-video__thumb', alt: 'Video cover' },
                ...CHILD,
              },
              {
                tagName: 'div',
                attributes: { class: 'wb-video__play' },
                ...CHILD,
              },
            ],
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-video__modal' },
            ...CHILD,
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-video__modal-inner' },
                ...CHILD,
                components: [
                  {
                    tagName: 'button',
                    attributes: { class: 'wb-video__close', 'aria-label': '关闭视频', type: 'button' },
                    content: ICON_CLOSE,
                    ...CHILD,
                  },
                  {
                    tagName: 'div',
                    attributes: { class: 'wb-video__player-wrap' },
                    ...CHILD,
                    components: [
                      {
                        tagName: 'iframe',
                        attributes: { class: 'wb-video__iframe', allowfullscreen: 'true', title: 'Video player' },
                        ...CHILD,
                      },
                      {
                        tagName: 'video',
                        attributes: { class: 'wb-video__native', controls: 'true', playsinline: 'true', style: 'display:none' },
                        ...CHILD,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      init(this: any) {
        this._syncDataAttrs()
        this.on(
          'change:videoSource change:videoUrl change:videoCover change:playIcon change:playSize',
          this._syncDataAttrs,
        )
      },

      _syncDataAttrs(this: any) {
        this.addAttributes({
          'data-video-source': this.get('videoSource') || 'external',
          'data-video-url': this.get('videoUrl') || '',
          'data-cover': this.get('videoCover') || '',
          'data-play-icon': this.get('playIcon') || 'circle-outline',
          'data-play-size': this.get('playSize') || '64',
        })
      },

      /** 双击打开素材库选择封面图 */
      openAssetsDialog(this: any) {
        const im = getImageManager()
        if (!im) return
        im.openAssetsDialogWithTarget({
          selectCallback: (asset: any) => {
            const src = asset?.getSrc?.() ?? asset?.src ?? ''
            if (src) this.set('videoCover', src)
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
