import type { GrapesEditor } from '../../../../../types/editor'
import { WB_CMS_MEDIA_DETAIL_TYPE } from '../constants'
import {
  buildCategoryOnlyConfig,
  buildSeoMetaNodes,
  registerDetailCmsComponent,
} from '../helpers'

export function registerCmsMediaDetail(editor: GrapesEditor) {
  const categoryOnly = buildCategoryOnlyConfig({
    categoryLabel: '分类 ID',
    categoryPlaceholder: '分类 ID（留空=全部）',
  })

  registerDetailCmsComponent(editor, {
    type: WB_CMS_MEDIA_DETAIL_TYPE,
    dataWbComponent: 'cms-media-detail',
    dataCmsComponent: 'media-detail',
    name: '媒体资源详情',
    styleKey: 'wb-cms-media-detail',
    headerClass: 'wb-cms-media-detail-header',
    headerContent: '🎬 媒体资源详情模板 — 每个资源生成一个独立页面（含 SEO meta）',
    bodyClass: 'wb-cms-media-detail-body',
    styles: `
      .wb-cms-media-detail-header {
        display:flex;align-items:center;gap:8px;padding:6px 10px;
        background:#ede9fe;border-bottom:1px solid #c4b5fd;border-radius:4px 4px 0 0;
        font-size:11px;color:#5b21b6;pointer-events:none;user-select:none;font-weight:500;
      }
      .wb-cms-media-detail-body { padding:24px; }
      .wb-cms-media-detail-title { font-size:26px;font-weight:700;color:#111827;margin-bottom:10px; }
      .wb-cms-media-detail-desc { font-size:14px;color:#6b7280;margin-bottom:20px;line-height:1.6; }
      .wb-cms-media-detail-cover {
        width:100%;aspect-ratio:16/9;background:#f3f4f6;display:flex;
        align-items:center;justify-content:center;color:#9ca3af;font-size:14px;
        border-radius:6px;margin-bottom:20px;
      }
      .wb-cms-media-detail-items {
        display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
      }
      .wb-cms-media-detail-item-img {
        width:100%;aspect-ratio:1/1;background:#f3f4f6;border-radius:4px;display:flex;
        align-items:center;justify-content:center;color:#9ca3af;font-size:12px;
      }
      @media (max-width: 1023px) {
        .wb-cms-media-detail-body { padding:20px; }
        .wb-cms-media-detail-title { font-size:22px; }
        .wb-cms-media-detail-items {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 767px) {
        .wb-cms-media-detail-body { padding:16px; }
        .wb-cms-media-detail-title { font-size:20px; line-height:1.3; }
        .wb-cms-media-detail-desc { font-size:13px; margin-bottom:16px; }
        .wb-cms-media-detail-items {
          grid-template-columns: minmax(0, 1fr);
          gap: 10px;
        }
      }
    `,
    defaultAttributes: categoryOnly.defaultAttributes,
    defaultProps: categoryOnly.defaultProps,
    traits: categoryOnly.traits,
    bodyComponents: [
      { tagName: 'h1', attributes: { class: 'wb-cms-media-detail-title', 'data-cms-bind': 'media.title' }, content: '媒体资源标题（由数据填充）' },
      { tagName: 'p', attributes: { class: 'wb-cms-media-detail-desc', 'data-cms-bind': 'media.description' }, content: '媒体资源描述内容将在此处显示...' },
      {
        tagName: 'div',
        attributes: { class: 'wb-cms-media-detail-cover', 'data-cms-if': 'media.coverUrl' },
        components: [{ tagName: 'img', attributes: { 'data-cms-bind-src': 'media.coverUrl', 'data-cms-bind-alt': 'media.title', src: '', alt: '封面图', style: 'width:100%;height:100%;object-fit:cover;border-radius:6px;' } }],
      },
      {
        tagName: 'div',
        attributes: { 'data-cms-if': 'media.items', class: 'wb-cms-media-detail-items' },
        components: [{
          tagName: 'div', attributes: { 'data-cms-repeat': 'item@media.items' },
          components: [{ tagName: 'div', attributes: { class: 'wb-cms-media-detail-item-img' }, components: [{ tagName: 'img', attributes: { 'data-cms-bind-src': 'item.url', src: '', alt: '', style: 'width:100%;height:100%;object-fit:cover;border-radius:4px;' } }] }],
        }],
      },
      ...buildSeoMetaNodes({
        titleBind: 'media.seoTitle',
        titleContent: '媒体资源标题',
        keywordsBind: 'media.seoKeywords',
        descriptionBind: 'media.seoDescription',
      }),
    ],
    watchProps: categoryOnly.watchProps,
    syncAttrs: categoryOnly.syncAttrs,
  })
}
