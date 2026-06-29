import type { Editor } from 'grapesjs'

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

interface InquiryFieldI18nText {
  code: string
  label: string
  placeholder: string
  optionPlaceholder?: string
  helperText?: string
}

interface InquiryI18nTexts {
  fields: InquiryFieldI18nText[]
  submitText: string
  submittingText: string
  editorTypeMissingText: string
  captchaErrorText: string
  rateLimitText: string
  captchaFailedText: string
  submissionSuccessText: string
  submissionFailedText: string
  networkErrorText: string
}

type InquiryRuntimeTextKey = Exclude<keyof InquiryI18nTexts, 'fields'>

const DEFAULT_INQUIRY_I18N_TEXTS: InquiryI18nTexts = {
  fields: [],
  submitText: 'Submit',
  submittingText: 'Submitting...',
  editorTypeMissingText: 'Please select an inquiry form type in the editor first.',
  captchaErrorText: 'Captcha verification failed, please retry.',
  rateLimitText: 'Rate limit exceeded. Please complete captcha verification.',
  captchaFailedText: 'Captcha verification failed. Please retry.',
  submissionSuccessText: 'Submission successful!',
  submissionFailedText: 'Submission failed.',
  networkErrorText: 'Network error.',
}

const INQUIRY_RUNTIME_TEXT_KEYS: InquiryRuntimeTextKey[] = [
  'submitText',
  'submittingText',
  'editorTypeMissingText',
  'captchaErrorText',
  'rateLimitText',
  'captchaFailedText',
  'submissionSuccessText',
  'submissionFailedText',
  'networkErrorText',
]

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

function inquiryText(value: any, fallback: string): string {
  return sanitizeText(value) || fallback
}

function getDefaultFieldLabel(field: InquiryFieldSchema): string {
  return `${field.name}${field.required ? ' *' : ''}`
}

function getDefaultFieldPlaceholder(field: InquiryFieldSchema): string {
  const prefix = field.fieldType === 'date' ? 'Please select ' : 'Please enter '
  return `${prefix}${field.name}`
}

function getDefaultOptionPlaceholder(field: InquiryFieldSchema): string {
  return `Please enter ${field.name} option value`
}

function isChoiceField(field: InquiryFieldSchema): boolean {
  return (
    field.fieldType === 'radio' || field.fieldType === 'checkbox' || field.fieldType === 'select'
  )
}

function getDefaultFieldHelperText(field: InquiryFieldSchema): string {
  if (!isChoiceField(field)) return ''
  return `This field is configured as ${field.fieldType}. Use option values from your inquiry settings.`
}

