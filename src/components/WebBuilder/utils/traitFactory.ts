/**
 * WebBuilder Trait 工厂函数
 *
 * 为 GrapesJS 组件 registry 提供统一的 trait 定义构建器，
 * 消除各 registry 文件中大量重复的 trait 字面量。
 *
 * 使用方式：
 *   import { makeNumberTrait, makeLinkTargetTrait } from '../../utils/traitFactory'
 *   traits: [makeNumberTrait('高度', 'spacerHeight', { min: 0, max: 1000 })]
 */

// ─────────────────────────────────────────────
// 公共类型
// ─────────────────────────────────────────────

export interface SelectOption {
  value: string
  label: string
}

export interface TraitDef {
  type: string
  label: string
  name: string
  changeProp: true
  [key: string]: unknown
}

// ─────────────────────────────────────────────
// 文本输入
// ─────────────────────────────────────────────

/**
 * 创建文本输入 trait
 * @example makeTextTrait('按钮文字', 'buttonText', { placeholder: '请输入' })
 */
export function makeTextTrait(
  label: string,
  name: string,
  options?: { placeholder?: string },
): TraitDef {
  return {
    type: 'text',
    label,
    name,
    changeProp: true,
    ...(options?.placeholder ? { placeholder: options.placeholder } : {}),
  }
}

export function makeTextareaTrait(
  label: string,
  name: string,
  options?: { placeholder?: string; rows?: number },
): TraitDef {
  return {
    type: 'textarea',
    label,
    name,
    changeProp: true,
    ...(options?.placeholder ? { placeholder: options.placeholder } : {}),
    ...(options?.rows !== undefined ? { rows: options.rows } : {}),
  }
}

/**
 * 创建 URL 链接输入 trait（text 类型，placeholder 为 https://）
 * @example makeLinkTrait({ name: 'imageLink', label: '链接地址' })
 */
export function makeLinkTrait(options?: {
  label?: string
  name?: string
  placeholder?: string
}): TraitDef {
  return {
    type: 'page-link',
    label: options?.label ?? '链接地址',
    name: options?.name ?? 'linkUrl',
    changeProp: true,
    placeholder: options?.placeholder ?? 'https://',
  }
}

// ─────────────────────────────────────────────
// 数字输入
// ─────────────────────────────────────────────

/**
 * 创建数字输入 trait（支持 min / max / step）
 * @example makeNumberTrait('高度', 'spacerHeight', { min: 0, max: 1000 })
 */
export function makeNumberTrait(
  label: string,
  name: string,
  options?: { min?: number; max?: number; step?: number },
): TraitDef {
  return {
    type: 'number',
    label,
    name,
    changeProp: true,
    ...(options?.min !== undefined ? { min: options.min } : {}),
    ...(options?.max !== undefined ? { max: options.max } : {}),
    ...(options?.step !== undefined ? { step: options.step } : {}),
  }
}

// ─────────────────────────────────────────────
// 下拉选择
// ─────────────────────────────────────────────

/**
 * 创建下拉选择 trait
 * @example makeSelectTrait('单位', 'spacerHeightUnit', [{ value: 'px', label: 'px' }])
 */
export function makeSelectTrait(
  label: string,
  name: string,
  selectOptions: readonly SelectOption[],
): TraitDef {
  return {
    type: 'select',
    label,
    name,
    changeProp: true,
    options: selectOptions,
  }
}

/**
 * 创建链接打开方式 trait（_self / _blank）
 * @example makeLinkTargetTrait({ name: 'imageLinkTarget', label: '链接打开方式' })
 */
export function makeLinkTargetTrait(options?: { label?: string; name?: string }): TraitDef {
  return makeSelectTrait(options?.label ?? '打开方式', options?.name ?? 'linkTarget', [
    { value: '_self', label: '当前页' },
    { value: '_blank', label: '新窗口' },
  ])
}

/** 常用单位选项（px / vh / rem） */
export const UNIT_OPTIONS_PX_VH_REM: SelectOption[] = [
  { value: 'px', label: 'px' },
  { value: 'vh', label: 'vh' },
  { value: 'rem', label: 'rem' },
]

/** 常用单位选项（px / % / vh） */
export const UNIT_OPTIONS_PX_PCT_VH: SelectOption[] = [
  { value: 'px', label: 'px' },
  { value: '%', label: '%' },
  { value: 'vh', label: 'vh' },
]

// ─────────────────────────────────────────────
// 复选框（开关）
// ─────────────────────────────────────────────

/**
 * 创建复选框 trait
 * @example makeCheckboxTrait('自动播放', 'autoplay')
 */
export function makeCheckboxTrait(label: string, name: string): TraitDef {
  return {
    type: 'checkbox',
    label,
    name,
    changeProp: true,
  }
}

// ─────────────────────────────────────────────
// 自定义类型
// ─────────────────────────────────────────────

/**
 * 创建颜色选择器 trait（需配合 registerColorPickerTrait 使用）
 * @example makeColorPickerTrait('线条颜色', 'dividerColor')
 */
export function makeColorPickerTrait(label: string, name: string): TraitDef {
  return {
    type: 'color-picker',
    label,
    name,
    changeProp: true,
  }
}

/**
 * 创建图片选择器 trait（需配合 registerImagePickerTrait 使用）
 * @example makeImagePickerTrait('图片', 'imageSrc', { showPreview: true })
 */
export function makeImagePickerTrait(
  label: string,
  name: string,
  options?: { showPreview?: boolean },
): TraitDef {
  return {
    type: 'image-picker',
    label,
    name,
    changeProp: true,
    ui: { showPreview: options?.showPreview ?? true },
  }
}

/**
 * 创建 SVG 图标选择器 trait（需配合 registerSvgIconPickerTrait 使用）
 * @example makeSvgIconPickerTrait('图标', 'iconSvg', { sourceName: 'iconSource' })
 */
export function makeSvgIconPickerTrait(
  label: string,
  name: string,
  options?: { sourceName?: string },
): TraitDef {
  return {
    type: 'svg-icon-picker',
    label,
    name,
    changeProp: true,
    ui: { sourceName: options?.sourceName ?? 'iconSource' },
  }
}
