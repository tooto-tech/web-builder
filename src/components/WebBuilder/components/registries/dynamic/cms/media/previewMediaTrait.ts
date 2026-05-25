import { getMediaResourcePage } from '@/api/content/mediaResource'

interface InitPreviewMediaTraitOptions {
  traitName?: string
  emptyLabel?: string
  categoryId?: string
}

export async function initPreviewMediaTrait(
  model: any,
  options: InitPreviewMediaTraitOptions = {},
): Promise<void> {
  const traitName = options.traitName || 'cmsPreviewMediaId'
  const emptyLabel = options.emptyLabel || '未选择（显示占位模板）'
  const trait = model.getTrait?.(traitName)
  if (!trait) return

  try {
    const params: Record<string, any> = {
      pageNo: 1,
      pageSize: 100,
    }

    const categoryId = String(options.categoryId || '').trim()
    if (categoryId) {
      params.categoryId = categoryId
    }

    const result = await getMediaResourcePage(params)
    const list = Array.isArray(result?.list)
      ? result.list
      : Array.isArray(result)
        ? result
        : []

    const previewOptions = list.map((item: any) => {
      const title = item?.title || item?.contents?.[0]?.title || ''
      const id = String(item?.id ?? '')
      return {
        value: id,
        label: title ? `${title} (#${id})` : `#${id}`,
      }
    })

    trait.set('options', [{ value: '', label: emptyLabel }, ...previewOptions])
  } catch {
    trait.set('options', [
      { value: '', label: emptyLabel },
      { value: model.get(traitName) || '', label: '加载媒体资源失败，请手动输入 ID' },
    ])
  }
}
