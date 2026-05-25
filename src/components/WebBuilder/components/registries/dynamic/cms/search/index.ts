import type { GrapesEditor } from '../../../../../types/editor'
import { registerCmsComponent, makePreviewHeader } from '@/components/WebBuilder/utils/cmsFactory'
import { WB_CMS_SEARCH_TYPE } from '../constants'

export function registerCmsSearch(editor: GrapesEditor) {
  registerCmsComponent(editor, {
    type: WB_CMS_SEARCH_TYPE,
    dataWbComponent: 'cms-search',
    dataCmsComponent: 'search',
    name: '搜索框',
    styleKey: 'wb-cms-search',
    styles: `
      .wb-cms-search-header {
        display:flex;align-items:center;gap:8px;padding:6px 10px;
        background:#e0f2fe;border-bottom:1px solid #7dd3fc;border-radius:4px 4px 0 0;
        font-size:11px;color:#0c4a6e;pointer-events:none;user-select:none;font-weight:500;
      }
      .wb-cms-search-body { padding:16px; }
      .wb-cms-search-row { display:flex;gap:8px;margin-bottom:12px; }
      .wb-cms-search-input {
        flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;color:#374151;background:#fff;
      }
      .wb-cms-search-btn {
        padding:8px 20px;background:#0ea5e9;color:#fff;border:none;
        border-radius:6px;font-size:14px;cursor:pointer;white-space:nowrap;
      }
      .wb-cms-search-noindex-tip {
        font-size:11px;color:#9ca3af;margin-top:8px;font-style:italic;
      }
      .cms-search-pagination {
        display:flex;justify-content:center;gap:8px;margin-top:16px;
      }
      @media (max-width: 1023px) {
        .wb-cms-search-body { padding:14px; }
        .wb-cms-search-row { margin-bottom:10px; }
      }
      @media (max-width: 767px) {
        .wb-cms-search-body { padding:12px; }
        .wb-cms-search-row { flex-direction:column; }
        .wb-cms-search-btn { width:100%; }
        .cms-search-pagination { flex-wrap:wrap; justify-content:flex-start; }
      }
    `,
    publishTemplate: `<div class="wb-cms-search-body">
  <div class="wb-cms-search-row">
    <input type="text" class="wb-cms-search-input cms-search-q" placeholder="Search..." autocomplete="off" />
    <button type="button" class="wb-cms-search-btn cms-search-submit">Search</button>
  </div>
  <div class="cms-search-stats" style="font-size:14px;color:#6b7280;margin-bottom:12px;"></div>
  <div class="cms-search-results" style="display:flex;flex-direction:column;gap:12px;"></div>
  <div class="cms-search-pagination" style="display:flex;justify-content:center;gap:8px;margin-top:16px;"></div>
</div>`,
    traits: [],
    watchProps: [],
    syncAttrs: () => ({}),
    components: [
      makePreviewHeader('wb-cms-search-header', '🔍 全局搜索框 — 当前页展示结果，并同步 URL 的 q 参数'),
      {
        tagName: 'div',
        attributes: { class: 'wb-cms-search-body' },
        components: [
          {
            tagName: 'div',
            attributes: { class: 'wb-cms-search-row' },
            components: [
              { tagName: 'input', attributes: { type: 'text', class: 'wb-cms-search-input', placeholder: '输入关键词搜索...' } },
              { tagName: 'button', attributes: { type: 'button', class: 'wb-cms-search-btn' }, content: '搜索' },
            ],
          },
          { tagName: 'p', attributes: { class: 'wb-cms-search-noindex-tip' }, content: '* 点击搜索后在当前页面展示结果，并自动读写 URL 的 q 参数' },
        ],
      },
    ],
  })
}
