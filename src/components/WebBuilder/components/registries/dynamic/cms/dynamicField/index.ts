/**
 * 动态字段 / 动态循环 block 的统一注册入口。
 *
 * 这组组件对标 Elementor Pro 的 Dynamic Tags 能力：
 *   - 用户只需把 block 拖进画布，然后在右侧 traits 选择要绑定的字段；
 *   - 不再需要手动填写 `data-cms-bind="post.name"` 等自定义属性；
 *   - block 会自动根据"是否在 repeat 内"和"当前页面模板上下文"，
 *     切换可选字段集合。
 */
import { injectStyleOnce } from '../../../../../utils/injectStyle'
import {
  WB_CMS_DYN_DATETIME_TYPE,
  WB_CMS_DYN_HTML_TYPE,
  WB_CMS_DYN_IF_TYPE,
  WB_CMS_DYN_IMAGE_TYPE,
  WB_CMS_DYN_LINK_TYPE,
  WB_CMS_DYN_REPEAT_TYPE,
  WB_CMS_DYN_SEO_TYPE,
  WB_CMS_DYN_TEXT_TYPE,
  WB_CMS_DYN_TOC_TYPE,
  WB_CMS_DYN_BREADCRUMB_TYPE,
} from './constants'
import { registerDynamicBreadcrumbBlock } from './blocks/breadcrumbBlock'
import { registerDynamicConditionalBlock } from './blocks/conditionalBlock'
import { registerDynamicDatetimeBlock } from './blocks/datetimeBlock'
import { registerDynamicHtmlBlock } from './blocks/htmlBlock'
import { registerDynamicImageBlock } from './blocks/imageBlock'
import { registerDynamicLinkBlock } from './blocks/linkBlock'
import { registerDynamicRepeatBlock } from './blocks/repeatBlock'
import { registerDynamicSeoBlock } from './blocks/seoBlock'
import { registerDynamicTextBlock } from './blocks/textBlock'
import { registerDynamicTocBlock } from './blocks/tocBlock'
import type { DynamicContext } from './bindings'
import { DYNAMIC_FIELD_STYLES, DYNAMIC_FIELD_STYLE_KEY } from './styles'

export interface DynamicBlockDescriptor {
  /** GrapesJS 组件类型（也作为 Block id 使用） */
  type: string
  /** Block 面板标题 */
  label: string
  /** Block 子分组：'dynamic-field' / 'dynamic-loop' */
  group: 'dynamic-field' | 'dynamic-loop'
  /** 只在这些上下文下出现在面板；空数组表示任何动态模板都可用 */
  contexts: DynamicContext[]
  /** 媒体图标（SVG / Material 图标） */
  media: string
  /** 一句话描述 */
  description: string
}

const ICON = (body: string) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

export const DYNAMIC_FIELD_BLOCK_DESCRIPTORS: DynamicBlockDescriptor[] = [
  {
    type: WB_CMS_DYN_TEXT_TYPE,
    label: '动态文本',
    group: 'dynamic-field',
    contexts: ['post-detail', 'media-detail', 'product-detail'],
    media: ICON('<path d="M5 6h14M5 12h14M5 18h10"/>'),
    description: '绑定任意文本字段，自动带 data-cms-bind',
  },
  {
    type: WB_CMS_DYN_HTML_TYPE,
    label: '动态 HTML',
    group: 'dynamic-field',
    contexts: ['post-detail', 'media-detail', 'product-detail'],
    media: ICON('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 10l-2 2 2 2M16 10l2 2-2 2M13 9l-2 6"/>'),
    description: '绑定富文本字段（正文 HTML 等）',
  },
  {
    type: WB_CMS_DYN_IMAGE_TYPE,
    label: '动态图片',
    group: 'dynamic-field',
    contexts: ['post-detail', 'media-detail', 'product-detail'],
    media: ICON('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>'),
    description: '绑定图片字段，自动生成 <img>',
  },
  {
    type: WB_CMS_DYN_LINK_TYPE,
    label: '动态链接',
    group: 'dynamic-field',
    contexts: ['post-detail', 'media-detail', 'product-detail'],
    media: ICON('<path d="M10 14l-3 3a3 3 0 1 1-4-4l3-3M14 10l3-3a3 3 0 1 1 4 4l-3 3M8 16l8-8"/>'),
    description: '绑定链接字段，支持子组件作为文字',
  },
  {
    type: WB_CMS_DYN_DATETIME_TYPE,
    label: '动态日期',
    group: 'dynamic-field',
    contexts: ['post-detail', 'media-detail', 'product-detail'],
    media: ICON('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
    description: '绑定日期字段，可自定义格式',
  },
  {
    type: WB_CMS_DYN_IF_TYPE,
    label: '条件显示',
    group: 'dynamic-field',
    contexts: ['post-detail', 'media-detail', 'product-detail'],
    media: ICON('<path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/>'),
    description: '根据字段是否有值控制显隐',
  },
  {
    type: WB_CMS_DYN_REPEAT_TYPE,
    label: '动态循环',
    group: 'dynamic-loop',
    contexts: ['post-detail', 'media-detail', 'product-detail', 'product-category-item'],
    media: ICON('<path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13"/>'),
    description: '循环一组数据，内部可嵌入动态字段',
  },
  {
    type: WB_CMS_DYN_BREADCRUMB_TYPE,
    label: '面包屑导航',
    group: 'dynamic-field',
    contexts: [
      'post-detail',
      'media-detail',
      'product-detail',
      'post-category-item',
      'media-category-item',
      'product-category-item'
    ],
    media: ICON('<path d="M4 12h4"/><path d="M10 6l6 6-6 6"/><path d="M16 12h4"/>'),
    description: '根据当前页面数据生成 Home / 父级 / 当前页',
  },
  {
    type: WB_CMS_DYN_TOC_TYPE,
    label: '文章目录',
    group: 'dynamic-field',
    contexts: ['post-detail'],
    media: ICON('<path d="M4 6h12M4 12h12M4 18h8"/><circle cx="19" cy="6" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>'),
    description: '按文章 H 标题生成锚点目录',
  },
  {
    type: WB_CMS_DYN_SEO_TYPE,
    label: 'SEO Meta',
    group: 'dynamic-field',
    contexts: ['post-detail', 'media-detail', 'product-detail'],
    media: ICON('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>'),
    description: '页面 title / keywords / description',
  },
]

export const registerCmsDynamicFieldBlocks = (editor: any): void => {
  if (!editor) return
  injectStyleOnce(editor, DYNAMIC_FIELD_STYLE_KEY, DYNAMIC_FIELD_STYLES)

  registerDynamicTextBlock(editor)
  registerDynamicHtmlBlock(editor)
  registerDynamicImageBlock(editor)
  registerDynamicLinkBlock(editor)
  registerDynamicDatetimeBlock(editor)
  registerDynamicConditionalBlock(editor)
  registerDynamicRepeatBlock(editor)
  registerDynamicBreadcrumbBlock(editor)
  registerDynamicTocBlock(editor)
  registerDynamicSeoBlock(editor)
}

export {
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
  WB_TEMPLATE_CONTEXT_KEY,
  WB_DYN_MARK_ATTR,
} from './constants'

export type { DynamicBlockDescriptor as DynamicFieldBlockDescriptor }
export type { DynamicContext } from './bindings'
