/** 动态字段 / 循环 block 的 GrapesJS 组件类型常量 */
export const WB_CMS_DYN_TEXT_TYPE = 'wb-cms-dynamic-text'
export const WB_CMS_DYN_HTML_TYPE = 'wb-cms-dynamic-html'
export const WB_CMS_DYN_IMAGE_TYPE = 'wb-cms-dynamic-image'
export const WB_CMS_DYN_LINK_TYPE = 'wb-cms-dynamic-link'
export const WB_CMS_DYN_DATETIME_TYPE = 'wb-cms-dynamic-datetime'
export const WB_CMS_DYN_IF_TYPE = 'wb-cms-dynamic-if'
export const WB_CMS_DYN_REPEAT_TYPE = 'wb-cms-dynamic-repeat'
export const WB_CMS_DYN_REPEAT_ITEM_TYPE = 'wb-cms-dynamic-repeat-item'
export const WB_CMS_DYN_SEO_TYPE = 'wb-cms-dynamic-seo'
export const WB_CMS_DYN_TOC_TYPE = 'wb-cms-dynamic-toc'
export const WB_CMS_DYN_BREADCRUMB_TYPE = 'wb-cms-dynamic-breadcrumb'

/** 所有动态字段组件类型的集合，供外部识别 */
export const WB_CMS_DYNAMIC_FIELD_TYPES = [
  WB_CMS_DYN_TEXT_TYPE,
  WB_CMS_DYN_HTML_TYPE,
  WB_CMS_DYN_IMAGE_TYPE,
  WB_CMS_DYN_LINK_TYPE,
  WB_CMS_DYN_DATETIME_TYPE,
  WB_CMS_DYN_IF_TYPE,
  WB_CMS_DYN_REPEAT_TYPE,
  WB_CMS_DYN_SEO_TYPE,
  WB_CMS_DYN_TOC_TYPE,
  WB_CMS_DYN_BREADCRUMB_TYPE,
] as const

export type WbCmsDynamicFieldType = (typeof WB_CMS_DYNAMIC_FIELD_TYPES)[number]

/** 组件共享的 data-wb-dynamic 标记，便于预览/发布识别 */
export const WB_DYN_MARK_ATTR = 'data-wb-dynamic'
/** 页面 custom 下存储"当前页动态字段上下文"的 key */
export const WB_TEMPLATE_CONTEXT_KEY = 'wbTemplateContext'
