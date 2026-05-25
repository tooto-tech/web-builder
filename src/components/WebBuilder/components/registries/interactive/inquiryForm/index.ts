import type { Editor } from 'grapesjs'
import { getFieldList, getInquiryType, type InquiryTypeFieldVO } from '@/api/content/inquiry'
import { getEffectiveTenantId } from '@/utils/auth'
import { removeUngroupedCssRulesByPrefixes } from '@/components/WebBuilder/utils/cssScope'

export const WB_INQUIRY_FORM_TYPE = 'wb-inquiry-form'

const CHILD_LOCK = {
  selectable: false,
  hoverable: false,
  draggable: false,
  droppable: false,
  layerable: false,
  highlightable: false,
  copyable: false,
  removable: false,
  badgable: false,
} as const

interface InquiryFieldSchema {
  code: string
  name: string
  fieldType: string
  required?: boolean
  maxLength?: number
  sort?: number
}

interface InquiryStyleProp {
  name: string
  cssVar: string
  defaultValue: string
}

const INQUIRY_STYLE_PROPS: InquiryStyleProp[] = [
  { name: 'formMaxWidth', cssVar: '--wb-inquiry-form-max-width', defaultValue: '610px' },
  { name: 'formPadding', cssVar: '--wb-inquiry-form-padding', defaultValue: '0' },
  { name: 'formRadius', cssVar: '--wb-inquiry-form-radius', defaultValue: '0' },
  { name: 'formBg', cssVar: '--wb-inquiry-form-bg', defaultValue: 'transparent' },
  { name: 'fieldGap', cssVar: '--wb-inquiry-field-gap', defaultValue: '26px' },
  { name: 'labelDisplay', cssVar: '--wb-inquiry-label-display', defaultValue: 'block' },
  { name: 'labelGap', cssVar: '--wb-inquiry-label-gap', defaultValue: '8px' },
  { name: 'labelColor', cssVar: '--wb-inquiry-label-color', defaultValue: '#12204d' },
  { name: 'labelFontSize', cssVar: '--wb-inquiry-label-font-size', defaultValue: '18px' },
  { name: 'inputHeight', cssVar: '--wb-inquiry-input-height', defaultValue: '56px' },
  { name: 'inputRadius', cssVar: '--wb-inquiry-input-radius', defaultValue: '12px' },
  { name: 'inputXPadding', cssVar: '--wb-inquiry-input-x-padding', defaultValue: '28px' },
  { name: 'inputFontSize', cssVar: '--wb-inquiry-input-font-size', defaultValue: '16px' },
  { name: 'inputBg', cssVar: '--wb-inquiry-input-bg', defaultValue: '#ffffff' },
  { name: 'inputColor', cssVar: '--wb-inquiry-input-color', defaultValue: '#12204d' },
  { name: 'inputBorderColor', cssVar: '--wb-inquiry-input-border-color', defaultValue: 'transparent' },
  { name: 'inputFocusBorderColor', cssVar: '--wb-inquiry-input-focus-border-color', defaultValue: 'rgba(28, 92, 206, 0.32)' },
  { name: 'placeholderColor', cssVar: '--wb-inquiry-placeholder-color', defaultValue: '#b7c1cd' },
  { name: 'textareaHeight', cssVar: '--wb-inquiry-textarea-height', defaultValue: '150px' },
  { name: 'textareaYPadding', cssVar: '--wb-inquiry-textarea-y-padding', defaultValue: '24px' },
  { name: 'buttonTopGap', cssVar: '--wb-inquiry-button-top-gap', defaultValue: '36px' },
  { name: 'buttonHeight', cssVar: '--wb-inquiry-button-height', defaultValue: '56px' },
  { name: 'buttonRadius', cssVar: '--wb-inquiry-button-radius', defaultValue: '12px' },
  { name: 'buttonXPadding', cssVar: '--wb-inquiry-button-x-padding', defaultValue: '24px' },
  { name: 'buttonFontSize', cssVar: '--wb-inquiry-button-font-size', defaultValue: '16px' },
  { name: 'buttonBg', cssVar: '--wb-inquiry-button-bg', defaultValue: '#165bcf' },
  { name: 'buttonHoverBg', cssVar: '--wb-inquiry-button-hover-bg', defaultValue: '#114eb8' },
  { name: 'buttonColor', cssVar: '--wb-inquiry-button-color', defaultValue: '#ffffff' },
  { name: 'tabletFieldGap', cssVar: '--wb-inquiry-tablet-field-gap', defaultValue: '22px' },
  { name: 'tabletLabelDisplay', cssVar: '--wb-inquiry-tablet-label-display', defaultValue: 'block' },
  { name: 'tabletLabelFontSize', cssVar: '--wb-inquiry-tablet-label-font-size', defaultValue: '17px' },
  { name: 'tabletInputHeight', cssVar: '--wb-inquiry-tablet-input-height', defaultValue: '52px' },
  { name: 'tabletInputRadius', cssVar: '--wb-inquiry-tablet-input-radius', defaultValue: '12px' },
  { name: 'tabletInputXPadding', cssVar: '--wb-inquiry-tablet-input-x-padding', defaultValue: '22px' },
  { name: 'tabletTextareaHeight', cssVar: '--wb-inquiry-tablet-textarea-height', defaultValue: '128px' },
  { name: 'tabletTextareaYPadding', cssVar: '--wb-inquiry-tablet-textarea-y-padding', defaultValue: '20px' },
  { name: 'tabletButtonTopGap', cssVar: '--wb-inquiry-tablet-button-top-gap', defaultValue: '28px' },
  { name: 'tabletButtonHeight', cssVar: '--wb-inquiry-tablet-button-height', defaultValue: '52px' },
  { name: 'tabletButtonRadius', cssVar: '--wb-inquiry-tablet-button-radius', defaultValue: '12px' },
  { name: 'mobileFieldGap', cssVar: '--wb-inquiry-mobile-field-gap', defaultValue: '20px' },
  { name: 'mobileLabelDisplay', cssVar: '--wb-inquiry-mobile-label-display', defaultValue: 'block' },
  { name: 'mobileLabelGap', cssVar: '--wb-inquiry-mobile-label-gap', defaultValue: '8px' },
  { name: 'mobileLabelFontSize', cssVar: '--wb-inquiry-mobile-label-font-size', defaultValue: '16px' },
  { name: 'mobileInputHeight', cssVar: '--wb-inquiry-mobile-input-height', defaultValue: '48px' },
  { name: 'mobileInputRadius', cssVar: '--wb-inquiry-mobile-input-radius', defaultValue: '8px' },
  { name: 'mobileInputXPadding', cssVar: '--wb-inquiry-mobile-input-x-padding', defaultValue: '18px' },
  { name: 'mobileInputFontSize', cssVar: '--wb-inquiry-mobile-input-font-size', defaultValue: '14px' },
  { name: 'mobileTextareaHeight', cssVar: '--wb-inquiry-mobile-textarea-height', defaultValue: '100px' },
  { name: 'mobileTextareaYPadding', cssVar: '--wb-inquiry-mobile-textarea-y-padding', defaultValue: '18px' },
  { name: 'mobileButtonHeight', cssVar: '--wb-inquiry-mobile-button-height', defaultValue: '48px' },
  { name: 'mobileButtonRadius', cssVar: '--wb-inquiry-mobile-button-radius', defaultValue: '8px' },
  { name: 'mobileButtonFontSize', cssVar: '--wb-inquiry-mobile-button-font-size', defaultValue: '16px' },
]

