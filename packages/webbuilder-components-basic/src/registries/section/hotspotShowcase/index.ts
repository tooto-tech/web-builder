import type { Editor } from 'grapesjs'

export const WB_HOTSPOT_SHOWCASE_TYPE = 'wb-hotspot-showcase'
export const WB_HOTSPOT_SHOWCASE_ITEM_TYPE = 'wb-hotspot-showcase-item'

export interface HotspotShowcaseHotspot {
  image: string
  title: string
  desc: string
  buttonText: string
  link: string
  left: string
  top: string
  mobileLeft: string
  mobileTop: string
}

export interface HotspotShowcaseItem {
  desktopImage: string
  mobileImage: string
  title: string
  desc: string
  primaryButtonText: string
  primaryLink: string
  secondaryButtonText: string
  secondaryLink: string
  hotspots: HotspotShowcaseHotspot[]
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="3" y="4" width="18" height="16" rx="2" />
  <circle cx="9" cy="10" r="1.5" />
  <path d="M3 16l5-4 4 3 4-5 5 6" />
</svg>`

const HOTSPOT_SHOWCASE_CSS = `
  .wb-hotspot-showcase {
    position: relative;
    width: 100%;
    background: #ffffff;
    color: #ffffff;
    overflow: hidden;
    --swiper-pagination-bullet-horizontal-gap: 0;
    --swiper-pagination-color: #fff;
    --swiper-pagination-bullet-inactive-color: rgba(255, 255, 255, 0.4);
    --swiper-pagination-bullet-width: 40px;
    --swiper-pagination-bullet-height: 2px;
    --swiper-pagination-bullet-border-radius: 0;
    --swiper-pagination-bottom: 40px;
    --swiper-pagination-top: auto;
    
  }
  .wb-hotspot-showcase * {
    box-sizing: border-box;
  }
  .wb-hotspot-showcase.swiper {
    aspect-ratio: 144 / 80;
    max-height: 100vh;
  }
  .wb-hotspot-showcase__slides {
    position: relative;
    // min-height: 760px;
  }
  .wb-hotspot-showcase__slide {
    position: relative;
    // min-height: 760px;
    overflow: hidden;
    background: #d7d9dd;
  }
  .wb-hotspot-showcase__media,
  .wb-hotspot-showcase__media img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .wb-hotspot-showcase__media img {
    object-fit: cover;
  }
  .wb-hotspot-showcase__bg--mobile {
    display: none !important;
  }
  .wb-hotspot-showcase__bg--desktop {
    display: block !important;
  }
  .wb-hotspot-showcase__overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(14, 18, 28, 0.72) 0%, rgba(14, 18, 28, 0.28) 38%, rgba(14, 18, 28, 0.05) 66%, rgba(14, 18, 28, 0) 100%);
  }
  .wb-hotspot-showcase__inner {
    position: relative;
    z-index: 2;
    height: 100%;
    max-width: 1360px;
    margin: 0 auto;
    padding: 0 24px 96px;
  }
  .wb-hotspot-showcase__content {
    position: absolute;
    left: 24px;
    top: 50%;
    transform: translateY(-50%);
    max-width: 560px;
  }
  .wb-hotspot-showcase__title {
    margin: 0 0 20px;
    font-size: clamp(38px, 4vw, 58px);
    line-height: 1.08;
    font-weight: 600;
  }
  .wb-hotspot-showcase__desc {
    margin: 0 0 32px;
    max-width: 520px;
    font-size: 16px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.82);
  }
  .wb-hotspot-showcase__actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .wb-hotspot-showcase__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 150px;
    min-height: 54px;
    padding: 14px 28px;
    text-decoration: none;
    font-size: 15px;
    line-height: 1.2;
    font-weight: 600;
    transition: transform 0.22s ease, opacity 0.22s ease;
  }
  .wb-hotspot-showcase__btn--primary {
    background: #ffd600;
    color: #06111d;
  }
  .wb-hotspot-showcase__btn--secondary {
    background: #003152;
    color: #ffffff;
  }
  .wb-hotspot-showcase__btn:hover {
    opacity: 0.88;
    transform: translateY(-3px);
  }
  .wb-hotspot-showcase__hotspot {
    position: absolute;
    z-index: 4;
    left: var(--wb-hs-left, 50%);
    top: var(--wb-hs-top, 50%);
    width: 28px;
    height: 28px;
    margin: -14px 0 0 -14px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    cursor: pointer;
    box-shadow: 0 0 0 12px rgba(255, 255, 255, 0.16);
  }
  .wb-hotspot-showcase__hotspot::before {
    content: "";
    position: absolute;
    inset: -10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    animation: wb-hotspot-pulse 2.2s ease-out infinite;
  }
  .wb-hotspot-showcase__hotspot::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: #ffffff;
    transition: transform 0.25s ease, background 0.25s ease;
  }
  .wb-hotspot-showcase__hotspot span {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    border-radius: 999px;
  }
  .wb-hotspot-showcase__hotspot.is-active::after {
    background: #ffd600;
    transform: scale(1.12);
  }
  .wb-hotspot-showcase__card {
    position: absolute;
    right: 24px;
    bottom: 68px;
    z-index: 5;
    width: 440px;
    max-width: calc(100% - 48px);
    display: grid;
    grid-template-columns: 164px minmax(0, 1fr);
    gap: 16px;
    padding: 10px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.76) 0%, #ffffff 100%);
    backdrop-filter: blur(10px);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.14);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(18px) scale(0.96);
    transform-origin: right bottom;
    transition:
      opacity 0.28s ease,
      transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
      visibility 0s linear 0.34s;
  }
  .wb-hotspot-showcase__card.is-visible {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0) scale(1);
    transition:
      opacity 0.28s ease,
      transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
      visibility 0s linear 0s;
  }
  .wb-hotspot-showcase__card-media {
    aspect-ratio: 1 / 1;
    background: #dfe4e8;
    overflow: hidden;
  }
  .wb-hotspot-showcase__card-media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
  .wb-hotspot-showcase__card-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: #0b1118;
  }
  .wb-hotspot-showcase__card-title {
    margin: 0 0 10px;
    font-size: 22px;
    line-height: 1.2;
    font-weight: 600;
  }
  .wb-hotspot-showcase__card-desc {
    margin: 0 0 16px;
    font-size: 14px;
    line-height: 1.58;
    color: #6f7880;
  }
  .wb-hotspot-showcase__card-link {
    display: inline-flex;
    width: max-content;
    align-items: center;
    color: #0f4770;
    text-decoration: underline;
    font-size: 14px;
    line-height: 1.3;
    font-weight: 500;
  }
  .wb-hotspot-showcase__pagination {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 28px;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
  }
  .wb-hotspot-showcase__pagination .swiper-pagination-bullet {
    margin: 0 4px !important;
  }
  .wb-hotspot-showcase [data-ani] {
    opacity: 1;
  }
  .wb-hotspot-showcase.is-ani-ready .wb-hotspot-showcase__slide [data-ani] {
    opacity: 0;
  }
  .wb-hotspot-showcase.is-ani-ready .wb-hotspot-showcase__slide.swiper-slide-active [data-ani] {
    opacity: 1;
  }
  @keyframes wb-hotspot-pulse {
    0% {
      transform: scale(0.7);
      opacity: 0.85;
    }
    70% {
      transform: scale(1.35);
      opacity: 0;
    }
    100% {
      transform: scale(1.35);
      opacity: 0;
    }
  }
  @media (max-width: 767px) {
    .wb-hotspot-showcase__slides,
    .wb-hotspot-showcase__slide,
    .wb-hotspot-showcase__inner {
      // min-height: 100vh;
    }
    .wb-hotspot-showcase.swiper{
      aspect-ratio: 75/120;
      --swiper-pagination-bottom: 16px;
    }
    .wb-hotspot-showcase__overlay {
      background:
        linear-gradient(180deg, rgba(70, 71, 78, 0.86) 0%, rgba(70, 71, 78, 0.62) 24%, rgba(70, 71, 78, 0.2) 48%, rgba(70, 71, 78, 0) 68%);
    }
    .wb-hotspot-showcase__bg--desktop {
      display: none !important;
    }
    .wb-hotspot-showcase__bg--mobile {
      display: block !important;
    }
    .wb-hotspot-showcase__inner {
      padding: 0 20px 86px;
    }
    .wb-hotspot-showcase__content {
      position: relative;
      left: auto;
      top: auto;
      transform: none;
      max-width: none;
      padding-top: 84px;
    }
    .wb-hotspot-showcase__title {
      margin-bottom: 16px;
      font-size: 30px;
      line-height: 1.12;
    }
    .wb-hotspot-showcase__desc {
      margin-bottom: 24px;
      font-size: 13px;
      line-height: 1.58;
    }
    .wb-hotspot-showcase__btn {
      min-width: 0;
      min-height: 44px;
      padding: 10px 16px;
      font-size: 13px;
    }
    .wb-hotspot-showcase__hotspot {
      left: var(--wb-hs-left-mobile, var(--wb-hs-left, 50%));
      top: var(--wb-hs-top-mobile, var(--wb-hs-top, 50%));
      width: 24px;
      height: 24px;
      margin: -12px 0 0 -12px;
      box-shadow: 0 0 0 10px rgba(255, 255, 255, 0.16);
    }
    .wb-hotspot-showcase__card {
      left: 20px;
      right: 20px;
      bottom: 48px;
      width: auto;
      max-width: none;
      grid-template-columns: 112px minmax(0, 1fr);
    }
    .wb-hotspot-showcase__card-title {
      margin-bottom: 8px;
      font-size: 18px;
    }
    .wb-hotspot-showcase__card-desc,
    .wb-hotspot-showcase__card-link {
      font-size: 13px;
    }
    .wb-hotspot-showcase__pagination {
      bottom: 16px;
    }
  }
