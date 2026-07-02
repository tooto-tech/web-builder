/**
 * WebBuilder StyleManager 完全自定义配置
 *
 * 所有 sector / property 定义集中于此，UI 层完全由配置驱动。
 * 不依赖任何 GrapesJS 内置 sector 或 property type。
 */

// ─── 控件类型 ────────────────────────────────────────────────────

export type WbCtrlType =
  | 'text'           // 纯文本输入
  | 'number'         // 数值 + 单位选择
  | 'color'          // 颜色选择器
  | 'select'         // 下拉选择
  | 'icon-radio'     // 图标单选按钮组
  | 'spacing'        // Margin/Padding 四方向控制（封装 SpacingControl）
  | 'border-radius'  // 圆角四方向控制
  | 'shadow'         // box-shadow layers 控件
  | 'bg-image'       // 背景图片（文本输入 + 图片选择器按钮）
  | 'font'           // 字体选择器（System + Google 双 tab）

// ─── 选项定义 ────────────────────────────────────────────────────

export interface WbCtrlOption {
  value: string
  label: string
  icon?: string  // Iconify 图标 ID，用于 icon-radio 类型
}

// ─── 条件显示 ────────────────────────────────────────────────────

/**
 * 属性的条件显示规则。
 * 当 `property`（同一 sector 内的另一属性 id）的当前值
 * 满足 `values` 数组中的任意一项时，该属性才显示。
 */
export interface WbShowWhen {
  property: string   // 依赖的同 sector 属性 id
  values: string[]   // 满足条件的值列表
}

// ─── 属性定义 ────────────────────────────────────────────────────

export interface WbStyleProperty {
  id: string             // CSS property 名，同时作为唯一标识（e.g. 'font-size'）
  label: string          // 显示标签（中文）
  type: WbCtrlType
  default?: string       // 默认占位值（仅用于 placeholder，不写入 CSS）
  options?: WbCtrlOption[]  // select / icon-radio 的选项
  units?: string[]          // number 类型的单位列表（第一个为默认单位）
  min?: number
  max?: number
  step?: number
  /**
   * 复合属性映射：spacing / border-radius 类型实际读写多个 CSS 属性。
   * key 为方向标识（top/right/bottom/left 或 tl/tr/br/bl），
   * value 为实际 CSS property 名。
   */
  subProperties?: Record<string, string>
  /** 条件显示规则：满足条件才渲染此控件 */
  showWhen?: WbShowWhen
}

// ─── Sector 定义 ─────────────────────────────────────────────────

export interface WbStyleSector {
  id: string
  label: string
  defaultOpen?: boolean
  properties: WbStyleProperty[]
}

// ─────────────────────────────────────────────────────────────────
// 公共单位配置
// ─────────────────────────────────────────────────────────────────

const LENGTH_UNITS = ['px', '%', 'em', 'rem', 'vw', 'vh']
const SIZE_UNITS   = ['px', '%', 'em', 'rem', 'vw', 'vh', 'auto']
const FONT_UNITS   = ['px', 'em', 'rem', '%']

// ─────────────────────────────────────────────────────────────────
// Sector 配置
// ─────────────────────────────────────────────────────────────────

/**
 * wb-layout — 布局
 */
