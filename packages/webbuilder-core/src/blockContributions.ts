import type {
  WebBuilderBlock,
  WebBuilderBlockContributionContext,
  WebBuilderBlockPack,
  WebBuilderFeaturePlugin,
} from './featurePlugin.js'

const normalizeType = (value: unknown) => `${value ?? ''}`.trim()

const inferBlockComponentType = (block: WebBuilderBlock) => {
  const content = block.content
  if (!content || typeof content !== 'object' || Array.isArray(content)) return ''
  return normalizeType((content as { type?: unknown }).type)
}

const getBlockComponentTypes = (block: WebBuilderBlock) => {
  const explicitTypes = block.componentTypes?.map(normalizeType).filter(Boolean) ?? []
  if (explicitTypes.length) return explicitTypes

  const inferredType = inferBlockComponentType(block)
  return inferredType ? [inferredType] : []
}

const isBlockInsertAllowed = (
  plugin: WebBuilderFeaturePlugin,
  block: WebBuilderBlock,
  context: WebBuilderBlockContributionContext
) => {
  const componentTypes = getBlockComponentTypes(block)
  if (!componentTypes.length) return true

  const pluginInsertTypes = new Set(plugin.insertComponentTypes?.map(normalizeType).filter(Boolean))
  if (pluginInsertTypes.size > 0 && componentTypes.some(type => !pluginInsertTypes.has(type))) {
    return false
  }

  return componentTypes.every(type => context.canInsertComponentType(type))
}

export const collectWebBuilderBlockPacks = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderBlockContributionContext
): WebBuilderBlockPack[] => {
  const seenBlockIds = new Set<string>()
  const packs: WebBuilderBlockPack[] = []

  plugins.forEach((plugin) => {
    plugin.blockPacks?.forEach((provider) => {
      const providedPacks = provider(context) ?? []
      providedPacks.forEach((pack) => {
        const blocks = pack.blocks.filter(block => isBlockInsertAllowed(plugin, block, context))
        if (!blocks.length) return

        blocks.forEach((block) => {
          if (seenBlockIds.has(block.id)) {
            throw new Error(`Duplicate WebBuilder block id "${block.id}"`)
          }
          seenBlockIds.add(block.id)
        })

        packs.push({
          ...pack,
          blocks,
        })
      })
    })
  })

  return packs
}
