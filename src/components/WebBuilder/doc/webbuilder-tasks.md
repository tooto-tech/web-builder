# WebBuilder 优化任务清单

> Superseded for current architecture work: this checklist records an earlier cleanup plan and its completed items. Continue Phase 0+ architecture execution from [ToDoList.md](../../../../ToDoList.md), with shared vocabulary in [CONTEXT.md](../../../../CONTEXT.md) and decisions in:
> [ADR 0001](../../../../docs/adr/0001-webbuilder-project-data-first.md),
> [ADR 0002](../../../../docs/adr/0002-webbuilder-cms-render-source-of-truth.md),
> [ADR 0003](../../../../docs/adr/0003-webbuilder-loopgrid-render-owner.md),
> [ADR 0004](../../../../docs/adr/0004-webbuilder-resource-transaction.md),
> [ADR 0005](../../../../docs/adr/0005-webbuilder-publish-warning-policy.md),
> [ADR 0006](../../../../docs/adr/0006-webbuilder-registration-failure-policy.md).

> Architecture completion note: the current implementation now centers CMS rendering in `utils/cmsDynamicRender.ts`, resource ordering in `composables/useResourceTransaction.ts`, editor runtime state in `composables/useEditorRuntime.ts`, session workflows in `composables/useWebBuilderSession.ts`, registration diagnostics in `composables/useRegistrationDiagnostics.ts`, and LoopGrid schema/data loading in `components/registries/dynamic/loopGrid/schema.ts` and `dataProvider.ts`.

> 依据 `webbuilder-review.md` 整理，按优先级排列。完成后在 `[ ]` 中填入 `x` 标记。

---

## 阶段一：代码清洁（无破坏性，可随时执行）

### S1 · 提取共享工具函数

**目标文件**：新建 `src/components/WebBuilder/utils/styleHelpers.ts`
**解决问题**：`toNumber`、`toUnit`、`toBool` 在 container / grid / carousel 中各自重复定义

- [x] **S1-1** 新建 `src/components/WebBuilder/utils/styleHelpers.ts`，导出以下函数：
  - `toNumber(val, fallback): number`
  - `toUnit(val, fallback, allowed): string`
  - `toBool(val, fallback): boolean`
  - `buildBackgroundStyles(model): CSSProperties` — 封装 backgroundColor / backgroundImage / backgroundSize / backgroundPosition / backgroundRepeat / backgroundAttachment 六个属性的读取与生成逻辑
  - `buildWidthStyles(model): CSSProperties` — 封装 widthValue / widthUnit / contentWidth / boxedWidth 的读取与 max-width / margin 生成逻辑
  - `buildMinHeightStyles(model, fallback?): CSSProperties` — 封装 minHeight / minHeightUnit 的读取与生成逻辑

- [x] **S1-2** 替换 `container.ts` 中的 `toNumber` / `toUnit` 本地定义，改为从 styleHelpers 导入；调用 `buildBackgroundStyles` 和 `buildWidthStyles`

- [x] **S1-3** 替换 `grid.ts` 中的 `toNumber` / `toUnit` 本地定义，同上

- [x] **S1-4** 替换 `carousel.ts` 中的 `toNumber` / `toBool` 本地定义，改为从 styleHelpers 导入

---

### S2 · 合并 init 中的分散 on 监听

**目标文件**：`container.ts`、`grid.ts`、`menu.ts`
**解决问题**：container 有 20 个、grid 有 28 个分散的 `this.on()` 调用，全部指向同一函数，可合并为单行

- [x] **S2-1** `container.ts`：将 20 个 `this.on('change:xxx', this.applyStyles)` 合并为一个 `this.on('change:xxx change:yyy ...', this.applyStyles)` 调用

- [x] **S2-2** `grid.ts`：同上，合并 28 个监听

- [x] **S2-3** `menu.ts`：将 `applyMenuStyles` 相关的多个监听合并为一个调用

---

### S3 · 删除 view.render() 手动调用

**目标文件**：`heading.ts`、`button.ts`
**解决问题**：Model 层不应直接操作 View；`children.reset()` 本身已触发视图更新，手动调用 `view.render()` 导致重复渲染

- [x] **S3-1** `heading.ts`：删除 `applyHeadingText` 中的 `this.set('content', nextText)` 和 `this.view?.render?.()` 两行

