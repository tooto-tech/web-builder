import { getLoopItemType } from '@toototech/webbuilder-layout-template'

/**
 * 动态字段 / 动态循环的元数据配置。
 *
 * 目的：所有 `wb-cms-dynamic-*` 原子组件的 trait 下拉项全部来自这张表，
 * 不再让用户手写 `data-cms-bind="post.name"` 等属性。
 *
 * 如果要新增一个字段或新增一种模板上下文（例如媒体详情、产品详情），
 * 只需在这里补充一行即可，组件注册逻辑无需改动。
 */

/**
 * 动态字段作用的"页面模板上下文"。
 * 与 `config/templateSharedResources.ts` 的 TempTemplateResourceType 一一对应，
 * 但这里使用更短的 kebab-case 形式，方便在 custom 属性 / trait 内共用。
 */
export type DynamicContext =
  | 'post-detail'
  | 'media-detail'
  | 'product-detail'
  | 'post-loop-item'
  | 'media-loop-item'
  | 'product-loop-item'
  | 'post-category-item'
  | 'media-category-item'
  | 'product-category-item'
  | 'product-category-faq-loop-item'

/** 资源类型 → 动态字段上下文 */
export const RESOURCE_TYPE_TO_DYNAMIC_CONTEXT: Record<string, DynamicContext> = {
  TEMP_POST_DETAIL: 'post-detail',
  TEMP_POST_CATEGORY_LIST: 'post-category-item',
  TEMP_MEDIA_DETAIL: 'media-detail',
  TEMP_MEDIA_CATEGORY_LIST: 'media-category-item',
  TEMP_PRODUCT_DETAIL: 'product-detail',
  TEMP_PRODUCT_CATEGORY_LIST: 'product-category-item'
}

export const resolveDynamicContext = (
  resourceType?: string | null,
  extJson?: string | null
): DynamicContext | null => {
  const normalized = `${resourceType ?? ''}`.trim()
  if (normalized === 'TEMP_LOOP_ITEM') {
    switch (getLoopItemType(extJson)) {
      case 'post':
        return 'post-loop-item'
      case 'media':
        return 'media-loop-item'
      case 'product':
        return 'product-loop-item'
      case 'postCategory':
        return 'post-category-item'
      case 'mediaCategory':
        return 'media-category-item'
      case 'productCategory':
        return 'product-category-item'
      case 'productCategoryFaq':
        return 'product-category-faq-loop-item'
      default:
        return 'product-loop-item'
    }
  }
  return RESOURCE_TYPE_TO_DYNAMIC_CONTEXT[normalized] || null
}

/** 字段数据类型，用于过滤不同 block 可选字段（如图片 block 只能选 image） */
export type DynamicFieldKind =
  | 'text'
  | 'html'
  | 'datetime'
  | 'image'
  | 'url'
  | 'number'
  | 'bool'
  /**
   * 对象数组字段（如 `relatedPosts = [{id, name}]`）。
   * 动态文本 block 可通过 `dynListFormat` 下拉（bracket / comma / space / pipe / hashtag）
   * 决定如何把数组条目的 `name` 拼接成一段文字。
   */
  | 'list'

export interface DynamicFieldMeta {
  /** `data-cms-bind*` 使用的 key，例如 'post.name' */
  value: string
  /** 下拉显示文案 */
  label: string
  kind: DynamicFieldKind
  /** 是否从新增绑定的下拉中隐藏；保留元数据用于兼容历史模板 */
  hidden?: boolean
  /** datetime 字段的默认格式 */
  defaultFormat?: string
  /** 所属分组（下拉里的 optgroup 显示） */
  group?: string
}

export interface DynamicRepeatSource {
  /** 完整 `data-cms-repeat` 值，例如 'relatedPost@relatedPosts' */
  value: string
  /** 下拉显示文案 */
  label: string
  /** 父循环数据源；为空表示页面级循环 */
  parentSource?: string
  /** 条目别名（`xx@list` 中的 xx），子组件字段都以此为前缀 */
  itemAlias: string
  /** 循环作用域内可用的字段集合 */
  itemFields: DynamicFieldMeta[]
  /** 用于 SSG / 预览的集合字段名（`@` 右侧部分） */
  collection: string
}

const BREADCRUMB_REPEAT_SOURCE: DynamicRepeatSource = {
  value: 'breadcrumb@breadcrumbs',
  label: '面包屑导航',
  itemAlias: 'breadcrumb',
  collection: 'breadcrumbs',
  itemFields: [
    { value: 'breadcrumb.label', label: '面包屑-标题', kind: 'text' },
    { value: 'breadcrumb.url', label: '面包屑-URL', kind: 'url' },
    { value: 'breadcrumb.position', label: '面包屑-序号', kind: 'number' },
    { value: 'breadcrumb.isCurrent', label: '面包屑-当前项', kind: 'bool' },
    { value: 'breadcrumb.currentClass', label: '面包屑-当前项 class', kind: 'text' },
    { value: 'breadcrumb.ariaCurrent', label: '面包屑-aria-current', kind: 'text' }
  ]
}

