# @tooto-tech/web-builder

Dist-only WebBuilder package for Tooto admin applications.

This package is published without TypeScript/Vue source files or sourcemaps. Public browser assets can still be inspected and reverse engineered, so sensitive business logic must stay on the server side.

## Install

```sh
pnpm add @tooto-tech/web-builder
```

The host application must provide the peer dependencies declared by this package: `vue`, `pinia`, `vue-router`, and `element-plus`.

## Usage

```ts
import { WebBuilder } from '@tooto-tech/web-builder'
import '@tooto-tech/web-builder/style.css'
```

Render the editor with a resource identity and host adapters:

```vue
<template>
  <WebBuilder :resource="resource" :adapters="webBuilderAdapters" />
</template>
```

The host application owns API, auth, upload, tenant, and routing behavior through the `WebBuilderAdapters` contract. Keep those adapters in the host app so the package does not import host-internal source paths.

## Published Files

Only these files are included in the npm package:

- `dist/index.js`
- `dist/style.css`
- `dist/types/index.d.ts`
- `LICENSE`
- `README.md`
- `package.json`

The package intentionally excludes:

- `src/`
- `.vue`
- `.ts` implementation files
- source maps
- development notes and mirrored GrapesJS docs

## Release

Run these checks before publishing:

```sh
pnpm test
pnpm build
pnpm pack:dry
pnpm publish:dry
```

Publish with:

```sh
pnpm publish:public
```

After publishing, change the host application dependency from local workspace mode:

```json
"@tooto-tech/web-builder": "workspace:*"
```

to the published version:

```json
"@tooto-tech/web-builder": "0.0.1"
```

Then run `pnpm install` and the host build again.

In the host repository, `pnpm build:web-builder` is intentionally conditional. It builds the local workspace package only while the dependency is `workspace:*`; after the dependency is changed to a published version it skips local package compilation, so the host source delivery does not need to include `packages/web-builder`.

## Rollback

Rollback is a host dependency change: set `@tooto-tech/web-builder` back to the last known good published version, run `pnpm install`, and rebuild the host app.