`

export function createDefaultHotspotShowcaseHotspot(index = 0): HotspotShowcaseHotspot {
  const positions = [
    { left: '56%', top: '41%', mobileLeft: '65%', mobileTop: '38%' },
    { left: '73%', top: '34%', mobileLeft: '77%', mobileTop: '33%' },
    { left: '68%', top: '58%', mobileLeft: '72%', mobileTop: '56%' },
  ]
  const pos = positions[index % positions.length]
  return {
    image: 'https://placehold.co/600x600/e5e7eb/9ca3af?text=Hotspot',
    title: `Hotspot ${index + 1}`,
    desc: 'Use this hotspot to highlight a specific product or solution.',
    buttonText: 'See More',
    link: '#',
    left: pos.left,
    top: pos.top,
    mobileLeft: pos.mobileLeft,
    mobileTop: pos.mobileTop,
  }
}

export function createDefaultHotspotShowcaseItem(index = 0): HotspotShowcaseItem {
  return {
    desktopImage: `https://placehold.co/1600x900/cfd8e3/6b7280?text=Desktop+Scene+${index + 1}`,
    mobileImage: `https://placehold.co/900x1440/d7dee8/6b7280?text=Mobile+Scene+${index + 1}`,
    title: index === 0 ? 'Flexible Product Systems For Global Projects' : `Showcase Item ${index + 1}`,
    desc: 'Configure desktop and mobile imagery, then attach multiple hotspots to present product details directly on the visual.',
    primaryButtonText: 'Inquiry Now',
    primaryLink: '#',
    secondaryButtonText: 'Learn More',
    secondaryLink: '#',
    hotspots: [createDefaultHotspotShowcaseHotspot(0), createDefaultHotspotShowcaseHotspot(1)],
  }
}