/** 根据 data-cms-component / 运行环境的 detail key 归一，后续预览可按需扩展 */
export const CONTEXT_DETAIL_CMS_COMPONENT: Record<DynamicContext, string> = {
  'post-detail': 'post-detail',
  'media-detail': 'media-detail',
  'product-detail': 'product-detail',
  'post-loop-item': 'post-list',
  'media-loop-item': 'media-list',
  'product-loop-item': 'product-list',
  'post-category-item': 'post-list',
  'media-category-item': 'media-list',
  'product-category-item': 'product-list',
  'product-category-faq-loop-item': 'context-loop'
}

/* ───────────── 字段定义 ───────────── */

const POST_DETAIL_FIELDS: DynamicFieldMeta[] = [
  { value: 'post.id', label: '文章 ID', kind: 'number', group: '文章' },
  { value: 'post.name', label: '文章标题', kind: 'text', group: '文章' },
  { value: 'post.slug', label: '文章 Slug', kind: 'text', group: '文章' },
  { value: 'post.excerpt', label: '摘要', kind: 'text', group: '文章' },
  { value: 'post.content', label: '正文 HTML', kind: 'html', group: '文章' },
  {
    value: 'post.publishTime',
    label: '发布时间',
    kind: 'datetime',
    defaultFormat: 'yyyy-MM-dd',
    group: '文章'
  },
  { value: 'post.image', label: '封面图', kind: 'image', group: '文章' },
  { value: 'post.imageAlt', label: '封面图 alt', kind: 'text', group: '文章' },
  { value: 'post.coverWidth', label: '封面图宽度', kind: 'number', group: '文章' },
  { value: 'post.coverHeight', label: '封面图高度', kind: 'number', group: '文章' },
  { value: 'post.url', label: '文章 URL', kind: 'url', group: '文章' },
  { value: 'post.typeCode', label: '文章类型 Code', kind: 'text', group: '文章' },
  { value: 'post.typeName', label: '文章类型名称', kind: 'text', group: '文章' },
  { value: 'post.categoryIds', label: '分类 ID 列表', kind: 'list', group: '文章' },
  { value: 'post.categoryNames', label: '分类名称列表', kind: 'list', group: '文章' },
  { value: 'post.views', label: '浏览量', kind: 'number', group: '文章' },
  { value: 'post.author', label: '作者', kind: 'text', group: '文章' },
  { value: 'post.tagNames', label: '标签名称列表', kind: 'list', group: '文章' },
  { value: 'post.metaKeywords', label: 'SEO keywords', kind: 'text', group: 'SEO' },
  { value: 'post.metaDescription', label: 'SEO description', kind: 'text', group: 'SEO' },
  { value: 'prevPost.name', label: '上一篇标题', kind: 'text', group: '上下篇' },
  { value: 'prevPost.url', label: '上一篇 URL', kind: 'url', group: '上下篇' },
  { value: 'nextPost.name', label: '下一篇标题', kind: 'text', group: '上下篇' },
  { value: 'nextPost.url', label: '下一篇 URL', kind: 'url', group: '上下篇' }
]

const POST_DETAIL_REPEATS: DynamicRepeatSource[] = [
  BREADCRUMB_REPEAT_SOURCE,
  {
    value: 'tag@post.tags',
    label: '文章标签',
    itemAlias: 'tag',
    collection: 'post.tags',
    itemFields: [
      { value: 'tag.id', label: '标签-ID', kind: 'number' },
      { value: 'tag.name', label: '标签-名称', kind: 'text' }
    ]
  },
  {
    value: 'tocItem@tocItems',
    label: '文章目录（TOC）',
    itemAlias: 'tocItem',
    collection: 'tocItems',
    itemFields: [
      { value: 'tocItem.text', label: '章节标题', kind: 'text' },
      { value: 'tocItem.href', label: '章节锚点 URL', kind: 'url' },
      { value: 'tocItem.level', label: '章节层级', kind: 'number' }
    ]
  },
  {
    value: 'relatedPost@relatedPosts',
    label: '相关文章',
    itemAlias: 'relatedPost',
    collection: 'relatedPosts',
    itemFields: [
      { value: 'relatedPost.name', label: '相关-标题', kind: 'text' },
      { value: 'relatedPost.excerpt', label: '相关-摘要', kind: 'text' },
      {
        value: 'relatedPost.publishTime',
        label: '相关-发布时间',
        kind: 'datetime',
        defaultFormat: 'yyyy-MM-dd'
      },
      { value: 'relatedPost.image', label: '相关-封面图', kind: 'image' },
      { value: 'relatedPost.imageAlt', label: '相关-封面 alt', kind: 'text' },
      { value: 'relatedPost.url', label: '相关-URL', kind: 'url' }
    ]
  }
]

