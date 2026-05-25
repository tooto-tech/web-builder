import type { GrapesEditor } from '../../../../types/editor'
import { WB_SSG_FIELD_TYPE } from '@/components/WebBuilder/components/registries/dynamic/ssgField'

export const WB_BLOG_LIST_TYPE = 'wb-blog-list'

export function registerBlogListComponent(editor: GrapesEditor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_BLOG_LIST_TYPE)) return

  if (!(editor as any)._wbBlogListStyleInjected) {
    editor.addStyle?.(`
      [data-wb-component="blog-list"] {
        display: block;
        width: 100%;
        min-height: 120px;
      }
      [data-wb-component="blog-list"] > .wb-blog-list-editor-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: #dbeafe;
        border-bottom: 1px solid #93c5fd;
        border-radius: 4px 4px 0 0;
        font-size: 11px;
        color: #1d4ed8;
        pointer-events: none;
        user-select: none;
      }
    `)
    ;(editor as any)._wbBlogListStyleInjected = true
  }

  domComponents.addType(WB_BLOG_LIST_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'blog-list'
        ? { type: WB_BLOG_LIST_TYPE }
        : false,

    model: {
      defaults: {
        name: '博客列表（SSG）',
        tagName: 'div',
        draggable: '*',
        droppable: true,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'blog-list',
        },
        style: {
          display: 'block',
          width: '100%',
        },

        // ── SSG 配置属性 ──
        ssgEndpoint: '',
        ssgItemsPath: 'list',
        ssgPageSize: 10,
        ssgSortBy: 'latest',
        ssgLinkField: '',
        ssgLinkPattern: '',

        traits: [
          {
            type: 'text',
            label: 'API 接口路径',
            name: 'ssgEndpoint',
            changeProp: true,
            placeholder: '/api/open/blog/list',
          },
          {
            type: 'text',
            label: '数据路径',
            name: 'ssgItemsPath',
            changeProp: true,
            placeholder: '如: list 或 data.records',
          },
          {
            type: 'number',
            label: '每页数量',
            name: 'ssgPageSize',
            changeProp: true,
            min: 1,
            max: 100,
          },
          {
            type: 'select',
            label: '排序方式',
            name: 'ssgSortBy',
            changeProp: true,
            options: [
              { value: 'latest', label: '最新发布' },
              { value: 'popular', label: '最多浏览' },
              { value: 'default', label: '默认顺序' },
            ],
          },
          {
            type: 'text',
            label: '链接字段',
            name: 'ssgLinkField',
            changeProp: true,
            placeholder: '如: slug 或 id（可选）',
          },
          {
            type: 'text',
            label: '链接格式',
            name: 'ssgLinkPattern',
            changeProp: true,
            placeholder: '如: /blog/[slug]（可选）',
          },
        ],

        // 默认子组件：提示头 + 一张示例卡片
        components: [
          {
            tagName: 'div',
            selectable: false,
            draggable: false,
            droppable: false,
            hoverable: false,
            layerable: false,
            copyable: false,
            removable: false,
            badgable: false,
            highlightable: false,
            attributes: { class: 'wb-blog-list-editor-header' },
            content: '📋 博客列表（发布时由 API 数据填充）—— 在下方设计卡片模板',
          },
          {
            type: WB_SSG_FIELD_TYPE,
          },
        ],
      },

      init(this: any) {
        this.on(
          'change:ssgEndpoint change:ssgItemsPath change:ssgPageSize change:ssgSortBy change:ssgLinkField change:ssgLinkPattern',
          this._syncSsgAttrs,
        )
        this._syncSsgAttrs()
      },

      _syncSsgAttrs(this: any) {
        const endpoint = this.get('ssgEndpoint') || ''
        const itemsPath = this.get('ssgItemsPath') || 'list'
        const pageSize = this.get('ssgPageSize') || 10
        const sortBy = this.get('ssgSortBy') || 'latest'
        const linkField = this.get('ssgLinkField') || ''
        const linkPattern = this.get('ssgLinkPattern') || ''

        this.addAttributes({
          'data-ssg-endpoint': endpoint,
          'data-ssg-items-path': itemsPath,
          'data-ssg-page-size': String(pageSize),
          'data-ssg-sort-by': sortBy,
          ...(linkField && { 'data-ssg-link-field': linkField }),
          ...(linkPattern && { 'data-ssg-link-pattern': linkPattern }),
        })
      },
    },
  })
}
