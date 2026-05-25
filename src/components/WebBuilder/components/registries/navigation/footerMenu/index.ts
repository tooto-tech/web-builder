import type { Editor } from 'grapesjs'
import { getMenuByCode, getMenuItemTree } from '@/api/content/menu'
import { getEditorRuntime } from '@/components/WebBuilder/composables/useEditorRuntime'

const TYPE_FOOTER_MENU = 'footer-menu'
const CMS_FOOTER_MENU_COMPONENT = 'footer-menu'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 5h16"/>
  <path d="M4 10h10"/>
  <path d="M4 15h14"/>
  <path d="M4 20h8"/>
</svg>`

const styles = `
  .wb-footer-menu {
    display: flex;
    flex-direction: column;
    gap: 22px;
    color: #ffffff;
    min-width: 160px;
  }
  .wb-footer-menu__title {
    margin: 0;
    color: inherit;
    font-size: 28px;
    line-height: 1.15;
    font-weight: 700;
    letter-spacing: 0;
  }
  .wb-footer-menu__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .wb-footer-menu__item {
    margin: 0;
    padding: 0;
  }
  .wb-footer-menu__link {
    display: inline-block;
    color: rgba(255,255,255,0.88);
    text-decoration: none;
    font-size: 18px;
    line-height: 1.25;
    font-weight: 400;
    transition: color 0.2s ease;
  }
  .wb-footer-menu__link:hover {
    color: #ffffff;
  }
  .wb-footer-menu__empty {
    color: rgba(255,255,255,0.62);
    font-size: 14px;
    line-height: 1.5;
  }
  @media (max-width: 767px) {
    .wb-footer-menu {
      gap: 16px;
      min-width: 0;
    }
    .wb-footer-menu__title {
      font-size: 24px;
    }
    .wb-footer-menu__list {
      gap: 12px;
    }
    .wb-footer-menu__link {
      font-size: 16px;
    }
  }
