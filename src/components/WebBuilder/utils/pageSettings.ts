export type PageSettings = {
  id: string
  name: string
  slug: string
  tdkTitle: string
  tdkDescription: string
  tdkKeywords: string
  customHead: string
  customBody: string
  /**
   * 当前页面关联的预览数据资源 ID（文章 / 媒体 / 产品）。
   * 仅在当前页面属于详情模板（TEMP_POST_DETAIL / TEMP_MEDIA_DETAIL /
   * TEMP_PRODUCT_DETAIL）时有效。用户在"模板设置"里选中后，会把对应详情数据
   * 注入画布里的 `data-cms-bind*` 属性，让动态字段预览显示真实数据。
   */
  previewResourceId?: number | null
}

const toModelList = (input: any): any[] => {
  if (Array.isArray(input)) return input
  if (Array.isArray(input?.models)) return input.models
  return []
}

const getPageLayoutSlot = (page: any): 'header' | 'footer' | null => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  const slot = custom?.wbLayoutSlot
  if (slot === 'header' || slot === 'footer') return slot

  const id = `${custom?.wbLayoutPageId ?? page?.get?.('id') ?? page?.id ?? ''}`.trim()
  if (/^wb-header(?:-\d+)?$/.test(id)) return 'header'
  if (/^wb-footer(?:-\d+)?$/.test(id)) return 'footer'

  const name = `${page?.get?.('name') ?? page?.name ?? ''}`.trim()
  if (/^Header(?:\s+\d+)?$/.test(name)) return 'header'
  if (/^Footer(?:\s+\d+)?$/.test(name)) return 'footer'

  return null
}

export const getPageSettingsFromPage = (page: any): PageSettings => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  const tdk = custom.tdk ?? {}

  const rawPreviewId = custom?.wbPreviewResourceId
  const parsedPreviewId = Number(rawPreviewId)
  const previewResourceId =
    rawPreviewId != null && rawPreviewId !== '' && Number.isFinite(parsedPreviewId)
      ? parsedPreviewId
      : null

  return {
    id: page?.get?.('id') ?? page?.id ?? '',
    name: page?.get?.('name') ?? page?.name ?? '',
    slug: page?.get?.('slug') ?? page?.slug ?? custom.slug ?? '',
    tdkTitle: custom.tdkTitle ?? tdk.title ?? '',
    tdkDescription: custom.tdkDescription ?? tdk.description ?? '',
    tdkKeywords: custom.tdkKeywords ?? tdk.keywords ?? '',
    customHead: custom.customHead ?? custom.head ?? '',
    customBody: custom.customBody ?? custom.body ?? '',
    previewResourceId,
  }
}

export const applyPageSettingsToPage = (page: any, settings: PageSettings) => {
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  const nextCustom: Record<string, any> = {
    ...custom,
    slug: settings.slug,
    tdkTitle: settings.tdkTitle,
    tdkDescription: settings.tdkDescription,
    tdkKeywords: settings.tdkKeywords,
    tdk: {
      ...(custom.tdk ?? {}),
      title: settings.tdkTitle,
      description: settings.tdkDescription,
      keywords: settings.tdkKeywords,
    },
    customHead: settings.customHead,
    customBody: settings.customBody,
  }

  if (settings.previewResourceId != null && Number.isFinite(settings.previewResourceId)) {
    nextCustom.wbPreviewResourceId = settings.previewResourceId
  } else {
    delete nextCustom.wbPreviewResourceId
  }

  if (page?.set) {
    page.set('name', settings.name)
    page.set('slug', settings.slug)
    page.set('custom', nextCustom)
  } else if (page?.name !== undefined) {
    page.name = settings.name
    page.slug = settings.slug
    page.custom = nextCustom
  }
}

export const getPrimaryContentPageFromEditor = (editor: any) => {
  const selected = editor?.Pages?.getSelected?.()
  if (selected && getPageLayoutSlot(selected) === null) {
    return selected
  }

  const pages = toModelList(editor?.Pages?.getAll?.())
  return pages.find((page) => getPageLayoutSlot(page) === null) ?? selected ?? pages[0] ?? null
}

export const getPageResourceNameFromEditor = (editor: any): string | undefined => {
  const page = getPrimaryContentPageFromEditor(editor)
  const name = getPageSettingsFromPage(page).name.trim()
  return name || undefined
}