const layoutSector: WbStyleSector = {
  id: 'wb-layout',
  label: '布局',
  defaultOpen: false,
  properties: [
    {
      id: 'display',
      label: '显示方式',
      type: 'select',
      default: 'block',
      options: [
        { value: 'block',        label: '块级 (block)' },
        { value: 'flex',         label: '弹性 (flex)' },
        { value: 'grid',         label: '网格 (grid)' },
        { value: 'inline',       label: '行内 (inline)' },
        { value: 'inline-block', label: '行内块 (inline-block)' },
        { value: 'inline-flex',  label: '行内弹性 (inline-flex)' },
        { value: 'none',         label: '隐藏 (none)' },
      ],
    },
    // ── Flex 子属性 ──────────────────────────────────────────────
    {
      id: 'flex-direction',
      label: '方向',
      type: 'icon-radio',
      default: 'row',
      showWhen: { property: 'display', values: ['flex', 'inline-flex'] },
      options: [
        { value: 'row',            label: '行',         icon: 'charm:arrow-right' },
        { value: 'row-reverse',    label: '行反向',     icon: 'charm:arrow-left' },
        { value: 'column',         label: '列',         icon: 'charm:arrow-down' },
        { value: 'column-reverse', label: '列反向',     icon: 'charm:arrow-up' },
      ],
    },
    {
      id: 'justify-content',
      label: '主轴对齐',
      type: 'icon-radio',
      default: 'flex-start',
      showWhen: { property: 'display', values: ['flex', 'inline-flex'] },
      options: [
        { value: 'flex-start',    label: '起点',   icon: 'material-symbols:align-justify-flex-start-rounded' },
        { value: 'center',        label: '居中',   icon: 'material-symbols:align-justify-center-rounded' },
        { value: 'flex-end',      label: '终点',   icon: 'material-symbols:align-justify-flex-end-rounded' },
        { value: 'space-between', label: '两端',   icon: 'material-symbols:align-justify-space-between-rounded' },
        { value: 'space-around',  label: '环绕',   icon: 'material-symbols:align-justify-space-around-rounded' },
        { value: 'space-evenly',  label: '均匀',   icon: 'material-symbols:align-justify-space-evenly-rounded' },
      ],
    },
    {
      id: 'align-items',
      label: '交叉轴对齐',
      type: 'icon-radio',
      default: 'stretch',
      showWhen: { property: 'display', values: ['flex', 'inline-flex', 'grid'] },
      options: [
        { value: 'flex-start', label: '起点', icon: 'mdi:format-align-top' },
        { value: 'center',     label: '居中', icon: 'mdi:format-align-middle' },
        { value: 'flex-end',   label: '终点', icon: 'mdi:format-align-bottom' },
        { value: 'baseline',   label: '基线', icon: 'mdi:format-vertical-align-center' },
        { value: 'stretch',    label: '拉伸', icon: 'mdi:arrow-expand-vertical' },
      ],
    },
    {
      id: 'flex-wrap',
      label: '换行',
      type: 'icon-radio',
      default: 'nowrap',
      showWhen: { property: 'display', values: ['flex', 'inline-flex'] },
      options: [
        { value: 'nowrap',       label: '不换行', icon: 'mdi:arrow-right' },
        { value: 'wrap',         label: '换行',   icon: 'mdi:wrap' },
        { value: 'wrap-reverse', label: '反向',   icon: 'mdi:wrap' },
      ],
    },
    {
      id: 'align-content',
      label: '多行对齐',
      type: 'icon-radio',
      default: 'flex-start',
      showWhen: { property: 'display', values: ['flex', 'inline-flex'] },
      options: [
        { value: 'flex-start',    label: '起点', icon: 'mdi:format-align-top' },
        { value: 'center',        label: '居中', icon: 'mdi:format-align-middle' },
        { value: 'flex-end',      label: '终点', icon: 'mdi:format-align-bottom' },
        { value: 'space-between', label: '两端', icon: 'mdi:space-between-vertical' },
        { value: 'space-around',  label: '环绕', icon: 'mdi:space-around-vertical' },
        { value: 'stretch',       label: '拉伸', icon: 'mdi:arrow-expand-vertical' },
      ],
    },
    {
      id: 'gap',
      label: '间距 (gap)',
      type: 'number',
      default: '0',
      units: ['px', '%', 'em', 'rem'],
      min: 0,
      showWhen: { property: 'display', values: ['flex', 'inline-flex', 'grid'] },
    },
    // ── Grid 子属性 ──────────────────────────────────────────────
    {
      id: 'grid-template-columns',
      label: '列模板',
      type: 'text',
      default: 'repeat(3, 1fr)',
      showWhen: { property: 'display', values: ['grid'] },
    },
    {
      id: 'grid-template-rows',
      label: '行模板',
      type: 'text',
      default: 'auto',
      showWhen: { property: 'display', values: ['grid'] },
    },
    {
      id: 'justify-items',
      label: '列对齐',
      type: 'select',
      default: 'stretch',
      showWhen: { property: 'display', values: ['grid'] },
      options: [
        { value: 'start',   label: '起点 (start)' },
        { value: 'center',  label: '居中 (center)' },
        { value: 'end',     label: '终点 (end)' },
        { value: 'stretch', label: '拉伸 (stretch)' },
      ],
    },
  ],
}

