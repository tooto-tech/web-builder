import type { Editor } from 'grapesjs'
import { WB_IMAGE_TYPE } from '@/components/WebBuilder/components/registries/media/image'
import { WB_INQUIRY_FORM_TYPE } from '@/components/WebBuilder/components/registries/interactive/inquiryForm'

export const WB_CONTACT_BLOCK_TYPE = 'wb-contact-block'

const CONTACT_BLOCK_CSS = `
  .wb-contact-block {
    width: 100%;
    padding: 80px 0;
    background-color: #F5F7FA;
  }
  .wb-contact-block__inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  .wb-contact-block__shell {
    display: grid;
    grid-template-columns: minmax(0, 620px) minmax(0, 1fr);
    align-items: stretch;
    gap: 72px;
  }
  .wb-contact-block__form-wrap {
    min-width: 0;
    width: 100%;
  }
  .wb-contact-block__form-wrap [data-wb-component="inquiry-form"],
  .wb-contact-block__form-wrap .wb-inquiry {
    width: 100%;
    max-width: none;
  }
  .wb-contact-block__media {
    min-width: 0;
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    min-height: 100%;
    overflow: hidden;
    background: #dbe7f5;
  }
  .wb-contact-block__media [data-wb-component="image"] {
    width: 100% !important;
    height: 100% !important;
    min-height: 100%;
    margin: 0 !important;
  }
  .wb-contact-block__media [data-wb-component="image"] > img,
  .wb-contact-block__media [data-wb-component="image"] > a,
  .wb-contact-block__media [data-wb-component="image"] > a > img {
    width: 100%;
    height: 100%;
  }
  .wb-contact-block__media img {
    display: block;
  }
  @media (max-width: 1279px) {
    .wb-contact-block {
      padding: 72px 0;
    }
    .wb-contact-block__shell {
      grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr);
      gap: 48px;
    }
  }
  @media (max-width: 1023px) {
    .wb-contact-block {
      padding: 60px 0;
    }
    .wb-contact-block__inner {
      padding: 0 20px;
    }
    .wb-contact-block__shell {
      grid-template-columns: minmax(0, 1fr);
      gap: 32px;
    }
    .wb-contact-block__form-wrap {
      order: 1;
    }
    .wb-contact-block__form-wrap .wb-inquiry__field {
      margin-bottom: 22px;
    }
    .wb-contact-block__form-wrap .wb-inquiry__actions {
      margin-top: 28px;
    }
    .wb-contact-block__media {
      min-height: 360px;
      order: 2;
    }
  }
  @media (max-width: 767px) {
    .wb-contact-block {
      padding: 40px 0;
    }
    .wb-contact-block__inner {
      padding: 0 16px;
    }
    .wb-contact-block__shell {
      gap: 24px;
    }
    .wb-contact-block__form-wrap {
      width: 100%;
    }
    .wb-contact-block__form-wrap .wb-inquiry__field {
      margin-bottom: 18px;
    }
    .wb-contact-block__form-wrap .wb-inquiry__actions {
      margin-top: 22px;
    }
    .wb-contact-block__media {
      min-height: 240px;
    }
  }
  @media (max-width: 479px) {
    .wb-contact-block {
      padding: 32px 0;
    }
    .wb-contact-block__media {
      min-height: 220px;
    }
  }
`

function buildContactBlockTree() {
  return [
    {
      tagName: 'div',
      name: '内容容器',
      selectable: false,
      hoverable: false,
      highlightable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-contact-block__inner' },
      components: [
        {
          tagName: 'div',
        },
        {
          tagName: 'div',
          name: '双栏布局',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-contact-block__shell' },
          components: [
            {
              tagName: 'div',
              name: '表单区',
              selectable: true,
              droppable: `[data-gjs-type="${WB_INQUIRY_FORM_TYPE}"]`,
              attributes: { class: 'wb-contact-block__form-wrap' },
              components: [
                {
                  type: WB_INQUIRY_FORM_TYPE,
                },
              ],
            },
            {
              tagName: 'div',
              name: '图片区',
              selectable: true,
              droppable: `[data-gjs-type="${WB_IMAGE_TYPE}"]`,
              attributes: { class: 'wb-contact-block__media' },
              components: [
                {
                  type: WB_IMAGE_TYPE,
                  style: {
                    width: '100%',
                    height: '100%',
                    'min-height': '100%',
                    'max-width': '100%',
                    margin: '0',
                    overflow: 'hidden',
                  },
                  imageSrc: 'https://placehold.co/540x480/d9e6f5/7e95b1?text=Contact+Image',
                  imageAlt: 'Contact image',
                  imageObjectFit: 'cover',
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

export function registerContactBlockComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_CONTACT_BLOCK_TYPE)) return

  domComponents.addType(WB_CONTACT_BLOCK_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'contact-block'
        ? { type: WB_CONTACT_BLOCK_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Contact Block',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'contact-block',
          class: 'wb-contact-block',
        },
        style: {
          width: '100%',
        },
        components: buildContactBlockTree(),
        styles: CONTACT_BLOCK_CSS,
      },
    },
  })
}
