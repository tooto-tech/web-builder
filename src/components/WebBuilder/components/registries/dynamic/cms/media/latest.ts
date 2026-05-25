import type { GrapesEditor } from '../../../../../types/editor'
import { WB_CMS_MEDIA_LATEST_TYPE } from '../constants'
import { registerLatestCmsComponent } from '../helpers'

export function registerCmsMediaLatest(editor: GrapesEditor) {
  registerLatestCmsComponent(editor, {
    type: WB_CMS_MEDIA_LATEST_TYPE,
    dataWbComponent: 'cms-media-latest',
    dataCmsComponent: 'media-latest',
    name: '最新媒体',
    styleKey: 'wb-cms-media-latest',
    headerClass: 'wb-cms-mcat-header',
    headerContent: '🆕 最新媒体 — 展示最新 N 个媒体资源',
    repeatEntity: 'media',
    gridClass: 'wb-cms-mcat-grid',
    cardCount: 4,
    categoryLabel: '分类 ID',
    categoryPlaceholder: '分类 ID（留空=全部）',
    limitDefault: 4,
    styles: `
      .wb-cms-mcat-header {
        display:flex;align-items:center;gap:8px;padding:6px 10px;
        background:#fce7f3;border-bottom:1px solid #f9a8d4;border-radius:4px 4px 0 0;
        font-size:11px;color:#9d174d;pointer-events:none;user-select:none;font-weight:500;
      }
      .wb-cms-mcat-grid {
        display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px;
      }
      .wb-cms-mcat-item {
        border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;background:#fff;
      }
      .wb-cms-mcat-img {
        width:100%;aspect-ratio:1/1;background:#f3f4f6;display:flex;
        align-items:center;justify-content:center;color:#9ca3af;font-size:12px;
      }
      .wb-cms-mcat-title {
        padding:8px;font-size:12px;font-weight:600;color:#111827;text-align:center;
      }
      @media (max-width: 1023px) {
        .wb-cms-mcat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }
      }
      @media (max-width: 767px) {
        .wb-cms-mcat-grid {
          grid-template-columns: minmax(0, 1fr);
          padding: 12px;
        }
        .wb-cms-mcat-title {
          padding: 10px 12px;
          font-size: 13px;
        }
      }
    `,
    createCard: (i) => ({
      tagName: 'div',
      attributes: { class: 'wb-cms-mcat-item' },
      components: [
        { tagName: 'div', attributes: { class: 'wb-cms-mcat-img', ...(i === 1 ? { 'data-cms-bind-src': 'media.coverUrl' } : {}) }, content: '封面图' },
        { tagName: 'div', attributes: { class: 'wb-cms-mcat-title', ...(i === 1 ? { 'data-cms-bind': 'media.title' } : {}) }, content: `媒体标题${i > 1 ? ' ' + i : ''}` },
      ],
    }),
  })
}
