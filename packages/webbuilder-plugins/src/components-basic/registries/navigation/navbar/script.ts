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

  const syncDesktopMegaOverlay = function () {
    if (!overlay || !isDesktopViewport()) return
    const hasOpenMega = !!el.querySelector('.gjs-nav-group--mega.is-open')
    overlay.classList.toggle('is-open', hasOpenMega)
  }

  const normalizePath = function (value?: string | null) {
    const raw = `${value ?? ''}`.trim()
    if (!raw || raw === '#') return ''

    const stripLocalePrefix = function (path: string) {
      if (path === '/en') return '/'
      return path.replace(/^\/en(?=\/|$)/, '') || '/'
    }

    try {
      const url = new URL(raw, window.location.origin)
      const pathname = `${url.pathname || '/'}`
      return stripLocalePrefix(pathname.replace(/\/+$/, '') || '/')
    } catch {
      return stripLocalePrefix(raw.replace(/\/+$/, '') || '/')
    }
  }

  const syncActiveNav = function () {
    const currentPath = normalizePath(window.location.pathname || '/')

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
      const targetPath = normalizePath(link.getAttribute('href'))
      if (!targetPath || targetPath !== currentPath) return

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

  el.querySelectorAll('.gjs-nav-group--mega').forEach(function (group) {
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

  el.addEventListener('click', function (event) {
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
  syncActiveNav()
}
