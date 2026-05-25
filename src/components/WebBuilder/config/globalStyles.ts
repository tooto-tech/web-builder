/**
 * 全局样式配置定义
 * 用于在 GlobalSettingsPanel 中配置全局 CSS 样式
 */

export interface GlobalStyleConfig {
  id: string
  property: string
  selector: string
  label: string
  defaultValue: string
  field: 'color' | 'number' | 'text' | 'select' | 'selectFont'
  fieldOptions?: {
    min?: number
    max?: number
    step?: number
    units?: string[]
    options?: Array<{ id: string; label: string }>
  }
  category: {
    id: string
    label: string
    open?: boolean
  }
}

export const globalStylesConfig: GlobalStyleConfig[] = [
  // ========== CSS Variables (Theme Colors) ==========
  {
    id: 'varPrimary',
    property: '--bs-primary',
    field: 'color',
    selector: ':root',
    label: 'Primary Color',
    defaultValue: '#0d6efd',
    category: { id: 'vars', label: 'Theme Colors', open: true },
  },
  {
    id: 'varSecondary',
    property: '--bs-secondary',
    field: 'color',
    selector: ':root',
    label: 'Secondary Color',
    defaultValue: '#6c757d',
    category: { id: 'vars', label: 'Theme Colors' },
  },
  {
    id: 'varHeading',
    property: '--bs-heading-color',
    field: 'color',
    selector: ':root',
    label: 'Heading Color',
    defaultValue: '#212529',
    category: { id: 'vars', label: 'Theme Colors' },
  },
  {
    id: 'varText',
    property: '--bs-text-color',
    field: 'color',
    selector: ':root',
    label: 'Text Color',
    defaultValue: '#212529',
    category: { id: 'vars', label: 'Theme Colors' },
  },
  {
    id: 'varRadius',
    property: '--bs-border-radius',
    field: 'number',
    selector: ':root',
    label: 'Border Radius',
    defaultValue: '0.25rem',
    fieldOptions: { min: 0, max: 2, step: 0.05, units: ['rem'] },
    category: { id: 'vars', label: 'Theme Colors' },
  },
  {
    id: 'varFontBase',
    property: '--bs-font-sans-serif',
    field: 'selectFont',
    selector: ':root',
    label: 'Base Font',
    defaultValue: 'Inter, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
    category: { id: 'vars', label: 'Theme Colors' },
  },

  // ========== Body Styles ==========
  {
    id: 'bodyBg',
    property: 'background-color',
    field: 'color',
    selector: 'body',
    label: 'Background Color',
    defaultValue: '#ffffff',
    category: { id: 'body', label: 'Body Styles' },
  },
  {
    id: 'bodyColor',
    property: 'color',
    field: 'color',
    selector: 'body',
    label: 'Text Color',
    defaultValue: '#212529',
    category: { id: 'body', label: 'Body Styles' },
  },
  {
    id: 'bodyFont',
    property: 'font-family',
    field: 'selectFont',
    selector: 'body',
    label: 'Font Family',
    defaultValue: 'var(--bs-font-sans-serif)',
    category: { id: 'body', label: 'Body Styles' },
  },
  {
    id: 'bodyFontSize',
    property: 'font-size',
    field: 'number',
    selector: 'body',
    label: 'Font Size',
    defaultValue: '1rem',
    fieldOptions: { min: 0.5, max: 2, step: 0.05, units: ['rem'] },
    category: { id: 'body', label: 'Body Styles' },
  },
  {
    id: 'bodyLineHeight',
    property: 'line-height',
    field: 'number',
    selector: 'body',
    label: 'Line Height',
    defaultValue: '1.5',
    fieldOptions: { min: 1, max: 2.5, step: 0.05 },
    category: { id: 'body', label: 'Body Styles' },
  },

  // ========== Heading Styles ==========
  {
    id: 'h1Color',
    property: 'color',
    field: 'color',
    selector: 'h1',
    label: 'H1 Color',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h1Size',
    property: 'font-size',
    field: 'number',
    selector: 'h1',
    label: 'H1 Font Size',
    defaultValue: '2.5rem',
    fieldOptions: { min: 0.5, max: 6, step: 0.1, units: ['rem'] },
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h1Font',
    property: 'font-family',
    field: 'selectFont',
    selector: 'h1',
    label: 'H1 Font Family',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h2Color',
    property: 'color',
    field: 'color',
    selector: 'h2',
    label: 'H2 Color',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h2Size',
    property: 'font-size',
    field: 'number',
    selector: 'h2',
    label: 'H2 Font Size',
    defaultValue: '2rem',
    fieldOptions: { min: 0.5, max: 5, step: 0.1, units: ['rem'] },
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h2Font',
    property: 'font-family',
    field: 'selectFont',
    selector: 'h2',
    label: 'H2 Font Family',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h3Color',
    property: 'color',
    field: 'color',
    selector: 'h3',
    label: 'H3 Color',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h3Size',
    property: 'font-size',
    field: 'number',
    selector: 'h3',
    label: 'H3 Font Size',
    defaultValue: '1.75rem',
    fieldOptions: { min: 0.5, max: 4, step: 0.1, units: ['rem'] },
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h3Font',
    property: 'font-family',
    field: 'selectFont',
    selector: 'h3',
    label: 'H3 Font Family',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h4Color',
    property: 'color',
    field: 'color',
    selector: 'h4',
    label: 'H4 Color',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h4Size',
    property: 'font-size',
    field: 'number',
    selector: 'h4',
    label: 'H4 Font Size',
    defaultValue: '1.5rem',
    fieldOptions: { min: 0.5, max: 3, step: 0.1, units: ['rem'] },
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h4Font',
    property: 'font-family',
    field: 'selectFont',
    selector: 'h4',
    label: 'H4 Font Family',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h5Color',
    property: 'color',
    field: 'color',
    selector: 'h5',
    label: 'H5 Color',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h5Size',
    property: 'font-size',
    field: 'number',
    selector: 'h5',
    label: 'H5 Font Size',
    defaultValue: '1.25rem',
    fieldOptions: { min: 0.5, max: 2.5, step: 0.1, units: ['rem'] },
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h5Font',
    property: 'font-family',
    field: 'selectFont',
    selector: 'h5',
    label: 'H5 Font Family',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h6Color',
    property: 'color',
    field: 'color',
    selector: 'h6',
    label: 'H6 Color',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h6Size',
    property: 'font-size',
    field: 'number',
    selector: 'h6',
    label: 'H6 Font Size',
    defaultValue: '1rem',
    fieldOptions: { min: 0.5, max: 2, step: 0.1, units: ['rem'] },
    category: { id: 'headings', label: 'Headings' },
  },
  {
    id: 'h6Font',
    property: 'font-family',
    field: 'selectFont',
    selector: 'h6',
    label: 'H6 Font Family',
    defaultValue: 'inherit',
    category: { id: 'headings', label: 'Headings' },
  },

  // ========== Link Styles ==========
  {
    id: 'linkColor',
    property: 'color',
    field: 'color',
    selector: 'a',
    label: 'Link Color',
    defaultValue: 'var(--bs-primary)',
    category: { id: 'links', label: 'Link Styles' },
  },
  {
    id: 'linkDecoration',
    property: 'text-decoration',
    field: 'select',
    selector: 'a',
    label: 'Link Decoration',
    defaultValue: 'none',
    fieldOptions: {
      options: [
        { id: 'none', label: 'None' },
        { id: 'underline', label: 'Underline' },
        { id: 'line-through', label: 'Line-through' },
      ],
    },
    category: { id: 'links', label: 'Link Styles' },
  },
  {
    id: 'linkHoverColor',
    property: 'color',
    field: 'color',
    selector: 'a:hover',
    label: 'Link Hover Color',
    defaultValue: 'var(--bs-primary)',
    category: { id: 'links', label: 'Link Styles' },
  },

  // ========== Button Styles ==========
  {
    id: 'btnColor',
    property: 'background-color',
    field: 'color',
    selector: '.btn-primary',
    label: 'Primary Button Background',
    defaultValue: 'var(--bs-primary)',
    category: { id: 'buttons', label: 'Button Styles' },
  },
  {
    id: 'btnTextColor',
    property: 'color',
    field: 'color',
    selector: '.btn-primary',
    label: 'Primary Button Text Color',
    defaultValue: '#ffffff',
    category: { id: 'buttons', label: 'Button Styles' },
  },
  {
    id: 'btnRadius',
    property: 'border-radius',
    field: 'select',
    selector: '.btn',
    label: 'Button Border Radius',
    defaultValue: '0.5rem',
    fieldOptions: {
      options: [
        { id: '0', label: 'None' },
        { id: '0.25rem', label: 'Small' },
        { id: '0.5rem', label: 'Default' },
        { id: '1rem', label: 'Large' },
        { id: '999px', label: 'Full' },
      ],
    },
    category: { id: 'buttons', label: 'Button Styles' },
  },
  {
    id: 'btnPadding',
    property: 'padding',
    field: 'text',
    selector: '.btn',
    label: 'Button Padding',
    defaultValue: '0.5rem 1rem',
    category: { id: 'buttons', label: 'Button Styles' },
  },
  {
    id: 'btnBorder',
    property: 'border',
    field: 'text',
    selector: '.btn',
    label: 'Button Border',
    defaultValue: '1px solid transparent',
    category: { id: 'buttons', label: 'Button Styles' },
  },
]

/**
 * 按分类组织配置项
 */
export const getGroupedStyles = () => {
  const groups: Record<string, GlobalStyleConfig[]> = {}
  globalStylesConfig.forEach((config) => {
    const categoryId = config.category.id
    if (!groups[categoryId]) {
      groups[categoryId] = []
    }
    groups[categoryId].push(config)
  })
  return groups
}

/**
 * 获取分类信息
 */
export const getCategoryInfo = (categoryId: string) => {
  const config = globalStylesConfig.find((c) => c.category.id === categoryId)
  return config?.category || { id: categoryId, label: categoryId }
}
