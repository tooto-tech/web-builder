import type { GrapesEditor } from '../../../../../types/editor'
import { getPost, getPostPage } from '@/api/content/post/index'
import { WB_CMS_POST_LATEST_TYPE } from '../constants'

const WB_CMS_POST_LATEST_CARD_TYPE = 'wb-cms-post-latest-card'
const POST_LATEST_DEFAULT_LINK_TEXT = 'View More'
const LINK_ARROW_SVG = `<svg class="wb-post-latest__link-arrow" viewBox="0 0 24 24" fill="none">
  <path d="M5 12H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M13 6L19 12L13 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const POST_LATEST_CSS = `
  .wb-post-latest-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
    width: 100%;
    min-height: 120px;
  }
  .wb-post-latest__item {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .wb-post-latest__media {
    aspect-ratio: 42 / 34;
    overflow: hidden;
    background: #edf0f2;
    margin-bottom: 16px;
  }
  .wb-post-latest__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.45s ease;
  }
  .wb-post-latest__date {
    font-size: 14px;
    line-height: 1.6;
    color: #003152;
    margin-bottom: 8px;
  }
  .wb-post-latest__title {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-family: Poppins, sans-serif;
    font-size: 22px;
    line-height: 1.2;
    font-weight: 500;
    color: #000A11;
    margin-bottom: 8px;
    transition: color 0.25s ease;
  }
  .wb-post-latest__title-link {
    color: currentColor;
    text-decoration: none;
  }
  .wb-post-latest__title-link::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .wb-post-latest__desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 14px;
    line-height: 1.6;
    font-weight: 400;
    color: #768389;
    margin-bottom: 20px;
  }
  .wb-post-latest__link {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    align-self: flex-start;
    font-family: Poppins, sans-serif;
    font-size: 16px;
    line-height: 1.3;
    font-weight: 400;
    color: #003152;
    transition: color 0.25s ease, gap 0.25s ease;
    position: relative;
    padding-bottom: 4px;
  }
  .wb-post-latest__link::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 4px;
    width: 100%;
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.25s ease;
  }
  .wb-post-latest__link-arrow {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    transition: transform 0.25s ease;
  }
  .wb-post-latest__item:hover .wb-post-latest__image {
    transform: scale(1.04);
  }
  .wb-post-latest__item:hover .wb-post-latest__date,
  .wb-post-latest__item:hover .wb-post-latest__title,
  .wb-post-latest__item:hover .wb-post-latest__desc,
  .wb-post-latest__item:hover .wb-post-latest__link {
    color: #1B43ED;
  }
  .wb-post-latest__item:hover .wb-post-latest__link {
    gap: 18px;
  }
  .wb-post-latest__item:hover .wb-post-latest__link-arrow {
    transform: translateX(6px);
  }
  .wb-post-latest__item:hover .wb-post-latest__link::after {
    transform: scaleX(1);
  }
  @media (max-width: 1023px) {
    .wb-post-latest-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px 16px !important;
    }
  }
  @media (max-width: 767px) {
    .wb-post-latest-grid {
      display: grid;
      grid-template-columns: none;
      grid-auto-flow: column;
      grid-auto-columns: 64%;
      gap: 8px;
      overflow-x: auto;
      padding: 0 20px;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      scroll-padding-left: 20px;
      scroll-padding-right: 20px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      align-items: start;
    }
    .wb-post-latest-grid::-webkit-scrollbar {
      display: none;
    }
    .wb-post-latest__item {
      width: 100%;
      scroll-snap-align: center;
    }
    .wb-post-latest__item:first-child {
      scroll-snap-align: start;
    }
    .wb-post-latest__item:last-child {
      scroll-snap-align: end;
    }
    .wb-post-latest__media {
      margin-bottom: 8px;
    }
    .wb-post-latest__date {
      font-size: 12px;
      margin-bottom: 4px;
    }
    .wb-post-latest__title {
      -webkit-line-clamp: 2;
      font-size: 16px;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    .wb-post-latest__desc {
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 12px;
    }
    .wb-post-latest__link {
      font-size: 13px;
      gap: 10px;
    }
    .wb-post-latest__link-arrow {
      width: 16px;
      height: 16px;
    }
  }
`

const DEFAULT_POST = {
  title: 'Introduction To The Functions Of Color Masterbatch',
  excerpt: 'Discover smart investment strategies to streamline and organize your portfolio.',
  image: 'https://placehold.co/402x308?text=Blog',
  alt: 'blog post',
  date: '2023-01-01',
  url: '#',
}

function buildLatestPostCardComponents() {
  return [
    {
      tagName: 'div',
      selectable: false,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      attributes: { class: 'wb-post-latest__media' },
      components: [
        {
          tagName: 'img',
          selectable: false,
          hoverable: false,
          editable: false,
          draggable: false,
          droppable: false,
          layerable: false,
          attributes: {
            class: 'wb-post-latest__image',
            src: DEFAULT_POST.image,
            alt: DEFAULT_POST.alt,
          },
        },
      ],
    },
    {
      tagName: 'div',
      selectable: false,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      attributes: { class: 'wb-post-latest__date' },
      content: DEFAULT_POST.date,
    },
    {
      tagName: 'h3',
      selectable: false,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      attributes: { class: 'wb-post-latest__title' },
      components: [
        {
          tagName: 'a',
          selectable: false,
          hoverable: false,
          editable: false,
          draggable: false,
          droppable: false,
          layerable: false,
          attributes: {
            class: 'wb-post-latest__title-link',
            href: DEFAULT_POST.url,
          },
          content: DEFAULT_POST.title,
        },
      ],
    },
    {
      tagName: 'p',
      selectable: false,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      attributes: { class: 'wb-post-latest__desc' },
      content: DEFAULT_POST.excerpt,
    },
    {
      tagName: 'div',
      selectable: false,
      hoverable: false,
      editable: false,
      draggable: false,
      droppable: false,
      layerable: false,
      attributes: { class: 'wb-post-latest__link' },
      components: [
        {
          type: 'textnode',
          content: POST_LATEST_DEFAULT_LINK_TEXT,
        },
        LINK_ARROW_SVG,
      ],
    },
  ]
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
    post?.contents?.[0]?.link,
  )
  if (explicitUrl) return explicitUrl

  const content = post?.contents?.[0] || {}
  const slug = String(content?.slug || post?.slug || '').trim()
  const id = post?.id == null ? '' : String(post.id).trim()
  if (slug) return `/posts/${encodeURIComponent(slug)}.html`
  if (id) return `/posts/${encodeURIComponent(id)}.html`
  return '#'
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

function formatDate(value: any): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.slice(0, 10)
}

function pickPostField(content: any, post: any, contentKey: string, postKey: string): string {
  if (content && content[contentKey] != null) return String(content[contentKey])
  if (post && post[postKey] != null) return String(post[postKey])
  return ''
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

function setComponentText(component: any, value: string): void {
  if (!component) return
  const text = String(value ?? '')
  if (component.components?.()?.length) {
    component.components().reset([])
  }
  component.set?.('content', text)
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

function normalizeLinkText(value: unknown): string {
  const text = String(value ?? '').trim()
  return text || POST_LATEST_DEFAULT_LINK_TEXT
}

function setLatestLinkText(component: any, value: string): void {
  if (!component?.components) return
  component.components().reset([
    {
      type: 'textnode',
      content: normalizeLinkText(value),
    },
    LINK_ARROW_SVG,
  ])
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
        label: name ? `${name} (#${id})` : `#${id}`,
      }
    })

    trait.set('options', [{ value: '', label: '未选择文章（显示占位）' }, ...options])
  } catch {
    trait.set('options', [
      { value: '', label: '未选择文章（显示占位）' },
      { value: model.get('postId') || '', label: '加载文章列表失败，请手动输入 ID' },
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
        title: pickPostField(content, post, 'name', 'name'),
        excerpt: pickPostField(content, post, 'excerpt', 'excerpt'),
        image: post?.image == null ? '' : String(post.image),
        alt:
          post?.imageAlt != null
            ? String(post.imageAlt)
            : pickPostField(content, post, 'name', 'name'),
        date: formatDate(post?.publishTime || post?.createTime),
        url: buildStaticPostUrl(post),
      }
    : DEFAULT_POST

  const image = findComponentByClass(model, 'wb-post-latest__image')
  const date = findComponentByClass(model, 'wb-post-latest__date')
  const title = findComponentByClass(model, 'wb-post-latest__title-link')
  const excerpt = findComponentByClass(model, 'wb-post-latest__desc')

  setComponentAttr(image, { src: data.image, alt: data.alt })
  setComponentText(date, data.date)
  setComponentText(title, data.title)
  setComponentAttr(title, { href: data.url })
  setComponentText(excerpt, data.excerpt)
}

const POST_LATEST_CARD_TRAITS = [
  {
    type: 'select',
    label: '选择文章',
    name: 'postId',
    changeProp: true,
    options: [{ value: '', label: '未选择文章（显示占位）' }],
  },
  {
    type: 'checkbox',
    label: '显示日期',
    name: 'cmsShowDate',
    changeProp: true,
  },
  {
    type: 'checkbox',
    label: '显示标题',
    name: 'cmsShowTitle',
    changeProp: true,
  },
  {
    type: 'checkbox',
    label: '显示摘要',
    name: 'cmsShowExcerpt',
    changeProp: true,
  },
  {
    type: 'text',
    label: '按钮文案',
    name: 'cmsLinkText',
    changeProp: true,
    placeholder: POST_LATEST_DEFAULT_LINK_TEXT,
  },
]

function resolvePostLatestTarget(editor: any, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_CMS_POST_LATEST_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_CMS_POST_LATEST_TYPE) as any
  if (fromSelected?.get?.('type') === WB_CMS_POST_LATEST_TYPE) return fromSelected

  const tmTarget = editor.TraitManager?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_CMS_POST_LATEST_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_CMS_POST_LATEST_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_CMS_POST_LATEST_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_CMS_POST_LATEST_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_CMS_POST_LATEST_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_CMS_POST_LATEST_TYPE) return fromTraitTarget

  return null
}

