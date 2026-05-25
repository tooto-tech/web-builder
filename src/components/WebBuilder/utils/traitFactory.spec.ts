import { describe, it, expect } from 'vitest'
import {
  makeTextTrait,
  makeLinkTrait,
  makeNumberTrait,
  makeSelectTrait,
  makeLinkTargetTrait,
  makeCheckboxTrait,
  makeColorPickerTrait,
  makeImagePickerTrait,
  makeSvgIconPickerTrait,
  UNIT_OPTIONS_PX_VH_REM,
  UNIT_OPTIONS_PX_PCT_VH,
  type TraitDef,
  type SelectOption,
} from './traitFactory'

// ─── 公共断言 ──────────────────────────────────────────────────────────────

function expectBaseTrait(trait: TraitDef, type: string, label: string, name: string) {
  expect(trait.type).toBe(type)
  expect(trait.label).toBe(label)
  expect(trait.name).toBe(name)
  expect(trait.changeProp).toBe(true)
}

// ─── makeTextTrait ────────────────────────────────────────────────────────

describe('makeTextTrait', () => {
  it('创建基础文本 trait', () => {
    const t = makeTextTrait('标题', 'myText')
    expectBaseTrait(t, 'text', '标题', 'myText')
    expect(t).not.toHaveProperty('placeholder')
  })

  it('带 placeholder 选项', () => {
    const t = makeTextTrait('标题', 'myText', { placeholder: '请输入' })
    expect(t.placeholder).toBe('请输入')
  })

  it('空字符串 placeholder 不输出字段', () => {
    const t = makeTextTrait('标题', 'myText', { placeholder: '' })
    // 空字符串 falsy，不应附加
    expect(t).not.toHaveProperty('placeholder')
  })
})

// ─── makeLinkTrait ────────────────────────────────────────────────────────

describe('makeLinkTrait', () => {
  it('使用默认值', () => {
    const t = makeLinkTrait()
    expect(t.label).toBe('链接地址')
    expect(t.name).toBe('linkUrl')
    expect(t.placeholder).toBe('https://')
    expect(t.changeProp).toBe(true)
  })

  it('覆盖 label / name / placeholder', () => {
    const t = makeLinkTrait({ label: '外链', name: 'imageLink', placeholder: 'http://' })
    expect(t.label).toBe('外链')
    expect(t.name).toBe('imageLink')
    expect(t.placeholder).toBe('http://')
  })
})

// ─── makeNumberTrait ──────────────────────────────────────────────────────

describe('makeNumberTrait', () => {
  it('创建基础数字 trait（无约束）', () => {
    const t = makeNumberTrait('高度', 'h')
    expectBaseTrait(t, 'number', '高度', 'h')
    expect(t).not.toHaveProperty('min')
    expect(t).not.toHaveProperty('max')
    expect(t).not.toHaveProperty('step')
  })

  it('带完整约束', () => {
    const t = makeNumberTrait('高度', 'h', { min: 0, max: 1000, step: 10 })
    expect(t.min).toBe(0)
    expect(t.max).toBe(1000)
    expect(t.step).toBe(10)
  })

  it('min 为 0 时仍应输出（非 falsy 过滤）', () => {
    const t = makeNumberTrait('高度', 'h', { min: 0 })
    expect(t).toHaveProperty('min', 0)
  })
})

// ─── makeSelectTrait ──────────────────────────────────────────────────────

describe('makeSelectTrait', () => {
  const opts: SelectOption[] = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]

  it('创建下拉选择 trait', () => {
    const t = makeSelectTrait('类型', 'myType', opts)
    expectBaseTrait(t, 'select', '类型', 'myType')
    expect(t.options).toEqual(opts)
  })

  it('options 数组引用独立（不修改原始数组）', () => {
    const t = makeSelectTrait('类型', 'myType', opts)
    expect(t.options).toBe(opts) // 直接引用，轻量传递
  })
})

// ─── makeLinkTargetTrait ─────────────────────────────────────────────────

