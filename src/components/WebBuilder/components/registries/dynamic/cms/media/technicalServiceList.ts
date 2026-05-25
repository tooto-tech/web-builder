import type { Editor } from 'grapesjs'
import { getAllMediaResourceCategoryList } from '@/api/content/mediaResourceCategory'
import { registerCmsTypeEntry } from '@/components/WebBuilder/utils/cmsFactory'

export const WB_CMS_TECHNICAL_SERVICE_LIST_TYPE = 'wb-cms-technical-service-list'
export const WB_CMS_TECHNICAL_SERVICE_CARD_TYPE = 'wb-cms-technical-service-card'

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

const TECHNICAL_SERVICE_LIST_CSS = `
  .wb-techsvc-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 36px 16px;
    width: 100%;
  }
  .wb-techsvc-card {
    min-width: 0;
  }
  .wb-techsvc-card__media {
    display: block;
    width: 100%;
    margin-bottom: 12px;
    overflow: hidden;
    background: #f3f4f6;
    aspect-ratio: 404 / 281;
  }
  .wb-techsvc-card__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .wb-techsvc-card__title {
    margin: 0 0 10px;
    color: #1f2937;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 600;
  }
  .wb-techsvc-card__link {
    color: #9ca3af;
    font-size: 13px;
    line-height: 1.4;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  @media (max-width: 1023px) {
    .wb-techsvc-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 28px 16px;
    }
  }
  @media (max-width: 767px) {
    .wb-techsvc-list {
      grid-template-columns: minmax(0, 1fr);
      gap: 24px;
    }
    .wb-techsvc-card__title {
      font-size: 17px;
    }
  }
`

function createTechnicalServiceCard(index: number) {
  const placeholders = [
    'Specification Support',
    'Installation Support',
    'Project Planning Support',
    'Compliance & Standards',
    'Troubleshooting Support',
    'On-demand Technical Consultation',
  ]

  const title = placeholders[index] || `Technical Service ${index + 1}`

  return {
    type: WB_CMS_TECHNICAL_SERVICE_CARD_TYPE,
    serviceTitle: title,
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
          class: 'wb-techsvc-card__media',
          href: '#',
          'data-cms-bind-href': 'media.detailUrl',
        },
        components: [
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
              class: 'wb-techsvc-card__image',
              src: `https://placehold.co/808x562?text=Service+${index + 1}`,
              alt: title,
              'data-cms-bind-src': 'media.coverUrl',
              'data-cms-bind-alt': 'media.title',
            },
          },
        ],
      },
      {
        tagName: 'h3',
        selectable: false,
        hoverable: false,
        highlightable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        layerable: false,
        attributes: {
          class: 'wb-techsvc-card__title',
          'data-cms-bind': 'media.title',
        },
        content: title,
      },
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
          class: 'wb-techsvc-card__link',
          href: '#',
          'data-cms-bind-href': 'media.detailUrl',
        },
        content: 'Details',
      },
    ],
  }
}

export function registerCmsTechnicalServiceList(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents) return

  if (!domComponents.getType(WB_CMS_TECHNICAL_SERVICE_CARD_TYPE)) {
    domComponents.addType(WB_CMS_TECHNICAL_SERVICE_CARD_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-technical-service-card'
          ? { type: WB_CMS_TECHNICAL_SERVICE_CARD_TYPE }
          : false,

      model: {
        defaults: {
          name: 'Technical Service Card',
          tagName: 'article',
          draggable: `[data-wb-component="cms-technical-service-list"]`,
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
            'data-wb-component': 'cms-technical-service-card',
            'data-cms-repeat': 'media',
            class: 'wb-techsvc-card',
          },
          serviceTitle: 'Technical Service',
        },

        init(this: any) {
          const title = String(this.get('serviceTitle') || '').trim()
          this.set('name', title || 'Technical Service Card')
        },
      },
    })
  }

  if (!domComponents.getType(WB_CMS_TECHNICAL_SERVICE_LIST_TYPE)) {
    domComponents.addType(WB_CMS_TECHNICAL_SERVICE_LIST_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-technical-service-list'
          ? { type: WB_CMS_TECHNICAL_SERVICE_LIST_TYPE }
          : false,

      model: {
        defaults: {
          name: 'Technical Service 列表',
          tagName: 'section',
          draggable: '*',
          droppable: `[data-wb-component="cms-technical-service-card"]`,
          selectable: true,
          editable: false,
          stylable: true,
          attributes: {
            'data-wb-component': 'cms-technical-service-list',
            'data-cms-component': 'technical-service-list',
            'data-category-id': '',
            'data-page-size': '99',
            class: 'wb-techsvc-list',
          },
          styles: TECHNICAL_SERVICE_LIST_CSS,
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
            createTechnicalServiceCard(0),
            createTechnicalServiceCard(1),
            createTechnicalServiceCard(2),
            createTechnicalServiceCard(3),
            createTechnicalServiceCard(4),
            createTechnicalServiceCard(5),
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
            'data-cms-component': 'technical-service-list',
            'data-category-id': String(this.get('cmsCategoryId') || '').trim(),
            'data-page-size': '99',
          })
        },
      },
    })
  }

  registerCmsTypeEntry({
    dataCmsComponent: 'technical-service-list',
    dataWbComponent: 'cms-technical-service-list',
    publishTemplate: '',
    dynamicPublish: true,
  })
}