/**
 * wb-dimension — 尺寸
 */
const dimensionSector: WbStyleSector = {
  id: 'wb-dimension',
  label: '尺寸',
  defaultOpen: false,
  properties: [
    {
      id: 'width',
      label: '宽度',
      type: 'number',
      units: SIZE_UNITS,
      min: 0,
    },
    {
      id: 'height',
      label: '高度',
      type: 'number',
      units: SIZE_UNITS,
      min: 0,
    },
    {
      id: 'min-width',
      label: '最小宽度',
      type: 'number',
      units: SIZE_UNITS,
      min: 0,
    },
    {
      id: 'min-height',
      label: '最小高度',
      type: 'number',
      units: SIZE_UNITS,
      min: 0,
    },
    {
      id: 'max-width',
      label: '最大宽度',
      type: 'number',
      units: [...SIZE_UNITS, 'none'],
      min: 0,
    },
    {
      id: 'max-height',
      label: '最大高度',
      type: 'number',
      units: [...SIZE_UNITS, 'none'],
      min: 0,
    },
    {
      id: 'aspect-ratio',
      label: '宽高比',
      type: 'text',
      default: 'auto',
    },
  ],
}

/**
 * wb-spacing — 间距
 */
const spacingSector: WbStyleSector = {
  id: 'wb-spacing',
  label: '常用',
  defaultOpen: true,
  properties: [
    {
      id: 'margin',
      label: '外边距',
      type: 'spacing',
      subProperties: {
        top:    'margin-top',
        right:  'margin-right',
        bottom: 'margin-bottom',
        left:   'margin-left',
      },
    },
    {
      id: 'padding',
      label: '内边距',
      type: 'spacing',
      subProperties: {
        top:    'padding-top',
        right:  'padding-right',
        bottom: 'padding-bottom',
        left:   'padding-left',
      },
    },
  ],
}

/**
 * wb-position — 定位
 */
const positionSector: WbStyleSector = {
  id: 'wb-position',
  label: '定位',
  defaultOpen: false,
  properties: [
    {
      id: 'position',
      label: '定位方式',
      type: 'select',
      default: 'static',
      options: [
        { value: 'static',   label: '默认 (static)' },
        { value: 'relative', label: '相对 (relative)' },
        { value: 'absolute', label: '绝对 (absolute)' },
        { value: 'fixed',    label: '固定 (fixed)' },
        { value: 'sticky',   label: '粘性 (sticky)' },
      ],
    },
    {
      id: 'inset',
      label: '偏移',
      type: 'spacing',
      units: LENGTH_UNITS,
      subProperties: {
        top:    'top',
        right:  'right',
        bottom: 'bottom',
        left:   'left',
      },
      showWhen: { property: 'position', values: ['relative', 'absolute', 'fixed', 'sticky'] },
    },
    {
      id: 'z-index',
      label: '层级 (z-index)',
      type: 'number',
      units: [],  // 无单位
      step: 1,
      showWhen: { property: 'position', values: ['relative', 'absolute', 'fixed', 'sticky'] },
    },
  ],
}

/**
 * wb-typography — 排版
 */
