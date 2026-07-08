export type RulePageOption = {
  id: string
  label: string
  resourceType?: string
}

export interface SelectablePageRow {
  resourceKey?: string | null
  resourceName?: string | null
  resourceType?: string | null
}

export interface RulePageListParams {
  pageNo: number
  pageSize: number
  status?: string
  resourceType?: string
}

export interface RulePageListResult {
  list?: SelectablePageRow[]
}

const LIST_PAGE_SIZE = 200

const LAYOUT_RULE_TARGET_TYPES = [
  'PAGE',
  'TEMP_POST_DETAIL',
  'TEMP_POST_CATEGORY_LIST',
  'TEMP_PRODUCT_DETAIL',
  'TEMP_PRODUCT_CATEGORY_LIST',
  'TEMP_MEDIA_DETAIL',
  'TEMP_MEDIA_CATEGORY_LIST',
]

const buildSelectablePageQueries = (): Omit<RulePageListParams, 'pageNo' | 'pageSize'>[] => [
  ...LAYOUT_RULE_TARGET_TYPES.map((resourceType) => ({
    status: 'draft',
    resourceType,
  })),
]

export const toRulePageOptions = (rows: SelectablePageRow[] | null | undefined): RulePageOption[] => {
  const deduped = new Map<string, RulePageOption>()

  ;(rows || []).forEach((row) => {
    const id = `${row.resourceKey ?? ''}`.trim()
    if (!id || deduped.has(id)) return

    deduped.set(id, {
      id,
      label: `${row.resourceName ?? row.resourceKey ?? id}`.trim() || id,
      resourceType: `${row.resourceType ?? ''}`.trim() || undefined,
    })
  })

  return Array.from(deduped.values()).sort((left, right) => left.label.localeCompare(right.label))
}

export const loadRulePageOptions = async (
  fetchPageList: (params: RulePageListParams) => Promise<RulePageListResult>,
): Promise<RulePageOption[]> => {
  let lastError: unknown = null
  const rows: SelectablePageRow[] = []

  for (const query of buildSelectablePageQueries()) {
    try {
      const result = await fetchPageList({
        pageNo: 1,
        pageSize: LIST_PAGE_SIZE,
        ...query,
      })
      rows.push(...(result?.list || []).map((row) => ({
        ...row,
        resourceType: row.resourceType ?? query.resourceType,
      })))
    } catch (error) {
      lastError = error
    }
  }

  const options = toRulePageOptions(rows)
  if (options.length > 0) {
    return options
  }

  if (lastError) {
    throw lastError
  }

  return []
}
