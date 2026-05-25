import { createContainerBlockContent } from '@/components/WebBuilder/components/registries/layout/container'
import { WB_SECTION_GRID_BLOCK_TYPE } from '@/components/WebBuilder/components/registries/layout/sectionGridBlock'
import { WB_HEADING_TYPE } from '@/components/WebBuilder/components/registries/typography/heading'
import { WB_TEXT_EDITOR_TYPE } from '@/components/WebBuilder/components/registries/typography/textEditor'
import { WB_IMAGE_TYPE } from '@/components/WebBuilder/components/registries/media/image'
import { WB_ICON_TYPE } from '@/components/WebBuilder/components/registries/media/icon'
import { WB_LANGUAGE_SWITCHER_TYPE } from '@/components/WebBuilder/components/registries/navigation/languageSwitcher'

export type WebBuilderBlockContent = string | Record<string, any>

export interface WebBuilderBlockCatalogContext {
  resourceType?: string | null
  resourceExtJson?: string | null
  dynamicContext?: string | null
  tenantId?: string | number | null
  siteType?: string | null
  projectKey?: string | null
  ownerType?: string | null
  ownerId?: string | number | null
}

export interface WebBuilderBlockDefinition {
  id: string
  label: string
  icon: string
  content: WebBuilderBlockContent
  category?: string
  order?: number
  contexts?: string[]
  visible?: boolean | ((context: WebBuilderBlockCatalogContext) => boolean)
}

export interface WebBuilderBlockPack {
  id: string
  label?: string
  blocks:
    | WebBuilderBlockDefinition[]
    | ((context: WebBuilderBlockCatalogContext) => WebBuilderBlockDefinition[])
}

export interface WebBuilderBlockGroup {
  id: string
  label: string
  items: WebBuilderBlockDefinition[]
}

const BASIC_CATEGORY = 'basic'
const NAVIGATION_CATEGORY = 'navigation'

const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Basic',
  layout: 'Layout',
  section: 'Section',
  media: 'Media',
  navigation: 'Navigation',
  interactive: 'Interactive',
  cms: 'CMS',
  dynamic: 'Dynamic',
  project: '项目组件',
  tenant: '租户组件',
  custom: '扩展组件',
  other: '其他'
}

const CATEGORY_ORDER = [
  'basic',
  'layout',
  'section',
  'media',
  'navigation',
  'interactive',
  'cms',
  'dynamic',
  'project',
  'tenant',
  'custom',
  'other'
]

const CATEGORY_ALIASES: Record<string, string> = {
  basic: 'basic',
  basics: 'basic',
  layout: 'layout',
  layouts: 'layout',
  section: 'section',
  sections: 'section',
  media: 'media',
  navigation: 'navigation',
  nav: 'navigation',
  interactive: 'interactive',
  ui: 'interactive',
  cms: 'cms',
  dynamic: 'dynamic',
  project: 'project',
  tenant: 'tenant',
  custom: 'custom',
  other: 'other'
}

const normalizeCategory = (category?: string | null): string => {
  const raw = `${category || ''}`.trim()
  if (!raw) return 'other'
  return CATEGORY_ALIASES[raw.toLowerCase()] || raw
}

const createCoreBasicBlocks = (): WebBuilderBlockDefinition[] => [
  {
    id: 'section-grid-block',
    label: '区块',
    icon: 'material-symbols-light:view-day',
    content: { type: WB_SECTION_GRID_BLOCK_TYPE },
    category: BASIC_CATEGORY
  },
  {
    id: 'container',
    label: '容器',
    icon: 'lucide:square',
    content: createContainerBlockContent(),
    category: BASIC_CATEGORY
  },
  {
    id: 'heading',
    label: '标题',
    icon: 'lucide:heading',
    content: { type: WB_HEADING_TYPE },
    category: BASIC_CATEGORY
  },
  {
    id: 'paragraph',
    label: '文本编辑器',
    icon: 'lucide:align-left',
    content: { type: WB_TEXT_EDITOR_TYPE },
    category: BASIC_CATEGORY
  },
  {
    id: 'link',
    label: '链接',
    icon: 'lucide:link',
    content: {
      type: 'link',
      content: '链接',
      attributes: {
        href: '#'
      }
    },
    category: BASIC_CATEGORY
  },
  {
    id: 'image',
    label: '图片',
    icon: 'lucide:image',
    content: { type: WB_IMAGE_TYPE },
    category: BASIC_CATEGORY
  },
  {
    id: 'icon',
    label: '图标',
    icon: 'lucide:sparkles',
    content: { type: WB_ICON_TYPE },
    category: BASIC_CATEGORY
  },
  {
    id: 'language-switcher',
    label: '多语言切换',
    icon: 'lucide:languages',
    content: { type: WB_LANGUAGE_SWITCHER_TYPE },
    category: NAVIGATION_CATEGORY
  }
]

