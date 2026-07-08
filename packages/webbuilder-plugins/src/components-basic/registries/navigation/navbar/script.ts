export const navbarScript = function (this: HTMLElement) {
  const el = this as HTMLElement & { __navInit?: boolean }

  if (el.__navInit) return
  el.__navInit = true

  const burger = el.querySelector('.gjs-navbar__burger') as HTMLElement | null
  const menu = el.querySelector('.gjs-navbar__menu') as HTMLElement | null
  const overlay = el.querySelector('.gjs-navbar__overlay') as HTMLElement | null
  const closeBtn = el.querySelector('.gjs-navbar__close') as HTMLElement | null

  if (!burger || !menu) return
  const menuEl = menu

  const isDesktopViewport = function () {
    return window.matchMedia('(min-width: 1024px)').matches
  }

  function open() {
    menuEl.classList.add('is-open')
    if (overlay) overlay.classList.add('is-open')
  }

  function close() {
    menuEl.classList.remove('is-open')
    if (overlay) overlay.classList.remove('is-open')
  }

  const escapeHtml = function (value: unknown) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const setOptionalHtmlAttr = function (name: string, value: unknown) {
    const normalized = String(value ?? '').trim()
    return normalized ? ` ${name}="${escapeHtml(normalized)}"` : ''
  }

  const isVisibleMenuItem = function (item: any) {
    return item?.isVisible !== false
  }

  const getMenuItemTitle = function (item: any) {
    return String(item?.resolvedTitle || item?.title || item?.name || 'Menu Item').trim()
  }

  const getMenuItemUrl = function (item: any) {
    return String(item?.resolvedUrl || item?.url || item?.href || '#').trim() || '#'
  }

  const getVisibleMenuChildren = function (item: any) {
    return Array.isArray(item?.children) ? item.children.filter(isVisibleMenuItem) : []
  }

  const getRuntimeLanguage = function () {
    const htmlLang =
      document.documentElement?.getAttribute?.('lang')
      || (document.documentElement as HTMLElement | undefined)?.lang
      || ''
    const normalizedHtmlLang = String(htmlLang || '').trim()
    if (normalizedHtmlLang) return normalizedHtmlLang

    const segment = String(window.location?.pathname || '')
      .split('/')
      .find(function (part) { return /^[a-z]{2}(?:-[A-Za-z0-9]+)?$/.test(part) })
    return segment || ''
  }

  const buildMenuEndpoint = function (base: string, code: string) {
    const language = getRuntimeLanguage()
    const query = language ? `?language=${encodeURIComponent(language)}` : ''
    return `${base}/${encodeURIComponent(code)}${query}`
  }

  const resolveMenuItems = function (payload: any) {
    const data = payload?.data ?? payload
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.menuItems)) return data.menuItems
    if (Array.isArray(data?.menuItemTree)) return data.menuItemTree
    if (Array.isArray(data?.list)) return data.list
    return []
  }

  const renderRuntimeLink = function (item: any) {
    const title = getMenuItemTitle(item)
    const href = getMenuItemUrl(item)
    return `<a class="gjs-navbar__link" href="${escapeHtml(href)}"${setOptionalHtmlAttr('target', item?.target)}${setOptionalHtmlAttr('rel', item?.rel)}><span class="gjs-navbar__link-label">${escapeHtml(title)}</span></a>`
  }

  const renderRuntimeDropdown = function (children: any[]) {
    const items = children
      .map(function (child) {
        const title = getMenuItemTitle(child)
        const href = getMenuItemUrl(child)
        return `<a class="gjs-nav-group__dropdown-item" href="${escapeHtml(href)}"${setOptionalHtmlAttr('target', child?.target)}${setOptionalHtmlAttr('rel', child?.rel)}><span class="gjs-nav-group__dropdown-item-label">${escapeHtml(title)}</span></a>`
      })
      .join('')
    return `<div class="gjs-nav-group__dropdown"><div class="gjs-nav-group__dropdown-inner">${items}</div></div>`
  }

  const renderRuntimeMega = function (children: any[]) {
    const firstImageItem = children.find(function (child) {
      return String(child?.menuImage || '').trim()
    })
    const items = children
      .map(function (child) {
        const title = getMenuItemTitle(child)
        const href = getMenuItemUrl(child)
        return `<a class="gjs-nav-group__mega-item" href="${escapeHtml(href)}"${setOptionalHtmlAttr('target', child?.target)}${setOptionalHtmlAttr('rel', child?.rel)}${setOptionalHtmlAttr('data-mega-image-src', child?.menuImage)}${setOptionalHtmlAttr('data-mega-image-alt', child?.menuImageAlt || title)}><span class="gjs-nav-group__mega-item-label">${escapeHtml(title)}</span><span class="gjs-nav-group__mega-item-icon">+</span></a>`
      })
      .join('')
    const image = firstImageItem
      ? `<img class="gjs-nav-group__mega-img" src="${escapeHtml(firstImageItem.menuImage)}" alt="${escapeHtml(firstImageItem.menuImageAlt || getMenuItemTitle(firstImageItem))}" width="630" height="420">`
      : ''
    return `<div class="gjs-nav-group__mega"><div class="gjs-nav-group__mega-inner"><div class="gjs-nav-group__mega-left"><div class="gjs-nav-group__mega-left-stack"><div class="gjs-nav-group__mega-col">${items}</div></div></div><div class="gjs-nav-group__mega-right">${image}</div></div></div>`
  }

  const renderRuntimeGroup = function (item: any) {
    const children = getVisibleMenuChildren(item)
    const title = getMenuItemTitle(item)
    const submenuType = item?.submenuType === 'dropdown' ? 'dropdown' : 'mega'
    const groupClass = submenuType === 'mega'
      ? 'gjs-nav-group gjs-nav-group--mega'
      : 'gjs-nav-group'
    return `<div class="${groupClass}"><button class="gjs-nav-group__btn" type="button"><span class="gjs-nav-group__btn-label">${escapeHtml(title)}</span><span class="gjs-nav-group__btn-chevron"></span></button>${submenuType === 'dropdown' ? renderRuntimeDropdown(children) : renderRuntimeMega(children)}</div>`
  }

  const renderRuntimeMenu = function (items: any[]) {
    const visibleItems = (Array.isArray(items) ? items : []).filter(isVisibleMenuItem)
    if (!visibleItems.length) return false

    const hasCloseButton = !!menuEl.querySelector('.gjs-navbar__close')
    const closeMarkup = hasCloseButton
      ? '<button class="gjs-navbar__close" type="button" aria-label="Close menu">&times;</button>'
      : ''
    const itemMarkup = visibleItems
      .map(function (item) {
        return getVisibleMenuChildren(item).length
          ? renderRuntimeGroup(item)
          : renderRuntimeLink(item)
      })
      .join('')

    menuEl.innerHTML = closeMarkup + itemMarkup
    return true
  }

  const fetchRuntimeMenu = async function () {
    const menuCode = String(menuEl.getAttribute('data-menu-code') || '').trim()
    const isEditorTemplate = String(menuEl.getAttribute('data-cms-component') || '').trim() === 'menu-tree'
    if (isEditorTemplate) return
    if (!menuCode || typeof fetch !== 'function') return

    const endpoints = [
      buildMenuEndpoint('/app-api/content/menu/code', menuCode),
      buildMenuEndpoint('/admin-api/content/menu/code', menuCode),
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          credentials: 'same-origin',
          cache: 'no-store',
        })
        if (!response.ok) continue
        const payload = await response.json()
        const items = resolveMenuItems(payload)
        if (renderRuntimeMenu(items)) {
          bindMegaGroups()
          syncActiveNav()
          onScroll()
          return
        }
      } catch (_) {
        // Keep the statically rendered menu and try the next endpoint.
      }
    }
  }

  const syncDesktopMegaOverlay = function () {
    if (!overlay || !isDesktopViewport()) return
    const hasOpenMega = !!el.querySelector('.gjs-nav-group--mega.is-open')
    overlay.classList.toggle('is-open', hasOpenMega)
  }

  const normalizeLocation = function (value?: string | null) {
    const raw = `${value ?? ''}`.trim()
    if (!raw || raw === '#') return null

    const stripLocalePrefix = function (path: string) {
      if (path === '/en') return '/'
      return path.replace(/^\/en(?=\/|$)/, '') || '/'
    }

    try {
      const url = new URL(raw, window.location.origin)
      const pathname = `${url.pathname || '/'}`
      return {
        path: stripLocalePrefix(pathname.replace(/\/+$/, '') || '/'),
        hash: url.hash || '',
      }
    } catch {
      const hashIndex = raw.indexOf('#')
      const pathname = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw
      const hash = hashIndex >= 0 ? raw.slice(hashIndex) : ''
      return {
        path: stripLocalePrefix(pathname.replace(/\/+$/, '') || '/'),
        hash,
      }
    }
  }

  const syncActiveNav = function () {
    const currentLocation = normalizeLocation(`${window.location.pathname || '/'}${window.location.hash || ''}`)

    el.querySelectorAll('.gjs-navbar__link.is-active, .gjs-nav-group__dropdown-item.is-active, .gjs-nav-group__mega-item.is-active').forEach(function (node) {
      node.classList.remove('is-active')
      node.removeAttribute('aria-current')
    })

    el.querySelectorAll('.gjs-nav-group.is-active').forEach(function (group) {
      group.classList.remove('is-active')
    })
    el.querySelectorAll('.gjs-nav-group__btn[aria-current="page"]').forEach(function (btn) {
      btn.removeAttribute('aria-current')
    })

    const interactiveLinks = Array.from(
      el.querySelectorAll('.gjs-navbar__link[href], .gjs-nav-group__dropdown-item[href], .gjs-nav-group__mega-item[href]')
    ) as HTMLAnchorElement[]

    interactiveLinks.forEach(function (link) {
      const targetLocation = normalizeLocation(link.getAttribute('href'))
      if (
        !targetLocation
        || !currentLocation
        || targetLocation.path !== currentLocation.path
        || targetLocation.hash !== currentLocation.hash
      ) return

      link.classList.add('is-active')
      link.setAttribute('aria-current', 'page')

      const group = link.closest('.gjs-nav-group')
      const groupBtn = group?.querySelector('.gjs-nav-group__btn') as HTMLElement | null
      if (group && groupBtn) {
        group.classList.add('is-active')
        groupBtn.setAttribute('aria-current', 'page')
      }
    })
  }

  burger.addEventListener('click', open)
  if (overlay) overlay.addEventListener('click', close)
  if (closeBtn) closeBtn.addEventListener('click', close)

  function syncMegaImage(group: Element, item?: Element | null) {
    const targetItem =
      item
      || group.querySelector('.gjs-nav-group__mega-item[data-mega-image-src]:not([data-mega-image-src=""])') as Element | null
    const image = group.querySelector('.gjs-nav-group__mega-img') as HTMLImageElement | null
    if (!targetItem || !image) return

    const src = (targetItem.getAttribute('data-mega-image-src') || '').trim()
    const alt = (targetItem.getAttribute('data-mega-image-alt') || '').trim()
    if (!src) return

    image.setAttribute('src', src)
    image.setAttribute('alt', alt)

    group.querySelectorAll('.gjs-nav-group__mega-item.is-active').forEach(function (currentItem) {
      currentItem.classList.remove('is-active')
    })
    targetItem.classList.add('is-active')
  }

  function bindMegaGroups() {
    el.querySelectorAll('.gjs-nav-group--mega').forEach(function (group) {
      const groupEl = group as Element & { __navMegaInit?: boolean }
      if (groupEl.__navMegaInit) {
        syncMegaImage(group)
        return
      }
      groupEl.__navMegaInit = true

      const items = group.querySelectorAll('.gjs-nav-group__mega-item')
      const trigger = group.querySelector('.gjs-nav-group__btn') as HTMLElement | null

      const openMega = function () {
        if (!isDesktopViewport()) return
        group.classList.add('is-open')
        syncDesktopMegaOverlay()
        syncMegaImage(group)
      }

      const closeMega = function () {
        if (!isDesktopViewport()) return
        group.classList.remove('is-open')
        syncDesktopMegaOverlay()
      }

      items.forEach(function (item) {
        item.addEventListener('mouseenter', function () { syncMegaImage(group, item) })
        item.addEventListener('focus', function () { syncMegaImage(group, item) })
      })

      if (trigger) {
        trigger.addEventListener('mouseenter', openMega)
        trigger.addEventListener('focus', openMega)
      }

      group.addEventListener('mouseenter', openMega)
      group.addEventListener('mouseleave', closeMega)
      group.addEventListener('mouseenter', function () { syncMegaImage(group) })
      syncMegaImage(group)
    })
  }

  el.addEventListener('click', function (event) {
    if ((event.target as Element).closest('.gjs-navbar__close')) {
      close()
      return
    }

    const btn = (event.target as Element).closest('.gjs-nav-group__btn')
    if (!btn) return

    const group = btn.closest('.gjs-nav-group')
    if (!group) return

    const wasOpen = group.classList.contains('is-open')
    el.querySelectorAll('.gjs-nav-group.is-open').forEach(function (currentGroup) {
      currentGroup.classList.remove('is-open')
    })
    syncDesktopMegaOverlay()

    if (!wasOpen) {
      group.classList.add('is-open')
      syncDesktopMegaOverlay()
    }
  })

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close()
  })

  const onScroll = function () {
    const scrollTop =
      window.scrollY
      || window.pageYOffset
      || document.documentElement?.scrollTop
      || document.body?.scrollTop
      || 0
    const scrolled = scrollTop > 20
    if (scrolled) el.classList.add('is-scrolled')
    else el.classList.remove('is-scrolled')

    el.querySelectorAll('.gjs-nav-group__mega, .gjs-nav-group__mega-inner').forEach(function (megaEl) {
      if (scrolled) megaEl.classList.add('is-scrolled')
      else megaEl.classList.remove('is-scrolled')
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions)
  document.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions)
  window.addEventListener('popstate', syncActiveNav, { passive: true } as AddEventListenerOptions)
  window.addEventListener('hashchange', syncActiveNav, { passive: true } as AddEventListenerOptions)
  onScroll()
  bindMegaGroups()
  syncActiveNav()
  void fetchRuntimeMenu()
}
