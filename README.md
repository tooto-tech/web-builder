# WebBuilder Packages

`web-builder` 是 `@toototech/webbuilder-*` 包源码仓库。

## 包目录

- `packages/webbuilder-core`
- `packages/webbuilder-vue`
- `packages/webbuilder-i18n`
- `packages/webbuilder-global-settings`
- `packages/webbuilder-layout-template`
- `packages/webbuilder-components-basic`
- `packages/webbuilder-components-cms`
- `packages/webbuilder-publisher`

## 常用命令

- 安装依赖：`pnpm install`
- 包源码边界检查：`pnpm guard`
- 运行测试：`pnpm test`
- 构建全部包：`pnpm build`
- 发布前打包检查：`pnpm pack:dry-run`

`b2b-admin` 默认只消费 npm 上发布的 `@toototech/webbuilder-*` 版本。修改包源码、构建和发布包时优先在本仓库完成，然后再回到 `b2b-admin` 更新依赖版本。
