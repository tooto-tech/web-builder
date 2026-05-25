import type { GrapesEditor } from '../../../../../types/editor'

/** 产品媒体子块配置 */
const PM_BLOCK_DEFS = [
  { className: 'pm-text-block', type: 'pm-text-block', name: '产品文本属性', repeatVar: 'media' },
  { className: 'pm-doc-block', type: 'pm-doc-block', name: '产品文档', repeatVar: 'doc' },
  { className: 'pm-gallery-block', type: 'pm-gallery-block', name: '产品图集', repeatVar: 'gallery' },
  { className: 'pm-image-block', type: 'pm-image-block', name: '产品图片', repeatVar: 'img' },
  { className: 'pm-video-block', type: 'pm-video-block', name: '产品视频', repeatVar: 'vid' },
] as const

function makePmGalleryBlockScript() {
  return function (this: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this

    if (root._wbPmGalleryCleanup) {
      try {
        root._wbPmGalleryCleanup()
      } catch (_) {
        // noop
      }
    }

    const destroySwipers = function () {
      const instances = Array.isArray(root._wbPmGallerySwipers) ? root._wbPmGallerySwipers : []
      instances.forEach(function (instance: any) {
        try {
          instance?.destroy?.(true, true)
        } catch (_) {
          // noop
        }
      })
      root._wbPmGallerySwipers = []
    }

    const ensureAssets = function () {
      return new Promise<void>(function (resolve) {
        const w = window as any
        if (w.Swiper) {
          resolve()
          return
        }

        if (!document.querySelector('link[data-wb-swiper]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
          link.setAttribute('data-wb-swiper', '1')
          document.head.appendChild(link)
        }

        const existing = document.querySelector('script[data-wb-swiper]') as HTMLScriptElement | null
        if (existing) {
          existing.addEventListener('load', function () { resolve() }, { once: true })
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
        script.async = true
        script.setAttribute('data-wb-swiper', '1')
        script.onload = function () { resolve() }
        document.body.appendChild(script)
      })
    }

    const initSwipers = function () {
      const w = window as any
      if (!w.Swiper) return

      destroySwipers()

      const swiperEls = Array.from(root.querySelectorAll('.pm-gallery-block__carousel.swiper'))
        .filter((el): el is HTMLElement => el instanceof HTMLElement)
        .filter(function (el) {
          return !el.closest('[data-cms-hidden]')
        })

      swiperEls.forEach(function (swiperEl) {
        const slides = Array.from(swiperEl.querySelectorAll('.swiper-wrapper > .swiper-slide'))
          .filter((el): el is HTMLElement => el instanceof HTMLElement)
          .filter(function (el) {
            return !el.closest('[data-cms-hidden]')
          })

        const paginationEl = swiperEl.querySelector('.swiper-pagination') as HTMLElement | null
        const prevEl = swiperEl.querySelector('.swiper-button-prev') as HTMLElement | null
        const nextEl = swiperEl.querySelector('.swiper-button-next') as HTMLElement | null
        const enableControls = slides.length > 1

        if (paginationEl) paginationEl.style.display = enableControls ? '' : 'none'
        if (prevEl) prevEl.style.display = enableControls ? '' : 'none'
        if (nextEl) nextEl.style.display = enableControls ? '' : 'none'

        if (!slides.length) return

        const safeLoop = slides.length > 1
        const instance = new w.Swiper(swiperEl, {
          slidesPerView: 1,
          spaceBetween: 12,
          loop: safeLoop,
          pagination: enableControls && paginationEl
            ? { el: paginationEl, clickable: true }
            : false,
          navigation: enableControls && prevEl && nextEl
            ? { prevEl: prevEl, nextEl: nextEl }
            : false,
        })

        root._wbPmGallerySwipers.push(instance)
      })
    }

    const refresh = function () {
      ensureAssets().then(initSwipers)
    }

    root._wbPmGallerySwipers = []
    root.addEventListener('wb:pm-gallery:refresh', refresh)
    refresh()

    root._wbPmGalleryCleanup = function () {
      root.removeEventListener('wb:pm-gallery:refresh', refresh)
      destroySwipers()
    }
  }
}

export function registerPmBlocks(editor: GrapesEditor) {
  const dc = editor?.DomComponents
  if (!dc) return

  PM_BLOCK_DEFS.forEach(({ className, type, name, repeatVar }) => {
    if (dc.getType(type)) return

    dc.addType(type, {
      isComponent: (el: HTMLElement) =>
        el?.classList?.contains(className) ? { type } : false,

      model: {
        defaults: {
          name,
          selectable: true,
          hoverable: true,
          draggable: '.wb-cms-prod-detail-body',
          droppable: false,
          copyable: true,
          removable: true,
          mediaCategoryId: '',
          traits: [
            { type: 'text', label: '媒体分类 ID', name: 'mediaCategoryId', changeProp: true },
          ],
          ...(type === 'pm-gallery-block'
            ? {
                script: makePmGalleryBlockScript(),
                'script-export': makePmGalleryBlockScript(),
              }
            : {}),
        },

        init(this: any) {
          const catId = this.getAttributes()['data-media-category-id'] || ''
          if (catId) this.set('mediaCategoryId', catId, { silent: true })
          this.on('change:mediaCategoryId', this._onCategoryChange)

          this._lockChildren()
          this.on('components:add', () => this._lockChildren())
        },

        _lockChildren(this: any) {
          const lock = (comp: any) => {
            comp.set({
              selectable: false,
              hoverable: false,
              draggable: false,
              copyable: false,
              removable: false,
              layerable: false,
            })
            comp.components().forEach((c: any) => lock(c))
          }
          this.components().forEach((c: any) => lock(c))
        },

        _onCategoryChange(this: any) {
          const catId = this.get('mediaCategoryId') || ''
          this.addAttributes({ 'data-media-category-id': catId })

          const children = this.components()
          if (children && children.length > 0) {
            const repeatChild = children.at(0)
            if (repeatChild) {
              repeatChild.addAttributes({
                'data-cms-repeat': `${repeatVar}@productMediaCat_${catId}`,
              })
            }
          }
        },
      },
    })
  })
}
