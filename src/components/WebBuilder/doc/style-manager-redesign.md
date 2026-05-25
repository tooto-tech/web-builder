# StyleManager 完全自定义架构设计文档

> 版本：v1.0
> 日期：2026-03-04
> 目标：完全脱离 GrapesJS 内置 sector/property 类型，构建独立可控的样式编辑系统

---

## 一、现状问题分析

### 当前架构的核心问题

| 问题 | 描述 |
|------|------|
| **混用内置类型** | dimension、layout、typography、decorations 等仍为 GrapesJS 内置 sector，内容和顺序难以精确控制 |
| **属性类型耦合** | `StylePropField.vue` 渲染逻辑依赖 GrapesJS 内部 property type（number/composite/stack），升级 GrapesJS 存在破坏风险 |
| **响应式层太厚** | `reactiveCollection` 将 GrapesJS Backbone Collection 转为 Vue 响应式，存在对象引用追踪不稳定的问题 |
| **配置碎片化** | CSS 属性定义分散在 `registerStyleSectors`（`useComponentRegistration.ts`）、`sectorConfig.ts`、`StylePropField.vue` 三处 |
| **spacingIntegration 孤立** | `spacingIntegration.ts` 注册了自定义 spacing 类型，但与整体架构脱节，维护成本高 |
| **无状态统一管理** | hover/focus 等伪类状态切换逻辑分散在 `useComponentState` 中，不与样式读写逻辑协同 |

---

## 二、新架构设计原则

1. **完全自定义**：`styleManager: { custom: true }`，GrapesJS 只提供样式读写 API，不渲染任何默认 UI
2. **配置驱动**：所有 CSS 属性和分区（sector）在单一配置文件中声明，UI 层完全由配置生成
3. **直接读写**：通过 `editor.StyleManager.addStyleTargets()` / `getSelected().getStyle()` 直接操作，不依赖 GrapesJS property model
4. **类型系统独立**：自定义控件类型，不受 GrapesJS 内置 type 约束
5. **状态感知**：选中状态（默认/hover/focus）统一由核心 composable 管理，控件无感知

---

## 三、目录结构

```
src/components/WebBuilder/
├── config/
│   └── wbStyleSectors.ts          # [新] 完整 sector + property 配置
│
├── composables/
│   ├── useWbStyleManager.ts       # [新] 核心：样式读写、选中目标管理
│   └── useWbStyleState.ts         # [新] 伪类状态（hover/focus）管理
│
└── components/
    ├── WbStylePanel.vue            # [新] 主面板（替代 StylesPropertiesPanel 的 styles 标签页）
    ├── WbSector.vue               # [新] 可折叠分区组件
    └── style-controls/            # [新] 各类型控件目录
        ├── WbCtrlText.vue         # text 输入
        ├── WbCtrlNumber.vue       # 数值 + 单位选择
        ├── WbCtrlColor.vue        # 颜色选择器
        ├── WbCtrlSelect.vue       # 下拉选择
        ├── WbCtrlIconRadio.vue    # 图标单选组
        ├── WbCtrlSpacing.vue      # Margin/Padding 四方向控制（封装现有 SpacingControl）
        ├── WbCtrlBorderRadius.vue # 圆角四方向控制
        ├── WbCtrlBackground.vue   # 背景复合控件
        └── WbCtrlShadow.vue       # 阴影 layers 控件
```

---

## 四、配置层：`wbStyleSectors.ts`

### 核心类型定义

```typescript
// 控件类型枚举（完全自定义，不依赖 GrapesJS 内置 type）
export type WbCtrlType =
  | 'text'          // 文本输入
  | 'number'        // 数值 + 单位
  | 'color'         // 颜色选择器
  | 'select'        // 下拉选择
  | 'icon-radio'    // 图标单选（Flex 方向等）
  | 'spacing'       // Margin/Padding 四方向
  | 'border-radius' // 圆角四方向
  | 'shadow'        // box-shadow layers
  | 'background'    // 背景复合控件

export interface WbCtrlOption {
  value: string
  label: string
  icon?: string     // Iconify 图标 ID，用于 icon-radio
}

export interface WbStyleProperty {
  id: string                    // CSS property 名（e.g. 'font-size'）
  label: string                 // 显示标签
  type: WbCtrlType
  default?: string
  options?: WbCtrlOption[]      // select / icon-radio 用
  units?: string[]              // number 类型的单位列表
  min?: number
  max?: number
  step?: number
  // 复合属性（spacing/border-radius）：内部实际写入多个 CSS 属性
  subProperties?: string[]      // e.g. ['margin-top', 'margin-right', ...]
}

export interface WbStyleSector {
  id: string
  label: string
  defaultOpen?: boolean
  properties: WbStyleProperty[]
}
```

