# StyleManager 重构验收标准文档

> 对应设计文档：`style-manager-redesign.md`
> 验收原则：以用户行为为单位，每条标准可独立验证

---

## 一、架构层验收（代码质量）

### AC-A1：完全脱离 GrapesJS 内置类型
- **验收方式**：全局搜索以下关键词，确认零引用
  ```
  getSectors()
  reactiveCollection
  sectorConfig
  StylePropField
  spacingIntegration
  useSectors
  useStyleProps
  sectorHelpers
  ```
- **通过标准**：以上关键词在样式相关文件中无任何 import 或使用

### AC-A2：GrapesJS 内置 sector 全部移除
- **验收方式**：编辑器初始化后，在浏览器 Console 执行：
  ```javascript
  editor.StyleManager.getSectors().map(s => s.getId())
  ```
- **通过标准**：返回数组不包含 `general`、`layout`、`dimension`、`typography`、`decorations`、`extra`、`flex`

### AC-A3：配置单一来源
- **验收方式**：检查所有 sector 和 property 定义，确认仅存在于 `config/wbStyleSectors.ts`
- **通过标准**：`StylesPropertiesPanel.vue` 和 `WbStylePanel.vue` 中无硬编码的属性名或 sector 名

### AC-A4：TypeScript 无错误
- **验收方式**：执行 `npm run type-check` 或 `tsc --noEmit`
- **通过标准**：零 TypeScript 错误

### AC-A5：构建成功
- **验收方式**：执行 `npm run build`
- **通过标准**：零错误，零 warning（或 warning 数量不多于重构前）

---

## 二、基础功能验收

### AC-B1：未选中组件时面板为空
- **操作**：打开编辑器，不点选任何组件
- **通过标准**：样式面板显示"请先选择一个组件"提示，不报错

### AC-B2：选中组件后展示对应面板
- **操作**：点选画布上任意组件
- **通过标准**：样式面板出现，显示正确的 sector 列表，accordion 默认展开状态符合配置

### AC-B3：切换选中不同组件样式正确更新
- **操作**：选中组件A（已设置 font-size: 20px），再选中组件B（已设置 font-size: 14px）
- **通过标准**：切换后排版 sector 的 font-size 控件值随之更新，无残留旧值

### AC-B4：取消选中后面板重置
- **操作**：点击画布空白处取消选中
- **通过标准**：面板恢复空状态，不报错

---

## 三、各 Sector 功能验收

### AC-S1：布局（wb-layout）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| display | 选择 `flex` | 组件内联样式出现 `display: flex`，画布实时更新 |
| display | 选择 `grid` | 组件内联样式出现 `display: grid` |
| flex-direction | 点击"向下"图标 | 内联样式 `flex-direction: column` |
| justify-content | 点击"居中"图标 | 内联样式 `justify-content: center` |
| align-items | 点击"顶部"图标 | 内联样式 `align-items: flex-start` |
| gap | 输入 `16` 选择 `px` | 内联样式 `gap: 16px` |
| **条件显示** | display 切换为 block | flex/grid 子属性控件隐藏 |
| **条件显示** | display 切换为 flex | flex 子属性控件显示，grid 属性隐藏 |

### AC-S2：尺寸（wb-dimension）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| width | 输入 `200` + `px` | 内联样式 `width: 200px`，画布宽度变化 |
| width | 输入 `50` + `%` | 内联样式 `width: 50%` |
| height | 选择单位 `auto` | 内联样式 `height: auto` |
| max-width | 输入 `1200` + `px` | 内联样式 `max-width: 1200px` |

### AC-S3：间距（wb-spacing）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| margin | 联动模式输入 `16` | 内联样式 `margin-top/right/bottom/left: 16px`（四边相同） |
| margin | 独立模式修改 top | 仅 `margin-top` 变化，其余不变 |
| padding | 联动模式输入 `8` | 内联样式 `padding: 8px`（四边相同） |
| padding | 独立模式各边不同 | 各边独立写入正确值 |

### AC-S4：定位（wb-position）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| position | 选择 `static` | top/right/bottom/left/z-index 控件隐藏 |
| position | 选择 `absolute` | top/right/bottom/left/z-index 控件显示 |
| top | 输入 `50` + `px` | 内联样式 `position: absolute; top: 50px` |
| z-index | 输入 `10` | 内联样式 `z-index: 10` |

### AC-S5：排版（wb-typography）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| color | 选择颜色 #ff0000 | 内联样式 `color: #ff0000`，文字颜色变红 |
| font-size | 输入 `18` + `px` | 内联样式 `font-size: 18px` |
| font-weight | 选择 `700` | 内联样式 `font-weight: 700` |
| text-align | 点击居中图标 | 内联样式 `text-align: center` |
| font-family | 选择 `Poppins` | 内联样式 `font-family: Poppins` |

