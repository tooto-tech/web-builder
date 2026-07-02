import { describe, expect, it } from 'vitest'
import { buildFieldSelectOptions, DYNAMIC_FIELD_MAP, DYNAMIC_REPEAT_MAP, filterFieldsByKind } from '../../../../../../../../../packages/webbuilder-plugins/src/components-cms/registries/dynamic/cms/dynamicField/bindings.js'

describe('cms dynamic product detail fields', () => {
  it('exposes product features as a page-level text field', () => {
    const productDetailFields = DYNAMIC_FIELD_MAP['product-detail']

    expect(productDetailFields).toContainEqual({
      value: 'product.featuresText',
      label: 'Features / 产品特性',
      kind: 'text',
      group: '产品'
    })
    expect(filterFieldsByKind(productDetailFields, ['text']).map((field) => field.value)).toContain(
      'product.featuresText'
    )
  })

  it('keeps the existing feature repeat source for itemized layouts', () => {
    const featureRepeat = DYNAMIC_REPEAT_MAP['product-detail'].find(
      (source) => source.value === 'feature@product.features'
    )

    expect(featureRepeat?.itemFields).toContainEqual({
      value: 'feature.text',
      label: '特性-文本',
      kind: 'text'
    })
  })

  it('keeps legacy product category features metadata but hides it from new text selections', () => {
    const productCategoryFields = DYNAMIC_FIELD_MAP['product-category-item']

    expect(productCategoryFields).toContainEqual({
      value: 'productCategory.featuresHtml',
      label: '产品分类特性（换行）',
      kind: 'html',
      group: '产品分类'
    })
    expect(productCategoryFields).toContainEqual({
      value: 'productCategory.features',
      label: '产品分类特性（旧文本字段）',
      kind: 'text',
      group: '产品分类',
      hidden: true
    })
    expect(
      buildFieldSelectOptions(filterFieldsByKind(productCategoryFields, ['text'])).map((field) => field.value)
    ).not.toContain(
      'productCategory.features'
    )
  })

  it('exposes breadcrumbs on detail and product category templates', () => {
    const productDetailBreadcrumb = DYNAMIC_REPEAT_MAP['product-detail'].find(
      (source) => source.value === 'breadcrumb@breadcrumbs'
    )
    const productCategoryBreadcrumb = DYNAMIC_REPEAT_MAP['product-category-item'].find(
      (source) => source.value === 'breadcrumb@breadcrumbs'
    )

    expect(productDetailBreadcrumb?.itemFields.map((field) => field.value)).toEqual(
      expect.arrayContaining([
        'breadcrumb.label',
        'breadcrumb.url',
        'breadcrumb.position',
        'breadcrumb.isCurrent',
        'breadcrumb.currentClass',
        'breadcrumb.ariaCurrent'
      ])
    )
    expect(productCategoryBreadcrumb).toBeTruthy()
  })

  it('exposes post tags on post detail templates', () => {
    const postDetailFields = DYNAMIC_FIELD_MAP['post-detail']
    const postTagsRepeat = DYNAMIC_REPEAT_MAP['post-detail'].find(
      (source) => source.value === 'tag@post.tags'
    )

    expect(postDetailFields).toContainEqual({
      value: 'post.tagNames',
      label: '标签名称列表',
      kind: 'list',
      group: '文章'
    })
    expect(postTagsRepeat?.itemFields).toEqual(
      expect.arrayContaining([
        { value: 'tag.id', label: '标签-ID', kind: 'number' },
        { value: 'tag.name', label: '标签-名称', kind: 'text' }
      ])
    )
  })

  it('exposes media size on media detail and loop item templates', () => {
    const mediaSizeField = {
      value: 'media.size',
      label: '媒体大小',
      kind: 'text',
      group: '媒体'
    }

    expect(DYNAMIC_FIELD_MAP['media-detail']).toContainEqual(mediaSizeField)
    expect(DYNAMIC_FIELD_MAP['media-loop-item']).toContainEqual(mediaSizeField)
    expect(
      buildFieldSelectOptions(filterFieldsByKind(DYNAMIC_FIELD_MAP['media-detail'], ['text']))
        .map((field) => field.value)
    ).toContain('media.size')
    expect(
      buildFieldSelectOptions(filterFieldsByKind(DYNAMIC_FIELD_MAP['media-loop-item'], ['text']))
        .map((field) => field.value)
    ).toContain('media.size')
  })
})