- [x] **S3-2** `button.ts`：删除 `applyButtonText` 中的 `this.set('content', text)` 和 `this.view?.render?.()` 两行

---

### S4 · 修复 showGridOutline 写入内联样式的问题

**目标文件**：`grid.ts`
**解决问题**：`outline: 1px dashed #d8b4fe` 被写入内联样式，导出 HTML 时会包含编辑器辅助线

- [x] **S4-1** `grid.ts` 的 `applyStyles` 中，移除 `addStyle({ outline: ... })` 的逻辑

- [x] **S4-2** 改为修改 HTML 属性：`this.addAttributes({ 'data-show-outline': showGridOutline ? 'true' : 'false' })`

- [x] **S4-3** 在 `registerGridComponent` 顶部的全局 CSS 注入中添加：
  ```css
  [data-wb-component="grid"][data-show-outline="true"] {
    outline: 1px dashed #d8b4fe;
  }
  ```
  （此 CSS 通过 `editor.addStyle` 注入到 canvas iframe，不会输出到导出 HTML）

---

### S5 · 统一全局 CSS 注入，消除 _wbXxxStyleInjected 标志位

**目标文件**：`carousel.ts`、`menu.ts`；新建 `src/components/WebBuilder/utils/injectStyle.ts`
**解决问题**：当前用 `(editor as any)._wbXxxStyleInjected` 污染 editor 对象，TS 类型不安全

- [x] **S5-1** 新建 `src/components/WebBuilder/utils/injectStyle.ts`，导出函数：
  ```typescript
  export function injectStyleOnce(editor: any, key: string, css: string): void
  ```
  内部使用 `(editor.__wbStyles ??= new Map()).has(key)` 判断是否已注入

- [x] **S5-2** `carousel.ts`：替换 `_wbCarouselStyleInjected` 逻辑，改为调用 `injectStyleOnce(editor, 'wb-carousel', css)`

- [x] **S5-3** `menu.ts`：替换 `_wbMenuStyleInjected` 逻辑，改为调用 `injectStyleOnce(editor, 'wb-menu', css)`

---

### S6 · 为注册函数添加 Editor 类型

**目标文件**：所有 `src/components/WebBuilder/components/registries/*.ts`
**解决问题**：所有函数参数均为 `editor: any`，失去类型提示和安全检查

- [x] **S6-1** 确认项目中 grapesjs 包是否导出 `Editor` 类型（`import type { Editor } from 'grapesjs'`）

- [x] **S6-2** `container.ts`：函数签名改为 `registerContainerComponent(editor: Editor)`

- [x] **S6-3** `grid.ts`：同上

- [x] **S6-4** `heading.ts`：同上

- [x] **S6-5** `textEditor.ts`：同上

- [x] **S6-6** `button.ts`：同上

- [x] **S6-7** `image.ts`：同上

- [x] **S6-8** `spacer.ts`：同上

- [x] **S6-9** `divider.ts`：同上

- [x] **S6-10** `carousel.ts`：同上

- [x] **S6-11** `menu.ts`：同上

- [x] **S6-12** `useComponentRegistration.ts`：`registerAllComponents` 函数签名改为 `(editor: Editor)`

---

## 阶段二：消除重复（需少量重构，不影响功能）

### M1 · 提取共享 Traits 数组，消除 container / grid 重复定义

**目标文件**：新建 `src/components/WebBuilder/components/registries/sharedTraits.ts`；修改 `container.ts`、`grid.ts`
**解决问题**：背景属性（6 个）、宽度属性（4 个）、最小高度属性（2 个）在两个文件中完全重复

- [x] **M1-1** 新建 `sharedTraits.ts`，导出以下 Trait 数组：
  - `backgroundTraits` — backgroundColor / backgroundImage / backgroundSize / backgroundPosition / backgroundRepeat / backgroundAttachment 共 6 个 trait 定义
  - `widthTraits` — contentWidth / widthValue / widthUnit / boxedWidth 共 4 个 trait 定义
  - `minHeightTraits` — minHeight / minHeightUnit 共 2 个 trait 定义

- [x] **M1-2** `container.ts`：导入并使用 `[...widthTraits, ...minHeightTraits, ...flexTraits, ...backgroundTraits]`，删除本地重复定义

