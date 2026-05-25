const SYMBOLS_CMD_ADD = 'symbols:add'
const SYMBOLS_CMD_REMOVE = 'symbols:remove'
const SYMBOLS_CMD_CREATE = 'symbols:create'

type SymbolPlacement = 'inside' | 'after'

const resolveInsertTarget = (target: any, placement: SymbolPlacement, index?: number) => {
  if (!target) return null

  if (placement === 'after') {
    const parent = target.parent?.()
    const collection = parent?.components?.()
    if (!collection?.add) return null
    const models = collection.models ?? []
    const at = typeof index === 'number' ? index : models.indexOf(target) + 1
    return { collection, options: { at: Math.max(at, 0) } }
  }

  const collection = target.components?.()
  if (!collection?.add) return null

  return {
    collection,
    options: typeof index === 'number' ? { at: index } : {}
  }
}

const insertSymbolInstance = (
  target: any,
  instance: any,
  placement: SymbolPlacement,
  index?: number
) => {
  const insertTarget = resolveInsertTarget(target, placement, index)
  if (!insertTarget) return null

  const inserted = insertTarget.collection.add(instance, insertTarget.options)
  return Array.isArray(inserted) ? inserted[0] : inserted
}

export default function grapesjsSymbolsFallback(editor: any) {
  editor.Commands.add(SYMBOLS_CMD_ADD, {
    run(_editor: any, _sender: any, options: { component?: any; label?: string } = {}) {
      const component = options.component
      if (!component) return null

      const mainSymbol = editor.Components.addSymbol(component)
      if (!mainSymbol) return null

      if (options.label && typeof mainSymbol.set === 'function') {
        mainSymbol.set('customName', options.label)
        mainSymbol.set('name', options.label)
      }

      return { main: mainSymbol }
    }
  })

  editor.Commands.add(SYMBOLS_CMD_REMOVE, {
    run(_editor: any, _sender: any, options: { symbolId?: string; component?: any } = {}) {
      const target =
        options.component ||
        editor.Components.getSymbols().find((symbol: any) => symbol.getId?.() === options.symbolId)

      if (!target?.remove) return null
      target.remove()
      return target
    }
  })

  editor.Commands.add(
    SYMBOLS_CMD_CREATE,
    {
      run(
        _editor: any,
        _sender: any,
        options: {
          symbol?: any
          target?: any
          pos?: { placement?: SymbolPlacement; index?: number }
        } = {}
      ) {
        const symbol = options.symbol
        const target = options.target
        if (!symbol || !target) return null

        const placement = options.pos?.placement === 'after' ? 'after' : 'inside'
        const index = options.pos?.index
        const instance = editor.Components.addSymbol(symbol)
        if (!instance) return null

        return insertSymbolInstance(target, instance, placement, index)
      }
    }
  )
}