export const typographySector: WbStyleSector = {
  id: 'wb-typography',
  label: '排版',
  defaultOpen: false,
  properties: [
    {
      id: 'color',
      label: '颜色',
      type: 'color',
    },
    {
      id: 'font-family',
      label: '字体',
      type: 'font',
    },
    {
      id: 'font-size',
      label: '字号',
      type: 'number',
      units: FONT_UNITS,
      min: 0,
      step: 1,
    },
    {
      id: 'font-weight',
      label: '字重',
      type: 'select',
      default: 'normal',
      options: [
        { value: '100', label: '100 - Thin' },
        { value: '200', label: '200 - Extra Light' },
        { value: '300', label: '300 - Light' },
        { value: '400', label: '400 - Normal' },
        { value: '500', label: '500 - Medium' },
        { value: '600', label: '600 - Semi Bold' },
        { value: '700', label: '700 - Bold' },
        { value: '800', label: '800 - Extra Bold' },
        { value: '900', label: '900 - Black' },
      ],
    },
    {
      id: 'font-style',
      label: '字形',
      type: 'icon-radio',
      default: 'normal',
      options: [
        { value: 'normal',  label: '正常', icon: 'mdi:format-italic-off' },
        { value: 'italic',  label: '斜体', icon: 'mdi:format-italic' },
        { value: 'oblique', label: '倾斜', icon: 'mdi:format-italic' },
      ],
    },
    {
      id: 'line-height',
      label: '行高',
      type: 'number',
      units: ['', 'px', 'em', '%'],  // '' 表示无单位数字
      min: 0,
      step: 0.1,
    },
    {
      id: 'letter-spacing',
      label: '字间距',
      type: 'number',
      units: ['px', 'em'],
      step: 0.5,
    },
    {
      id: 'text-align',
      label: '对齐',
      type: 'icon-radio',
      default: 'left',
      options: [
        { value: 'left',    label: '左对齐',   icon: 'mdi:format-align-left' },
        { value: 'center',  label: '居中',     icon: 'mdi:format-align-center' },
        { value: 'right',   label: '右对齐',   icon: 'mdi:format-align-right' },
        { value: 'justify', label: '两端对齐', icon: 'mdi:format-align-justify' },
      ],
    },
    {
      id: 'text-decoration',
      label: '装饰',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none',         label: '无' },
        { value: 'underline',    label: '下划线' },
        { value: 'line-through', label: '删除线' },
        { value: 'overline',     label: '上划线' },
      ],
    },
    {
      id: 'text-transform',
      label: '大小写',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none',        label: '默认' },
        { value: 'uppercase',   label: '全大写 (ABC)' },
        { value: 'lowercase',   label: '全小写 (abc)' },
        { value: 'capitalize',  label: '首字母大写 (Abc)' },
      ],
    },
    {
      id: 'white-space',
      label: '空白处理',
      type: 'select',
      default: 'normal',
      options: [
        { value: 'normal',   label: '正常' },
        { value: 'nowrap',   label: '不换行' },
        { value: 'pre',      label: '保留空白' },
        { value: 'pre-wrap', label: '保留并换行' },
        { value: 'pre-line', label: '合并空格' },
      ],
    },
  ],
}

/**
 * wb-background — 背景
 */
const backgroundSector: WbStyleSector = {
  id: 'wb-background',
  label: '背景',
  defaultOpen: false,
  properties: [
    {
      id: 'background-color',
      label: '背景色',
      type: 'color',
    },
    {
      id: 'background-image',
      label: '背景图',
      type: 'bg-image',
      default: '',
    },
    {
      id: 'background-size',
      label: '尺寸',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto',    label: '自动 (auto)' },
        { value: 'cover',   label: '覆盖 (cover)' },
        { value: 'contain', label: '包含 (contain)' },
        { value: '100% 100%', label: '拉伸' },
      ],
    },
    {
      id: 'background-position',
      label: '位置',
      type: 'select',
      default: '0% 0%',
      options: [
        { value: '0% 0%',     label: '左上' },
        { value: '50% 0%',    label: '居上' },
        { value: '100% 0%',   label: '右上' },
        { value: '0% 50%',    label: '居左' },
        { value: '50% 50%',   label: '居中' },
        { value: '100% 50%',  label: '居右' },
        { value: '0% 100%',   label: '左下' },
        { value: '50% 100%',  label: '居下' },
        { value: '100% 100%', label: '右下' },
      ],
    },
    {
      id: 'background-repeat',
      label: '重复',
      type: 'select',
      default: 'repeat',
      options: [
        { value: 'repeat',    label: '平铺 (repeat)' },
        { value: 'repeat-x',  label: '横向平铺' },
        { value: 'repeat-y',  label: '纵向平铺' },
        { value: 'no-repeat', label: '不重复' },
      ],
    },
    {
      id: 'background-attachment',
      label: '附着',
      type: 'select',
      default: 'scroll',
      options: [
        { value: 'scroll', label: '滚动 (scroll)' },
        { value: 'fixed',  label: '固定 (fixed)' },
        { value: 'local',  label: '局部 (local)' },
      ],
    },
  ],
}

