import type { Editor } from 'grapesjs'

export function hasClass(component: any, className: string): boolean {
  return Boolean(component?.getClasses?.()?.includes?.(className))
}

export function findImmediateChildByClass(model: any, className: string): any | null {
  const components = model?.components?.() as any
  let found: any = null

  components?.each?.((component: any) => {
    if (!found && hasClass(component, className)) {
      found = component
    }
  })

  return found
}

export function findImmediateChildByType(model: any, expectedType: string): any | null {
  const components = model?.components?.() as any
  let found: any = null

  components?.each?.((component: any) => {
    if (!found && component?.get?.('type') === expectedType) {
      found = component
    }
  })

  return found
}

export function readTextnodeContentByClass(model: any, className: string): string {
  const target = findImmediateChildByClass(model, className)
  const components = target?.components?.() as any
  let content = ''

  components?.each?.((component: any) => {
    if (!content && component?.get?.('type') === 'textnode') {
      content = (component.get('content') as string) || ''
    }
  })

  return content
}

export function readFirstTextnodeContent(model: any): string {
  const components = model?.components?.() as any
  let content = ''

  components?.each?.((component: any) => {
    if (!content && component?.get?.('type') === 'textnode') {
      content = (component.get('content') as string) || ''
    }
  })

  return content
}

export function writeTextnodeContentByClass(model: any, className: string, value: string): void {
  const target = findImmediateChildByClass(model, className)
  const components = target?.components?.() as any

  components?.each?.((component: any) => {
    if (component?.get?.('type') === 'textnode') {
      const current = `${component.get?.('content') ?? ''}`
      if (current !== value) {
        component.set('content', value)
      }
    }
  })
}

export function writeFirstTextnodeContent(model: any, value: string): void {
  const components = model?.components?.() as any

  components?.each?.((component: any) => {
    if (component?.get?.('type') === 'textnode') {
      const current = `${component.get?.('content') ?? ''}`
      if (current !== value) {
        component.set('content', value)
      }
    }
  })
}

export function applyStyleVars(model: any, vars: Record<string, string | undefined | null>): void {
  const currentStyle = { ...(model.getStyle?.() ?? {}) } as Record<string, string>
  const nextStyle = { ...currentStyle }

  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      delete nextStyle[key]
      return
    }

    nextStyle[key] = String(value)
  })

  const currentKeys = Object.keys(currentStyle).sort()
  const nextKeys = Object.keys(nextStyle).sort()
  const sameKeys =
    currentKeys.length === nextKeys.length
    && currentKeys.every((key, index) => key === nextKeys[index])

  const sameValues =
    sameKeys
    && nextKeys.every((key) => `${currentStyle[key] ?? ''}` === `${nextStyle[key] ?? ''}`)

  if (!sameValues) {
    model.setStyle?.(nextStyle)
  }
}

export function toPx(value: string | number | undefined, fallback: number): string {
  const next = Number(value)
  return `${Number.isFinite(next) && next > 0 ? next : fallback}px`
}

export function toCssSize(value: string | number | undefined, fallback: string): string {
  if (typeof value === 'number') {
    return value > 0 ? `${value}px` : fallback
  }

  const raw = `${value ?? ''}`.trim()
  if (!raw) return fallback

  return /^\d+(\.\d+)?$/.test(raw) ? `${raw}px` : raw
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveTraitTarget(editor: Editor, expectedType: string, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === expectedType) return selected

  const fromSelected = selected?.closestType?.(expectedType) as any
  if (fromSelected?.get?.('type') === expectedType) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === expectedType) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(expectedType) as any
  if (fromTmTarget?.get?.('type') === expectedType) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === expectedType) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(expectedType) as any
  if (fromTraitTarget?.get?.('type') === expectedType) return fromTraitTarget

  return null
}