export function normalizeHotspotShowcaseHotspots(raw: unknown): HotspotShowcaseHotspot[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed) || !parsed.length) return [createDefaultHotspotShowcaseHotspot(0)]

    const hotspots = parsed.map((hotspot, index) => {
      const source = hotspot && typeof hotspot === 'object' ? hotspot as Record<string, any> : {}
      const fallback = createDefaultHotspotShowcaseHotspot(index)
      return {
        image: `${source.image ?? fallback.image ?? ''}`,
        title: `${source.title ?? fallback.title ?? ''}`,
        desc: `${source.desc ?? fallback.desc ?? ''}`,
        buttonText: `${source.buttonText ?? fallback.buttonText ?? ''}`,
        link: `${source.link ?? fallback.link ?? '#'}`,
        left: `${source.left ?? fallback.left ?? '50%'}`,
        top: `${source.top ?? fallback.top ?? '50%'}`,
        mobileLeft: `${source.mobileLeft ?? fallback.mobileLeft ?? source.left ?? fallback.left ?? '50%'}`,
        mobileTop: `${source.mobileTop ?? fallback.mobileTop ?? source.top ?? fallback.top ?? '50%'}`,
      }
    })

    return hotspots.length ? hotspots : [createDefaultHotspotShowcaseHotspot(0)]
  } catch {
    return [createDefaultHotspotShowcaseHotspot(0)]
  }
}

export function serializeHotspotShowcaseHotspots(hotspots: HotspotShowcaseHotspot[]): string {
  return JSON.stringify(normalizeHotspotShowcaseHotspots(hotspots))
}

function createTextNode(content: string) {
  return { type: 'textnode', content }
}

function freezeNode(extra: Record<string, unknown> = {}) {
  return {
    selectable: false,
    droppable: false,
    draggable: false,
    hoverable: false,
    highlightable: false,
    copyable: false,
    removable: false,
    layerable: false,
    ...extra,
  }
}

function hideNode(extra: Record<string, unknown> = {}) {
  return freezeNode({
    layerable: false,
    ...extra,
  })
}

