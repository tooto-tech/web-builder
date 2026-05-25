import type { Editor } from 'grapesjs'
import { WB_INQUIRY_FORM_TYPE } from '@/components/WebBuilder/components/registries/interactive/inquiryForm'

export const WB_CONTACT_INFO_BLOCK_TYPE = 'wb-contact-info-block'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 5.5h16" />
  <path d="M4 12h8" />
  <path d="M4 18.5h8" />
  <rect x="13.5" y="8.5" width="6" height="10" rx="1.5" />
</svg>`

const CONTACT_INFO_BLOCK_CSS = `
  .wb-contact-info-block {
    width: 100%;
    padding: 96px 0;
    background: #f5f7fa;
  }
  .wb-contact-info-block__inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  .wb-contact-info-block__shell {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(340px, 0.96fr);
    gap: 40px;
    align-items: stretch;
  }
  .wb-contact-info-block__form-wrap {
    min-width: 0;
    align-self: stretch;
  }
  .wb-contact-info-block__form-wrap .wb-inquiry {
    width: 100%;
    max-width: none;
  }
  .wb-contact-info-block__cards {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 18px;
    height: 100%;
    align-self: stretch;
  }
  .wb-contact-info-block__card {
    min-width: 0;
    height: 100%;
    padding: 30px 34px;
    border-radius: 18px;
    background: #ffffff;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .wb-contact-info-block__card-title {
    position: relative;
    margin: 0;
    padding-left: 18px;
    color: #162754;
    font-size: 22px;
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0;
  }
  .wb-contact-info-block__card-title::before {
    content: "";
    position: absolute;
    left: 0;
    top: 2px;
    width: 4px;
    height: 24px;
    border-radius: 999px;
    background: #165bcf;
  }
  .wb-contact-info-block__card-lead {
    margin: 20px 0 10px;
    color: #304264;
    font-size: 16px;
    line-height: 1.55;
    font-weight: 600;
  }
  .wb-contact-info-block__card-copy {
    margin: 6px 0 0;
    color: #4d5f80;
    font-size: 16px;
    line-height: 1.65;
    font-weight: 400;
    word-break: break-word;
  }
  @media (max-width: 1023px) {
    .wb-contact-info-block {
      padding: 64px 0;
    }
    .wb-contact-info-block__inner {
      padding: 0 20px;
    }
    .wb-contact-info-block__shell {
      grid-template-columns: minmax(0, 1fr);
      gap: 32px;
    }
    .wb-contact-info-block__cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: minmax(0, 1fr);
      gap: 16px;
      height: auto;
    }
    .wb-contact-info-block__card {
      height: auto;
      padding: 26px 24px;
    }
    .wb-contact-info-block__card-title {
      font-size: 20px;
      padding-left: 16px;
    }
    .wb-contact-info-block__card-title::before {
      height: 22px;
    }
    .wb-contact-info-block__card-lead,
    .wb-contact-info-block__card-copy {
      font-size: 15px;
    }
  }
  @media (max-width: 767px) {
    .wb-contact-info-block {
      padding: 40px 0;
    }
    .wb-contact-info-block__inner {
      padding: 0 16px;
    }
    .wb-contact-info-block__shell {
      gap: 24px;
    }
    .wb-contact-info-block__cards {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: repeat(2, minmax(0, auto));
    }
    .wb-contact-info-block__card {
      padding: 22px 20px;
      border-radius: 16px;
    }
    .wb-contact-info-block__card-title {
      font-size: 18px;
      padding-left: 14px;
    }
    .wb-contact-info-block__card-title::before {
      top: 1px;
      width: 3px;
      height: 20px;
    }
    .wb-contact-info-block__card-lead {
      margin-top: 16px;
    }
    .wb-contact-info-block__card-lead,
    .wb-contact-info-block__card-copy {
      font-size: 14px;
      line-height: 1.6;
    }
  }
`

function buildTextNode(tagName: string, className: string, content: string) {
  return {
    tagName,
    type: 'text',
    selectable: true,
    draggable: false,
    droppable: false,
    copyable: false,
    removable: false,
    attributes: { class: className },
    components: content,
  }
}

function buildInfoCard(title: string, lines: string[], lead?: string) {
  const content = [
    buildTextNode('h3', 'wb-contact-info-block__card-title', title),
  ]

  if (lead) {
    content.push(buildTextNode('p', 'wb-contact-info-block__card-lead', lead))
  }

  lines.forEach(line => {
    content.push(buildTextNode('p', 'wb-contact-info-block__card-copy', line))
  })

  return {
    tagName: 'div',
    name: title,
    selectable: true,
    droppable: false,
    draggable: '.wb-contact-info-block__cards',
    attributes: { class: 'wb-contact-info-block__card' },
    components: content,
  }
}

function buildContactInfoBlockTree() {
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
      attributes: { class: 'wb-contact-info-block__inner' },
      components: [
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
          attributes: { class: 'wb-contact-info-block__shell' },
          components: [
            {
              tagName: 'div',
              name: '表单区',
              selectable: true,
              droppable: `[data-gjs-type="${WB_INQUIRY_FORM_TYPE}"]`,
              attributes: { class: 'wb-contact-info-block__form-wrap' },
              components: [
                {
                  type: WB_INQUIRY_FORM_TYPE,
                },
              ],
            },
            {
              tagName: 'div',
              name: '联系信息',
              selectable: false,
              hoverable: false,
              highlightable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              attributes: { class: 'wb-contact-info-block__cards' },
              components: [
                buildInfoCard(
                  'Our Headquarter',
                  ['Add: no. 95 Renmin Road, Yangshan Town, Wuxi City, China'],
                  'Wuxi Changhong Masterbatches Co., Ltd.',
                ),
                buildInfoCard(
                  'Get in Touch',
                  [
                    'Tel: 86-510-83958699/83951406',
                    'Fax: 86-510-84601779/83951402',
                    'Web: www.masterbatches.cn',
                    'Email: info@masterbatches.cn',
                  ],
                ),
              ],
            },
          ],
        },
      ],
    },
  ]
}

export function registerContactInfoBlockComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_CONTACT_INFO_BLOCK_TYPE)) return

  domComponents.addType(WB_CONTACT_INFO_BLOCK_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'contact-info-block'
        ? { type: WB_CONTACT_INFO_BLOCK_TYPE }
        : false,

    model: {
      defaults: {
        name: 'Contact Info Block',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'contact-info-block',
          class: 'wb-contact-info-block',
        },
        components: buildContactInfoBlockTree(),
        styles: CONTACT_INFO_BLOCK_CSS,
      },
    },
  })

  blockManager?.add?.(WB_CONTACT_INFO_BLOCK_TYPE, {
    label: 'Contact Info Block',
    category: 'Section',
    content: { type: WB_CONTACT_INFO_BLOCK_TYPE },
    media: BLOCK_ICON,
  })
}