### AC-S6：背景（wb-background）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| background-color | 选择颜色 | 内联样式 `background-color` 更新 |
| background-size | 选择 `cover` | 内联样式 `background-size: cover` |

### AC-S7：边框（wb-border）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| border-style | 选择 `solid` | 内联样式 `border-style: solid` |
| border-color | 选择颜色 | 内联样式 `border-color` 更新 |
| border-width | 联动输入 `2` | 内联样式 `border-width: 2px`（四边相同） |
| border-radius | 联动输入 `8` | 内联样式 `border-radius: 8px` |
| border-radius | 独立输入各角不同 | 各 `border-*-*-radius` 独立写入 |

### AC-S8：效果（wb-effects）
| 属性 | 操作 | 预期结果 |
|------|------|---------|
| opacity | 输入 `0.5` | 内联样式 `opacity: 0.5`，画布组件半透明 |
| box-shadow | 添加 layer → 设置 offset 和 color | 内联样式 `box-shadow` 正确更新 |
| box-shadow | 拖拽 layer 排序 | CSS 值中 shadow 顺序改变 |
| box-shadow | 删除 layer | 对应 shadow 从 CSS 值中移除 |

---

## 四、状态（伪类）验收

### AC-PS1：默认/悬停状态切换
- **操作**：选中组件 → 切换至"悬停"状态 → 修改背景色为蓝色
- **通过标准**：组件 CSS 规则中 `:hover { background-color: blue }` 正确生成

### AC-PS2：状态样式独立
- **操作**：默认状态设置背景色红色 → 切换悬停状态设置背景色蓝色 → 切回默认状态
- **通过标准**：默认状态控件显示红色，悬停状态控件显示蓝色，两者互不干扰

### AC-PS3：状态切换后控件值正确更新
- **操作**：在默认状态将 font-size 设为 16px，切换到悬停状态（悬停未设置 font-size）
- **通过标准**：悬停状态下 font-size 控件显示空白或继承值，不显示默认状态的 16px

---

## 五、类名管理验收

### AC-CM1：添加类名
- **操作**：在类名输入区输入 `my-class` 并回车
- **通过标准**：组件 HTML 中出现 `class="... my-class"`

### AC-CM2：移除类名
- **操作**：点击已有类名的删除按钮
- **通过标准**：对应类名从组件 HTML 中移除

---

## 六、响应式与性能验收

### AC-P1：快速切换组件无闪烁
- **操作**：连续快速点击多个组件（5次/秒）
- **通过标准**：面板正确显示最后选中组件的样式，无残留旧值，无 console error

### AC-P2：实时预览
- **操作**：拖动颜色选择器
- **通过标准**：画布中组件颜色实时跟随变化（不需要失焦才更新）

### AC-P3：撤销/重做
- **操作**：修改属性 → Ctrl+Z 撤销 → Ctrl+Y 重做
- **通过标准**：样式面板控件值随撤销/重做正确还原

### AC-P4：保存后重载
- **操作**：修改多个属性 → 保存页面 → 重新打开页面编辑
- **通过标准**：重新选中组件后，样式面板显示的值与保存前一致

---

## 七、边界情况验收

### AC-E1：空值处理
- **操作**：清空 font-size 输入框
- **通过标准**：该属性从内联样式中移除（不写入空字符串），不报错

### AC-E2：无效数值处理
- **操作**：在 number 控件输入非数字字符（如 `abc`）
- **通过标准**：输入框恢复上一次有效值，或不写入，不崩溃

### AC-E3：组件无样式时默认值
- **操作**：选中一个刚添加的、未设置任何样式的组件
- **通过标准**：各控件显示空值或 placeholder，不显示其他组件残留的值

### AC-E4：多选组件（如支持）
- **操作**：框选多个组件，修改某属性
- **通过标准**：所有被选中组件的该属性同时更新（或显示"多选不支持"提示）

---

## 八、验收通过标准汇总

| 类别 | 总条数 | 通过条件 |
|------|--------|---------|
| 架构层（AC-A） | 5 | 全部通过 |
| 基础功能（AC-B） | 4 | 全部通过 |
| Sector 功能（AC-S1~S8） | ~35 | 全部通过 |
| 状态伪类（AC-PS） | 3 | 全部通过 |
| 类名管理（AC-CM） | 2 | 全部通过 |
| 响应式与性能（AC-P） | 4 | 全部通过 |
| 边界情况（AC-E） | 4 | 全部通过 |
| **总计** | **~57** | **全部通过** |

---

## 附：快速验收命令

```bash
# 1. TypeScript 类型检查
npm run type-check

# 2. 构建验证
npm run build

# 3. 搜索旧依赖（应全部无结果）
grep -r "useStyleProps\|useSectors\|StylePropField\|sectorConfig\|reactiveCollection" src/components/WebBuilder/
```