- [x] **M1-3** `grid.ts`：同上，删除本地重复定义

- [x] **M1-4** 同步更新两个文件的 `init` 中的 `on` 监听（S2 已完成则跳过），确保共享 trait 的变化事件都被监听

---

### M2 · 使用 GrapesJS extend 建立组件继承关系

**目标文件**：新建 `src/components/WebBuilder/components/registries/layoutBase.ts`；修改 `container.ts`、`grid.ts`；修改 `useComponentRegistration.ts`
**解决问题**：container / grid 有大量重复的属性定义和方法，应通过继承共享

> ⚠️ 依赖 M1 完成（共享 Traits 需先提取）

- [x] **M2-1** 新建 `layoutBase.ts`，注册 `wb-layout-base` 类型，包含：
  - 共享的 model defaults：backgroundColor、backgroundImage、backgroundSize、backgroundPosition、backgroundRepeat、backgroundAttachment、contentWidth、widthValue、widthUnit、boxedWidth、minHeight、minHeightUnit
  - 共享的 traits：`[...widthTraits, ...minHeightTraits, ...backgroundTraits]`
  - 共享方法：`applyBackgroundStyles()`、`applyWidthStyles()`

- [x] **M2-2** `container.ts` 添加 `extend: 'wb-layout-base'`，删除已在基类中定义的重复属性和方法，只保留 flex 相关的内容

- [x] **M2-3** `grid.ts` 同上，只保留 grid 相关的内容

- [x] **M2-4** `useComponentRegistration.ts`：在 `registerAllComponents` 中，确保 `registerLayoutBase(editor)` 在 container / grid 之前调用

---

### M3 · 修复 init 时 applyStyles 覆盖用户样式的问题

**目标文件**：`container.ts`、`grid.ts`
**解决问题**：每次组件加载时 `init` 都调用 `applyStyles`，会强制将 prop 对应的样式写入，覆盖用户可能通过 StyleManager 修改的值

- [x] **M3-1** `container.ts`：分析 `applyStyles` 中哪些样式**必须**在 init 时同步（通常是 contentWidth=boxed 时的 max-width / margin），哪些**不需要**

- [x] **M3-2** `container.ts`：将 init 末尾的 `this.applyStyles()` 改为只调用必要的子方法（如 `this.applyWidthConstraint()`），其余样式仅通过 prop change 事件触发

- [x] **M3-3** `grid.ts`：同上

---

## 阶段三：Panel 重构（改善 UI 层可维护性）

### P1 · 用扩展字段替代 StylesPropertiesPanel 中的硬编码判断

**目标文件**：所有 registry 文件（添加 `ui` 字段）；`StylesPropertiesPanel.vue`（改为数据驱动）
**解决问题**：Panel 中 10+ 个 `isXxxTrait` 硬编码判断随功能增加无限膨胀，与 registry 的 trait 名称强耦合

- [x] **P1-1** 在各 registry 文件的 trait 定义中添加 `ui` 扩展字段，声明渲染方式，例如：
  ```typescript
  { type: 'number', name: 'widthValue', ui: { widget: 'slider', inlineUnit: 'widthUnit' } }
  { type: 'select', name: 'flexWrap',   ui: { widget: 'icon-radio' } }
  { type: 'color',  name: 'backgroundColor', ui: { widget: 'color-picker-popover' } }
  { type: 'text',   name: 'backgroundImage', ui: { widget: 'image-picker' } }
  ```

- [x] **P1-2** `StylesPropertiesPanel.vue`：新增 `getTraitWidget(trait)` 函数，读取 `trait.get?.('ui')?.widget ?? 'auto'`

- [x] **P1-3** `StylesPropertiesPanel.vue`：将模板中的 `v-else-if="isXxxTrait(trait)"` 系列改为 `v-else-if="getTraitWidget(trait) === 'xxx'"` 的统一分发方式

- [x] **P1-4** 删除 `StylesPropertiesPanel.vue` 中不再需要的 `isWrapTrait`、`isInlineSelectTrait`、`isInlineIconTrait`、`isBackgroundColorTrait`、`isBackgroundImageTrait`、`isContentWidthTrait`、`isImageSrcTrait` 等函数

- [x] **P1-5** 同步更新 `inlineUnitTraitMap`：改为从各 trait 的 `ui.inlineUnit` 字段动态读取，而非维护静态 Map

