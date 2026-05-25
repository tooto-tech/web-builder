import type { LanguageVO } from '@/api/system/language'

type ProjectNode = Record<string, any>

interface PreviewLanguage {
  id: number | string
  name: string
  code: string
  slug: string
  sortOrder: number
  defaultLang: number
}

export interface LanguageSwitcherPreviewOptions {
  currentLocale?: string | null
  languages?: LanguageVO[]
  loadLanguages?: () => Promise<LanguageVO[]>
}

export interface LanguageSwitcherPreviewResult {
  changed: boolean
  languageCount: number
}

const SWITCHER_COMPONENT = 'language-switcher'
const CLASS_CURRENT = 'wb-language-switcher__current'
const CLASS_MENU = 'wb-language-switcher__menu'
const CLASS_OPTION = 'wb-language-switcher__option'
const CLASS_OPTION_LABEL = 'wb-language-switcher__option-label'
const CLASS_ACTIVE = 'is-active'
const CLASS_SINGLE = 'is-single'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const textNode = (content: string) => ({ type: 'textnode', content })

const normalizeLocale = (value: unknown): string =>
  `${value ?? ''}`.trim().replace(/-/g, '_').toLowerCase()

const normalizeLanguage = (language: LanguageVO): PreviewLanguage | null => {
  const slug = `${language.slug || ''}`.trim()
  const code = `${language.code || ''}`.trim()
  if (!slug) return null
  return {
    id: language.id,
    name: `${language.name || code || slug}`.trim(),
    code,
    slug,
    sortOrder: Number(language.sortOrder || 0),
    defaultLang: Number(language.defaultLang || 0)
  }
}

const normalizeLanguages = (languages: LanguageVO[] = []): PreviewLanguage[] =>
  languages
    .map(normalizeLanguage)
    .filter(Boolean)
    .sort((left, right) => {
      const sort = (left!.sortOrder || 0) - (right!.sortOrder || 0)
      if (sort !== 0) return sort
      return Number(left!.id || 0) - Number(right!.id || 0)
    }) as PreviewLanguage[]

const getNodeAttrs = (node: ProjectNode | null | undefined): Record<string, any> =>
  node && typeof node.attributes === 'object' && node.attributes ? node.attributes : {}

const getClassList = (node: ProjectNode | null | undefined): string[] => {
  if (!node) return []
  const classes = Array.isArray(node.classes) ? node.classes : []
  const classNames = classes
    .map((item) => {
      if (typeof item === 'string') return item
      return `${item?.name ?? item?.id ?? ''}`.trim()
    })
    .filter(Boolean)
  const attrClass = `${getNodeAttrs(node).class ?? ''}`.trim().split(/\s+/).filter(Boolean)
  return Array.from(new Set([...classNames, ...attrClass]))
}

const setClassState = (node: ProjectNode, className: string, enabled: boolean) => {
  const next = new Set(getClassList(node))
  if (enabled) next.add(className)
  else next.delete(className)
  node.classes = Array.from(next)
  const attrs = getNodeAttrs(node)
  if (attrs.class != null) {
    attrs.class = Array.from(next).join(' ')
  }
}

const hasClass = (node: ProjectNode | null | undefined, className: string): boolean =>
  getClassList(node).includes(className)

const findChildByClass = (
  node: ProjectNode | null | undefined,
  className: string
): ProjectNode | null => {
  const children = Array.isArray(node?.components) ? node!.components : []
  return children.find((child) => hasClass(child, className)) || null
}

const findDescendantByClass = (
  node: ProjectNode | null | undefined,
  className: string
): ProjectNode | null => {
  if (!node) return null
  const children = Array.isArray(node.components) ? node.components : []
  for (const child of children) {
    if (hasClass(child, className)) return child
    const nested = findDescendantByClass(child, className)
    if (nested) return nested
  }
  return null
}

const isLanguageSwitcher = (node: ProjectNode | null | undefined): boolean =>
  `${getNodeAttrs(node)['data-wb-component'] ?? ''}`.trim() === SWITCHER_COMPONENT

const collectLanguageSwitchers = (node: ProjectNode | null | undefined, results: ProjectNode[]) => {
  if (!node || typeof node !== 'object') return
  if (isLanguageSwitcher(node)) results.push(node)
  const children = Array.isArray(node.components) ? node.components : []
  children.forEach((child) => collectLanguageSwitchers(child, results))
}

const collectProjectRoots = (projectData: ProjectNode | null | undefined): ProjectNode[] => {
  const roots: ProjectNode[] = []
  const pages = Array.isArray(projectData?.pages) ? projectData!.pages : []
  pages.forEach((page) => {
    const frames = Array.isArray(page?.frames) ? page.frames : []
    frames.forEach((frame: ProjectNode) => {
      if (frame?.component) roots.push(frame.component)
    })
  })
  if (projectData?.component) roots.push(projectData.component)
  return roots
}

const resolveCurrentLanguage = (
  languages: PreviewLanguage[],
  currentLocale?: string | null
): PreviewLanguage => {
  const normalizedCurrent = normalizeLocale(currentLocale)
  return (
    languages.find(
      (language) =>
        normalizeLocale(language.slug) === normalizedCurrent ||
        normalizeLocale(language.code) === normalizedCurrent ||
        normalizeLocale(language.id) === normalizedCurrent
    ) ||
    languages.find((language) => language.defaultLang === 1) ||
    languages[0]
  )
}

