import { describe, expect, it, vi } from 'vitest'
import useTemplateRuleOptions from './useTemplateRuleOptions'

vi.mock('@/api/mall/product/category', () => ({
  getCategoryList: vi.fn(),
}))

vi.mock('@/api/mall/product/brand', () => ({
  getSimpleBrandList: vi.fn(),
}))

vi.mock('@/api/content/postCategory', () => ({
  getAllPostCategoryList: vi.fn(),
}))

vi.mock('@/api/content/postType', () => ({
  getAllPostTypeList: vi.fn(),
}))

vi.mock('@/api/content/postTag', () => ({
  getAllPostTagList: vi.fn(),
}))

vi.mock('@/api/content/mediaResourceCategory', () => ({
  getAllMediaResourceCategoryList: vi.fn(),
}))

describe('useTemplateRuleOptions', () => {
  it('provides fixed product category level options', () => {
    const options = useTemplateRuleOptions().getOptions('TEMP_PRODUCT_CATEGORY_LIST', 'levels')

    expect(options).toEqual([
      { value: 1, label: '一级分类' },
      { value: 2, label: '二级分类' },
      { value: 3, label: '三级分类' },
      { value: 4, label: '四级分类' },
      { value: 5, label: '五级分类' },
    ])
  })

  it('reuses fixed level options for post category rules', () => {
    const options = useTemplateRuleOptions().getOptions('TEMP_POST_CATEGORY_LIST', 'levels')

    expect(options.map((item) => item.value)).toEqual([1, 2, 3, 4, 5])
  })

  it('ignores unsupported rule option fields', () => {
    expect(useTemplateRuleOptions().getOptions('TEMP_PRODUCT_CATEGORY_LIST', 'unknown')).toEqual([])
  })
})
