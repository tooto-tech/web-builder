import type { GrapesEditor } from '../../../../../types/editor'
import { WB_CMS_POST_DETAIL_TYPE } from '../constants'
import {
  WB_CMS_DYN_DATETIME_TYPE,
  WB_CMS_DYN_HTML_TYPE,
  WB_CMS_DYN_IF_TYPE,
  WB_CMS_DYN_IMAGE_TYPE,
  WB_CMS_DYN_LINK_TYPE,
  WB_CMS_DYN_REPEAT_TYPE,
  WB_CMS_DYN_SEO_TYPE,
  WB_CMS_DYN_TEXT_TYPE,
} from '../dynamicField'
import { registerDetailCmsComponent } from '../helpers'

export function registerCmsPostDetail(editor: GrapesEditor) {
  registerDetailCmsComponent(editor, {
    type: WB_CMS_POST_DETAIL_TYPE,
    dataWbComponent: 'cms-post-detail',
    dataCmsComponent: 'post-detail',
    name: '文章详情',
    styleKey: 'wb-cms-post-detail',
    headerClass: 'wb-cms-detail-header',
    headerContent: '📄 文章详情模板 — 每篇文章生成一个独立页面（含目录 / 相关文章 / SEO meta）',
    bodyClass: 'wb-cms-detail-shell',
    defaultAttributes: {
      'data-show-sidebar': 'true',
    },
    defaultProps: {
      showSidebar: true,
    },
    traits: [
      {
        type: 'checkbox',
        label: '显示右侧栏',
        name: 'showSidebar',
        changeProp: true,
      },
    ],
    watchProps: ['showSidebar'],
    syncAttrs: (model: any) => ({
      'data-show-sidebar': String(model.get('showSidebar') !== false),
    }),
    styles: `
      .wb-cms-detail-shell {
        display:block;
      }
      .wb-cms-detail-layout {
        display:grid;
        grid-template-columns:minmax(0, 1fr) 320px;
        gap:40px;
        align-items:start;
      }
      .wb-cms-detail-main {
        min-width:0;
        border-right: 1px solid #D5D5D5;
        padding-right: 36px;
      }
      .wb-cms-detail-title {
        font-size:36px;font-weight:600;color:#111827;margin-bottom:12px;line-height:1.2;
      }
      .wb-cms-detail-meta {
        display:flex;flex-wrap:wrap;gap:12px;align-items:center;
        font-size:13px;color:#6b7280;margin-bottom:20px;
      }
      .wb-cms-detail-date {
        display:inline-flex;align-items:center;gap:6px;
      }
      .wb-cms-detail-author {
        display:inline-flex;align-items:center;gap:6px;
      }
      .wb-cms-detail-cover {
        width:100%;aspect-ratio:16/9;background:#f3f4f6;display:flex;
        align-items:center;justify-content:center;color:#9ca3af;font-size:14px;
        border-radius:6px;margin-bottom:20px;overflow:hidden;
      }
      .wb-cms-detail-cover > img {
        width:100%;
        height:100%;
        object-fit:cover;
        border-radius:6px;
      }
      .wb-cms-detail-cover > [data-wb-dynamic="image"] {
        width:100% !important;
        height:100% !important;
      }
      .wb-cms-detail-content {
        font-size:15px;line-height:1.8;color:#374151;
      }
      .wb-cms-detail-nav {
        display:grid;
        grid-template-columns:repeat(2, minmax(0, 1fr));
        gap:16px;
        margin-top:28px;
        padding-top:24px;
        border-top:1px solid #e5e7eb;
      }
      .wb-cms-detail-nav-link {
        display:flex;
        flex-direction:column;
        gap:6px;
        padding:12px 14px;
        border-radius:10px;
        border:1px solid #e5e7eb;
        text-decoration:none;
        color:inherit;
        background:#fff;
        transition:box-shadow .15s, border-color .15s;
      }
      .wb-cms-detail-nav-link:hover {
        border-color:#cbd5f5;
        box-shadow:0 6px 18px rgba(15, 23, 42, 0.08);
      }
      .wb-cms-detail-nav-label {
        font-size:11px;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:#6b7280;
      }
      .wb-cms-detail-nav-title {
        font-size:14px;
        font-weight:600;
        color:#111827;
        line-height:1.4;
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      .wb-cms-detail-content h1,
      .wb-cms-detail-content h2,
      .wb-cms-detail-content h3,
      .wb-cms-detail-content h4 {
        color:#111827;
      }
      .wb-cms-detail-content h2,
      .wb-cms-detail-content h3 {
        scroll-margin-top:24px;
      }
      .wb-cms-detail-sidebar {
        position:sticky;
        top:96px;
        display:flex;
        flex-direction:column;
        gap:0;
      }
      [data-show-sidebar="false"] .wb-cms-detail-layout {
        grid-template-columns:minmax(0, 1fr);
      }
      [data-show-sidebar="false"] .wb-cms-detail-sidebar {
        display:none;
      }
      .wb-cms-detail-side-section + .wb-cms-detail-side-section {
        margin-top:24px;
        padding-top:24px;
        border-top:1px solid #e5e7eb;
      }
      .wb-cms-detail-side-title {
        display:flex;
        align-items:center;
        gap:10px;
        margin:0 0 16px;
        color:#111827;
        font-size:14px;
        line-height: 1.4;
        font-weight:600;
        text-transform:uppercase;
      }
      .wb-cms-detail-side-title::before {
        content:"";
        display:block;
        width:4px;
        height:20px;
        background:#FFE200;
        flex-shrink:0;
      }
      .wb-cms-detail-tags {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
      }
      .wb-cms-detail-tag {
        display:inline-flex;
        align-items:center;
        max-width:100%;
        min-height:28px;
        padding:5px 10px;
        border:1px solid #dbe3f0;
        border-radius:999px;
        background:#f8fafc;
        color:#334155;
        font-size:12px;
        line-height:1.4;
        font-weight:500;
        word-break:break-word;
      }
      .wb-cms-detail-toc-list {
        display:flex;
        flex-direction:column;
        gap:2px;
      }
      .wb-cms-detail-related-list {
        display:flex;
        flex-direction:column;
        gap:12px;
      }
      .wb-cms-detail-toc-item {
        display:block;
      }
      .wb-cms-detail-toc-link {
        display:block;
        color:#4b5563;
        text-decoration:none;
        font-size:13px;
        line-height:1.5;
        padding:6px 10px;
        border-radius:6px;
        transition:background .15s,color .15s;
      }
      .wb-cms-detail-toc-link:hover {
        background:#e5e7eb;
        color:#111827;
      }
      .wb-cms-detail-related-card {
        display:block;
      }
      .wb-cms-detail-related-link {
        display:flex;
        gap:12px;
        align-items:flex-start;
        color:inherit;
        text-decoration:none;
        padding:8px;
        border-radius:10px;
        transition:background .15s;
      }
      .wb-cms-detail-related-link:hover {
        background:#f3f4f6;
      }
      .wb-cms-detail-related-thumb {
        display:block;
        width:72px;
        height:54px;
        border-radius:2px;
        object-fit:cover;
        flex-shrink:0;
        background:#e5e7eb;
        overflow:hidden;
      }
      .wb-cms-detail-related-thumb > img,
      .wb-cms-detail-related-thumb[data-wb-dynamic="image"] {
        width:100% !important;
        height:100% !important;
        object-fit:cover;
        display:block;
      }
      .wb-cms-detail-related-info {
        flex:1;
        min-width:0;
      }
      .wb-cms-detail-related-title {
        font-size:13px;
        font-weight:500;
        color:#1f2937;
        line-height:1.4;
        display:-webkit-box;
        -webkit-line-clamp:1;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      .wb-cms-detail-related-excerpt {
        font-size:12px;
        color:#9ca3af;
        font-weight: 300;
        line-height:1.5;
        margin-top:4px;
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      @media (max-width: 1023px) {
        .wb-cms-detail-layout {
          grid-template-columns:minmax(0, 1fr);
          gap:28px;
        }
        .wb-cms-detail-sidebar {
          position:static;
          top:auto;
          flex-direction:row;
          flex-wrap:wrap;
        }
        .wb-cms-detail-side-section {
          flex:1 1 240px;
        }
        .wb-cms-detail-side-section + .wb-cms-detail-side-section {
          margin-top:0;
          padding-top:0;
          border-top:none;
        }
        .wb-cms-detail-title { font-size:24px; }
        .wb-cms-detail-meta,
        .wb-cms-detail-cover { margin-bottom:16px; }
        .wb-cms-detail-nav { grid-template-columns:minmax(0, 1fr); }
      }
      @media (max-width: 767px) {
        .wb-cms-detail-title { font-size:22px; }
        .wb-cms-detail-content { font-size:14px; line-height:1.7; }
        .wb-cms-detail-sidebar {
          padding:16px;
          flex-direction:column;
        }
        .wb-cms-detail-tags { gap:7px; }
        .wb-cms-detail-tag {
          min-height:26px;
          padding:4px 9px;
        }
        .wb-cms-detail-related-thumb {
          width:60px;
          height:45px;
        }
        .wb-cms-detail-related-thumb > img,
        .wb-cms-detail-related-thumb[data-wb-dynamic="image"] {
          width:100% !important;
          height:100% !important;
        }
      }
    `,
    bodyComponents: [
      {
        tagName: 'div',
        attributes: { class: 'wb-cms-detail-layout' },
        components: [
          {
            tagName: 'div',
            attributes: { class: 'wb-cms-detail-main' },
            components: [
              {
                type: WB_CMS_DYN_TEXT_TYPE,
                dynField: 'post.name',
                dynTag: 'h1',
                dynFallback: '文章标题（由数据填充）',
                attributes: { class: 'wb-cms-detail-title' },
              },
              {
                tagName: 'div',
                attributes: { class: 'wb-cms-detail-meta' },
                components: [
                  {
                    type: WB_CMS_DYN_DATETIME_TYPE,
                    dynField: 'post.publishTime',
                    dynFormat: 'yyyy-MM-dd',
                    attributes: { class: 'wb-cms-detail-date' },
                  },
                ],
              },
              {
                type: WB_CMS_DYN_IF_TYPE,
                dynField: 'post.image',
                dynMode: 'truthy',
                components: [
                  {
                    tagName: 'div',
                    attributes: { class: 'wb-cms-detail-cover' },
                    components: [
                      {
                        type: WB_CMS_DYN_IMAGE_TYPE,
                        dynSrcField: 'post.image',
                        dynAltField: 'post.imageAlt',
                        dynObjectFit: 'cover',
                        attributes: {
                          alt: '封面图',
                          style:
                            'width:100%;height:100%;object-fit:cover;border-radius:6px;',
                        },
                      },
                    ],
                  },
                ],
              },
              {
                type: WB_CMS_DYN_HTML_TYPE,
                dynField: 'post.content',
                attributes: { class: 'wb-cms-detail-content' },
              },
              {
                tagName: 'nav',
                // `prevPost||nextPost` 不是字段粒度的条件，无法映射到 WB_CMS_DYN_IF_TYPE
                // 的单字段下拉；这里保留为装饰容器上的 data-cms-if 原始表达式。
                attributes: { class: 'wb-cms-detail-nav', 'data-cms-if': 'prevPost||nextPost' },
                components: [
                  {
                    type: WB_CMS_DYN_IF_TYPE,
                    dynField: 'prevPost.url',
                    dynMode: 'truthy',
                    components: [
                      {
                        type: WB_CMS_DYN_LINK_TYPE,
                        dynHrefField: 'prevPost.url',
                        dynTarget: '_self',
                        attributes: { class: 'wb-cms-detail-nav-link' },
                        components: [
                          {
                            tagName: 'span',
                            attributes: { class: 'wb-cms-detail-nav-label' },
                            content: 'Previous',
                          },
                          {
                            type: WB_CMS_DYN_TEXT_TYPE,
                            dynField: 'prevPost.name',
                            dynTag: 'span',
                            dynFallback: '上一条文章',
                            attributes: { class: 'wb-cms-detail-nav-title' },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: WB_CMS_DYN_IF_TYPE,
                    dynField: 'nextPost.url',
                    dynMode: 'truthy',
                    components: [
                      {
                        type: WB_CMS_DYN_LINK_TYPE,
                        dynHrefField: 'nextPost.url',
                        dynTarget: '_self',
                        attributes: { class: 'wb-cms-detail-nav-link' },
                        components: [
                          {
                            tagName: 'span',
                            attributes: { class: 'wb-cms-detail-nav-label' },
                            content: 'Next',
                          },
                          {
                            type: WB_CMS_DYN_TEXT_TYPE,
                            dynField: 'nextPost.name',
                            dynTag: 'span',
                            dynFallback: '下一条文章',
                            attributes: { class: 'wb-cms-detail-nav-title' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            tagName: 'aside',
            attributes: { class: 'wb-cms-detail-sidebar' },
            components: [
              {
                tagName: 'section',
                attributes: {
                  class: 'wb-cms-detail-side-section',
                  'data-cms-if': '!#lists.isEmpty(post.tags)',
                },
                components: [
                  {
                    tagName: 'h3',
                    attributes: { class: 'wb-cms-detail-side-title' },
                    content: 'TAGS',
                  },
                  {
                    type: WB_CMS_DYN_REPEAT_TYPE,
                    dynSource: 'tag@post.tags',
                    dynContainerTag: 'div',
                    dynItemTag: 'span',
                    dynLayout: 'none',
                    attributes: { class: 'wb-cms-detail-tags' },
                    components: [
                      {
                        tagName: 'span',
                        attributes: {
                          class: 'wb-cms-detail-tag',
                          'data-wb-dynamic': 'repeat-item',
                        },
                        components: [
                          {
                            type: WB_CMS_DYN_TEXT_TYPE,
                            dynField: 'tag.name',
                            dynTag: 'span',
                            dynFallback: 'case stories',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                tagName: 'section',
                // "集合非空"语义目前在 DYNAMIC_FIELD_MAP 里没有对应字段，
                // 保留原来的 MVEL 表达式，让整个 section 只在有 tocItems 时出现。
                attributes: {
                  class: 'wb-cms-detail-side-section',
                  'data-cms-if': '!#lists.isEmpty(tocItems)',
                },
                components: [
                  {
                    tagName: 'h3',
                    attributes: { class: 'wb-cms-detail-side-title' },
                    content: 'TABLE OF CONTENTS',
                  },
                  {
                    type: WB_CMS_DYN_REPEAT_TYPE,
                    dynSource: 'tocItem@tocItems',
                    dynContainerTag: 'div',
                    dynItemTag: 'div',
                    dynLayout: 'none',
                    attributes: { class: 'wb-cms-detail-toc-list' },
                    components: [
                      {
                        tagName: 'div',
                        attributes: {
                          class: 'wb-cms-detail-toc-item',
                          'data-wb-dynamic': 'repeat-item',
                        },
                        components: [
                          {
                            type: WB_CMS_DYN_LINK_TYPE,
                            dynHrefField: 'tocItem.href',
                            dynTextField: 'tocItem.text',
                            dynTarget: '_self',
                            attributes: { class: 'wb-cms-detail-toc-link' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                tagName: 'section',
                attributes: {
                  class: 'wb-cms-detail-side-section',
                  'data-cms-if': '!#lists.isEmpty(relatedPosts)',
                },
                components: [
                  {
                    tagName: 'h3',
                    attributes: { class: 'wb-cms-detail-side-title' },
                    content: 'RELATED ARTICLES',
                  },
                  {
                    type: WB_CMS_DYN_REPEAT_TYPE,
                    dynSource: 'relatedPost@relatedPosts',
                    dynContainerTag: 'div',
                    dynItemTag: 'article',
                    dynLayout: 'none',
                    attributes: { class: 'wb-cms-detail-related-list' },
                    components: [
                      {
                        tagName: 'article',
                        attributes: {
                          class: 'wb-cms-detail-related-card',
                          'data-wb-dynamic': 'repeat-item',
                        },
                        components: [
                          {
                            type: WB_CMS_DYN_LINK_TYPE,
                            dynHrefField: 'relatedPost.url',
                            dynTarget: '_self',
                            attributes: { class: 'wb-cms-detail-related-link' },
                            components: [
                              {
                                type: WB_CMS_DYN_IMAGE_TYPE,
                                dynSrcField: 'relatedPost.image',
                                dynAltField: 'relatedPost.imageAlt',
                                dynObjectFit: 'cover',
                                attributes: {
                                  class: 'wb-cms-detail-related-thumb',
                                  alt: '',
                                  style:
                                    'width:72px;height:54px;border-radius:2px;object-fit:cover;flex-shrink:0;background:#e5e7eb;',
                                },
                              },
                              {
                                tagName: 'div',
                                attributes: { class: 'wb-cms-detail-related-info' },
                                components: [
                                  {
                                    type: WB_CMS_DYN_TEXT_TYPE,
                                    dynField: 'relatedPost.name',
                                    dynTag: 'div',
                                    dynFallback:
                                      'Wanzai Rubber Achieves New ISO Quality Certification',
                                    attributes: { class: 'wb-cms-detail-related-title' },
                                  },
                                  {
                                    type: WB_CMS_DYN_TEXT_TYPE,
                                    dynField: 'relatedPost.excerpt',
                                    dynTag: 'div',
                                    dynFallback:
                                      'We are proud to announce our successful recertification...',
                                    attributes: { class: 'wb-cms-detail-related-excerpt' },
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: WB_CMS_DYN_SEO_TYPE,
        dynTitleField: 'post.name',
        dynKeywordsField: 'post.metaKeywords',
        dynDescriptionField: 'post.metaDescription',
      },
    ],
  })
}
