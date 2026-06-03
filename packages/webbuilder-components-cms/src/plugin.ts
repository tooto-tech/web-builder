import {
  hasWebBuilderCapability,
  type WebBuilderBlockPack,
  type WebBuilderBlockPackProvider,
  type WebBuilderFeaturePlugin,
  type WebBuilderPluginCleanup,
  type WebBuilderPluginContext,
} from '@tooto-tech/webbuilder-core'

export const CMS_COMPONENTS_PLUGIN_ID = 'cms-components'
export const CMS_COMPONENTS_CAPABILITY = 'webbuilder:cms-components'

export const CMS_COMPONENT_LOAD_TYPES = [
  'wb-cms-post-list',
  'wb-cms-post-card',
  'wb-cms-cases-list',
  'wb-cms-cases-card',
  'wb-cms-post-category-filter',
  'wb-cms-post-latest',
  'wb-cms-post-detail',
  'wb-cms-media-list',
  'wb-cms-technical-service-list',
  'wb-cms-technical-service-card',
  'wb-cms-technical-download-list',
  'wb-cms-technical-download-item',
  'wb-cms-technical-support-detail',
  'wb-cms-media-latest',
  'wb-cms-media-detail',
  'wb-cms-product-list',
  'wb-cms-product-card',
  'wb-cms-product-datasheet-list',
  'wb-cms-product-latest',
  'wb-cms-product-featured',
  'wb-cms-product-related',
  'wb-cms-product-detail',
  'wb-cms-product-detail-v2',
  'wb-cms-faq-section',
  'wb-cms-product-category-faq',
  'wb-cms-search',
  'wb-cms-site-menu',
  'wb-cms-menu-tree',
  'wb-cms-dynamic-text',
  'wb-cms-dynamic-html',
  'wb-cms-dynamic-image',
  'wb-cms-dynamic-link',
  'wb-cms-dynamic-datetime',
  'wb-cms-dynamic-if',
  'wb-cms-dynamic-repeat',
  'wb-cms-dynamic-repeat-item',
  'wb-cms-dynamic-seo',
  'wb-cms-dynamic-toc',
  'wb-cms-dynamic-breadcrumb',
  'wb-loop-grid',
  'wb-ssg-field',
] as const

export const CMS_COMPONENT_REQUIRED_HOST_SERVICES = [
  'post',
  'media',
  'product',
  'menu',
  'faq',
  'inquiry',
] as const

const CMS_DYNAMIC_BLOCKS: WebBuilderBlockPack['blocks'] = [
  {
    id: 'cms-dynamic-text',
    label: '动态文本',
    category: 'CMS Dynamic',
    order: 10,
    media: 'lucide:type',
    content: { type: 'wb-cms-dynamic-text' },
    componentTypes: ['wb-cms-dynamic-text'],
  },
  {
    id: 'cms-dynamic-html',
    label: '动态 HTML',
    category: 'CMS Dynamic',
    order: 20,
    media: 'lucide:code',
    content: { type: 'wb-cms-dynamic-html' },
    componentTypes: ['wb-cms-dynamic-html'],
  },
  {
    id: 'cms-dynamic-image',
    label: '动态图片',
    category: 'CMS Dynamic',
    order: 30,
    media: 'lucide:image',
    content: { type: 'wb-cms-dynamic-image' },
    componentTypes: ['wb-cms-dynamic-image'],
  },
  {
    id: 'cms-dynamic-link',
    label: '动态链接',
    category: 'CMS Dynamic',
    order: 40,
    media: 'lucide:link',
    content: { type: 'wb-cms-dynamic-link' },
    componentTypes: ['wb-cms-dynamic-link'],
  },
  {
    id: 'cms-dynamic-datetime',
    label: '动态日期',
    category: 'CMS Dynamic',
    order: 50,
    media: 'lucide:calendar',
    content: { type: 'wb-cms-dynamic-datetime' },
    componentTypes: ['wb-cms-dynamic-datetime'],
  },
  {
    id: 'cms-dynamic-if',
    label: '条件显示',
    category: 'CMS Dynamic',
    order: 60,
    media: 'lucide:split',
    content: { type: 'wb-cms-dynamic-if' },
    componentTypes: ['wb-cms-dynamic-if'],
  },
  {
    id: 'cms-dynamic-repeat',
    label: '动态循环',
    category: 'CMS Dynamic',
    order: 70,
    media: 'lucide:repeat',
    content: { type: 'wb-cms-dynamic-repeat' },
    componentTypes: ['wb-cms-dynamic-repeat'],
  },
  {
    id: 'cms-dynamic-breadcrumb',
    label: '面包屑导航',
    category: 'CMS Dynamic',
    order: 80,
    media: 'lucide:chevrons-right',
    content: { type: 'wb-cms-dynamic-breadcrumb' },
    componentTypes: ['wb-cms-dynamic-breadcrumb'],
  },
  {
    id: 'cms-dynamic-toc',
    label: '文章目录',
    category: 'CMS Dynamic',
    order: 90,
    media: 'lucide:list-tree',
    content: { type: 'wb-cms-dynamic-toc' },
    componentTypes: ['wb-cms-dynamic-toc'],
  },
  {
    id: 'cms-dynamic-seo',
    label: 'SEO Meta',
    category: 'CMS Dynamic',
    order: 100,
    media: 'lucide:search',
    content: { type: 'wb-cms-dynamic-seo' },
    componentTypes: ['wb-cms-dynamic-seo'],
  },
  {
    id: 'cms-loop-grid',
    label: 'CMS Loop Grid',
    category: 'CMS Dynamic',
    order: 110,
    media: 'lucide:grid-3x3',
    content: { type: 'wb-loop-grid' },
    componentTypes: ['wb-loop-grid'],
  },
  {
    id: 'cms-ssg-field',
    label: 'SSG 字段',
    category: 'CMS Dynamic',
    order: 120,
    media: 'lucide:braces',
    content: { type: 'wb-ssg-field' },
    componentTypes: ['wb-ssg-field'],
  },
]

