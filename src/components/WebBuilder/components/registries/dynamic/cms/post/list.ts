/**
 * CMS 文章列表 — WYSIWYG 重构版
 *
 * 拆分为 Post List（列表容器）+ Post Card（可编辑卡片）两个组件。
 * 编辑器 HTML = 发布 HTML，不再需要 publishTemplate。
 *
 * 不走 cmsFactory，参照 menu.ts 模式直接 domComponents.addType。
 */
import type { GrapesEditor } from '../../../../../types/editor'
import { getPost, getPostPage } from '@/api/content/post/index'
import { getAllPostCategoryList } from '@/api/content/postCategory'
import {
  makePaginationNav,
  PAGINATION_TRAITS,
  PAGINATION_PROPS,
  PAGINATION_ATTRS,
  syncPaginationAttrs,
  registerCmsTypeEntry
} from '@/components/WebBuilder/utils/cmsFactory'
import { POST_CARD_CSS } from './styles'

export { POST_CARD_CSS } from './styles'

export const WB_CMS_POST_LIST_TYPE = 'wb-cms-post-list'
export const WB_CMS_POST_CARD_TYPE = 'wb-cms-post-card'
export const WB_CMS_CASES_LIST_TYPE = 'wb-cms-cases-list'
export const WB_CMS_CASES_CARD_TYPE = 'wb-cms-cases-card'

type PostCategoryTraitOption = {
  value: string
  label: string
}

type PostCardType = 'post' | 'cases'

const POST_CARD_DEFAULT_LINK_TEXT = 'View More'
const DEFAULT_PREVIEW_POST = {
  title: 'Introduction To The Functions Of Color Masterbatch',
  excerpt: 'Discover smart investment strategies to streamline and organize your portfolio.',
  image: 'https://placehold.co/402x308?text=Blog',
  alt: 'blog post',
  date: '2023-01-01',
  url: '#'
}

const POST_CARD_TYPE_OPTIONS = [
  { value: 'post', label: '文章' },
  { value: 'cases', label: '案例' }
]

const POST_LOOP_ITEM_TYPE_OPTIONS = [
  { value: 'post', label: '文章循环体' },
  { value: 'postCategory', label: '文章分类循环体' }
]

const POST_CATEGORY_LOOP_MODE_OPTIONS = [
  { value: 'root', label: '一级分类' },
  { value: 'childrenOf', label: '指定父级的下级' },
  { value: 'descendantsOf', label: '指定父级下全部子分类' },
  { value: 'currentChildren', label: '当前分类下级' },
  { value: 'currentDescendants', label: '当前分类全部子分类' }
]

let postCategoryTraitOptionsPromise: Promise<PostCategoryTraitOption[]> | null = null

async function loadPostCategoryTraitOptions(): Promise<PostCategoryTraitOption[]> {
  const list = await getAllPostCategoryList()
  const normalized = Array.isArray(list) ? list : []
  const byId = new Map<number, any>()
  normalized.forEach((item) => {
    const id = Number(item?.id)
    if (Number.isFinite(id)) {
      byId.set(id, item)
    }
  })

  const labelOf = (id: number): string => {
    const item = byId.get(id)
    if (!item) return `#${id}`
    const parentId = Number(item?.parentId ?? 0)
    if (parentId > 0 && byId.has(parentId)) {
      return `${labelOf(parentId)} / ${String(item?.name ?? '').trim() || `#${id}`}`
    }
    return String(item?.name ?? '').trim() || `#${id}`
  }

  return normalized
    .filter((item) => item?.id != null && String(item?.name ?? '').trim())
    .sort((a, b) => {
      const sortA = Number(a?.sortOrder ?? 0)
      const sortB = Number(b?.sortOrder ?? 0)
      if (sortA !== sortB) return sortA - sortB
      return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'zh-Hans-CN')
    })
    .map((item) => ({
      value: String(item.id),
      label: labelOf(Number(item.id))
    }))
}

function getPostCategoryTraitOptions(): Promise<PostCategoryTraitOption[]> {
  if (!postCategoryTraitOptionsPromise) {
    postCategoryTraitOptionsPromise = loadPostCategoryTraitOptions().catch((error) => {
      postCategoryTraitOptionsPromise = null
      throw error
    })
  }
  return postCategoryTraitOptionsPromise
}

function parseBoolLike(value: unknown): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

function normalizePostCardType(value: unknown): PostCardType {
  return String(value ?? '').trim() === 'cases' ? 'cases' : 'post'
}

function resolvePostCardTypeFromAttrs(attrs: Record<string, any>): PostCardType {
  return normalizePostCardType(attrs['data-cms-card-type'])
}

function normalizeCardLinkText(value: unknown): string {
  const text = String(value ?? '').trim()
  return text || POST_CARD_DEFAULT_LINK_TEXT
}

function normalizePostHref(rawValue: any): string {
  const value = String(rawValue ?? '').trim()
  if (!value) return ''
  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    /^https?:\/\//i.test(value) ||
    value.startsWith('//')
  ) {
    return value
  }

  return `/${value.replace(/^\.?\//, '')}`
}