/* ───────────── 媒体详情（media-detail） ─────────────
 * 字段命名与 `useCmsLivePreview.ts` 的 `technical-support-detail` / `media-list`
 * transformItem 保持一致，模板里的实际键名是 `media.title` / `media.coverUrl` / `media.detailUrl`
 * （而非 `media.name` / `media.image` / `media.url`），这里按实际数据流命名。
 */

const MEDIA_DETAIL_FIELDS: DynamicFieldMeta[] = [
  { value: 'media.id', label: '媒体 ID', kind: 'number', group: '媒体' },
  { value: 'media.title', label: '媒体标题', kind: 'text', group: '媒体' },
  { value: 'media.description', label: '媒体描述', kind: 'text', group: '媒体' },
  { value: 'media.slug', label: '媒体 Slug', kind: 'text', group: '媒体' },
  { value: 'media.type', label: '媒体类型', kind: 'text', group: '媒体' },
  { value: 'media.url', label: '原始资源 URL', kind: 'url', group: '媒体' },
  { value: 'media.size', label: '媒体大小', kind: 'text', group: '媒体' },
  { value: 'media.coverUrl', label: '封面图', kind: 'image', group: '媒体' },
  { value: 'media.altText', label: '封面图 alt', kind: 'text', group: '媒体' },
  { value: 'media.categoryCode', label: '媒体分类 Code', kind: 'text', group: '媒体' },
  { value: 'media.detailUrl', label: '媒体详情 URL', kind: 'url', group: '媒体' },
  {
    value: 'media.publishTime',
    label: '发布时间',
    kind: 'datetime',
    defaultFormat: 'yyyy-MM-dd',
    group: '媒体'
  },
  { value: 'media.seoTitle', label: 'SEO 标题', kind: 'text', group: 'SEO' },
  { value: 'media.seoDescription', label: 'SEO description', kind: 'text', group: 'SEO' },
  { value: 'media.seoKeywords', label: 'SEO keywords', kind: 'text', group: 'SEO' }
]

const MEDIA_DETAIL_REPEATS: DynamicRepeatSource[] = [
  BREADCRUMB_REPEAT_SOURCE,
  {
    value: 'item@media.items',
    label: '媒体附件项',
    itemAlias: 'item',
    collection: 'media.items',
    itemFields: [{ value: 'item.url', label: '附件图片 URL', kind: 'image' }]
  }
]

/* ───────────── 产品详情（product-detail） ─────────────
 * 字段命名与 `useCmsLivePreview.ts` 的 `product-detail` transformItem 以及
 * `product/detail.schema.ts` / `product/detailV2.schema.ts` 中实际写入的
 * `data-cms-bind*` 保持一致（例如 `product.picUrl` 而非 `product.image`，
 * `product.priceFormatted` 而非 `product.price`）。
 */

const PRODUCT_DETAIL_FIELDS: DynamicFieldMeta[] = [
  { value: 'product.id', label: '产品 ID', kind: 'number', group: '产品' },
  { value: 'product.name', label: '产品名称', kind: 'text', group: '产品' },
  { value: 'product.slug', label: '产品 Slug', kind: 'text', group: '产品' },
  { value: 'product.brandName', label: '品牌', kind: 'text', group: '产品' },
  { value: 'product.categoryName', label: '产品分类名称', kind: 'text', group: '产品' },
  { value: 'product.introduction', label: '简介（纯文本）', kind: 'text', group: '产品' },
  { value: 'product.featuresText', label: 'Features / 产品特性', kind: 'text', group: '产品' },
  { value: 'product.keyword', label: '产品关键字', kind: 'text', group: '产品' },
  { value: 'product.description', label: '详细描述（HTML）', kind: 'html', group: '产品' },
  { value: 'product.picUrl', label: '主图', kind: 'image', group: '产品' },
  { value: 'product.price', label: '价格（分）', kind: 'number', group: '产品' },
  { value: 'product.marketPrice', label: '市场价（分）', kind: 'number', group: '产品' },
  { value: 'product.priceFormatted', label: '格式化价格', kind: 'text', group: '产品' },
  { value: 'product.stock', label: '库存', kind: 'number', group: '产品' },
  { value: 'product.salesCount', label: '销量', kind: 'number', group: '产品' },
  { value: 'product.url', label: '产品详情 URL', kind: 'url', group: '产品' },
  { value: 'product.buyNowUrl', label: '立即购买 URL', kind: 'url', group: '产品' },
  { value: 'product.buyNowTarget', label: '立即购买 target', kind: 'text', group: '产品' },
  { value: 'product.datasheetDesignation', label: 'Datasheet 型号', kind: 'text', group: '产品' }
]