const INQUIRY_STYLE_DEFAULT_VALUES = INQUIRY_STYLE_PROPS.reduce((defaults, prop) => {
  defaults[prop.name] = prop.defaultValue
  return defaults
}, {} as Record<string, string>)

const INQUIRY_EDITABLE_STYLE_PROPS = INQUIRY_STYLE_PROPS.filter((prop) => {
  return !prop.name.startsWith('tablet') && !prop.name.startsWith('mobile')
})

const NON_LENGTH_INQUIRY_STYLE_PROPS = new Set([
  'formBg',
  'labelDisplay',
  'labelColor',
  'inputBg',
  'inputColor',
  'inputBorderColor',
  'inputFocusBorderColor',
  'placeholderColor',
  'buttonBg',
  'buttonHoverBg',
  'buttonColor',
  'tabletLabelDisplay',
  'mobileLabelDisplay',
])

function normalizeInquiryStyleValue(propName: string, rawValue: any, fallback: string): string {
  const normalized = sanitizeText(rawValue, fallback)
  if (!normalized) return fallback
  if (NON_LENGTH_INQUIRY_STYLE_PROPS.has(propName)) return normalized

  // Let plain numeric trait inputs behave like CSS length values.
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return normalized === '0' ? '0' : `${normalized}px`
  }

  return normalized
}

function buildInquiryStyleVars(
  model: any,
  props: InquiryStyleProp[] = INQUIRY_EDITABLE_STYLE_PROPS,
): Record<string, string> {
  return props.reduce((styleVars, prop) => {
    styleVars[prop.cssVar] = normalizeInquiryStyleValue(
      prop.name,
      model.get?.(prop.name),
      prop.defaultValue,
    )
    return styleVars
  }, {} as Record<string, string>)
}

function makeLengthTrait(label: string, name: string, placeholder: string) {
  return {
    type: 'text',
    label,
    name,
    changeProp: true,
    placeholder,
  }
}

function makeColorTrait(label: string, name: string) {
  return {
    type: 'color-picker',
    label,
    name,
    changeProp: true,
  }
}

function makeDisplayTrait(label: string, name: string) {
  return {
    type: 'select',
    label,
    name,
    changeProp: true,
    options: [
      { id: 'block', label: '显示' },
      { id: 'none', label: '隐藏' },
    ],
  }
}

function makeInquiryStyleTraits() {
  return [
    makeLengthTrait('最大宽度', 'formMaxWidth', '610px / 100%'),
    makeLengthTrait('表单内边距', 'formPadding', '0 / 24px'),
    makeLengthTrait('表单圆角', 'formRadius', '0 / 12px'),
    makeColorTrait('表单背景色', 'formBg'),
    makeLengthTrait('字段间距', 'fieldGap', '26px'),
    makeDisplayTrait('显示 Label', 'labelDisplay'),
    makeLengthTrait('Label 间距', 'labelGap', '8px'),
    makeColorTrait('Label 颜色', 'labelColor'),
    makeLengthTrait('Label 字号', 'labelFontSize', '18px'),
    makeLengthTrait('输入框高度', 'inputHeight', '56px'),
    makeLengthTrait('输入框圆角', 'inputRadius', '12px'),
    makeLengthTrait('输入框横向内边距', 'inputXPadding', '28px'),
    makeLengthTrait('输入框字号', 'inputFontSize', '16px'),
    makeColorTrait('输入框背景色', 'inputBg'),
    makeColorTrait('输入框文字色', 'inputColor'),
    makeColorTrait('输入框边框色', 'inputBorderColor'),
    makeColorTrait('输入框聚焦边框色', 'inputFocusBorderColor'),
    makeColorTrait('占位文字颜色', 'placeholderColor'),
    makeLengthTrait('多行文本高度', 'textareaHeight', '150px'),
    makeLengthTrait('多行文本上下内边距', 'textareaYPadding', '24px'),
    makeLengthTrait('按钮上间距', 'buttonTopGap', '36px'),
    makeLengthTrait('按钮高度', 'buttonHeight', '56px'),
    makeLengthTrait('按钮圆角', 'buttonRadius', '12px'),
    makeLengthTrait('按钮横向内边距', 'buttonXPadding', '24px'),
    makeLengthTrait('按钮字号', 'buttonFontSize', '16px'),
    makeColorTrait('按钮背景色', 'buttonBg'),
    makeColorTrait('按钮悬停背景色', 'buttonHoverBg'),
    makeColorTrait('按钮文字色', 'buttonColor'),
  ]
}