function buildStaticPostUrl(post: any): string {
  const explicitUrl = normalizePostHref(
    post?.url ||
      post?.postUrl ||
      post?.detailUrl ||
      post?.link ||
      post?.contents?.[0]?.url ||
      post?.contents?.[0]?.postUrl ||
      post?.contents?.[0]?.detailUrl ||
      post?.contents?.[0]?.link
  )
  if (explicitUrl) return explicitUrl

  const content = post?.contents?.[0] || {}
  const slug = String(content?.slug || post?.slug || '').trim()
  const id = post?.id == null ? '' : String(post.id).trim()
  if (slug) return `/posts/${encodeURIComponent(slug)}.html`
  if (id) return `/posts/${encodeURIComponent(id)}.html`
  return '#'
}

function formatPreviewDate(value: any): string {
  const raw = String(value || '').trim()
  if (!raw) return DEFAULT_PREVIEW_POST.date
  return raw.slice(0, 10)
}

function findComponentByClass(component: any, className: string): any {
  if (!component?.getAttributes || !component?.components) return null

  const attrs = component.getAttributes() || {}
  const classes = String(attrs.class || '')
    .split(/\s+/)
    .map((item: string) => item.trim())
    .filter(Boolean)

  if (classes.includes(className)) return component

  const children = component.components?.().models || []
  for (const child of children) {
    const found = findComponentByClass(child, className)
    if (found) return found
  }

  return null
}

function setComponentVisible(component: any, visible: boolean): void {
  if (!component?.setStyle) return

  const currentStyle = { ...(component.getStyle?.() || {}) }
  if (visible) {
    delete currentStyle.display
  } else {
    currentStyle.display = 'none'
  }
  component.setStyle(currentStyle)
}

function setComponentText(component: any, value: string): void {
  if (!component) return
  const text = String(value ?? '')
  if (component.components?.()?.length) {
    component.components().reset([])
  }
  component.set?.('content', text)
}

function setComponentAttr(component: any, attrs: Record<string, string>): void {
  if (!component?.addAttributes) return
  component.addAttributes(attrs)
}

async function initPreviewPostTrait(model: any): Promise<void> {
  const trait = model.getTrait?.('postId')
  if (!trait) return

  try {
    const data = await getPostPage({ pageNo: 1, pageSize: 100 })
    const list = Array.isArray(data?.list) ? data.list : []
    const options = list.map((item: any) => {
      const content = item?.contents?.[0] || {}
      const name = content?.name || item?.name || ''
      const id = String(item?.id ?? '').trim()
      return {
        value: id,
        label: name ? `${name} (#${id})` : `#${id}`
      }
    })

    trait.set('options', [{ value: '', label: '未选择文章（显示占位）' }, ...options])
  } catch {
    trait.set('options', [
      { value: '', label: '未选择文章（显示占位）' },
      { value: model.get('postId') || '', label: '加载文章列表失败，请手动输入 ID' }
    ])
  }
}

async function syncPostCardData(model: any): Promise<void> {
  const postId = String(model.get('postId') || '').trim()
  const response = postId ? await getPost(Number(postId)).catch(() => null) : null
  const post = response?.post || response || null
  const content = post?.contents?.[0] || {}

  const data = post
    ? {
        title: String(content?.name || post?.name || DEFAULT_PREVIEW_POST.title),
        excerpt: String(content?.excerpt || DEFAULT_PREVIEW_POST.excerpt),
        image: String(post?.image || DEFAULT_PREVIEW_POST.image),
        alt: String(post?.imageAlt || content?.name || post?.name || DEFAULT_PREVIEW_POST.alt),
        date: formatPreviewDate(post?.publishTime || post?.createTime),
        url: buildStaticPostUrl(post)
      }
    : DEFAULT_PREVIEW_POST

  const image = findComponentByClass(model, 'wb-post-card-img')
  const date = findComponentByClass(model, 'wb-post-card-date')
  const title = findComponentByClass(model, 'wb-post-card-title')
  const excerpt = findComponentByClass(model, 'wb-post-card-excerpt')
  const link = findComponentByClass(model, 'wb-post-card-link')

  setComponentAttr(image, { src: data.image, alt: data.alt })
  setComponentText(date, data.date)
  setComponentText(title, data.title)
  setComponentText(excerpt, data.excerpt)
  setComponentAttr(link, { href: data.url })
}

const POST_CARD_TRAITS = [
  {
    type: 'select',
    label: '选择文章',
    name: 'postId',
    changeProp: true,
    options: [{ value: '', label: '未选择文章（显示占位）' }]
  },
  {
    type: 'checkbox',
    label: '显示日期',
    name: 'cmsShowDate',
    changeProp: true
  },
  {
    type: 'checkbox',
    label: '显示标题',
    name: 'cmsShowTitle',
    changeProp: true
  },
  {
    type: 'checkbox',
    label: '显示摘要',
    name: 'cmsShowExcerpt',
    changeProp: true
  },
  {
    type: 'text',
    label: '按钮文案',
    name: 'cmsLinkText',
    changeProp: true,
    placeholder: POST_CARD_DEFAULT_LINK_TEXT
  }
]

