import type { GrapesEditor } from '../../../../../types/editor'
import { WB_CMS_MEDIA_LIST_TYPE } from '../constants'
import { registerMediaListCmsComponent } from '../helpers'

export function registerCmsMediaList(editor: GrapesEditor) {
  registerMediaListCmsComponent(editor, {
    type: WB_CMS_MEDIA_LIST_TYPE,
    dataWbComponent: 'cms-media-list',
    dataCmsComponent: 'media-list',
    name: '媒体资源列表',
    styleKey: 'wb-cms-media-list',
    headerClass: 'wb-cms-media-list-header',
    headerContent: '🖼️ 媒体资源列表 — 发布时由后端预渲染填充数据',
    repeatEntity: 'media',
    gridClass: 'wb-cms-media-grid',
    paginationClass: 'wb-cms-media-pagination',
    pageBtnClass: 'wb-cms-media-page-btn',
    categoryLabel: '分类 ID',
    categoryPlaceholder: '分类 ID（留空=全部）',
    cardCount: 3,
    styles: `
      .wb-cms-media-list-header {
        display:flex;align-items:center;gap:8px;padding:6px 10px;
        background:#f3e8ff;border-bottom:1px solid #d8b4fe;border-radius:4px 4px 0 0;
        font-size:11px;color:#6b21a8;pointer-events:none;user-select:none;font-weight:500;
      }
      .wb-cms-media-grid {
        display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px;
      }
      .wb-cms-media-card {
        border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;background:#fff;
      }
      .wb-cms-media-card-img {
        width:100%;aspect-ratio:4/3;background:#f3f4f6;display:flex;
        align-items:center;justify-content:center;color:#9ca3af;font-size:12px;
      }
      .wb-cms-media-card-body { padding:10px; }
      .wb-cms-media-card-title { font-weight:600;font-size:13px;color:#111827;margin-bottom:4px; }
      .wb-cms-media-card-desc { font-size:12px;color:#6b7280;margin-bottom:6px; }
      .wb-cms-media-card-link { font-size:12px;color:#8b5cf6; }
      .wb-cms-media-pagination {
        display:flex;gap:6px;justify-content:center;padding:12px 16px;
      }
      .wb-cms-media-page-btn,
      .wb-cms-media-pagination > a,
      .wb-cms-media-pagination > button,
      .wb-cms-media-pagination > span {
        padding:4px 10px;border-radius:4px;font-size:12px;
        border:1px solid #e5e7eb;background:#f9fafb;color:#374151;text-decoration:none;
      }
      .wb-cms-media-page-btn.active,
      .wb-cms-media-pagination > a.active,
      .wb-cms-media-pagination > button.active,
      .wb-cms-media-pagination > span.active {
        background:#8b5cf6;color:#fff;border-color:#8b5cf6;
      }
      @media (max-width: 1023px) {
        .wb-cms-media-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          padding: 14px;
        }
      }
      @media (max-width: 767px) {
        .wb-cms-media-grid {
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
          padding: 12px;
        }
        .wb-cms-media-card-body { padding: 12px; }
        .wb-cms-media-card-title { font-size: 14px; }
        .wb-cms-media-card-desc { font-size: 13px; }
        .wb-cms-media-pagination { flex-wrap: wrap; padding: 10px 12px 12px; }
      }
    `,
    createCard: (i) => ({
      tagName: 'div',
      attributes: { class: 'wb-cms-media-card' },
      components: [
        { tagName: 'div', attributes: { class: 'wb-cms-media-card-img', ...(i === 1 ? { 'data-cms-bind-src': 'media.coverUrl' } : {}) }, content: '封面图' },
        { tagName: 'div', attributes: { class: 'wb-cms-media-card-body' }, components: [
          { tagName: 'div', attributes: { class: 'wb-cms-media-card-title', ...(i === 1 ? { 'data-cms-bind': 'media.title' } : {}) }, content: `媒体资源标题${i > 1 ? ' ' + i : ''}` },
          { tagName: 'div', attributes: { class: 'wb-cms-media-card-desc', ...(i === 1 ? { 'data-cms-bind': 'media.description' } : {}) }, content: '资源描述...' },
          { tagName: 'a', attributes: { class: 'wb-cms-media-card-link', ...(i === 1 ? { 'data-cms-bind-href': 'media.detailUrl' } : {}), href: '#' }, content: '查看详情 →' },
        ]},
      ],
    }),
  })
}
