import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8')

describe('WebBuilder assets manager package contract', () => {
  it('exposes host-managed media asset operations in core host services', () => {
    const source = readSource('packages/webbuilder/src/core/hostServices.ts')

    expect(source).toContain('export interface MediaAssetRecord')
    expect(source).toContain('export interface MediaAssetPage')
    expect(source).toContain('deleteAsset?:')
    expect(source).toContain('loadAssets?: (params?: MediaAssetQuery)')
    expect(source).toContain('uploadAssets?: (files: File[], params?: MediaAssetUploadOptions)')
  })

  it('uses a package-owned assets manager UI instead of exposing raw GrapesJS assets directly', () => {
    const assetsManagerPath = 'packages/webbuilder/src/vue/panels/AssetsManager.vue'
    const source = readSource(assetsManagerPath)

    expect(existsSync(resolve(process.cwd(), assetsManagerPath))).toBe(true)
    expect(source).toContain('mediaService.loadAssets')
    expect(source).toContain('mediaService.uploadAssets')
    expect(source).toContain('mediaService.deleteAsset')
    expect(source).toContain("emit('select'")
    expect(source).not.toContain('AssetsProvider')
    expect(source).not.toContain('NDrawer')
  })

  it('wires GrapesJS custom asset manager through the shared modal host', () => {
    const webBuilderSource = readSource('packages/webbuilder/src/vue/WebBuilder.vue')
    const modalHostSource = readSource('packages/webbuilder/src/vue/panels/AssetsModalHost.vue')

    expect(webBuilderSource).toContain('AssetsModalHost')
    expect(webBuilderSource).not.toContain("activeEditor.on('asset:custom'")
    expect(webBuilderSource).not.toContain('assetsPickerVisible')
    expect(modalHostSource).toContain('AssetsProvider')
    expect(modalHostSource).toContain('NModal')
    expect(modalHostSource).toContain('<AssetsManager')
    expect(modalHostSource).toContain('normalizeMediaAssetRecord')
    expect(modalHostSource).toContain('syncMediaAssetToEditor')
  })
})
