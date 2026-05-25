import { createApp, h, ref } from 'vue'
import { ElButton, ElOption, ElSelect } from 'element-plus'
import type { Editor } from 'grapesjs'
import {
  getMenuItemTree,
  resolveMenuItemLink,
} from '@/api/content/menu'
import { getInquiryTypePage } from '@/api/content/inquiry'
import { getPagePage } from '@/api/content/page'
import { makeLink, makeNavGroup } from '../navigation/navbar/factories'
import { WB_NAVBAR_THB_TYPE } from '../navigation/navbarThb'
import {
  makeTHBNavItem,
  makeTHBNavGroup,
  generateMobileNavContent,
  type ThbMegaColumn,
  type ThbNavItem,
} from '../navigation/navbarThb/factories'
import {
  createDefaultHotspotShowcaseHotspot,
  normalizeHotspotShowcaseHotspots,
  serializeHotspotShowcaseHotspots,
} from '../section/hotspotShowcase'
import { getImageManager } from '../../../utils/traitBridge'
import {
  getTraitDataSourceRegistry,
  type TraitMenuOption,
} from '../../../utils/traitDataSourceRegistry'
import {
  iconifySvgUrl,
} from '../../../utils/svgIcon'
import {
  LOOP_ITEM_RESOURCE_TYPE,
  LOOP_ITEM_TYPE_LABELS,
  getLoopItemType,
  type LoopItemType
} from '../../../config/templateSharedResources'
import { getEditorRuntime } from '../../../composables/useEditorRuntime'
import { registerPageLinkTrait } from '../../traits/pageLinkTrait'
import { registerColorPickerTrait } from '../../traits/colorPickerTrait'
import { registerCodeEditorTrait } from '../../traits/codeEditorTrait'
import { registerImagePickerTrait } from '../../traits/imagePickerTrait'
import { registerSvgIconPickerTrait } from '../../traits/svgIconPickerTrait'
import type { ComponentRegistryExecutor } from '../types'

/**
 * 注册自定义属性 trait 类型
 */
function registerCustomAttributesTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('custom-attributes')) return

  tm.addType('custom-attributes', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'custom-attributes-trait'
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div class="custom-attributes-list" style="display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto;">
            <!-- 动态添加的属性项 -->
          </div>
          <button type="button" class="add-custom-attr-btn" style="padding: 6px 12px; border: 1px solid #d1d5db; background: #f9fafb; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">
            + 添加属性
          </button>
        </div>
      `
      return el
    },
    onUpdate({ elInput, component }: any) {
      const attrs = component.getAttributes() || {}
      const customAttrs: Record<string, string> = {}

      const standardAttrs = ['id', 'class', 'href', 'target', 'title', 'rel', 'download']
      Object.keys(attrs).forEach(key => {
        if (!standardAttrs.includes(key)) {
          customAttrs[key] = attrs[key]
        }
      })

      this.renderAttributes(elInput, customAttrs, component)
      this.bindEvents(elInput, component)
    },
    renderAttributes(elInput: HTMLElement, attrs: Record<string, string>, _component: any) {
      const list = elInput.querySelector('.custom-attributes-list')
      if (!list) return

      list.innerHTML = ''

      Object.entries(attrs).forEach(([name, value]) => {
        const item = document.createElement('div')
        item.className = 'custom-attr-item'
        item.style.cssText = 'display: flex; gap: 4px; align-items: center; padding: 4px; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb;'
        item.innerHTML = `
          <input type="text" class="attr-name-input" data-old-name="${this.escapeHtml(name)}" value="${this.escapeHtml(name)}" placeholder="属性名" style="flex: 1; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; box-sizing: border-box;" />
          <input type="text" class="attr-value-input" data-old-name="${this.escapeHtml(name)}" value="${this.escapeHtml(value)}" placeholder="属性值" style="flex: 1; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; box-sizing: border-box;" />
          <button type="button" class="remove-attr-btn" style="padding: 4px 8px; border: 1px solid #dc2626; background: #fee2e2; color: #dc2626; border-radius: 4px; cursor: pointer; font-size: 12px;">删除</button>
        `
        list.appendChild(item)
      })

      if (Object.keys(attrs).length === 0) {
        const empty = document.createElement('div')
        empty.style.cssText = 'text-align: center; color: #9ca3af; padding: 12px; font-size: 12px;'
        empty.textContent = '暂无自定义属性'
        list.appendChild(empty)
      }
    },
    bindEvents(elInput: HTMLElement, component: any) {
      const traitInput = elInput as HTMLElement & {
        __wbCustomAttrBound?: boolean
        __wbCustomAttrComponent?: any
      }
      traitInput.__wbCustomAttrComponent = component

      if (traitInput.__wbCustomAttrBound) return
      traitInput.__wbCustomAttrBound = true

      const getActiveComponent = () => traitInput.__wbCustomAttrComponent

      const addBtn = elInput.querySelector('.add-custom-attr-btn') as HTMLElement
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          const activeComponent = getActiveComponent()
          if (!activeComponent) return
          const attrs = { ...(activeComponent.getAttributes() || {}) }
          const newName = `attr-${Date.now()}`
          attrs[newName] = ''
          activeComponent.addAttributes(attrs)
          const trait = (activeComponent as any).traits?.find(
            (t: any) => t.get?.('type') === 'custom-attributes'
          )
          if (trait) trait.trigger('change')
        })
      }

      elInput.addEventListener('input', (e: any) => {
        const target = e.target
        if (target.classList.contains('attr-name-input') || target.classList.contains('attr-value-input')) {
          const activeComponent = getActiveComponent()
          if (!activeComponent) return
          const item = target.closest('.custom-attr-item')
          if (!item) return

          const nameInput = item.querySelector('.attr-name-input') as HTMLInputElement
          const valueInput = item.querySelector('.attr-value-input') as HTMLInputElement

          if (nameInput && valueInput) {
            const oldName = target.dataset.oldName || ''
            const newName = nameInput.value.trim()
            const newValue = valueInput.value

            if (oldName && oldName !== newName && newName) {
              const attrs = { ...activeComponent.getAttributes() }
              delete attrs[oldName]
              attrs[newName] = newValue
              activeComponent.addAttributes(attrs)
              nameInput.dataset.oldName = newName
              valueInput.dataset.oldName = newName
            } else {
              const key = newName || oldName
              if (!key) return
              const attrs = { ...activeComponent.getAttributes() }
              attrs[key] = newValue
              activeComponent.addAttributes(attrs)
              nameInput.dataset.oldName = key
              valueInput.dataset.oldName = key
            }
          }
        }
      })

      elInput.addEventListener('click', (e: any) => {
        if (e.target.classList.contains('remove-attr-btn')) {
          const activeComponent = getActiveComponent()
          if (!activeComponent) return
          const item = e.target.closest('.custom-attr-item')
          if (!item) return

          const nameInput = item.querySelector('.attr-name-input') as HTMLInputElement
          const attrName = nameInput?.value.trim() || nameInput?.dataset.oldName

          if (attrName) {
            const attrs = { ...activeComponent.getAttributes() }
            delete attrs[attrName]
            activeComponent.addAttributes(attrs)
            const trait = (activeComponent as any).traits?.find(
              (t: any) => t.get?.('type') === 'custom-attributes'
            )
            if (trait) trait.trigger('change')
          }
        }
      })
    },
    escapeHtml(text: string) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    },
  })
}

// ── Trait 辅助函数 ──────────────────────────────────────────────

/** 读取 trait 对应的组件属性值 */
function readTraitValue(component: any, trait: any): string {
  const name = trait.get?.('name') || ''
  return trait.get?.('changeProp')
    ? `${component.get?.(name) ?? ''}`
    : `${component.getAttributes?.()?.[name] ?? ''}`
}

/** 写入 trait 对应的组件属性值 */
function writeTraitValue(component: any, trait: any, value: string) {
  const name = trait.get?.('name') || ''
  if (trait.get?.('changeProp')) {
    component.set?.(name, value)
  } else {
    component.addAttributes?.({ [name]: value })
  }
}

function escapeHtml(text: string): string {
  return `${text ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 注册询盘表单选择 trait
 * 从后台拉取询盘类型列表，供询盘表单组件选择。
 */
function registerInquiryTypeSelectTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('inquiry-type-select')) return

  const loadOptions = async (force = false) => {
    const cacheKey = '__wbInquiryTypeOptions'
    const promiseKey = '__wbInquiryTypeOptionsPromise'
    const editorState = editor as Editor & {
      __wbInquiryTypeOptions?: Array<{ value: string; label: string }>
      __wbInquiryTypeOptionsPromise?: Promise<Array<{ value: string; label: string }>>
    }

    if (!force && Array.isArray(editorState[cacheKey])) {
      return editorState[cacheKey] || []
    }

    if (!force && editorState[promiseKey]) {
      return editorState[promiseKey]!
    }

    const requestPromise = getInquiryTypePage({ pageNo: 1, pageSize: 100 })
      .then((data: any) => {
        const options = Array.isArray(data?.list)
          ? data.list
            .map((item: any) => {
              const id = item?.id != null ? String(item.id) : ''
              if (!id) return null
              const name = `${item?.name ?? '未命名表单'}`
              const code = `${item?.code ?? ''}`.trim()
              return {
                value: id,
                label: code ? `${name} (${code})` : name,
              }
            })
            .filter(Boolean) as Array<{ value: string; label: string }>
          : []

        editorState[cacheKey] = options
        return options
      })
      .catch((error) => {
        console.error('[WebBuilder] Failed to load inquiry type options', error)
        editorState[cacheKey] = []
        return []
      })
      .finally(() => {
        editorState[promiseKey] = undefined
      })

    editorState[promiseKey] = requestPromise
    return requestPromise
  }

  const render = async (elInput: HTMLElement, component: any, trait: any, force = false) => {
    const currentValue = readTraitValue(component, trait)
    const placeholder = '请选择询盘表单'
    elInput.innerHTML = `
      <div class="wb-trait-inquiry-select" style="display:flex;flex-direction:column;gap:8px;width:100%;">
        <select class="wb-inquiry-type-select" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;background:#fff;">
          <option value="">${placeholder}</option>
          <option value="__loading__" disabled>加载中...</option>
        </select>
        <button type="button" class="wb-inquiry-type-refresh" style="padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;background:#fff;font-size:12px;cursor:pointer;color:#344054;">
          刷新表单列表
        </button>
      </div>
    `

    const selectEl = elInput.querySelector('.wb-inquiry-type-select') as HTMLSelectElement | null
    const refreshBtn = elInput.querySelector('.wb-inquiry-type-refresh') as HTMLButtonElement | null
    if (!selectEl || !refreshBtn) return

    const options = await loadOptions(force)
    const optionsHtml = [
      `<option value="">${placeholder}</option>`,
      ...options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`),
    ].join('')

    selectEl.innerHTML = optionsHtml
    selectEl.value = options.some(option => option.value === currentValue) ? currentValue : ''

    selectEl.onchange = () => {
      writeTraitValue(component, trait, selectEl.value)
    }

    refreshBtn.onclick = () => {
      render(elInput, component, trait, true)
    }
  }

  tm.addType('inquiry-type-select', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-inquiry-type'
      el.style.cssText = 'width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      render(elInput, component, trait)
    },
  })
}

/**
 * 注册菜单树选择 trait。
 * 从后台菜单列表选择 code，写入 menuCode；画布预览由 useCmsLivePreview 根据 data-menu-code 刷新。
 */
function registerMenuTreeSelectTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('menu-tree-select')) return

  const loadOptions = async (force = false) =>
    getTraitDataSourceRegistry(editor).loadMenuOptions({
      force,
      valueField: 'code',
      labelMode: 'name-code-if-different',
      requireCode: true,
    })

  const render = (elInput: HTMLElement, component: any, trait: any, force = false) => {
    const input = elInput as HTMLElement & {
      __wbMenuTreeSelectVueApp?: ReturnType<typeof createApp>
    }
    input.__wbMenuTreeSelectVueApp?.unmount()
    input.innerHTML = ''

    const value = ref(readTraitValue(component, trait).trim())
    const loading = ref(false)
    const options = ref<Array<{ value: string; label: string }>>([])

    const load = async (nextForce = false) => {
      loading.value = true
      try {
        const loadedOptions = await loadOptions(nextForce)
        const selectedValue = readTraitValue(component, trait).trim()
        const hasSelectedValue = loadedOptions.some((option) => option.value === selectedValue)
        options.value =
          selectedValue && !hasSelectedValue
            ? [{ value: selectedValue, label: `当前已选 ${selectedValue}` }, ...loadedOptions]
            : loadedOptions
        value.value = selectedValue
      } finally {
        loading.value = false
      }
    }

    const app = createApp({
      setup() {
        void load(force)
        return () =>
          h('div', { style: 'display:flex;flex-direction:column;gap:8px;width:100%;' }, [
            h(
              ElSelect,
              {
                modelValue: value.value,
                placeholder: '请选择菜单',
                clearable: true,
                filterable: true,
                loading: loading.value,
                noDataText: '暂无菜单',
                style: 'width:100%;',
                size: 'small',
                teleported: false,
                'onUpdate:modelValue': (nextValue: string) => {
                  value.value = `${nextValue ?? ''}`.trim()
                  writeTraitValue(component, trait, value.value)
                },
              },
              () =>
                options.value.map((option) =>
                  h(ElOption, {
                    key: option.value,
                    value: option.value,
                    label: option.label,
                  }),
                ),
            ),
            h(
              ElButton,
              {
                size: 'small',
                loading: loading.value,
                onClick: () => void load(true),
              },
              () => '刷新菜单列表',
            ),
          ])
      },
    })

    input.__wbMenuTreeSelectVueApp = app
    app.mount(elInput)
  }

  tm.addType('menu-tree-select', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-menu-tree-select'
      el.style.cssText = 'width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      render(elInput, component, trait)
    },
  })
}

/**
 * 注册 Navbar 后台菜单选择 trait
 * 从后台拉取菜单列表，选择后将菜单项应用到导航结构。
 */
function registerNavbarMenuSelectTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('navbar-menu-select')) return

  const PLACEHOLDER = '选择后台菜单...'

  const loadMenuList = async (force = false): Promise<TraitMenuOption[]> =>
    getTraitDataSourceRegistry(editor).loadMenuOptions({
      force,
      valueField: 'id',
      labelMode: 'name-code-if-present',
    })

  const applyMenuItems = async (
    menuId: number,
    navMenuComponent: any,
    statusEl: HTMLElement,
    applyBtn: HTMLButtonElement,
  ) => {
    applyBtn.disabled = true
    statusEl.textContent = '正在加载菜单数据...'
    statusEl.style.color = '#6b7280'
    try {
      const items: any[] = await getMenuItemTree(menuId)
      const topItems = (Array.isArray(items) ? items : []).filter((i: any) => i.isVisible !== false)
      const comps = navMenuComponent.components()

      // 保留关闭按钮（index 0），移除其余
      const toRemove: any[] = []
      for (let i = 1; i < comps.length; i++) toRemove.push(comps.at(i))
      toRemove.forEach((c) => comps.remove(c))

      // 按后台菜单结构重建导航项
      topItems.forEach((item: any) => {
        const title = String(item.resolvedTitle || item.title || '')
        const url = String(item.resolvedUrl || item.url || '#')
        const children = (Array.isArray(item.children) ? item.children : []).filter(
          (c: any) => c.isVisible !== false,
        )
        if (children.length > 0) {
          comps.add(makeNavGroup(title, 'dropdown', {
            dropdownItems: children.map((c: any) => ({
              text: String(c.resolvedTitle || c.title || ''),
              href: String(c.resolvedUrl || c.url || '#'),
            })),
          }))
        } else {
          comps.add(makeLink(title, url))
        }
      })

      statusEl.textContent = `已应用 ${topItems.length} 个顶级菜单项`
      statusEl.style.color = '#16a34a'
    } catch (err: any) {
      console.error('[WebBuilder] Failed to apply navbar menu', err)
      statusEl.textContent = err?.message || '应用失败，请重试'
      statusEl.style.color = '#dc2626'
    } finally {
      applyBtn.disabled = false
    }
  }

  // 异步刷新 select 选项并重新绑定事件（onUpdate 每次选中组件都会触发）
  const refreshSelect = async (elInput: HTMLElement, component: any, trait: any, force = false) => {
    const selectEl = elInput.querySelector('.wb-nms-sel') as HTMLSelectElement | null
    const applyBtn = elInput.querySelector('.wb-nms-apply') as HTMLButtonElement | null
    const refreshBtn = elInput.querySelector('.wb-nms-refresh') as HTMLButtonElement | null
    const statusEl = elInput.querySelector('.wb-nms-status') as HTMLElement | null
    if (!selectEl || !applyBtn || !refreshBtn || !statusEl) return

    const currentValue = readTraitValue(component, trait)
    const options = await loadMenuList(force)

    selectEl.innerHTML = [
      `<option value="">${PLACEHOLDER}</option>`,
      ...options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`),
    ].join('')
    selectEl.value = options.some((o) => o.value === currentValue) ? currentValue : ''

    selectEl.onchange = () => writeTraitValue(component, trait, selectEl.value)

    applyBtn.onclick = async () => {
      const val = selectEl.value
      if (!val) { statusEl.textContent = '请先选择一个菜单'; statusEl.style.color = '#d97706'; return }
      await applyMenuItems(Number(val), component, statusEl, applyBtn)
    }

    refreshBtn.onclick = () => refreshSelect(elInput, component, trait, true)
  }

  tm.addType('navbar-menu-select', {
    // createInput 同步渲染 UI 骨架，GrapesJS 会立即将其插入 trait 面板
    createInput() {
      const el = document.createElement('div')
      el.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:8px;'
      el.innerHTML = `
        <select class="wb-nms-sel" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;background:#fff;">
          <option value="">${PLACEHOLDER}</option>
        </select>
        <div style="display:flex;gap:6px;">
          <button type="button" class="wb-nms-apply" style="flex:1;padding:6px 10px;border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;border-radius:4px;font-size:12px;cursor:pointer;font-weight:600;">应用到导航</button>
          <button type="button" class="wb-nms-refresh" style="padding:6px 10px;border:1px solid #dcdfe6;background:#fff;color:#374151;border-radius:4px;font-size:12px;cursor:pointer;">刷新</button>
        </div>
        <div class="wb-nms-status" style="font-size:12px;min-height:16px;color:#6b7280;line-height:1.5;"></div>
      `
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      refreshSelect(elInput, component, trait)
    },
  })
}

function registerNavbarThbMenuSelectTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('navbar-thb-menu-select')) return

  const PLACEHOLDER = '选择后台菜单...'
  const getMenuTitle = (item: any) => String(item?.title || item?.resolvedTitle || item?.name || '').trim()
  const getDirectMenuUrl = (item: any) => String(item?.resolvedUrl || item?.url || item?.href || '').trim()
  const getMenuUrl = (item: any) => getDirectMenuUrl(item) || '#'
  const getVisibleChildren = (item: any) =>
    (Array.isArray(item?.children) ? item.children : []).filter((child: any) => child?.isVisible !== false)
  const resolveMenuUrl = async (item: any): Promise<string> => {
    const directUrl = getDirectMenuUrl(item)
    if (directUrl) return directUrl
    const id = Number(item?.id)
    if (!id) return '#'
    try {
      const resolvedUrl = String(await resolveMenuItemLink(id) || '').trim()
      return resolvedUrl || '#'
    } catch (err) {
      console.warn('[WebBuilder] Failed to resolve THB navbar menu item link', item?.id, err)
      return '#'
    }
  }
  const resolveMenuLinks = async (items: any[]): Promise<any[]> =>
    Promise.all(
      (Array.isArray(items) ? items : []).map(async (item: any) => ({
        ...item,
        href: await resolveMenuUrl(item),
        children: await resolveMenuLinks(getVisibleChildren(item)),
      })),
    )
  const toNavItem = (item: any): ThbNavItem => ({
    text: getMenuTitle(item),
    href: getMenuUrl(item),
    target: item?.target,
  })
  const toMegaColumn = (item: any): ThbMegaColumn => ({
    title: getMenuTitle(item),
    href: getMenuUrl(item),
    target: item?.target,
    items: getVisibleChildren(item).map(toNavItem).filter((child: ThbNavItem) => child.text),
  })

  const loadMenuList = async (force = false): Promise<TraitMenuOption[]> =>
    getTraitDataSourceRegistry(editor).loadMenuOptions({
      force,
      valueField: 'id',
      labelMode: 'name-code-if-present',
    })

  const applyMenuItems = async (
    menuId: number,
    navListComp: any,
    statusEl: HTMLElement,
    applyBtn: HTMLButtonElement,
  ) => {
    applyBtn.disabled = true
    statusEl.textContent = '正在加载菜单数据...'
    statusEl.style.color = '#6b7280'
    try {
      const items: any[] = await getMenuItemTree(menuId)
      const topItems = await resolveMenuLinks(
        (Array.isArray(items) ? items : []).filter((i: any) => i.isVisible !== false),
      )
      const comps = navListComp.components()

      // 清空现有导航项
      comps.reset([])

      // 按后台菜单结构重建 THB 导航项
      topItems.forEach((item: any) => {
        const title = getMenuTitle(item)
        const url = getMenuUrl(item)
        const children = getVisibleChildren(item)
        if (children.length > 0) {
          const hasGrandchildren = children.some((child: any) => getVisibleChildren(child).length > 0)
          comps.add(
            makeTHBNavGroup(
              title,
              url,
              hasGrandchildren ? 'mega' : 'dropdown',
              hasGrandchildren
                ? children.map(toMegaColumn).filter((column: ThbMegaColumn) => column.title)
                : children.map(toNavItem).filter((child: ThbNavItem) => child.text),
              item?.target,
            ),
          )
        } else {
          comps.add(makeTHBNavItem(title, url, item?.target))
        }
      })

      // 同步更新移动端导航内容
      const thbRoot = navListComp.closestType(WB_NAVBAR_THB_TYPE)
      if (thbRoot) {
        const mobileContentComps = thbRoot.find('.nav-mobile__content')
        if (mobileContentComps.length > 0) {
          mobileContentComps[0].components(generateMobileNavContent(topItems))
        }
      }

      statusEl.textContent = `已应用 ${topItems.length} 个顶级菜单项`
      statusEl.style.color = '#16a34a'
    } catch (err: any) {
      console.error('[WebBuilder] Failed to apply THB navbar menu', err)
      statusEl.textContent = err?.message || '应用失败，请重试'
      statusEl.style.color = '#dc2626'
    } finally {
      applyBtn.disabled = false
    }
  }

  const refreshSelect = async (elInput: HTMLElement, component: any, trait: any, force = false) => {
    const selectEl = elInput.querySelector('.wb-thb-nms-sel') as HTMLSelectElement | null
    const applyBtn = elInput.querySelector('.wb-thb-nms-apply') as HTMLButtonElement | null
    const refreshBtn = elInput.querySelector('.wb-thb-nms-refresh') as HTMLButtonElement | null
    const statusEl = elInput.querySelector('.wb-thb-nms-status') as HTMLElement | null
    if (!selectEl || !applyBtn || !refreshBtn || !statusEl) return

    const currentValue = readTraitValue(component, trait)
    const options = await loadMenuList(force)

    selectEl.innerHTML = [
      `<option value="">${PLACEHOLDER}</option>`,
      ...options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`),
    ].join('')
    selectEl.value = options.some((o) => o.value === currentValue) ? currentValue : ''

    selectEl.onchange = () => writeTraitValue(component, trait, selectEl.value)

    applyBtn.onclick = async () => {
      const val = selectEl.value
      if (!val) { statusEl.textContent = '请先选择一个菜单'; statusEl.style.color = '#d97706'; return }
      await applyMenuItems(Number(val), component, statusEl, applyBtn)
    }

    refreshBtn.onclick = () => refreshSelect(elInput, component, trait, true)
  }

  tm.addType('navbar-thb-menu-select', {
    createInput() {
      const el = document.createElement('div')
      el.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:8px;'
      el.innerHTML = `
        <select class="wb-thb-nms-sel" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;background:#fff;">
          <option value="">${PLACEHOLDER}</option>
        </select>
        <div style="display:flex;gap:6px;">
          <button type="button" class="wb-thb-nms-apply" style="flex:1;padding:6px 10px;border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;border-radius:4px;font-size:12px;cursor:pointer;font-weight:600;">应用到导航</button>
          <button type="button" class="wb-thb-nms-refresh" style="padding:6px 10px;border:1px solid #dcdfe6;background:#fff;color:#374151;border-radius:4px;font-size:12px;cursor:pointer;">刷新</button>
        </div>
        <div class="wb-thb-nms-status" style="font-size:12px;min-height:16px;color:#6b7280;line-height:1.5;"></div>
      `
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      refreshSelect(elInput, component, trait)
    },
  })
}

function registerFooterMenuSelectTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('footer-menu-select')) return

  const PLACEHOLDER = '选择后台菜单...'

  const loadMenuList = async (force = false): Promise<TraitMenuOption[]> =>
    getTraitDataSourceRegistry(editor).loadMenuOptions({
      force,
      valueField: 'code',
      labelMode: 'name-code-always',
      requireCode: true,
    })

  const refreshSelect = async (elInput: HTMLElement, component: any, trait: any, force = false) => {
    const selectEl = elInput.querySelector('.wb-fms-sel') as HTMLSelectElement | null
    const refreshBtn = elInput.querySelector('.wb-fms-refresh') as HTMLButtonElement | null
    const statusEl = elInput.querySelector('.wb-fms-status') as HTMLElement | null
    if (!selectEl || !refreshBtn || !statusEl) return

    const currentValue = readTraitValue(component, trait)
    const options = await loadMenuList(force)

    selectEl.innerHTML = [
      `<option value="">${PLACEHOLDER}</option>`,
      ...options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`),
    ].join('')
    selectEl.value = options.some((o) => o.value === currentValue) ? currentValue : ''
    const currentOption = options.find((o) => o.value === selectEl.value)
    if (currentOption) {
      component.set?.('fmMenuId', currentOption.id)
      component.addAttributes?.({ 'data-menu-id': currentOption.id })
    }
    statusEl.textContent = selectEl.value ? '发布页会按此菜单 Code 实时拉取最新菜单' : ''

    selectEl.onchange = () => {
      const option = options.find((o) => o.value === selectEl.value)
      writeTraitValue(component, trait, selectEl.value)
      component.set?.('fmMenuId', option?.id || '')
      component.addAttributes?.({ 'data-menu-id': option?.id || '' })
      statusEl.textContent = selectEl.value ? '已选择，发布页会实时拉取最新菜单' : ''
    }

    refreshBtn.onclick = () => refreshSelect(elInput, component, trait, true)
  }

  tm.addType('footer-menu-select', {
    createInput() {
      const el = document.createElement('div')
      el.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:8px;'
      el.innerHTML = `
        <select class="wb-fms-sel" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;background:#fff;">
          <option value="">${PLACEHOLDER}</option>
        </select>
        <div style="display:flex;gap:6px;">
          <button type="button" class="wb-fms-refresh" style="padding:6px 10px;border:1px solid #dcdfe6;background:#fff;color:#374151;border-radius:4px;font-size:12px;cursor:pointer;">刷新菜单</button>
        </div>
        <div class="wb-fms-status" style="font-size:12px;min-height:16px;color:#6b7280;line-height:1.5;"></div>
      `
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      refreshSelect(elInput, component, trait)
    },
  })
}


function registerLoopItemTemplateSelectTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('loop-item-template-select')) return

  type LoopItemTemplateOption = { value: string; label: string }

  const getComponentLoopItemType = (component: any): LoopItemType | '' => {
    const type = `${component?.get?.('cmsLoopItemType') ?? component?.getAttributes?.()?.['data-loop-item-type'] ?? ''}`.trim()
    return Object.prototype.hasOwnProperty.call(LOOP_ITEM_TYPE_LABELS, type)
      ? (type as LoopItemType)
      : ''
  }

  const loadOptions = async (loopItemType: LoopItemType | '', force = false): Promise<LoopItemTemplateOption[]> => {
    if (!loopItemType) return []
    const runtime = getEditorRuntime(editor)
    const cacheKey = `loopItemTemplateOptions:${loopItemType}`
    const promiseKey = `loopItemTemplateOptionsPromise:${loopItemType}`
    const cachedOptions = runtime.getCache<LoopItemTemplateOption[]>(cacheKey)
    const pendingOptions = runtime.getCache<Promise<LoopItemTemplateOption[]>>(promiseKey)
    if (!force && Array.isArray(cachedOptions)) {
      return cachedOptions
    }
    if (!force && pendingOptions) {
      return pendingOptions
    }

    const requestPromise = getPagePage({
      pageNo: 1,
      pageSize: 200,
      status: 'draft',
      resourceType: LOOP_ITEM_RESOURCE_TYPE,
    })
      .then((page) => {
        const options = (page.list || [])
          .filter((item) => getLoopItemType(item.extJson) === loopItemType)
          .map((item) => ({
            value: `${item.resourceId ?? ''}`,
            label: `${item.resourceName || item.resourceKey || item.resourceId}（ID ${item.resourceId}）`,
          }))
          .filter((item) => item.value)
        runtime.setCache(cacheKey, options)
        return options
      })
      .catch((error) => {
        console.error('[WebBuilder] Failed to load loop item template options', error)
        runtime.setCache(cacheKey, [])
        return []
      })
      .finally(() => {
        runtime.deleteCache(promiseKey)
      })

    runtime.setCache(promiseKey, requestPromise)
    return requestPromise
  }

  const render = async (elInput: HTMLElement, component: any, trait: any, force = false) => {
    const currentValue = readTraitValue(component, trait).trim()
    const loopItemType = getComponentLoopItemType(component)
    const typeLabel = loopItemType ? LOOP_ITEM_TYPE_LABELS[loopItemType] : '循环体'
    elInput.innerHTML = `
      <div class="wb-trait-loop-item-template" style="display:flex;flex-direction:column;gap:8px;width:100%;">
        <select class="wb-loop-item-template-select" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;background:#fff;">
          <option value="">请选择${escapeHtml(typeLabel)}</option>
          <option value="__loading__" disabled>加载中...</option>
        </select>
        <button type="button" class="wb-loop-item-template-refresh" style="padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;background:#fff;font-size:12px;cursor:pointer;color:#344054;">
          刷新循环体列表
        </button>
      </div>
    `

    const selectEl = elInput.querySelector('.wb-loop-item-template-select') as HTMLSelectElement | null
    const refreshBtn = elInput.querySelector('.wb-loop-item-template-refresh') as HTMLButtonElement | null
    if (!selectEl || !refreshBtn) return

    const options = await loadOptions(loopItemType, force)
    if (getComponentLoopItemType(component) !== loopItemType) return
    const placeholder = loopItemType ? `请选择${typeLabel}` : '请先选择循环体类型'
    const hasCurrentValue = options.some(option => option.value === currentValue)
    const visibleOptions = currentValue && !hasCurrentValue
      ? [
        {
          value: currentValue,
          label: `当前已选 ID ${currentValue}（未在${typeLabel}列表中）`,
        },
        ...options,
      ]
      : options
    const optionsHtml = [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...visibleOptions.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`),
    ].join('')

    selectEl.innerHTML = optionsHtml
    selectEl.value = currentValue || ''

    selectEl.onchange = () => {
      writeTraitValue(component, trait, selectEl.value)
    }

    refreshBtn.onclick = () => {
      void render(elInput, component, trait, true)
    }
  }

  const bindLoopTypeRefresh = (elInput: HTMLElement, component: any, trait: any) => {
    const statefulInput = elInput as HTMLElement & {
      __wbLoopTypeComponent?: any
      __wbLoopTypeHandler?: () => void
    }

    if (statefulInput.__wbLoopTypeComponent === component) return
    if (statefulInput.__wbLoopTypeComponent && statefulInput.__wbLoopTypeHandler) {
      statefulInput.__wbLoopTypeComponent.off?.('change:cmsLoopItemType', statefulInput.__wbLoopTypeHandler)
    }

    const handler = () => {
      writeTraitValue(component, trait, '')
      void render(elInput, component, trait, true)
    }
    component?.on?.('change:cmsLoopItemType', handler)
    statefulInput.__wbLoopTypeComponent = component
    statefulInput.__wbLoopTypeHandler = handler
  }

  tm.addType('loop-item-template-select', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-loop-item-template'
      el.style.cssText = 'width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      bindLoopTypeRefresh(elInput, component, trait)
      render(elInput, component, trait)
    },
  })
}

function registerHotspotShowcaseItemsTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm) return

  const openImagePicker = (onSelect: (src: string) => void) => {
    const im = getImageManager()
    if (!im) return
    const target = {
      selectCallback: (asset: any) => {
        const src = asset?.getSrc?.() ?? asset?.src ?? ''
        if (src) onSelect(src)
      },
    }
    if (typeof im.openAssetsDialogWithTarget === 'function') im.openAssetsDialogWithTarget(target)
    else if (typeof im.openAssetsDialog === 'function') im.openAssetsDialog(target)
  }

  const buildTextInput = (value: string, placeholder: string, onInput: (next: string) => void) => {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = value
    input.placeholder = placeholder
    input.style.cssText = 'width:100%;padding:6px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;'
    input.oninput = () => onInput(input.value)
    return input
  }

  const parsePercentValue = (value: string) => {
    const match = `${value ?? ''}`.trim().match(/-?\d+(\.\d+)?/)
    const numeric = match ? Number(match[0]) : 0
    if (!Number.isFinite(numeric)) return 0
    return Math.max(0, Math.min(100, numeric))
  }

  const formatPercentValue = (value: number) => `${Math.round(value * 10) / 10}%`

  const buildPercentControl = (label: string, value: string, onInput: (next: string) => void) => {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:6px;'

    const labelEl = document.createElement('div')
    labelEl.textContent = label
    labelEl.style.cssText = 'font-size:12px;color:#606266;font-weight:600;'

    const row = document.createElement('div')
    row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) 76px;gap:8px;align-items:center;'

    const range = document.createElement('input')
    range.type = 'range'
    range.min = '0'
    range.max = '100'
    range.step = '0.5'
    range.value = `${parsePercentValue(value)}`
    range.style.cssText = 'width:100%;margin:0;'

    const input = document.createElement('input')
    input.type = 'text'
    input.value = value || '0%'
    input.placeholder = '0%'
    input.style.cssText = 'width:100%;padding:6px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;'

    range.oninput = () => {
      const next = formatPercentValue(Number(range.value))
      input.value = next
      onInput(next)
    }

    input.oninput = () => {
      const parsed = parsePercentValue(input.value)
      range.value = `${parsed}`
      onInput(input.value.trim() || '0%')
    }

    input.onblur = () => {
      const next = formatPercentValue(parsePercentValue(input.value))
      input.value = next
      range.value = `${parsePercentValue(next)}`
      onInput(next)
    }

    row.appendChild(range)
    row.appendChild(input)
    wrapper.appendChild(labelEl)
    wrapper.appendChild(row)
    return wrapper
  }

  const buildTextarea = (value: string, placeholder: string, onInput: (next: string) => void, minHeight = 72) => {
    const input = document.createElement('textarea')
    input.value = value
    input.placeholder = placeholder
    input.style.cssText = `width:100%;min-height:${minHeight}px;padding:8px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;line-height:1.5;box-sizing:border-box;resize:vertical;`
    input.oninput = () => onInput(input.value)
    return input
  }

  const buildImageField = (label: string, value: string, onInput: (next: string) => void) => {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:8px;'

    const labelEl = document.createElement('div')
    labelEl.textContent = label
    labelEl.style.cssText = 'font-size:12px;color:#606266;font-weight:600;'

    const preview = document.createElement('div')
    preview.style.cssText = 'width:100%;height:108px;border-radius:10px;border:1px solid #e5e7eb;background:#f8fafc;overflow:hidden;display:flex;align-items:center;justify-content:center;'

    const img = document.createElement('img')
    img.src = value
    img.style.cssText = `width:100%;height:100%;object-fit:cover;display:${value ? 'block' : 'none'};`

    const empty = document.createElement('div')
    empty.textContent = '暂无图片'
    empty.style.cssText = `display:${value ? 'none' : 'flex'};align-items:center;justify-content:center;color:#9ca3af;font-size:12px;width:100%;height:100%;`

    preview.appendChild(img)
    preview.appendChild(empty)

    const row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:8px;'

    const pickBtn = document.createElement('button')
    pickBtn.type = 'button'
    pickBtn.textContent = '选择图片'
    pickBtn.style.cssText = 'flex:1;padding:6px 10px;border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;border-radius:8px;font-size:12px;cursor:pointer;'
    pickBtn.onclick = () => openImagePicker((src) => {
      input.value = src
      img.src = src
      img.style.display = src ? 'block' : 'none'
      empty.style.display = src ? 'none' : 'flex'
      onInput(src)
    })

    const input = document.createElement('input')
    input.type = 'text'
    input.value = value
    input.placeholder = '图片地址'
    input.style.cssText = 'flex:2;padding:6px 10px;border:1px solid #dcdfe6;border-radius:8px;font-size:12px;box-sizing:border-box;'
    input.oninput = () => {
      img.src = input.value
      img.style.display = input.value ? 'block' : 'none'
      empty.style.display = input.value ? 'none' : 'flex'
      onInput(input.value)
    }

    row.appendChild(pickBtn)
    row.appendChild(input)
    wrapper.appendChild(labelEl)
    wrapper.appendChild(preview)
    wrapper.appendChild(row)
    return wrapper
  }

  if (!tm.getType('hotspot-showcase-slides')) {
    tm.addType('hotspot-showcase-slides', {
      createInput() {
        const el = document.createElement('div')
        el.style.cssText = 'display:flex;flex-direction:column;gap:10px;'
        return el
      },
      onUpdate({ elInput, component }: any) {
        elInput.innerHTML = ''

        const hint = document.createElement('div')
        hint.textContent = '在节点树中选择“展示项”进行详细配置。'
        hint.style.cssText = 'font-size:12px;line-height:1.5;color:#6b7280;'

        const addBtn = document.createElement('button')
        addBtn.type = 'button'
        addBtn.textContent = '+ 添加展示项'
        addBtn.style.cssText = 'width:100%;padding:8px 12px;border:1px dashed #93c5fd;background:#f8fbff;color:#1d4ed8;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;'
        addBtn.onclick = () => {
          component?.addSlideItem?.()
        }

        elInput.appendChild(hint)
        elInput.appendChild(addBtn)
      },
    })
  }

  if (!tm.getType('hotspot-showcase-hotspots')) {
    tm.addType('hotspot-showcase-hotspots', {
      createInput() {
        const el = document.createElement('div')
        el.style.cssText = 'display:flex;flex-direction:column;gap:12px;'
        return el
      },
      onUpdate({ elInput, component, trait }: any) {
        const hotspots = normalizeHotspotShowcaseHotspots(readTraitValue(component, trait))
        elInput.innerHTML = ''

        const setHotspots = (nextHotspots: any[], rerender = false) => {
          writeTraitValue(component, trait, serializeHotspotShowcaseHotspots(nextHotspots as any))
          if (rerender) trait.trigger?.('change')
        }

        const list = document.createElement('div')
        list.style.cssText = 'display:flex;flex-direction:column;gap:12px;'

        hotspots.forEach((hotspot: any, hotspotIndex: number) => {
          const card = document.createElement('div')
          card.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;'

          const header = document.createElement('div')
          header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;'

          const title = document.createElement('div')
          title.textContent = hotspot.title?.trim() || `Hotspot ${hotspotIndex + 1}`
          title.style.cssText = 'font-size:12px;font-weight:700;color:#111827;'

          const removeBtn = document.createElement('button')
          removeBtn.type = 'button'
          removeBtn.textContent = '删除'
          removeBtn.style.cssText = 'padding:4px 8px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;border-radius:8px;font-size:12px;cursor:pointer;'
          removeBtn.onclick = () => {
            const next = hotspots.filter((_: any, index: number) => index !== hotspotIndex)
            setHotspots(next.length ? next : [createDefaultHotspotShowcaseHotspot(0)], true)
          }

          header.appendChild(title)
          header.appendChild(removeBtn)
          card.appendChild(header)

          card.appendChild(buildImageField('卡片图片', hotspot.image, (next) => {
            hotspots[hotspotIndex].image = next
            setHotspots(hotspots)
          }))
          card.appendChild(buildTextInput(hotspot.title, 'Hotspot 标题', (next) => {
            hotspots[hotspotIndex].title = next
            title.textContent = next.trim() || `Hotspot ${hotspotIndex + 1}`
            setHotspots(hotspots)
          }))
          card.appendChild(buildTextarea(hotspot.desc, 'Hotspot 描述', (next) => {
            hotspots[hotspotIndex].desc = next
            setHotspots(hotspots)
          }, 64))
          card.appendChild(buildTextInput(hotspot.buttonText, '按钮文字', (next) => {
            hotspots[hotspotIndex].buttonText = next
            setHotspots(hotspots)
          }))
          card.appendChild(buildTextInput(hotspot.link, '链接', (next) => {
            hotspots[hotspotIndex].link = next
            setHotspots(hotspots)
          }))

          const desktopRow = document.createElement('div')
          desktopRow.style.cssText = 'display:flex;flex-direction:column;gap:8px;'
          desktopRow.appendChild(buildPercentControl('PC Left', hotspot.left, (next) => {
            hotspots[hotspotIndex].left = next
            setHotspots(hotspots)
          }))
          desktopRow.appendChild(buildPercentControl('PC Top', hotspot.top, (next) => {
            hotspots[hotspotIndex].top = next
            setHotspots(hotspots)
          }))
          card.appendChild(desktopRow)

          const mobileRow = document.createElement('div')
          mobileRow.style.cssText = 'display:flex;flex-direction:column;gap:8px;'
          mobileRow.appendChild(buildPercentControl('移动端 Left', hotspot.mobileLeft, (next) => {
            hotspots[hotspotIndex].mobileLeft = next
            setHotspots(hotspots)
          }))
          mobileRow.appendChild(buildPercentControl('移动端 Top', hotspot.mobileTop, (next) => {
            hotspots[hotspotIndex].mobileTop = next
            setHotspots(hotspots)
          }))
          card.appendChild(mobileRow)

          list.appendChild(card)
        })

        const addBtn = document.createElement('button')
        addBtn.type = 'button'
        addBtn.textContent = '+ 添加 Hotspot'
        addBtn.style.cssText = 'width:100%;padding:8px 12px;border:1px dashed #93c5fd;background:#f8fbff;color:#1d4ed8;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;'
        addBtn.onclick = () => {
          setHotspots([...hotspots, createDefaultHotspotShowcaseHotspot(hotspots.length)], true)
        }

        elInput.appendChild(list)
        elInput.appendChild(addBtn)
      },
    })
  }
}

function registerFlipbookPagesTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('flipbook-pages')) return

  const openImagePicker = (onSelect: (src: string) => void) => {
    const im = getImageManager()
    if (!im) return
    const target = {
      selectCallback: (asset: any) => {
        const src = asset?.getSrc?.() ?? asset?.src ?? ''
        if (src) onSelect(src)
      },
    }
    if (typeof im.openAssetsDialogWithTarget === 'function') im.openAssetsDialogWithTarget(target)
    else if (typeof im.openAssetsDialog === 'function') im.openAssetsDialog(target)
  }

  const renderFlipbookPagesInput = ({ elInput, component, trait }: any) => {
    const rerender = () => {
      requestAnimationFrame(() => {
        renderFlipbookPagesInput({ elInput, component, trait })
      })
    }

    const triggerPickerForIndex = (pageIndex: number) => {
      openImagePicker((src) => {
        component?.updatePageItem?.(pageIndex, { image: src })
        rerender()
      })
    }

    const addNewPage = () => {
      const nextIndex = (component?.getPagesData?.() || []).length
      component?.addPageItem?.()
      rerender()
      requestAnimationFrame(() => {
        triggerPickerForIndex(nextIndex)
      })
    }

    const pages = component?.getPagesData?.() || []
    const selectedCount = pages.filter((page: any) => `${page?.image || ''}`.trim()).length
    elInput.innerHTML = ''

    const header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:center;border-bottom:1px solid #d8dde6;background:#fff;'

    const title = document.createElement('div')
    title.textContent = selectedCount > 0 ? `已选择 ${selectedCount} 张图像` : '未选择图像'
    title.style.cssText = 'padding:14px 18px;font-size:14px;line-height:1.4;color:#3b4552;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'

    header.appendChild(title)

    const body = document.createElement('div')
    body.style.cssText = 'padding:18px;background:#fff;'

    const grid = document.createElement('div')
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;'

    pages.forEach((page: any, pageIndex: number) => {
      const hasImage = !!`${page.image || ''}`.trim()
      const card = document.createElement('div')
      card.style.cssText = 'position:relative;width:96px;'

      const previewBtn = document.createElement('button')
      previewBtn.type = 'button'
      previewBtn.style.cssText = `position:relative;width:96px;height:96px;border:${hasImage ? '1px solid #d8dde6' : '0'};border-radius:6px;background:${hasImage ? '#f3f6f9' : '#5f6773'};overflow:hidden;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;`
      previewBtn.onclick = () => {
        triggerPickerForIndex(pageIndex)
      }

      const img = document.createElement('img')
      img.src = page.image || ''
      img.style.cssText = `width:100%;height:100%;object-fit:cover;display:${hasImage ? 'block' : 'none'};`

      if (hasImage) {
        const badge = document.createElement('div')
        badge.textContent = `${pageIndex + 1}`
        badge.style.cssText = 'position:absolute;left:6px;top:6px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:rgba(17,24,39,0.72);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;'

        const removeBtn = document.createElement('button')
        removeBtn.type = 'button'
        removeBtn.textContent = '×'
        removeBtn.setAttribute('aria-label', `删除第 ${pageIndex + 1} 张图片`)
        removeBtn.style.cssText = 'position:absolute;right:6px;top:6px;width:18px;height:18px;border:0;border-radius:999px;background:rgba(17,24,39,0.72);color:#fff;font-size:12px;line-height:18px;cursor:pointer;padding:0;'
        removeBtn.onclick = (event) => {
          event.preventDefault()
          event.stopPropagation()
          component?.removePageItem?.(pageIndex)
          rerender()
        }
        previewBtn.appendChild(img)
        previewBtn.appendChild(badge)
        previewBtn.appendChild(removeBtn)
      } else {
        previewBtn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" style="display:block;fill:none;stroke:#ffffff;stroke-width:2.2;stroke-linecap:round;"><circle cx="12" cy="12" r="9.2" stroke="rgba(255,255,255,0.9)"></circle><path d="M12 8v8M8 12h8"></path></svg>'
      }

      card.appendChild(previewBtn)
      grid.appendChild(card)
    })

    const addTile = document.createElement('button')
    addTile.type = 'button'
    addTile.setAttribute('aria-label', '添加图片')
    addTile.style.cssText = 'width:96px;height:96px;border:0;border-radius:6px;background:#5f6773;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.02);'
    addTile.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" style="display:block;fill:none;stroke:#ffffff;stroke-width:2.2;stroke-linecap:round;"><circle cx="12" cy="12" r="9.2" stroke="rgba(255,255,255,0.92)"></circle><path d="M12 8v8M8 12h8"></path></svg>'
    addTile.onclick = () => {
      addNewPage()
    }

    grid.appendChild(addTile)
    body.appendChild(grid)

    elInput.appendChild(header)
    elInput.appendChild(body)
  }

  tm.addType('flipbook-pages', {
    createInput() {
      const el = document.createElement('div')
      el.style.cssText = 'display:flex;flex-direction:column;gap:0;border:1px solid #d8dde6;border-radius:8px;overflow:hidden;background:#ffffff;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      renderFlipbookPagesInput({ elInput, component, trait })
    },
  })
}