const INQUIRY_FORM_CSS = `
  .wb-inquiry {
            width: 100%;
            max-width: var(--wb-inquiry-form-max-width, 620px);
            box-sizing: border-box;
            border: none;
            border-radius: var(--wb-inquiry-form-radius, 0);
            box-shadow: none;
            background-color: var(--wb-inquiry-form-bg, transparent);
            padding: var(--wb-inquiry-form-padding, 0);
        }
        .wb-inquiry .wb-inquiry__head {
          margin-bottom: 40px;
          display: none;
        }
        .wb-inquiry .wb-inquiry__eyebrow {
            display: none;
        }
        .wb-inquiry .wb-inquiry__title {
            font-size: 56px;
            line-height: 1.14;
            font-weight: 600;
        }
        .wb-inquiry .wb-inquiry__field {
            margin-bottom: var(--wb-inquiry-field-gap, 26px);
        }
        .wb-inquiry .wb-inquiry__label {
            display: var(--wb-inquiry-label-display, block);
            margin-bottom: var(--wb-inquiry-label-gap, 8px);
            color: var(--wb-inquiry-label-color, #12204d);
            font-size: var(--wb-inquiry-label-font-size, 18px);
            line-height: 1.25;
            letter-spacing: 0;
        }
        .wb-inquiry .wb-inquiry__input {
            width: 100%;
            font-size: var(--wb-inquiry-input-font-size, 16px);
            box-sizing: border-box;
            appearance: none;
            -webkit-appearance: none;
            border: var(--wb-inquiry-input-border-width, 1px) solid var(--wb-inquiry-input-border-color, transparent);
            border-radius: var(--wb-inquiry-input-radius, 12px);
            background-color: var(--wb-inquiry-input-bg, #ffffff);
            color: var(--wb-inquiry-input-color, #12204d);
            padding: 0 var(--wb-inquiry-input-x-padding, 28px);
            min-height: var(--wb-inquiry-input-height, 56px);
            line-height: 1.4;
            box-shadow: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .wb-inquiry .wb-inquiry__textarea {
            width: 100%;
            font-size: var(--wb-inquiry-input-font-size, 16px);
            box-sizing: border-box;
            appearance: none;
            -webkit-appearance: none;
            border: var(--wb-inquiry-input-border-width, 1px) solid var(--wb-inquiry-input-border-color, transparent);
            border-radius: var(--wb-inquiry-input-radius, 12px);
            background-color: var(--wb-inquiry-input-bg, #ffffff);
            color: var(--wb-inquiry-input-color, #12204d);
            padding-left: var(--wb-inquiry-input-x-padding, 28px);
            padding-right: var(--wb-inquiry-input-x-padding, 28px);
            min-height: var(--wb-inquiry-input-height, 56px);
            line-height: 1.4;
            box-shadow: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
            min-height: var(--wb-inquiry-textarea-height, 150px);
            padding-top: var(--wb-inquiry-textarea-y-padding, 24px);
            padding-bottom: var(--wb-inquiry-textarea-y-padding, 24px);
            resize: none;
        }
        .wb-inquiry .wb-inquiry__input::placeholder {
            color: var(--wb-inquiry-placeholder-color, #b7c1cd);
            opacity: 1;
        }
        .wb-inquiry .wb-inquiry__textarea::placeholder {
            color: var(--wb-inquiry-placeholder-color, #b7c1cd);
            opacity: 1;
        }
        .wb-inquiry .wb-inquiry__input:focus {
            outline: none;
            border-color: var(--wb-inquiry-input-focus-border-color, rgba(28, 92, 206, 0.32));
            box-shadow: 0 0 0 var(--wb-inquiry-input-focus-ring-size, 4px) var(--wb-inquiry-input-focus-ring-color, rgba(28, 92, 206, 0.08));
        }
        .wb-inquiry .wb-inquiry__textarea:focus {
            outline: none;
            border-color: var(--wb-inquiry-input-focus-border-color, rgba(28, 92, 206, 0.32));
            box-shadow: 0 0 0 var(--wb-inquiry-input-focus-ring-size, 4px) var(--wb-inquiry-input-focus-ring-color, rgba(28, 92, 206, 0.08));
        }
        .wb-inquiry .wb-inquiry__field-hint {
            margin-top: 10px;
            color: #7a8699;
            font-size: 12px;
            line-height: 1.5;
        }
        .wb-inquiry .wb-inquiry__actions {
            margin-top: var(--wb-inquiry-button-top-gap, 36px);
        }
        .wb-inquiry .wb-inquiry__submit {
            width: 100%;
            border: 0;
            appearance: none;
            -webkit-appearance: none;
            border-radius: var(--wb-inquiry-button-radius, 12px);
            background-color: var(--wb-inquiry-button-bg, #165bcf) !important;
            color: var(--wb-inquiry-button-color, #ffffff) !important;
            min-height: var(--wb-inquiry-button-height, 56px);
            padding: 0 var(--wb-inquiry-button-x-padding, 24px);
            line-height: 1;
            font-size: var(--wb-inquiry-button-font-size, 16px);
            font-weight: 500;
            cursor: pointer;
            letter-spacing: 0;
            transition: background-color 0.18s ease, transform 0.18s ease;
            box-shadow: none;
        }
        .wb-inquiry .wb-inquiry__submit:hover {
            transform: translateY(-1px);
            background-color: var(--wb-inquiry-button-hover-bg, var(--wb-inquiry-button-bg, #114eb8)) !important;
        }
        .wb-inquiry .wb-inquiry__submit[disabled] {
            cursor: wait;
            opacity: 0.82;
        }
        .wb-inquiry .wb-inquiry__captcha-wrap {
            display: none;
            margin-top: 16px;
            padding: 14px;
            border-radius: 16px;
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            display: none;
        }
        .wb-inquiry .wb-inquiry__status {
            margin-top: 16px;
            font-size: 14px;
            line-height: 1.5;
        }
        .wb-inquiry .wb-inquiry__status[data-status="success"] {
            color: #067647;
        }
        .wb-inquiry .wb-inquiry__status[data-status="warning"] {
            color: #b54708;
        }
        .wb-inquiry .wb-inquiry__status[data-status="error"] {
            color: #b42318;
        }
        .wb-inquiry .wb-inquiry__empty {
            padding: 24px;
            border-radius: 18px;
            border: 1px dashed #cbd5e1;
            background-color: #f8fafc;
            text-align: center;
        }
        .wb-inquiry .wb-inquiry__empty-title {
            color: #101828;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .wb-inquiry .wb-inquiry__empty-text {
            color: #667085;
            font-size: 13px;
            line-height: 1.6;
        }
        @media (max-width: 1023px) {
            .wb-inquiry .wb-inquiry__title{
                font-size: 40px;
            }
            .wb-inquiry .wb-inquiry__field {
                margin-bottom: var(--wb-inquiry-tablet-field-gap, var(--wb-inquiry-field-gap, 22px));
            }
            .wb-inquiry .wb-inquiry__label {
                display: var(--wb-inquiry-tablet-label-display, var(--wb-inquiry-label-display, block));
                font-size: var(--wb-inquiry-tablet-label-font-size, var(--wb-inquiry-label-font-size, 17px));
            }
            .wb-inquiry .wb-inquiry__input {
                min-height: var(--wb-inquiry-tablet-input-height, var(--wb-inquiry-input-height, 52px));
                padding-left: var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 22px));
                padding-right: var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 22px));
                border-radius: var(--wb-inquiry-tablet-input-radius, var(--wb-inquiry-input-radius, 12px));
            }
            .wb-inquiry .wb-inquiry__textarea {
                min-height: var(--wb-inquiry-tablet-input-height, var(--wb-inquiry-input-height, 52px));
                padding-left: var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 22px));
                padding-right: var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 22px));
                border-radius: var(--wb-inquiry-tablet-input-radius, var(--wb-inquiry-input-radius, 12px));
            }
            .wb-inquiry .wb-inquiry__textarea {
                min-height: var(--wb-inquiry-tablet-textarea-height, var(--wb-inquiry-textarea-height, 128px));
                padding-top: var(--wb-inquiry-tablet-textarea-y-padding, var(--wb-inquiry-textarea-y-padding, 20px));
                padding-bottom: var(--wb-inquiry-tablet-textarea-y-padding, var(--wb-inquiry-textarea-y-padding, 20px));
            }
            .wb-inquiry .wb-inquiry__actions {
                margin-top: var(--wb-inquiry-tablet-button-top-gap, var(--wb-inquiry-button-top-gap, 28px));
            }
            .wb-inquiry .wb-inquiry__submit {
                min-height: var(--wb-inquiry-tablet-button-height, var(--wb-inquiry-button-height, 52px));
                border-radius: var(--wb-inquiry-tablet-button-radius, var(--wb-inquiry-button-radius, 12px));
            }
        }
        @media (max-width: 767px) {
            .wb-inquiry {

            }
            .wb-inquiry .wb-inquiry__head {
              margin-bottom: 0;
            }
            .wb-inquiry .wb-inquiry__title{
                font-size: 28px;
            }
            .wb-inquiry .wb-inquiry__field {
                margin-bottom: var(--wb-inquiry-mobile-field-gap, var(--wb-inquiry-tablet-field-gap, var(--wb-inquiry-field-gap, 20px)));
            }
            .wb-inquiry .wb-inquiry__label {
                display: var(--wb-inquiry-mobile-label-display, var(--wb-inquiry-tablet-label-display, var(--wb-inquiry-label-display, block)));
                margin-bottom: var(--wb-inquiry-mobile-label-gap, var(--wb-inquiry-label-gap, 8px));
                font-size: var(--wb-inquiry-mobile-label-font-size, var(--wb-inquiry-tablet-label-font-size, var(--wb-inquiry-label-font-size, 16px)));
            }
            .wb-inquiry .wb-inquiry__input {
                min-height: var(--wb-inquiry-mobile-input-height, var(--wb-inquiry-tablet-input-height, var(--wb-inquiry-input-height, 48px)));
                padding-left: var(--wb-inquiry-mobile-input-x-padding, var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 18px)));
                padding-right: var(--wb-inquiry-mobile-input-x-padding, var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 18px)));
                font-size: var(--wb-inquiry-mobile-input-font-size, var(--wb-inquiry-input-font-size, 14px));
                border-radius: var(--wb-inquiry-mobile-input-radius, var(--wb-inquiry-tablet-input-radius, var(--wb-inquiry-input-radius, 8px)));
            }
            .wb-inquiry .wb-inquiry__textarea {
                min-height: var(--wb-inquiry-mobile-input-height, var(--wb-inquiry-tablet-input-height, var(--wb-inquiry-input-height, 48px)));
                padding-left: var(--wb-inquiry-mobile-input-x-padding, var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 18px)));
                padding-right: var(--wb-inquiry-mobile-input-x-padding, var(--wb-inquiry-tablet-input-x-padding, var(--wb-inquiry-input-x-padding, 18px)));
                font-size: var(--wb-inquiry-mobile-input-font-size, var(--wb-inquiry-input-font-size, 14px));
                border-radius: var(--wb-inquiry-mobile-input-radius, var(--wb-inquiry-tablet-input-radius, var(--wb-inquiry-input-radius, 8px)));
            }
            .wb-inquiry .wb-inquiry__textarea {
                min-height: var(--wb-inquiry-mobile-textarea-height, var(--wb-inquiry-tablet-textarea-height, var(--wb-inquiry-textarea-height, 100px)));
                padding-top: var(--wb-inquiry-mobile-textarea-y-padding, var(--wb-inquiry-tablet-textarea-y-padding, var(--wb-inquiry-textarea-y-padding, 18px)));
                padding-bottom: var(--wb-inquiry-mobile-textarea-y-padding, var(--wb-inquiry-tablet-textarea-y-padding, var(--wb-inquiry-textarea-y-padding, 18px)));
            }
            .wb-inquiry .wb-inquiry__submit {
                min-height: var(--wb-inquiry-mobile-button-height, var(--wb-inquiry-tablet-button-height, var(--wb-inquiry-button-height, 48px)));
                border-radius: var(--wb-inquiry-mobile-button-radius, var(--wb-inquiry-tablet-button-radius, var(--wb-inquiry-button-radius, 8px)));
                font-size: var(--wb-inquiry-mobile-button-font-size, var(--wb-inquiry-button-font-size, 16px));
            }
        }
`