async function initPostCategorySelectTrait(model: any): Promise<void> {
  const trait = model.getTrait?.('cmsCategoryId')
  if (!trait) return

  const currentValue = String(model.get('cmsCategoryId') ?? '').trim()

  try {
    const options = await getPostCategoryTraitOptions()
    const traitOptions: PostCategoryTraitOption[] = [
      { value: '', label: '全部文章分类' },
      ...options
    ]

    if (currentValue && !traitOptions.some((item) => item.value === currentValue)) {
      traitOptions.push({
        value: currentValue,
        label: `当前文章分类 (#${currentValue})`
      })
    }

    trait.set('options', traitOptions)
  } catch {
    const fallbackOptions: PostCategoryTraitOption[] = [{ value: '', label: '全部文章分类' }]

    if (currentValue) {
      fallbackOptions.push({
        value: currentValue,
        label: `当前文章分类 (#${currentValue})`
      })
    }

    trait.set('options', fallbackOptions)
  }
}

const CASES_CARD_CSS = `
  .wb-cases-card .wb-post-card-body { padding-top: 14px; padding-bottom: 14px; }
  .wb-cases-card .wb-post-card-title { margin-bottom: 10px; white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .wb-cases-card .wb-post-card-link { color: #7b8794; text-decoration: underline; text-underline-offset: 2px; }
  .wb-cases-card .wb-post-card-link::after { content:''; position:absolute; inset:0; }
  @media (max-width: 767px) {
    .wb-cases-card .wb-post-card-body { padding-top: 12px; padding-bottom: 12px; }
    .wb-cases-card .wb-post-card-title { margin-bottom: 8px; }
  }
`

export function buildPostCardComponents() {
  return [
    {
      tagName: 'div',
      attributes: { class: 'wb-post-card-img-wrap' },
      components: [
        {
          tagName: 'img',
          attributes: {
            class: 'wb-post-card-img',
            'data-cms-bind-src': 'post.image',
            'data-cms-bind-alt': 'post.name',
            src: 'https://placehold.co/402x308?text=Blog',
            alt: 'blog post'
          }
        }
      ]
    },
    {
      tagName: 'div',
      attributes: { class: 'wb-post-card-body' },
      components: [
        {
          tagName: 'span',
          attributes: {
            class: 'wb-post-card-date',
            'data-cms-bind': 'post.publishTime',
            'data-cms-format': 'yyyy-MM-dd'
          },
          content: 'Jan 01, 2023'
        },
        {
          tagName: 'h4',
          attributes: { class: 'wb-post-card-title', 'data-cms-bind': 'post.name' },
          content: 'Introduction To The Functions Of Color Masterbatch'
        },
        {
          tagName: 'p',
          attributes: { class: 'wb-post-card-excerpt', 'data-cms-bind': 'post.excerpt' },
          content:
            'Discover smart investment strategies to streamline and organize your portfolio..'
        },
        {
          tagName: 'a',
          attributes: {
            class: 'wb-post-card-link',
            href: '#',
            'data-cms-bind-href': 'post.url'
          },
          content: POST_CARD_DEFAULT_LINK_TEXT
        }
      ]
    }
  ]
}

export function buildCasesCardComponents() {
  return [
    {
      tagName: 'div',
      attributes: { class: 'wb-post-card-img-wrap' },
      components: [
        {
          tagName: 'img',
          attributes: {
            class: 'wb-post-card-img',
            'data-cms-bind-src': 'post.image',
            'data-cms-bind-alt': 'post.name',
            src: 'https://placehold.co/402x308?text=Cases',
            alt: 'case post'
          }
        }
      ]
    },
    {
      tagName: 'div',
      attributes: { class: 'wb-post-card-body' },
      components: [
        {
          tagName: 'h4',
          attributes: { class: 'wb-post-card-title', 'data-cms-bind': 'post.name' },
          content: 'Luxury Seaside Hotel'
        },
        {
          tagName: 'a',
          attributes: {
            class: 'wb-post-card-link',
            href: '#',
            'data-cms-bind-href': 'post.url'
          },
          content: POST_CARD_DEFAULT_LINK_TEXT
        }
      ]
    }
  ]
}

