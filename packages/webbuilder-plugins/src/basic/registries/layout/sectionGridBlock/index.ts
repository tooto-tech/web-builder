import type { Editor } from 'grapesjs'
import { WB_HEADING_TYPE } from '../../typography/heading/index.js'
export const WB_SECTION_GRID_BLOCK_TYPE = 'wb-section-grid-block'

const WB_SECTION_GRID_BG_TYPE = 'wb-section-grid-bg'
const WB_SECTION_LEGACY_BG_TYPE = 'wb-section-bg'
const WB_SECTION_GRID_VIDEO_TYPE = 'wb-section-grid-bg-video'
const WB_SECTION_GRID_YOUTUBE_TYPE = 'wb-section-grid-bg-youtube'

function hexToRgba(hex: string, alpha = 1): string {
  if (!hex) return `rgba(0,0,0,${alpha})`

  const value = hex.replace('#', '')
  const full = value.length === 3
    ? value.split('').map(item => `${item}${item}`).join('')
    : value
  const num = Number.parseInt(full, 16)

  if (!Number.isFinite(num)) return `rgba(0,0,0,${alpha})`

  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function createContentLayerStyle(style: Record<string, string> = {}) {
  return {
    ...style,
    'grid-column': style['grid-column'] || '2',
    position: style.position || 'relative',
    'z-index': style['z-index'] || '1',
  }
}

function isSectionBackgroundComponent(component: any): boolean {
  const type = component?.get?.('type')
  return type === WB_SECTION_GRID_BG_TYPE || type === WB_SECTION_LEGACY_BG_TYPE
}

function createSectionBackgroundTypeDefinition() {
  return {
    model: {
      defaults: {
        name: 'Background',
        tagName: 'div',
        classes: ['wb-section-grid-block__bg'],
        selectable: false,
        hoverable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        layerable: false,
        stylable: false,
        attributes: {
          'data-wb-section-role': 'background',
        },
        style: {
          position: 'absolute',
          inset: '0',
          'z-index': '0',
          'pointer-events': 'none',
          overflow: 'hidden',
          'background-repeat': 'no-repeat',
          'background-position': 'center center',
          'background-size': 'cover',
        },
        components: [],
      },
    },
  }
}

function getYouTubeVideoId(url: string): string {
  const value = url.trim()
  if (!value) return ''

  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || ''
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v') || ''
      }

      const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)
      return match?.[1] || ''
    }
  } catch (_error) {
    return ''
  }

  return ''
}

function createYouTubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: videoId,
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
  })

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