export interface CmsComponentsRuntime {
  activateEditor?: (
    context: WebBuilderPluginContext
  ) => void | WebBuilderPluginCleanup
  activateCmsPreview?: (
    context: WebBuilderPluginContext
  ) => void | WebBuilderPluginCleanup
  activateTemplatePreview?: (
    context: WebBuilderPluginContext
  ) => void | WebBuilderPluginCleanup
  blockPacks?: WebBuilderBlockPackProvider
}

const runCleanupStack = (cleanups: WebBuilderPluginCleanup[]) => {
  cleanups
    .slice()
    .reverse()
    .forEach(cleanup => cleanup())
}

const collectRuntimeBlockPacks = (
  runtime: CmsComponentsRuntime
): WebBuilderBlockPackProvider => context => {
  const packs = runtime.blockPacks?.(context) ?? [
    {
      id: 'cms-dynamic-fields',
      label: 'CMS Dynamic Fields',
      order: 90,
      blocks: CMS_DYNAMIC_BLOCKS.filter(block =>
        (block.componentTypes ?? []).every(type => context.canInsertComponentType(type))
      ),
    },
  ]
  return packs.filter((pack): pack is WebBuilderBlockPack => Boolean(pack))
}

export const createCmsComponentsPlugin = (
  runtime: CmsComponentsRuntime = {}
): WebBuilderFeaturePlugin => ({
  id: CMS_COMPONENTS_PLUGIN_ID,
  label: 'CMS Components',
  order: 90,
  requiredHostServices: [...CMS_COMPONENT_REQUIRED_HOST_SERVICES],
  loadComponentTypes: [...CMS_COMPONENT_LOAD_TYPES],
  insertComponentTypes: [...CMS_COMPONENT_LOAD_TYPES],
  activateWhen: context => hasWebBuilderCapability(context.capabilityIds, CMS_COMPONENTS_CAPABILITY),
  blockPacks: [collectRuntimeBlockPacks(runtime)],
  activateEditor(context) {
    const cleanups: WebBuilderPluginCleanup[] = []
    const addCleanup = (cleanup: void | WebBuilderPluginCleanup) => {
      if (cleanup) cleanups.push(cleanup)
    }

    try {
      addCleanup(runtime.activateEditor?.(context))
      addCleanup(runtime.activateCmsPreview?.(context))
      addCleanup(runtime.activateTemplatePreview?.(context))
    } catch (error) {
      runCleanupStack(cleanups)
      throw error
    }

    return () => runCleanupStack(cleanups)
  },
  publisher: {
    id: 'publisher:cms-components',
    order: 90,
  },
})