const POST_LIST_CSS = `
  .wb-post-list {
    display: grid;
    width: 100%;
    min-height: 120px;
    row-gap: 24px;
  }
  .wb-post-list__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 42px 16px;
  }
  .wb-post-list-grid {
    display: block;
    width: 100%;
    min-height: 120px;
  }
  .wb-post-list-empty {
    grid-column: 1 / -1;
    padding: 24px 0;
    text-align: center;
    color: #6b7280;
  }
  .wb-post-list > .wb-post-list-tag-filter,
  .wb-post-list-grid > .wb-post-list-tag-filter {
    grid-column: 1 / -1;
    display: none;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }
  .wb-post-list > .wb-post-list-tag-filter.is-active,
  .wb-post-list-grid > .wb-post-list-tag-filter.is-active {
    display: flex;
  }
  .wb-post-list > .wb-post-list-tag-filter > .wb-post-list-tag-btn,
  .wb-post-list-grid > .wb-post-list-tag-filter > .wb-post-list-tag-btn {
    border: 1px solid #d9dde7;
    background: #fff;
    color: #4b5563;
    border-radius: 6px;
    padding: 8px 14px;
    line-height: 1.2;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .wb-post-list > .wb-post-list-tag-filter > .wb-post-list-tag-btn.is-selected,
  .wb-post-list-grid > .wb-post-list-tag-filter > .wb-post-list-tag-btn.is-selected {
    background: #143b63;
    border-color: #143b63;
    color: #fff;
  }
  .wb-post-list > .wb-post-list-pagination,
  .wb-post-list-grid > .wb-post-list-pagination {
    grid-column: 1 / -1;
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;
    padding: 12px 0 4px;
  }
  .wb-post-list > .wb-post-list-pagination > .wb-post-list-page-btn,
  .wb-post-list > .wb-post-list-pagination > a,
  .wb-post-list > .wb-post-list-pagination > button,
  .wb-post-list > .wb-post-list-pagination > span,
  .wb-post-list-grid > .wb-post-list-pagination > .wb-post-list-page-btn,
  .wb-post-list-grid > .wb-post-list-pagination > a,
  .wb-post-list-grid > .wb-post-list-pagination > button,
  .wb-post-list-grid > .wb-post-list-pagination > span {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #374151;
    text-decoration: none;
  }
  .wb-post-list > .wb-post-list-pagination > .wb-post-list-page-btn.active,
  .wb-post-list > .wb-post-list-pagination > a.active,
  .wb-post-list > .wb-post-list-pagination > button.active,
  .wb-post-list > .wb-post-list-pagination > span.active,
  .wb-post-list-grid > .wb-post-list-pagination > .wb-post-list-page-btn.active,
  .wb-post-list-grid > .wb-post-list-pagination > a.active,
  .wb-post-list-grid > .wb-post-list-pagination > button.active,
  .wb-post-list-grid > .wb-post-list-pagination > span.active {
    background: #264faa;
    color: #fff;
    border-color: #264faa;
  }
  @media (max-width: 1023px) {
    .wb-post-list__grid,
    .wb-post-list-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 32px 16px;
    }
  }
  @media (max-width: 767px) {
    .wb-post-list__grid,
    .wb-post-list-grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 24px;
    }
    .wb-post-list > .wb-post-list-tag-filter,
    .wb-post-list-grid > .wb-post-list-tag-filter {
      gap: 8px;
      margin-bottom: 8px;
    }
    .wb-post-list > .wb-post-list-tag-filter > .wb-post-list-tag-btn,
    .wb-post-list-grid > .wb-post-list-tag-filter > .wb-post-list-tag-btn {
      font-size: 13px;
      padding: 7px 12px;
    }
    .wb-post-list > .wb-post-list-pagination,
    .wb-post-list-grid > .wb-post-list-pagination {
      flex-wrap: wrap;
      padding-top: 8px;
    }
  }
`

export const CASES_LIST_CSS = `
  .wb-cases-list {
    display: grid;
    width: 100%;
    min-height: 120px;
    row-gap: 24px;
  }
  .wb-cases-list__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 24px;
    column-gap: 16px;
  }
  .wb-cases-list > .wb-post-list-tag-filter {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    border: 0;
    border-radius: 0;
    padding: 0;
    margin-bottom: 0;
    gap: 8px;
  }
  .wb-cases-list > .wb-post-list-tag-filter > .wb-post-list-tag-check {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 180px;
    padding: 6px 10px;
    border: 1px solid #d9dde7;
    border-radius: 4px;
    background: #fff;
    color: #4b5563;
    font-size: 14px;
    line-height: 1.2;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .wb-cases-list > .wb-post-list-tag-filter > .wb-post-list-tag-check .wb-post-list-tag-checkbox {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: #143b63;
    cursor: pointer;
    flex: 0 0 auto;
  }
  .wb-cases-list > .wb-post-list-tag-filter > .wb-post-list-tag-check.is-selected {
    border-color: #143b63;
    color: #143b63;
    background: #f3f8ff;
  }
  .wb-cases-list > .wb-post-list-pagination {
    display: flex;
    justify-content: center;
    gap: 6px;
    align-items: center;
    padding: 12px 0 4px;
  }
  .wb-cases-list > .wb-post-list-pagination > .wb-post-list-page-btn,
  .wb-cases-list > .wb-post-list-pagination > a,
  .wb-cases-list > .wb-post-list-pagination > button,
  .wb-cases-list > .wb-post-list-pagination > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid #d9dde7;
    border-radius: 4px;
    background: #fff;
    color: #374151;
    font-size: 14px;
    line-height: 1;
    text-decoration: none;
  }
  .wb-cases-list > .wb-post-list-pagination > .wb-post-list-page-btn.active,
  .wb-cases-list > .wb-post-list-pagination > a.active,
  .wb-cases-list > .wb-post-list-pagination > button.active,
  .wb-cases-list > .wb-post-list-pagination > span.active {
    border-color: #143b63;
    background: #143b63;
    color: #fff;
  }
  @media (max-width: 767px) {
    .wb-cases-list__grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    .wb-cases-list > .wb-post-list-tag-filter {
      padding: 0;
      margin-bottom: 0;
    }
    .wb-cases-list > .wb-post-list-tag-filter > .wb-post-list-tag-check {
      min-width: 0;
      width: 100%;
    }
  }
`

