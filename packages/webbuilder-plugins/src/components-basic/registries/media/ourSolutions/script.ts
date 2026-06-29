export function makeOurSolutionsScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      __wbOurSolutionsInit?: boolean
      _wbSolutionsSwiper?: any
    }

    if (root.__wbOurSolutionsInit) return
    root.__wbOurSolutionsInit = true

    const ensureAssets = () =>
      new Promise<void>((resolve) => {
        const w = window as any
        const swiperStyleId = 'wb-our-solutions-swiper-style'
        const swiperScriptId = 'wb-our-solutions-swiper-script'
        if (w.Swiper) {
          resolve()
          return
        }

        if (!document.getElementById(swiperStyleId)) {
          const link = document.createElement('link')
          link.id = swiperStyleId
          link.rel = 'stylesheet'
          link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
          document.head.appendChild(link)
        }

        const existingScript = document.getElementById(swiperScriptId) as HTMLScriptElement | null
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(), { once: true })
          return
        }

        const script = document.createElement('script')
        script.id = swiperScriptId
        script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
        script.async = true
        script.onload = () => resolve()
        document.body.appendChild(script)
      })

    const init = () => {
      const w = window as any
      const swiperEl = root.querySelector('.wb-our-solutions__swiper') as HTMLElement | null
      const prevEl = root.querySelector('.wb-our-solutions__nav-prev') as HTMLElement | null
      const nextEl = root.querySelector('.wb-our-solutions__nav-next') as HTMLElement | null
      const paginationEl = root.querySelector('.wb-our-solutions__pagination') as HTMLElement | null
      if (!w.Swiper || !swiperEl) return

      root._wbSolutionsSwiper?.destroy?.(true, true)
      root._wbSolutionsSwiper = new w.Swiper(swiperEl, {
        slidesPerView: 1,
        spaceBetween: 20,
        speed: 600,
        pagination: paginationEl ? { el: paginationEl, clickable: true } : false,
        navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
        breakpoints: {
          768: {
            slidesPerView: 'auto',
            spaceBetween: 24,
          },
        },
      })
    }

    ensureAssets().then(init)
  }
}
