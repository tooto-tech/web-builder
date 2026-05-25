import type { GrapesEditor } from '../../../../../types/editor'
import { getAllMediaResourceCategoryList } from '@/api/content/mediaResourceCategory'
import { registerDetailCmsComponent, buildSeoMetaNodes } from '../helpers'
import { initPreviewMediaTrait } from './previewMediaTrait'
import { getEffectiveTenantId } from '@/utils/auth'

export const WB_CMS_TECHNICAL_SUPPORT_DETAIL_TYPE = 'wb-cms-technical-support-detail'

type MediaCategoryTraitOption = {
  value: string
  label: string
}

let mediaCategoryTraitOptionsPromise: Promise<MediaCategoryTraitOption[]> | null = null

async function loadMediaCategoryTraitOptions(): Promise<MediaCategoryTraitOption[]> {
  const list = await getAllMediaResourceCategoryList()
  const normalized = Array.isArray(list) ? list : []

  return normalized
    .filter((item) => item?.id != null && String(item?.name ?? '').trim())
    .sort((a, b) => {
      const sortA = Number(a?.sortOrder ?? 0)
      const sortB = Number(b?.sortOrder ?? 0)
      if (sortA !== sortB) return sortA - sortB
      return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'zh-Hans-CN')
    })
    .map((item) => ({
      value: String(item.id),
      label: String(item.name),
    }))
}

function getMediaCategoryTraitOptions(): Promise<MediaCategoryTraitOption[]> {
  if (!mediaCategoryTraitOptionsPromise) {
    mediaCategoryTraitOptionsPromise = loadMediaCategoryTraitOptions().catch((error) => {
      mediaCategoryTraitOptionsPromise = null
      throw error
    })
  }
  return mediaCategoryTraitOptionsPromise
}

async function initMediaCategorySelectTrait(model: any): Promise<void> {
  const trait = model.getTrait?.('cmsCategoryId')
  if (!trait) return

  const currentValue = String(model.get('cmsCategoryId') ?? '').trim()

  try {
    const options = await getMediaCategoryTraitOptions()
    const traitOptions: MediaCategoryTraitOption[] = [
      { value: '', label: '请选择媒体资源分类' },
      ...options,
    ]

    if (currentValue && !traitOptions.some((item) => item.value === currentValue)) {
      traitOptions.push({
        value: currentValue,
        label: `当前分类 (#${currentValue})`,
      })
    }

    trait.set('options', traitOptions)
  } catch {
    const fallbackOptions: MediaCategoryTraitOption[] = [
      { value: '', label: '请选择媒体资源分类' },
    ]

    if (currentValue) {
      fallbackOptions.push({
        value: currentValue,
        label: `当前分类 (#${currentValue})`,
      })
    }

    trait.set('options', fallbackOptions)
  }
}

