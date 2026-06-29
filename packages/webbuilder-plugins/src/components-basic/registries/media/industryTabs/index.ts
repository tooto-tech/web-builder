import type { Editor } from 'grapesjs'

export const WB_INDUSTRY_TABS_TYPE = 'wb-industry-tabs'

const DEFAULT_TAB_LABELS = [
  'Agricultural film',
  'Food packaging',
  'Consumer packaging',
  'Industrial packing',
  'Medical Packaging',
  'Wire And Cable Industry',
]

const INDUSTRY_TABS_CSS = `
  [data-wb-component="industry-tabs"] .wb-it__inner,
  [data-wb-component="industry-tabs"] > div {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  [data-wb-component="industry-tabs"] .wb-it__header,
  [data-wb-component="industry-tabs"] > div > div:first-child {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 40px;
  }
  [data-wb-component="industry-tabs"] .wb-it__heading,
  [data-wb-component="industry-tabs"] > div > div:first-child > h2 {
    margin: 0;
    font-size: 36px;
    font-weight: 600;
    color: #0B1F44;
  }
  [data-wb-component="industry-tabs"] .wb-it__cta,
  [data-wb-component="industry-tabs"] > div > div:first-child > a {
    margin-left: auto;
    background: #0B5ED7;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    flex-shrink: 0;
    white-space: nowrap;
  }
  [data-wb-component="industry-tabs"] .wb-it__tabs,
  [data-wb-component="industry-tabs"] > div > div:nth-child(2) {
    display: flex;
    gap: 32px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 40px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  [data-wb-component="industry-tabs"] .wb-it__tabs::-webkit-scrollbar,
  [data-wb-component="industry-tabs"] > div > div:nth-child(2)::-webkit-scrollbar {
    display: none;
  }
  [data-wb-component="industry-tabs"] .wb-it__tab-btn,
  [data-wb-component="industry-tabs"] > div > div:nth-child(2) > button {
    transition: color 0.2s ease, border-color 0.2s ease;
  }
  [data-wb-component="industry-tabs"] .wb-it__swiper {
    overflow: hidden;
  }
  [data-wb-component="industry-tabs"] .wb-it__slide {
    width: min(842px, calc(100vw - 48px)) !important;
    max-width: 100%;
  }
  [data-wb-component="industry-tabs"] .wb-it__slide-overlay {
    padding: 40px 32px;
    gap: 4px;
  }
  [data-wb-component="industry-tabs"] .wb-it__slide-title {
    font-size: 32px;
    line-height: 1.15;
  }
  [data-wb-component="industry-tabs"] .wb-it__slide-copy {
    font-size: 14px;
    line-height: 1.5;
  }
  [data-wb-component="industry-tabs"] .swiper-button-prev { left: -48px; color: #111827; }
  [data-wb-component="industry-tabs"] .swiper-button-next { right: -48px; color: #111827; }
  [data-wb-component="industry-tabs"] .swiper-button-prev::after,
  [data-wb-component="industry-tabs"] .swiper-button-next::after { font-size: 24px; font-weight: 700; }
  [data-wb-component="industry-tabs"] .wb-it__slide-img { transition: transform 0.3s ease; }
  [data-wb-component="industry-tabs"] .wb-it__slide-link:hover .wb-it__slide-img { transform: scale(1.1); }
  @media (max-width: 1023px) {
    [data-wb-component="industry-tabs"] {
      padding: 64px 0 !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__inner,
    [data-wb-component="industry-tabs"] > div {
      padding: 0 20px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__header,
    [data-wb-component="industry-tabs"] > div > div:first-child {
      flex-wrap: wrap;
      margin-bottom: 28px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__heading,
    [data-wb-component="industry-tabs"] > div > div:first-child > h2 {
      font-size: 30px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__tabs,
    [data-wb-component="industry-tabs"] > div > div:nth-child(2) {
      gap: 20px !important;
      margin-bottom: 28px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__slide {
      width: min(680px, calc(100vw - 56px)) !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__slide-overlay {
      padding: 28px 24px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__slide-title {
      font-size: 24px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__nav {
      width: 40px;
      height: 40px;
    }
    [data-wb-component="industry-tabs"] .swiper-button-prev {
      left: -20px !important;
    }
    [data-wb-component="industry-tabs"] .swiper-button-next {
      right: -20px !important;
    }
  }
  @media (max-width: 767px) {
    [data-wb-component="industry-tabs"] {
      padding: 56px 0 !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__inner,
    [data-wb-component="industry-tabs"] > div {
      padding: 0 16px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__header,
    [data-wb-component="industry-tabs"] > div > div:first-child {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 24px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__heading,
    [data-wb-component="industry-tabs"] > div > div:first-child > h2 {
      font-size: 26px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__cta,
    [data-wb-component="industry-tabs"] > div > div:first-child > a {
      margin-left: 0 !important;
      padding: 10px 18px !important;
      font-size: 13px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__tabs,
    [data-wb-component="industry-tabs"] > div > div:nth-child(2) {
      gap: 16px !important;
      margin-bottom: 24px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__tab-btn,
    [data-wb-component="industry-tabs"] > div > div:nth-child(2) > button {
      padding-bottom: 10px !important;
      font-size: 13px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__slide {
      width: calc(100vw - 32px) !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__slide-overlay {
      padding: 20px 16px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__slide-title {
      font-size: 20px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__slide-copy {
      font-size: 13px !important;
    }
    [data-wb-component="industry-tabs"] .wb-it__nav {
      display: none !important;
    }
  }
`