/**
 * wb-border — 边框
 */
const borderSector: WbStyleSector = {
  id: 'wb-border',
  label: '边框',
  defaultOpen: false,
  properties: [
    {
      id: 'border-style',
      label: '线型',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none',   label: '无' },
        { value: 'solid',  label: '实线' },
        { value: 'dashed', label: '虚线' },
        { value: 'dotted', label: '点线' },
        { value: 'double', label: '双线' },
        { value: 'groove', label: '凹线' },
        { value: 'ridge',  label: '凸线' },
      ],
    },
    {
      id: 'border-color',
      label: '颜色',
      type: 'color',
    },
    {
      id: 'border-width',
      label: '宽度',
      type: 'spacing',
      subProperties: {
        top:    'border-top-width',
        right:  'border-right-width',
        bottom: 'border-bottom-width',
        left:   'border-left-width',
      },
    },
    {
      id: 'border-radius',
      label: '圆角',
      type: 'border-radius',
      subProperties: {
        tl: 'border-top-left-radius',
        tr: 'border-top-right-radius',
        br: 'border-bottom-right-radius',
        bl: 'border-bottom-left-radius',
      },
    },
  ],
}

/**
 * wb-effects — 效果
 */
const effectsSector: WbStyleSector = {
  id: 'wb-effects',
  label: '效果',
  defaultOpen: false,
  properties: [
    {
      id: 'opacity',
      label: '透明度',
      type: 'number',
      units: [],   // 无单位，0~1
      min: 0,
      max: 1,
      step: 0.05,
      default: '1',
    },
    {
      id: 'box-shadow',
      label: '阴影',
      type: 'shadow',
    },
    {
      id: 'transform',
      label: '变换',
      type: 'text',
      default: '',
    },
    {
      id: 'filter',
      label: '滤镜',
      type: 'text',
      default: '',
    },
    {
      id: 'transition',
      label: '过渡',
      type: 'text',
      default: '',
    },
    {
      id: 'mix-blend-mode',
      label: '混合模式',
      type: 'select',
      default: 'normal',
      options: [
        { value: 'normal',      label: '正常' },
        { value: 'multiply',    label: '正片叠底' },
        { value: 'screen',      label: '滤色' },
        { value: 'overlay',     label: '叠加' },
        { value: 'darken',      label: '变暗' },
        { value: 'lighten',     label: '变亮' },
        { value: 'color-dodge', label: '颜色减淡' },
        { value: 'color-burn',  label: '颜色加深' },
        { value: 'hard-light',  label: '强光' },
        { value: 'soft-light',  label: '柔光' },
        { value: 'difference',  label: '差值' },
        { value: 'exclusion',   label: '排除' },
      ],
    },
  ],
}

/**
 * wb-overflow — 溢出
 */
