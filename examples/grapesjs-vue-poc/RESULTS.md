# P0 PoC 验证结果（@tootix/grapesjs-vue@0.0.2）

- **日期**：2026-07-02
- **环境**：grapesjs 0.23.1（精确锁定）、vue 3.5.12、vite 5.1.4、vue-tsc 1.8（仓库根）
- **验证方式**：本目录 dev server + Playwright 实机操作 + dist 源码阅读 + vue-tsc
- **计划**：`docs/superpowers/plans/2026-07-02-p0-grapesjs-vue-poc.md`

## 验证矩阵

| # | 验证项 | 结果 | 备注 / workaround |
|---|---|---|---|
| 1 | 安装与 peer 兼容 | ✅ 通过 | 无 peer 冲突（grapesjs 0.23.1 满足 `>=0.22.16`）。附带发现：pnpm 10.28 不再读 package.json 的 `pnpm.overrides`，grapesjs 版本锁需迁至 `pnpm-workspace.yaml` |
| 2 | 类型链路（vue-tsc/IDE） | ✅ 通过（1 个轻量 workaround） | vue-tsc 全绿；唯一缺口：`PluginTypeToLoad` 联合类型未含 `PluginDescriptor`（运行时实际接受）→ cast 解决。`.vue.d.ts` 解析正常 |
| 3 | StylesProvider 数据形状 | ✅ 通过 | 返回 grapesjs `Sector[]`（`getId()`/`getProperties()`），随选中目标响应（未选中 6 sectors → 选中 h1 变 5）。注意：admin UI 实际不消费 grapesjs sectors，而是自有 `WbStyleProperty` 配置 + `WbStyleManager` 接口 → 适配层模式已验证可行（见 #5） |
| 4 | WbCtrl 复用改动量 | ✅ 通过（零逻辑改动） | `WbCtrlColor`/`WbCtrlSpacing`/`SpacingControl`/`WbColorPicker`/`FieldWrapper`/`wbStyleSectors`/`globalSettingsPrimitives`/`globalSettingsHostDeps` 全部**原样拷贝**。所需配套：2 条精确 vite alias（`@/components/WebBuilder/utils/*` 重定向）、sass devDep（WbColorPicker 用 scss）、`useWbStyleManager` 类型 shim（只拷接口不拷实现）。`useGlobalSettingsHostDeps` 自带 fallback，无需 stub |
| 5 | WbStyleManager 适配层（useEditor） | ✅ 通过 | `adapters/useWbStyleManagerAdapter.ts`（约 80 行）基于 `useEditor()` + 组件事件实现接口；读值（选中 h1 → 颜色显示 `#111827`、切换到 p → `#6b7280`）、写回（padding-top 60px、color `#e11d48`）双向实测通过，画布实时更新 |
| 6 | plugins prop 接受 descriptor / 时序早于 ready | ✅ 通过 | `createGrapesPluginDescriptor` 产物直传 `plugins` prop：运行时被接受（grapesjs `config.plugins` 接受 descriptor），激活顺序 `probe activated → @editor → @ready`，满足 feature-plugin init 期激活语义。卸载重挂后同样成立 |
| 7 | 插件错误行为 | ⚠️ 明确（需 P1 设计应对，非阻断） | 函数插件抛错 → 错误从 `grapesjs.init()` 冒泡，**整个编辑器不渲染**、`@editor`/`@ready` 不触发；grapesjs-vue 不吞函数插件错误。另：`{id, src}` 形式的远程插件加载失败会被 grapesjs-vue **静默吞掉**（dist 源码 `catch { continue }`）。→ P1 诊断层需在 descriptor 外包容错（catch → activation diagnostics），避免单个非核心插件拖垮 init |
| 8 | 多 Provider 并存 | ✅ 通过 | Styles + Devices + Blocks 三 Provider（跨 2 个 `WithEditor` 区域）并存无冲突；设备切换实测（tablet → canvas 768px）；probe 插件 `Blocks.add` 的区块经 `mapCategoryBlocks` 分类渲染，`Blocks.get().getContent()` 插入路径通 |
| 9 | @update projectData | ✅ 通过 | 组件样式修改后 `@update` 触发，携带完整 projectData（含 pages），与 `editor.getProjectData()` 一致 |
| 10 | 卸载销毁 / 重挂载 | ✅ 通过（1 个上游行为需注意） | GjsEditor 卸载时自动 `off('update')` + `editor.destroy()`，DOM/iframe 清除；重挂载后 probe 重新激活、编辑器功能正常、无重复实例错误。**注意**（grapesjs core 行为，非本库缺陷）：`editor.destroy()` 不会执行各插件返回的 cleanup（仅显式 `Plugins.remove(id)` 才触发）→ P1 的 `WebBuilderEditor` 需监听 `destroy` 事件或在卸载前逐个 remove，保证 feature-plugin cleanup 语义 |

## 源码级发现（dist 阅读）

- `plugins` prop 元素两种形态：`{id, src}` → 动态脚本加载（失败静默跳过）；其余 truthy 值 → 原样并入 grapesjs `config.plugins`。
- 使用 `<Canvas>` 后自动 `customUI: true` + `panels.defaults: []`；各 Provider 挂载会将对应 manager 设为 `custom: true`（StylesProvider → styleManager、BlocksProvider → blockManager 等），即 grapesjs 原生面板 UI 被关闭、完全交给 Vue 层。
- `@ready` 基于 `editor.onReady`；`@update` 基于 `editor.on('update')` 并回传 `getProjectData()`。
- 卸载序列：`off('update')` → `destroy()` → `setEditor(undefined)`。

## 阻断项 / workaround 计数

- **阻断项：0**
- **workaround：2（均轻量）**
  1. `PluginDescriptor` 类型 cast（一行）；
  2. P1 需自行处理插件容错 + destroy 期 cleanup（本就属于 P1 `WebBuilderEditor` 的诊断/生命周期职责，实现点明确）。

## 结论建议

按 P0 计划 Task 5 判据（阻断=0，workaround≤2 且轻量）→ **A：锁版本直用 `@tootix/grapesjs-vue@0.0.2`**。
后续若上游修复 `PluginTypeToLoad` 类型或需要改其行为（如 `{id,src}` 静默失败），再评估切换到 fork（MIT，`github.com/navnry/grapesjs-vue`），切换成本低（API 面已被适配层隔离）。
