export const DEFAULT_MENU_TREE_CODE = 'main-menu'

const normalizeClassName = (rawValue: string) => {
  const classes = rawValue
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (!classes.includes('wb-menu-tree')) {
    classes.unshift('wb-menu-tree')
  }
  if (!classes.includes('notranslate')) {
    classes.push('notranslate')
  }
  return classes.join(' ')
}

const normalizeDataKey = (rawValue: string) => {
  const normalized = rawValue.trim().replace(/[^A-Za-z0-9_]/g, '_')
  if (!normalized) return ''
  return /^\d/.test(normalized) ? `_${normalized}` : normalized
}

export function resolveMenuTreeAttrs(model: any) {
  const attrs = model?.getAttributes?.() || {}
  const menuCode = String(
    model?.get?.('menuCode')
      ?? attrs['data-menu-code']
      ?? DEFAULT_MENU_TREE_CODE,
  ).trim() || DEFAULT_MENU_TREE_CODE
  const menuDataKey = normalizeDataKey(String(
    model?.get?.('menuDataKey')
      ?? attrs['data-menu-data-key']
      ?? '',
  ))

  return {
    class: normalizeClassName(String(attrs.class ?? '')),
    'data-menu-code': menuCode,
    'data-menu-data-key': menuDataKey,
    'data-wb-i18n-skip': 'true',
    translate: 'no',
  }
}