const LINK_TARGET_OPTIONS = [
  { value: '_self', label: '当前页' },
  { value: '_blank', label: '新窗口' },
]

function createPageLinkTrait(baseTrait?: Record<string, any>) {
  return {
    ...(baseTrait || {}),
    type: 'page-link',
    name: 'href',
    label: baseTrait?.label || '链接地址',
    placeholder: baseTrait?.placeholder || baseTrait?.attributes?.placeholder || 'https://',
  }
}

function createLinkTargetTrait(baseTrait?: Record<string, any>) {
  return {
    ...(baseTrait || {}),
    type: 'select',
    name: 'target',
    label: baseTrait?.label || '打开方式',
    options: Array.isArray(baseTrait?.options) && baseTrait.options.length
      ? baseTrait.options
      : LINK_TARGET_OPTIONS,
  }
}

function normalizeAnchorTraits(traits: any[]): any[] {
  const nextTraits: any[] = []
  let hasHrefTrait = false
  let hasTargetTrait = false

  traits.forEach((trait) => {
    if (typeof trait !== 'object' || !trait) {
      nextTraits.push(trait)
      return
    }

    if (trait.name === 'href') {
      hasHrefTrait = true
      nextTraits.push(createPageLinkTrait(trait))
      return
    }

    if (trait.name === 'target') {
      hasTargetTrait = true
      nextTraits.push(createLinkTargetTrait(trait))
      return
    }

    nextTraits.push(trait)
  })

  if (!hasHrefTrait) {
    nextTraits.unshift(createPageLinkTrait())
  }

  if (!hasTargetTrait) {
    const hrefIndex = nextTraits.findIndex((trait) => typeof trait === 'object' && trait?.name === 'href')
    nextTraits.splice(hrefIndex >= 0 ? hrefIndex + 1 : nextTraits.length, 0, createLinkTargetTrait())
  }

  return nextTraits
}