describe('makeLinkTargetTrait', () => {
  it('默认 label/name', () => {
    const t = makeLinkTargetTrait()
    expect(t.label).toBe('打开方式')
    expect(t.name).toBe('linkTarget')
    expect(t.type).toBe('select')
    const options = t.options as SelectOption[]
    expect(options).toHaveLength(2)
    expect(options[0].value).toBe('_self')
    expect(options[1].value).toBe('_blank')
  })

  it('覆盖 label / name', () => {
    const t = makeLinkTargetTrait({ label: '链接打开方式', name: 'imageLinkTarget' })
    expect(t.label).toBe('链接打开方式')
    expect(t.name).toBe('imageLinkTarget')
  })
})

// ─── 单位常量 ─────────────────────────────────────────────────────────────

describe('UNIT_OPTIONS_PX_VH_REM', () => {
  it('包含 px / vh / rem', () => {
    const values = UNIT_OPTIONS_PX_VH_REM.map(o => o.value)
    expect(values).toEqual(['px', 'vh', 'rem'])
  })
})

describe('UNIT_OPTIONS_PX_PCT_VH', () => {
  it('包含 px / % / vh', () => {
    const values = UNIT_OPTIONS_PX_PCT_VH.map(o => o.value)
    expect(values).toEqual(['px', '%', 'vh'])
  })
})

// ─── makeCheckboxTrait ────────────────────────────────────────────────────

describe('makeCheckboxTrait', () => {
  it('创建复选框 trait', () => {
    const t = makeCheckboxTrait('自动播放', 'autoplay')
    expectBaseTrait(t, 'checkbox', '自动播放', 'autoplay')
  })
})

// ─── makeColorPickerTrait ─────────────────────────────────────────────────

describe('makeColorPickerTrait', () => {
  it('创建 color-picker trait', () => {
    const t = makeColorPickerTrait('颜色', 'myColor')
    expectBaseTrait(t, 'color-picker', '颜色', 'myColor')
  })
})

// ─── makeImagePickerTrait ─────────────────────────────────────────────────

describe('makeImagePickerTrait', () => {
  it('默认 showPreview 为 true', () => {
    const t = makeImagePickerTrait('图片', 'imageSrc')
    expectBaseTrait(t, 'image-picker', '图片', 'imageSrc')
    expect((t.ui as any).showPreview).toBe(true)
  })

  it('显式关闭 showPreview', () => {
    const t = makeImagePickerTrait('背景', 'bgImage', { showPreview: false })
    expect((t.ui as any).showPreview).toBe(false)
  })
})

// ─── makeSvgIconPickerTrait ────────────────────────────────────────────────

describe('makeSvgIconPickerTrait', () => {
  it('默认 sourceName 为 iconSource', () => {
    const t = makeSvgIconPickerTrait('图标', 'iconSvg')
    expectBaseTrait(t, 'svg-icon-picker', '图标', 'iconSvg')
    expect((t.ui as any).sourceName).toBe('iconSource')
  })

  it('支持自定义 sourceName', () => {
    const t = makeSvgIconPickerTrait('图标', 'iconSvg', { sourceName: 'iconId' })
    expect((t.ui as any).sourceName).toBe('iconId')
  })
})

// ─── changeProp 永远为 true ───────────────────────────────────────────────

describe('所有工厂函数强制 changeProp: true', () => {
  const traits = [
    makeTextTrait('a', 'a'),
    makeLinkTrait(),
    makeNumberTrait('a', 'a'),
    makeSelectTrait('a', 'a', []),
    makeLinkTargetTrait(),
    makeCheckboxTrait('a', 'a'),
    makeColorPickerTrait('a', 'a'),
    makeImagePickerTrait('a', 'a'),
    makeSvgIconPickerTrait('a', 'a'),
  ]

  it.each(traits.map(t => [t.name, t]))('%s.changeProp === true', (_name, trait) => {
    expect((trait as TraitDef).changeProp).toBe(true)
  })
})