function buildHotspotNode(hotspot: HotspotShowcaseHotspot, index: number) {
  return {
    tagName: 'button',
    name: `Hotspot ${index + 1}`,
        ...hideNode({
          attributes: {
            type: 'button',
            class: 'wb-hotspot-showcase__hotspot',
        style: `--wb-hs-left:${hotspot.left};--wb-hs-top:${hotspot.top};--wb-hs-left-mobile:${hotspot.mobileLeft};--wb-hs-top-mobile:${hotspot.mobileTop};`,
        'data-image': hotspot.image,
        'data-title': hotspot.title,
        'data-desc': hotspot.desc,
        'data-button-text': hotspot.buttonText,
        'data-link': hotspot.link,
        'aria-label': hotspot.title || `Hotspot ${index + 1}`,
      },
      components: [{ tagName: 'span', ...freezeNode() }],
    }),
  }
}

function buildSlideContent(item: HotspotShowcaseItem) {
  const hotspots = normalizeHotspotShowcaseHotspots(item.hotspots)
  return [
    {
      tagName: 'div',
      ...hideNode({
        attributes: { class: 'wb-hotspot-showcase__media' },
        components: [
          {
            tagName: 'img',
            ...hideNode({
              attributes: {
                src: item.desktopImage,
                alt: item.title,
                class: 'wb-hotspot-showcase__bg--desktop',
              },
            }),
          },
          {
            tagName: 'img',
            ...hideNode({
              attributes: {
                src: item.mobileImage || item.desktopImage,
                alt: item.title,
                class: 'wb-hotspot-showcase__bg--mobile',
              },
            }),
          },
        ],
      }),
    },
    {
      tagName: 'div',
      ...hideNode({ attributes: { class: 'wb-hotspot-showcase__overlay' } }),
    },
    {
      tagName: 'div',
      ...hideNode({
        attributes: { class: 'wb-hotspot-showcase__inner' },
        components: [
          {
            tagName: 'div',
            ...hideNode({
              attributes: { class: 'wb-hotspot-showcase__content' },
              components: [
                {
                  tagName: 'h2',
                  ...hideNode({
                    attributes: {
                      class: 'wb-hotspot-showcase__title',
                      'data-ani': 'animate__fadeInUp',
                      'data-ani-duration': '0.8s',
                      'data-ani-delay': '0.05s',
                    },
                    components: [createTextNode(item.title)],
                  }),
                },
                {
                  tagName: 'p',
                  ...hideNode({
                    attributes: {
                      class: 'wb-hotspot-showcase__desc',
                      'data-ani': 'animate__fadeInUp',
                      'data-ani-duration': '0.8s',
                      'data-ani-delay': '0.15s',
                    },
                    components: [createTextNode(item.desc)],
                  }),
                },
                {
                  tagName: 'div',
                  ...hideNode({
                    attributes: { class: 'wb-hotspot-showcase__actions' },
                    components: [
                      {
                        tagName: 'a',
                        ...hideNode({
                          attributes: {
                            href: item.primaryLink || '#',
                            class: 'wb-hotspot-showcase__btn wb-hotspot-showcase__btn--primary',
                            'data-ani': 'animate__fadeInUp',
                            'data-ani-duration': '0.8s',
                            'data-ani-delay': '0.25s',
                          },
                          components: [createTextNode(item.primaryButtonText || 'Inquiry Now')],
                        }),
                      },
                      {
                        tagName: 'a',
                        ...hideNode({
                          attributes: {
                            href: item.secondaryLink || '#',
                            class: 'wb-hotspot-showcase__btn wb-hotspot-showcase__btn--secondary',
                            'data-ani': 'animate__fadeInUp',
                            'data-ani-duration': '0.8s',
                            'data-ani-delay': '0.35s',
                          },
                          components: [createTextNode(item.secondaryButtonText || 'Learn More')],
                        }),
                      },
                    ],
                  }),
                },
              ],
            }),
          },
          ...hotspots.map((hotspot, hotspotIndex) => buildHotspotNode(hotspot, hotspotIndex)),
          {
            tagName: 'div',
            ...hideNode({
              attributes: { class: 'wb-hotspot-showcase__card' },
              components: [
                {
                  tagName: 'div',
                  ...hideNode({
                    attributes: { class: 'wb-hotspot-showcase__card-media' },
                    components: [
                      {
                        tagName: 'img',
                        ...hideNode({
                          attributes: {
                            class: 'wb-hotspot-showcase__card-image',
                            src: '',
                            alt: '',
                          },
                        }),
                      },
                    ],
                  }),
                },
                {
                  tagName: 'div',
                  ...hideNode({
                    attributes: { class: 'wb-hotspot-showcase__card-body' },
                    components: [
                      {
                        tagName: 'h3',
                        ...hideNode({
                          attributes: { class: 'wb-hotspot-showcase__card-title' },
                          components: [createTextNode('')],
                        }),
                      },
                      {
                        tagName: 'p',
                        ...hideNode({
                          attributes: { class: 'wb-hotspot-showcase__card-desc' },
                          components: [createTextNode('')],
                        }),
                      },
                      {
                        tagName: 'a',
                        ...hideNode({
                          attributes: {
                            href: '#',
                            class: 'wb-hotspot-showcase__card-link',
                          },
                          components: [createTextNode('See More')],
                        }),
                      },
                    ],
                  }),
                },
              ],
            }),
          },
        ],
      }),
    },
  ]
}