export const TECHNICAL_SUPPORT_DETAIL_STYLES = `
  .wb-tech-support-detail {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: #000;
    color: #fff;
    overflow: hidden;
  }
  .wb-tech-support-detail__body {
    width: 100%;
    min-height: 100vh;
  }
  .wb-tech-support-detail__meta {
    display: none;
  }
  .wb-tech-support-detail .tooto-flipbook-viewport {
    position: relative;
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #000;
  }
  .wb-tech-support-detail .tooto-flipbook-magazine-viewport {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    overflow: hidden;
  }
  .wb-tech-support-detail .tooto-flipbook-magazine {
    margin: 0 auto;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
  .wb-tech-support-detail .tooto-flipbook-page {
    background-color: #fff;
    background-size: 200% 100%;
    background-repeat: no-repeat;
  }
  .wb-tech-support-detail .tooto-flipbook-page-left {
    background-position: left center;
  }
  .wb-tech-support-detail .tooto-flipbook-page-right {
    background-position: right center;
  }
  .wb-tech-support-detail .tooto-flipbook-bottom-bar {
    height: 64px;
    background-color: #003152;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    color: #fff;
    z-index: 100;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .wb-tech-support-detail .tooto-flipbook-left-btns,
  .wb-tech-support-detail .tooto-flipbook-right-btns {
    display: flex;
    align-items: center;
  }
  .wb-tech-support-detail .tooto-flipbook-right-btns {
    justify-content: flex-end;
  }
  .wb-tech-support-detail .tooto-flipbook-center-btns {
    flex: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
  }
  .wb-tech-support-detail .tooto-flipbook-btn,
  .wb-tech-support-detail .tooto-flipbook-nav-arrow {
    cursor: pointer;
    opacity: 0.82;
    transition: opacity 0.3s;
    user-select: none;
  }
  .wb-tech-support-detail .tooto-flipbook-btn:hover,
  .wb-tech-support-detail .tooto-flipbook-nav-arrow:hover {
    opacity: 1;
  }
  .wb-tech-support-detail .tooto-flipbook-btn {
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .wb-tech-support-detail .tooto-flipbook-page-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .wb-tech-support-detail .tooto-flipbook-page-select-wrapper {
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
    min-width: 80px;
    user-select: none;
    transition: all 0.3s ease;
  }
  .wb-tech-support-detail .tooto-flipbook-page-select-wrapper:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }
  .wb-tech-support-detail .tooto-flipbook-current-value {
    flex: 1;
    color: #fff;
    font-size: 13px;
    margin-right: 10px;
  }
  .wb-tech-support-detail .tooto-flipbook-page-options-list {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 0;
    width: 100%;
    background: #003152;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    max-height: 250px;
    overflow-y: auto;
    z-index: 1001;
    box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.5);
    opacity: 0;
    transform: translateY(10px) scale(0.95);
    visibility: hidden;
    transform-origin: bottom center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .wb-tech-support-detail .tooto-flipbook-page-options-list.active {
    opacity: 1;
    transform: translateY(0) scale(1);
    visibility: visible;
  }
  .wb-tech-support-detail .tooto-flipbook-page-option {
    padding: 8px 12px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    transition: all 0.2s;
  }
  .wb-tech-support-detail .tooto-flipbook-page-option:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .wb-tech-support-detail .tooto-flipbook-page-option.selected {
    background: #007bff;
    color: #fff;
  }
  .wb-tech-support-detail .tooto-flipbook-thumbnails-panel {
    position: absolute;
    bottom: 64px;
    left: 0;
    width: 100%;
    height: 220px;
    background-color: #003152;
    display: flex;
    gap: 16px;
    padding: 20px;
    box-sizing: border-box;
    overflow-x: auto;
    z-index: 99;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateY(100%);
    opacity: 0;
    visibility: hidden;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease, visibility 0.4s;
  }
  .wb-tech-support-detail .tooto-flipbook-thumbnails-panel.active {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  .wb-tech-support-detail .tooto-flipbook-thumb-item {
    flex: 0 0 100px;
    cursor: pointer;
    text-align: center;
    transition: transform 0.2s;
  }
  .wb-tech-support-detail .tooto-flipbook-thumb-item.double {
    flex-basis: 200px;
  }
  .wb-tech-support-detail .tooto-flipbook-thumb-item:hover {
    transform: translateY(-5px);
  }
  .wb-tech-support-detail .tooto-flipbook-thumb-img-container {
    width: 100%;
    height: 147px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s;
    background-color: #333;
    overflow: hidden;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
  .wb-tech-support-detail .tooto-flipbook-thumb-item:hover .tooto-flipbook-thumb-img-container,
  .wb-tech-support-detail .tooto-flipbook-thumb-item.active .tooto-flipbook-thumb-img-container {
    border-color: #00a0e9;
    box-shadow: 0 0 10px rgba(0, 160, 233, 0.5);
  }
  .wb-tech-support-detail .tooto-flipbook-thumb-page-num {
    color: #fff;
    font-size: 14px;
    padding: 5px 0;
  }
  .wb-tech-support-detail .tooto-flipbook-nav-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 40px;
    color: rgba(255, 255, 255, 0.3);
    z-index: 10;
    padding: 20px;
  }
  .wb-tech-support-detail .tooto-flipbook-nav-prev {
    left: 20px;
  }
  .wb-tech-support-detail .tooto-flipbook-nav-next {
    right: 20px;
  }
  .wb-tech-support-detail .wb-tech-support-detail__image-source {
    display: none !important;
  }
  @media (max-width: 768px) {
    .wb-tech-support-detail .tooto-flipbook-bottom-bar {
      padding: 0 10px;
    }
    .wb-tech-support-detail .tooto-flipbook-btn-text {
      display: none;
    }
    .wb-tech-support-detail .tooto-flipbook-nav-arrow {
      display: none;
    }
    .wb-tech-support-detail .tooto-flipbook-thumbnails-panel {
      gap: 8px;
    }
  }
`