function shouldPatchAnchorComponent(component: any): boolean {
  const tagName = `${component?.get?.('tagName') ?? ''}`.toLowerCase()
  const type = `${component?.get?.('type') ?? ''}`
  const attrs = component?.getAttributes?.() || {}

  if (tagName !== 'a') return false
  if (attrs['data-cms-bind-href']) return false

  return type === 'link' || type === 'default'
}

function patchAnchorComponentTraits(component: any) {
  if (!shouldPatchAnchorComponent(component)) return

  const traits = Array.isArray(component.get?.('traits')) ? component.get('traits') : []
  const nextTraits = normalizeAnchorTraits(traits)
  const hasPageLinkHref = traits.some(
    (trait: any) => typeof trait === 'object' && trait?.name === 'href' && trait?.type === 'page-link',
  )
  const hasTargetTrait = traits.some(
    (trait: any) => typeof trait === 'object' && trait?.name === 'target',
  )
  const hasLegacyHrefTrait = traits.some(
    (trait: any) => typeof trait === 'object' && trait?.name === 'href' && trait?.type !== 'page-link',
  )

  if (!hasPageLinkHref || !hasTargetTrait || hasLegacyHrefTrait) {
    component.set?.('traits', nextTraits)
  }

  const attrs = component.getAttributes?.() || {}
  const nextAttrs: Record<string, string> = {}

  if (!attrs.href) {
    nextAttrs.href = '#'
  }

  if (!attrs.target) {
    nextAttrs.target = '_self'
  }

  if (Object.keys(nextAttrs).length) {
    component.addAttributes?.(nextAttrs)
  }
}