function sanitizeText(value: any, fallback = ''): string {
  return `${value ?? fallback}`.trim()
}

function normalizeMediaQuery(value: string): string {
  const raw = `${value ?? ''}`.trim()
  if (!raw) return ''
  if (raw.startsWith('(') || raw.startsWith('not ') || raw.startsWith('only ')) return raw
  if (raw.includes(':')) return raw
  return `(max-width: ${raw})`
}

function getCurrentDeviceRuleOptions(editor: any):
  { atRuleType: 'media'; atRuleParams: string } | undefined {
  const selectedDevice = editor?.Devices?.getSelected?.()
  if (!selectedDevice || typeof selectedDevice.get !== 'function') return undefined

  const deviceId = `${selectedDevice.get('id') ?? ''}`.trim().toLowerCase()
  if (!deviceId || deviceId === 'desktop') return undefined

  const widthMedia =
    selectedDevice.getWidthMedia?.()
    ?? selectedDevice.get?.('widthMedia')
    ?? selectedDevice.get?.('width')
    ?? ''

  const atRuleParams = normalizeMediaQuery(widthMedia)
  if (!atRuleParams) return undefined

  return {
    atRuleType: 'media',
    atRuleParams,
  }
}

function ensureInquirySelector(model: any): string {
  const attrs = { ...(model.getAttributes?.() ?? {}) }
  let id = sanitizeText(attrs.id)

  if (!id) {
    id = `wb-inquiry-${model.cid || Date.now()}`
    model.addAttributes?.({ id })
  }

  return `#${id}`
}

function cleanupInquiryInstanceCssRules(editor: any, selector: string): void {
  const cssComposer = editor?.Css
  if (!cssComposer?.getRules || !cssComposer?.remove || !selector) return

  const rules = cssComposer.getRules() as any[]
  const toRemove = rules.filter((rule: any) => {
    const ruleSelector = `${rule?.selectorsToString?.() ?? ''}`.trim()
    return ruleSelector === selector
  })

  if (toRemove.length) {
    cssComposer.remove(toRemove)
  }
}

