import {
  PAGINATION_ATTRS,
  PAGINATION_PROPS,
  PAGINATION_TRAITS,
  syncPaginationAttrs,
} from '@/components/WebBuilder/utils/cmsFactory'

export type CmsComponentModel = {
  get: (key: string) => any
}

export interface CategoryLimitConfigOptions {
  categoryLabel: string
  categoryPlaceholder: string
  limitLabel?: string
  limitDefault: number
  limitMin?: number
  limitMax?: number
}

export interface CategoryOnlyConfigOptions {
  categoryLabel: string
  categoryPlaceholder: string
}

export interface CategoryResourcePaginationConfigOptions {
  categoryLabel: string
  categoryPlaceholder: string
  resourceTypeLabel?: string
}

export function buildCategoryLimitConfig(options: CategoryLimitConfigOptions) {
  const {
    categoryLabel,
    categoryPlaceholder,
    limitLabel = '显示数量',
    limitDefault,
    limitMin = 1,
    limitMax = 20,
  } = options

  return {
    defaultAttributes: {
      'data-category-id': '',
      'data-limit': String(limitDefault),
    },
    defaultProps: {
      cmsCategoryId: '',
      cmsLimit: limitDefault,
    },
    traits: [
      {
        type: 'text',
        label: categoryLabel,
        name: 'cmsCategoryId',
        changeProp: true,
        placeholder: categoryPlaceholder,
      },
      {
        type: 'number',
        label: limitLabel,
        name: 'cmsLimit',
        changeProp: true,
        min: limitMin,
        max: limitMax,
      },
    ],
    watchProps: ['cmsCategoryId', 'cmsLimit'],
    syncAttrs: (m: CmsComponentModel) => ({
      'data-category-id': m.get('cmsCategoryId') || '',
      'data-limit': String(m.get('cmsLimit') || limitDefault),
    }),
  }
}

export function buildCategoryOnlyConfig(options: CategoryOnlyConfigOptions) {
  const { categoryLabel, categoryPlaceholder } = options

  return {
    defaultAttributes: { 'data-category-id': '' },
    defaultProps: { cmsCategoryId: '' },
    traits: [
      {
        type: 'text',
        label: categoryLabel,
        name: 'cmsCategoryId',
        changeProp: true,
        placeholder: categoryPlaceholder,
      },
    ],
    watchProps: ['cmsCategoryId'],
    syncAttrs: (m: CmsComponentModel) => ({
      'data-category-id': m.get('cmsCategoryId') || '',
    }),
  }
}

export function buildCategoryResourcePaginationConfig(options: CategoryResourcePaginationConfigOptions) {
  const {
    categoryLabel,
    categoryPlaceholder,
    resourceTypeLabel = '资源类型',
  } = options

  return {
    defaultAttributes: {
      'data-category-id': '',
      'data-resource-type': '',
      'data-loop-item-type': 'media',
      'data-loop-item-template-resource-id': '',
      'data-category-loop-mode': 'root',
      'data-category-parent-id': '',
      'data-category-click-target': 'contentList',
      ...PAGINATION_ATTRS,
    },
    defaultProps: {
      cmsCategoryId: '',
      cmsResourceType: '',
      cmsLoopItemType: 'media',
      cmsLoopItemTemplateResourceId: '',
      cmsCategoryLoopMode: 'root',
      cmsCategoryParentId: '',
      cmsCategoryClickTarget: 'contentList',
      ...PAGINATION_PROPS,
    },
    traits: [
      {
        type: 'text',
        label: categoryLabel,
        name: 'cmsCategoryId',
        changeProp: true,
        placeholder: categoryPlaceholder,
      },
      {
        type: 'select',
        label: resourceTypeLabel,
        name: 'cmsResourceType',
        changeProp: true,
        options: [
          { value: '', label: '全部' },
          { value: 'IMAGE', label: '图片' },
          { value: 'VIDEO', label: '视频' },
          { value: 'DOCUMENT', label: '文档' },
        ],
      },
      {
        type: 'select',
        label: '循环体类型',
        name: 'cmsLoopItemType',
        changeProp: true,
        options: [
          { value: 'media', label: '媒体循环体' },
          { value: 'mediaCategory', label: '媒体分类循环体' },
        ],
      },
      {
        type: 'loop-item-template-select',
        label: '循环体资源ID',
        name: 'cmsLoopItemTemplateResourceId',
        changeProp: true,
      },
      {
        type: 'select',
        label: '分类循环内容',
        name: 'cmsCategoryLoopMode',
        changeProp: true,
        options: [
          { value: 'root', label: '一级分类' },
          { value: 'childrenOf', label: '指定父级的下级' },
          { value: 'descendantsOf', label: '指定父级下全部子分类' },
          { value: 'currentChildren', label: '当前分类下级' },
          { value: 'currentDescendants', label: '当前分类全部子分类' },
        ],
      },
      {
        type: 'text',
        label: '指定父级ID',
        name: 'cmsCategoryParentId',
        changeProp: true,
        placeholder: 'childrenOf/descendantsOf 使用',
      },
      {
        type: 'select',
        label: '分类点击效果',
        name: 'cmsCategoryClickTarget',
        changeProp: true,
        options: [
          { value: 'contentList', label: '进入媒体列表' },
          { value: 'categoryList', label: '进入下一级分类列表' },
        ],
      },
      ...PAGINATION_TRAITS,
    ],
    watchProps: [
      'cmsCategoryId',
      'cmsResourceType',
      'cmsLoopItemType',
      'cmsLoopItemTemplateResourceId',
      'cmsCategoryLoopMode',
      'cmsCategoryParentId',
      'cmsCategoryClickTarget',
      'cmsPageSize',
      'cmsPagination',
      'cmsMaxPages',
    ],
    syncAttrs: (m: CmsComponentModel) => ({
      'data-category-id': m.get('cmsCategoryId') || '',
      'data-resource-type': m.get('cmsResourceType') || '',
      'data-loop-item-type': m.get('cmsLoopItemType') || 'media',
      'data-loop-item-template-resource-id': m.get('cmsLoopItemTemplateResourceId') || '',
      'data-category-loop-mode': m.get('cmsCategoryLoopMode') || 'root',
      'data-category-parent-id': m.get('cmsCategoryParentId') || '',
      'data-category-click-target': m.get('cmsCategoryClickTarget') || 'contentList',
      ...syncPaginationAttrs(m),
    }),
  }
}
