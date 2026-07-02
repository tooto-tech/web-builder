import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

function readPackageJson(path: string) {
  return JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf-8'))
}

describe('package manifests', () => {
  it('keeps @toototech/webbuilder subpath types resolvable for legacy node module resolution', () => {
    const manifest = readPackageJson('../../../../packages/webbuilder/package.json')

    expect(manifest.exports['./core'].types).toBe('./dist/core/index.d.ts')
    expect(manifest.typesVersions).toMatchObject({
      '*': {
        core: ['dist/core/index.d.ts'],
      },
    })
  })

  it('keeps @toototech/webbuilder-plugins subpath types resolvable for legacy node module resolution', () => {
    const manifest = readPackageJson('../../../../packages/webbuilder-plugins/package.json')

    expect(manifest.typesVersions).toMatchObject({
      '*': {
        basic: ['dist/components-basic/index.d.ts'],
        cms: ['dist/components-cms/index.d.ts'],
        i18n: ['dist/localization/index.d.ts'],
        'global-settings': ['dist/global-settings/index.d.ts'],
        'layout-template': ['dist/layout-templates/index.d.ts'],
        publisher: ['dist/publishing/index.d.ts'],
        vue: ['dist/vue-components.d.ts'],
      },
    })
  })
})