export function registerCmsPostListComponents(editor: GrapesEditor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents) return

  if (!domComponents.getType(WB_CMS_POST_CARD_TYPE)) {
    domComponents.addType(WB_CMS_POST_CARD_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-post-card'
          ? { type: WB_CMS_POST_CARD_TYPE }
          : false,

      model: {
        defaults: {
          name: '文章卡片',
          tagName: 'div',
          draggable:
            '[data-wb-post-grid], [data-wb-component="cms-post-list"], [data-wb-component="cms-post-latest"]',
          droppable: true,
          selectable: true,
          editable: false,
          stylable: true,
          styles: POST_CARD_CSS,
          attributes: {
            'data-wb-component': 'cms-post-card',
            'data-cms-repeat': 'post',
            'data-show-date': 'true',
            'data-show-title': 'true',
            'data-show-excerpt': 'true',
            'data-link-text': POST_CARD_DEFAULT_LINK_TEXT,
            'data-post-id': '',
            class: 'wb-post-card'
          },
          postId: '',
          cmsShowDate: true,
          cmsShowTitle: true,
          cmsShowExcerpt: true,
          cmsLinkText: POST_CARD_DEFAULT_LINK_TEXT,
          traits: POST_CARD_TRAITS,
          components: buildPostCardComponents()
        },

        init(this: any) {
          this._hydratePropsFromAttrs()
          this.on(
            'change:postId change:cmsShowDate change:cmsShowTitle change:cmsShowExcerpt change:cmsLinkText',
            this._syncCardSettings
          )
          this.on('change:postId', this._loadPostData)
          this._syncCardSettings()
          void initPreviewPostTrait(this)
          void this._loadPostData()
        },

        _hydratePropsFromAttrs(this: any) {
          const attrs = this.getAttributes?.() || {}
          const readFlag = (name: string, fallback: boolean) => {
            const raw = String(attrs[name] ?? '').trim()
            if (!raw) return fallback
            return parseBoolLike(raw)
          }
          const linkEl = findComponentByClass(this, 'wb-post-card-link')
          const currentLinkText = String(linkEl?.get?.('content') ?? '').trim()

          this.set(
            {
              cmsShowDate: readFlag('data-show-date', true),
              cmsShowTitle: readFlag('data-show-title', true),
              cmsShowExcerpt: readFlag('data-show-excerpt', true),
              postId: String(attrs['data-post-id'] ?? '').trim(),
              cmsLinkText: normalizeCardLinkText(attrs['data-link-text'] || currentLinkText)
            },
            { silent: true }
          )
        },

        _syncCardSettings(this: any) {
          const showDate = this.get('cmsShowDate') !== false
          const showTitle = this.get('cmsShowTitle') !== false
          const showExcerpt = this.get('cmsShowExcerpt') !== false
          const linkText = normalizeCardLinkText(this.get('cmsLinkText'))

          setComponentVisible(findComponentByClass(this, 'wb-post-card-date'), showDate)
          setComponentVisible(findComponentByClass(this, 'wb-post-card-title'), showTitle)
          setComponentVisible(findComponentByClass(this, 'wb-post-card-excerpt'), showExcerpt)
          setComponentText(findComponentByClass(this, 'wb-post-card-link'), linkText)

          this.addAttributes({
            'data-post-id': String(this.get('postId') || ''),
            'data-show-date': showDate ? 'true' : 'false',
            'data-show-title': showTitle ? 'true' : 'false',
            'data-show-excerpt': showExcerpt ? 'true' : 'false',
            'data-link-text': linkText
          })
        },

        async _loadPostData(this: any) {
          await syncPostCardData(this)
        }
      }
    })
  }

  if (!domComponents.getType(WB_CMS_POST_LIST_TYPE)) {
    domComponents.addType(WB_CMS_POST_LIST_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-post-list'
          ? { type: WB_CMS_POST_LIST_TYPE }
          : false,

      model: {
        defaults: {
          name: '文章列表',
          tagName: 'div',
          draggable: '*',
          droppable: false,
          selectable: true,
          editable: false,
          stylable: true,
          attributes: {
            'data-wb-component': 'cms-post-list',
            'data-cms-component': 'post-list',
            'data-category-id': '',
            'data-enable-tag-filter': 'false',
            'data-loop-item-type': 'post',
            'data-loop-item-template-resource-id': '',
            'data-category-loop-mode': 'root',
            'data-category-parent-id': '',
            'data-category-click-target': 'contentList',
            'data-type-code': '',
            class: 'wb-post-list',
            ...PAGINATION_ATTRS
          },
          styles: POST_LIST_CSS,
          style: {
            display: 'grid',
            'row-gap': '24px'
          },
          cmsCategoryId: '',
          cmsEnableTagFilter: false,
          cmsCardType: 'post',
          cmsLoopItemType: 'post',
          cmsLoopItemTemplateResourceId: '',
          cmsCategoryLoopMode: 'root',
          cmsCategoryParentId: '',
          cmsCategoryClickTarget: 'contentList',
          cmsTypeCode: '',
          ...PAGINATION_PROPS,
          traits: [
            {
              type: 'select',
              label: '文章分类',
              name: 'cmsCategoryId',
              changeProp: true,
              options: [{ value: '', label: '全部文章分类' }]
            },
            {
              type: 'select',
              label: '卡片类型',
              name: 'cmsCardType',
              changeProp: true,
              options: POST_CARD_TYPE_OPTIONS
            },
            {
              type: 'text',
              label: '文章类型 Code',
              name: 'cmsTypeCode',
              changeProp: true,
              placeholder: 'insights'
            },
            {
              type: 'select',
              label: '循环体类型',
              name: 'cmsLoopItemType',
              changeProp: true,
              options: POST_LOOP_ITEM_TYPE_OPTIONS
            },
            {
              type: 'loop-item-template-select',
              label: '循环体资源ID',
              name: 'cmsLoopItemTemplateResourceId',
              changeProp: true
            },
            {
              type: 'select',
              label: '分类循环内容',
              name: 'cmsCategoryLoopMode',
              changeProp: true,
              options: POST_CATEGORY_LOOP_MODE_OPTIONS
            },
            {
              type: 'text',
              label: '指定父级ID',
              name: 'cmsCategoryParentId',
              changeProp: true,
              placeholder: 'childrenOf/descendantsOf 使用'
            },
            {
              type: 'select',
              label: '分类点击效果',
              name: 'cmsCategoryClickTarget',
              changeProp: true,
              options: [
                { value: 'contentList', label: '进入文章列表' },
                { value: 'categoryList', label: '进入下一级分类列表' }
              ]
            },
            {
              type: 'checkbox',
              label: '开启 Tag 筛选',
              name: 'cmsEnableTagFilter',
              changeProp: true
            },
            ...PAGINATION_TRAITS
          ],
          components: [
            {
              tagName: 'div',
              selectable: false,
              editable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              layerable: false,
              attributes: {
                class: 'wb-post-list-tag-filter',
                'data-post-list-tag-filter': 'true'
              }
            },
            {
              tagName: 'div',
              draggable: false,
              droppable: `[data-gjs-type="${WB_CMS_POST_CARD_TYPE}"], [data-wb-component="cms-post-card"]`,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-post-list__grid',
                'data-wb-post-grid': ''
              },
              components: [{ type: WB_CMS_POST_CARD_TYPE }]
            },
            makePaginationNav('wb-post-list-pagination', 'wb-post-list-page-btn', {
              interactiveInEditor: true
            })
          ]
        },

        init(this: any) {
          this._hydratePropsFromAttrs()
          this._applyCardType()
          void initPostCategorySelectTrait(this)
          this.on(
            'change:cmsCategoryId change:cmsEnableTagFilter change:cmsCardType change:cmsTypeCode change:cmsLoopItemType change:cmsLoopItemTemplateResourceId change:cmsCategoryLoopMode change:cmsCategoryParentId change:cmsCategoryClickTarget change:cmsPageSize change:cmsPagination change:cmsMaxPages',
            this._syncAttrs
          )
          this.on('change:cmsCardType', this._applyCardType)
          this._syncAttrs()
        },

        _hydratePropsFromAttrs(this: any) {
          const attrs = this.getAttributes?.() || {}
          const readAttr = (...keys: string[]) => {
            for (const key of keys) {
              const value = String(attrs[key] ?? '').trim()
              if (value) return value
            }
            return ''
          }
          const normalizePositiveInt = (raw: string, fallback: number) => {
            const parsed = Number.parseInt(String(raw || '').trim(), 10)
            return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
          }

          const categoryId = readAttr('data-category-id', 'data-wb-category-id')
          const cardType = resolvePostCardTypeFromAttrs(attrs)
          const enableTagFilterRaw = readAttr(
            'data-enable-tag-filter',
            'data-enable-tag',
            'data-enable-tagfilter'
          )
          const pageSizeRaw = readAttr('data-page-size', 'data-wb-page-size')
          const paginationRaw = readAttr('data-pagination', 'data-wb-pagination')
          const maxPagesRaw = readAttr('data-max-pages', 'data-wb-max-pages')

          this.set(
            {
              cmsCategoryId: categoryId || this.get('cmsCategoryId') || '',
              cmsCardType: cardType,
              cmsLoopItemType:
                readAttr('data-loop-item-type') || this.get('cmsLoopItemType') || 'post',
              cmsLoopItemTemplateResourceId: readAttr('data-loop-item-template-resource-id') || '',
              cmsCategoryLoopMode:
                readAttr('data-category-loop-mode') || this.get('cmsCategoryLoopMode') || 'root',
              cmsCategoryParentId: readAttr('data-category-parent-id') || '',
              cmsCategoryClickTarget:
                readAttr('data-category-click-target') ||
                this.get('cmsCategoryClickTarget') ||
                'contentList',
              cmsTypeCode:
                readAttr('data-type-code', 'data-post-type-code') || this.get('cmsTypeCode') || '',
              cmsEnableTagFilter: enableTagFilterRaw
                ? parseBoolLike(enableTagFilterRaw)
                : parseBoolLike(this.get('cmsEnableTagFilter')),
              cmsPageSize: normalizePositiveInt(pageSizeRaw, Number(this.get('cmsPageSize') || 12)),
              cmsPagination: ['static', 'loadmore', 'none'].includes(paginationRaw)
                ? paginationRaw
                : this.get('cmsPagination') || 'static',
              cmsMaxPages: normalizePositiveInt(maxPagesRaw, Number(this.get('cmsMaxPages') || 10))
            },
            { silent: true }
          )
        },

        _getPostGrid(this: any) {
          const children = this.components?.()
          if (!children) return null

          return (
            children.models?.find((child: any) => {
              const attrs = child.getAttributes?.() || {}
              const className = String(attrs.class || '')
              return (
                attrs['data-wb-post-grid'] !== undefined ||
                className.split(/\s+/).includes('wb-post-list__grid') ||
                className.split(/\s+/).includes('wb-cases-list__grid')
              )
            }) || null
          )
        },

        _buildRootClass(this: any) {
          const attrs = this.getAttributes?.() || {}
          const classes = String(attrs.class || '')
            .split(/\s+/)
            .filter(Boolean)
            .filter(
              (className: string) =>
                !['wb-post-list-grid', 'wb-cases-list-grid', 'wb-cases-list'].includes(className)
            )

          if (!classes.includes('wb-post-list')) classes.unshift('wb-post-list')
          return Array.from(new Set(classes)).join(' ')
        },

        _applyCardType(this: any) {
          const cardType = normalizePostCardType(this.get('cmsCardType'))
          const grid = this._getPostGrid()
          if (!grid) return

          grid.addAttributes?.({
            class: 'wb-post-list__grid',
            'data-wb-post-grid': ''
          })

          const nextType = cardType === 'cases' ? WB_CMS_CASES_CARD_TYPE : WB_CMS_POST_CARD_TYPE
          const components = grid.components?.()
          if (!components) return
          const first = components?.at?.(0)
          const currentType = first?.get?.('type')
          if (!first || [WB_CMS_POST_CARD_TYPE, WB_CMS_CASES_CARD_TYPE].includes(currentType)) {
            if (currentType !== nextType) {
              components.reset([{ type: nextType }])
            }
          }
        },

        _syncAttrs(this: any) {
          const cardType = normalizePostCardType(this.get('cmsCardType'))
          this.addAttributes({
            class: this._buildRootClass(),
            'data-cms-component': 'post-list',
            'data-cms-card-type': cardType,
            'data-category-id': this.get('cmsCategoryId') || '',
            'data-enable-tag-filter': this.get('cmsEnableTagFilter') ? 'true' : 'false',
            'data-loop-item-type': this.get('cmsLoopItemType') || 'post',
            'data-loop-item-template-resource-id': this.get('cmsLoopItemTemplateResourceId') || '',
            'data-category-loop-mode': this.get('cmsCategoryLoopMode') || 'root',
            'data-category-parent-id': this.get('cmsCategoryParentId') || '',
            'data-category-click-target': this.get('cmsCategoryClickTarget') || 'contentList',
            'data-type-code': this.get('cmsTypeCode') || '',
            ...syncPaginationAttrs(this)
          })
        }
      }
    })
  }

  if (!domComponents.getType(WB_CMS_CASES_CARD_TYPE)) {
    domComponents.addType(WB_CMS_CASES_CARD_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-cases-card'
          ? { type: WB_CMS_CASES_CARD_TYPE }
          : false,

      model: {
        defaults: {
          name: 'Cases 卡片',
          tagName: 'div',
          draggable: '[data-wb-post-grid], [data-wb-component="cms-cases-list"]',
          droppable: true,
          selectable: true,
          editable: false,
          stylable: true,
          styles: `${POST_CARD_CSS}\n${CASES_CARD_CSS}`,
          attributes: {
            'data-wb-component': 'cms-cases-card',
            'data-cms-repeat': 'post',
            'data-show-title': 'true',
            'data-link-text': POST_CARD_DEFAULT_LINK_TEXT,
            'data-post-id': '',
            class: 'wb-post-card wb-cases-card'
          },
          postId: '',
          cmsShowTitle: true,
          cmsLinkText: POST_CARD_DEFAULT_LINK_TEXT,
          traits: POST_CARD_TRAITS.filter((trait) =>
            ['postId', 'cmsShowTitle', 'cmsLinkText'].includes(trait.name)
          ),
          components: buildCasesCardComponents()
        },

        init(this: any) {
          this._hydratePropsFromAttrs()
          this.on('change:postId change:cmsShowTitle change:cmsLinkText', this._syncCardSettings)
          this.on('change:postId', this._loadPostData)
          this._syncCardSettings()
          void initPreviewPostTrait(this)
          void this._loadPostData()
        },

        _hydratePropsFromAttrs(this: any) {
          const attrs = this.getAttributes?.() || {}
          const readFlag = (name: string, fallback: boolean) => {
            const raw = String(attrs[name] ?? '').trim()
            if (!raw) return fallback
            return parseBoolLike(raw)
          }
          const linkEl = findComponentByClass(this, 'wb-post-card-link')
          const currentLinkText = String(linkEl?.get?.('content') ?? '').trim()

          this.set(
            {
              postId: String(attrs['data-post-id'] ?? '').trim(),
              cmsShowTitle: readFlag('data-show-title', true),
              cmsLinkText: normalizeCardLinkText(attrs['data-link-text'] || currentLinkText)
            },
            { silent: true }
          )
        },

        _syncCardSettings(this: any) {
          const showTitle = this.get('cmsShowTitle') !== false
          const linkText = normalizeCardLinkText(this.get('cmsLinkText'))

          setComponentVisible(findComponentByClass(this, 'wb-post-card-title'), showTitle)
          setComponentText(findComponentByClass(this, 'wb-post-card-link'), linkText)

          this.addAttributes({
            'data-post-id': String(this.get('postId') || ''),
            'data-show-title': showTitle ? 'true' : 'false',
            'data-link-text': linkText
          })
        },

        async _loadPostData(this: any) {
          await syncPostCardData(this)
        }
      }
    })
  }

  if (!domComponents.getType(WB_CMS_CASES_LIST_TYPE)) {
    domComponents.addType(WB_CMS_CASES_LIST_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-cases-list'
          ? { type: WB_CMS_CASES_LIST_TYPE }
          : false,

      model: {
        defaults: {
          name: 'Cases 列表',
          tagName: 'div',
          draggable: '*',
          droppable: false,
          selectable: true,
          editable: false,
          stylable: true,
          attributes: {
            'data-wb-component': 'cms-cases-list',
            'data-cms-component': 'cases-list',
            'data-category-id': '',
            'data-enable-tag-filter': 'false',
            'data-tag-selection-mode': 'multi-none',
            class: 'wb-cases-list',
            ...PAGINATION_ATTRS
          },
          styles: `${POST_LIST_CSS}\n${CASES_LIST_CSS}`,
          style: {
            display: 'grid',
            'row-gap': '24px'
          },
          cmsCategoryId: '',
          cmsEnableTagFilter: false,
          ...PAGINATION_PROPS,
          traits: [
            {
              type: 'select',
              label: '文章分类',
              name: 'cmsCategoryId',
              changeProp: true,
              options: [{ value: '', label: '全部文章分类' }]
            },
            {
              type: 'checkbox',
              label: '开启 Tag 筛选',
              name: 'cmsEnableTagFilter',
              changeProp: true
            },
            ...PAGINATION_TRAITS
          ],
          components: [
            {
              tagName: 'div',
              selectable: false,
              editable: false,
              draggable: false,
              droppable: false,
              copyable: false,
              removable: false,
              layerable: false,
              attributes: {
                class: 'wb-post-list-tag-filter',
                'data-post-list-tag-filter': 'true'
              }
            },
            {
              tagName: 'div',
              draggable: false,
              droppable: `[data-gjs-type="${WB_CMS_CASES_CARD_TYPE}"], [data-wb-component="cms-cases-card"]`,
              selectable: false,
              editable: false,
              copyable: false,
              removable: false,
              attributes: {
                class: 'wb-cases-list__grid',
                'data-wb-post-grid': ''
              },
              components: [{ type: WB_CMS_CASES_CARD_TYPE }]
            },
            makePaginationNav('wb-post-list-pagination', 'wb-post-list-page-btn', {
              interactiveInEditor: true
            })
          ]
        },

        init(this: any) {
          this._hydratePropsFromAttrs()
          void initPostCategorySelectTrait(this)
          this.on(
            'change:cmsCategoryId change:cmsEnableTagFilter change:cmsPageSize change:cmsPagination change:cmsMaxPages',
            this._syncAttrs
          )
          this._syncAttrs()
        },

        _hydratePropsFromAttrs(this: any) {
          const attrs = this.getAttributes?.() || {}
          const readAttr = (...keys: string[]) => {
            for (const key of keys) {
              const value = String(attrs[key] ?? '').trim()
              if (value) return value
            }
            return ''
          }
          const normalizePositiveInt = (raw: string, fallback: number) => {
            const parsed = Number.parseInt(String(raw || '').trim(), 10)
            return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
          }

          const categoryId = readAttr('data-category-id', 'data-wb-category-id')
          const enableTagFilterRaw = readAttr(
            'data-enable-tag-filter',
            'data-enable-tag',
            'data-enable-tagfilter'
          )
          const pageSizeRaw = readAttr('data-page-size', 'data-wb-page-size')
          const paginationRaw = readAttr('data-pagination', 'data-wb-pagination')
          const maxPagesRaw = readAttr('data-max-pages', 'data-wb-max-pages')

          this.set(
            {
              cmsCategoryId: categoryId || this.get('cmsCategoryId') || '',
              cmsEnableTagFilter: enableTagFilterRaw
                ? parseBoolLike(enableTagFilterRaw)
                : parseBoolLike(this.get('cmsEnableTagFilter')),
              cmsPageSize: normalizePositiveInt(pageSizeRaw, Number(this.get('cmsPageSize') || 12)),
              cmsPagination: ['static', 'loadmore', 'none'].includes(paginationRaw)
                ? paginationRaw
                : this.get('cmsPagination') || 'static',
              cmsMaxPages: normalizePositiveInt(maxPagesRaw, Number(this.get('cmsMaxPages') || 10))
            },
            { silent: true }
          )
        },

        _syncAttrs(this: any) {
          this.addAttributes({
            'data-cms-component': 'cases-list',
            'data-category-id': this.get('cmsCategoryId') || '',
            'data-enable-tag-filter': this.get('cmsEnableTagFilter') ? 'true' : 'false',
            'data-tag-selection-mode': 'multi-none',
            ...syncPaginationAttrs(this)
          })
        }
      }
    })
  }

  registerCmsTypeEntry({
    dataCmsComponent: 'post-list',
    dataWbComponent: 'cms-post-list',
    publishTemplate: '',
    dynamicPublish: true
  })

  registerCmsTypeEntry({
    dataCmsComponent: 'cases-list',
    dataWbComponent: 'cms-cases-list',
    publishTemplate: '',
    dynamicPublish: true
  })
}