/**
 * 把原生 link 组件默认 href trait 升级为 page-link。
 */
function patchNativeLinkTraits(editor: Editor) {
  const domc = editor.DomComponents
  const linkType = domc?.getType?.('link')
  const modelProto = linkType?.model?.prototype as any
  const defaults = modelProto?.defaults
  if (defaults) {
    const traits = Array.isArray(defaults.traits) ? defaults.traits : []
    const nextTraits = normalizeAnchorTraits(traits)
    defaults.traits = nextTraits
  }

  const editorState = editor as Editor & {
    __wbAnchorTraitPatchBound?: boolean
  }

  if (editorState.__wbAnchorTraitPatchBound) return
  editorState.__wbAnchorTraitPatchBound = true

  editor.on('component:selected', (component: any) => {
    if (!component) return
    patchAnchorComponentTraits(component)
  })
}

// ── icon-radio ──────────────────────────────────────────────────

/**
 * 注册 icon-radio 自定义 Trait 类型
 * createInput 渲染图标单选按钮组
 */
function registerIconRadioTrait(editor: Editor) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('icon-radio')) return

  const ACTIVE_BORDER = '#409eff'
  const ACTIVE_BG = '#ecf5ff'
  const INACTIVE_BORDER = '#dcdfe6'
  const INACTIVE_BG = '#fff'

  function setActiveStates(container: HTMLElement, activeValue: string) {
    const buttons = container.querySelectorAll('.wb-ir-btn') as NodeListOf<HTMLButtonElement>
    buttons.forEach((btn) => {
      const isActive = btn.dataset.value === activeValue
      btn.style.borderColor = isActive ? ACTIVE_BORDER : INACTIVE_BORDER
      btn.style.background = isActive ? ACTIVE_BG : INACTIVE_BG
    })
  }

  tm.addType('icon-radio', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-icon-radio'
      el.style.cssText = 'display:flex;gap:2px;width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const options = trait.get?.('options') ?? []
      const value = readTraitValue(component, trait)

      // Build buttons if container is empty
      if (!elInput.querySelector('.wb-ir-btn')) {
        for (const opt of options) {
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'wb-ir-btn'
          btn.dataset.value = opt.value
          btn.title = opt.label || opt.value
          btn.style.cssText = `flex:1;display:flex;align-items:center;justify-content:center;padding:6px;border:1px solid ${INACTIVE_BORDER};background:${INACTIVE_BG};cursor:pointer;border-radius:4px;min-width:0;`

          if (opt.icon) {
            const img = document.createElement('img')
            img.src = iconifySvgUrl(opt.icon, 16)
            img.width = 16
            img.height = 16
            img.alt = opt.label || ''
            img.style.cssText = 'display:block;pointer-events:none;'
            btn.appendChild(img)
          } else {
            btn.textContent = opt.label || opt.value
            btn.style.fontSize = '12px'
          }

          elInput.appendChild(btn)
        }
      }

      // Update active states
      setActiveStates(elInput, value)

      // Rebind click handlers (component reference may have changed)
      const buttons = elInput.querySelectorAll('.wb-ir-btn') as NodeListOf<HTMLButtonElement>
      buttons.forEach((btn) => {
        btn.onclick = () => {
          const newValue = btn.dataset.value || ''
          writeTraitValue(component, trait, newValue)
          setActiveStates(elInput, newValue)
        }
      })
    },
  })
}

const createTraitRuntime = (editor: Editor) => ({
  dataSources: getTraitDataSourceRegistry(editor),
  getImageManager,
})

export const TRAIT_REGISTRIES: ComponentRegistryExecutor[] = [
  {
    id: 'trait:pageLink',
    register: editor => registerPageLinkTrait(editor, createTraitRuntime(editor)),
  },
  { id: 'trait:inquiryType', register: registerInquiryTypeSelectTrait },
  { id: 'trait:menuTreeSelect', register: registerMenuTreeSelectTrait },
  { id: 'trait:navbarMenuSelect', register: registerNavbarMenuSelectTrait },
  { id: 'trait:navbarThbMenuSelect', register: registerNavbarThbMenuSelectTrait },
  { id: 'trait:loopItemTemplate', register: registerLoopItemTemplateSelectTrait },
  { id: 'trait:hotspotShowcaseItems', register: registerHotspotShowcaseItemsTrait },
  { id: 'trait:flipbookPages', register: registerFlipbookPagesTrait },
  { id: 'trait:linkPatch', register: patchNativeLinkTraits },
  { id: 'trait:customAttributes', register: registerCustomAttributesTrait },
  {
    id: 'trait:colorPicker',
    register: editor => registerColorPickerTrait(editor, createTraitRuntime(editor)),
  },
  {
    id: 'trait:codeEditor',
    register: editor => registerCodeEditorTrait(editor, createTraitRuntime(editor)),
  },
  {
    id: 'trait:imagePicker',
    register: editor => registerImagePickerTrait(editor, createTraitRuntime(editor)),
  },
  {
    id: 'trait:svgIconPicker',
    register: editor => registerSvgIconPickerTrait(editor, createTraitRuntime(editor)),
  },
  { id: 'trait:iconRadio', register: registerIconRadioTrait },
  { id: 'trait:footerMenuSelect', register: registerFooterMenuSelectTrait },
]
