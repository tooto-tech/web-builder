import { getImageManager } from '../../utils/traitBridge'
import {
  fetchSvgMarkupFromUrl,
  getSolarIconSvg,
  searchSolarIcons,
} from '../../utils/svgIcon'
import type { Editor } from 'grapesjs'

export interface SvgIconPickerTraitRuntime {
  getImageManager?: typeof getImageManager
  fetchSvgMarkupFromUrl?: typeof fetchSvgMarkupFromUrl
  getSolarIconSvg?: typeof getSolarIconSvg
  searchSolarIcons?: typeof searchSolarIcons
}

function readTraitValue(component: any, trait: any): string {
  const name = trait.get?.('name') || ''
  return trait.get?.('changeProp')
    ? `${component.get?.(name) ?? ''}`
    : `${component.getAttributes?.()?.[name] ?? ''}`
}

function writeTraitValue(component: any, trait: any, value: string) {
  const name = trait.get?.('name') || ''
  if (trait.get?.('changeProp')) {
    component.set?.(name, value)
  } else {
    component.addAttributes?.({ [name]: value })
  }
}

export function registerSvgIconPickerTrait(editor: Editor, runtime: SvgIconPickerTraitRuntime = {}) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('svg-icon-picker')) return

  const PAGE_SIZE = 40
  const getImages = runtime.getImageManager ?? getImageManager
  const fetchSvg = runtime.fetchSvgMarkupFromUrl ?? fetchSvgMarkupFromUrl
  const getSolarSvg = runtime.getSolarIconSvg ?? getSolarIconSvg
  const searchSolar = runtime.searchSolarIcons ?? searchSolarIcons

  const setSourceValue = (component: any, sourceName: string, value: string) => {
    if (!sourceName) return
    if (typeof component?.set === 'function') {
      component.set(sourceName, value)
      return
    }
    component?.addAttributes?.({ [sourceName]: value })
  }

  tm.addType('svg-icon-picker', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-svg-icon-picker'
      el.style.cssText = 'display:flex;flex-direction:column;gap:10px;width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const ui = trait.get?.('ui') || {}
      const sourceName = ui.sourceName || 'iconSource'
      const currentSvg = readTraitValue(component, trait)
      const currentSource = `${component.get?.(sourceName) ?? component.getAttributes?.()?.[sourceName] ?? ''}`.trim()
      let activeTab: 'library' | 'custom' = currentSource && !currentSource.startsWith('solar:')
        ? 'custom'
        : 'library'

      const renderEmptyPreview = (container: HTMLElement) => {
        container.innerHTML = ''
        const empty = document.createElement('div')
        empty.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9ca3af;font-size:12px;'
        empty.textContent = '暂无图标'
        container.appendChild(empty)
      }

      const setStatus = (el: HTMLElement, text: string, isError = false) => {
        el.textContent = text
        el.style.color = isError ? '#dc2626' : '#6b7280'
      }

      const preview = document.createElement('div')
      preview.style.cssText = 'width:100%;aspect-ratio:1/1;border-radius:6px;border:1px solid #e5e7eb;background:#f9fafb;padding:16px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;'
      if (currentSvg) {
        preview.innerHTML = currentSvg
      } else {
        renderEmptyPreview(preview)
      }

      const sourceText = document.createElement('div')
      sourceText.style.cssText = 'font-size:12px;color:#6b7280;word-break:break-all;'
      sourceText.textContent = currentSource || '当前来源：未设置'

      const status = document.createElement('div')
      status.style.cssText = 'font-size:12px;min-height:18px;color:#6b7280;'

      const clearBtn = document.createElement('button')
      clearBtn.type = 'button'
      clearBtn.textContent = '清空'
      clearBtn.style.cssText = 'padding:6px 10px;border:1px solid #dcdfe6;background:#fff;color:#6b7280;border-radius:999px;cursor:pointer;font-size:12px;'
      clearBtn.onclick = () => {
        writeTraitValue(component, trait, '')
        setSourceValue(component, sourceName, '')
        renderEmptyPreview(preview)
        sourceText.textContent = '当前来源：未设置'
        setStatus(status, '图标已清空')
      }

      const tabRow = document.createElement('div')
      tabRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;'

      const tabButtons = document.createElement('div')
      tabButtons.style.cssText = 'display:flex;gap:8px;align-items:center;'

      const libraryTabBtn = document.createElement('button')
      libraryTabBtn.type = 'button'
      libraryTabBtn.textContent = '图标库'
      libraryTabBtn.style.cssText = 'padding:6px 12px;border:1px solid #dcdfe6;background:#fff;color:#6b7280;border-radius:999px;cursor:pointer;font-size:12px;'

      const customTabBtn = document.createElement('button')
      customTabBtn.type = 'button'
      customTabBtn.textContent = '自定义'
      customTabBtn.style.cssText = 'padding:6px 12px;border:1px solid #dcdfe6;background:#fff;color:#6b7280;border-radius:999px;cursor:pointer;font-size:12px;'

      tabButtons.appendChild(libraryTabBtn)
      tabButtons.appendChild(customTabBtn)
      tabRow.appendChild(tabButtons)
      tabRow.appendChild(clearBtn)

      const panelHost = document.createElement('div')
      panelHost.style.cssText = 'display:flex;flex-direction:column;gap:10px;'

      const setActiveTabStyles = () => {
        libraryTabBtn.style.borderColor = activeTab === 'library' ? '#93c5fd' : '#dcdfe6'
        libraryTabBtn.style.background = activeTab === 'library' ? '#eff6ff' : '#fff'
        libraryTabBtn.style.color = activeTab === 'library' ? '#1d4ed8' : '#6b7280'
        customTabBtn.style.borderColor = activeTab === 'custom' ? '#93c5fd' : '#dcdfe6'
        customTabBtn.style.background = activeTab === 'custom' ? '#eff6ff' : '#fff'
        customTabBtn.style.color = activeTab === 'custom' ? '#1d4ed8' : '#6b7280'
      }

      const applySvgValue = (svg: string, sourceValue: string, successText: string) => {
        writeTraitValue(component, trait, svg)
        setSourceValue(component, sourceName, sourceValue)
        preview.innerHTML = svg
        sourceText.textContent = sourceValue || '当前来源：未设置'
        setStatus(status, successText)
      }

      const renderLibraryTab = () => {
        panelHost.innerHTML = ''

        const searchInput = document.createElement('input')
        searchInput.type = 'text'
        searchInput.value = currentSource.startsWith('solar:') ? currentSource.replace(/^solar:/, '') : ''
        searchInput.placeholder = '搜索 Solar 图标，例如 smile / arrow / outline'
        searchInput.style.cssText = 'width:100%;padding:6px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;outline:none;'

        const helper = document.createElement('div')
        helper.style.cssText = 'font-size:12px;color:#6b7280;'
        helper.textContent = 'Solar 图标库，本地懒加载'

        const metaText = document.createElement('div')
        metaText.style.cssText = 'font-size:12px;color:#6b7280;'

        const scrollWrap = document.createElement('div')
        scrollWrap.style.cssText = 'max-height:280px;overflow:auto;border:1px solid #e5e7eb;border-radius:10px;padding:8px;background:#fff;'

        const resultWrap = document.createElement('div')
        resultWrap.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));'
        scrollWrap.appendChild(resultWrap)

        const state = {
          offset: 0,
          total: 0,
          loading: false,
          query: `${searchInput.value ?? ''}`.trim(),
        }

        const renderResults = async (icons: string[], append: boolean) => {
          if (!append) {
            resultWrap.innerHTML = ''
          }

          if (!icons.length && state.offset === 0) {
            const empty = document.createElement('div')
            empty.style.cssText = 'grid-column:1 / -1;font-size:12px;color:#9ca3af;text-align:center;padding:16px 0;'
            empty.textContent = '暂无搜索结果'
            resultWrap.appendChild(empty)
            return
          }

          const iconsWithSvg = await Promise.all(
            icons.map(async (icon) => {
              try {
                return {
                  icon,
                  svg: await getSolarSvg(icon),
                }
              } catch {
                return {
                  icon,
                  svg: '',
                }
              }
            }),
          )

          const fragment = document.createDocumentFragment()
          iconsWithSvg.forEach(({ icon, svg }) => {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.title = icon
            btn.style.cssText = `display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;padding:10px 6px;background:${currentSource === icon ? '#eff6ff' : '#fff'};cursor:pointer;`

            const iconBox = document.createElement('div')
            iconBox.style.cssText = 'width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:#111827;'
            if (svg) {
              iconBox.innerHTML = svg
            } else {
              iconBox.innerHTML = `<span style="font-size:10px;color:#9ca3af;">N/A</span>`
            }

            btn.appendChild(iconBox)
            btn.onclick = async () => {
              try {
                setStatus(status, '正在应用 Solar 图标...')
                const nextSvg = svg || await getSolarSvg(icon)
                applySvgValue(nextSvg, icon, '图标已更新')
              } catch (error: any) {
                setStatus(status, error?.message || '应用图标失败', true)
              }
            }

            fragment.appendChild(btn)
          })

          resultWrap.appendChild(fragment)
        }

        const loadNextPage = async (reset = false) => {
          if (state.loading) return
          state.loading = true
          if (reset) {
            state.offset = 0
            state.total = 0
            resultWrap.innerHTML = ''
          }

          try {
            setStatus(status, '正在加载 Solar 图标...')
            const response = await searchSolar(state.query, state.offset, PAGE_SIZE)
            state.total = response.total
            await renderResults(response.icons, !reset)
            state.offset += response.icons.length
            metaText.textContent = state.total
              ? `已加载 ${Math.min(state.offset, state.total)} / ${state.total} 个图标`
              : '暂无图标'
            setStatus(status, state.total ? '选择一个图标即可应用' : '暂无搜索结果')
          } catch (error: any) {
            if (!state.offset) {
              resultWrap.innerHTML = ''
            }
            metaText.textContent = ''
            setStatus(status, error?.message || 'Solar 图标加载失败', true)
          } finally {
            state.loading = false
          }
        }

        let searchTimer: number | null = null
        searchInput.oninput = () => {
          state.query = `${searchInput.value ?? ''}`.trim()
          if (searchTimer) {
            window.clearTimeout(searchTimer)
          }
          searchTimer = window.setTimeout(() => {
            loadNextPage(true).catch(() => undefined)
          }, 160)
        }

        scrollWrap.onscroll = () => {
          const nearBottom = scrollWrap.scrollTop + scrollWrap.clientHeight >= scrollWrap.scrollHeight - 80
          if (nearBottom && !state.loading && state.offset < state.total) {
            loadNextPage(false).catch(() => undefined)
          }
        }

        panelHost.appendChild(searchInput)
        panelHost.appendChild(helper)
        panelHost.appendChild(metaText)
        panelHost.appendChild(scrollWrap)

        loadNextPage(true).catch((error: any) => {
          setStatus(status, error?.message || 'Solar 图标加载失败', true)
        })
      }

      const renderCustomTab = () => {
        panelHost.innerHTML = ''

        const description = document.createElement('div')
        description.style.cssText = 'font-size:12px;color:#6b7280;line-height:1.6;'
        description.textContent = '从素材库中选择 SVG 资源，素材列表会自动带上 type=svg 过滤。'

        const selectBtn = document.createElement('button')
        selectBtn.type = 'button'
        selectBtn.textContent = '从素材库选择 SVG'
        selectBtn.style.cssText = 'padding:8px 12px;border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;border-radius:10px;cursor:pointer;font-size:12px;font-weight:500;'

        const currentValue = document.createElement('div')
        currentValue.style.cssText = 'font-size:12px;color:#6b7280;word-break:break-all;padding:10px 12px;border:1px dashed #d1d5db;border-radius:10px;background:#fafafa;'
        currentValue.textContent = currentSource && !currentSource.startsWith('solar:')
          ? currentSource
          : '当前未选择自定义 SVG'

        selectBtn.onclick = () => {
          const imageManager = getImages()
          if (!imageManager || typeof imageManager.openAssetsDialogWithTarget !== 'function') {
            setStatus(status, '素材库暂不可用', true)
            return
          }

          imageManager.openAssetsDialogWithTarget({
            filterType: 'svg',
            selectCallback: async (asset: any) => {
              const src = asset?.getSrc?.() ?? asset?.src ?? ''
              if (!src) {
                setStatus(status, '未获取到 SVG 地址', true)
                return
              }

              try {
                setStatus(status, '正在加载 SVG 资源...')
                const svg = await fetchSvg(src)
                applySvgValue(svg, src, 'SVG 已更新')
              } catch (error: any) {
                setStatus(status, error?.message || 'SVG 加载失败', true)
              }
            },
          })
        }

        panelHost.appendChild(description)
        panelHost.appendChild(selectBtn)
        panelHost.appendChild(currentValue)
      }

      const renderActivePanel = () => {
        setActiveTabStyles()
        if (activeTab === 'library') {
          renderLibraryTab()
          return
        }
        renderCustomTab()
      }

      libraryTabBtn.onclick = () => {
        activeTab = 'library'
        renderActivePanel()
      }

      customTabBtn.onclick = () => {
        activeTab = 'custom'
        renderActivePanel()
      }

      elInput.innerHTML = ''
      elInput.appendChild(preview)
      elInput.appendChild(sourceText)
      elInput.appendChild(tabRow)
      elInput.appendChild(panelHost)
      elInput.appendChild(status)

      renderActivePanel()
    },
  })
}