const PRODUCT_DETAIL_REPEATS: DynamicRepeatSource[] = [
  BREADCRUMB_REPEAT_SOURCE,
  {
    value: 'pic@product.sliderPicUrls',
    label: '产品轮播图',
    itemAlias: 'pic',
    collection: 'product.sliderPicUrls',
    itemFields: [
      // 裸字符串数组，条目本身就是 URL
      { value: 'pic', label: '轮播图片 URL', kind: 'image' }
    ]
  },
  {
    value: 'sku@product.skus',
    label: 'SKU 列表',
    itemAlias: 'sku',
    collection: 'product.skus',
    itemFields: [
      { value: 'sku.name', label: 'SKU-名称', kind: 'text' },
      { value: 'sku.price', label: 'SKU-格式化价格', kind: 'text' }
    ]
  },
  {
    value: 'doc@product.documents',
    label: '产品文档',
    itemAlias: 'doc',
    collection: 'product.documents',
    itemFields: [
      { value: 'doc.name', label: '文档-文件名', kind: 'text' },
      { value: 'doc.url', label: '文档-下载 URL', kind: 'url' }
    ]
  },
  {
    value: 'feature@product.features',
    label: '产品特性',
    itemAlias: 'feature',
    collection: 'product.features',
    itemFields: [{ value: 'feature.text', label: '特性-文本', kind: 'text' }]
  },
  {
    value: 'spec@product.specifications',
    label: '产品规格',
    itemAlias: 'spec',
    collection: 'product.specifications',
    itemFields: [
      { value: 'spec.code', label: '规格-Code', kind: 'text' },
      { value: 'spec.name', label: '规格-名称', kind: 'text' },
      { value: 'spec.label', label: '规格-标签', kind: 'text' },
      { value: 'spec.value', label: '规格-值', kind: 'text' },
      { value: 'spec.valueHtml', label: '规格-值（HTML）', kind: 'html' },
      { value: 'spec.groupName', label: '规格-分组', kind: 'text' },
      { value: 'spec.groupCode', label: '规格分组-Code', kind: 'text' },
      { value: 'spec.unit', label: '规格-单位', kind: 'text' },
      { value: 'spec.valueType', label: '规格-值类型', kind: 'text' }
    ]
  },
  {
    value: 'specGroup@product.specGroups',
    label: '产品规格分组',
    itemAlias: 'specGroup',
    collection: 'product.specGroups',
    itemFields: [
      { value: 'specGroup.name', label: '规格分组-名称', kind: 'text' },
      { value: 'specGroup.code', label: '规格分组-Code', kind: 'text' },
      { value: 'specGroup.sort', label: '规格分组-排序', kind: 'number' }
    ]
  },
  {
    value: 'spec@specGroup.specifications',
    label: '当前规格分组内规格',
    parentSource: 'specGroup@product.specGroups',
    itemAlias: 'spec',
    collection: 'specGroup.specifications',
    itemFields: [
      { value: 'spec.code', label: '规格-Code', kind: 'text' },
      { value: 'spec.name', label: '规格-名称', kind: 'text' },
      { value: 'spec.label', label: '规格-标签', kind: 'text' },
      { value: 'spec.value', label: '规格-值', kind: 'text' },
      { value: 'spec.valueHtml', label: '规格-值（HTML）', kind: 'html' },
      { value: 'spec.groupName', label: '规格-分组', kind: 'text' },
      { value: 'spec.groupCode', label: '规格分组-Code', kind: 'text' },
      { value: 'spec.unit', label: '规格-单位', kind: 'text' },
      { value: 'spec.valueType', label: '规格-值类型', kind: 'text' }
    ]
  },
  {
    value: 'faq@product.faqs',
    label: '常见问答',
    itemAlias: 'faq',
    collection: 'product.faqs',
    itemFields: [
      { value: 'faq.question', label: '问答-问题', kind: 'text' },
      { value: 'faq.answerHtml', label: '问答-答案（HTML）', kind: 'html' }
    ]
  },
  {
    value: 'prop@product.propertyOptions',
    label: '属性选项',
    itemAlias: 'prop',
    collection: 'product.propertyOptions',
    itemFields: [
      { value: 'prop.propertyName', label: '属性-名称', kind: 'text' },
      { value: 'prop.displayType', label: '属性-展示类型', kind: 'text' }
    ]
  },
  {
    value: 'value@prop.values',
    label: '属性选项值（嵌套在属性选项内）',
    parentSource: 'prop@product.propertyOptions',
    itemAlias: 'value',
    collection: 'prop.values',
    itemFields: [
      { value: 'value.valueName', label: '选项-名称', kind: 'text' },
      { value: 'value.imageUrl', label: '选项-图片 URL', kind: 'image' },
      { value: 'value.colorStyle', label: '选项-颜色 style', kind: 'text' },
      { value: 'value.colorCode', label: '选项-颜色值', kind: 'text' }
    ]
  },
  {
    value: 'related@product.relatedProducts',
    label: '相关产品',
    itemAlias: 'related',
    collection: 'product.relatedProducts',
    itemFields: [
      { value: 'related.name', label: '相关-产品名', kind: 'text' },
      { value: 'related.introduction', label: '相关-简介', kind: 'text' },
      { value: 'related.picUrl', label: '相关-主图', kind: 'image' },
      { value: 'related.url', label: '相关-URL', kind: 'url' }
    ]
  },
  {
    value: 'popular@product.popularModels',
    label: 'Popular Models',
    itemAlias: 'popular',
    collection: 'product.popularModels',
    itemFields: [
      { value: 'popular.name', label: 'Popular-产品名', kind: 'text' },
      { value: 'popular.introduction', label: 'Popular-简介', kind: 'text' },
      { value: 'popular.picUrl', label: 'Popular-主图', kind: 'image' },
      { value: 'popular.url', label: 'Popular-URL', kind: 'url' }
    ]
  }
]