// ── 子结构构建函数 ────────────────────────────────────────────────

function buildSlideDef(title = 'Slide Title') {
  return {
    tagName: 'div',
    selectable: true,
    droppable: true,
    attributes: { class: 'swiper-slide wb-it__slide' },
    style: {
      'aspect-ratio': '842/490',
      width: 'min(842px, calc(100vw - 48px))',
      'max-width': '100%',
      position: 'relative',
      'flex-shrink': '0',
    },
    components: [
      {
        tagName: 'a',
        selectable: true,
        droppable: false,
        attributes: { href: '#', class: 'wb-it__slide-link' },
        style: {
          display: 'block',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        },
        components: [
          {
            tagName: 'img',
            selectable: true,
            droppable: false,
            attributes: {
              src: 'https://placehold.co/842x490/1a1a2e/ffffff',
              alt: '',
              class: 'wb-it__slide-img',
            },
            style: {
              width: '100%',
              height: '100%',
              'object-fit': 'cover',
              display: 'block',
            },
          },
          {
            tagName: 'div',
            selectable: true,
            droppable: true,
            attributes: { class: 'wb-it__slide-overlay' },
            style: {
              position: 'absolute',
              inset: '0',
              display: 'flex',
              'flex-direction': 'column',
              'justify-content': 'flex-end',
              padding: '40px 32px',
              gap: '4px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
            },
            components: [
              {
                tagName: 'h5',
                type: 'text',
                selectable: true,
                attributes: { class: 'wb-it__slide-title' },
                style: { 'font-size': '32px', color: '#ffffff', margin: '0', 'font-weight': '600' },
                components: title,
              },
              {
                tagName: 'p',
                type: 'text',
                selectable: true,
                attributes: { class: 'wb-it__slide-copy' },
                style: { 'font-size': '14px', color: '#ffffff', margin: '0' },
                components: 'Customized Color, Consistent Quality,',
              },
            ],
          },
        ],
      },
    ],
  }
}

function buildTabBtnDef(label: string, isActive: boolean) {
  return {
    tagName: 'button',
    type: 'text',
    selectable: true,
    droppable: false,
    attributes: { class: 'wb-it__tab-btn', type: 'button' },
    style: {
      'padding-bottom': '12px',
      border: 'none',
      'border-bottom': isActive ? '2px solid #2563eb' : '2px solid transparent',
      background: 'none',
      cursor: 'pointer',
      'font-size': '14px',
      'font-weight': isActive ? '600' : '400',
      color: isActive ? '#2563eb' : '#6b7280',
      'white-space': 'nowrap',
      'flex-shrink': '0',
    },
    components: label,
  }
}

function buildTabPanelDef(tabIndex: number, slideCount: number) {
  const slides = Array.from({ length: slideCount }, (_, i) => buildSlideDef(`Slide Title ${i + 1}`))
  return {
    tagName: 'div',
    selectable: true,
    droppable: false,
    attributes: { class: 'wb-it__panel' },
    style: { display: tabIndex === 0 ? 'block' : 'none' },
    components: [
      {
        tagName: 'div',
        removable: false,
        selectable: false,
        droppable: false,
        style: { position: 'relative' },
        attributes: { class: 'wb-it__panel-stage' },
        components: [
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            attributes: { class: 'swiper wb-it__swiper' },
            style: { overflow: 'hidden' },
            components: [
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                attributes: { class: 'swiper-wrapper' },
                components: slides,
              },
            ],
          },
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            attributes: { class: 'swiper-button-prev wb-it__nav wb-it__nav--prev' },
            style: { left: '-48px', color: '#111827' },
          },
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            attributes: { class: 'swiper-button-next wb-it__nav wb-it__nav--next' },
            style: { right: '-48px', color: '#111827' },
          },
        ],
      },
    ],
  }
}

// ── 注册 ─────────────────────────────────────────────────────────

