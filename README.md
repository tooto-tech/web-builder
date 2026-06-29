# WebBuilder Packages

`web-builder` 是 WebBuilder 两个公开 npm 包的源码仓库。

## 包目录

- `packages/webbuilder`：编辑器主入口，包含 core runtime contracts 与 Vue shell。
- `packages/webbuilder-plugins`：插件聚合包，包含 Basic、CMS、i18n、global settings、layout template 和 publisher。

## 常用命令

- 安装依赖：`pnpm install`
- 包源码边界检查：`pnpm guard`
- 运行测试：`pnpm test`
- 构建全部包：`pnpm build`
- 发布前打包检查：`pnpm pack:dry-run`

`b2b-admin` 默认只消费 npm 上发布的 `@toototech/webbuilder` 与 `@toototech/webbuilder-plugins`。修改包源码、构建和发布包时优先在本仓库完成，然后再回到消费端更新依赖版本。