const POST_LOOP_ITEM_FIELDS: DynamicFieldMeta[] = [
  { value: 'post.id', label: '文章 ID', kind: 'number', group: '文章' },
  { value: 'post.name', label: '文章标题', kind: 'text', group: '文章' },
  { value: 'post.slug', label: '文章 Slug', kind: 'text', group: '文章' },
  { value: 'post.excerpt', label: '摘要', kind: 'text', group: '文章' },
  { value: 'post.content', label: '正文 HTML', kind: 'html', group: '文章' },
  {
    value: 'post.publishTime',
    label: '发布时间',
    kind: 'datetime',
    defaultFormat: 'yyyy-MM-dd',
    group: '文章'
  },
  { value: 'post.image', label: '封面图', kind: 'image', group: '文章' },
  { value: 'post.imageAlt', label: '封面图 alt', kind: 'text', group: '文章' },
  { value: 'post.coverWidth', label: '封面图宽度', kind: 'number', group: '文章' },
  { value: 'post.coverHeight', label: '封面图高度', kind: 'number', group: '文章' },
  { value: 'post.url', label: '文章 URL', kind: 'url', group: '文章' },
  { value: 'post.typeCode', label: '文章类型 Code', kind: 'text', group: '文章' },
  { value: 'post.typeName', label: '文章类型名称', kind: 'text', group: '文章' },
  { value: 'post.categoryIds', label: '分类 ID 列表', kind: 'list', group: '文章' },
  { value: 'post.categoryNames', label: '分类名称列表', kind: 'list', group: '文章' },
  { value: 'post.tagIds', label: '标签 ID 列表', kind: 'list', group: '文章' },
  { value: 'post.tagNames', label: '标签名称列表', kind: 'list', group: '文章' },
  { value: 'post.views', label: '浏览量', kind: 'number', group: '文章' },
  { value: 'post.author', label: '作者', kind: 'text', group: '文章' },
  { value: 'post.metaKeywords', label: 'SEO keywords', kind: 'text', group: 'SEO' },
  { value: 'post.metaDescription', label: 'SEO description', kind: 'text', group: 'SEO' }
]

const MEDIA_LOOP_ITEM_FIELDS: DynamicFieldMeta[] = [
  { value: 'media.id', label: '媒体 ID', kind: 'number', group: '媒体' },
  { value: 'media.title', label: '媒体标题', kind: 'text', group: '媒体' },
  { value: 'media.description', label: '媒体描述', kind: 'text', group: '媒体' },
  { value: 'media.slug', label: '媒体 Slug', kind: 'text', group: '媒体' },
  { value: 'media.type', label: '媒体类型', kind: 'text', group: '媒体' },
  { value: 'media.url', label: '原始资源 URL', kind: 'url', group: '媒体' },
  { value: 'media.size', label: '媒体大小', kind: 'text', group: '媒体' },
  { value: 'media.coverUrl', label: '封面图', kind: 'image', group: '媒体' },
  { value: 'media.altText', label: '封面图 alt', kind: 'text', group: '媒体' },
  { value: 'media.categoryCode', label: '媒体分类 Code', kind: 'text', group: '媒体' },
  { value: 'media.detailUrl', label: '媒体详情 URL', kind: 'url', group: '媒体' },
  {
    value: 'media.publishTime',
    label: '发布时间',
    kind: 'datetime',
    defaultFormat: 'yyyy-MM-dd',
    group: '媒体'
  },
  { value: 'media.seoTitle', label: 'SEO 标题', kind: 'text', group: 'SEO' },
  { value: 'media.seoDescription', label: 'SEO description', kind: 'text', group: 'SEO' },
  { value: 'media.seoKeywords', label: 'SEO keywords', kind: 'text', group: 'SEO' }
]

