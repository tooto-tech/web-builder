import type { Editor } from 'grapesjs'
import { getAllMediaResourceCategoryList } from '@/api/content/mediaResourceCategory'
import { registerCmsTypeEntry } from '@/components/WebBuilder/utils/cmsFactory'

export const WB_CMS_TECHNICAL_DOWNLOAD_LIST_TYPE = 'wb-cms-technical-download-list'
export const WB_CMS_TECHNICAL_DOWNLOAD_ITEM_TYPE = 'wb-cms-technical-download-item'

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

const TECHNICAL_DOWNLOAD_LIST_CSS = `
  .wb-techdl-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px 28px;
    width: 100%;
  }
  .wb-techdl-item {
    min-width: 0;
  }
  .wb-techdl-item__link {
    display: flex;
    align-items: center;
    gap: 18px;
    min-height: 72px;
    padding: 18px 26px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #0b3d67;
    text-decoration: none;
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
  }
  .wb-techdl-item__link:hover {
    border-color: #cbd5e1;
    background: #ffffff;
    transform: translateY(-1px);
  }
  .wb-techdl-item__icon {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    color: #0b3d67;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .wb-techdl-item__icon svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .wb-techdl-item__title {
    min-width: 0;
    color: #0b3d67;
    font-size: 18px;
    line-height: 1.35;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 1023px) {
    .wb-techdl-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
  }
  @media (max-width: 767px) {
    .wb-techdl-list {
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
    }
    .wb-techdl-item__link {
      min-height: 64px;
      padding: 16px 18px;
      gap: 14px;
    }
    .wb-techdl-item__title {
      font-size: 16px;
    }
  }
`

function createTechnicalDownloadItem(index: number) {
  const placeholders = [
    'FOCA Technical Service Manual',
    'FOCA Product quotation sheet-2025',
    'FOCA Framed Vanity Mirror',
  ]
  const title = placeholders[index % placeholders.length] || `Download File ${index + 1}`

  return {
    type: WB_CMS_TECHNICAL_DOWNLOAD_ITEM_TYPE,
    fileTitle: title,
    components: [
      {
        tagName: 'a',
        selectable: false,
        hoverable: false,
        highlightable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        layerable: false,
        attributes: {
          class: 'wb-techdl-item__link',
          href: '#',
          download: 'download',
          'data-cms-bind-href': 'media.downloadUrl',
        },
        components: [
          {
            tagName: 'span',
            selectable: false,
            hoverable: false,
            highlightable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            layerable: false,
            attributes: {
              class: 'wb-techdl-item__icon',
              'aria-hidden': 'true',
            },
            content:
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 17v3h16v-3"/></svg>',
          },
          {
            tagName: 'span',
            selectable: false,
            hoverable: false,
            highlightable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            removable: false,
            layerable: false,
            attributes: {
              class: 'wb-techdl-item__title',
              'data-cms-bind': 'media.title',
            },
            content: title,
          },
        ],
      },
    ],
  }
}

export function registerCmsTechnicalDownloadList(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents) return

  if (!domComponents.getType(WB_CMS_TECHNICAL_DOWNLOAD_ITEM_TYPE)) {
    domComponents.addType(WB_CMS_TECHNICAL_DOWNLOAD_ITEM_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-technical-download-item'
          ? { type: WB_CMS_TECHNICAL_DOWNLOAD_ITEM_TYPE }
          : false,

      model: {
        defaults: {
          name: 'Technical Download Item',
          tagName: 'article',
          draggable: `[data-wb-component="cms-technical-download-list"]`,
          droppable: false,
          selectable: false,
          editable: false,
          stylable: true,
          hoverable: false,
          highlightable: false,
          layerable: false,
          copyable: false,
          removable: false,
          attributes: {
            'data-wb-component': 'cms-technical-download-item',
            'data-cms-repeat': 'media',
            class: 'wb-techdl-item',
          },
          fileTitle: 'Technical Download File',
        },

        init(this: any) {
          const title = String(this.get('fileTitle') || '').trim()
          this.set('name', title || 'Technical Download Item')
        },
      },
    })
  }

  if (!domComponents.getType(WB_CMS_TECHNICAL_DOWNLOAD_LIST_TYPE)) {
    domComponents.addType(WB_CMS_TECHNICAL_DOWNLOAD_LIST_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-technical-download-list'
          ? { type: WB_CMS_TECHNICAL_DOWNLOAD_LIST_TYPE }
          : false,

      model: {
        defaults: {
          name: 'Technical Download 列表',
          tagName: 'section',
          draggable: '*',
          droppable: `[data-wb-component="cms-technical-download-item"]`,
          selectable: true,
          editable: false,
          stylable: true,
          attributes: {
            'data-wb-component': 'cms-technical-download-list',
            'data-cms-component': 'technical-download-list',
            'data-category-id': '',
            'data-page-size': '99',
            class: 'wb-techdl-list',
          },
          styles: TECHNICAL_DOWNLOAD_LIST_CSS,
          style: {
            display: 'grid',
            width: '100%',
          },
          cmsCategoryId: '',
          traits: [
            {
              type: 'select',
              label: '媒体资源分类',
              name: 'cmsCategoryId',
              changeProp: true,
              options: [{ id: '', value: '', label: '请选择媒体资源分类' }],
            },
          ],
          components: [
            createTechnicalDownloadItem(0),
            createTechnicalDownloadItem(1),
            createTechnicalDownloadItem(2),
            createTechnicalDownloadItem(3),
            createTechnicalDownloadItem(4),
            createTechnicalDownloadItem(5),
          ],
        },

        init(this: any) {
          const attrs = this.getAttributes?.() || {}
          const categoryId = String(this.get('cmsCategoryId') || attrs['data-category-id'] || '').trim()
          if (categoryId && !`${this.get('cmsCategoryId') || ''}`.trim()) {
            this.set('cmsCategoryId', categoryId, { silent: true })
          }

          void initMediaCategorySelectTrait(this)
          this.on('change:cmsCategoryId', this._syncAttrs)
          this._syncAttrs()
        },

        _syncAttrs(this: any) {
          this.addAttributes({
            'data-cms-component': 'technical-download-list',
            'data-category-id': String(this.get('cmsCategoryId') || '').trim(),
            'data-page-size': '99',
          })
        },
      },
    })
  }

  registerCmsTypeEntry({
    dataCmsComponent: 'technical-download-list',
    dataWbComponent: 'cms-technical-download-list',
    publishTemplate: '',
    dynamicPublish: true,
  })
}