export function registerIndustryTabsComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_INDUSTRY_TABS_TYPE)) return

  domComponents.addType(WB_INDUSTRY_TABS_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'industry-tabs'
        ? { type: WB_INDUSTRY_TABS_TYPE }
        : false,

    model: {
      defaults: {
        name: '行业应用 Tabs',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        attributes: { 'data-wb-component': 'industry-tabs' },
        style: {
          padding: '80px 0',
          background: '#F5F7FA',
          'overflow-x': 'hidden',
        },
        styles: INDUSTRY_TABS_CSS,

        // Model 属性
        tabCount: 6,
        slideCount: 3,

        components: [
          {
            tagName: 'div',
            removable: false,
            selectable: false,
            droppable: false,
            attributes: { class: 'wb-it__inner' },
            style: {
              'max-width': '1280px',
              margin: '0 auto',
              padding: '0 24px',
              'box-sizing': 'border-box',
            },
            components: [
              // ① Header
              {
                tagName: 'div',
                selectable: true,
                droppable: false,
                attributes: { class: 'wb-it__header' },
                style: {
                  display: 'flex',
                  'align-items': 'center',
                  'margin-bottom': '40px',
                },
                components: [
                  {
                    tagName: 'h2',
                    type: 'text',
                    selectable: true,
                    attributes: { class: 'wb-it__heading' },
                    style: {
                      'font-size': '36px',
                      'font-weight': '600',
                      color: '#0B1F44',
                      margin: '0',
                    },
                    components: 'Industry Application',
                  },
                  {
                    tagName: 'a',
                    type: 'text',
                    selectable: true,
                    attributes: { href: '#', class: 'wb-it__cta' },
                    style: {
                      'margin-left': 'auto',
                      background: '#0B5ED7',
                      color: '#ffffff',
                      padding: '12px 24px',
                      'border-radius': '8px',
                      'text-decoration': 'none',
                      'font-size': '14px',
                      'flex-shrink': '0',
                    },
                    components: 'View More',
                  },
                ],
              },
              // ② Tab 导航
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                attributes: { class: 'wb-it__tabs' },
                style: {
                  display: 'flex',
                  gap: '32px',
                  'border-bottom': '1px solid #e5e7eb',
                  'margin-bottom': '40px',
                  'overflow-x': 'auto',
                },
                components: DEFAULT_TAB_LABELS.map((label, i) => buildTabBtnDef(label, i === 0)),
              },
              // ③ Panels 容器
              {
                tagName: 'div',
                removable: false,
                selectable: false,
                droppable: false,
                attributes: { class: 'wb-it__panels' },
                components: DEFAULT_TAB_LABELS.map((_, i) => buildTabPanelDef(i, 3)),
              },
            ],
          },
        ],

        /* eslint-disable */
        script: function (this: any) {
          var root = this

          // 销毁旧实例（脚本重新执行时清理）
          if (root._wbItSwipers) {
            root._wbItSwipers.forEach(function (sw: any) {
              try { sw.destroy(true, true) } catch (_) {}
            })
            root._wbItSwipers = null
          }
          if (root._wbItCleanup) {
            root._wbItCleanup()
            root._wbItCleanup = null
          }

          // 注入发布页所需 CSS（hover 效果等）
          if (!document.getElementById('wb-it-css')) {
            var st = document.createElement('style')
            st.id = 'wb-it-css'
            st.textContent =
              '[data-wb-component="industry-tabs"] .wb-it__slide-img{transition:transform 0.3s ease;}' +
              '[data-wb-component="industry-tabs"] .wb-it__slide-link:hover .wb-it__slide-img{transform:scale(1.1);}'
            document.head.appendChild(st)
          }

          function ensureSwiper() {
            return new Promise(function (resolve: any) {
              var w = window as any
              if (w.Swiper) { resolve(); return }

              if (!document.querySelector('link[data-wb-swiper]')) {
                var link = document.createElement('link')
                link.rel = 'stylesheet'
                link.setAttribute('data-wb-swiper', '1')
                link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
                document.head.appendChild(link)
              }

              var existing = document.querySelector('script[data-wb-swiper]') as any
              if (existing) {
                if ((window as any).Swiper) { resolve(); return }
                existing.addEventListener('load', resolve, { once: true })
                return
              }

              var sc = document.createElement('script')
              sc.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
              sc.setAttribute('data-wb-swiper', '1')
              sc.onload = resolve
              document.body.appendChild(sc)
            })
          }

          function init() {
            var w = window as any
            if (!w.Swiper) return

            var panels = Array.from(root.querySelectorAll('.wb-it__panel')) as HTMLElement[]
            var tabBtns = Array.from(root.querySelectorAll('.wb-it__tab-btn')) as HTMLElement[]
            var swipers: any[] = []

            // 每个 panel 初始化独立 Swiper 实例
            panels.forEach(function (panel) {
              var swiperEl = panel.querySelector('.wb-it__swiper') as HTMLElement | null
              if (!swiperEl) { swipers.push(null); return }

              // prev/next 是 swiper 的兄弟节点（同在 .relative 父容器内）
              var wrapper = swiperEl.parentElement
              var prevEl = wrapper ? wrapper.querySelector('.swiper-button-prev') as HTMLElement | null : null
              var nextEl = wrapper ? wrapper.querySelector('.swiper-button-next') as HTMLElement | null : null

              var sw = new w.Swiper(swiperEl, {
                slidesPerView: 'auto',
                spaceBetween: 12,
                speed: 600,
                autoHeight: true,
                navigation: prevEl && nextEl ? { prevEl: prevEl, nextEl: nextEl } : undefined,
                breakpoints: {
                  768: {
                    spaceBetween: 16,
                  },
                  1200: {
                    spaceBetween: 20,
                  },
                },
              })
              swipers.push(sw)
            })

            root._wbItSwipers = swipers

            // 初始状态：显示第一个 panel，其余隐藏
            panels.forEach(function (p, i) {
              p.style.display = i === 0 ? 'block' : 'none'
            })

            // Tab 点击切换
            var handlers: { btn: HTMLElement; fn: () => void }[] = []

            function scrollActiveTabIntoView(btn: HTMLElement) {
              if (window.innerWidth < 768) {
                btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
              }
            }

            tabBtns.forEach(function (btn, index) {
              var fn = function () {
                // 重置所有 tab 样式
                tabBtns.forEach(function (b) {
                  b.style.color = '#6b7280'
                  b.style.borderBottomColor = 'transparent'
                  b.style.fontWeight = '400'
                })
                // 激活当前 tab
                btn.style.color = '#2563eb'
                btn.style.borderBottomColor = '#2563eb'
                btn.style.fontWeight = '600'
                scrollActiveTabIntoView(btn)

                // 切换 panel 显隐
                panels.forEach(function (p) { p.style.display = 'none' })
                if (panels[index]) panels[index].style.display = 'block'

                // 关键：更新对应 swiper（隐藏时宽度计算为 0，需要 update）
                if (swipers[index]) swipers[index].update()
              }

              btn.addEventListener('click', fn)
              handlers.push({ btn: btn, fn: fn })
            })

            // 存储清理函数
            root._wbItCleanup = function () {
              handlers.forEach(function (h) { h.btn.removeEventListener('click', h.fn) })
            }
          }

          ensureSwiper().then(function () { init() })
        },
        /* eslint-enable */

        traits: [
          {
            type: 'number',
            label: 'Tab 数量',
            name: 'tabCount',
            min: 1,
            max: 10,
            step: 1,
            changeProp: true,
          },
          {
            type: 'number',
            label: '每 Tab 幻灯片数',
            name: 'slideCount',
            min: 1,
            max: 10,
            step: 1,
            changeProp: true,
          },
        ],
      },

      init(this: any) {
        this.on('change:tabCount', this.applyTabCount)
        // slideCount 只影响新增 tab，已有 tab 在画布内直接编辑
      },

      /** 获取 Tab 导航容器（inner > [1]） */
      _getTabsNav(this: any) {
        return this.components()?.at(0)?.components()?.at(1) ?? null
      },

      /** 获取 Panels 容器（inner > [2]） */
      _getPanelsContainer(this: any) {
        return this.components()?.at(0)?.components()?.at(2) ?? null
      },

      /** 同步 Tab 按钮和 Panel 数量 */
      applyTabCount(this: any) {
        const tabsNav = this._getTabsNav()
        const panelsContainer = this._getPanelsContainer()
        if (!tabsNav || !panelsContainer) return

        const target = Math.max(1, Math.min(10, Number(this.get('tabCount')) || 6))
        const slideCount = Math.max(1, Number(this.get('slideCount')) || 3)
        const tabBtns = tabsNav.components?.()
        const panels = panelsContainer.components?.()
        if (!tabBtns || !panels) return

        const current = tabBtns.length || 0

        if (current < target) {
          for (let i = current; i < target; i++) {
            tabBtns.add(buildTabBtnDef(DEFAULT_TAB_LABELS[i] ?? `Tab ${i + 1}`, false))
            panels.add(buildTabPanelDef(i, slideCount))
          }
        } else if (current > target) {
          for (let i = current - 1; i >= target; i--) {
            tabBtns.remove(tabBtns.at(i))
            panels.remove(panels.at(i))
          }
        }
      },
    },
  })
}
