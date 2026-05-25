import type { GrapesEditor } from '../../../../../types/editor'
import { STATIC_CHILD } from '@/components/WebBuilder/utils/cmsFactory'

export const WB_PRODUCT_GALLERY_TYPE = 'wb-product-gallery'

function makeProductGalleryScript() {
  return function (this: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this

    if (root._wbProductGalleryCleanup) {
      try {
        root._wbProductGalleryCleanup()
      } catch (_) {
        // noop
      }
    }

    const stage = root.querySelector('.wb-product-gallery__stage')
    const mainImg = root.querySelector('.wb-product-gallery__main-img')
    const prevBtn = root.querySelector('.wb-product-gallery__nav--prev')
    const nextBtn = root.querySelector('.wb-product-gallery__nav--next')
    if (!stage || !mainImg) return

    let activeIndex = 0

    const getThumbImgs = function (): HTMLElement[] {
      return Array.from(root.querySelectorAll('.wb-product-gallery__thumb-img'))
        .filter((img): img is HTMLElement => img instanceof HTMLElement)
        .filter(function (img) {
          const src = (img.getAttribute('src') || '').trim()
          return src && !img.closest('[data-cms-hidden]')
        })
    }

    const syncThumbState = function (thumbImgs: HTMLElement[]) {
      thumbImgs.forEach(function (img, index: number) {
        const thumb = img.closest('.wb-product-gallery__thumb')
        if (!thumb) return
        if (index === activeIndex) thumb.classList.add('is-active')
        else thumb.classList.remove('is-active')
      })
    }

    const render = function () {
      const thumbImgs = getThumbImgs()
      const urls = thumbImgs
        .map(function (img) { return (img.getAttribute('src') || '').trim() })
        .filter(Boolean)

      if (!urls.length) {
        const fallback = (mainImg.getAttribute('src') || '').trim()
        if (!fallback) return
        activeIndex = 0
        mainImg.setAttribute('src', fallback)
        syncThumbState(thumbImgs)
        return
      }

      if (activeIndex >= urls.length) activeIndex = 0
      mainImg.setAttribute('src', urls[activeIndex])
      syncThumbState(thumbImgs)

      const activeThumb = thumbImgs[activeIndex]?.closest('.wb-product-gallery__thumb')
      if (activeThumb && typeof activeThumb.scrollIntoView === 'function') {
        activeThumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
      }
    }

    const onThumbClick = function (event: any) {
      const thumb = event.target.closest('.wb-product-gallery__thumb')
      if (!thumb || thumb.closest('[data-cms-hidden]')) return
      const thumbImgs = getThumbImgs()
      const index = thumbImgs.findIndex(function (img) {
        return img.closest('.wb-product-gallery__thumb') === thumb
      })
      if (index < 0) return
      activeIndex = index
      render()
    }

    const onPrev = function () {
      const thumbImgs = getThumbImgs()
      if (!thumbImgs.length) return
      activeIndex = (activeIndex - 1 + thumbImgs.length) % thumbImgs.length
      render()
    }

    const onNext = function () {
      const thumbImgs = getThumbImgs()
      if (!thumbImgs.length) return
      activeIndex = (activeIndex + 1) % thumbImgs.length
      render()
    }

    const onMove = function (event: any) {
      const rect = stage.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      mainImg.style.transformOrigin = x + '% ' + y + '%'
      mainImg.style.transform = 'scale(2)'
      stage.classList.add('is-zooming')
    }

    const onLeave = function () {
      mainImg.style.transformOrigin = 'center center'
      mainImg.style.transform = 'scale(1)'
      stage.classList.remove('is-zooming')
    }

    const onRefresh = function () {
      onLeave()
      render()
    }

    root.addEventListener('click', onThumbClick)
    prevBtn && prevBtn.addEventListener('click', onPrev)
    nextBtn && nextBtn.addEventListener('click', onNext)
    stage.addEventListener('mousemove', onMove)
    stage.addEventListener('mouseleave', onLeave)
    root.addEventListener('wb:product-gallery:refresh', onRefresh)

    render()

    root._wbProductGalleryCleanup = function () {
      root.removeEventListener('click', onThumbClick)
      prevBtn && prevBtn.removeEventListener('click', onPrev)
      nextBtn && nextBtn.removeEventListener('click', onNext)
      stage.removeEventListener('mousemove', onMove)
      stage.removeEventListener('mouseleave', onLeave)
      root.removeEventListener('wb:product-gallery:refresh', onRefresh)
    }
  }
}

