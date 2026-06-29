export const DEFAULT_SITE_MENU_CODE = 'main-menu'

const normalizeBindKey = (rawValue: string) => rawValue.replace(/[^a-zA-Z0-9_-]/g, '_') || 'site_menu'

export function resolveSiteMenuAttrs(model: any) {
  const attrs = model?.getAttributes?.() || {}
  const menuCode = String(
    model?.get?.('menuCode')
      ?? attrs['data-menu-code']
      ?? DEFAULT_SITE_MENU_CODE,
  ).trim() || DEFAULT_SITE_MENU_CODE
  const layout = String(
    model?.get?.('menuLayout')
      ?? attrs['data-layout']
      ?? 'horizontal',
  ).trim() || 'horizontal'
  const submenuTrigger = String(
    model?.get?.('submenuTrigger')
      ?? attrs['data-submenu-trigger']
      ?? 'hover',
  ).trim() || 'hover'
  const bindKey = `menu_html_${normalizeBindKey(String(model?.getId?.() || model?.cid || 'site_menu'))}`

  return {
    class: 'wb-site-menu notranslate',
    'data-menu-code': menuCode,
    'data-layout': layout,
    'data-submenu-trigger': submenuTrigger,
    'data-menu-bind-key': bindKey,
    'data-cms-html': bindKey,
    'data-wb-i18n-skip': 'true',
    translate: 'no',
  }
}