const normalizeSearchText = (value: string) => value.trim().toLowerCase()

export const blockMatchesSearch = (block: WebBuilderBlockDefinition, query: string) => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  return [
    block.label,
    block.id,
    block.category || '',
    block.icon,
    typeof block.content === 'object' ? String(block.content.type || '') : ''
  ].some((value) => normalizeSearchText(String(value)).includes(normalizedQuery))
}

const resolvePackBlocks = (pack: WebBuilderBlockPack, context: WebBuilderBlockCatalogContext) => {
  const blocks = typeof pack.blocks === 'function' ? pack.blocks(context) : pack.blocks
  return Array.isArray(blocks) ? blocks : []
}

const isBlockVisible = (
  block: WebBuilderBlockDefinition,
  context: WebBuilderBlockCatalogContext
) => {
  if (block.contexts?.length) {
    const dynamicContext = `${context.dynamicContext || ''}`.trim()
    if (!dynamicContext || !block.contexts.includes(dynamicContext)) return false
  }

  if (typeof block.visible === 'boolean') return block.visible
  if (typeof block.visible === 'function') return block.visible(context)
  return true
}

export const createWebBuilderBlockCatalog = (
  context: WebBuilderBlockCatalogContext = {},
  extensionPacks: WebBuilderBlockPack[] = []
): WebBuilderBlockDefinition[] => {
  const allBlocks = [
    ...createCoreBasicBlocks(),
    ...extensionPacks.flatMap((pack) => resolvePackBlocks(pack, context))
  ]

  const deduped = new Map<string, WebBuilderBlockDefinition>()
  allBlocks.forEach((block, index) => {
    if (!block?.id || !isBlockVisible(block, context)) return
    deduped.set(block.id, {
      ...block,
      category: normalizeCategory(block.category),
      order: block.order ?? index
    })
  })

  return Array.from(deduped.values()).sort((a, b) => {
    const categoryA = CATEGORY_ORDER.indexOf(a.category || 'other')
    const categoryB = CATEGORY_ORDER.indexOf(b.category || 'other')
    const resolvedCategoryA = categoryA === -1 ? Number.MAX_SAFE_INTEGER : categoryA
    const resolvedCategoryB = categoryB === -1 ? Number.MAX_SAFE_INTEGER : categoryB
    if (resolvedCategoryA !== resolvedCategoryB) return resolvedCategoryA - resolvedCategoryB
    return (a.order ?? 0) - (b.order ?? 0)
  })
}

export const groupWebBuilderBlocks = (
  blocks: WebBuilderBlockDefinition[]
): WebBuilderBlockGroup[] => {
  const groups = new Map<string, WebBuilderBlockGroup>()

  blocks.forEach((block) => {
    const id = normalizeCategory(block.category)
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        label: CATEGORY_LABELS[id] || id,
        items: []
      })
    }
    groups.get(id)!.items.push(block)
  })

  return Array.from(groups.values()).sort((a, b) => {
    const categoryA = CATEGORY_ORDER.indexOf(a.id)
    const categoryB = CATEGORY_ORDER.indexOf(b.id)
    return (
      (categoryA === -1 ? Number.MAX_SAFE_INTEGER : categoryA) -
      (categoryB === -1 ? Number.MAX_SAFE_INTEGER : categoryB)
    )
  })
}
