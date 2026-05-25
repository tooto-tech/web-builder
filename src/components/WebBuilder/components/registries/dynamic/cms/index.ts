/**
 * 所有 CMS 组件的统一注册入口。
 * 主入口只负责类型导出和组件注册聚合。
 */
import type { GrapesEditor } from '../../../../types/editor'
import {
  WB_CMS_POST_LIST_TYPE,
  WB_CMS_POST_CARD_TYPE,
  WB_CMS_CASES_LIST_TYPE,
  WB_CMS_CASES_CARD_TYPE,
  registerCmsPostListComponents
} from './post/list'
import {
  WB_CMS_POST_CATEGORY_FILTER_TYPE,
  registerCmsPostCategoryFilter
} from './post/categoryFilter'
import {
  WB_CMS_PRODUCT_LIST_TYPE,
  WB_CMS_PRODUCT_CARD_TYPE,
  registerCmsProductListComponents
} from './product/list'
import {
  WB_CMS_PRODUCT_DATASHEET_LIST_TYPE,
  registerCmsProductDatasheetList
} from './product/datasheet'
import {
  WB_CMS_POST_LATEST_TYPE,
  WB_CMS_POST_DETAIL_TYPE,
  WB_CMS_MEDIA_LIST_TYPE,
  WB_CMS_TECHNICAL_SERVICE_LIST_TYPE,
  WB_CMS_TECHNICAL_DOWNLOAD_LIST_TYPE,
  WB_CMS_TECHNICAL_SUPPORT_DETAIL_TYPE,
  WB_CMS_MEDIA_LATEST_TYPE,
  WB_CMS_MEDIA_DETAIL_TYPE,
  WB_CMS_PRODUCT_LATEST_TYPE,
  WB_CMS_PRODUCT_FEATURED_TYPE,
  WB_CMS_PRODUCT_RELATED_TYPE,
  WB_CMS_FAQ_SECTION_TYPE,
  WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE,
  WB_CMS_SEARCH_TYPE,
  WB_CMS_SITE_MENU_TYPE,
  WB_CMS_MENU_TREE_TYPE
} from './constants'
import { WB_CMS_PRODUCT_DETAIL_TYPE, registerCmsProductDetail } from './product/detail'
import { WB_CMS_PRODUCT_DETAIL_V2_TYPE, registerCmsProductDetailV2 } from './product/detailV2'
import { registerCmsPostLatest } from './post/latest'
import { registerCmsPostDetail } from './post/detail'
import { registerCmsMediaList } from './media/list'
import { registerCmsTechnicalServiceList } from './media/technicalServiceList'
import { registerCmsTechnicalDownloadList } from './media/technicalDownloadList'
import { registerCmsTechnicalSupportDetail } from './media/technicalSupportDetail'
import { registerCmsMediaLatest } from './media/latest'
import { registerCmsMediaDetail } from './media/detail'
import { registerCmsProductLatest } from './product/latest'
import { registerCmsProductFeatured } from './product/featured'
import { registerCmsProductRelated } from './product/related'
import { registerCmsFaqSection } from './faq/section'
import { registerCmsProductCategoryFaq } from './faq/productCategoryFaq'
import { registerProductGalleryComponent } from './product/gallery'
import { registerPmBlocks } from './product/mediaBlocks'
import { registerCmsSearch } from './search'
import { registerCmsSiteMenu } from './menu'
import { registerCmsMenuTree } from './menuTree'
import {
  registerCmsDynamicFieldBlocks,
  DYNAMIC_FIELD_BLOCK_DESCRIPTORS,
  WB_CMS_DYN_TEXT_TYPE,
  WB_CMS_DYN_HTML_TYPE,
  WB_CMS_DYN_IMAGE_TYPE,
  WB_CMS_DYN_LINK_TYPE,
  WB_CMS_DYN_DATETIME_TYPE,
  WB_CMS_DYN_IF_TYPE,
  WB_CMS_DYN_REPEAT_TYPE,
  WB_CMS_DYN_SEO_TYPE,
  WB_CMS_DYN_TOC_TYPE,
  WB_CMS_DYN_BREADCRUMB_TYPE
} from './dynamicField'
import { resolveDynamicContext } from './dynamicField/bindings'
import type { DynamicContext } from './dynamicField/bindings'

export {
  WB_CMS_POST_LIST_TYPE,
  WB_CMS_POST_CARD_TYPE,
  WB_CMS_CASES_LIST_TYPE,
  WB_CMS_CASES_CARD_TYPE,
  WB_CMS_POST_CATEGORY_FILTER_TYPE
}
export { WB_CMS_PRODUCT_LIST_TYPE, WB_CMS_PRODUCT_CARD_TYPE, WB_CMS_PRODUCT_DATASHEET_LIST_TYPE }
export {
  WB_CMS_POST_LATEST_TYPE,
  WB_CMS_POST_DETAIL_TYPE,
  WB_CMS_MEDIA_LIST_TYPE,
  WB_CMS_TECHNICAL_SERVICE_LIST_TYPE,
  WB_CMS_TECHNICAL_DOWNLOAD_LIST_TYPE,
  WB_CMS_TECHNICAL_SUPPORT_DETAIL_TYPE,
  WB_CMS_MEDIA_LATEST_TYPE,
  WB_CMS_MEDIA_DETAIL_TYPE,
  WB_CMS_PRODUCT_LATEST_TYPE,
  WB_CMS_PRODUCT_FEATURED_TYPE,
  WB_CMS_PRODUCT_RELATED_TYPE,
  WB_CMS_FAQ_SECTION_TYPE,
  WB_CMS_PRODUCT_CATEGORY_FAQ_TYPE,
  WB_CMS_SEARCH_TYPE,
  WB_CMS_SITE_MENU_TYPE,
  WB_CMS_MENU_TREE_TYPE
}
export { WB_CMS_PRODUCT_DETAIL_TYPE }
export { WB_CMS_PRODUCT_DETAIL_V2_TYPE }

export {
  DYNAMIC_FIELD_BLOCK_DESCRIPTORS,
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
  resolveDynamicContext
}
export type { DynamicContext }

export function registerAllCmsComponents(editor: GrapesEditor): void {
  registerCmsPostListComponents(editor)
  registerCmsPostCategoryFilter(editor)
  registerCmsPostLatest(editor)
  registerCmsPostDetail(editor)
  registerCmsMediaList(editor)
  registerCmsTechnicalServiceList(editor)
  registerCmsTechnicalDownloadList(editor)
  registerCmsTechnicalSupportDetail(editor)
  registerCmsMediaLatest(editor)
  registerCmsMediaDetail(editor)
  registerCmsProductListComponents(editor)
  registerCmsProductDatasheetList(editor)
  registerCmsProductLatest(editor)
  registerCmsProductFeatured(editor)
  registerCmsProductRelated(editor)
  registerCmsFaqSection(editor)
  registerCmsProductCategoryFaq(editor)
  registerProductGalleryComponent(editor)
  registerPmBlocks(editor)
  registerCmsProductDetail(editor)
  registerCmsProductDetailV2(editor)
  registerCmsSearch(editor)
  registerCmsDynamicFieldBlocks(editor)
  registerCmsSiteMenu(editor)
  registerCmsMenuTree(editor)
}