function hasInquiryFormInstances(editor: any): boolean {
  const wrapper = editor?.getWrapper?.()
  if (!wrapper) return false

  const stack = [wrapper]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    const attrs = current.getAttributes?.() ?? {}
    if (`${attrs['data-wb-component'] ?? ''}`.trim() === 'inquiry-form') {
      return true
    }

    const children = current.components?.().models ?? []
    children.forEach((child: any) => stack.push(child))
  }

  return false
}

function cleanupUnusedInquiryBaseCss(editor: any): void {
  if (hasInquiryFormInstances(editor)) return
  removeUngroupedCssRulesByPrefixes(editor?.Css, ['.wb-inquiry'])
}

function readInquiryRuleStyle(editor: any, selector: string, ruleOptions?: { atRuleType: 'media'; atRuleParams: string }) {
  return editor?.Css?.getRule?.(selector, ruleOptions)?.getStyle?.() ?? {}
}

function syncInquiryTraitValuesFromRules(editor: any, model: any): void {
  const selector = ensureInquirySelector(model)
  const baseStyles = readInquiryRuleStyle(editor, selector)
  const deviceRuleOptions = getCurrentDeviceRuleOptions(editor)
  const deviceStyles = deviceRuleOptions
    ? readInquiryRuleStyle(editor, selector, deviceRuleOptions)
    : {}

  const mergedStyles = {
    ...buildInquiryStyleVars({ get: (name: string) => INQUIRY_STYLE_DEFAULT_VALUES[name] }),
    ...baseStyles,
    ...deviceStyles,
  } as Record<string, string>

  const nextValues = INQUIRY_EDITABLE_STYLE_PROPS.reduce((acc, prop) => {
    acc[prop.name] = sanitizeText(mergedStyles[prop.cssVar], prop.defaultValue) || prop.defaultValue
    return acc
  }, {} as Record<string, string>)

  model.__wbInquirySyncingStyleTraits = true
  model.set(nextValues)
  model.__wbInquirySyncingStyleTraits = false
}

function applyInquiryStyleVarsToCurrentDevice(editor: any, model: any): void {
  const selector = ensureInquirySelector(model)
  const ruleOptions = getCurrentDeviceRuleOptions(editor)
  const currentRule = editor?.Css?.getRule?.(selector, ruleOptions)
  const nextStyles = {
    ...(currentRule?.getStyle?.() ?? {}),
    'max-width': 'var(--wb-inquiry-form-max-width, 610px)',
    ...buildInquiryStyleVars(model, INQUIRY_EDITABLE_STYLE_PROPS),
  }

  if (currentRule) {
    currentRule.setStyle?.(nextStyles)
    return
  }

  editor?.Css?.setRule?.(selector, nextStyles, ruleOptions)
}

function normalizeFields(fields: InquiryTypeFieldVO[] = []): InquiryFieldSchema[] {
  return [...fields]
    .map(field => ({
      code: sanitizeText(field.code),
      name: sanitizeText(field.name, 'Untitled Field'),
      fieldType: sanitizeText(field.fieldType, 'text').toLowerCase(),
      required: Boolean(field.required),
      maxLength: field.maxLength ?? undefined,
      sort: Number(field.sort ?? 0),
    }))
    .filter(field => field.code)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

function parseFields(raw: any): InquiryFieldSchema[] {
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? normalizeFields(parsed) : []
  } catch {
    return []
  }
}

function makeInputAttrs(field: InquiryFieldSchema, type: string, placeholder: string) {
  const attrs: Record<string, string> = {
    class: type === 'textarea' ? 'wb-inquiry__textarea' : 'wb-inquiry__input',
    name: field.code,
    placeholder,
  }

  if (type !== 'textarea') {
    attrs.type = type
  }
  if (field.required) {
    attrs.required = 'required'
  }
  if (field.maxLength && field.maxLength > 0) {
    attrs.maxlength = String(field.maxLength)
  }
  if (field.fieldType === 'positive_int') {
    attrs.min = '0'
    attrs.step = '1'
  }
  if (field.fieldType === 'integer') {
    attrs.step = '1'
  }
  if (field.fieldType === 'decimal') {
    attrs.step = '0.01'
  }

  return attrs
}

function createFieldControl(field: InquiryFieldSchema) {
  const placeholder = (field.fieldType === 'date' ? 'Please select ' : 'Please enter ') + field.name

  if (field.fieldType === 'textarea') {
    return {
      tagName: 'textarea',
      ...CHILD_LOCK,
      attributes: makeInputAttrs(field, 'textarea', placeholder),
    }
  }

  let inputType = 'text'
  if (field.fieldType === 'email') inputType = 'email'
  if (field.fieldType === 'phone') inputType = 'tel'
  if (field.fieldType === 'date') inputType = 'date'
  if (field.fieldType === 'positive_int' || field.fieldType === 'integer' || field.fieldType === 'decimal') {
    inputType = 'number'
  }

  const control = {
    tagName: 'input',
    ...CHILD_LOCK,
    attributes: makeInputAttrs(field, inputType, placeholder),
  } as any

  if (field.fieldType === 'radio' || field.fieldType === 'checkbox' || field.fieldType === 'select') {
    control.attributes['data-field-kind'] = field.fieldType
    control.attributes.placeholder = `Please enter ${field.name} option value`
  }

  return control
}

function createFieldComponent(field: InquiryFieldSchema) {
  if (field.code === 'product_info') {
    return {
      tagName: 'input',
      ...CHILD_LOCK,
      attributes: {
        type: 'hidden',
        name: 'product_info',
        value: '',
        'data-wb-product-inquiry': 'true',
      },
    }
  }

  const requiredText = field.required ? ' *' : ''
  const helperText =
    field.fieldType === 'radio' || field.fieldType === 'checkbox' || field.fieldType === 'select'
      ? `This field is configured as ${field.fieldType}. Use option values from your inquiry settings.`
      : ''

  const components: any[] = [
    {
      tagName: 'label',
      ...CHILD_LOCK,
      attributes: { class: 'wb-inquiry__label' },
      content: `${field.name}${requiredText}`,
    },
    createFieldControl(field),
  ]

  if (helperText) {
    components.push({
      tagName: 'div',
      ...CHILD_LOCK,
      attributes: { class: 'wb-inquiry__field-hint' },
      content: helperText,
    })
  }

  return {
    tagName: 'div',
    ...CHILD_LOCK,
    attributes: { class: 'wb-inquiry__field' },
    components,
  }
}

