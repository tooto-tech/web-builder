import type { Trait } from 'grapesjs'

export interface TraitRowOption {
  value: string
  label: string
}

export interface TraitRow {
  id: string
  name: string
  label: string
  type: string
  kind: 'field' | 'color' | 'image' | 'page-link' | 'code' | 'svg-icon'
  value: unknown
  options: TraitRowOption[]
  placeholder?: string
  ui: Record<string, unknown>
  language?: string
  sourceName?: string
  raw: Trait
  setValue: (value: unknown) => void
}

type ProviderTrait = Trait & {
  get?: (key: string) => unknown
}

const readModelValue = (
  model: { get?: (key: string) => unknown } | undefined,
  key: string,
): unknown => model?.get?.(key)

const toStringValue = (value: unknown, fallback = ''): string => {
  if (value == null) return fallback
  return `${value}`
}

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}

const mapTraitKind = (type: string): TraitRow['kind'] => {
  if (type === 'color' || type === 'color-picker') return 'color'
  if (type === 'image-picker') return 'image'
  if (type === 'page-link') return 'page-link'
  if (type === 'code-editor') return 'code'
  if (type === 'svg-icon-picker') return 'svg-icon'
  return 'field'
}

const normalizeOptions = (trait: ProviderTrait): TraitRowOption[] =>
  (trait.getOptions?.() ?? [])
    .map(option => ({
      value: toStringValue(option.value ?? option.id),
      label: toStringValue(option.label ?? option.name ?? option.value ?? option.id),
    }))

export const normalizeTraitRows = (
  traits: Trait[],
): TraitRow[] =>
  traits.map((trait, index) => {
    const providerTrait = trait as ProviderTrait
    const name = toStringValue(providerTrait.getName?.() ?? readModelValue(providerTrait, 'name'))
    const id = toStringValue(providerTrait.getId?.() ?? name ?? index, `${index}`)
    const type = toStringValue(providerTrait.getType?.() ?? readModelValue(providerTrait, 'type'), 'text')
    const ui = toRecord(readModelValue(providerTrait, 'ui'))
    const language = toStringValue(
      readModelValue(providerTrait, 'language')
        ?? ui.language,
      '',
    ) || undefined
    const sourceName = toStringValue(ui.sourceName, '') || undefined

    return {
      id,
      name,
      label: toStringValue(providerTrait.getLabel?.({ locale: false }) ?? readModelValue(providerTrait, 'label'), name),
      type,
      kind: mapTraitKind(type),
      value: providerTrait.getValue?.({ useType: type === 'checkbox' }) ?? providerTrait.getDefault?.() ?? '',
      options: normalizeOptions(providerTrait),
      placeholder: toStringValue(readModelValue(providerTrait, 'placeholder'), '') || undefined,
      ui,
      language,
      sourceName,
      raw: trait,
      setValue(value: unknown) {
        providerTrait.setValue?.(value)
      },
    }
  })
