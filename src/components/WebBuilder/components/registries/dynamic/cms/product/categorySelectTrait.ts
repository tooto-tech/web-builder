import { getCategoryList } from '@/api/mall/product/category'
import { handleTree } from '@/utils/tree'

type TraitOption = {
  value: string
  label: string
}

type ProductCategoryNode = {
  id: string
  parentId: string
  name: string
  sort: number
  children?: ProductCategoryNode[]
}

interface ProductCategoryTraitMeta {
  rootOptions: TraitOption[]
  labelById: Record<string, string>
}

interface InitProductCategorySelectTraitOptions {
  allLabel?: string
  traitName?: string
}

let productCategoryTraitMetaPromise: Promise<ProductCategoryTraitMeta> | null = null

function normalizeCategoryList(list: any[]): ProductCategoryNode[] {
  if (!Array.isArray(list)) return []

  return list
    .map((item) => ({
      id: String(item?.id ?? '').trim(),
      parentId: String(item?.parentId ?? '').trim(),
      name: String(item?.name ?? '').trim(),
      sort: Number(item?.sort ?? 0) || 0,
    }))
    .filter((item) => item.id && item.name)
}

function sortTree(nodes: ProductCategoryNode[]): ProductCategoryNode[] {
  return [...nodes]
    .sort((a, b) => {
      const sortDiff = a.sort - b.sort
      if (sortDiff !== 0) return sortDiff
      return a.name.localeCompare(b.name, 'zh-Hans-CN')
    })
    .map((node) => ({
      ...node,
      children: sortTree(node.children || []),
    }))
}

function buildPathLabel(
  categoryId: string,
  nodeMap: Record<string, ProductCategoryNode>,
): string {
  const labels: string[] = []
  const visited = new Set<string>()
  let currentId = categoryId

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const current = nodeMap[currentId]
    if (!current) break

    labels.unshift(current.name)
    currentId = current.parentId
  }

  return labels.join(' / ')
}

async function loadProductCategoryTraitMeta(): Promise<ProductCategoryTraitMeta> {
  const rawList = await getCategoryList({})
  const normalized = normalizeCategoryList(Array.isArray(rawList) ? rawList : [])
  const categoryTree = sortTree(handleTree(normalized, 'id', 'parentId') as ProductCategoryNode[])

  const nodeMap = normalized.reduce<Record<string, ProductCategoryNode>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})

  const labelById = normalized.reduce<Record<string, string>>((acc, item) => {
    const label = buildPathLabel(item.id, nodeMap)
    if (label) acc[item.id] = label
    return acc
  }, {})

  return {
    rootOptions: categoryTree.map((item) => ({
      value: item.id,
      label: item.name,
    })),
    labelById,
  }
}

function getProductCategoryTraitMeta(): Promise<ProductCategoryTraitMeta> {
  if (!productCategoryTraitMetaPromise) {
    productCategoryTraitMetaPromise = loadProductCategoryTraitMeta().catch((error) => {
      productCategoryTraitMetaPromise = null
      throw error
    })
  }
  return productCategoryTraitMetaPromise
}

export async function initProductCategorySelectTrait(
  model: any,
  options: InitProductCategorySelectTraitOptions = {},
): Promise<void> {
  const traitName = options.traitName || 'cmsCategoryId'
  const allLabel = options.allLabel || '全部产品'
  const trait = model.getTrait?.(traitName)
  if (!trait) return

  const currentValue = String(model.get(traitName) ?? '').trim()

  try {
    const meta = await getProductCategoryTraitMeta()
    const traitOptions: TraitOption[] = [{ value: '', label: allLabel }, ...meta.rootOptions]

    if (currentValue && !traitOptions.some((item) => item.value === currentValue)) {
      traitOptions.push({
        value: currentValue,
        label: meta.labelById[currentValue]
          ? `${meta.labelById[currentValue]}（当前值）`
          : `当前分类 (#${currentValue})`,
      })
    }

    trait.set('options', traitOptions)
  } catch {
    const fallbackOptions: TraitOption[] = [{ value: '', label: allLabel }]

    if (currentValue) {
      fallbackOptions.push({
        value: currentValue,
        label: `当前分类 (#${currentValue})`,
      })
    }

    trait.set('options', fallbackOptions)
  }
}
