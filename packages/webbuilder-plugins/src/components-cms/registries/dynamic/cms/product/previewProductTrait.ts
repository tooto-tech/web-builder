import { getWebBuilderDynamicDataProvider } from '../../dataProvider.js'

interface InitPreviewProductTraitOptions {
  traitName?: string
  emptyLabel?: string
}

export async function initPreviewProductTrait(
  model: any,
  options: InitPreviewProductTraitOptions = {},
): Promise<void> {
  const traitName = options.traitName || 'cmsPreviewProductId'
  const emptyLabel = options.emptyLabel || '未选择（显示占位模板）'
  const trait = model.getTrait?.(traitName)
  if (!trait) return

  try {
    const list = await getWebBuilderDynamicDataProvider().products.loadSimpleList()
    const options = Array.isArray(list)
      ? list.map((item: any) => ({
          value: String(item.id ?? ''),
          label: item.name ? `${item.name} (#${item.id})` : `#${item.id}`,
        }))
      : []

    trait.set('options', [{ value: '', label: emptyLabel }, ...options])
  } catch {
    trait.set('options', [
      { value: '', label: emptyLabel },
      { value: model.get(traitName) || '', label: '加载产品列表失败，请手动输入 ID' },
    ])
  }
}
