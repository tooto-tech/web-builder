export type OrderedLanguage = {
  id?: number | string | null
  sortOrder?: number | string | null
  code?: string | null
  slug?: string | null
  name?: string | null
}

const toFiniteNumber = (value: unknown, fallback: number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

export const compareLanguagesByOrder = <T extends OrderedLanguage>(left: T, right: T) => {
  const leftSortOrder = toFiniteNumber(left.sortOrder, Number.MAX_SAFE_INTEGER)
  const rightSortOrder = toFiniteNumber(right.sortOrder, Number.MAX_SAFE_INTEGER)
  if (leftSortOrder !== rightSortOrder) return leftSortOrder - rightSortOrder

  const leftId = toFiniteNumber(left.id, Number.MAX_SAFE_INTEGER)
  const rightId = toFiniteNumber(right.id, Number.MAX_SAFE_INTEGER)
  if (leftId !== rightId) return leftId - rightId

  const leftLabel = `${left.code || left.slug || left.name || ''}`
  const rightLabel = `${right.code || right.slug || right.name || ''}`
  return leftLabel.localeCompare(rightLabel)
}

export const sortLanguagesByOrder = <T extends OrderedLanguage>(
  languages?: readonly T[] | null
): T[] => {
  return Array.isArray(languages) ? [...languages].sort(compareLanguagesByOrder) : []
}