function buildSlideComponent(item: HotspotShowcaseItem, index: number) {
  const hotspots = normalizeHotspotShowcaseHotspots(item.hotspots)
  return {
    type: WB_HOTSPOT_SHOWCASE_ITEM_TYPE,
    hsDesktopImage: item.desktopImage,
    hsMobileImage: item.mobileImage,
    hsTitle: item.title,
    hsDesc: item.desc,
    hsPrimaryButtonText: item.primaryButtonText,
    hsPrimaryLink: item.primaryLink,
    hsSecondaryButtonText: item.secondaryButtonText,
    hsSecondaryLink: item.secondaryLink,
    hsHotspotsSchema: serializeHotspotShowcaseHotspots(hotspots),
    attributes: {
      class: 'swiper-slide wb-hotspot-showcase__slide',
      'data-slide-index': String(index),
    },
  }
}

function buildPaginationNode() {
  return {
    tagName: 'div',
    ...hideNode({
      name: '分页',
      attributes: { class: 'wb-hotspot-showcase__pagination' },
      components: [],
    }),
  }
}

function makeHotspotShowcaseScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      __wbHotspotCleanup?: () => void
      __wbHotspotSwiper?: any
      __wbHotspotObserver?: MutationObserver | null
    }

    if (root.__wbHotspotCleanup) {
      root.__wbHotspotCleanup()
      root.__wbHotspotCleanup = undefined
    }
    root.__wbHotspotObserver?.disconnect?.()
    root.__wbHotspotObserver = null
    root.__wbHotspotSwiper?.destroy?.(true, true)
    root.__wbHotspotSwiper = null

    const ensureAssets = () =>
      new Promise<void>((resolve) => {
        const w = window as any
        if (w.Swiper) {
          resolve()
          return
        }

        if (!document.querySelector('link[data-wb-swiper]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
          link.setAttribute('data-wb-swiper', '1')
          document.head.appendChild(link)
        }
        if (!document.querySelector('link[data-wb-animate-css]')) {
          const animateLink = document.createElement('link')
          animateLink.rel = 'stylesheet'
          animateLink.href = 'https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css'
          animateLink.setAttribute('data-wb-animate-css', '1')
          document.head.appendChild(animateLink)
        }

        const existingScript = document.querySelector('script[data-wb-swiper]') as HTMLScriptElement | null
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(), { once: true })
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
        script.async = true
        script.setAttribute('data-wb-swiper', '1')
        script.onload = () => resolve()
        document.body.appendChild(script)
      })

    function closeSlideCard(slide: HTMLElement | null) {
      if (!slide) return
      const hotspots = Array.from(slide.querySelectorAll('.wb-hotspot-showcase__hotspot')) as HTMLElement[]
      const card = slide.querySelector('.wb-hotspot-showcase__card') as HTMLElement | null
      hotspots.forEach((hotspot) => hotspot.classList.remove('is-active'))
      card?.classList.remove('is-visible')
    }

    function openHotspot(slide: HTMLElement, hotspot: HTMLElement) {
      const card = slide.querySelector('.wb-hotspot-showcase__card') as HTMLElement | null
      const cardImage = slide.querySelector('.wb-hotspot-showcase__card-image') as HTMLImageElement | null
      const cardTitle = slide.querySelector('.wb-hotspot-showcase__card-title') as HTMLElement | null
      const cardDesc = slide.querySelector('.wb-hotspot-showcase__card-desc') as HTMLElement | null
      const cardLink = slide.querySelector('.wb-hotspot-showcase__card-link') as HTMLAnchorElement | null
      if (!card || !cardImage || !cardTitle || !cardDesc || !cardLink) return

      const hotspots = Array.from(slide.querySelectorAll('.wb-hotspot-showcase__hotspot')) as HTMLElement[]
      hotspots.forEach((item) => item.classList.remove('is-active'))
      hotspot.classList.add('is-active')

      cardImage.src = hotspot.getAttribute('data-image') || ''
      cardImage.alt = hotspot.getAttribute('data-title') || ''
      cardTitle.textContent = hotspot.getAttribute('data-title') || ''
      cardDesc.textContent = hotspot.getAttribute('data-desc') || ''
      cardLink.textContent = hotspot.getAttribute('data-button-text') || 'See More'
      cardLink.href = hotspot.getAttribute('data-link') || '#'
      card.classList.add('is-visible')
    }

    function runAnimation(slide: HTMLElement | null) {
      if (!slide) return
      slide.querySelectorAll('[data-ani]').forEach((node) => {
        const el = node as HTMLElement
        const animName = el.getAttribute('data-ani') || 'animate__fadeInUp'
        const duration = el.getAttribute('data-ani-duration') || '0.8s'
        const delay = el.getAttribute('data-ani-delay') || '0s'
        el.style.animationDuration = duration
        el.style.animationDelay = delay
        el.classList.add('animate__animated', animName)
        el.style.opacity = '1'
      })
    }

    function clearAnimation(slide: HTMLElement | null) {
      if (!slide) return
      slide.querySelectorAll('[data-ani]').forEach((node) => {
        const el = node as HTMLElement
        const animName = el.getAttribute('data-ani') || 'animate__fadeInUp'
        el.classList.remove('animate__animated', animName)
        el.style.opacity = '0'
        el.style.animationDuration = ''
        el.style.animationDelay = ''
      })
    }

    const onClick = (event: Event) => {
      const target = event.target as Element | null
      if (!target) return

      const hotspot = target.closest('.wb-hotspot-showcase__hotspot') as HTMLElement | null
      if (hotspot && root.contains(hotspot)) {
        event.preventDefault()
        const slide = hotspot.closest('.wb-hotspot-showcase__slide') as HTMLElement | null
        if (!slide) return
        if (hotspot.classList.contains('is-active')) {
          closeSlideCard(slide)
          return
        }
        openHotspot(slide, hotspot)
        return
      }
    }

    root.addEventListener('click', onClick)

    const syncToRequestedIndex = () => {
      const swiper = root.__wbHotspotSwiper
      const slides = Array.from(root.querySelectorAll('.wb-hotspot-showcase__slide')) as HTMLElement[]
      if (!swiper || !slides.length) return
      const requestedIndex = Number(root.getAttribute('data-active-slide-index') || '0')
      if (!Number.isFinite(requestedIndex)) return
      const normalized = Math.max(0, Math.min(requestedIndex, slides.length - 1))
      swiper.slideToLoop?.(normalized, 0)
    }

    const getActiveRuntimeSlide = () =>
      (root.querySelector('.wb-hotspot-showcase__slide.swiper-slide-active') as HTMLElement | null)
      || (root.querySelector('.wb-hotspot-showcase__slide') as HTMLElement | null)

    ensureAssets().then(() => {
      const w = window as any
      const paginationEl = root.querySelector('.wb-hotspot-showcase__pagination') as HTMLElement | null
      const slides = Array.from(root.querySelectorAll('.wb-hotspot-showcase__slide')) as HTMLElement[]
      if (!w.Swiper || !slides.length) return

      root.__wbHotspotSwiper?.destroy?.(true, true)
      const canLoop = slides.length >= 3
      root.__wbHotspotSwiper = new w.Swiper(root, {
        loop: canLoop,
        loopAdditionalSlides: canLoop ? 1 : 0,
        speed: 600,
        autoplay: slides.length > 1 ? {
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        } : false,
        pagination: paginationEl ? {
          el: paginationEl,
          clickable: true,
        } : false,
        on: {
          init(swiper: any) {
            root.classList.add('is-ani-ready')
            const allSlides = Array.from(root.querySelectorAll('.wb-hotspot-showcase__slide')) as HTMLElement[]
            allSlides.forEach((slide) => clearAnimation(slide))
            runAnimation((swiper.slides?.[swiper.activeIndex] as HTMLElement | null) || getActiveRuntimeSlide())
          },
          slideChangeTransitionStart() {
            const allSlides = Array.from(root.querySelectorAll('.wb-hotspot-showcase__slide')) as HTMLElement[]
            allSlides.forEach((slide) => {
              closeSlideCard(slide)
              clearAnimation(slide)
            })
          },
          slideChangeTransitionEnd(swiper: any) {
            runAnimation(swiper.slides?.[swiper.activeIndex] as HTMLElement | null)
          },
        },
      })

      root.__wbHotspotObserver?.disconnect?.()
      root.__wbHotspotObserver = new MutationObserver(() => {
        syncToRequestedIndex()
      })
      root.__wbHotspotObserver.observe(root, {
        attributes: true,
        attributeFilter: ['data-active-slide-index'],
      })

      syncToRequestedIndex()
      window.requestAnimationFrame(() => {
        root.classList.add('is-ani-ready')
        runAnimation(getActiveRuntimeSlide())
      })
      window.setTimeout(() => {
        root.classList.add('is-ani-ready')
        runAnimation(getActiveRuntimeSlide())
      }, 60)
    })

    root.__wbHotspotCleanup = () => {
      root.classList.remove('is-ani-ready')
      root.removeEventListener('click', onClick)
      root.__wbHotspotObserver?.disconnect?.()
      root.__wbHotspotObserver = null
      root.__wbHotspotSwiper?.destroy?.(true, true)
      root.__wbHotspotSwiper = null
    }
  }
}