export function registerProductGalleryComponent(editor: GrapesEditor) {
  const dc = editor?.DomComponents
  if (!dc || dc.getType(WB_PRODUCT_GALLERY_TYPE)) return

  dc.addType(WB_PRODUCT_GALLERY_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-product-gallery') === 'true'
        ? { type: WB_PRODUCT_GALLERY_TYPE }
        : false,
    model: {
      defaults: {
        name: '产品图集',
        tagName: 'div',
        selectable: true,
        draggable: '.wb-cms-prod-detail-body',
        droppable: false,
        stylable: true,
        attributes: {
          'data-wb-product-gallery': 'true',
          class: 'wb-product-gallery',
        },
        components: [
          {
            tagName: 'div',
            ...STATIC_CHILD,
            attributes: { class: 'wb-product-gallery__stage' },
            components: [
              {
                tagName: 'img',
                ...STATIC_CHILD,
                attributes: {
                  class: 'wb-product-gallery__main-img',
                  'data-cms-bind-src': 'product.picUrl',
                  'data-cms-bind-alt': 'product.name',
                  src: 'https://placehold.co/1200x1200/e5e7eb/64748b?text=PRODUCT',
                  alt: '产品主图',
                  width: '1200',
                  height: '1200',
                },
              },
            ],
          },
          {
            tagName: 'div',
            ...STATIC_CHILD,
            attributes: { class: 'wb-product-gallery__thumbs-wrap' },
            components: [
              {
                tagName: 'button',
                ...STATIC_CHILD,
                attributes: { class: 'wb-product-gallery__nav wb-product-gallery__nav--prev', type: 'button', 'aria-label': '上一张' },
                content: '<svg t="1773920927897" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3837" width="24" height="24"><path d="M683.31199999 193.76l-11.31199999-11.328a16 16 0 0 0-22.624 0L338.24 493.552a16 16 0 0 0 0 22.64L649.376 827.312a16 16 0 0 0 22.624 0l11.312-11.312a16 16 0 0 0 0-22.624l-288.496-288.496 288.49599999-288.512a16 16 0 0 0 1e-8-22.624z" fill="#000000" p-id="3838"></path></svg>',
              },
              {
                tagName: 'div',
                ...STATIC_CHILD,
                attributes: { class: 'wb-product-gallery__thumbs-viewport' },
                components: [
                  {
                    tagName: 'div',
                    ...STATIC_CHILD,
                    attributes: { class: 'wb-product-gallery__thumbs' },
                    components: [
                      {
                        tagName: 'button',
                        ...STATIC_CHILD,
                        attributes: {
                          class: 'wb-product-gallery__thumb is-active',
                          type: 'button',
                          'data-cms-repeat': 'pic@product.sliderPicUrls',
                        },
                        components: [
                          {
                            tagName: 'img',
                            ...STATIC_CHILD,
                            attributes: {
                              class: 'wb-product-gallery__thumb-img',
                              'data-cms-bind-src': 'pic',
                              'data-cms-bind-alt': 'product.name',
                              src: 'https://placehold.co/200x200/e5e7eb/64748b?text=IMG',
                              alt: '产品缩略图',
                              width: '72',
                              height: '72',
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                tagName: 'button',
                ...STATIC_CHILD,
                attributes: { class: 'wb-product-gallery__nav wb-product-gallery__nav--next', type: 'button', 'aria-label': '下一张' },
                content: '<svg t="1773920800247" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3691" width="24" height="24"><path d="M340.688 830.24l11.312 11.328a16 16 0 0 0 22.624 0L685.76 530.448a16 16 0 0 0 0-22.64L374.624 196.688a16 16 0 0 0-22.624 0l-11.312 11.312a16 16 0 0 0 0 22.624l288.496 288.496-288.496 288.512a16 16 0 0 0 0 22.624z" fill="#000000" p-id="3692"></path></svg>',
              },
            ],
          },
        ],
        script: makeProductGalleryScript(),
        'script-export': makeProductGalleryScript(),
      },

      init(this: any) {
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
            badgable: false,
            highlightable: false,
          })
          comp.components().forEach((child: any) => lock(child))
        }

        this.components().forEach((child: any) => lock(child))
      },
    },
  })
}