const PRODUCT_LOOP_ITEM_FIELDS: DynamicFieldMeta[] = [
  { value: 'product.id', label: '产品 ID', kind: 'number', group: '产品' },
  { value: 'product.name', label: '产品名称', kind: 'text', group: '产品' },
  { value: 'product.slug', label: '产品 Slug', kind: 'text', group: '产品' },
  { value: 'product.brandName', label: '品牌', kind: 'text', group: '产品' },
  { value: 'product.categoryName', label: '产品分类名称', kind: 'text', group: '产品' },
  { value: 'product.introduction', label: '简介（纯文本）', kind: 'text', group: '产品' },
  { value: 'product.keyword', label: '产品关键字', kind: 'text', group: '产品' },
  { value: 'product.description', label: '详细描述（HTML）', kind: 'html', group: '产品' },
  { value: 'product.picUrl', label: '主图', kind: 'image', group: '产品' },
  { value: 'product.price', label: '价格（分）', kind: 'number', group: '产品' },
  { value: 'product.marketPrice', label: '市场价（分）', kind: 'number', group: '产品' },
  { value: 'product.priceFormatted', label: '格式化价格', kind: 'text', group: '产品' },
  { value: 'product.stock', label: '库存', kind: 'number', group: '产品' },
  { value: 'product.salesCount', label: '销量', kind: 'number', group: '产品' },
  { value: 'product.url', label: '产品详情 URL', kind: 'url', group: '产品' },
  { value: 'product.buyNowUrl', label: '立即购买 URL', kind: 'url', group: '产品' },
  { value: 'product.buyNowTarget', label: '立即购买 target', kind: 'text', group: '产品' },
  { value: 'product.datasheetDesignation', label: 'Datasheet 型号', kind: 'text', group: '产品' }
]

const POST_CATEGORY_FIELDS: DynamicFieldMeta[] = [
  { value: 'postCategory.id', label: '文章分类 ID', kind: 'number', group: '文章分类' },
  { value: 'postCategory.parentId', label: '父级分类 ID', kind: 'number', group: '文章分类' },
  { value: 'postCategory.code', label: '文章分类 Code', kind: 'text', group: '文章分类' },
  { value: 'postCategory.name', label: '文章分类名称', kind: 'text', group: '文章分类' },
  { value: 'postCategory.description', label: '文章分类描述', kind: 'text', group: '文章分类' },
  { value: 'postCategory.url', label: '文章分类 URL', kind: 'url', group: '文章分类' },
  { value: 'postCategory.clickTarget', label: '点击目标', kind: 'text', group: '文章分类' }
]

const MEDIA_CATEGORY_FIELDS: DynamicFieldMeta[] = [
  { value: 'mediaCategory.id', label: '媒体分类 ID', kind: 'number', group: '媒体分类' },
  { value: 'mediaCategory.code', label: '媒体分类 Code', kind: 'text', group: '媒体分类' },
  { value: 'mediaCategory.name', label: '媒体分类名称', kind: 'text', group: '媒体分类' },
  { value: 'mediaCategory.description', label: '媒体分类描述', kind: 'text', group: '媒体分类' },
  { value: 'mediaCategory.url', label: '媒体分类 URL', kind: 'url', group: '媒体分类' },
  { value: 'mediaCategory.clickTarget', label: '点击目标', kind: 'text', group: '媒体分类' }
]

const PRODUCT_CATEGORY_FIELDS: DynamicFieldMeta[] = [
  { value: 'productCategory.id', label: '产品分类 ID', kind: 'number', group: '产品分类' },
  { value: 'productCategory.parentId', label: '父级分类 ID', kind: 'number', group: '产品分类' },
  { value: 'productCategory.code', label: '产品分类 Code', kind: 'text', group: '产品分类' },
  { value: 'productCategory.name', label: '产品分类名称', kind: 'text', group: '产品分类' },
  { value: 'productCategory.description', label: '产品分类描述', kind: 'text', group: '产品分类' },
  { value: 'productCategory.features', label: '产品分类特性（旧文本字段）', kind: 'text', group: '产品分类', hidden: true },
  { value: 'productCategory.featuresHtml', label: '产品分类特性（换行）', kind: 'html', group: '产品分类' },
  { value: 'productCategory.image', label: '产品分类图片', kind: 'image', group: '产品分类' },
  { value: 'productCategory.picUrl', label: '产品分类图片 URL', kind: 'image', group: '产品分类' },
  { value: 'productCategory.url', label: '产品分类 URL', kind: 'url', group: '产品分类' },
  { value: 'productCategory.productCount', label: '产品数量', kind: 'number', group: '产品分类' },
  {
    value: 'productCategory.faqCategoryId',
    label: 'FAQ 分类 ID',
    kind: 'number',
    group: '产品分类'
  },
  { value: 'productCategory.clickTarget', label: '点击目标', kind: 'text', group: '产品分类' }
]