### 10 个标准 Sector 定义

| Sector ID | 中文名 | 核心属性 |
|-----------|--------|---------|
| `wb-layout` | 布局 | display, flex-direction, justify-content, align-items, flex-wrap, gap, grid-template-columns |
| `wb-dimension` | 尺寸 | width, height, min-width, min-height, max-width, max-height |
| `wb-spacing` | 间距 | margin (spacing 控件), padding (spacing 控件) |
| `wb-position` | 定位 | position, top, right, bottom, left, z-index |
| `wb-typography` | 排版 | font-family, font-size, font-weight, line-height, letter-spacing, text-align, text-decoration, color |
| `wb-background` | 背景 | background-color, background-image, background-size, background-position, background-repeat |
| `wb-border` | 边框 | border-width (spacing), border-style, border-color, border-radius (border-radius 控件) |
| `wb-effects` | 效果 | opacity, box-shadow (shadow 控件), transform, filter, transition |
| `wb-overflow` | 溢出 | overflow, overflow-x, overflow-y |
| `wb-misc` | 其他 | cursor, pointer-events, visibility, user-select |

---

## 五、核心层：`useWbStyleManager.ts`

### 职责

- 在 `grapes.onInit` 之后订阅 GrapesJS 选中组件变化事件
- 提供 `getValue(property: string): string` 读取当前选中组件的 CSS 属性值
- 提供 `setValue(property: string, value: string): void` 写入 CSS 属性
- 提供 `setValues(styles: Record<string, string>): void` 批量写入
- 暴露 `selectedComponent` 响应式引用，供 UI 层判断是否有选中

### 关键实现

```typescript
// 使用 GrapesJS Style Manager 的状态感知 API（自动处理 hover 等伪类）
const setValue = (property: string, value: string) => {
  const sm = editor.StyleManager
  sm.addStyleTargets({ [property]: value })
}

// 读取当前样式（包含继承值）
const getValue = (property: string): string => {
  const selected = editor.StyleManager.getSelected()
  if (!selected) return ''
  const style = selected.getStyle()
  return style[property] ?? ''
}
```

### 状态层：`useWbStyleState.ts`

- 管理当前编辑状态：`'' | ':hover' | ':focus'`
- 切换状态时调用 `editor.StyleManager.select(targets, { state })`
- 暴露 `currentState` 响应式变量给 UI 层

---

## 六、UI 层：`WbStylePanel.vue`

### 结构

```
WbStylePanel
├── 类名管理（ComponentClasses 复用现有逻辑）
├── 状态切换（默认 / 悬停 / 焦点）
└── Sector 列表
    └── WbSector (v-for each sector)
        └── property controls (v-for each property)
            └── <WbCtrlXxx> based on property.type
```

### 控件选型原则

| 控件 | 对应类型 | 关键交互 |
|------|---------|---------|
| `WbCtrlText` | text | el-input，change 时写入 |
| `WbCtrlNumber` | number | el-input[type=number] + 单位 el-select，两者联动写入 |
| `WbCtrlColor` | color | 复用现有 WbColorPicker + 浮动弹层 |
| `WbCtrlSelect` | select | el-select |
| `WbCtrlIconRadio` | icon-radio | 图标按钮组，复用现有 FieldIconSelect |
| `WbCtrlSpacing` | spacing | 封装现有 SpacingControl，读写多个子属性 |
| `WbCtrlBorderRadius` | border-radius | 类似 SpacingControl，四角独立 + 联动模式 |
| `WbCtrlBackground` | background | 颜色 + 图片 URL + 尺寸/位置/重复 |
| `WbCtrlShadow` | shadow | layers 列表，复用现有拖排逻辑 |

---

## 七、迁移策略

### 阶段一（P0）：新架构骨架
- 新建 `wbStyleSectors.ts` 配置
- 新建 `useWbStyleManager.ts` + `useWbStyleState.ts`
- 新建 `WbStylePanel.vue` 骨架，集成进 `StylesPropertiesPanel.vue` 的 styles 标签页
- 在编辑器初始化时：移除所有 GrapesJS 内置 sector

### 阶段二（P1）：基础控件
- 实现 `WbCtrlText`、`WbCtrlNumber`、`WbCtrlColor`、`WbCtrlSelect`、`WbCtrlIconRadio`
- 完成 wb-layout、wb-dimension、wb-typography 三个 sector

