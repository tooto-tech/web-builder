# 五新科技 WebBuilder 组件插件设计

## 背景

为五新科技租户提供专属 WebBuilder 组件列表插件。首版只实现截图中的品牌 Navbar，后续五新专属区块继续放入同一包中扩展。

## 推荐方案

新增独立源码包 `@tooto-tech/webbuilder-components-uniroc`，但首版交付不要求发布 npm。该包构建出可通过 WebBuilder 插件管理器安装的 JS 文件，同时保留 package 源码边界，方便后续维护和打包。

该包提供：

- `createUnirocComponentsPlugin()`：WebBuilder feature plugin 工厂。
- `registerUnirocPublisherComponents()`：发布侧 GrapesJS 组件注册入口。
- `navbar-uniroc`：五新科技 Navbar 组件类型。
- “五新科技” block pack：首版包含一个 Navbar block。
- `unirocComponentsPlugin`：可安装 JS bundle 的默认导出，形态为 GrapesJS plugin function。

不把五新品牌组件放入 `webbuilder-components-basic`，也不在 `b2b-admin` 中新增长期组件源码。`b2b-admin` 只允许做动态插件安装能力的宿主适配，不承载五新组件源码。

## JS 文件安装

首版支持通过现有“插件管理 -> GrapesJS 插件 -> 插件 URL”安装：

- ESM bundle：默认导出 `(editor, options) => cleanup | void`。
- UMD/IIFE bundle：全局变量名建议为 `WebBuilderUnirocComponents`。
- 插件安装后注册 `navbar-uniroc` 组件类型，并贡献一个“五新科技”组件列表 block。

当前 WebBuilder 的 `BlocksPanel` 不再直接合并 GrapesJS `BlockManager`，而是读取 WebBuilder block pack。因此仅在 JS 插件中调用 `editor.Blocks.add` 不足以让组件进入左侧组件列表。

为满足“JS 文件安装即可”，实现需要补充一个轻量宿主契约：动态插件函数可携带 `webBuilder.blockPacks` 元数据，`useDynamicPlugins` 读取已安装动态插件的 block packs，并合并到 `BlocksPanel.extensionPacks`。该改动属于通用动态插件能力，不包含五新组件源码。

推荐的 JS 插件形态：

```ts
const unirocComponentsPlugin = (editor, options) => {
  registerUnirocComponents(editor, options)
  return () => unregisterIfNeeded(editor)
}

unirocComponentsPlugin.webBuilder = {
  blockPacks: [
    {
      id: 'uniroc-components',
      label: '五新科技',
      blocks: [
        {
          id: 'uniroc-navbar',
          label: 'Navbar',
          category: 'tenant',
          media: 'lucide:menu',
          content: { type: 'navbar-uniroc' },
          componentTypes: ['navbar-uniroc'],
        },
      ],
    },
  ],
}

export default unirocComponentsPlugin
```

## 插件边界

插件 ID 为 `uniroc-components`，能力 ID 为 `webbuilder:uniroc-components`。

组件加载和插入分离：

- `loadComponentTypes`: `['navbar-uniroc']`，保证已有页面包含该类型时可加载。
- `insertComponentTypes`: `['navbar-uniroc']`，用于 block 面板插入权限过滤。
- `activateWhen`: 用户拥有 `webbuilder:uniroc-components` 或 `webbuilder:*` 时激活；已有项目使用 `navbar-uniroc` 时也会由 `loadComponentTypes` 激活。

block 可见性仍由宿主 capability adapter 控制。普通用户需要 `webbuilder:insert:navbar-uniroc` 或插入通配能力；超级管理员通过现有 `webbuilder:*`/角色逻辑可见。

通过 JS 插件管理器安装时，插件启用状态本身就是显示开关。若宿主同时提供 capability snapshot，则动态 block pack 合并时仍应按 `componentTypes` 过滤；若无 capability 上下文，则以“已安装即显示”为首版规则。

## Navbar 组件

默认结构复刻截图：

- 左侧搜索图标。
- 中间区域分布导航项：`SOLUTIONS`、`SERVICES`、`CASE`、`NEWS`、`INVESTOR RELATIONS`、`ABOUT`。
- 页面中轴放置 `UNIROC` logo。
- 右侧橙色 `Contact Us ->` CTA。
- 桌面端高度约 88px，白色背景，外层可作为 header 放在页面顶部。
- 移动端折叠为 logo、搜索按钮和 hamburger 菜单；菜单展开后展示静态导航项和 CTA。

首版菜单为静态可编辑，不接 CMS 菜单树。

## 可编辑属性

根组件 traits：

- `logoText`：默认 `UNIROC`。
- `logoHref`：默认 `/`。
- `menuItemsJson`：JSON 数组，包含 `label`、`href`、`hasDropdown`。
- `ctaText`：默认 `Contact Us`。
- `ctaHref`：默认 `/contact`。
- `height`：默认 `88`。
- `backgroundColor`：默认 `#ffffff`。
- `textColor`：默认 `#121212`。
- `accentColor`：默认 `#ff9200`。

实现时通过 attributes 和 CSS custom properties 同步视觉配置，避免生成大量不可控内联样式。

## 发布与预览

编辑器和 publisher 使用同一组件注册函数，确保画布预览、保存项目数据和 headless publisher 识别同一 `navbar-uniroc` 类型。

Navbar 脚本只处理移动菜单开关，不依赖宿主 API、CMS 数据或浏览器全局业务对象。发布侧入口不得引入 editor-only Vue 组件。

## 包结构

预期目录：

```text
packages/webbuilder-components-uniroc/
  package.json
  README.md
  LICENSE
  tsconfig.build.json
  src/
    index.ts
    plugin.ts
    grapesPlugin.ts
    publisher.ts
    vite.config.ts
    registries/
      navigation/
        navbar/
          index.ts
          script.ts
          style.ts
```

## 测试与验收

新增 focused tests：

- plugin 工厂暴露正确 ID、能力、load/insert component type 和 publisher marker。
- block pack 在 `canInsertComponentType('navbar-uniroc')` 为 true 时包含 Navbar block，为 false 时过滤为空。
- publisher registry 注册 `navbar-uniroc`，默认组件包含 logo、菜单项、CTA 和移动菜单必要结构。

验收命令：

- `pnpm --filter @tooto-tech/webbuilder-components-uniroc build`
- `pnpm --filter @tooto-tech/webbuilder-components-uniroc test`（如该包配置独立测试脚本）
- 或仓库级 `pnpm test` 覆盖新增 spec。
- 在 WebBuilder 插件管理器中通过 JS URL 安装 bundle 后，“组件”列表出现“五新科技 / Navbar”，点击或拖拽可插入 Navbar。

## 暂不包含

- 不接 CMS 菜单树。
- 不新增后台接口或租户 entitlement API。
- 不发布 npm 作为首版交付要求。
- 不在 `b2b-admin` 中新增五新组件源码。
- 不实现截图之外的五新页面区块。