function buildFormChildren(options: {
  inquiryTypeId?: string
  inquiryTypeCode?: string
  inquiryTypeName?: string
  fields?: InquiryFieldSchema[]
}) {
  const inquiryTypeId = sanitizeText(options.inquiryTypeId)
  const inquiryTypeCode = sanitizeText(options.inquiryTypeCode)
  const fields = options.fields ?? []

  if (!inquiryTypeId) {
    return [
      {
        tagName: 'div',
        ...CHILD_LOCK,
        attributes: { class: 'wb-inquiry__empty' },
        components: [
          {
            tagName: 'div',
            ...CHILD_LOCK,
            attributes: { class: 'wb-inquiry__empty-title' },
            content: 'Select an inquiry form type from the traits panel',
          },
          {
            tagName: 'div',
            ...CHILD_LOCK,
            attributes: { class: 'wb-inquiry__empty-text' },
            content: 'After binding a form type, fields and submit logic will be generated automatically.',
          },
        ],
      },
    ]
  }

  return [
    {
      tagName: 'input',
      ...CHILD_LOCK,
      attributes: {
        type: 'hidden',
        name: 'inquiryTypeId',
        value: inquiryTypeId,
      },
    },
    {
      tagName: 'input',
      ...CHILD_LOCK,
      attributes: {
        type: 'hidden',
        name: 'inquiryTypeCode',
        value: inquiryTypeCode,
      },
    },
    {
      tagName: 'input',
      ...CHILD_LOCK,
      attributes: {
        type: 'hidden',
        name: 'captchaVerification',
        value: '',
        class: 'wb-inquiry__captcha-value',
      },
    },
    ...fields.map(createFieldComponent),
    {
      tagName: 'div',
      ...CHILD_LOCK,
      attributes: { class: 'wb-inquiry__captcha-wrap', style: 'display:none;' },
      components: [
        {
          tagName: 'div',
          ...CHILD_LOCK,
          attributes: { class: 'wb-inquiry__captcha' },
        },
      ],
    },
    {
      tagName: 'div',
      ...CHILD_LOCK,
      attributes: { class: 'wb-inquiry__actions' },
      components: [
        {
          tagName: 'button',
          ...CHILD_LOCK,
          attributes: {
            class: 'wb-inquiry__submit',
            type: 'button',
          },
          content: 'Submit',
        },
      ],
    },
    {
      tagName: 'div',
      ...CHILD_LOCK,
      attributes: {
        class: 'wb-inquiry__status',
        'aria-live': 'polite',
      },
      content: '',
    },
  ]
}

