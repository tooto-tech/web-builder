export const navbarThbScript = function (this: HTMLElement) {
  const root = this as HTMLElement & { __thbNavInit?: boolean }
  if (root.__thbNavInit) return
  root.__thbNavInit = true

  const hamburger = root.querySelector('.site-header__hamburger') as HTMLElement | null
  const navMobile = root.querySelector('.nav-mobile') as HTMLElement | null
  const navMobileContent = navMobile ? navMobile.querySelector('.nav-mobile__content') as HTMLElement | null : null
  const mobileSearchBtn = root.querySelector('.site-header__mobile-search') as HTMLButtonElement | null
  const logo = root.querySelector('.site-header__logo-img, .site-header__logo img') as HTMLImageElement | null
  const siteSearch = root.querySelector('.site-search') as HTMLElement | null
  const headerSearchInput = root.querySelector('.site-header__search input') as HTMLInputElement | null
  const siteSearchInput = siteSearch ? siteSearch.querySelector('.site-search__input') as HTMLInputElement | null : null
  const siteSearchClose = siteSearch ? siteSearch.querySelector('.site-search__close') as HTMLButtonElement | null : null
  const siteSearchClear = siteSearch ? siteSearch.querySelector('.site-search__clear') as HTMLButtonElement | null : null
  const siteSearchForm = siteSearch ? siteSearch.querySelector('.site-search__form') as HTMLFormElement | null : null

  ;(function prepareMobilePanels() {
    if (!navMobileContent) return
    const panels = Array.from(navMobileContent.querySelectorAll('.nav-mobile__panel')) as HTMLElement[]
    let index = 0
    panels.forEach(function (panel) {
      if (!panel.dataset.panel) {
        panel.dataset.panel = panel.classList.contains('is-active') ? 'root' : 'panel-' + (++index)
      }
    })
    Array.from(navMobileContent.querySelectorAll('.nav-mobile__expand')).forEach(function (button) {
      const trigger = button as HTMLElement
      if (trigger.dataset.target) return
      const siblingPanel = trigger.parentElement?.querySelector(':scope > .nav-mobile__panel') as HTMLElement | null
      if (siblingPanel?.dataset.panel) trigger.dataset.target = siblingPanel.dataset.panel
    })
  })()

  // Hoist nested [data-panel] elements to be direct children of .nav-mobile__content
  // so sibling-based slide animations work correctly.
  ;(function flattenMobilePanels() {
    if (!navMobileContent) return
    const panels = Array.from(navMobileContent.querySelectorAll('.nav-mobile__panel'))
    panels.forEach(function (panel) {
      const ancestor = panel.parentElement && panel.parentElement.closest('.nav-mobile__panel') as HTMLElement | null
      if (ancestor && (ancestor as HTMLElement).dataset.panel) {
        (panel as HTMLElement).dataset.parent = (ancestor as HTMLElement).dataset.panel || ''
      }
    })
    panels.forEach(function (panel) {
      if (panel.parentElement !== navMobileContent) {
        navMobileContent.appendChild(panel)
      }
    })
  })()

  const mobilePanels = navMobile ? Array.from(navMobile.querySelectorAll('[data-panel]')) as HTMLElement[] : []
  const panelStack: string[] = ['root']
  let isPanelTransitioning = false
  let isMenuClosing = false

  function syncLogo(scrolled: boolean) {
    if (!logo) return
    const defaultLogo = logo.getAttribute('data-default-logo') || ''
    const scrolledLogo = logo.getAttribute('data-scrolled-logo') || ''
    const nextLogo = scrolled && scrolledLogo ? scrolledLogo : defaultLogo || scrolledLogo
    if (nextLogo && logo.getAttribute('src') !== nextLogo) {
      logo.setAttribute('src', nextLogo)
    }
  }

  function onScroll() {
    const scrolled = window.scrollY > 10
    root.classList.toggle('site-header--scrolled', scrolled)
    syncLogo(scrolled)
  }

  function getPanel(panelName: string): HTMLElement | undefined {
    return mobilePanels.find(function (panel) { return panel.dataset.panel === panelName })
  }

  function waitForTransition(element: HTMLElement, fallback?: number): Promise<void> {
    return new Promise(function (resolve) {
      let settled = false
      const done = function () {
        if (settled) return
        settled = true
        element.removeEventListener('transitionend', onEnd)
        resolve()
      }
      const onEnd = function (event: Event) {
        if ((event as TransitionEvent).target === element) done()
      }
      element.addEventListener('transitionend', onEnd)
      window.setTimeout(done, fallback || 360)
    })
  }

  function resetPanelStates() {
    mobilePanels.forEach(function (panel) {
      panel.classList.remove('is-active', 'is-entering-from-right', 'is-entering-from-left', 'is-exiting-to-left', 'is-exiting-to-right')
    })
    const rootPanel = getPanel('root')
    if (rootPanel) rootPanel.classList.add('is-active')
  }

  async function transitionMobilePanel(fromPanelName: string, toPanelName: string, direction: string) {
    if (isPanelTransitioning) return
    const currentPanel = getPanel(fromPanelName)
    const nextPanel = getPanel(toPanelName)
    if (!currentPanel || !nextPanel || currentPanel === nextPanel) return

    isPanelTransitioning = true
    nextPanel.classList.remove('is-active', 'is-exiting-to-left', 'is-exiting-to-right')
    nextPanel.classList.add(direction === 'back' ? 'is-entering-from-left' : 'is-entering-from-right')

    requestAnimationFrame(function () {
      currentPanel.classList.add(direction === 'back' ? 'is-exiting-to-right' : 'is-exiting-to-left')
      currentPanel.classList.remove('is-active')
      nextPanel.classList.add('is-active')
      nextPanel.classList.remove('is-entering-from-left', 'is-entering-from-right')
    })

    await Promise.all([waitForTransition(currentPanel), waitForTransition(nextPanel)])
    currentPanel.classList.remove('is-exiting-to-left', 'is-exiting-to-right')
    nextPanel.classList.remove('is-entering-from-left', 'is-entering-from-right')
    isPanelTransitioning = false
  }

  function openMobileMenu() {
    if (!navMobile || !hamburger) return
    panelStack.length = 1
    panelStack[0] = 'root'
    resetPanelStates()
    navMobile.classList.add('nav-mobile--open')
    navMobile.setAttribute('aria-hidden', 'false')
    hamburger.classList.add('site-header__hamburger--open')
    hamburger.setAttribute('aria-expanded', 'true')
    document.body.classList.add('nav-mobile-open')
  }

  async function closeMobileMenu() {
    if (!navMobile || !hamburger) return
    if (isMenuClosing) return
    isMenuClosing = true
    navMobile.classList.remove('nav-mobile--open')
    navMobile.setAttribute('aria-hidden', 'true')
    hamburger.classList.remove('site-header__hamburger--open')
    hamburger.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('nav-mobile-open')
    await waitForTransition(navMobile, 340)
    panelStack.length = 1
    panelStack[0] = 'root'
    resetPanelStates()
    isMenuClosing = false
  }

  async function pushPanel(panelName: string) {
    if (!getPanel(panelName)) return
    const current = panelStack[panelStack.length - 1]
    panelStack.push(panelName)
    await transitionMobilePanel(current, panelName, 'forward')
  }

  async function popPanel() {
    if (panelStack.length <= 1) return
    const current = panelStack.pop()
    const previous = panelStack[panelStack.length - 1]
    if (!current || !previous) return
    await transitionMobilePanel(current, previous, 'back')
  }

  function openSiteSearch() {
    if (!siteSearch) return
    if (navMobile && navMobile.classList.contains('nav-mobile--open')) closeMobileMenu()
    siteSearch.classList.add('site-search--open')
    siteSearch.setAttribute('aria-hidden', 'false')
    if (mobileSearchBtn) mobileSearchBtn.setAttribute('aria-expanded', 'true')
    document.body.classList.add('site-search-open')
    window.setTimeout(function () {
      if (siteSearchInput) siteSearchInput.focus()
    }, 120)
  }

  function closeSiteSearch() {
    if (!siteSearch) return
    siteSearch.classList.remove('site-search--open')
    siteSearch.setAttribute('aria-hidden', 'true')
    if (mobileSearchBtn) mobileSearchBtn.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('site-search-open')
    if (siteSearchInput) siteSearchInput.blur()
  }

  function updateSiteSearchClear() {
    if (!siteSearchClear || !siteSearchInput) return
    siteSearchClear.hidden = siteSearchInput.value.length === 0
  }

  function submitSearch(input?: HTMLInputElement | null) {
    const keyword = input?.value?.trim() || ''
    if (!keyword) return

    const searchUrl = new URL('/search', window.location.origin)
    searchUrl.searchParams.set('q', keyword)
    window.location.assign(searchUrl.toString())
  }

  // Scroll handler
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions)

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', async function () {
      if (navMobile && navMobile.classList.contains('nav-mobile--open')) {
        await closeMobileMenu()
      } else {
        openMobileMenu()
      }
    })
  }

  // Mobile nav click delegation
  if (navMobile) {
    navMobile.addEventListener('click', async function (event: Event) {
      const target = event.target as Element
      const backButton = target.closest('[data-back]')
      if (backButton) { await popPanel(); return }
      const panelButton = target.closest('[data-target]') as HTMLElement | null
      if (panelButton) { await pushPanel(panelButton.dataset.target || ''); return }
      const link = target.closest('a')
      if (link) await closeMobileMenu()
    })
  }

  // Keyboard
  window.addEventListener('keydown', async function (event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    if (siteSearch && siteSearch.classList.contains('site-search--open')) { closeSiteSearch(); return }
    if (navMobile && navMobile.classList.contains('nav-mobile--open')) await closeMobileMenu()
  })

  // Resize: close overlays on desktop
  window.addEventListener('resize', async function () {
    if (window.innerWidth > 767) {
      if (navMobile && navMobile.classList.contains('nav-mobile--open')) await closeMobileMenu()
      if (siteSearch && siteSearch.classList.contains('site-search--open')) closeSiteSearch()
    }
  })

  // Mobile search
  if (headerSearchInput) {
    headerSearchInput.addEventListener('keydown', function (event: KeyboardEvent) {
      if (event.key !== 'Enter') return
      event.preventDefault()
      submitSearch(headerSearchInput)
    })
  }
  if (mobileSearchBtn) mobileSearchBtn.addEventListener('click', openSiteSearch)
  if (siteSearchClose) siteSearchClose.addEventListener('click', closeSiteSearch)
  if (siteSearchInput) siteSearchInput.addEventListener('input', updateSiteSearchClear)
  if (siteSearchClear) {
    siteSearchClear.addEventListener('click', function () {
      if (!siteSearchInput) return
      siteSearchInput.value = ''
      updateSiteSearchClear()
      siteSearchInput.focus()
    })
  }
  if (siteSearchForm) {
    siteSearchForm.addEventListener('submit', function (event: Event) {
      event.preventDefault()
      submitSearch(siteSearchInput)
    })
  }
}
