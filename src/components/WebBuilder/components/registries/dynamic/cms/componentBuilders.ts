import type { GrapesEditor } from '../../../../types/editor'
import {
  makePaginationNav,
  makePreviewGrid,
  makePreviewHeader,
  registerCmsComponent,
} from '@/components/WebBuilder/utils/cmsFactory'
import {
  buildCategoryLimitConfig,
  buildCategoryResourcePaginationConfig,
  type CmsComponentModel,
  type CategoryLimitConfigOptions,
} from './configBuilders'

type CmsCardFactory = (index: number) => any

export interface SeoMetaOptions {
  titleBind: string
  titleContent: string
  keywordsBind?: string
  descriptionBind?: string
}

interface BaseCmsRegisterOptions {
  type: string
  dataWbComponent: string
  dataCmsComponent: string
  name: string
  styleKey: string
  styles: string
}

export interface LatestCmsComponentOptions extends BaseCmsRegisterOptions, CategoryLimitConfigOptions {
  headerClass: string
  headerContent: string
  repeatEntity: string
  gridClass: string
  cardCount: number
  createCard: CmsCardFactory
}

export interface DetailCmsComponentOptions extends BaseCmsRegisterOptions {
  dynamicPublish?: boolean
  headerClass: string
  headerContent: string
  bodyClass: string
  bodyComponents: any[]
  extraComponents?: any[]
  defaultAttributes?: Record<string, string>
  defaultProps?: Record<string, any>
  traits?: any[]
  watchProps?: string[]
  syncAttrs?: (m: CmsComponentModel) => Record<string, string>
  onModelInit?: (model: any) => void | Promise<void>
  script?: any
  scriptExport?: any
  scriptProps?: string[]
}

export interface MediaListCmsComponentOptions extends BaseCmsRegisterOptions {
  headerClass: string
  headerContent: string
  repeatEntity: string
  gridClass: string
  paginationClass: string
  pageBtnClass: string
  categoryLabel: string
  categoryPlaceholder: string
  cardCount: number
  createCard: CmsCardFactory
}

export function buildIndexedPreviewCards(
  count: number,
  createCard: CmsCardFactory,
) {
  return Array.from({ length: count }, (_, index) => createCard(index + 1))
}

export function registerLatestCmsComponent(editor: GrapesEditor, options: LatestCmsComponentOptions) {
  const categoryLimit = buildCategoryLimitConfig({
    categoryLabel: options.categoryLabel,
    categoryPlaceholder: options.categoryPlaceholder,
    limitLabel: options.limitLabel,
    limitDefault: options.limitDefault,
    limitMin: options.limitMin,
    limitMax: options.limitMax,
  })

  registerCmsComponent(editor, {
    type: options.type,
    dataWbComponent: options.dataWbComponent,
    dataCmsComponent: options.dataCmsComponent,
    name: options.name,
    styleKey: options.styleKey,
    styles: options.styles,
    defaultAttributes: categoryLimit.defaultAttributes,
    defaultProps: categoryLimit.defaultProps,
    traits: categoryLimit.traits,
    components: [
      makePreviewHeader(options.headerClass, options.headerContent),
      makePreviewGrid(
        options.repeatEntity,
        options.gridClass,
        buildIndexedPreviewCards(options.cardCount, options.createCard),
      ),
    ],
    watchProps: categoryLimit.watchProps,
    syncAttrs: categoryLimit.syncAttrs,
  })
}

export function buildSeoMetaNodes(options: SeoMetaOptions) {
  const nodes: any[] = [
    {
      tagName: 'title',
      attributes: { 'data-cms-bind': options.titleBind },
      content: options.titleContent,
      layerable: false,
      selectable: false,
      hoverable: false,
    },
  ]

  if (options.keywordsBind) {
    nodes.push({
      tagName: 'meta',
      attributes: { name: 'keywords', content: '', 'data-cms-bind-content': options.keywordsBind },
      layerable: false,
      selectable: false,
      hoverable: false,
    })
  }

  if (options.descriptionBind) {
    nodes.push({
      tagName: 'meta',
      attributes: { name: 'description', content: '', 'data-cms-bind-content': options.descriptionBind },
      layerable: false,
      selectable: false,
      hoverable: false,
    })
  }

  return nodes
}

export function registerDetailCmsComponent(editor: GrapesEditor, options: DetailCmsComponentOptions) {
  registerCmsComponent(editor, {
    type: options.type,
    dataWbComponent: options.dataWbComponent,
    dataCmsComponent: options.dataCmsComponent,
    name: options.name,
    dynamicPublish: options.dynamicPublish,
    styleKey: options.styleKey,
    styles: options.styles,
    defaultAttributes: options.defaultAttributes || {},
    defaultProps: options.defaultProps || {},
    traits: options.traits || [],
    components: [
      makePreviewHeader(options.headerClass, options.headerContent),
      {
        tagName: 'div',
        droppable: options.dynamicPublish ? '.pm-text-block, .pm-doc-block, .pm-gallery-block, .pm-image-block, .pm-video-block' : false,
        attributes: { class: options.bodyClass },
        components: options.bodyComponents,
      },
      ...(options.extraComponents || []),
    ],
    watchProps: options.watchProps || [],
    syncAttrs: options.syncAttrs || (() => ({})),
    onModelInit: options.onModelInit,
    script: options.script,
    scriptExport: options.scriptExport,
    scriptProps: options.scriptProps,
  })
}

export function registerMediaListCmsComponent(editor: GrapesEditor, options: MediaListCmsComponentOptions) {
  const config = buildCategoryResourcePaginationConfig({
    categoryLabel: options.categoryLabel,
    categoryPlaceholder: options.categoryPlaceholder,
  })

  registerCmsComponent(editor, {
    type: options.type,
    dataWbComponent: options.dataWbComponent,
    dataCmsComponent: options.dataCmsComponent,
    name: options.name,
    styleKey: options.styleKey,
    styles: options.styles,
    defaultAttributes: config.defaultAttributes,
    defaultProps: config.defaultProps,
    traits: config.traits,
    components: [
      makePreviewHeader(options.headerClass, options.headerContent),
      makePreviewGrid(
        options.repeatEntity,
        options.gridClass,
        buildIndexedPreviewCards(options.cardCount, options.createCard),
      ),
      makePaginationNav(options.paginationClass, options.pageBtnClass, {
        interactiveInEditor: true,
      }),
    ],
    watchProps: config.watchProps,
    syncAttrs: config.syncAttrs,
  })
}