const createCategoryPostFields = (alias: string, labelPrefix: string): DynamicFieldMeta[] => [
  { value: `${alias}.id`, label: `${labelPrefix}-文章 ID`, kind: 'number' },
  { value: `${alias}.name`, label: `${labelPrefix}-标题`, kind: 'text' },
  { value: `${alias}.slug`, label: `${labelPrefix}-Slug`, kind: 'text' },
  { value: `${alias}.excerpt`, label: `${labelPrefix}-摘要`, kind: 'text' },
  {
    value: `${alias}.publishTime`,
    label: `${labelPrefix}-发布时间`,
    kind: 'datetime',
    defaultFormat: 'yyyy-MM-dd'
  },
  { value: `${alias}.image`, label: `${labelPrefix}-封面图`, kind: 'image' },
  { value: `${alias}.imageAlt`, label: `${labelPrefix}-封面 alt`, kind: 'text' },
  { value: `${alias}.url`, label: `${labelPrefix}-URL`, kind: 'url' },
  { value: `${alias}.typeCode`, label: `${labelPrefix}-类型 Code`, kind: 'text' },
  { value: `${alias}.typeName`, label: `${labelPrefix}-类型名称`, kind: 'text' }
]

const PRODUCT_CATEGORY_FAQ_FIELDS: DynamicFieldMeta[] = [
  { value: 'faq.id', label: 'FAQ-ID', kind: 'number' },
  { value: 'faq.question', label: 'FAQ-问题', kind: 'text' },
  { value: 'faq.answer', label: 'FAQ-答案', kind: 'text' },
  { value: 'faq.answerHtml', label: 'FAQ-答案（HTML）', kind: 'html' }
]

const PRODUCT_CATEGORY_APPLICATION_POST_FIELDS = createCategoryPostFields(
  'applicationPost',
  'Application'
)
const PRODUCT_CATEGORY_ENGINEERING_POST_FIELDS = createCategoryPostFields(
  'engineeringPost',
  'Engineering'
)
const PRODUCT_CATEGORY_CHALLENGE_POST_FIELDS = createCategoryPostFields(
  'challengePost',
  'Challenges'
)

const PRODUCT_CATEGORY_REPEATS: DynamicRepeatSource[] = [
  BREADCRUMB_REPEAT_SOURCE,
  {
    value: 'field@datasheetFields',
    label: 'Datasheet 字段表头',
    itemAlias: 'field',
    collection: 'datasheetFields',
    itemFields: [
      { value: 'field.code', label: '字段-Code', kind: 'text' },
      { value: 'field.label', label: '字段名', kind: 'text' },
      { value: 'field.unit', label: '单位', kind: 'text' },
      { value: 'field.valueType', label: '字段类型', kind: 'text' }
    ]
  },
  {
    value: 'product@products',
    label: '分类产品列表',
    itemAlias: 'product',
    collection: 'products',
    itemFields: PRODUCT_LOOP_ITEM_FIELDS
  },
  {
    value: 'cell@product.datasheetCells',
    label: '产品 Datasheet 单元格',
    parentSource: 'product@products',
    itemAlias: 'cell',
    collection: 'product.datasheetCells',
    itemFields: [
      { value: 'cell.code', label: '单元格-Code', kind: 'text' },
      { value: 'cell.label', label: '单元格-字段名', kind: 'text' },
      { value: 'cell.value', label: '单元格-值', kind: 'text' },
      { value: 'cell.valueHtml', label: '单元格-值（HTML）', kind: 'html' },
      { value: 'cell.unit', label: '单元格-单位', kind: 'text' },
      { value: 'cell.valueType', label: '单元格-类型', kind: 'text' }
    ]
  },
  {
    value: 'faq@productCategory.faqs',
    label: '分类 FAQ',
    itemAlias: 'faq',
    collection: 'productCategory.faqs',
    itemFields: PRODUCT_CATEGORY_FAQ_FIELDS
  },
  {
    value: 'applicationPost@productCategory.applicationPosts',
    label: 'Application 文章',
    itemAlias: 'applicationPost',
    collection: 'productCategory.applicationPosts',
    itemFields: PRODUCT_CATEGORY_APPLICATION_POST_FIELDS
  },
  {
    value: 'engineeringPost@productCategory.engineeringPosts',
    label: 'Engineering 文章',
    itemAlias: 'engineeringPost',
    collection: 'productCategory.engineeringPosts',
    itemFields: PRODUCT_CATEGORY_ENGINEERING_POST_FIELDS
  },
  {
    value: 'challengePost@productCategory.challengePosts',
    label: 'Challenges 文章',
    itemAlias: 'challengePost',
    collection: 'productCategory.challengePosts',
    itemFields: PRODUCT_CATEGORY_CHALLENGE_POST_FIELDS
  },
  {
    value: 'popular@productCategory.popularModels',
    label: 'Popular Models',
    itemAlias: 'popular',
    collection: 'productCategory.popularModels',
    itemFields: [
      { value: 'popular.name', label: 'Popular-产品名', kind: 'text' },
      { value: 'popular.introduction', label: 'Popular-简介', kind: 'text' },
      { value: 'popular.picUrl', label: 'Popular-主图', kind: 'image' },
      { value: 'popular.url', label: 'Popular-URL', kind: 'url' }
    ]
  }
]