const getLabelMode = (switcher: ProjectNode): string => {
  const raw =
    `${getNodeAttrs(switcher)['data-wb-language-label-mode'] || switcher.languageLabelMode || 'name'}`
      .trim()
      .toLowerCase()
  return raw === 'code' || raw === 'slug' ? raw : 'name'
}

const getLanguageLabel = (language: PreviewLanguage, labelMode: string): string => {
  if (labelMode === 'code') return language.code || language.slug || language.name
  if (labelMode === 'slug') return language.slug || language.code || language.name
  return stripParentheticalLabel(language.name) || language.code || language.slug
}

const stripParentheticalLabel = (value: string): string =>
  `${value || ''}`
    .replace(/\s*[\(（][^\(\)（）]*[\)）]\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

const setNodeText = (node: ProjectNode | null | undefined, value: string) => {
  if (!node) return
  node.components = [textNode(value)]
  delete node.content
}

const buildFallbackMenu = (): ProjectNode => ({
  tagName: 'div',
  classes: [CLASS_MENU],
  attributes: {
    'data-wb-language-menu': 'true',
    role: 'menu'
  },
  components: []
})

const buildFallbackOptionTemplate = (): ProjectNode => ({
  tagName: 'a',
  classes: [CLASS_OPTION],
  attributes: {
    href: '#',
    role: 'menuitem',
    'data-wb-language-option': 'true'
  },
  components: [
    {
      tagName: 'span',
      classes: [CLASS_OPTION_LABEL],
      attributes: {
        'data-wb-language-option-label': 'true'
      },
      components: [textNode('English')]
    }
  ]
})

const findOptionTemplate = (menu: ProjectNode): ProjectNode => {
  const children = Array.isArray(menu.components) ? menu.components : []
  return children.find((child) => hasClass(child, CLASS_OPTION)) || buildFallbackOptionTemplate()
}

const buildPreviewHref = (language: PreviewLanguage): string => `/${language.slug}/`

const buildOption = (
  template: ProjectNode,
  language: PreviewLanguage,
  current: boolean,
  labelMode: string
): ProjectNode => {
  const option = clone(template)
  option.tagName = 'a'
  option.attributes = {
    ...getNodeAttrs(option),
    href: '#',
    role: 'menuitem',
    'data-wb-language-option': 'true',
    'data-language-id': `${language.id}`,
    'data-language-code': language.code,
    'data-language-slug': language.slug,
    'data-language-default': language.defaultLang === 1 ? 'true' : 'false',
    'data-wb-preview-href': buildPreviewHref(language)
  }
  delete option.attributes.id
  if (language.code) option.attributes.lang = language.code.replace(/_/g, '-')
  if (current) option.attributes['aria-current'] = 'page'
  else delete option.attributes['aria-current']
  setClassState(option, CLASS_OPTION, true)
  setClassState(option, CLASS_ACTIVE, current)

  const label = getLanguageLabel(language, labelMode)
  const labelNode = findDescendantByClass(option, CLASS_OPTION_LABEL)
  if (labelNode) setNodeText(labelNode, label)
  else setNodeText(option, label)
  return option
}

const injectSwitcherPreview = (
  switcher: ProjectNode,
  languages: PreviewLanguage[],
  currentLocale?: string | null
) => {
  const current = resolveCurrentLanguage(languages, currentLocale)
  const labelMode = getLabelMode(switcher)
  const attrs = getNodeAttrs(switcher)
  switcher.attributes = {
    ...attrs,
    'data-wb-component': SWITCHER_COMPONENT,
    'data-wb-i18n-skip': 'true',
    'data-wb-language-current-slug': current.slug,
    'data-wb-language-current-code': current.code,
    'data-wb-language-count': `${languages.length}`,
    translate: 'no'
  }
  setClassState(switcher, 'notranslate', true)
  setClassState(switcher, CLASS_SINGLE, languages.length <= 1)

  setNodeText(findDescendantByClass(switcher, CLASS_CURRENT), getLanguageLabel(current, labelMode))

  let menu = findChildByClass(switcher, CLASS_MENU)
  if (!menu) {
    menu = buildFallbackMenu()
    switcher.components = Array.isArray(switcher.components) ? switcher.components : []
    switcher.components.push(menu)
  }
  const template = findOptionTemplate(menu)
  menu.components = languages.map((language) =>
    buildOption(template, language, language.slug === current.slug, labelMode)
  )
}

export const applyLanguageSwitcherPreviewToProjectData = async (
  projectData: ProjectNode | null | undefined,
  options: LanguageSwitcherPreviewOptions = {}
): Promise<LanguageSwitcherPreviewResult> => {
  if (!projectData) return { changed: false, languageCount: 0 }

  const switchers: ProjectNode[] = []
  collectProjectRoots(projectData).forEach((root) => collectLanguageSwitchers(root, switchers))
  if (!switchers.length) return { changed: false, languageCount: 0 }

  let languages = normalizeLanguages(options.languages)
  if (!languages.length) {
    try {
      const loaded = options.loadLanguages
        ? await options.loadLanguages()
        : await import('@/api/system/language').then((api) => api.getEnabledLanguageList())
      languages = normalizeLanguages(loaded)
    } catch (error) {
      console.warn('[WebBuilder] Failed to load languages for switcher preview', error)
      return { changed: false, languageCount: 0 }
    }
  }

  if (!languages.length) return { changed: false, languageCount: 0 }
  switchers.forEach((switcher) => injectSwitcherPreview(switcher, languages, options.currentLocale))
  return { changed: true, languageCount: languages.length }
}