export function registerSectionGridBlockComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_SECTION_GRID_BLOCK_TYPE)) return

  domComponents.addType(WB_SECTION_GRID_VIDEO_TYPE, {
    model: {
      defaults: {
        tagName: 'video',
        attributes: { autoplay: '', muted: '', loop: '', playsinline: '' },
        selectable: false,
        hoverable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        layerable: false,
        style: {
          width: '100%',
          height: '100%',
          'object-fit': 'cover',
          display: 'block',
        },
      },
    },
    view: {
      onRender() {
        const el = this.el as HTMLVideoElement
        el.muted = true
        el.autoplay = true
        el.loop = true
        el.controls = false
        el.playsInline = true
      },
    },
  })

  domComponents.addType(WB_SECTION_GRID_YOUTUBE_TYPE, {
    model: {
      defaults: {
        tagName: 'iframe',
        selectable: false,
        hoverable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        layerable: false,
        attributes: {
          allow: 'autoplay; encrypted-media; picture-in-picture',
          allowfullscreen: 'false',
          frameborder: '0',
        },
        style: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100vw',
          height: '56.25vw',
          transform: 'translate(-50%, -50%)',
          border: '0',
          display: 'block',
          'pointer-events': 'none',
        },
      },
    },
  })

  domComponents.addType(WB_SECTION_LEGACY_BG_TYPE, createSectionBackgroundTypeDefinition())

  domComponents.addType(WB_SECTION_GRID_BG_TYPE, {
    isComponent(el: HTMLElement) {
      if (el?.getAttribute?.('data-wb-section-role') === 'background') {
        return { type: WB_SECTION_GRID_BG_TYPE }
      }
      return false
    },
    ...createSectionBackgroundTypeDefinition(),
  })

  domComponents.addType(WB_SECTION_GRID_BLOCK_TYPE, {
    isComponent(el: HTMLElement) {
      const isSection = el?.tagName === 'SECTION'
      const isLegacyClass = el?.classList?.contains('gjs-section-grid')
      const isCurrentComponent = el?.getAttribute?.('data-wb-component') === 'section-grid-block'
      if (isSection && (isLegacyClass || isCurrentComponent)) {
        return { type: WB_SECTION_GRID_BLOCK_TYPE }
      }
      return false
    },

    model: {
      defaults: {
        name: '区块',
        tagName: 'section',
        classes: ['gjs-section-grid', 'wb-section-grid-block'],
        droppable: true,
        draggable: true,
        copyable: true,
        removable: true,
        selectable: true,
        stylable: true,
        attributes: {
          'data-wb-component': 'section-grid-block',
          'data-bg-mode': 'color',
        },
        style: {
          position: 'relative',
          display: 'grid',
          'grid-template-columns':
            'minmax(var(--section-gutter, 20px), 1fr) minmax(0, var(--section-content-max, 1200px)) minmax(var(--section-gutter, 20px), 1fr)',
          'align-items': 'start',
          'align-content': 'start',
          padding: '100px 0',
          overflow: 'hidden',
          '--section-content-max': '1240px',
          '--section-gutter': '24px',
          '--section-overlay-color': 'rgba(0,0,0,0)',
        },
        components: [
          {
            type: WB_SECTION_GRID_BG_TYPE,
          },
          {
            type: WB_HEADING_TYPE,
            attributes:{
              class:'section__title'
            }
          }
        ],
        traits: [
          {
            type: 'select',
            name: 'contentMaxWidth',
            label: 'Content Width',
            changeProp: 1,
            options: [
              { id: '960px', label: '960px' },
              { id: '1080px', label: '1080px' },
              { id: '1200px', label: '1200px' },
              { id: '1240px', label: '1240px' },
              { id: '1280px', label: '1280px' },
              { id: '1320px', label: '1320px' },
              { id: '1440px', label: '1440px' },
              { id: '100%', label: 'Full Width' },
            ],
          },
          {
            type: 'select',
            name: 'gutter',
            label: 'Side Gutter',
            changeProp: 1,
            options: [
              { id: '0', label: '0' },
              { id: '16px', label: '16px' },
              { id: '20px', label: '20px' },
              { id: '24px', label: '24px' },
              { id: '32px', label: '32px' },
              { id: '40px', label: '40px' },
            ],
          },
          {
            type: 'select',
            name: 'heightMode',
            label: 'Height',
            changeProp: 1,
            options: [
              { id: 'small', label: 'Small (320px)' },
              { id: 'medium', label: 'Medium (560px)' },
              { id: 'large', label: 'Large (800px)' },
              { id: 'fullscreen', label: 'Fullscreen (100vh)' },
              { id: 'auto', label: 'Auto' },
              { id: 'custom', label: 'Custom' },
            ],
          },
          {
            type: 'text',
            name: 'customHeight',
            label: 'Custom Height',
            changeProp: 1,
            placeholder: '480px',
          },
          {
            type: 'select',
            name: 'bgMode',
            label: 'Background Type',
            changeProp: 1,
            options: [
              { id: 'color', label: 'Color' },
              { id: 'image', label: 'Image' },
              { id: 'video', label: 'Video' },
            ],
          },
          {
            type: 'color-picker',
            name: 'bgColor',
            label: 'Bg Color',
            changeProp: 1,
          },
          ({
            type: 'image-picker',
            name: 'bgImage',
            label: 'Bg Image URL',
            changeProp: 1,
            ui: { showPreview: true },
            placeholder: 'https://...',
          } as any),
          {
            type: 'text',
            name: 'bgVideo',
            label: 'Bg Video URL',
            changeProp: 1,
            placeholder: 'https://...mp4',
          },
          {
            type: 'color-picker',
            name: 'overlayColor',
            label: 'Overlay Color',
            changeProp: 1,
          },
          {
            type: 'number',
            name: 'overlayOpacity',
            label: 'Overlay Opacity',
            changeProp: 1,
            min: 0,
            max: 1,
            step: 0.05,
          },
        ],
        contentMaxWidth: '1240px',
        gutter: '20px',
        heightMode: 'auto',
        customHeight: '480px',
        bgMode: 'color',
        bgColor: '#ffffff00',
        bgImage: '',
        bgVideo: '',
        overlayColor: '#000000',
        overlayOpacity: 0,
      },

      init() {
        this.on('change:contentMaxWidth', this.applySectionLayout)
        this.on('change:gutter', this.applySectionLayout)
        this.on('change:heightMode', this.applySectionLayout)
        this.on('change:customHeight', this.applySectionLayout)
        this.on('change:bgMode', this.applyBackground)
        this.on('change:bgColor', this.applyBackground)
        this.on('change:bgImage', this.applyBackground)
        this.on('change:bgVideo', this.applyBackground)
        this.on('change:overlayColor', this.applyBackground)
        this.on('change:overlayOpacity', this.applyBackground)
        this.on('change:components', this.ensureBgFirst)
      },

      ensureBgFirst() {
        const comps = this.components()
        if (!comps.length) {
          comps.add({ type: WB_SECTION_GRID_BG_TYPE }, { at: 0 })
          return
        }

        let bg = comps.find(isSectionBackgroundComponent)
        if (!bg) {
          comps.add({ type: WB_SECTION_GRID_BG_TYPE }, { at: 0 })
          bg = comps.at(0)
        }

        if (comps.at(0) !== bg) {
          comps.remove(bg, { silent: true })
          comps.add(bg, { at: 0, silent: true })
        }

        comps.each((child: any, index: number) => {
          if (index === 0 || isSectionBackgroundComponent(child)) return
          child.setStyle(createContentLayerStyle(child.getStyle() || {}))
        })
      },

      applySectionLayout() {
        const heightMap: Record<string, string> = {
          small: '320px',
          medium: '560px',
          large: '800px',
          fullscreen: '100vh',
          auto: 'auto',
          custom: this.get('customHeight') || '480px',
        }
        const minHeight = heightMap[this.get('heightMode')] ?? '560px'

        this.addStyle({
          '--section-content-max': this.get('contentMaxWidth') || '1200px',
          '--section-gutter': this.get('gutter') || '24px',
          'min-height': minHeight,
        })

        this.ensureBgFirst()
      },

      applyBackground() {
        const bgCmp = this.components().find(isSectionBackgroundComponent)
        if (!bgCmp) return

        const mode = this.get('bgMode') || 'color'
        const bgColor = this.get('bgColor') || 'transparent'
        const bgImage = this.get('bgImage') || ''
        const bgVideo = this.get('bgVideo') || ''
        const overlayColor = this.get('overlayColor') || '#000000'
        const overlayOpacity = Number(this.get('overlayOpacity') ?? 0)

        bgCmp.components().reset([])

        const baseStyle = {
          position: 'absolute',
          inset: '0',
          'z-index': '0',
          'pointer-events': 'none',
          overflow: 'hidden',
          'background-repeat': 'no-repeat',
          'background-position': 'center center',
          'background-size': 'cover',
          'background-color': 'transparent',
          'background-image': 'none',
        }

        if (mode === 'color') {
          bgCmp.setStyle({
            ...baseStyle,
            'background-color': bgColor,
          })
        }

        if (mode === 'image') {
          bgCmp.setStyle({
            ...baseStyle,
            'background-color': bgColor,
            'background-image': bgImage ? `url("${bgImage}")` : 'none',
          })
        }

        if (mode === 'video') {
          bgCmp.setStyle(baseStyle)

          if (bgVideo) {
            const youtubeVideoId = getYouTubeVideoId(bgVideo)
            bgCmp.components().add([
              youtubeVideoId ? {
                type: WB_SECTION_GRID_YOUTUBE_TYPE,
                attributes: { src: createYouTubeEmbedUrl(youtubeVideoId) },
              } : {
                type: WB_SECTION_GRID_VIDEO_TYPE,
                attributes: { src: bgVideo },
              },
            ])
          }
        }

        if (overlayOpacity > 0) {
          bgCmp.components().add({
            tagName: 'div',
            attributes: { 'data-role': 'overlay' },
            selectable: false,
            hoverable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            layerable: false,
            style: {
              position: 'absolute',
              inset: '0',
              'background-color': hexToRgba(overlayColor, overlayOpacity),
            },
          })
        }
      },
    },

    view: {
      onRender() {
        const model = this.model as any
        model.applySectionLayout()
        model.applyBackground()
        model.ensureBgFirst()
      },
    },
  })

  editor.BlockManager?.add?.(WB_SECTION_GRID_BLOCK_TYPE, {
    label: '区块',
    category: 'Layout',
    media: `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="3" y="4" width="18" height="16" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <line x1="7" y1="4" x2="7" y2="20" stroke="currentColor" stroke-width="1"/>
        <line x1="17" y1="4" x2="17" y2="20" stroke="currentColor" stroke-width="1"/>
      </svg>
    `,
    content: {
      type: WB_SECTION_GRID_BLOCK_TYPE,
    },
  })

  editor.on('component:add', (component: any) => {
    const parent = component.parent()
    if (!parent) return

    if (isSectionBackgroundComponent(parent)) {
      const isInternalBgChild =
        component.get('type') === WB_SECTION_GRID_VIDEO_TYPE ||
        component.get('type') === WB_SECTION_GRID_YOUTUBE_TYPE ||
        component.getAttributes()?.['data-role'] === 'overlay'
      if (isInternalBgChild) return

      const section = parent.parent()
      if (!section || section.get('type') !== WB_SECTION_GRID_BLOCK_TYPE) return

      const sectionComps = section.components()
      const lastIndex = sectionComps.length
      parent.components().remove(component, { silent: true })
      sectionComps.add(component, { at: lastIndex })
      section.ensureBgFirst?.()
    }

    if (parent.get('type') === WB_SECTION_GRID_BLOCK_TYPE && !isSectionBackgroundComponent(component)) {
      const comps = parent.components()
      const bg = comps.find(isSectionBackgroundComponent)
      if (bg && comps.at(0) !== bg) {
        parent.ensureBgFirst?.()
      }

      component.setStyle(createContentLayerStyle(component.getStyle() || {}))
    }
  })
}