const technicalSupportDetailScript = function (this: HTMLElement) {
  const root = this as HTMLElement & {
    __wbTechSupportDetailBooted?: boolean
    __wbTechSupportDetailRender?: () => void
  }
  if (!root) return

  const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve()
          return
        }
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error(`load failed: ${src}`)), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true'
        resolve()
      }, { once: true })
      script.addEventListener('error', () => reject(new Error(`load failed: ${src}`)), { once: true })
      document.head.appendChild(script)
    })

  const boot = async () => {
    const win = window as any
    if (!win.jQuery) {
      await loadScript('https://code.jquery.com/jquery-3.7.1.min.js')
    }
    if (!(win.jQuery && win.jQuery.fn && win.jQuery.fn.turn)) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js')
    }

    const $ = win.jQuery
    if (!$?.fn?.turn) return

    const $scope = $(root)
    const $magazine = $scope.find('.tooto-flipbook-magazine')
    const $pageDropdown = $scope.find('.tooto-flipbook-page-select-wrapper')
    const $selectedPage = $scope.find('.tooto-flipbook-current-value')
    const $pageOptions = $scope.find('.tooto-flipbook-page-options-list')
    const $thumbnailsPanel = $scope.find('.tooto-flipbook-thumbnails-panel')

    const render = () => {
      const imageNodes = Array.from(
        root.querySelectorAll('.wb-tech-support-detail__image-source img')
      ) as HTMLImageElement[]
      const images = imageNodes
        .map((img) => img.getAttribute('src') || '')
        .filter(Boolean)

      if ($magazine.data('turn')) {
        $magazine.turn('destroy')
      }

      $magazine.empty()
      $pageOptions.empty()
      $thumbnailsPanel.empty()

      if (!images.length) return

      const totalImages = images.length
      const totalPages = totalImages * 2

      const updateDropdownText = (page: number) => {
        $selectedPage.text(page + ' / ' + totalPages)
        $pageOptions.find('.tooto-flipbook-page-option').removeClass('selected')
        $pageOptions.find('.tooto-flipbook-page-option[data-value="' + page + '"]').addClass('selected')
      }

      const addThumbGroup = (pages: number[], imgPath: string, mode: 'left' | 'right' | 'full') => {
        const isSingle = pages.length === 1
        let imgStyle = 'background-image:url(' + imgPath + ');'

        if (mode === 'right') {
          imgStyle += 'background-size:200% 100%;background-position:right center;'
        } else if (mode === 'left') {
          imgStyle += 'background-size:200% 100%;background-position:left center;'
        } else {
          imgStyle += 'background-size:cover;background-position:center;'
        }

        const label = pages.length > 1 ? pages[0] + '-' + pages[1] : String(pages[0])
        $thumbnailsPanel.append(
          '<div class="tooto-flipbook-thumb-item ' + (isSingle ? 'single' : 'double') + '" data-page="' + pages[0] + '" data-pages="' + pages.join(',') + '">' +
            '<div class="tooto-flipbook-thumb-img-container" style="' + imgStyle + '"></div>' +
            '<div class="tooto-flipbook-thumb-page-num">' + label + '</div>' +
          '</div>'
        )
      }

      const generatePages = () => {
        $magazine.empty()
        $magazine.append('<div class="tooto-flipbook-page tooto-flipbook-page-right" style="background-image:url(' + images[0] + ')"></div>')

        for (let i = 1; i < totalImages; i += 1) {
          const imgPath = images[i]
          $magazine.append('<div class="tooto-flipbook-page tooto-flipbook-page-left" style="background-image:url(' + imgPath + ')"></div>')
          $magazine.append('<div class="tooto-flipbook-page tooto-flipbook-page-right" style="background-image:url(' + imgPath + ')"></div>')
        }

        $magazine.append('<div class="tooto-flipbook-page tooto-flipbook-page-left" style="background-image:url(' + images[0] + ')"></div>')

        $pageOptions.empty()
        for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
          $pageOptions.append('<div class="tooto-flipbook-page-option" data-value="' + pageIndex + '">' + pageIndex + ' / ' + totalPages + '</div>')
        }
        updateDropdownText(1)
      }

      const generateThumbnails = () => {
        $thumbnailsPanel.empty()
        const isMobile = window.innerWidth < 768

        if (isMobile) {
          addThumbGroup([1], images[0], 'right')
          for (let i = 1; i < totalImages; i += 1) {
            const pageStart = i * 2
            addThumbGroup([pageStart], images[i], 'left')
            addThumbGroup([pageStart + 1], images[i], 'right')
          }
          addThumbGroup([totalPages], images[0], 'left')
        } else {
          addThumbGroup([1], images[0], 'right')
          for (let i = 1; i < totalImages; i += 1) {
            const pageStart = i * 2
            addThumbGroup([pageStart, pageStart + 1], images[i], 'full')
          }
          addThumbGroup([totalPages], images[0], 'left')
        }
      }

      const updateCentering = (page: number) => {
        if (window.innerWidth < 768) {
          $magazine.css('transform', 'none')
          return
        }

        const pages = $magazine.turn('pages')
        if (page === 1) {
          $magazine.css('transform', 'translateX(-25%)')
        } else if (page === pages) {
          $magazine.css('transform', 'translateX(25%)')
        } else {
          $magazine.css('transform', 'translateX(0)')
        }
      }

      const calculateSize = () => {
        const imgW = 2314
        const imgH = 1700
        const ratio = imgW / imgH
        const pageRatio = (imgW / 2) / imgH
        const viewportW = window.innerWidth
        const viewportH = window.innerHeight - 50
        let finalW
        let finalH

        if (window.innerWidth < 768) {
          finalW = viewportW * 0.9
          finalH = finalW / pageRatio
          if (finalH > viewportH * 0.8) {
            finalH = viewportH * 0.8
            finalW = finalH * pageRatio
          }
        } else {
          finalW = viewportW * 0.9
          finalH = finalW / ratio
          if (finalH > viewportH * 0.9) {
            finalH = viewportH * 0.9
            finalW = finalH * ratio
          }
        }

        return {
          width: Math.floor(finalW),
          height: Math.floor(finalH),
        }
      }

      const updateThumbActive = (page: number) => {
        $scope.find('.tooto-flipbook-thumb-item').removeClass('active').each(function (this: any) {
          const pages = String($(this).attr('data-pages') || '').split(',')
          if (pages.indexOf(String(page)) !== -1) {
            $(this).addClass('active')
          }
        })
      }

      generatePages()
      generateThumbnails()

      const size = calculateSize()
      $magazine.turn({
        width: size.width,
        height: size.height,
        duration: 1000,
        autoCenter: true,
        display: window.innerWidth < 768 ? 'single' : 'double',
        acceleration: true,
        gradients: true,
        elevation: 50,
        when: {
          turning: function (_e: Event, page: number) {
            updateCentering(page)
          },
          turned: function (_e: Event, page: number) {
            updateDropdownText(page)
            updateThumbActive(page)
          },
        },
      })

      updateCentering(1)
      updateThumbActive(1)

      $scope.find('.tooto-flipbook-thumb-item').off('click').on('click', function (this: any) {
        const page = Number($(this).data('page') || 1)
        $magazine.turn('page', page)
        $thumbnailsPanel.removeClass('active')
      })

      $(window).off('resize.wbTechSupportDetail').on('resize.wbTechSupportDetail', function (this: Window) {
        if (!$magazine.data('turn')) return
        const nextSize = calculateSize()
        $magazine.turn('display', window.innerWidth < 768 ? 'single' : 'double')
        $magazine.turn('size', nextSize.width, nextSize.height)
        updateCentering($magazine.turn('page'))
        generateThumbnails()
        updateThumbActive($magazine.turn('page'))
      })
    }

    root.__wbTechSupportDetailRender = render
    render()

    $pageDropdown.off('click').on('click', function (this: any, e: Event) {
      if ($(e.target).closest('.tooto-flipbook-page-options-list').length) return
      e.stopPropagation()
      $(this).toggleClass('active')
      $pageOptions.toggleClass('active')
    })

    $pageOptions.off('click').on('click', '.tooto-flipbook-page-option', function (this: any, e: Event) {
      e.stopPropagation()
      const page = parseInt(String($(this).attr('data-value') || ''), 10)
      if (!Number.isNaN(page)) {
        $magazine.turn('page', page)
      }
      $pageDropdown.removeClass('active')
      $pageOptions.removeClass('active')
    })

    $(document).off('click.wbTechSupportDetail').on('click.wbTechSupportDetail', function () {
      $pageDropdown.removeClass('active')
      $pageOptions.removeClass('active')
    })

    $scope.find('.tooto-flipbook-btn-first').off('click').on('click', function () {
      $magazine.turn('page', 1)
    })
    $scope.find('.tooto-flipbook-btn-last').off('click').on('click', function () {
      const pages = Number($magazine.turn('pages') || 1)
      $magazine.turn('page', pages)
    })
    $scope.find('.tooto-flipbook-btn-prev, .tooto-flipbook-nav-prev').off('click').on('click', function () {
      $magazine.turn('previous')
    })
    $scope.find('.tooto-flipbook-btn-next, .tooto-flipbook-nav-next').off('click').on('click', function () {
      $magazine.turn('next')
    })
    $scope.find('.tooto-flipbook-btn-toggle-thumbs').off('click').on('click', function () {
      $thumbnailsPanel.toggleClass('active')
    })
    $scope.find('.tooto-flipbook-btn-home').off('click').on('click', function () {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/'
      }
    })

    if (!root.__wbTechSupportDetailBooted) return
    root.addEventListener('wb:technical-support-detail:refresh', () => {
      root.__wbTechSupportDetailRender?.()
    })
  }

  if (root.__wbTechSupportDetailBooted) {
    root.__wbTechSupportDetailRender?.()
    return
  }
  root.__wbTechSupportDetailBooted = true
  void boot()
}