function syncHotspotShowcaseSlide(slide: any) {
  const item: HotspotShowcaseItem = {
    desktopImage: `${slide.get('hsDesktopImage') || ''}`,
    mobileImage: `${slide.get('hsMobileImage') || slide.get('hsDesktopImage') || ''}`,
    title: `${slide.get('hsTitle') || ''}`,
    desc: `${slide.get('hsDesc') || ''}`,
    primaryButtonText: `${slide.get('hsPrimaryButtonText') || 'Inquiry Now'}`,
    primaryLink: `${slide.get('hsPrimaryLink') || '#'}`,
    secondaryButtonText: `${slide.get('hsSecondaryButtonText') || 'Learn More'}`,
    secondaryLink: `${slide.get('hsSecondaryLink') || '#'}`,
    hotspots: normalizeHotspotShowcaseHotspots(slide.get('hsHotspotsSchema')),
  }

  const attrs = {
    ...(slide.getAttributes?.() || {}),
    class: slide.getAttributes?.()?.class || 'wb-hotspot-showcase__slide',
  }
  slide.addAttributes?.(attrs)
  slide.components(buildSlideContent(item))
  slide.set?.('name', item.title?.trim() || '展示项')
}

export function registerHotspotShowcaseComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_HOTSPOT_SHOWCASE_TYPE)) return

  domComponents.addType(WB_HOTSPOT_SHOWCASE_ITEM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.classList?.contains('wb-hotspot-showcase__slide')
        ? { type: WB_HOTSPOT_SHOWCASE_ITEM_TYPE }
        : false,
    model: {
      defaults: {
        name: '展示项',
        tagName: 'article',
        draggable: '.wb-hotspot-showcase__slides',
        droppable: false,
        selectable: true,
        copyable: true,
        layerable: true,
        hsDesktopImage: createDefaultHotspotShowcaseItem(0).desktopImage,
        hsMobileImage: createDefaultHotspotShowcaseItem(0).mobileImage,
        hsTitle: createDefaultHotspotShowcaseItem(0).title,
        hsDesc: createDefaultHotspotShowcaseItem(0).desc,
        hsPrimaryButtonText: 'Inquiry Now',
        hsPrimaryLink: '#',
        hsSecondaryButtonText: 'Learn More',
        hsSecondaryLink: '#',
        hsHotspotsSchema: serializeHotspotShowcaseHotspots([
          createDefaultHotspotShowcaseHotspot(0),
          createDefaultHotspotShowcaseHotspot(1),
        ]),
        attributes: {
          class: 'wb-hotspot-showcase__slide',
          'data-slide-index': '0',
        },
        traits: [
          ({ type: 'image-picker', label: 'PC 图片', name: 'hsDesktopImage', changeProp: true, ui: { showPreview: true } } as any),
          ({ type: 'image-picker', label: '移动端图片', name: 'hsMobileImage', changeProp: true, ui: { showPreview: true } } as any),
          { type: 'text', label: '标题', name: 'hsTitle', changeProp: true },
          { type: 'textarea', label: '描述', name: 'hsDesc', changeProp: true },
          { type: 'text', label: '主按钮文字', name: 'hsPrimaryButtonText', changeProp: true },
          { type: 'page-link', label: '主按钮链接', name: 'hsPrimaryLink', placeholder: '#', changeProp: true },
          { type: 'text', label: '次按钮文字', name: 'hsSecondaryButtonText', changeProp: true },
          { type: 'page-link', label: '次按钮链接', name: 'hsSecondaryLink', placeholder: '#', changeProp: true },
          { type: 'hotspot-showcase-hotspots', name: 'hsHotspotsSchema', label: 'Hotspots', full: true, changeProp: true },
        ],
        components: buildSlideContent(createDefaultHotspotShowcaseItem(0)),
      },
      init(this: any) {
        this.listenTo(
          this,
          'change:hsDesktopImage change:hsMobileImage change:hsTitle change:hsDesc change:hsPrimaryButtonText change:hsPrimaryLink change:hsSecondaryButtonText change:hsSecondaryLink change:hsHotspotsSchema',
          () => {
            syncHotspotShowcaseSlide(this)
            const root = this.parent?.()?.parent?.()
            root?.refreshStructure?.()
          }
        )
        this.on?.('change:status', () => {
          if (this.get?.('status') === 'selected') {
            const root = this.parent?.()?.parent?.()
            root?.setActiveSlideByComponent?.(this)
          }
        })
        syncHotspotShowcaseSlide(this)
      },
    },
  })

  domComponents.addType(WB_HOTSPOT_SHOWCASE_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'hotspot-showcase'
        ? { type: WB_HOTSPOT_SHOWCASE_TYPE }
        : false,
    model: {
      defaults: {
        name: 'Hotspot Showcase',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'hotspot-showcase',
          class: 'swiper wb-hotspot-showcase',
          'data-active-slide-index': '0',
        },
        traits: [
          { type: 'hotspot-showcase-slides', name: 'hsSlidesAction', label: '展示项', full: true },
        ],
        styles: HOTSPOT_SHOWCASE_CSS,
        activeSlideIndex: 0,
        script: makeHotspotShowcaseScript(),
        'script-export': makeHotspotShowcaseScript(),
        components: [
          {
            tagName: 'div',
            name: 'Slides',
            selectable: true,
            droppable: true,
            draggable: false,
            hoverable: true,
            highlightable: true,
            copyable: false,
            removable: false,
            layerable: true,
            ...{
              attributes: { class: 'swiper-wrapper wb-hotspot-showcase__slides' },
              components: [
                buildSlideComponent(createDefaultHotspotShowcaseItem(0), 0),
                buildSlideComponent(createDefaultHotspotShowcaseItem(1), 1),
              ],
            },
          },
          buildPaginationNode(),
        ],
      },

      init(this: any) {
        const slidesCollection = this.getSlidesContainer()?.components?.()
        if (slidesCollection) {
          this.listenTo(slidesCollection, 'add remove reset', this.refreshStructure)
        }
        this.refreshStructure()
      },

      getSlidesContainer(this: any) {
        return this.components()?.at(0) ?? null
      },

      getPagination(this: any) {
        return this.components()?.at(1) ?? null
      },

      addSlideItem(this: any) {
        const slidesContainer = this.getSlidesContainer()
        const slidesCollection = slidesContainer?.components?.()
        if (!slidesCollection) return
        slidesCollection.add(buildSlideComponent(createDefaultHotspotShowcaseItem(slidesCollection.length || 0), slidesCollection.length || 0))
        this.refreshStructure()
      },

      refreshStructure(this: any) {
        const slidesContainer = this.getSlidesContainer()
        const slidesCollection = slidesContainer?.components?.()
        if (!slidesCollection) return

        if (!slidesCollection.length) {
          slidesCollection.add(buildSlideComponent(createDefaultHotspotShowcaseItem(0), 0))
        }

        const activeIndex = Math.max(0, Math.min(Number(this.get('activeSlideIndex')) || 0, slidesCollection.length - 1))
        this.set?.('activeSlideIndex', activeIndex, { silent: true })

        slidesCollection.each?.((slide: any, index: number) => {
          const attrs = { ...(slide.getAttributes?.() || {}) }
          attrs.class = 'swiper-slide wb-hotspot-showcase__slide'
          attrs['data-slide-index'] = String(index)
          slide.addAttributes?.(attrs)
          slide.set?.('name', slide.get?.('hsTitle')?.trim?.() || `展示项 ${index + 1}`)
        })

        const rootAttrs = { ...(this.getAttributes?.() || {}) }
        rootAttrs['data-active-slide-index'] = String(activeIndex)
        this.addAttributes?.(rootAttrs)
      },

      setActiveSlide(this: any, index: number) {
        this.set?.('activeSlideIndex', index, { silent: true })
        this.refreshStructure()
      },

      setActiveSlideByComponent(this: any, slideComponent: any) {
        const slidesCollection = this.getSlidesContainer()?.components?.()
        if (!slidesCollection) return
        const index = slidesCollection.indexOf?.(slideComponent)
        if (typeof index === 'number' && index >= 0) {
          this.setActiveSlide(index)
        }
      },
    },
  })

  editor.BlockManager?.add(WB_HOTSPOT_SHOWCASE_TYPE, {
    label: 'Hotspot Showcase',
    category: 'Sections',
    media: BLOCK_ICON,
    content: { type: WB_HOTSPOT_SHOWCASE_TYPE },
  })
}
