export type LayoutStyleProperty = 'max-width' | 'grid-template-columns' | 'grid-template-rows'

export interface LayoutStyleComponentAdapter {
  getAttributes?: () => Record<string, unknown>
  set?: (key: string, value: unknown, options?: { silent?: boolean }) => void
}

const LAYOUT_WIDTH_COMPONENTS = new Set(['container', 'grid'])

function getWebBuilderComponentType(comp: LayoutStyleComponentAdapter): string {
  return `${comp?.getAttributes?.()?.['data-wb-component'] ?? ''}`.trim()
}

function setSilent(comp: LayoutStyleComponentAdapter, key: string, value: string | undefined): void {
  if (typeof comp?.set !== 'function') return
  comp.set(key, `${value ?? ''}`.trim(), { silent: true })
}

export function isLayoutStyleProperty(property: string): property is LayoutStyleProperty {
  return (
    property === 'max-width' ||
    property === 'grid-template-columns' ||
    property === 'grid-template-rows'
  )
}

export function syncLayoutStyleOverride(
  comp: LayoutStyleComponentAdapter,
  property: string,
  value: string | undefined,
): void {
  const wbType = getWebBuilderComponentType(comp)

  if (property === 'max-width') {
    if (LAYOUT_WIDTH_COMPONENTS.has(wbType)) {
      setSilent(comp, 'manualMaxWidth', value)
    }
    return
  }

  if (wbType !== 'grid') return

  if (property === 'grid-template-columns') {
    setSilent(comp, 'manualGridTemplateColumns', value)
  }

  if (property === 'grid-template-rows') {
    setSilent(comp, 'manualGridTemplateRows', value)
  }
}

export function syncLayoutStyleOverrides(
  comp: LayoutStyleComponentAdapter,
  styles: Record<string, string>,
): void {
  Object.entries(styles).forEach(([property, value]) => {
    if (isLayoutStyleProperty(property)) {
      syncLayoutStyleOverride(comp, property, value)
    }
  })
}