/* ───────────── 汇总表（后续扩展在此追加） ───────────── */

export const DYNAMIC_FIELD_MAP: Record<DynamicContext, DynamicFieldMeta[]> = {
  'post-detail': POST_DETAIL_FIELDS,
  'media-detail': MEDIA_DETAIL_FIELDS,
  'product-detail': PRODUCT_DETAIL_FIELDS,
  'post-loop-item': POST_LOOP_ITEM_FIELDS,
  'media-loop-item': MEDIA_LOOP_ITEM_FIELDS,
  'product-loop-item': PRODUCT_LOOP_ITEM_FIELDS,
  'post-category-item': POST_CATEGORY_FIELDS,
  'media-category-item': MEDIA_CATEGORY_FIELDS,
  'product-category-item': PRODUCT_CATEGORY_FIELDS,
  'product-category-faq-loop-item': PRODUCT_CATEGORY_FAQ_FIELDS
}

export const DYNAMIC_REPEAT_MAP: Record<DynamicContext, DynamicRepeatSource[]> = {
  'post-detail': POST_DETAIL_REPEATS,
  'media-detail': MEDIA_DETAIL_REPEATS,
  'product-detail': PRODUCT_DETAIL_REPEATS,
  'post-loop-item': [],
  'media-loop-item': [],
  'product-loop-item': [],
  'post-category-item': [BREADCRUMB_REPEAT_SOURCE],
  'media-category-item': [BREADCRUMB_REPEAT_SOURCE],
  'product-category-item': PRODUCT_CATEGORY_REPEATS,
  'product-category-faq-loop-item': []
}

/**
 * 在注册组件时，默认以 post-detail 为"展示字段"，
 * 后续用户打开其他模板（媒体/产品）时可通过 `wbTemplateContext` 识别切换。
 */
export const DEFAULT_DYNAMIC_CONTEXT: DynamicContext = 'post-detail'

/* ───────────── 字段查询工具 ───────────── */

const ALL_FIELDS: DynamicFieldMeta[] = Object.values(DYNAMIC_FIELD_MAP).flat()
const ALL_REPEAT_ITEM_FIELDS: DynamicFieldMeta[] = Object.values(DYNAMIC_REPEAT_MAP)
  .flat()
  .flatMap((source) => source.itemFields)

export const findFieldMeta = (fieldValue: string | undefined | null): DynamicFieldMeta | null => {
  const normalized = `${fieldValue ?? ''}`.trim()
  if (!normalized) return null
  return (
    ALL_FIELDS.find((f) => f.value === normalized) ||
    ALL_REPEAT_ITEM_FIELDS.find((f) => f.value === normalized) ||
    null
  )
}

export const findRepeatSource = (
  context: DynamicContext,
  sourceValue: string | undefined | null
): DynamicRepeatSource | null => {
  const normalized = `${sourceValue ?? ''}`.trim()
  if (!normalized) return null
  return (DYNAMIC_REPEAT_MAP[context] || []).find((s) => s.value === normalized) || null
}

/** 拿到当前上下文"页面作用域"的字段（不含 repeat 内的 item 字段） */
export const getPageLevelFields = (context: DynamicContext): DynamicFieldMeta[] => {
  return DYNAMIC_FIELD_MAP[context] || []
}

/** 拿到当前上下文所有 repeat item 字段（合集，不区分来源） */
export const getAllRepeatItemFields = (context: DynamicContext): DynamicFieldMeta[] => {
  return (DYNAMIC_REPEAT_MAP[context] || []).flatMap((source) => source.itemFields)
}

/** 构建 GrapesJS select trait 的 options（`{ value, label }`），按 group 分组前缀 */
export const buildFieldSelectOptions = (
  fields: DynamicFieldMeta[],
  options?: { includeEmpty?: boolean; emptyLabel?: string; emptyValue?: string }
): Array<{ value: string; label: string }> => {
  const result: Array<{ value: string; label: string }> = []
  if (options?.includeEmpty) {
    result.push({ value: options.emptyValue ?? '', label: options.emptyLabel ?? '—（不绑定）' })
  }
  fields.forEach((field) => {
    if (field.hidden) return
    const prefix = field.group ? `[${field.group}] ` : ''
    result.push({ value: field.value, label: `${prefix}${field.label}` })
  })
  return result
}

export const filterFieldsByKind = (
  fields: DynamicFieldMeta[],
  kinds: DynamicFieldKind[]
): DynamicFieldMeta[] => {
  if (!kinds || kinds.length === 0) return fields
  const set = new Set<DynamicFieldKind>(kinds)
  return fields.filter((field) => set.has(field.kind))
}
