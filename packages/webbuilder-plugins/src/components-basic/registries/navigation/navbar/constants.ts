export const TYPE_NAVBAR = 'navbar'
export const TYPE_NAVBAR_MENU = 'navbar-menu'
export const TYPE_NAVBAR_LINK = 'navbar-link'
export const TYPE_NAV_GROUP = 'nav-group'
export const TYPE_DROPDOWN = 'nav-dropdown'
export const TYPE_DROPDOWN_ITEM = 'nav-dropdown-item'
export const TYPE_MEGA = 'nav-mega'
export const TYPE_MEGA_INNER = 'nav-mega-inner'
export const TYPE_MEGA_COL = 'nav-mega-col'
export const TYPE_MEGA_ITEM = 'nav-mega-item'
export const TYPE_MEGA_LEFT = 'nav-mega-left'
export const TYPE_MEGA_RIGHT = 'nav-mega-right'
export const TYPE_NAVBAR_LEFT = 'navbar-left-slot'
export const TYPE_NAVBAR_CENTER = 'navbar-center-slot'
export const TYPE_NAVBAR_RIGHT = 'navbar-right-slot'

export type NavGroupMenuType = 'dropdown' | 'mega'

export const DEFAULT_NAVBAR_MENU_CODE = 'main-menu'
export const DEFAULT_NAVBAR_MENU_DATA_KEY = 'menuItems'

export const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="2" y="4" width="20" height="6" rx="1.5"/>
  <line x1="5" y1="7" x2="8" y2="7" stroke-width="2"/>
  <line x1="10" y1="7" x2="13" y2="7"/>
  <line x1="15" y1="7" x2="17" y2="7"/>
  <rect x="18" y="5.5" width="4" height="3" rx="1.5" fill="currentColor" stroke="none"/>
  <line x1="2" y1="15" x2="22" y2="15"/>
  <line x1="2" y1="19" x2="16" y2="19"/>
</svg>`

export const NAV_GROUP_CHEVRON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
  width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>`

export const LINK_TARGET_OPTIONS = [
  { id: '', name: 'Same tab' },
  { id: '_blank', name: 'New tab' },
]

export const NAV_GROUP_TYPE_OPTIONS = [
  { id: 'dropdown', name: '普通下拉' },
  { id: 'mega', name: '超级菜单' },
]

export const NAVBAR_DRAWER_SIDE_OPTIONS = [
  { id: 'right', name: '右侧（默认）' },
  { id: 'left', name: '左侧' },
]

export const NAVBAR_MENU_ALIGN_OPTIONS = [
  { id: 'left', name: '左对齐' },
  { id: 'center', name: '居中（默认）' },
  { id: 'right', name: '右对齐' },
]

export const NAVBAR_MODE_OPTIONS = [
  { id: 'sticky', name: '常规 Sticky（默认）' },
  { id: 'transparent-fixed', name: '透明 Fixed 滚动变色' },
]
