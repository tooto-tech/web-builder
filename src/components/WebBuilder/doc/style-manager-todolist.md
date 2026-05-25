# StyleManager 重构 Todo List

> 对应设计文档：`style-manager-redesign.md`
> 优先级：P0（必须）→ P4（收尾清理）

---

## P0 — 新架构骨架

### ✅ T01：创建 `wbStyleSectors.ts` 配置文件
- [x] 定义 `WbCtrlType`、`WbCtrlOption`、`WbStyleProperty`、`WbStyleSector` 类型
- [x] 完整声明 10 个 sector 的所有属性（参照设计文档第四节）
- [x] `wb-layout`：display / flex-direction / justify-content / align-items / flex-wrap / gap / grid-template-columns / grid-template-rows
- [x] `wb-dimension`：width / height / min-width / min-height / max-width / max-height
- [x] `wb-spacing`：margin（spacing 类型）/ padding（spacing 类型）
- [x] `wb-position`：position / top / right / bottom / left / z-index
- [x] `wb-typography`：font-family / font-size / font-weight / line-height / letter-spacing / text-align / text-decoration / text-transform / color
- [x] `wb-background`：background-color / background-image / background-size / background-position / background-repeat
- [x] `wb-border`：border-width（spacing 类型）/ border-style / border-color / border-radius（border-radius 类型）
- [x] `wb-effects`：opacity / box-shadow（shadow 类型）/ transform / filter / transition
- [x] `wb-overflow`：overflow / overflow-x / overflow-y
- [x] `wb-misc`：cursor / pointer-events / visibility / user-select

### ✅ T02：创建 `useWbStyleManager.ts`
- [x] 接收 `grapes` 参数，在 `grapes.onInit` 后初始化
- [x] 维护 `selectedComponent` 响应式引用（监听 `component:selected` / `component:deselected` 事件）
- [x] 实现 `getValue(property: string): string`
- [x] 实现 `setValue(property: string, value: string): void`（通过 `getSelectedToStyle().addStyle()` 写入）
- [x] 实现 `setValues(styles: Record<string, string>): void`
- [x] 实现 `clearValue(property: string): void`
- [x] 移除所有内置 sector（general/layout/dimension/typography/decorations/extra/flex）
- [x] 暴露 `hasSelection: ComputedRef<boolean>`
- [x] 暴露 `currentStyles: Ref<Record<string, string>>` 响应式快照
- [x] 监听 style:custom / selector:state / component:styleUpdate 事件保持同步

### ✅ T03：创建 `useWbStyleState.ts`
- [x] 维护 `currentState: Ref<'' | ':hover' | ':focus'>` 响应式状态
- [x] 实现 `setState(state: string): void`（直接调用 `editor.Selectors.setState()`）
- [x] 暴露 `isNormalState`、`isHoverState`、`isFocusState` 计算属性
- [x] 缓存模式（grapes._cache），确保全局单例
- [x] 监听 selector:state 事件与 GrapesJS 内部状态同步

### ✅ T04：创建 `WbStylePanel.vue` 骨架
- [x] 接收 `grapes` 和 `imageManager` props
- [x] 集成 `useWbStyleManager`、`useWbStyleState`、`useComponentClasses`
- [x] 渲染：类名管理区 + 状态切换区（默认/悬停/焦点）+ Sector 列表
- [x] Sector 列表：`v-for` 遍历 `WB_STYLE_SECTORS` 配置，渲染 `WbSector` 组件
- [x] 无选中时显示空状态提示

### ✅ T05：创建 `WbSector.vue`
- [x] props：`sector: WbStyleSector`、`styleManager: WbStyleManager`
- [x] 自定义折叠展开（按钮 + v-show，带 chevron 图标）
- [x] showWhen 条件显示逻辑（读取同 sector 依赖属性的当前值）
- [x] 内联实现 text / number（含单位选择）/ color / select / icon-radio 控件
- [x] CSS 数值解析（parseCssValue）：处理 "16px"、"auto"、纯数字等格式
- [x] spacing / border-radius / shadow / background 显示占位提示