async function initTechnicalSupportDetailModel(model: any): Promise<void> {
  await initMediaCategorySelectTrait(model)
  await initPreviewMediaTrait(model, {
    categoryId: String(model.get('cmsCategoryId') || ''),
  })

  model.on('change:cmsCategoryId', async () => {
    await initPreviewMediaTrait(model, {
      categoryId: String(model.get('cmsCategoryId') || ''),
    })
  })
}

export function registerCmsTechnicalSupportDetail(editor: GrapesEditor) {
  registerDetailCmsComponent(editor, {
    type: WB_CMS_TECHNICAL_SUPPORT_DETAIL_TYPE,
    dataWbComponent: 'cms-technical-support-detail',
    dataCmsComponent: 'technical-support-detail',
    name: 'Technical Support 详情',
    dynamicPublish: true,
    styleKey: 'wb-cms-technical-support-detail',
    styles: TECHNICAL_SUPPORT_DETAIL_STYLES,
    headerClass: 'wb-cms-detail-header',
    headerContent: '📘 Technical Support 详情模板 — 数据源为媒体资源详情，图片列表由 CMS items 填充',
    bodyClass: 'wb-tech-support-detail__body',
    defaultAttributes: {
      class: 'wb-tech-support-detail',
      'data-category-id': '',
      'data-media-id': '',
      'data-tenant-id': `${getEffectiveTenantId() || ''}`,
    },
    defaultProps: {
      cmsCategoryId: '',
      cmsPreviewMediaId: '',
    },
    traits: [
      {
        type: 'select',
        label: '媒体资源分类',
        name: 'cmsCategoryId',
        changeProp: true,
        options: [{ value: '', label: '请选择媒体资源分类' }],
      },
      {
        type: 'select',
        label: '预览资源',
        name: 'cmsPreviewMediaId',
        changeProp: true,
        options: [{ value: '', label: '未选择（显示占位模板）' }],
      },
    ],
    watchProps: ['cmsCategoryId', 'cmsPreviewMediaId'],
    syncAttrs: (model) => ({
      'data-category-id': model.get('cmsCategoryId') || '',
      'data-media-id': model.get('cmsPreviewMediaId') || '',
      'data-tenant-id': `${getEffectiveTenantId() || ''}`,
    }),
    onModelInit: initTechnicalSupportDetailModel,
    script: technicalSupportDetailScript,
    scriptExport: technicalSupportDetailScript,
    bodyComponents: [
      {
        tagName: 'div',
        attributes: { class: 'wb-tech-support-detail__meta' },
        components: [
          { tagName: 'h1', attributes: { 'data-cms-bind': 'media.title' }, content: 'Technical Support Title' },
          { tagName: 'p', attributes: { 'data-cms-bind': 'media.description' }, content: 'Technical Support Description' },
        ],
      },
      {
        tagName: 'div',
        attributes: { class: 'tooto-flipbook-viewport' },
        components: [
          {
            tagName: 'div',
            attributes: { class: 'tooto-flipbook-magazine-viewport' },
            components: [
              { tagName: 'div', attributes: { class: 'tooto-flipbook-nav-arrow tooto-flipbook-nav-prev' }, content: '‹' },
              { tagName: 'div', attributes: { class: 'tooto-flipbook-magazine' } },
              { tagName: 'div', attributes: { class: 'tooto-flipbook-nav-arrow tooto-flipbook-nav-next' }, content: '›' },
            ],
          },
          { tagName: 'div', attributes: { class: 'tooto-flipbook-thumbnails-panel' } },
          {
            tagName: 'div',
            attributes: { class: 'tooto-flipbook-bottom-bar' },
            components: [
              {
                tagName: 'div',
                attributes: { class: 'tooto-flipbook-left-btns' },
                components: [
                  {
                    tagName: 'div',
                    attributes: { class: 'tooto-flipbook-btn tooto-flipbook-btn-home' },
                    components: [
                      { tagName: 'span', content: '‹' },
                      { tagName: 'span', attributes: { class: 'tooto-flipbook-btn-text' }, content: 'Back' },
                    ],
                  },
                ],
              },
              {
                tagName: 'div',
                attributes: { class: 'tooto-flipbook-center-btns' },
                components: [
                  { tagName: 'div', attributes: { class: 'tooto-flipbook-btn tooto-flipbook-btn-first' }, content: '«' },
                  { tagName: 'div', attributes: { class: 'tooto-flipbook-btn tooto-flipbook-btn-prev' }, content: '‹' },
                  {
                    tagName: 'div',
                    attributes: { class: 'tooto-flipbook-page-info' },
                    components: [
                      { tagName: 'span', content: 'Page' },
                      {
                        tagName: 'div',
                        attributes: { class: 'tooto-flipbook-page-select-wrapper' },
                        components: [
                          { tagName: 'div', attributes: { class: 'tooto-flipbook-current-value' }, content: '1 / 1' },
                          { tagName: 'div', attributes: { class: 'tooto-flipbook-page-options-list' } },
                        ],
                      },
                    ],
                  },
                  { tagName: 'div', attributes: { class: 'tooto-flipbook-btn tooto-flipbook-btn-next' }, content: '›' },
                  { tagName: 'div', attributes: { class: 'tooto-flipbook-btn tooto-flipbook-btn-last' }, content: '»' },
                ],
              },
              {
                tagName: 'div',
                attributes: { class: 'tooto-flipbook-right-btns' },
                components: [
                  { tagName: 'div', attributes: { class: 'tooto-flipbook-btn tooto-flipbook-btn-toggle-thumbs' }, content: '▦' },
                ],
              },
            ],
          },
        ],
      },
      {
        tagName: 'div',
        attributes: { class: 'wb-tech-support-detail__image-source', 'data-cms-if': 'media.items' },
        components: [
          {
            tagName: 'div',
            attributes: { 'data-cms-repeat': 'item@media.items' },
            components: [
              {
                tagName: 'img',
                attributes: {
                  src: 'https://placehold.co/2314x1700/png?text=Flipbook+Page',
                  alt: '',
                  'data-cms-bind-src': 'item.url',
                },
              },
            ],
          },
        ],
      },
      ...buildSeoMetaNodes({
        titleBind: 'media.seoTitle',
        titleContent: 'Technical Support',
        keywordsBind: 'media.seoKeywords',
        descriptionBind: 'media.seoDescription',
      }),
    ],
  })
}
