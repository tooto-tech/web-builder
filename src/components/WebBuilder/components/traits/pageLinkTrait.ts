import {
  dedupeTraitDataSourceOptions,
  getLocalPageLinkOptions as getRegistryLocalPageLinkOptions,
  getTraitDataSourceRegistry,
  type TraitDataSourceOption,
  type TraitDataSourceRegistry,
} from '../../utils/traitDataSourceRegistry'
import type { Editor } from 'grapesjs'

export interface PageLinkTraitRuntime {
  dataSources?: TraitDataSourceRegistry
}

type PageLinkKind = '__manual__' | 'page' | 'post' | 'product'
type PageLinkOption = TraitDataSourceOption

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

function escapeHtml(text: string): string {
  return `${text ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function dedupePageLinkOptions(options: PageLinkOption[]): PageLinkOption[] {
  return dedupeTraitDataSourceOptions(options)
}

function getRuntimeDataSources(editor: Editor, runtime: PageLinkTraitRuntime) {
  return runtime.dataSources ?? getTraitDataSourceRegistry(editor)
}

function getLocalPageLinkOptions(editor: Editor): PageLinkOption[] {
  return getRegistryLocalPageLinkOptions(editor)
}

function getCachedRemotePageLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime): PageLinkOption[] {
  return getRuntimeDataSources(editor, runtime).getCachedPageLinks()
}

function hasCachedRemotePageLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime): boolean {
  return getRuntimeDataSources(editor, runtime).hasCachedPageLinks()
}

function getCachedRemotePostLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime): PageLinkOption[] {
  return getRuntimeDataSources(editor, runtime).getCachedPostLinks()
}

function getCachedRemotePostLinkOptionsByType(editor: Editor, runtime: PageLinkTraitRuntime, typeId?: string): PageLinkOption[] {
  return getRuntimeDataSources(editor, runtime).getCachedPostLinks(typeId)
}

function hasCachedRemotePostLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime, typeId?: string): boolean {
  return getRuntimeDataSources(editor, runtime).hasCachedPostLinks(typeId)
}

function getCachedRemoteProductLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime): PageLinkOption[] {
  return getRuntimeDataSources(editor, runtime).getCachedProductLinks()
}

function hasCachedRemoteProductLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime): boolean {
  return getRuntimeDataSources(editor, runtime).hasCachedProductLinks()
}

async function loadRemotePageLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime, force = false): Promise<PageLinkOption[]> {
  return getRuntimeDataSources(editor, runtime).loadPageLinks({ force })
}

async function loadRemotePostLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime, force = false, typeId?: string): Promise<PageLinkOption[]> {
  return getRuntimeDataSources(editor, runtime).loadPostLinks({ force, typeId })
}

async function loadRemoteProductLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime, force = false): Promise<PageLinkOption[]> {
  return getRuntimeDataSources(editor, runtime).loadProductLinks({ force })
}

function getPageLinkOptions(editor: Editor, runtime: PageLinkTraitRuntime): PageLinkOption[] {
  return dedupePageLinkOptions([
    ...getLocalPageLinkOptions(editor),
    ...getCachedRemotePageLinkOptions(editor, runtime),
    ...getCachedRemotePostLinkOptions(editor, runtime),
    ...getCachedRemoteProductLinkOptions(editor, runtime),
  ])
}

function getPageLinkKindOptions(editor: Editor, runtime: PageLinkTraitRuntime, kind: PageLinkKind): PageLinkOption[] {
  switch (kind) {
    case 'page':
      return dedupePageLinkOptions([
        ...getLocalPageLinkOptions(editor),
        ...getCachedRemotePageLinkOptions(editor, runtime),
      ])
    case 'post':
      return getCachedRemotePostLinkOptionsByType(editor, runtime)
    case 'product':
      return getCachedRemoteProductLinkOptions(editor, runtime)
    default:
      return []
  }
}

function inferPageLinkKind(editor: Editor, runtime: PageLinkTraitRuntime, value: string): PageLinkKind {
  if (!value) return '__manual__'
  if (getPageLinkKindOptions(editor, runtime, 'page').some(option => option.value === value)) return 'page'
  if (getCachedRemotePostLinkOptionsByType(editor, runtime).some(option => option.value === value)) return 'post'
  if (getCachedRemoteProductLinkOptions(editor, runtime).some(option => option.value === value)) return 'product'
  return '__manual__'
}

function getItemSelectPlaceholder(kind: PageLinkKind): string {
  if (kind === 'page') return '请选择页面'
  if (kind === 'post') return '请选择文章'
  if (kind === 'product') return '请选择产品'
  return '请先选择链接类型'
}

function renderPageLinkOptionsHtml(options: PageLinkOption[], placeholder: string): string {
  const renderOption = (opt: PageLinkOption) =>
    `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`

  return [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...options.map(renderOption),
  ].join('')
}

export function registerPageLinkTrait(editor: Editor, runtime: PageLinkTraitRuntime = {}) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('page-link')) return

  tm.addType('page-link', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-page-link'
      el.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const currentValue = readTraitValue(component, trait)
      const normalized = `${currentValue ?? ''}`.trim()
      const placeholder = trait.get?.('placeholder') || 'https://'
      let currentKind = inferPageLinkKind(editor, runtime, normalized)
      let currentOptions = getPageLinkKindOptions(editor, runtime, currentKind)
      let matched = currentOptions.find(opt => opt.value === normalized)

      elInput.innerHTML = `
        <select class="wb-page-link-kind" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;background:#fff;">
          <option value="__manual__">手动填写 URL</option>
          <option value="page">页面</option>
          <option value="post">文章</option>
          <option value="product">产品</option>
        </select>
        <select class="wb-page-link-select" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;background:#fff;">
          ${renderPageLinkOptionsHtml(currentOptions, getItemSelectPlaceholder(currentKind))}
        </select>
        <input class="wb-page-link-input" type="text" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(normalized)}" style="width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;" />
      `

      const kindEl = elInput.querySelector('.wb-page-link-kind') as HTMLSelectElement | null
      const selectEl = elInput.querySelector('.wb-page-link-select') as HTMLSelectElement | null
      const inputEl = elInput.querySelector('.wb-page-link-input') as HTMLInputElement | null
      if (!kindEl || !selectEl || !inputEl) return

      const syncControls = () => {
        const isManual = currentKind === '__manual__'
        currentOptions = getPageLinkKindOptions(editor, runtime, currentKind)
        matched = currentOptions.find(opt => opt.value === `${inputEl.value ?? ''}`.trim())

        kindEl.value = currentKind
        selectEl.style.display = isManual ? 'none' : 'block'
        selectEl.innerHTML = renderPageLinkOptionsHtml(currentOptions, getItemSelectPlaceholder(currentKind))
        selectEl.value = matched?.value ?? ''
      }

      const loadOptionsForKind = (kind: PageLinkKind) => {
        if (kind === 'page' && !hasCachedRemotePageLinkOptions(editor, runtime)) {
          return loadRemotePageLinkOptions(editor, runtime)
        }
        if (kind === 'post') {
          if (!hasCachedRemotePostLinkOptions(editor, runtime)) {
            return loadRemotePostLinkOptions(editor, runtime)
          }
          return Promise.resolve([])
        }
        if (kind === 'product' && !hasCachedRemoteProductLinkOptions(editor, runtime)) {
          return loadRemoteProductLinkOptions(editor, runtime)
        }
        return Promise.resolve([])
      }

      kindEl.value = currentKind
      syncControls()

      kindEl.onchange = () => {
        currentKind = kindEl.value as PageLinkKind
        syncControls()
        loadOptionsForKind(currentKind).then(() => {
          if (!elInput.isConnected) return
          syncControls()
        })
      }

      selectEl.onchange = () => {
        const selected = selectEl.value
        if (!selected) return
        writeTraitValue(component, trait, selected)
        inputEl.value = selected
        syncControls()
      }

      inputEl.oninput = () => {
        const value = inputEl.value
        writeTraitValue(component, trait, value)
        const inferredKind = inferPageLinkKind(editor, runtime, `${value ?? ''}`.trim())
        if (inferredKind !== '__manual__') {
          currentKind = inferredKind
        }
        syncControls()
      }

      if (!hasCachedRemotePageLinkOptions(editor, runtime) || !hasCachedRemotePostLinkOptions(editor, runtime) || !hasCachedRemoteProductLinkOptions(editor, runtime)) {
        Promise.all([
          loadRemotePageLinkOptions(editor, runtime),
          loadRemotePostLinkOptions(editor, runtime),
          loadRemoteProductLinkOptions(editor, runtime),
        ]).then(() => {
          if (!elInput.isConnected) return
          const nextValue = readTraitValue(component, trait)
          const nextNormalized = `${nextValue ?? ''}`.trim()
          currentKind = inferPageLinkKind(editor, runtime, nextNormalized)
          currentOptions = getPageLinkOptions(editor, runtime)
          inputEl.value = nextNormalized
          syncControls()
        })
      }
    },
  })
}
