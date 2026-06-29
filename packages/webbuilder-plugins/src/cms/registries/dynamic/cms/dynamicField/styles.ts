/**
 * 动态字段组件在编辑器画布中的占位样式。
 * 这些样式只在"字段未绑定"或"预览数据缺失"时显示，给设计师一个可感知的提示外观，
 * 发布时会被 SSG 渲染器用真实数据替换或清理掉。
 */
export const DYNAMIC_FIELD_STYLES = `
  [data-wb-dynamic] {
    position: relative;
  }
  [data-wb-dynamic][data-wb-dyn-empty="true"] {
    outline: 1px dashed #cbd5e1;
    outline-offset: 2px;
    min-height: 18px;
    background: rgba(148, 163, 184, 0.08);
  }
  [data-wb-dynamic="image"] {
    display: inline-block;
  }
  [data-wb-dynamic="text"] {
    white-space: pre-line;
  }
  img[data-wb-dynamic="image"][data-wb-dyn-empty="true"] {
    min-width: 120px;
    min-height: 80px;
  }
  [data-wb-dynamic="if"] {
    display: block;
    padding: 4px;
    border: 1px dashed #fca5a5;
    background: rgba(252, 165, 165, 0.08);
    border-radius: 4px;
  }
  [data-wb-dynamic="if"]::before {
    content: "";
    position: absolute;
    top: -10px;
    left: 8px;
    font-size: 10px;
    color: #b91c1c;
    background: #fff;
    padding: 0 4px;
    line-height: 1;
  }
  [data-wb-dynamic="seo-meta"] {
    display: none;
  }

  /* ───────── 面包屑导航 ───────── */
  .wb-cms-dynamic-breadcrumb {
    display: block;
    box-sizing: border-box;
    color: var(--wb-breadcrumb-color, #202020);
    font-size: var(--wb-breadcrumb-font-size, 12px);
    font-weight: var(--wb-breadcrumb-font-weight, 400);
    line-height: var(--wb-breadcrumb-line-height, 1.4);
    letter-spacing: var(--wb-breadcrumb-letter-spacing, 0);
  }
  .wb-cms-dynamic-breadcrumb__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wb-cms-dynamic-breadcrumb__item {
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }
  .wb-cms-dynamic-breadcrumb__link {
    color: inherit;
    text-decoration: none;
    max-width: 28ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wb-cms-dynamic-breadcrumb__link:hover {
    color: var(--wb-breadcrumb-hover-color, #111111);
  }
  .wb-cms-dynamic-breadcrumb__separator {
    color: var(--wb-breadcrumb-separator-color, #777777);
    margin: 0 var(--wb-breadcrumb-separator-space, 14px);
  }
  .wb-cms-dynamic-breadcrumb__item:last-child .wb-cms-dynamic-breadcrumb__link {
    color: var(--wb-breadcrumb-current-color, #202020);
    pointer-events: none;
  }
  .wb-cms-dynamic-breadcrumb__item.is-current .wb-cms-dynamic-breadcrumb__link {
    color: var(--wb-breadcrumb-current-color, #202020);
    pointer-events: none;
  }
  .wb-cms-dynamic-breadcrumb__item:last-child .wb-cms-dynamic-breadcrumb__separator {
    display: none;
  }
  .wb-cms-dynamic-breadcrumb__item.is-current .wb-cms-dynamic-breadcrumb__separator {
    display: none;
  }
  @media (max-width: 640px) {
    .wb-cms-dynamic-breadcrumb {
      font-size: var(--wb-breadcrumb-mobile-font-size, 12px);
    }
    .wb-cms-dynamic-breadcrumb__separator {
      margin: 0 var(--wb-breadcrumb-mobile-separator-space, 8px);
    }
  }

  /* ───────── 动态 HTML：保留后台富文本原生样式 ─────────
   * 富文本里的 h1–h6 / p / ul / ol / blockquote 等元素默认会被外层模板
   * （如 .wb-cms-detail-content h2 {...} / 全局 reset）覆盖，导致字号、
   * 粗细、列表缩进、段落 margin 等丢失。这里把这些标签 \`all: revert\`
   * 到浏览器 UA 默认值，等效于"什么都不加样式"，从而展示后台富文本
   * 自己带的 inline style / 原生观感；用户自定义样式（更高权重或
   * inline style）仍可覆盖。
   */
  [data-wb-dynamic="html"] {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  [data-wb-dynamic="html"] h1,
  [data-wb-dynamic="html"] h2,
  [data-wb-dynamic="html"] h3,
  [data-wb-dynamic="html"] h4,
  [data-wb-dynamic="html"] h5,
  [data-wb-dynamic="html"] h6,
  [data-wb-dynamic="html"] p,
  [data-wb-dynamic="html"] ul,
  [data-wb-dynamic="html"] ol,
  [data-wb-dynamic="html"] li,
  [data-wb-dynamic="html"] dl,
  [data-wb-dynamic="html"] dt,
  [data-wb-dynamic="html"] dd,
  [data-wb-dynamic="html"] blockquote,
  [data-wb-dynamic="html"] pre,
  [data-wb-dynamic="html"] code,
  [data-wb-dynamic="html"] hr,
  [data-wb-dynamic="html"] table,
  [data-wb-dynamic="html"] thead,
  [data-wb-dynamic="html"] tbody,
  [data-wb-dynamic="html"] tr,
  [data-wb-dynamic="html"] th,
  [data-wb-dynamic="html"] td,
  [data-wb-dynamic="html"] figure,
  [data-wb-dynamic="html"] figcaption,
  [data-wb-dynamic="html"] strong,
  [data-wb-dynamic="html"] b,
  [data-wb-dynamic="html"] em,
  [data-wb-dynamic="html"] i,
  [data-wb-dynamic="html"] small,
  [data-wb-dynamic="html"] sub,
  [data-wb-dynamic="html"] sup,
  [data-wb-dynamic="html"] mark,
  [data-wb-dynamic="html"] a {
    all: revert;
  }
  /* 媒体元素额外保证响应式，不破坏排版 */
  [data-wb-dynamic="html"] img,
  [data-wb-dynamic="html"] video,
  [data-wb-dynamic="html"] iframe {
    max-width: 100%;
    height: auto;
  }
  /* 代码块保留换行 + 横向滚动，避免撑开容器 */
  [data-wb-dynamic="html"] pre {
    white-space: pre-wrap;
    overflow-x: auto;
  }
  /* 表格占满容器宽度，保持富文本内表格可读 */
  [data-wb-dynamic="html"] table {
    width: 100%;
    border-collapse: collapse;
  }

  /* ───────── 文章目录（TOC） ───────── */
  .wb-cms-dynamic-toc {
    display: block;
    box-sizing: border-box;
    color: #111827;
  }
  .wb-cms-dynamic-toc__list {
    display: block;
    margin: 0;
    padding-left: 1.2em;
    list-style: disc;
  }
  .wb-cms-dynamic-toc__item {
    margin: 0;
  }
  .wb-cms-dynamic-toc__link {
    color: inherit;
    font-size: 14px;
    line-height: 2em;
    text-decoration: none;
    transition: color 0.15s;
    word-break: break-word;
  }
  .wb-cms-dynamic-toc__link:hover {
    color: #3C53E8;
  }
  .wb-cms-dynamic-toc__item[aria-current="true"] .wb-cms-dynamic-toc__link,
  .wb-cms-dynamic-toc__item.is-active .wb-cms-dynamic-toc__link {
    color: #3C53E8;
    font-weight: 500;
  }
`
export const DYNAMIC_FIELD_STYLE_KEY = 'data-wb-dynamic'