### 阶段三（P2）：复合控件
- 实现 `WbCtrlSpacing`（封装 SpacingControl）
- 实现 `WbCtrlBorderRadius`
- 完成 wb-spacing、wb-border sector

### 阶段四（P3）：高级控件
- 实现 `WbCtrlBackground`
- 实现 `WbCtrlShadow`（复用 stack layers 交互逻辑）
- 完成所有剩余 sector

### 阶段五（P4）：清理
- 删除旧文件：`useStyleProps.ts`、`useSectors.ts`、`StylePropField.vue`、`sectorConfig.ts`、`spacingIntegration.ts`
- 删除 `useComponentRegistration.ts` 中的 `registerStyleSectors` 函数

---

## 八、与现有代码的关系

| 现有文件 | 处理方式 |
|---------|---------|
| `useStyleProps.ts` | 删除（新架构不再需要 reactiveCollection） |
| `useSectors.ts` | 删除 |
| `sectorConfig.ts` | 删除（配置迁移到 `wbStyleSectors.ts`） |
| `StylePropField.vue` | 删除 |
| `spacingIntegration.ts` | 删除（SpacingControl 直接被 `WbCtrlSpacing` 封装） |
| `SpacingControl.vue` | 保留并复用 |
| `WbColorPicker.vue` | 保留并复用 |
| `FieldIconSelect.vue` | 保留并复用 |
| `FieldWrapper.vue` | 保留并复用 |
| `sectorHelpers.ts` | 删除（不再需要 Backbone model 访问工具函数） |
| `useComponentState.ts` | 重构为 `useWbStyleState.ts`（职责聚焦） |
| `useComponentClasses.ts` | 保留不动 |
| `StylesPropertiesPanel.vue` | 修改：styles 标签页内容替换为 `WbStylePanel` |

---

## 九、关键设计决策

### 1. 为什么直接读写而不用 GrapesJS property model？

GrapesJS property model（`PropertyNumber`、`PropertySelect` 等）是为其内置 UI 设计的，暴露的是 Backbone Model API。维护响应式包装层（`reactiveCollection`）代价高，且每次 GrapesJS 升级都存在兼容风险。

新架构直接调用：
- `editor.StyleManager.addStyleTargets(styles)` — 写入（自动感知 hover 等伪类状态）
- `editor.StyleManager.getSelected().getStyle()` — 读取

这是 GrapesJS 官方文档推荐的 custom mode 做法，稳定且简单。

### 2. 为什么移除所有内置 sector？

内置 sector 的属性顺序、标签、控件类型均由 GrapesJS 控制，中文化和 UI 定制需要大量 hack。全部移除后，所有属性的展示完全受我们控制。

移除方式：
```typescript
// 在 editor 初始化后执行
const builtInSectors = ['general', 'layout', 'dimension', 'typography', 'decorations', 'extra', 'flex']
builtInSectors.forEach(id => {
  if (editor.StyleManager.getSector(id)) {
    editor.StyleManager.removeSector(id)
  }
})
```

### 3. 状态（hover 等）如何传递？

GrapesJS `styleManager.custom: true` 模式下，通过 `StyleManager.select(targets, { state: ':hover' })` 切换当前编辑状态，之后所有 `addStyleTargets()` 调用自动写入对应状态的样式。这与当前 `useComponentState` 的实现原理一致，只是统一收敛到 `useWbStyleState`。

---

## 十、文件变更汇总

### 新增文件（9个）
- `config/wbStyleSectors.ts`
- `composables/useWbStyleManager.ts`
- `composables/useWbStyleState.ts`
- `components/WbStylePanel.vue`
- `components/WbSector.vue`
- `components/style-controls/WbCtrlText.vue`
- `components/style-controls/WbCtrlNumber.vue`
- `components/style-controls/WbCtrlColor.vue`
- `components/style-controls/WbCtrlSelect.vue`
- `components/style-controls/WbCtrlIconRadio.vue`
- `components/style-controls/WbCtrlSpacing.vue`
- `components/style-controls/WbCtrlBorderRadius.vue`
- `components/style-controls/WbCtrlBackground.vue`
- `components/style-controls/WbCtrlShadow.vue`

### 修改文件（2个）
- `components/StylesPropertiesPanel.vue` — styles 标签页替换为 `WbStylePanel`
- `composables/useComponentRegistration.ts` — 删除 `registerStyleSectors` 函数

### 删除文件（6个）
- `composables/useStyleProps.ts`
- `composables/useSectors.ts`
- `config/sectorConfig.ts`
- `components/StylePropField.vue`
- `utils/spacingIntegration.ts`
- `utils/sectorHelpers.ts`