function makeInquiryScript() {
  return function (this: HTMLElement) {
    const root = this as HTMLElement & {
      __wbInquiryInit?: boolean
      __wbInquiryCaptcha?: any
      __wbInquiryCaptchaValue?: string
      __wbInquiryNeedsCaptcha?: boolean
    }

    if (root.__wbInquiryInit) return
    root.__wbInquiryInit = true
    root.__wbInquiryCaptchaValue = ''
    root.__wbInquiryNeedsCaptcha = false

    const submitBtn = root.querySelector('.wb-inquiry__submit') as HTMLButtonElement | null
    const captchaContainer = root.querySelector('.wb-inquiry__captcha-wrap') as HTMLElement | null
    const captchaMount = root.querySelector('.wb-inquiry__captcha') as HTMLElement | null
    const captchaInput = root.querySelector('.wb-inquiry__captcha-value') as HTMLInputElement | null
    const statusEl = root.querySelector('.wb-inquiry__status') as HTMLElement | null

    if (!submitBtn) return

    function setStatus(message: string, status: string) {
      if (!statusEl) return
      statusEl.textContent = message || ''
      statusEl.setAttribute('data-status', status || '')
    }

    function translateInquiryMessage(message: any) {
      const text = `${message ?? ''}`.trim()
      if (!text) return ''

      const requiredFieldMatch = text.match(/^字段[【\[](.+?)[】\]]为必填项$/)
      if (requiredFieldMatch?.[1]) {
        return `Field "${requiredFieldMatch[1]}" is required.`
      }

      if (text === '该项为必填项') {
        return 'This field is required.'
      }

      return text
    }

    function getTenantId() {
      return (root.getAttribute('data-tenant-id') || '').trim()
    }

    function getSubmitUrl() {
      return (root.getAttribute('data-submit-url') || '/app-api/content/inquiry/submit').trim()
    }

    function getCaptchaBase() {
      return (root.getAttribute('data-captcha-base') || '/app-api').trim().replace(/\/$/, '')
    }

    function getTypeId() {
      return parseInt(root.getAttribute('data-inquiry-type-id') || '0', 10)
    }

    function getTypeCode() {
      return (root.getAttribute('data-inquiry-type-code') || '').trim()
    }

    function getFormContainer() {
      return root.tagName === 'FORM'
        ? root as HTMLFormElement
        : root.querySelector('form') as HTMLFormElement | null
    }

    function normalizeProductInquiryAttributeList(value: any) {
      if (!Array.isArray(value)) return []
      return value
        .map(function (item) {
          const name = `${item?.name ?? ''}`.trim()
          const attrValue = `${item?.value ?? ''}`.trim()
          if (!name || !attrValue) return null
          return { name: name, value: attrValue }
        })
        .filter(Boolean)
    }

    function readProductInquiryPayload() {
      try {
        const raw = new URLSearchParams(window.location.search).get('productInquiry')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const selectedAttributes = normalizeProductInquiryAttributeList(parsed?.selectedAttributes)
        if (!parsed?.productName && !selectedAttributes.length) return null

        return {
          productName: `${parsed?.productName ?? ''}`.trim(),
          productUrl: `${parsed?.productUrl ?? ''}`.trim(),
          selectedAttributes: selectedAttributes,
        }
      } catch (_) {
        return null
      }
    }

    function setHiddenField(name: string, value: string) {
      const form = getFormContainer()
      const parent = form || root
      let input = parent.querySelector(
        `input[type="hidden"][name="${name}"][data-wb-product-inquiry="true"]`,
      ) as HTMLInputElement | null

      if (!input) {
        input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.setAttribute('data-wb-product-inquiry', 'true')
        parent.appendChild(input)
      }

      input.value = value
    }

    function cleanupProductInquiryHiddenFields() {
      const form = getFormContainer()
      const parent = form || root
      parent.querySelectorAll('input[type="hidden"][data-wb-product-inquiry="true"]').forEach(function (input) {
        if ((input as HTMLInputElement).name !== 'product_info') {
          input.remove()
        }
      })
    }

    function buildProductInfoText(payload: any) {
      const lines: string[] = []
      if (payload.productName) lines.push('Product Name: ' + payload.productName)
      if (payload.productUrl) lines.push('URL: ' + payload.productUrl)

      const selectedAttributesText = payload.selectedAttributes
        .map(function (item: any) {
          return item.name + ': ' + item.value
        })
        .join('; ')

      if (selectedAttributesText) {
        lines.push('Selected Attributes: ' + selectedAttributesText)
      }

      return lines.join('\n')
    }

    function hydrateProductInquiryHiddenFields() {
      const payload = readProductInquiryPayload()
      if (!payload) return

      cleanupProductInquiryHiddenFields()
      setHiddenField('product_info', buildProductInfoText(payload))
    }

    function resetCaptcha() {
      root.__wbInquiryCaptchaValue = ''
      if (captchaInput) captchaInput.value = ''
    }

    function ensureCaptchaLib() {
      return new Promise(function (resolve, reject) {
        const win = window as any
        if (typeof win.initAjCaptcha === 'function') {
          resolve(win.initAjCaptcha)
          return
        }

        if (win.__ttInquiryCaptchaLoader) {
          win.__ttInquiryCaptchaLoader.then(resolve).catch(reject)
          return
        }

        const scripts = [
          '/widgets/inquiry-captcha/crypto-js.js',
          '/widgets/inquiry-captcha/inquiry-captcha.js',
        ]

        win.__ttInquiryCaptchaLoader = new Promise((innerResolve, innerReject) => {
          const loadScript = (index: number) => {
            if (index >= scripts.length) {
              if (typeof (window as any).initAjCaptcha === 'function') {
                innerResolve((window as any).initAjCaptcha)
                return
              }
              innerReject(new Error('Failed to load captcha script'))
              return
            }

            const script = document.createElement('script')
            script.src = scripts[index]
            script.setAttribute('data-wb-inquiry-captcha-script', '1')
            script.onload = function () {
              loadScript(index + 1)
            }
            script.onerror = function () {
              innerReject(new Error('Failed to load captcha script: ' + scripts[index]))
            }
            document.body.appendChild(script)
          }

          loadScript(0)
        })

        win.__ttInquiryCaptchaLoader.then(resolve).catch(reject)
      })
    }

    function initCaptcha() {
      if (root.__wbInquiryCaptcha) return Promise.resolve(root.__wbInquiryCaptcha)
      if (!captchaMount) return Promise.reject(new Error('Captcha container not found'))

      return ensureCaptchaLib().then(function (factory: any) {
        if (root.__wbInquiryCaptcha) return root.__wbInquiryCaptcha

        root.__wbInquiryCaptcha = factory({
          type: 'blockPuzzle',
          mode: 'pop',
          el: captchaMount,
          getUrl: getCaptchaBase() + '/system/captcha/get',
          checkUrl: getCaptchaBase() + '/system/captcha/check',
          success: function (verificationData: any) {
            root.__wbInquiryCaptchaValue =
              verificationData?.captchaVerification || verificationData || ''
            if (captchaInput) captchaInput.value = root.__wbInquiryCaptchaValue || ''
            submitRequest()
          },
          error: function () {
            setStatus('Captcha verification failed, please retry.', 'error')
          },
        })

        return root.__wbInquiryCaptcha
      })
    }

    function showCaptcha() {
      if (captchaContainer) {
        captchaContainer.style.display = 'block'
      }

      return initCaptcha().then(function (instance: any) {
        instance && instance.show && instance.show()
      })
    }

    function collectFields() {
      const fields: Record<string, any> = {}
      const elements = root.querySelectorAll('input[name], textarea[name], select[name]')

      elements.forEach(function (node) {
        const el = node as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        const name = (el.getAttribute('name') || '').trim()
        if (!name || name === 'inquiryTypeId' || name === 'inquiryTypeCode' || name === 'captchaVerification') {
          return
        }

        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
          if (!Array.isArray(fields[name])) fields[name] = []
          if (el.checked) fields[name].push(el.value)
          return
        }

        if (el instanceof HTMLInputElement && el.type === 'radio') {
          if (el.checked) fields[name] = el.value
          return
        }

        if (el instanceof HTMLSelectElement && el.multiple) {
          fields[name] = Array.from(el.selectedOptions).map(function (option) {
            return option.value
          })
          return
        }

        fields[name] = el.value
      })

      return fields
    }

    function setSubmitting(submitting: boolean) {
      if (!submitBtn) return
      submitBtn.disabled = submitting
      submitBtn.setAttribute('aria-busy', submitting ? 'true' : 'false')
      submitBtn.textContent = submitting ? 'Submitting...' : 'Submit'
    }

    function submitRequest() {
      const inquiryTypeId = getTypeId()
      const inquiryTypeCode = getTypeCode()
      if (!inquiryTypeId || !inquiryTypeCode) {
        setStatus('Please select an inquiry form type in the editor first.', 'error')
        return Promise.resolve()
      }

      setSubmitting(true)
      setStatus('', '')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const tenantId = getTenantId()
      if (tenantId) {
        headers['tenant-id'] = tenantId
      }

      return fetch(getSubmitUrl(), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          inquiryTypeId: inquiryTypeId,
          inquiryTypeCode: inquiryTypeCode,
          fields: collectFields(),
          captchaVerification: root.__wbInquiryCaptchaValue || undefined,
        }),
      })
        .then(function (response) {
          return response.json()
        })
        .then(function (result) {
          if (result && (result.code === 0 || result.code === 200)) {
            const form = root.tagName === 'FORM'
              ? root as HTMLFormElement
              : root.querySelector('form') as HTMLFormElement | null
            form && form.reset()
            root.__wbInquiryNeedsCaptcha = false
            if (captchaContainer) captchaContainer.style.display = 'none'
            resetCaptcha()
            setStatus(translateInquiryMessage(result.msg) || 'Submission successful!', 'success')
            return
          }

          if (result && result.code === 1009015009) {
            root.__wbInquiryNeedsCaptcha = true
            setStatus(
              translateInquiryMessage(result.msg) || 'Rate limit exceeded. Please complete captcha verification.',
              'warning',
            )
            return showCaptcha()
          }

          if (result && result.code === 1009015010) {
            resetCaptcha()
            root.__wbInquiryNeedsCaptcha = true
            setStatus(
              translateInquiryMessage(result.msg) || 'Captcha verification failed. Please retry.',
              'error',
            )
            return showCaptcha()
          }

          setStatus(translateInquiryMessage(result && result.msg) || 'Submission failed.', 'error')
        })
        .catch(function (error) {
          setStatus(translateInquiryMessage(error && error.message) || 'Network error.', 'error')
        })
        .finally(function () {
          setSubmitting(false)
        })
    }

    submitBtn.addEventListener('click', function () {
      if (root.__wbInquiryNeedsCaptcha && !root.__wbInquiryCaptchaValue) {
        showCaptcha()
        return
      }
      submitRequest()
    })

    hydrateProductInquiryHiddenFields()
  }
}