### ✅ T06：将 `WbStylePanel` 接入 `StylesPropertiesPanel.vue`
- [x] styles 标签页替换为 `<WbStylePanel :grapes="grapes" :image-manager="imageManager" />`
- [x] 移除 `useSectors`、`useComponentState`、`useComponentClasses` 引用
- [x] 移除 `StylePropField`、`defaultSectorConfig` 引用
- [x] 保留 properties tab 所需的 `useTraits`、`useCustomTraits`

---

## P1 — 基础控件实现

### ✅ T07：`WbCtrlText.vue`
- [x] props: `property: WbStyleProperty`、`modelValue: string`，emit `update:modelValue`
- [x] el-input，change 时 emit

### ✅ T08：`WbCtrlNumber.vue`
- [x] 数值输入 + 单位选择（从 `property.units` 读取）
- [x] `parseCssValue` 解析 "16px" → `{ num:"16", unit:"px" }`
- [x] 关键字单位（auto/none）：隐藏数字输入，只显示单位选择器
- [x] 数值或单位变更时合并后 emit
- [x] 支持 min/max/step；无单位属性（opacity/z-index）只输数字

### ✅ T09：`WbCtrlColor.vue`
- [x] el-popover + WbColorPicker 浮层
- [x] 棋盘格透明提示，显示当前颜色值
- [x] @clear → emit('')，支持清空

### ✅ T10：`WbCtrlSelect.vue`
- [x] el-select（clearable），选项从 `property.options` 读取

### ✅ T11：`WbCtrlIconRadio.vue`
- [x] 复用 `FieldIconSelect.vue`
- [x] 选项从 `property.options`（含 icon 字段）读取

### ✅ T12：完成 wb-layout sector 接入
- [x] display → WbCtrlSelect（6种显示方式）
- [x] flex-direction → WbCtrlIconRadio（4个方向图标）
- [x] justify-content → WbCtrlIconRadio（6个对齐图标）
- [x] align-items → WbCtrlIconRadio（5个对齐图标，flex+grid 共用）
- [x] flex-wrap → WbCtrlIconRadio
- [x] gap → WbCtrlNumber（px/%/em/rem）
- [x] grid-template-columns / rows → WbCtrlText
- [x] justify-items → WbCtrlSelect（grid-only）
- [x] showWhen 条件显示：flex 子属性在 display=flex/inline-flex 时显示，grid 子属性在 display=grid 时显示

### ✅ T13：完成 wb-dimension sector 接入
- [x] width / height / min-* / max-* → WbCtrlNumber（SIZE_UNITS: px/%/em/rem/vw/vh/auto/none）

### ✅ T14：完成 wb-typography sector 接入
- [x] color → WbCtrlColor
- [x] font-family → WbCtrlSelect（含 Poppins/Inter/Roboto 等）
- [x] font-size → WbCtrlNumber（px/em/rem/%）
- [x] font-weight → WbCtrlSelect（100-900）
- [x] font-style → WbCtrlIconRadio
- [x] line-height → WbCtrlNumber（含无单位 ''）
- [x] letter-spacing → WbCtrlNumber（px/em）
- [x] text-align → WbCtrlIconRadio（4个对齐图标）
- [x] text-decoration / text-transform / white-space → WbCtrlSelect

> 注：T12-T14 的配置已在 wbStyleSectors.ts 中完整声明，WbSector.vue 通过控件类型自动分发，无需额外代码。

---

## P2 — 复合控件实现

### ✅ T15：`WbCtrlSpacing.vue`
- [x] 封装现有 `SpacingControl.vue`
- [x] props：`property: WbStyleProperty`（type=spacing）+ `styleManager`
- [x] 读取：从 `styleManager` 读取 4 个子属性值（e.g. margin-top/right/bottom/left），组装为 BoxValue
- [x] 写入：SpacingControl 的 update 事件 → 解构为 4 个子属性写入 styleManager

### ✅ T16：`WbCtrlBorderRadius.vue`
- [x] 与 WbCtrlSpacing 相似，控制 border-top-left-radius 等 4 个角（tl/tr/br/bl → top/right/bottom/left 映射）
- [x] 支持联动模式（四角相同）和独立模式

### ✅ T17：完成 wb-spacing sector 接入
- [x] margin → WbCtrlSpacing
- [x] padding → WbCtrlSpacing

