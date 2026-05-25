import type { Editor } from 'grapesjs'
import {
  makeImagePickerTrait,
  makeTextTrait,
} from '@/components/WebBuilder/utils/traitFactory'
import { getPageSettingsFromPage } from '@/components/WebBuilder/utils/pageSettings'

export const WB_PAGE_HEAD_BANNER_TYPE = 'wb-page-head-banner'

const PAGE_HEAD_BANNER_CSS = `
  .wb-page-head-banner {
    width: 100%;
    position: relative;
    overflow: hidden;
    background: #0f172a;
    color: #ffffff;
  }
  .wb-page-head-banner__stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: clamp(200px, 28vw, 390px);
    align-items: stretch;
  }
  .wb-page-head-banner__picture{
    grid-area: 1 / 1;
  }
  .wb-page-head-banner__picture {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: block;
  }
  .wb-page-head-banner__picture source {
    display: none;
  }
  .wb-page-head-banner__picture > source,
  .wb-page-head-banner__picture > img {
    width: 100%;
    height: 100%;
  }
  .wb-page-head-banner__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .wb-page-head-banner__title-wrap {
    grid-area: 1 / 1;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    max-width: 1352px;
    margin: 0 auto;
    padding: 0 20px;
  }
  .wb-page-head-banner__title {
    margin: 0;
    width: 100%;
    font-size: clamp(28px, 4vw, 56px);
    line-height: 1.08;
    font-weight: 600;
    white-space: pre-line;
    text-wrap: balance;
  }
  @media (max-width: 1023px) {
  }
  @media (max-width: 767px) {
    .wb-page-head-banner__title {
      font-size: clamp(24px, 7vw, 36px);
      line-height: 1.12;
    }
  }
`

function getSelectedPageTitle(editor: Editor): string {
  const page = editor.Pages?.getSelected?.()
  const settings = getPageSettingsFromPage(page)
  return `${settings.tdkTitle || settings.name || 'Page Title'}`
}

function buildPageHeadBannerTree(title: string, desktopImage: string, mobileImage: string) {
  const desktopSrc = desktopImage || 'https://placehold.co/1600x720/0f172a/ffffff?text=Page+Head+Banner'
  const mobileSrc = mobileImage || desktopSrc

  return [
    {
      tagName: 'div',
      name: 'Banner Stage',
      selectable: false,
      hoverable: false,
      highlightable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      layerable: false,
      attributes: { class: 'wb-page-head-banner__stage' },
      components: [
        {
          tagName: 'picture',
          name: 'Responsive Background',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          layerable: false,
          attributes: { class: 'wb-page-head-banner__picture' },
          components: [
            {
              tagName: 'source',
              selectable: false,
              hoverable: false,
              highlightable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              layerable: false,
              attributes: {
                media: '(max-width: 767px)',
                srcset: mobileSrc,
              },
            },
            {
              tagName: 'img',
              selectable: false,
              hoverable: false,
              highlightable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              layerable: false,
              attributes: {
                class: 'wb-page-head-banner__image',
                src: desktopSrc,
                alt: title,
                decoding: 'async',
                fetchpriority: 'high',
              },
            },
          ],
        },
        {
          tagName: 'div',
          name: 'Title Wrap',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          layerable: false,
          attributes: { class: 'wb-page-head-banner__title-wrap' },
          components: [
            {
              tagName: 'h1',
              selectable: false,
              hoverable: false,
              highlightable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              layerable: false,
              attributes: { class: 'wb-page-head-banner__title' },
              content: title,
            },
          ],
        },
      ],
    },
  ]
}

export function registerPageHeadBannerComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_PAGE_HEAD_BANNER_TYPE)) return

  domComponents.addType(WB_PAGE_HEAD_BANNER_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'page-head-banner'
        ? { type: WB_PAGE_HEAD_BANNER_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Page Head Banner',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'page-head-banner',
          class: 'wb-page-head-banner',
        },
        style: {
          width: '100%',
        },
        phbDesktopImage: 'https://placehold.co/1600x720/0f172a/ffffff?text=Page+Head+Banner',
        phbMobileImage: 'https://placehold.co/900x1200/0f172a/ffffff?text=Mobile+Banner',
        phbTitle: '',
        traits: [
          makeImagePickerTrait('桌面端背景图', 'phbDesktopImage', { showPreview: true }),
          makeImagePickerTrait('移动端背景图', 'phbMobileImage', { showPreview: true }),
          makeTextTrait('标题', 'phbTitle', { placeholder: '留空时默认使用页面标题' }),
        ],
        components: buildPageHeadBannerTree(
          getSelectedPageTitle(editor),
          'https://placehold.co/1600x720/0f172a/ffffff?text=Page+Head+Banner',
          'https://placehold.co/900x1200/0f172a/ffffff?text=Mobile+Banner',
        ),
        styles: PAGE_HEAD_BANNER_CSS,
      },

      init(this: any) {
        this.syncBannerContent = this.syncBannerContent.bind(this)
        this.listenTo(
          this,
          'change:phbDesktopImage change:phbMobileImage change:phbTitle',
          this.syncBannerContent,
        )
        this.syncBannerContent()
      },

      syncBannerContent(this: any) {
        const title = `${this.get('phbTitle') || ''}`.trim() || getSelectedPageTitle(editor)
        const desktopImage = `${this.get('phbDesktopImage') || ''}`.trim()
          || 'https://placehold.co/1600x720/0f172a/ffffff?text=Page+Head+Banner'
        const mobileImage = `${this.get('phbMobileImage') || ''}`.trim() || desktopImage

        this.components().reset(buildPageHeadBannerTree(title, desktopImage, mobileImage))
        this.set('name', title || 'Page Head Banner')
      },
    },
  })
}