export function registerInquiryFormComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_INQUIRY_FORM_TYPE)) return

  domComponents.addType(WB_INQUIRY_FORM_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'inquiry-form'
        ? { type: WB_INQUIRY_FORM_TYPE }
        : false,
    model: {
      defaults: {
        name: '询盘表单',
        tagName: 'form',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'inquiry-form',
          'data-inquiry-type-id': '',
          'data-inquiry-type-code': '',
          'data-inquiry-type-name': '',
          'data-inquiry-fields': '[]',
          'data-submit-url': '/app-api/content/inquiry/submit',
          'data-captcha-base': '/app-api',
          'data-tenant-id': `${getEffectiveTenantId() || ''}`,
          class: 'wb-inquiry',
          onsubmit: 'return false;',
        },
        style: {
          display: 'block',
          width: '100%',
          'max-width': 'var(--wb-inquiry-form-max-width, 610px)',
        },
        inquiryTypeId: '',
        inquiryTypeCode: '',
        inquiryTypeName: '',
        inquiryFieldsSchema: '[]',
        ...INQUIRY_STYLE_DEFAULT_VALUES,
        traits: [
          {
            type: 'inquiry-type-select',
            label: '表单',
            name: 'inquiryTypeId',
            changeProp: true,
          },
          ...makeInquiryStyleTraits(),
        ],
        components: buildFormChildren({}),
        script: makeInquiryScript(),
        'script-export': makeInquiryScript(),
        styles: INQUIRY_FORM_CSS,
      },
      init(this: any) {
        this.__wbInquirySyncing = false
        this.__wbInquiryRequestId = 0
        this.__wbInquirySyncingStyleTraits = false

        this.on('change:inquiryTypeId', this.handleInquiryTypeChange)
        this.on('change:inquiryTypeCode change:inquiryTypeName change:inquiryFieldsSchema', this.syncAttrs)
        this.on('change:inquiryTypeId change:inquiryTypeCode change:inquiryTypeName change:inquiryFieldsSchema', this.renderPreview)
        this.on(
          INQUIRY_EDITABLE_STYLE_PROPS.map(prop => `change:${prop.name}`).join(' '),
          this.applyStyleVars,
        )

        this._wbInquiryDeviceSelect = () => {
          syncInquiryTraitValuesFromRules(editor, this)
        }

        editor.on?.('device:select', this._wbInquiryDeviceSelect)

        this.syncAttrs()
        syncInquiryTraitValuesFromRules(editor, this)
        this.applyStyleVars()
        this.renderPreview()

        if (sanitizeText(this.get('inquiryTypeId')) && !sanitizeText(this.get('inquiryTypeCode'))) {
          this.handleInquiryTypeChange()
        }
      },
      applyStyleVars(this: any) {
        if (this.__wbInquirySyncingStyleTraits) return
        applyInquiryStyleVarsToCurrentDevice(editor, this)
      },
      syncAttrs(this: any) {
        if (this.__wbInquirySyncing) return
        this.__wbInquirySyncing = true

        const inquiryTypeId = sanitizeText(this.get('inquiryTypeId'))
        const inquiryTypeCode = sanitizeText(this.get('inquiryTypeCode'))
        const inquiryTypeName = sanitizeText(this.get('inquiryTypeName'))
        const inquiryFieldsSchema = JSON.stringify(parseFields(this.get('inquiryFieldsSchema')))

        this.addAttributes({
          'data-inquiry-type-id': inquiryTypeId,
          'data-inquiry-type-code': inquiryTypeCode,
          'data-inquiry-type-name': inquiryTypeName,
          'data-inquiry-fields': JSON.stringify(parseFields(inquiryFieldsSchema)),
          'data-tenant-id': `${getEffectiveTenantId() || ''}`,
        })

        this.__wbInquirySyncing = false
      },
      renderPreview(this: any) {
        const fields = parseFields(this.get('inquiryFieldsSchema'))
        const nextChildren = buildFormChildren({
          inquiryTypeId: this.get('inquiryTypeId'),
          inquiryTypeCode: this.get('inquiryTypeCode'),
          inquiryTypeName: this.get('inquiryTypeName'),
          fields,
        })
        const children = this.components?.()
        if (children?.reset) {
          children.reset(nextChildren)
        } else {
          this.components(nextChildren)
        }
      },
      async handleInquiryTypeChange(this: any) {
        const inquiryTypeId = sanitizeText(this.get('inquiryTypeId'))
        this.syncAttrs()

        if (!inquiryTypeId) {
          this.set({
            inquiryTypeCode: '',
            inquiryTypeName: '',
            inquiryFieldsSchema: '[]',
          })
          return
        }

        const requestId = ++this.__wbInquiryRequestId
        this.set({
          inquiryTypeName: 'Loading inquiry form...',
          inquiryFieldsSchema: '[]',
        })

        try {
          const numericId = Number(inquiryTypeId)
          const [typeInfo, fields] = await Promise.all([
            getInquiryType(numericId),
            getFieldList(numericId),
          ])

          if (requestId !== this.__wbInquiryRequestId) return

          this.set({
            inquiryTypeCode: sanitizeText(typeInfo?.code),
            inquiryTypeName: sanitizeText(typeInfo?.name, 'Inquiry Form'),
            inquiryFieldsSchema: JSON.stringify(normalizeFields(fields)),
          })
        } catch (error) {
          if (requestId !== this.__wbInquiryRequestId) return
          this.set({
            inquiryTypeCode: '',
            inquiryTypeName: 'Failed to load inquiry form',
            inquiryFieldsSchema: '[]',
          })
          console.error('[WebBuilder] Failed to load inquiry form metadata', error)
        }
      },
      removed(this: any) {
        const attrs = this.getAttributes?.() ?? {}
        const id = sanitizeText(attrs.id)
        if (id) {
          cleanupInquiryInstanceCssRules(editor, `#${id}`)
        }

        cleanupUnusedInquiryBaseCss(editor)

        if (this._wbInquiryDeviceSelect) {
          editor.off?.('device:select', this._wbInquiryDeviceSelect)
        }
      },
    },
  })

}
