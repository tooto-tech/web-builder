/**
 * 卡片子元素的 class 样式。
 * - 编辑器中：通过 GrapesJS model defaults.styles 注入（组件创建时自动添加到 CssComposer）
 * - 发布时：由 cmsFactory / ssgRenderer 注入到输出 <head>
 */
export const POST_CARD_CSS = `
  .wb-post-card { position: relative; overflow: hidden; }
  .wb-post-card-img-wrap { overflow: hidden; aspect-ratio: 4 / 3; }
  .wb-post-card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease; }
  .wb-post-card:hover .wb-post-card-img { transform: scale(1.1); }
  .wb-post-card-body { transition: all 0.3s; padding-top: 16px; padding-bottom: 16px; }
  .wb-post-card-date { font-size: 14px; margin-bottom: 12px; display: block; color: #264FAA; }
  .wb-post-card-title { font-size: 20px; color: #041038; font-weight: 500; line-height: 1.18; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 8px; }
  .wb-post-card-excerpt { color: #193143; line-height: 1.6; height: 3.2em; font-weight: 300; margin-bottom: 16px; font-size: 14px; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
  .wb-post-card-link { color: #041038; cursor: pointer; line-height: 1.5; text-decoration: none; font-size: 14px; }
  .wb-post-card:hover .wb-post-card-date,
  .wb-post-card:hover .wb-post-card-title,
  .wb-post-card:hover .wb-post-card-excerpt,
  .wb-post-card:hover .wb-post-card-link { color: #1B43ED; }
  .wb-post-card-link::after { content:''; position:absolute; inset:0; }
  @media (max-width: 1023px) {
    .wb-post-card-body { padding-top: 14px; padding-bottom: 14px; }
    .wb-post-card-title { font-size: 18px; }
  }
  @media (max-width: 767px) {
    .wb-post-card-body { padding-top: 12px; padding-bottom: 12px; }
    .wb-post-card-date { font-size: 13px; margin-bottom: 10px; }
    .wb-post-card-title {
      font-size: 16px;
      white-space: normal;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .wb-post-card-excerpt { font-size: 13px; margin-bottom: 12px; }
  }
`
