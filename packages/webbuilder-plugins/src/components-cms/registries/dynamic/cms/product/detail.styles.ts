export const PRODUCT_DETAIL_STYLES = `
  .wb-product-detail {
    display:block;
    width:100%;
    background:#fff;
  }

  .wb-product-detail__header {
    display:flex;
    align-items:center;
    gap:8px;
    padding:6px 10px;
    background:#fef3c7;
    border-bottom:1px solid #fde68a;
    border-radius:4px 4px 0 0;
    font-size:11px;
    color:#78350f;
    pointer-events:none;
    user-select:none;
    font-weight:500;
  }

  .wb-product-detail__container { max-width:1200px; margin:0 auto; padding:0 40px; }
  .wb-product-detail__breadcrumb { display:flex; align-items:center; gap:16px; padding:20px 0; font-size:13px; color:#888; }
  .wb-product-detail__breadcrumb-back {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:6px;
    flex:0 0 auto;
    padding:0;
    border:none;
    background:none;
    color:#333;
    text-decoration:none;
    font-size:12px;
    line-height:1.3;
    cursor:pointer;
    border-right: 1px solid #979797;
    padding-right: 12px;
  }
  .wb-product-detail__breadcrumb-back-icon {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    width:1em;
    height:1em;
    flex:0 0 auto;
    font-size:inherit;
    line-height:1;
  }
  .wb-product-detail__breadcrumb-back-icon svg {
    display:block;
    width:1em;
    height:1em;
  }
  .wb-product-detail__breadcrumb-back-label { white-space:nowrap; }
  .wb-product-detail__breadcrumb-name {
    min-width:0;
    color:#000;
    font-size: 12px;
    line-height:1.3;
  }

  .wb-product-detail__hero {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:48px;
    padding:8px 0 48px;
    align-items:start;
    border-bottom: 1px solid #D8D8D8;
  }

  .wb-product-gallery { margin-bottom:0; }
  .wb-product-gallery__stage {
    position:relative;
    overflow:hidden;
    border-radius:8px;
    background:#ECEFF3;
    aspect-ratio:1/1;
    margin-bottom:16px;
    cursor:zoom-in;
  }
  .wb-product-gallery__stage.is-zooming { cursor:crosshair; }
  .wb-product-gallery__main-img {
    width:100%;
    height:100%;
    display:block;
    object-fit:contain;
    transition:transform .18s ease;
    transform-origin:center center;
    background:#fff;
  }
  .wb-product-gallery__thumbs-wrap {
    display:grid;
    grid-template-columns:36px 1fr 36px;
    align-items:center;
    gap:12px;
  }
  .wb-product-gallery__thumbs-viewport {
    overflow-x:auto;
    scrollbar-width:none;
  }
  .wb-product-gallery__thumbs-viewport::-webkit-scrollbar { display:none; }
  .wb-product-gallery__thumbs {
    display:flex;
    gap:10px;
    align-items:center;
  }
  .wb-product-gallery__thumb {
    width:72px;
    height:72px;
    border:none;
    background:#fff;
    border-radius:8px;
    cursor:pointer;
    padding:6px;
    flex:0 0 auto;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 0 0 1px #e5e5e5 inset;
    transition:all .2s ease;
  }
  .wb-product-gallery__thumb:hover,
  .wb-product-gallery__thumb.is-active {
    box-shadow:0 0 0 1px #111 inset;
  }
  .wb-product-gallery__thumb-img {
    width:100%;
    height:100%;
    display:block;
    object-fit:contain;
  }
  .wb-product-gallery__nav {
    width:36px;
    height:36px;
    border:none;
    background:#fff;
    border-radius:9999px;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    font-size:22px;
    line-height:1;
    color:#333;
  }

  .wb-product-detail__info { display:flex; flex-direction:column; }
  .wb-product-detail__name {
    font-size: 48px;
    font-weight:600;
    color:#111;
    line-height:1.25;
    margin:0 0 16px;
    letter-spacing:-0.01em;
  }
  .wb-product-detail__desc {
    font-size:16px;
    margin:0 0 24px;
    color: rgba(0,0,0,0.6);
    line-height:1.5;
  }

  .wb-product-detail__accordion { border-top:1px solid #e8e8e8; }
  .wb-product-detail__accordion-item { border-bottom:1px solid #e8e8e8; }
  .wb-product-detail__accordion-summary {
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:14px 0;
    font-size:16px;
    font-weight:500;
    color:#000;
    cursor:pointer;
    list-style:none;
  }
  .wb-product-detail__accordion-summary::-webkit-details-marker { display:none; }
  .wb-product-detail__accordion-summary::marker { display:none; content:''; }
  .wb-product-detail__accordion-icon {
    font-size:18px;
    color:#999;
    font-weight:300;
    transition:transform .2s;
  }
  .wb-product-detail__accordion-item[open] .wb-product-detail__accordion-icon {
    transform:rotate(45deg);
  }
  .wb-product-detail__accordion-body {
    padding:0 0 16px;
    font-size:16px;
    color: rgba(0,0,0,0.8);
    line-height:1.5;
    white-space: pre-wrap;
  }
  .wb-product-detail__accordion-body ul { margin:0; padding:0 0 0 18px; list-style:disc; }
  .wb-product-detail__accordion-body li { margin-bottom:4px; text-transform:capitalize; }

  .wb-product-detail__download {
    display:inline-flex;
    align-items:center;
    gap:10px;
    padding:10px 16px;
    margin:0;
    background:#f5f7fa;
    border-radius:8px;
    font-size:13px;
    color:#333;
  }
  .wb-product-detail__download-icon { color:#2563eb; font-size:14px; }

  .wb-product-detail__cta {
    display:block;
    width:100%;
    padding:12px;
    margin-top:32px;
    background:#0057CE;
    color:#fff;
    border:none;
    font-weight:500;
    cursor:pointer;
    text-align:center;
    transition:background .2s;
  }
  .wb-product-detail__cta:hover { background:#1d4ed8; }

  .wb-product-detail__sections { display:flex; flex-direction:column; }
  .wb-product-detail__section { padding:48px 0; }
  .wb-product-detail__section-header {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:48px;
    margin-bottom:32px;
    align-items:start;
  }
  .wb-product-detail__section-title {
    font-size:36px;
    font-weight:700;
    color:#111;
    line-height:1.15;
    margin:0;
    letter-spacing:-0.01em;
  }
  .wb-product-detail__section-desc {
    font-size:14px;
    color:#666;
    line-height:1.75;
    margin:0;
    padding-top:8px;
  }
  .wb-product-detail__section-content { font-size:14px; line-height:1.75; color:#444; }
  .wb-product-detail__section-img { width:100%; border-radius:8px; display:block; }

  .wb-product-detail__table { width:100%; border-collapse:collapse; font-size:13px; }
  .wb-product-detail__table th {
    background:#9e9e9e;
    color:#fff;
    padding:10px 16px;
    font-weight:500;
    text-align:center;
  }
  .wb-product-detail__table td {
    padding:10px 16px;
    border-bottom:1px solid #e8e8e8;
    text-align:center;
    color:#333;
  }

  .wb-product-detail__nav {
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:28px 0;
    border-top:1px solid #e8e8e8;
    margin-top:16px;
  }
  .wb-product-detail__nav-item {
    display:flex;
    align-items:center;
    gap:6px;
    color:#333;
    font-size:14px;
    text-decoration:none;
  }
  .wb-product-detail__nav-arrow { font-size:16px; color:#666; }

  .pm-doc-block__link {
    color:#000;
    text-decoration:none;
    display:flex;
    font-size:14px;
    line-height:20px;
    align-items:center;
    border:1px #e9ebf0 solid;
    padding:12px 16px;
    gap:8px;
    width:max-content;
  }
  .pm-gallery-block{
    padding: 80px 0;
  }
  .pm-gallery-block__wrap {
    display:grid;
    grid-template-columns:repeat(2, 1fr);
  }
  .pm-gallery-block__title {
    font-size:48px;
    line-height:1.15;
    font-weight:600;
    color:#000;
    margin:0;
    max-width: 380px;
  }
  .pm-gallery-block__desc { margin:0; color:rgba(0,0,0,0.6); line-height:1.5; }
  .pm-gallery-block__carousel {
    position:relative;
    margin-top:56px;
    overflow:hidden;
    width:100%;
    grid-column:1 / -1;
    aspect-ratio:2 / 1;
    --swiper-theme-color:#6d28d9;
    --swiper-navigation-size:18px;
  }
  .pm-gallery-block__slide { display:flex; align-items:stretch; height:auto; }
  .pm-gallery-block__image {
    width:100%;
    display:block;
    aspect-ratio:4 / 3;
    object-fit:cover;
    border-radius:12px;
    background:#f3e8ff;
  }
  .pm-gallery-block__pagination { position:relative; margin-top:14px; }
  .pm-gallery-block__pagination .swiper-pagination-bullet {
    width:8px;
    height:8px;
    background:rgba(109,40,217,.28);
    opacity:1;
  }
  .pm-gallery-block__pagination .swiper-pagination-bullet-active {
    width:22px;
    border-radius:999px;
    background:#6d28d9;
  }
  .pm-gallery-block__nav {
    width:38px;
    height:38px;
    border-radius:999px;
    background:rgba(255,255,255,.96);
    box-shadow:0 8px 22px rgba(91,82,115,.16);
    color:#4c1d95;
  }
  .pm-gallery-block__nav::after { font-size:14px; font-weight:700; }
  .pm-gallery-block__nav.swiper-button-disabled { opacity:.35; }

  .pm-image-block__wrap {
    display:grid;
    grid-template-columns:repeat(2, 1fr);
  }
  .pm-image-block__title {
    font-size:48px;
    font-weight:600;
    line-height:1.15;
    color:#000;
    margin:0;
    max-width: 380px;
  }
  .pm-image-block__desc { margin:0; color:rgba(0,0,0,0.6); line-height:1.5; }
  .pm-image-block__image {
    grid-column:1 / -1;
    margin-top:56px;
    width:100%;
  }

  .pm-video-block {
    padding:16px 20px;
    margin-bottom:12px;
    background:#fef2f2;
    border:1px dashed #fca5a5;
    border-radius:8px;
  }
  .pm-video-block h3 {
    font-size:48px;
    font-weight:600;
    line-height:1.15;
    color:#000;
    margin:0;
  }

  @media (max-width: 1023px) {
    .wb-product-detail__container { padding:0 20px; }
    .wb-product-detail__breadcrumb { flex-wrap:wrap; padding:16px 0; }
    .wb-product-detail__hero { grid-template-columns:1fr; gap:24px; }
    .wb-product-detail__name { font-size:28px; }
    .wb-product-detail__desc { margin-bottom:20px; }
    .wb-product-gallery__stage { margin-bottom:12px; }
    .wb-product-gallery__thumbs-wrap { grid-template-columns:32px 1fr 32px; gap:10px; }
    .wb-product-gallery__thumb { width:64px; height:64px; }
    .wb-product-gallery__nav { width:32px; height:32px; font-size:18px; }
    .wb-product-detail__section { padding:36px 0; }
    .wb-product-detail__section-header { grid-template-columns:1fr; gap:12px; }
    .wb-product-detail__section-title { font-size:28px; }
    .pm-gallery-block__wrap,
    .pm-image-block__wrap { grid-template-columns:1fr; gap:16px; }
    .pm-gallery-block__title,
    .pm-image-block__title,
    .pm-video-block h3 { font-size:36px; }
    .pm-gallery-block__carousel,
    .pm-image-block__image { margin-top:32px; }
  }

  @media (max-width: 767px) {
    .wb-product-detail__container { padding:0; }
    .wb-product-detail__breadcrumb { font-size:12px; gap: 12px; }
    .wb-product-detail__name { font-size:24px; }
    .wb-product-detail__desc { font-size:13px; }
    .wb-product-gallery__thumb { width:56px; height:56px; }
    .wb-product-detail__accordion-summary { padding:12px 0; font-size:13px; }
    .wb-product-detail__cta { font-size:14px; padding:13px; }
    .wb-product-detail__section { padding:28px 0; }
    .wb-product-detail__section-title { font-size:24px; }
    .wb-product-detail__section-desc,
    .wb-product-detail__section-content { font-size:13px; }
    .wb-product-detail__table { display:block; overflow-x:auto; white-space:nowrap; }
    .pm-gallery-block { padding: 50px 0; }
    .pm-video-block { padding:14px 16px; }
    .pm-gallery-block__title,
    .pm-image-block__title,
    .pm-video-block h3 { font-size:28px; }
    .pm-gallery-block__carousel,
    .pm-image-block__image { margin-top:24px; }
    .pm-gallery-block__nav { width:32px; height:32px; }
    .wb-product-detail__accordion-body{font-size: 13px;}
    .pm-image-block__desc,
    .pm-gallery-block__desc{font-size: 13px;}
  }
`