---

### P2 · 注册自定义 Trait 类型（使用 TraitManager.addType）

**目标文件**：`useComponentRegistration.ts`；`StylesPropertiesPanel.vue`
**解决问题**：颜色选择器、图片选择器、icon-select 等当前在 Panel 模板中条件渲染，应封装为自定义 Trait 类型，由 GrapesJS 统一调度

> ⚠️ 依赖 P1 完成，或与 P1 同步进行

- [x] **P2-1** `useComponentRegistration.ts`：注册 `color-picker` 自定义 Trait 类型，`createInput` 中挂载 `WbColorPicker` Vue 组件

- [x] **P2-2** `useComponentRegistration.ts`：注册 `image-picker` 自定义 Trait 类型，`createInput` 中渲染图片预览 + 选择按钮

- [x] **P2-3** `useComponentRegistration.ts`：注册 `icon-radio` 自定义 Trait 类型，`createInput` 中渲染图标单选按钮组

- [x] **P2-4** 各 registry 文件：将 `type: 'color'` 改为 `type: 'color-picker'`（或通过 `ui.widget` 字段标记，二选一）

- [x] **P2-5** `StylesPropertiesPanel.vue`：删除 color、image-picker、icon-radio 相关的内联渲染分支，改为统一的 `<div ref="...">` 容器（GrapesJS 自动挂载）

---

## 阶段四：架构对齐（大规模重构，需充分测试）

### A1 · 将布局/背景视觉样式从 Traits 迁移到 StyleManager

**目标文件**：`container.ts`、`grid.ts`；`src/components/WebBuilder/config/sectorConfig.ts`（或新建）
**解决问题**：布局、背景等纯视觉属性走 Traits 而非 StyleManager，违背 GrapesJS 设计理念

> ⚠️ 这是破坏性重构，需要完整测试；建议先完成阶段一、二后再进行

- [x] **A1-1** 在 StyleManager 配置（sectorConfig）中新增 `wb-布局` 扇区，定义 flex-direction / justify-content / align-items / flex-wrap / gap / min-height 等属性

- [x] **A1-2** 在 StyleManager 配置中新增 `wb-背景` 扇区，定义 background-color / background-image / background-size / background-position / background-repeat / background-attachment 等属性

- [x] **A1-3** `container.ts`：从 traits 中移除已迁移到 StyleManager 的属性，删除对应的 `on` 监听和 `applyStyles` 中的相关逻辑

- [x] **A1-4** `grid.ts`：同上

- [x] **A1-5** 验证：保存/加载项目后，StyleManager 中修改的样式能正确持久化，不被 trait applyStyles 覆盖

- [x] **A1-6** 验证：导出 HTML/CSS 包含正确的样式，无多余的内联样式污染

---

### A2 · 将 button / menu 的样式属性从 Traits 迁移到 StyleManager

> ⚠️ 依赖 A1 完成（复用 StyleManager 扇区体系）

- [x] **A2-1** `button.ts`：移除 backgroundColor / textColor / borderRadius / buttonSize（这些本质是 CSS 属性）等样式 Traits，保留 buttonText / linkUrl / linkTarget 逻辑 Traits

- [x] **A2-2** `menu.ts`：移除 bgColor / textColor / fontSize / fontWeight / itemPaddingV / itemPaddingH / menuGap 等样式 Traits，保留 menuLayout / menuJustify / itemCount / showBrand / brandText / brandHref / hoverStyle 等逻辑 Traits

- [x] **A2-3** 在 StyleManager 中配置对应的按钮/菜单样式扇区（可复用 wb-背景、wb-排版等通用扇区）

---

## 进度统计

| 阶段 | 任务数 | 已完成 | 完成率 |
|------|--------|--------|--------|
| 阶段一：代码清洁 | 27 | 27 | 100% |
| 阶段二：消除重复 | 11 | 11 | 100% |
| 阶段三：Panel 重构 | 10 | 10 | 100% |
| 阶段四：架构对齐 | 9 | 9 | 100% |
| **合计** | **57** | **57** | **100%** |

---

*创建时间：2026-03-03*
*关联文档：`webbuilder-review.md`（详细问题分析）、`grapesjs-docs.md`（官方文档参考）*