`

const footerMenuScript = function (this: HTMLElement) {
  const titleEl = this.querySelector('.wb-footer-menu__title') as HTMLElement | null
  const listEl = this.querySelector('.wb-footer-menu__list') as HTMLElement | null
  if (!titleEl || !listEl) return
  const hasInitialItems = Array.from(listEl.children).some(
    (child) => !(child as HTMLElement).classList?.contains('wb-footer-menu__empty')
  )

  const menuCode = (this.getAttribute('data-menu-code') || '').trim()
  const menuId = (this.getAttribute('data-menu-id') || '').trim()
  const menuTitle = (this.getAttribute('data-menu-title') || titleEl.textContent || '').trim()
  const fallbackTitle = (
    this.getAttribute('data-menu-fallback-title') ||
    menuTitle ||
    'Products'
  ).trim()
  const normalizedTargetTitle = menuTitle.toLowerCase()

  titleEl.textContent = menuTitle || fallbackTitle
  if (!menuCode) return

  const escapeHtml = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const isVisible = (item: any): boolean => item?.isVisible !== false
  const itemTitle = (item: any): string =>
    String(item?.resolvedTitle || item?.title || item?.name || '').trim()
  const itemUrl = (item: any): string =>
    String(item?.resolvedUrl || item?.url || item?.href || '#').trim() || '#'
  const itemTarget = (item: any): string => String(item?.target || '').trim()

  const renderItems = (items: any[]) => {
    const visibleItems = (Array.isArray(items) ? items : []).filter(isVisible)
    if (!visibleItems.length) {
      listEl.innerHTML = '<li class="wb-footer-menu__empty">No menu items</li>'
      return
    }

    listEl.innerHTML = visibleItems
      .map((item) => {
        const title = itemTitle(item)
        if (!title) return ''
        const href = itemUrl(item)
        const target = itemTarget(item)
        const targetAttr = target ? ` target="${escapeHtml(target)}"` : ''
        return `<li class="wb-footer-menu__item"><a class="wb-footer-menu__link" href="${escapeHtml(href)}"${targetAttr}>${escapeHtml(title)}</a></li>`
      })
      .filter(Boolean)
      .join('')
  }

  const resolveMenuItems = (payload: any): any[] => {
    const data = payload?.data ?? payload
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.menuItems)) return data.menuItems
    if (Array.isArray(data?.menuItemTree)) return data.menuItemTree
    if (Array.isArray(data?.list)) return data.list
    if (Array.isArray(data?.children)) return data.children
    return []
  }

  const pickColumnItems = (topItems: any[]): any[] => {
    const visibleTopItems = (Array.isArray(topItems) ? topItems : []).filter(isVisible)
    if (!normalizedTargetTitle) return visibleTopItems

    const matched = visibleTopItems.find(
      (item) => itemTitle(item).toLowerCase() === normalizedTargetTitle
    )
    if (!matched) return visibleTopItems

    const children = Array.isArray(matched.children) ? matched.children : []
    return children.length ? children : [matched]
  }

  const fetchJson = async (url: string): Promise<any> => {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }

  ;(async () => {
    const encodedCode = encodeURIComponent(menuCode)
    const urls = menuId
      ? [
          `/admin-api/content/menu-item/tree?menuId=${encodeURIComponent(menuId)}`,
          `/app-api/content/menu-item/tree?menuId=${encodeURIComponent(menuId)}`,
          `/app-api/content/menu/code/${encodedCode}`,
          `/admin-api/content/menu/code/${encodedCode}`
        ]
      : [`/app-api/content/menu/code/${encodedCode}`, `/admin-api/content/menu/code/${encodedCode}`]

    for (const url of urls) {
      try {
        const payload = await fetchJson(url)
        const items = resolveMenuItems(payload)
        if (items.length) {
          renderItems(pickColumnItems(items))
          return
        }
      } catch (_) {
        // Try the next endpoint. Published pages use app-api, editor preview may use admin-api.
      }
    }
    if (!hasInitialItems) renderItems([])
  })()
}

const normalizeFooterMenuBindIdentity = (rawValue: string): string =>
  rawValue
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 96) || 'default'

const resolveFooterMenuBindKey = (
  model: any,
  menuCode: string,
  menuTitle: string,
  menuId: string
): string => {
  const menuIdentity = menuId || menuCode
  const identity =
    [menuIdentity, menuTitle].filter(Boolean).join('_') || model.getId?.() || model.cid
  return `footer_menu_html_${normalizeFooterMenuBindIdentity(String(identity || 'default'))}`
}

const isVisibleMenuItem = (item: any): boolean => item?.isVisible !== false
const getMenuItemTitle = (item: any): string =>
  String(item?.resolvedTitle || item?.title || item?.name || '').trim()
const getMenuItemUrl = (item: any): string =>
  String(item?.resolvedUrl || item?.url || item?.href || '#').trim() || '#'

function pickFooterMenuItems(items: any[], menuTitle: string): any[] {
  const visibleItems = (Array.isArray(items) ? items : []).filter(isVisibleMenuItem)
  const normalizedTitle = menuTitle.trim().toLowerCase()
  if (!normalizedTitle) return visibleItems

  const matched = visibleItems.find(
    (item) => getMenuItemTitle(item).toLowerCase() === normalizedTitle
  )
  if (!matched) return visibleItems

  const children = Array.isArray(matched.children) ? matched.children.filter(isVisibleMenuItem) : []
  return children.length ? children : [matched]
}

function buildFooterMenuItemComponents(items: any[]): any[] {
  const visibleItems = (Array.isArray(items) ? items : []).filter(isVisibleMenuItem)
  if (!visibleItems.length) {
    return [
      { tagName: 'li', attributes: { class: 'wb-footer-menu__empty' }, content: 'No menu items' }
    ]
  }

  return visibleItems
    .map((item) => {
      const title = getMenuItemTitle(item)
      if (!title) return null
      const target = String(item?.target || '').trim()
      const linkAttrs: Record<string, string> = {
        class: 'wb-footer-menu__link',
        href: getMenuItemUrl(item)
      }
      if (target) linkAttrs.target = target
      return {
        tagName: 'li',
        attributes: { class: 'wb-footer-menu__item' },
        components: [{ tagName: 'a', attributes: linkAttrs, content: title }]
      }
    })
    .filter(Boolean) as any[]
}

async function refreshFooterMenuPreview(model: any, editor?: Editor) {
  const menuCode = String(
    model.get('fmMenuCode') || model.getAttributes?.()?.['data-menu-code'] || ''
  ).trim()
  const menuId = String(
    model.get('fmMenuId') || model.getAttributes?.()?.['data-menu-id'] || ''
  ).trim()
  const menuTitle = String(
    model.get('fmMenuTitle') || model.getAttributes?.()?.['data-menu-title'] || ''
  ).trim()
  const list = model.find?.('.wb-footer-menu__list')?.[0]
  if (!list || (!menuCode && !menuId)) return

  const token = `${Date.now()}-${Math.random()}`
  model.__wbFooterMenuRefreshToken = token
  try {
    const language = String(
      (editor ? getEditorRuntime(editor).getPreviewLanguage() : '') ||
        document.documentElement?.lang ||
        ''
    ).trim()
    const payload = menuId
      ? await getMenuItemTree(Number(menuId), language)
      : await getMenuByCode(menuCode, language)
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as any)?.items)
        ? (payload as any).items
        : []
    if (model.__wbFooterMenuRefreshToken !== token) return
    list.components?.(buildFooterMenuItemComponents(pickFooterMenuItems(items, menuTitle)))
  } catch (err) {
    console.error('[WebBuilder] Failed to refresh footer menu preview', err)
  }
}

function applyFooterMenuAttrs(model: any) {
  const attrs = model.getAttributes?.() || {}
  const menuCode = String(model.get('fmMenuCode') || attrs['data-menu-code'] || '').trim()
  const menuId = String(model.get('fmMenuId') || attrs['data-menu-id'] || '').trim()
  const menuTitle =
    String(model.get('fmMenuTitle') || attrs['data-menu-title'] || '').trim() || 'Products'
  const bindKey = resolveFooterMenuBindKey(model, menuCode, menuTitle, menuId)

  model.addAttributes?.({
    class: 'wb-footer-menu notranslate',
    'data-cms-component': CMS_FOOTER_MENU_COMPONENT,
    'data-menu-code': menuCode,
    'data-menu-id': menuId,
    'data-menu-title': menuTitle,
    'data-menu-fallback-title': menuTitle,
    'data-menu-bind-key': bindKey,
    'data-wb-i18n-skip': 'true',
    translate: 'no'
  })

  const title = model.find?.('.wb-footer-menu__title')?.[0]
  if (title) {
    const comps = title.components?.()
    if (comps?.length) comps.reset([{ type: 'textnode', content: menuTitle }])
    else title.components?.([{ type: 'textnode', content: menuTitle }])
  }

  const list = model.find?.('.wb-footer-menu__list')?.[0]
  list?.addAttributes?.({ 'data-cms-html': bindKey })
}

export function registerFooterMenuComponent(editor: Editor): void {
  const { DomComponents, BlockManager } = editor
  if (DomComponents.getType(TYPE_FOOTER_MENU)) return

  DomComponents.addType(TYPE_FOOTER_MENU, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'DIV' && el.classList?.contains('wb-footer-menu')
        ? { type: TYPE_FOOTER_MENU }
        : undefined,
    model: {
      defaults: {
        name: 'Footer Menu',
        tagName: 'div',
        classes: ['wb-footer-menu', 'notranslate'],
        draggable: true,
        droppable: false,
        copyable: true,
        styles,
        fmMenuCode: '',
        fmMenuId: '',
        fmMenuTitle: 'Products',
        traits: [
          { type: 'footer-menu-select', label: '后台菜单', name: 'fmMenuCode', changeProp: true },
          {
            type: 'text',
            label: '菜单标题',
            name: 'fmMenuTitle',
            changeProp: true,
            placeholder: 'Products'
          }
        ],
        script: footerMenuScript,
        'script-export': footerMenuScript,
        'script-props': ['fmMenuCode', 'fmMenuId', 'fmMenuTitle'],
        attributes: {
          class: 'wb-footer-menu notranslate',
          'data-cms-component': CMS_FOOTER_MENU_COMPONENT,
          'data-menu-code': '',
          'data-menu-id': '',
          'data-menu-title': 'Products',
          'data-menu-fallback-title': 'Products',
          'data-menu-bind-key': 'footer_menu_html_default',
          'data-wb-i18n-skip': 'true',
          translate: 'no'
        },
        components: [
          {
            tagName: 'h3',
            attributes: { class: 'wb-footer-menu__title' },
            components: [{ type: 'textnode', content: 'Products' }]
          },
          {
            tagName: 'ul',
            attributes: {
              class: 'wb-footer-menu__list',
              'data-cms-html': 'footer_menu_html_default'
            },
            components: [
              {
                tagName: 'li',
                attributes: { class: 'wb-footer-menu__item' },
                components: [
                  {
                    tagName: 'a',
                    attributes: { class: 'wb-footer-menu__link', href: '#' },
                    content: 'Rolling Bearings'
                  }
                ]
              },
              {
                tagName: 'li',
                attributes: { class: 'wb-footer-menu__item' },
                components: [
                  {
                    tagName: 'a',
                    attributes: { class: 'wb-footer-menu__link', href: '#' },
                    content: 'Super-Precision Bearings'
                  }
                ]
              },
              {
                tagName: 'li',
                attributes: { class: 'wb-footer-menu__item' },
                components: [
                  {
                    tagName: 'a',
                    attributes: { class: 'wb-footer-menu__link', href: '#' },
                    content: 'Slewing Bearings'
                  }
                ]
              },
              {
                tagName: 'li',
                attributes: { class: 'wb-footer-menu__item' },
                components: [
                  {
                    tagName: 'a',
                    attributes: { class: 'wb-footer-menu__link', href: '#' },
                    content: 'Plain Bearings'
                  }
                ]
              }
            ]
          }
        ]
      },
      init(this: any) {
        this.listenTo(this, 'change:fmMenuCode change:fmMenuId change:fmMenuTitle', () =>
          applyFooterMenuAttrs(this)
        )
        this.listenTo(this, 'change:fmMenuCode change:fmMenuId change:fmMenuTitle', () =>
          refreshFooterMenuPreview(this, editor)
        )
        applyFooterMenuAttrs(this)
        refreshFooterMenuPreview(this, editor)
      }
    }
  })

  BlockManager.add('footer-menu', {
    label: 'Footer Menu',
    category: 'Navigation',
    media: BLOCK_ICON,
    content: { type: TYPE_FOOTER_MENU }
  })
}

export const WB_FOOTER_MENU_TYPE = TYPE_FOOTER_MENU
