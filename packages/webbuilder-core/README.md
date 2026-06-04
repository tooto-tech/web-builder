# @tooto-tech/webbuilder-core

Core WebBuilder package for plugin loading and editor-facing primitives.

## Public API

Use only the package exports declared in `package.json`:

```ts
import {
  deriveGlobalNames,
  loadPluginFromCode,
  loadPluginFromUrl,
} from '@tooto-tech/webbuilder-core'
```

Internal `src/*` paths are not public API.
