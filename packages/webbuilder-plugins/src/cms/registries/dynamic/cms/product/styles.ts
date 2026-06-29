/**
 * 产品卡片 class 样式。
 * - 编辑器：通过 GrapesJS model defaults.styles 注入
 * - 发布：由 cmsFactory / ssgRenderer 注入到 <head>
 */
export const PRODUCT_CARD_CSS = `
  .wb-product-list { position: relative; display: grid; grid-template-columns: 220px minmax(0, 1fr); column-gap: 20px; row-gap: 72px; align-items: start; }
  .wb-product-list__grid { grid-column: 2; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 20px; row-gap: 72px; align-items: start; min-width: 0; }
  .wb-product-datasheet { grid-column: 2; display: none; min-width: 0; overflow-x: auto; }
  .wb-product-datasheet-page-title { display: none; }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-list__grid,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-list__grid { display: none; }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet { display: block; }

  .wb-product-list[data-list-mode="datasheet"],
  .wb-product-list[data-wb-list-mode="datasheet"] {
    display: block;
    width: min(100%, 1540px);
    margin: 0 auto;
    padding: 0;
    color: #101014;
    font-family: inherit;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-page-title,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-page-title {
    display: block;
    margin: 0 0 24px;
    color: #101014;
    font-size: 56px;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: 0;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-list__toolbar,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-list__toolbar,
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter-backdrop,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter-backdrop,
  .wb-product-list[data-list-mode="datasheet"] .wb-product-list-pagination,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-list-pagination,
  .wb-product-list[data-list-mode="datasheet"] .wb-product-list-loadmore,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-list-loadmore {
    display: none;
  }

  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter-drawer,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter-drawer {
    position: relative;
    top: auto;
    width: 100%;
    max-height: none;
    margin: 0 0 96px;
    padding: 30px 30px 34px;
    border-radius: 8px;
    background: #f7f7f8;
    box-shadow: none;
    transform: none;
    z-index: 20;
    display: block;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__header,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin: 0 0 20px;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__title,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__title {
    margin: 0;
    color: #101014;
    font-size: 22px;
    line-height: 1.2;
    font-weight: 700;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__close,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__close,
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__footer,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__footer {
    display: none;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__body,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__body {
    position: relative;
    overflow: visible;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__all-products,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__all-products {
    position: absolute;
    top: -48px;
    right: 0;
    width: auto;
    min-height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    color: #2454f4;
    font-size: 0;
    line-height: 1;
    font-weight: 700;
    cursor: pointer;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__all-products::before,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__all-products::before {
    display: none;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__all-products::after,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__all-products::after {
    content: "Reset All";
    font-size: 16px;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__groups,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__groups {
    display: grid;
    grid-template-columns: repeat(4, minmax(220px, 1fr));
    gap: 20px 16px;
    align-items: start;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__group,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__group {
    position: relative;
    padding: 0;
    border: none;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__control,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__control {
    position: relative;
    min-width: 0;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__toggle,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__toggle {
    width: 100%;
    min-height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 0 22px;
    border: 1px solid #e3e5ea;
    border-radius: 8px;
    background: #fff;
    color: #111318;
    font-size: 17px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0;
    text-align: left;
    cursor: pointer;
    box-shadow: 0 1px 1px rgba(16, 24, 40, 0.02);
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__toggle,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__toggle,
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__toggle:focus-visible,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__toggle:focus-visible {
    border-color: #2454f4;
    outline: none;
    box-shadow: 0 0 0 2px rgba(36, 84, 244, 0.18);
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__toggle,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__toggle {
    border-radius: 8px 8px 0 0;
    background: #2454f4;
    border-color: #2454f4;
    color: #fff;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__summary-value,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__summary-value {
    color: #2454f4;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__summary-value,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__summary-value {
    color: #fff;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__chevron,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__chevron {
    width: 12px;
    height: 12px;
    border-right: 1.8px solid currentColor;
    border-bottom: 1.8px solid currentColor;
    transform: rotate(45deg);
    flex: 0 0 auto;
    margin-top: -4px;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__chevron,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__chevron {
    transform: rotate(225deg);
    margin-top: 4px;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__panel,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__panel {
    display: none;
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    min-width: 300px;
    padding: 22px;
    border: 1px solid #e2e5ea;
    border-top: 0;
    border-radius: 0 0 8px 8px;
    background: #fff;
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
    z-index: 50;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__panel,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__panel {
    display: block;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__range-fields,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__range-fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__range-input,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__range-input {
    position: relative;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__range-input input,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__range-input input {
    width: 100%;
    height: 40px;
    padding: 0 44px 0 12px;
    border: 1px solid #dfe3ea;
    border-radius: 5px;
    background: #fff;
    color: #111318;
    font-size: 16px;
    line-height: 1;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__unit,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__unit {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9aa0aa;
    font-size: 16px;
    pointer-events: none;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__dash,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__dash {
    color: #101014;
    font-size: 16px;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__actions,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    margin-top: 26px;
    padding-top: 20px;
    border-top: 1px solid #edf0f4;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__action,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__action {
    min-height: 46px;
    border: 1px solid #dfe3ea;
    border-radius: 5px;
    background: #fff;
    color: #101014;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__action--primary,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__action--primary {
    border-color: #2454f4;
    background: #2454f4;
    color: #fff;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__options,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__options {
    display: grid;
    gap: 10px;
    max-height: 260px;
    overflow-y: auto;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__option,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__option {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #111318;
    font-size: 15px;
    line-height: 1.35;
    cursor: pointer;
  }
  .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-filter__option input,
  .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-filter__option input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: #2454f4;
  }

  .wb-product-datasheet__summary { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin: 0 0 26px; }
  .wb-product-datasheet__title { margin: 0; font-size: 30px; line-height: 1.2; font-weight: 750; color: #101014; }
  .wb-product-datasheet__meta { display: flex; align-items: center; gap: 18px; margin-top: 8px; color: #101014; font-size: 18px; line-height: 1.45; font-weight: 600; }
  .wb-product-datasheet__selected { color: #2454f4; font-weight: 600; }
  .wb-product-datasheet__export { min-width: 154px; min-height: 44px; border: 1px solid #d1d5db; background: #fff; color: #101014; font-size: 16px; font-weight: 700; cursor: pointer; }
  .wb-product-datasheet__export:disabled { cursor: not-allowed; opacity: 0.45; }
  .wb-product-datasheet__table { min-width: 940px; overflow-x: auto; }
  .wb-product-datasheet__header,
  .wb-product-datasheet__row { display: grid; grid-template-columns: 72px minmax(230px, 1.45fr) repeat(var(--wb-datasheet-field-count, 5), minmax(160px, 1fr)); align-items: stretch; }
  .wb-product-datasheet__header { background: #3152ed; color: #fff; font-weight: 800; }
  .wb-product-datasheet__body { max-height: 640px; overflow-y: auto; scrollbar-color: #2b2f38 #e8e8ea; scrollbar-width: thin; }
  .wb-product-datasheet__body::-webkit-scrollbar { width: 6px; }
  .wb-product-datasheet__body::-webkit-scrollbar-track { background: #e8e8ea; }
  .wb-product-datasheet__body::-webkit-scrollbar-thumb { background: #2b2f38; border-radius: 999px; }
  .wb-product-datasheet__row { background: #fff; }
  .wb-product-datasheet__row:nth-child(even) { background: #f6f6f7; }
  .wb-product-datasheet__row.is-selected,
  .wb-product-datasheet__row:has(input:checked) { background: #f2f5ff; }
  .wb-product-datasheet__cell { display: flex; align-items: center; min-height: 62px; padding: 12px 22px; color: #3f3f46; font-size: 18px; line-height: 1.35; white-space: nowrap; }
  .wb-product-datasheet__header .wb-product-datasheet__cell { color: #fff; font-weight: 700; }
  .wb-product-datasheet__checkbox { justify-content: center; padding-inline: 10px; }
  .wb-product-datasheet__checkbox input { width: 18px; height: 18px; margin: 0; accent-color: #2454f4; }
  .wb-product-datasheet__designation-link { color: #2454f4; font-weight: 800; text-decoration: underline; }
  .wb-product-list__toolbar { display: none; }
  .wb-product-list__count { font-size: 15px; line-height: 1.6; color: #121821; }
  .wb-product-list__filter-btn { border: none; background: transparent; padding: 0; display: inline-flex; align-items: center; gap: 10px; color: #121821; font-size: 18px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
  .wb-product-list__filter-icon { position: relative; width: 16px; height: 14px; display: inline-block; }
  .wb-product-list__filter-badge { display: none; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: currentColor; color: #fff; font-size: 11px; line-height: 1; }
  .wb-product-list__filter-btn.is-active .wb-product-list__filter-badge { background: #fff; color: #121821; }
  .wb-product-filter-backdrop { display: none; position: fixed; inset: 0; background: rgba(17, 24, 39, 0.38); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.25s ease; z-index: 998; }
  .wb-product-filter-backdrop.is-open { opacity: 1; visibility: visible; pointer-events: auto; }
  .wb-product-filter-drawer { grid-column: 1; grid-row: 1; position: sticky; top: 24px; width: 100%; max-height: calc(100vh - 48px); padding: 0 16px 0 0; background: transparent; transform: none; z-index: 1; display: flex; flex-direction: column; }
  .wb-product-filter-drawer.is-open { transform: none; }
  .wb-product-filter__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
  .wb-product-filter__title { margin: 0; font-size: 28px; line-height: 1.15; font-weight: 600; color: #121821; }
  .wb-product-filter__close { display: none; align-items: center; justify-content: center; width: 40px; height: 40px; border: 1px solid #d1d5db; border-radius: 999px; background: #fff; color: #111827; font-size: 24px; line-height: 1; cursor: pointer; }
  .wb-product-filter__body { flex: 1; min-height: 0; overflow-y: auto; }
  .wb-product-filter__all-products { width: 100%; display: flex; align-items: center; gap: 10px; padding: 0 0 18px; border: none; border-bottom: 1px solid #e5e7eb; background: transparent; color: #121821; font-size: 14px; line-height: 1.5; text-align: left; cursor: pointer; }
  .wb-product-filter__all-products::before { content: ""; width: 10px; height: 10px; border: 1px solid #8a949e; box-sizing: border-box; }
  .wb-product-filter__groups { display: flex; flex-direction: column; gap: 0; }
  .wb-product-filter__group { padding: 24px 0; border-bottom: 1px solid #e5e7eb; }
  .wb-product-filter__group:last-child { border-bottom: none; padding-bottom: 0; }
  .wb-product-filter__group-header { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0; border: none; background: transparent; color: #111827; cursor: pointer; }
  .wb-product-filter__group-title { font-size: 14px; line-height: 1.5; font-weight: 600; text-align: left; }
  .wb-product-filter__group-toggle { font-size: 18px; line-height: 1; font-weight: 400; }
  .wb-product-filter__group-options { display: grid; gap: 10px; padding-top: 16px; }
  .wb-product-filter__group.is-collapsed .wb-product-filter__group-options { display: none; }
  .wb-product-filter__option { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 1.45; color: #111827; cursor: pointer; }
  .wb-product-filter__option input { width: 12px; height: 12px; margin: 0; cursor: pointer; accent-color: #ffe600; }
  .wb-product-filter__range { display: flex; flex-direction: column; gap: 8px; padding: 2px 0 6px; }
  .wb-product-filter__range-title { font-size: 13px; line-height: 1.45; font-weight: 500; color: #111827; }
  .wb-product-filter__range-fields { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 8px; }
  .wb-product-filter__range-fields input { width: 100%; min-width: 0; height: 34px; padding: 0 9px; border: 1px solid #d8dde6; border-radius: 4px; background: #fff; color: #111827; font-size: 13px; }
  .wb-product-filter__empty { margin: 0; font-size: 14px; line-height: 1.7; color: #6b7280; }
  .wb-product-filter__footer { display: none; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding-top: 28px; }
  .wb-product-filter__footer-btn { min-height: 56px; border-radius: 0; border: 1px solid #111827; background: #fff; color: #111827; font-size: 16px; font-weight: 600; letter-spacing: 0.04em; cursor: pointer; text-transform: uppercase; }
  .wb-product-filter__footer-btn--primary { background: #111827; color: #fff; }
  .wb-product-card { position: relative; overflow: hidden; border-radius: 0; background: #fff; min-width: 0; }
  .wb-product-card-img-wrap { overflow: hidden; aspect-ratio: 296 / 360; }
  .wb-product-card-img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 8px; transition: transform 0.3s ease; }
  .wb-product-card:hover .wb-product-card-img { transform: scale(1.05); }
  .wb-product-card-body { padding: 16px 0 0; }
  .wb-product-card-name { font-weight: 500; font-size: 16px; color: #1a1a2e; line-height: 1.35; margin: 0 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .wb-product-card-link { display: inline; color: inherit; font: inherit; line-height: inherit; text-decoration: none; }
  .wb-product-card-link::after { content: ""; position: absolute; inset: 0; z-index: 1; cursor: pointer; }
  .wb-product-list-pagination { grid-column: 2; display: flex; justify-content: center; gap: 8px; padding: 16px 0; }
  .wb-product-list-page-btn,
  .wb-product-list-pagination > a,
  .wb-product-list-pagination > button,
  .wb-product-list-pagination > span { display: inline-flex; align-items: center; justify-content: center; min-width: 36px; height: 36px; padding: 0 10px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; color: #333; cursor: pointer; user-select: none; transition: all 0.2s; text-decoration: none; }
  .wb-product-list-page-btn:hover,
  .wb-product-list-pagination > a:hover,
  .wb-product-list-pagination > button:hover { border-color: #264FAA; color: #264FAA; }
  .wb-product-list-page-btn.active,
  .wb-product-list-pagination > a.active,
  .wb-product-list-pagination > button.active,
  .wb-product-list-pagination > span.active { background: #264FAA; border-color: #264FAA; color: #fff; }
  .wb-product-list-loadmore { grid-column: 2; display: flex; justify-content: center; padding: 12px 0 0; }
  .wb-product-list-loadmore__btn { min-width: 168px; min-height: 44px; padding: 0 20px; border: 1px solid #111827; background: #fff; color: #111827; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .wb-product-list-loadmore__btn:hover { background: #111827; color: #fff; }
  @media (max-width: 1023px) {
    .wb-product-list { grid-template-columns: minmax(0, 1fr); column-gap: 8px; row-gap: 28px; }
    .wb-product-list__grid { grid-column: 1 / -1; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 8px; row-gap: 28px; }
    .wb-product-datasheet { grid-column: 1 / -1; }
    .wb-product-datasheet__summary { align-items: flex-start; flex-direction: column; }
    .wb-product-datasheet__title { font-size: 24px; }
    .wb-product-datasheet__table { min-width: 760px; }
    .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-page-title,
    .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-page-title { font-size: 42px; }
    .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__groups,
    .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__groups { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .wb-product-list__toolbar { grid-column: 1 / -1; display: flex; flex-wrap: nowrap; align-items: center; justify-content: flex-start; gap: 12px; padding-bottom: 4px; border-bottom: none; }
    .wb-product-list__count { display: none; }
    .wb-product-filter-backdrop { display: block; }
    .wb-product-filter-drawer { position: fixed; top: 0; right: 0; bottom: 0; grid-column: auto; grid-row: auto; width: min(440px, 100vw); max-height: none; padding: 28px 22px 24px; background: #fff; transform: translateX(100%); transition: transform 0.28s ease; z-index: 999; }
    .wb-product-filter-drawer.is-open { transform: translateX(0); }
    .wb-product-list[data-list-mode="datasheet"] .wb-product-filter-drawer,
    .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter-drawer { position: relative; inset: auto; width: 100%; max-height: none; margin: 0 0 72px; padding: 26px 22px 30px; background: #f7f7f8; transform: none; transition: none; z-index: 20; }
    .wb-product-list[data-list-mode="datasheet"] .wb-product-filter-drawer.is-open,
    .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter-drawer.is-open { transform: none; }
    .wb-product-filter__header { margin-bottom: 20px; }
    .wb-product-filter__title { font-size: 30px; }
    .wb-product-filter__close { display: inline-flex; }
    .wb-product-filter__body { padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .wb-product-filter__all-products { padding-bottom: 16px; }
    .wb-product-filter__group { padding: 22px 0; }
    .wb-product-filter__footer { display: grid; }
    .wb-product-list-pagination,
    .wb-product-list-loadmore { grid-column: 1 / -1; }
  }
  @media (max-width: 767px) {
    .wb-product-list { grid-template-columns: minmax(0, 1fr); column-gap: 8px; row-gap: 28px; }
    .wb-product-list__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 8px; row-gap: 28px; }
    .wb-product-list[data-list-mode="datasheet"] .wb-product-filter__groups,
    .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter__groups { grid-template-columns: minmax(0, 1fr); }
    .wb-product-list[data-list-mode="datasheet"] .wb-product-datasheet-page-title,
    .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-datasheet-page-title { font-size: 34px; }
    .wb-product-datasheet__meta { font-size: 15px; flex-wrap: wrap; }
    .wb-product-datasheet__cell { font-size: 15px; min-height: 54px; padding-inline: 16px; }
    .wb-product-list__filter-btn { justify-content: center; }
    .wb-product-filter-drawer { width: 100vw; padding: 22px 18px 20px; }
    .wb-product-list[data-list-mode="datasheet"] .wb-product-filter-drawer,
    .wb-product-list[data-wb-list-mode="datasheet"] .wb-product-filter-drawer { width: 100%; padding: 22px 16px 28px; margin-bottom: 54px; }
    .wb-product-filter__title { font-size: 28px; }
    .wb-product-filter__group { padding-bottom: 22px; }
    .wb-product-filter__group-options { gap: 12px; padding-top: 14px; }
    .wb-product-filter__footer { grid-template-columns: minmax(0, 1fr); }
    .wb-product-filter__footer-btn { min-height: 48px; font-size: 14px; }
    .wb-product-card-body { padding: 10px 0 0; }
    .wb-product-card-name {
      font-size: 15px;
    }
    .wb-product-list-pagination { flex-wrap: wrap; }
    .wb-product-list-page-btn { min-width: 34px; height: 34px; font-size: 13px; }
  }
  @media (max-width: 360px) {
    .wb-product-list__grid { grid-template-columns: minmax(0, 1fr); }
  }
`
