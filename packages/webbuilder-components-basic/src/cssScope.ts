export function transformCssSelectors(
  css: string,
  transform: (selector: string) => string,
): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')

  return withoutComments
    .replace(/(^|[{}])\s*([^@{}][^{}]*?)\s*\{/gms, (_match, prefix: string, selectorText: string) => {
      const scopedSelectors = selectorText
        .split(',')
        .map(selector => selector.trim())
        .filter(Boolean)
        .map(transform)
        .join(',\n')

      return `${prefix}\n${scopedSelectors} {`
    })
    .trim()
}

export function removeCssRulesByPrefixes(cssComposer: any, prefixes: string[]): void {
  if (!cssComposer?.getRules || !cssComposer?.remove) return

  const rules = cssComposer.getRules() as any[]
  const toRemove = rules.filter((rule: any) => {
    const selector = `${rule?.selectorsToString?.() ?? ''}`.trim()
    return selector && prefixes.some(prefix => selector.startsWith(prefix))
  })

  if (toRemove.length) {
    cssComposer.remove(toRemove)
  }
}

export function removeUngroupedCssRulesByPrefixes(cssComposer: any, prefixes: string[]): void {
  if (!cssComposer?.getRules || !cssComposer?.remove) return

  const rules = cssComposer.getRules() as any[]
  const toRemove = rules.filter((rule: any) => {
    const selector = `${rule?.selectorsToString?.() ?? ''}`.trim()
    const group = `${rule?.get?.('group') ?? ''}`.trim()
    return !group && selector && prefixes.some(prefix => selector.startsWith(prefix))
  })

  if (toRemove.length) {
    cssComposer.remove(toRemove)
  }
}