### ✅ T18：完成 wb-border sector 接入
- [x] border-width → WbCtrlSpacing（控制4边）
- [x] border-style → select（none/solid/dashed/dotted）
- [x] border-color → color
- [x] border-radius → WbCtrlBorderRadius

### ✅ T19：完成 wb-position sector 接入
- [x] position → select（static/relative/absolute/fixed/sticky）
- [x] top / right / bottom / left → number（px/%）
- [x] z-index → number（无单位）
- [x] 显示逻辑：top/right/bottom/left/z-index 仅当 position≠static 时显示（已在 wbStyleSectors.ts 中配置 showWhen，WbSector.isPropVisible 自动处理）

---

## P3 — 高级控件实现

### ✅ T20：`WbCtrlBgImage.vue`（背景图片控件）
- [x] 文本输入（支持手动输入 url() 格式）
- [x] 图片选择器按钮（调用 imageManager.openAssetsDialog，写入 url("...") 格式）
- [x] background-image 类型改为 'bg-image'，通过 WbSector 分发

### ✅ T21：`WbCtrlShadow.vue`
- [x] 多层 box-shadow 编辑（add / remove / 展开编辑）
- [x] 解析 box-shadow CSS（支持 rgba 括号内逗号）→ layers 数组
- [x] 每个 layer 展开后编辑：h-offset / v-offset / blur / spread / color / inset
- [x] 防止写入触发外部监听循环（committing 标志 + nextTick）

### ✅ T22：完成 wb-background sector 接入
- [x] background-color → WbCtrlColor
- [x] background-image → WbCtrlBgImage（type=bg-image）
- [x] background-size/position/repeat/attachment → WbCtrlSelect

### ✅ T23：完成 wb-effects sector 接入
- [x] opacity → WbCtrlNumber（0-1，step=0.05）
- [x] box-shadow → WbCtrlShadow
- [x] transform / filter / transition → WbCtrlText
- [x] mix-blend-mode → WbCtrlSelect

### ✅ T24：完成 wb-overflow 和 wb-misc sector 接入
- [x] overflow / overflow-x / overflow-y → WbCtrlSelect（已在配置中，自动分发）
- [x] cursor / pointer-events / visibility / user-select / box-sizing → WbCtrlSelect

---

## P4 — 清理与收尾

### ✅ T25：删除旧文件
- [x] 删除 `composables/useStyleProps.ts`
- [x] 删除 `composables/useSectors.ts`
- [x] 删除 `config/sectorConfig.ts`
- [x] 删除 `components/StylePropField.vue`
- [x] 删除 `utils/spacingIntegration.ts`
- [x] 删除 `utils/sectorHelpers.ts`
- [x] 删除 `composables/useComponentState.ts`

### ✅ T26：清理 `useComponentRegistration.ts`
- [x] 删除 `registerStyleSectors` 函数（wb-layout / wb-background 的旧 sector 注册）
- [x] 移除函数调用 `registerStyleSectors(editor)`

### ✅ T27：更新 composables index 导出
- [x] 移除 `useStyleProps`、`useSectors`、`useComponentState` 导出
- [x] 保留 `useWbStyleManager`、`useWbStyleState` 导出

### ✅ T28：最终集成测试
- [x] 新增 StyleManager 文件无 TypeScript 错误（tsc --noEmit 验证）
- [x] 旧文件无残留引用（grep 验证）

---

## 任务依赖关系

```
T01 (配置) → T02 (core composable) → T04 (面板骨架) → T06 (接入)
                ↓
             T03 (状态) → T04
                              ↓
T07-T11 (基础控件) → T12-T14 (sector 接入) → T06
T15-T16 (复合控件) → T17-T19 (sector 接入)
T20-T21 (高级控件) → T22-T24 (sector 接入)
                                              → T25-T28 (清理)
```

---

## 估算任务数量统计

| 阶段 | 任务数 | 核心产出 |
|------|--------|---------|
| P0 | 6 | 架构骨架，可跑通但控件不完整 |
| P1 | 8 | 完成最常用的 3 个 sector |
| P2 | 5 | 完成间距和边框 |
| P3 | 5 | 完成背景和高级效果 |
| P4 | 4 | 删除旧代码，收尾 |
| **合计** | **28** | |