function createAddPostCardTrait() {
  return {
    type: 'button' as any,
    name: 'add-post-card',
    label: false as const,
    text: '+ 添加文章卡片',
    full: true,
    command(this: any, editor: any) {
      const latest = resolvePostLatestTarget(editor, this)
      const created = latest?.addPostCard?.()
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

export function registerCmsPostLatest(editor: GrapesEditor) {
  const domComponents = editor?.DomComponents
  if (!domComponents) return

  if (!domComponents.getType(WB_CMS_POST_LATEST_CARD_TYPE)) {
    domComponents.addType(WB_CMS_POST_LATEST_CARD_TYPE, {
      isComponent: (el: HTMLElement) =>
        el?.getAttribute?.('data-wb-component') === 'cms-post-latest-card'
          ? { type: WB_CMS_POST_LATEST_CARD_TYPE }
          : false,

      model: {
        defaults: {
          name: '文章卡片',
          tagName: 'div',
          draggable: '[data-wb-component="cms-post-latest"]',
          droppable: false,
          selectable: true,
          editable: false,
          stylable: true,
          styles: POST_LATEST_CSS,
          attributes: {
            'data-wb-component': 'cms-post-latest-card',
            'data-post-id': '',
            'data-show-date': 'true',
            'data-show-title': 'true',
            'data-show-excerpt': 'true',
            'data-link-text': POST_LATEST_DEFAULT_LINK_TEXT,
            class: 'wb-post-latest__item',
          },
          postId: '',
          cmsShowDate: true,
          cmsShowTitle: true,
          cmsShowExcerpt: true,
          cmsLinkText: POST_LATEST_DEFAULT_LINK_TEXT,
          traits: POST_LATEST_CARD_TRAITS,
          components: buildLatestPostCardComponents(),
        },

        async init(this: any) {
          this._hydratePropsFromAttrs()
          this.on('change:postId', this._syncAttrs)
          this.on('change:postId', this._loadPostData)
          this.on(
            'change:cmsShowDate change:cmsShowTitle change:cmsShowExcerpt change:cmsLinkText',
            this._syncAttrs
          )
          this._syncAttrs()
          await initPreviewPostTrait(this)
          await this._loadPostData()
        },

        _hydratePropsFromAttrs(this: any) {
          const attrs = this.getAttributes?.() || {}
          const readFlag = (name: string, fallback: boolean) => {
            const raw = String(attrs[name] ?? '').trim()
            if (!raw) return fallback
            return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
          }
          const linkEl = findComponentByClass(this, 'wb-post-latest__link')
          const currentText = String(linkEl?.components?.()?.at?.(0)?.get?.('content') ?? '').trim()

          this.set(
            {
              postId: String(attrs['data-post-id'] ?? '').trim(),
              cmsShowDate: readFlag('data-show-date', true),
              cmsShowTitle: readFlag('data-show-title', true),
              cmsShowExcerpt: readFlag('data-show-excerpt', true),
              cmsLinkText: normalizeLinkText(attrs['data-link-text'] || currentText),
            },
            { silent: true },
          )
        },

        _syncAttrs(this: any) {
          const showDate = this.get('cmsShowDate') !== false
          const showTitle = this.get('cmsShowTitle') !== false
          const showExcerpt = this.get('cmsShowExcerpt') !== false
          const linkText = normalizeLinkText(this.get('cmsLinkText'))

          setComponentVisible(findComponentByClass(this, 'wb-post-latest__date'), showDate)
          setComponentVisible(findComponentByClass(this, 'wb-post-latest__title'), showTitle)
          setComponentVisible(findComponentByClass(this, 'wb-post-latest__desc'), showExcerpt)
          setLatestLinkText(findComponentByClass(this, 'wb-post-latest__link'), linkText)

          this.addAttributes({
            'data-post-id': String(this.get('postId') || ''),
            'data-show-date': showDate ? 'true' : 'false',
            'data-show-title': showTitle ? 'true' : 'false',
            'data-show-excerpt': showExcerpt ? 'true' : 'false',
            'data-link-text': linkText,
          })
        },

        async _loadPostData(this: any) {
          await syncPostCardData(this)
        },
      },
    })
  }

  if (domComponents.getType(WB_CMS_POST_LATEST_TYPE)) return

  domComponents.addType(WB_CMS_POST_LATEST_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'cms-post-latest'
        ? { type: WB_CMS_POST_LATEST_TYPE }
        : false,

    model: {
      defaults: {
        name: '最新文章',
        tagName: 'div',
        draggable: '*',
        droppable: '[data-wb-component="cms-post-latest-card"]',
        selectable: true,
        editable: false,
        stylable: true,
        attributes: {
          'data-wb-component': 'cms-post-latest',
          class: 'wb-post-latest-grid',
        },
        styles: POST_LATEST_CSS,
        traits: [
          createAddPostCardTrait(),
        ],
        components: [
          { type: WB_CMS_POST_LATEST_CARD_TYPE },
        ],
      },

      addPostCard(this: any) {
        const cards = this.components?.()
        if (!cards) return null
        return cards.add({ type: WB_CMS_POST_LATEST_CARD_TYPE })
      },
    },
  })
}
