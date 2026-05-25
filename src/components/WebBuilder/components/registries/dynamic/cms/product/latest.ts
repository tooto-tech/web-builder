import type { GrapesEditor } from '../../../../../types/editor'
import { WB_CMS_PRODUCT_LATEST_TYPE } from '../constants'
import { registerLatestCmsComponent } from '../helpers'

export function registerCmsProductLatest(editor: GrapesEditor) {
  registerLatestCmsComponent(editor, {
    type: WB_CMS_PRODUCT_LATEST_TYPE,
    dataWbComponent: 'cms-product-latest',
    dataCmsComponent: 'product-latest',
    name: '最新产品',
    styleKey: 'wb-cms-product-latest',
    headerClass: 'wb-cms-prod-latest-header',
    headerContent: '🆕 最新产品 — 显示最新 N 个产品',
    repeatEntity: 'product',
    gridClass: 'wb-cms-prod-latest-grid',
    cardCount: 3,
    categoryLabel: '分类 ID',
    categoryPlaceholder: '产品分类 ID（留空=全部）',
    limitDefault: 6,
    styles: `
      .wb-cms-prod-latest-header {
        display:flex;align-items:center;gap:8px;padding:6px 10px;
        background:#fff7ed;border-bottom:1px solid #fed7aa;border-radius:4px 4px 0 0;
        font-size:11px;color:#9a3412;pointer-events:none;user-select:none;font-weight:500;
      }
      .wb-cms-prod-latest-grid {
        display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px;
      }
      .wb-cms-prod-latest-card {
        border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff;
      }
      .wb-cms-prod-latest-img {
        width:100%;aspect-ratio:1/1;background:#f3f4f6;display:flex;
        align-items:center;justify-content:center;color:#9ca3af;font-size:12px;
      }
      .wb-cms-prod-latest-body { padding:10px; }
      .wb-cms-prod-latest-name { font-weight:600;font-size:13px;color:#111827;margin-bottom:4px; }
      .wb-cms-prod-latest-price { font-size:15px;font-weight:700;color:#dc2626;margin-bottom:6px; }
      .wb-cms-prod-latest-link { font-size:12px;color:#f97316; }
      @media (max-width: 1023px) {
        .wb-cms-prod-latest-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          padding: 14px;
        }
      }
      @media (max-width: 767px) {
        .wb-cms-prod-latest-grid {
          grid-template-columns: minmax(0, 1fr);
          padding: 12px;
        }
        .wb-cms-prod-latest-body { padding: 12px; }
        .wb-cms-prod-latest-name { font-size: 14px; }
      }
    `,
    createCard: (i) => ({
      tagName: 'div',
      attributes: { class: 'wb-cms-prod-latest-card' },
      components: [
        { tagName: 'div', attributes: { class: 'wb-cms-prod-latest-img', ...(i === 1 ? { 'data-cms-bind-src': 'product.picUrl' } : {}) }, content: '产品图片' },
        { tagName: 'div', attributes: { class: 'wb-cms-prod-latest-body' }, components: [
          { tagName: 'div', attributes: { class: 'wb-cms-prod-latest-name', ...(i === 1 ? { 'data-cms-bind': 'product.name' } : {}) }, content: `产品名称${i > 1 ? ' ' + i : ''}` },
          { tagName: 'div', attributes: { class: 'wb-cms-prod-latest-price', ...(i === 1 ? { 'data-cms-bind': 'product.priceFormatted' } : {}) }, content: `$${i * 10}.00` },
          { tagName: 'a', attributes: { class: 'wb-cms-prod-latest-link', ...(i === 1 ? { 'data-cms-bind-href': 'product.url' } : {}), href: '#' }, content: '查看 →' },
        ]},
      ],
    }),
  })
}
