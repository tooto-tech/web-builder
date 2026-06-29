# Project Rules

## 工作协议

- 本仓库是 `@toototech/webbuilder-*` packages 的源码位置。
- 安装依赖时优先使用 `pnpm`。
- 修改包源码、构建、打包检查和发布都优先在本仓库完成。
- `b2b-admin` 只应消费 npm 发布版本；不要把本仓库源码作为 `b2b-admin` 客户交付内容一起交付。

## 包结构

- 包源码位于 `packages/*`。
- 包构建共享配置位于仓库根目录，包括 `tsconfig.webbuilder-package.json`、`postcss.config.js` 和 `pnpm-workspace.yaml`。
- 不提交 `node_modules/`、`dist/`、`packages/*/dist/` 等生成目录。

## 常用命令

- 安装依赖：`pnpm install`
- 包源码边界检查：`pnpm guard`
- 运行包测试：`pnpm test`
- 构建所有包：`pnpm build`
- 发布前检查：`pnpm pack:dry-run`

## 与 b2b-admin 的关系

- `b2b-admin` 仓库路径：`/Users/zhiyi/Documents/WebstormProjects/B2B-SaaS/b2b-admin`。
- `b2b-admin` 更新包能力时，应先在本仓库发布新的 npm 版本，再更新 admin 的 `package.json` 依赖和 lock 文件。
- 不要在 `b2b-admin` 中新增 package 源码作为长期维护来源。