const overflowSector: WbStyleSector = {
  id: 'wb-overflow',
  label: '溢出',
  defaultOpen: false,
  properties: [
    {
      id: 'overflow',
      label: '溢出',
      type: 'select',
      default: 'visible',
      options: [
        { value: 'visible', label: '可见 (visible)' },
        { value: 'hidden',  label: '隐藏 (hidden)' },
        { value: 'scroll',  label: '滚动 (scroll)' },
        { value: 'auto',    label: '自动 (auto)' },
        { value: 'clip',    label: '裁剪 (clip)' },
      ],
    },
    {
      id: 'overflow-x',
      label: '水平溢出',
      type: 'select',
      default: 'visible',
      options: [
        { value: 'visible', label: '可见' },
        { value: 'hidden',  label: '隐藏' },
        { value: 'scroll',  label: '滚动' },
        { value: 'auto',    label: '自动' },
      ],
    },
    {
      id: 'overflow-y',
      label: '垂直溢出',
      type: 'select',
      default: 'visible',
      options: [
        { value: 'visible', label: '可见' },
        { value: 'hidden',  label: '隐藏' },
        { value: 'scroll',  label: '滚动' },
        { value: 'auto',    label: '自动' },
      ],
    },
  ],
}

/**
 * wb-misc — 其他
 */
const miscSector: WbStyleSector = {
  id: 'wb-misc',
  label: '其他',
  defaultOpen: false,
  properties: [
    {
      id: 'cursor',
      label: '鼠标样式',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto',        label: '自动' },
        { value: 'default',     label: '默认箭头' },
        { value: 'pointer',     label: '手型' },
        { value: 'text',        label: '文本' },
        { value: 'move',        label: '移动' },
        { value: 'grab',        label: '抓取' },
        { value: 'grabbing',    label: '抓取中' },
        { value: 'not-allowed', label: '禁止' },
        { value: 'wait',        label: '等待' },
        { value: 'crosshair',   label: '十字准线' },
        { value: 'zoom-in',     label: '放大' },
        { value: 'zoom-out',    label: '缩小' },
        { value: 'none',        label: '隐藏' },
      ],
    },
    {
      id: 'pointer-events',
      label: '鼠标事件',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: '自动' },
        { value: 'none', label: '禁用' },
        { value: 'all',  label: '全部' },
      ],
    },
    {
      id: 'visibility',
      label: '可见性',
      type: 'select',
      default: 'visible',
      options: [
        { value: 'visible',  label: '可见' },
        { value: 'hidden',   label: '不可见（占位）' },
        { value: 'collapse', label: '折叠' },
      ],
    },
    {
      id: 'user-select',
      label: '文字选择',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto',  label: '自动' },
        { value: 'none',  label: '禁止选择' },
        { value: 'text',  label: '可选文字' },
        { value: 'all',   label: '全选' },
      ],
    },
    {
      id: 'box-sizing',
      label: '盒模型',
      type: 'select',
      default: 'content-box',
      options: [
        { value: 'content-box', label: '内容盒 (content-box)' },
        { value: 'border-box',  label: '边框盒 (border-box)' },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────
// 导出：全部 sector 有序列表
// ─────────────────────────────────────────────────────────────────

export const WB_STYLE_SECTORS: WbStyleSector[] = [
  spacingSector,
  layoutSector,
  dimensionSector,
  positionSector,
  backgroundSector,
  borderSector,
  effectsSector,
  overflowSector,
  miscSector,
]

/**
 * 根据 sector id 快速查找
 */
export const WB_STYLE_SECTOR_MAP: Record<string, WbStyleSector> =
  Object.fromEntries(WB_STYLE_SECTORS.map(s => [s.id, s]))

/**
 * 根据 property id 快速查找所属 sector 和属性定义
 */
export function findWbProperty(propertyId: string): {
  sector: WbStyleSector
  property: WbStyleProperty
} | null {
  for (const sector of WB_STYLE_SECTORS) {
    const property = sector.properties.find(p => p.id === propertyId)
    if (property) return { sector, property }
  }
  return null
}

/**
 * GrapesJS 内置 sector 列表（初始化时需全部移除）
 */
export const GRAPESJS_BUILTIN_SECTORS = [
  'general',
  'layout',
  'dimension',
  'typography',
  'decorations',
  'extra',
  'flex',
]