function parseInquiryI18nTexts(raw: any): Partial<InquiryI18nTexts> {
  if (!raw) return {}
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function mergeInquiryI18nTexts(fields: InquiryFieldSchema[], raw: any): InquiryI18nTexts {
  const parsed = parseInquiryI18nTexts(raw)
  const previousFieldEntries = (Array.isArray(parsed.fields) ? parsed.fields : [])
    .map(
      (field: any): [string, Partial<InquiryFieldI18nText>] => [
        sanitizeText(field?.code),
        field as Partial<InquiryFieldI18nText>,
      ],
    )
    .filter(([code]) => Boolean(code))
  const previousFields = new Map<string, Partial<InquiryFieldI18nText>>(previousFieldEntries)

  const nextTexts: InquiryI18nTexts = {
    ...DEFAULT_INQUIRY_I18N_TEXTS,
    fields: fields
      .filter((field) => field.code !== 'product_info')
      .map((field) => {
        const previous = previousFields.get(field.code)
        const fieldText: InquiryFieldI18nText = {
          code: field.code,
          label: inquiryText(previous?.label, getDefaultFieldLabel(field)),
          placeholder: inquiryText(previous?.placeholder, getDefaultFieldPlaceholder(field)),
          helperText: inquiryText(previous?.helperText, getDefaultFieldHelperText(field)),
        }
        if (isChoiceField(field)) {
          fieldText.optionPlaceholder = inquiryText(
            previous?.optionPlaceholder,
            getDefaultOptionPlaceholder(field),
          )
        }
        return fieldText
      }),
  }

  INQUIRY_RUNTIME_TEXT_KEYS.forEach((key) => {
    ;(nextTexts as any)[key] = inquiryText((parsed as any)[key], DEFAULT_INQUIRY_I18N_TEXTS[key])
  })

  return nextTexts
}

function getFieldI18nText(
  field: InquiryFieldSchema,
  i18nTexts: InquiryI18nTexts,
): InquiryFieldI18nText {
  const saved = i18nTexts.fields.find((item) => item.code === field.code)
  const fieldText: InquiryFieldI18nText = {
    code: field.code,
    label: inquiryText(saved?.label, getDefaultFieldLabel(field)),
    placeholder: inquiryText(saved?.placeholder, getDefaultFieldPlaceholder(field)),
    helperText: inquiryText(saved?.helperText, getDefaultFieldHelperText(field)),
  }
  if (isChoiceField(field)) {
    fieldText.optionPlaceholder = inquiryText(
      saved?.optionPlaceholder,
      getDefaultOptionPlaceholder(field),
    )
  }
  return fieldText
}

function normalizeFields(fields: any[] = []): InquiryFieldSchema[] {
  return [...fields]
    .map((field) => ({
      code: sanitizeText(field?.code),
      name: sanitizeText(field?.name, 'Untitled Field'),
      fieldType: sanitizeText(field?.fieldType, 'text').toLowerCase(),
      required: Boolean(field?.required),
      maxLength: field?.maxLength ?? undefined,
      sort: Number(field?.sort ?? 0),
    }))
    .filter((field) => field.code)
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

function createFieldControl(field: InquiryFieldSchema, fieldText: InquiryFieldI18nText) {
  if (field.fieldType === 'textarea') {
    return {
      tagName: 'textarea',
      ...CHILD_LOCK,
      attributes: makeInputAttrs(field, 'textarea', fieldText.placeholder),
    }
  }

  let inputType = 'text'
  if (field.fieldType === 'email') inputType = 'email'
  if (field.fieldType === 'phone') inputType = 'tel'
  if (field.fieldType === 'date') inputType = 'date'
  if (
    field.fieldType === 'positive_int' ||
    field.fieldType === 'integer' ||
    field.fieldType === 'decimal'
  ) {
    inputType = 'number'
  }

  const control = {
    tagName: 'input',
    ...CHILD_LOCK,
    attributes: makeInputAttrs(field, inputType, fieldText.placeholder),
  } as any

  if (isChoiceField(field)) {
    control.attributes['data-field-kind'] = field.fieldType
    control.attributes.placeholder =
      fieldText.optionPlaceholder || getDefaultOptionPlaceholder(field)
  }

  return control
}

function createFieldComponent(field: InquiryFieldSchema, i18nTexts: InquiryI18nTexts) {
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

  const fieldText = getFieldI18nText(field, i18nTexts)
  const helperText = fieldText.helperText || ''

  const components: any[] = [
    {
      tagName: 'label',
      ...CHILD_LOCK,
      attributes: { class: 'wb-inquiry__label' },
      content: fieldText.label,
    },
    createFieldControl(field, fieldText),
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
  fields?: InquiryFieldSchema[]
  i18nTexts?: InquiryI18nTexts
}) {
  const inquiryTypeId = sanitizeText(options.inquiryTypeId)
  const inquiryTypeCode = sanitizeText(options.inquiryTypeCode)
  const fields = options.fields ?? []
  const i18nTexts = options.i18nTexts ?? mergeInquiryI18nTexts(fields, undefined)

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
            content:
              'After binding a form type, fields and submit logic will be generated automatically.',
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
    ...fields.map((field) => createFieldComponent(field, i18nTexts)),
    {
      tagName: 'div',
      ...CHILD_LOCK,
      attributes: { class: 'wb-inquiry__captcha-wrap' },
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
          content: i18nTexts.submitText,
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

    function readInquiryI18nTexts() {
      try {
        const parsed = JSON.parse(root.getAttribute('data-inquiry-i18n-texts') || '{}')
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (_) {
        return {}
      }
    }

    const inquiryTexts = readInquiryI18nTexts()

    function getInquiryText(key: string, fallback: string) {
      const value = inquiryTexts && inquiryTexts[key]
      return `${value ?? ''}`.trim() || fallback
    }

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

    function getRequestHeaderName() {
      return (root.getAttribute('data-wb-request-header-name') || '').trim()
    }

    function getRequestHeaderValue() {
      return (root.getAttribute('data-wb-request-header-value') || '').trim()
    }

    function getSubmitUrl() {
      return (root.getAttribute('data-submit-url') || '').trim()
    }

    function getCaptchaBase() {
      return (root.getAttribute('data-captcha-base') || '').trim().replace(/\/$/, '')
    }

    function getTypeId() {
      return parseInt(root.getAttribute('data-inquiry-type-id') || '0', 10)
    }

    function getTypeCode() {
      return (root.getAttribute('data-inquiry-type-code') || '').trim()
    }

    function getFormContainer() {
      return root.tagName === 'FORM'
        ? (root as HTMLFormElement)
        : (root.querySelector('form') as HTMLFormElement | null)
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
      parent
        .querySelectorAll('input[type="hidden"][data-wb-product-inquiry="true"]')
        .forEach(function (input) {
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
      const captchaBase = getCaptchaBase()
      if (!captchaBase) return Promise.reject(new Error('Captcha endpoint not configured'))

      return ensureCaptchaLib().then(function (factory: any) {
        if (root.__wbInquiryCaptcha) return root.__wbInquiryCaptcha

        root.__wbInquiryCaptcha = factory({
          type: 'blockPuzzle',
          mode: 'pop',
          el: captchaMount,
          getUrl: captchaBase + '/system/captcha/get',
          checkUrl: captchaBase + '/system/captcha/check',
          success: function (verificationData: any) {
            root.__wbInquiryCaptchaValue =
              verificationData?.captchaVerification || verificationData || ''
            if (captchaInput) captchaInput.value = root.__wbInquiryCaptchaValue || ''
            submitRequest()
          },
          error: function () {
            setStatus(
              getInquiryText('captchaErrorText', 'Captcha verification failed, please retry.'),
              'error',
            )
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
        if (
          !name ||
          name === 'inquiryTypeId' ||
          name === 'inquiryTypeCode' ||
          name === 'captchaVerification'
        ) {
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
      submitBtn.textContent = submitting
        ? getInquiryText('submittingText', 'Submitting...')
        : getInquiryText('submitText', 'Submit')
    }

    function submitRequest() {
      const inquiryTypeId = getTypeId()
      const inquiryTypeCode = getTypeCode()
      if (!inquiryTypeId || !inquiryTypeCode) {
        setStatus(
          getInquiryText(
            'editorTypeMissingText',
            'Please select an inquiry form type in the editor first.',
          ),
          'error',
        )
        return Promise.resolve()
      }

      setSubmitting(true)
      setStatus('', '')

      const submitUrl = getSubmitUrl()
      if (!submitUrl) {
        setSubmitting(false)
        setStatus(getInquiryText('submissionFailedText', 'Submission failed.'), 'error')
        return Promise.resolve()
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const requestHeaderName = getRequestHeaderName()
      const requestHeaderValue = getRequestHeaderValue()
      if (requestHeaderName && requestHeaderValue) {
        headers[requestHeaderName] = requestHeaderValue
      }

      return fetch(submitUrl, {
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
            const form =
              root.tagName === 'FORM'
                ? (root as HTMLFormElement)
                : (root.querySelector('form') as HTMLFormElement | null)
            form && form.reset()
            root.__wbInquiryNeedsCaptcha = false
            if (captchaContainer) captchaContainer.style.display = 'none'
            resetCaptcha()
            setStatus(
              translateInquiryMessage(result.msg) ||
                getInquiryText('submissionSuccessText', 'Submission successful!'),
              'success',
            )
            return
          }

          if (result && result.code === 1009015009) {
            root.__wbInquiryNeedsCaptcha = true
            setStatus(
              translateInquiryMessage(result.msg) ||
                getInquiryText(
                  'rateLimitText',
                  'Rate limit exceeded. Please complete captcha verification.',
                ),
              'warning',
            )
            return showCaptcha()
          }

          if (result && result.code === 1009015010) {
            resetCaptcha()
            root.__wbInquiryNeedsCaptcha = true
            setStatus(
              translateInquiryMessage(result.msg) ||
                getInquiryText('captchaFailedText', 'Captcha verification failed. Please retry.'),
              'error',
            )
            return showCaptcha()
          }

          setStatus(
            translateInquiryMessage(result && result.msg) ||
              getInquiryText('submissionFailedText', 'Submission failed.'),
            'error',
          )
        })
        .catch(function (error) {
          setStatus(
            translateInquiryMessage(error && error.message) ||
              getInquiryText('networkErrorText', 'Network error.'),
            'error',
          )
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
          'data-inquiry-i18n-texts': JSON.stringify(DEFAULT_INQUIRY_I18N_TEXTS),
          'data-submit-url': '',
          'data-captcha-base': '',
          'data-wb-request-header-name': '',
          'data-wb-request-header-value': '',
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
        inquiryI18nTexts: DEFAULT_INQUIRY_I18N_TEXTS,
        components: buildFormChildren({}),
        script: makeInquiryScript(),
        'script-export': makeInquiryScript(),
        styles: INQUIRY_FORM_CSS,
      },
      init(this: any) {
        this.__wbInquirySyncing = false

        this.on(
          'change:inquiryTypeCode change:inquiryTypeName change:inquiryFieldsSchema change:inquiryI18nTexts',
          this.syncAttrs,
        )
        this.on(
          'change:inquiryTypeId change:inquiryTypeCode change:inquiryTypeName change:inquiryFieldsSchema change:inquiryI18nTexts',
          this.renderPreview,
        )

        this.syncAttrs()
        this.renderPreview()
      },
      syncAttrs(this: any) {
        if (this.__wbInquirySyncing) return
        this.__wbInquirySyncing = true

        const attrs = this.getAttributes?.() ?? {}
        const inquiryTypeId =
          sanitizeText(this.get('inquiryTypeId')) || sanitizeText(attrs['data-inquiry-type-id'])
        const inquiryTypeCode =
          sanitizeText(this.get('inquiryTypeCode')) || sanitizeText(attrs['data-inquiry-type-code'])
        const inquiryTypeName =
          sanitizeText(this.get('inquiryTypeName')) || sanitizeText(attrs['data-inquiry-type-name'])
        const fields = parseFields(
          this.get('inquiryFieldsSchema') || attrs['data-inquiry-fields'] || '[]',
        )
        const inquiryFieldsSchema = JSON.stringify(fields)
        const inquiryI18nTexts = mergeInquiryI18nTexts(
          fields,
          this.get('inquiryI18nTexts') || attrs['data-inquiry-i18n-texts'],
        )
        this.set('inquiryI18nTexts', inquiryI18nTexts, { silent: true })

        this.addAttributes?.({
          'data-inquiry-type-id': inquiryTypeId,
          'data-inquiry-type-code': inquiryTypeCode,
          'data-inquiry-type-name': inquiryTypeName,
          'data-inquiry-fields': inquiryFieldsSchema,
          'data-inquiry-i18n-texts': JSON.stringify(inquiryI18nTexts),
          'data-wb-request-header-name': '',
          'data-wb-request-header-value': '',
        })

        this.__wbInquirySyncing = false
      },
      renderPreview(this: any) {
        const attrs = this.getAttributes?.() ?? {}
        const fields = parseFields(
          this.get('inquiryFieldsSchema') || attrs['data-inquiry-fields'] || '[]',
        )
        const inquiryI18nTexts = mergeInquiryI18nTexts(
          fields,
          this.get('inquiryI18nTexts') || attrs['data-inquiry-i18n-texts'],
        )
        this.set('inquiryI18nTexts', inquiryI18nTexts, { silent: true })
        const nextChildren = buildFormChildren({
          inquiryTypeId:
            this.get('inquiryTypeId') || sanitizeText(attrs['data-inquiry-type-id']),
          inquiryTypeCode:
            this.get('inquiryTypeCode') || sanitizeText(attrs['data-inquiry-type-code']),
          fields,
          i18nTexts: inquiryI18nTexts,
        })
        const children = this.components?.()
        if (children?.reset) {
          children.reset(nextChildren)
        } else {
          this.components(nextChildren)
        }
      },
    },
  })
}
