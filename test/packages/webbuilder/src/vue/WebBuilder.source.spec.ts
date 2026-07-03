import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const webBuilderSource = readFileSync(
  fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/WebBuilder.vue', import.meta.url)),
  'utf-8',
)
const webBuilderShellSource = readFileSync(
  fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/WebBuilderShell.vue', import.meta.url)),
  'utf-8',
)
const blocksPanelSource = readFileSync(
  fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/panels/BlocksPanel.vue', import.meta.url)),
  'utf-8',
)
const blocksPanelContentSource = readFileSync(
  fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/panels/BlocksPanelContent.vue', import.meta.url)),
  'utf-8',
)
const panelsIndexSource = readFileSync(
  fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/panels/index.ts', import.meta.url)),
  'utf-8',
)
const deviceSwitcherSource = readFileSync(
  fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/DeviceSwitcher.vue', import.meta.url)),
  'utf-8',
)
const vueIndexSource = readFileSync(
  fileURLToPath(new URL('../../../../../packages/webbuilder/src/vue/index.ts', import.meta.url)),
  'utf-8',
)

describe('WebBuilder default panels', () => {
  it('renders package-owned panels through host-overridable slot fallbacks', () => {
    expect(webBuilderSource).toContain('getBuiltinPanelComponent')
    expect(webBuilderSource).toContain('ModalHost')
    expect(webBuilderSource).toContain('AssetsModalHost')
    expect(webBuilderSource).toContain('<slot')
    expect(webBuilderSource).toContain('name="rail"')
    expect(webBuilderSource).toContain('name="side-panel"')
    expect(webBuilderSource).toContain('<component')
    expect(webBuilderSource).toContain('builtinPanelFor(activePanel)')
    expect(panelsIndexSource).toContain('blocks: BlocksPanel')
    expect(panelsIndexSource).toContain('AssetsModalHost')
    expect(webBuilderSource).not.toContain('No panel provider is registered.')
  })

  it('uses grapesjs-vue BlocksProvider drag helpers for block insertion', () => {
    expect(blocksPanelSource).toContain("import { BlocksProvider } from '@tootix/grapesjs-vue'")
    expect(blocksPanelSource).toContain('mapCategoryBlocks')
    expect(blocksPanelSource).toContain('<BlocksPanelContent')
    expect(blocksPanelContentSource).toContain('dragStart(block, event)')
    expect(blocksPanelContentSource).toContain('dragStop()')
  })

  it('uses DevicesProvider for device selection', () => {
    expect(deviceSwitcherSource).toContain("import { DevicesProvider } from '@tootix/grapesjs-vue'")
    expect(deviceSwitcherSource).toContain('<DevicesProvider')
    expect(webBuilderSource).not.toContain(':devices="devices"')
    expect(webBuilderSource).not.toContain(':selected-device="selectedDevice"')
  })

  it('renders the side panel divider without relying on Tailwind preflight border defaults', () => {
    expect(webBuilderShellSource).toContain('tw-border-r')
    expect(webBuilderShellSource).toContain('tw-border-solid')
    expect(webBuilderShellSource).toContain('tw-border-[color:var(--wb-drop-idle-border)]')
  })

  it('hides the top bar and panel rail while preview mode is active', () => {
    const topBarSlotIndex = webBuilderShellSource.indexOf('<slot name="top-bar"></slot>')
    const railSlotIndex = webBuilderShellSource.indexOf('<slot name="rail"></slot>')
    const canvasSlotIndex = webBuilderShellSource.indexOf('<slot name="canvas"></slot>')
    const topBarPreviewGuardIndex = webBuilderShellSource.lastIndexOf('v-show="!isPreviewMode"', topBarSlotIndex)
    const topBarContentsWrapperIndex = webBuilderShellSource.lastIndexOf('class="tw-contents"', topBarSlotIndex)
    const previewGuardIndex = webBuilderShellSource.lastIndexOf('v-show="!isPreviewMode"', railSlotIndex)
    const contentsWrapperIndex = webBuilderShellSource.lastIndexOf('class="tw-contents"', railSlotIndex)

    expect(topBarSlotIndex).toBeGreaterThan(-1)
    expect(railSlotIndex).toBeGreaterThan(-1)
    expect(canvasSlotIndex).toBeGreaterThan(railSlotIndex)
    expect(topBarPreviewGuardIndex).toBeGreaterThan(-1)
    expect(topBarContentsWrapperIndex).toBeGreaterThan(topBarPreviewGuardIndex)
    expect(previewGuardIndex).toBeGreaterThan(-1)
    expect(contentsWrapperIndex).toBeGreaterThan(previewGuardIndex)
  })

  it('exports package-owned panels and controls for slot overrides', () => {
    expect(vueIndexSource).toContain("export * from './panels/index.js'")
    expect(vueIndexSource).toContain("export * from './controls/index.js'")
  })

  it('wires package-owned controllers into WebBuilder context and top bar actions', () => {
    expect(webBuilderSource).toContain('useDraftController')
    expect(webBuilderSource).toContain('useAutosaveController')
    expect(webBuilderSource).toContain('usePublishController')
    expect(webBuilderSource).toContain('useLockController')
    expect(webBuilderSource).toContain('useRevisionController')
    expect(webBuilderSource).toContain('get controllers()')
    expect(webBuilderSource).toContain("event: 'save-success'")
    expect(webBuilderSource).toContain("event: 'publish-success'")
    expect(webBuilderSource).toContain("event: 'lock-changed'")
    expect(webBuilderSource).toContain('@save-draft="handleSaveDraft"')
    expect(webBuilderSource).toContain('@publish="handlePublish"')
  })

  it('wires host storage and session options into package controllers', () => {
    expect(webBuilderSource).toContain('const storageOptions = computed(() => resolvedOptions.value.storage)')
    expect(webBuilderSource).toContain('const sessionOptions = computed(() => resolvedOptions.value.session)')
    expect(webBuilderSource).toContain('const isSelfStorageOptions = (')
    expect(webBuilderSource).toContain('storage: storageOptions.value')
    expect(webBuilderSource).toContain('getSessionKey: sessionOptions.value?.getSessionKey')
    expect(webBuilderSource).toContain('isSelfStorageOptions(storageOptions.value)')
    expect(webBuilderSource).toContain('storageOptions.value.autosaveChanges')
    expect(webBuilderSource).not.toContain('if (resolvedOptions.value.hostServices.page?.getDraft) {')
    expect(webBuilderSource).not.toContain('if (!resolvedOptions.value.hostServices.page?.saveDraft) {')
  })

  it('wires the component border toggle to the GrapesJS outline command', () => {
    expect(webBuilderSource).toContain("const COMPONENT_OUTLINE_COMMAND = 'core:component-outline'")
    expect(webBuilderSource).toContain('const handleToggleBorders = () =>')
    expect(webBuilderSource).toContain('showBorders.value = activeEditor.Commands.isActive(COMPONENT_OUTLINE_COMMAND)')
    expect(webBuilderSource).toContain('const nextShowBorders = !showBorders.value')
    expect(webBuilderSource).toContain('activeEditor.runCommand(COMPONENT_OUTLINE_COMMAND)')
    expect(webBuilderSource).toContain('activeEditor.stopCommand(COMPONENT_OUTLINE_COMMAND)')
    expect(webBuilderSource).toContain('@toggle-borders="handleToggleBorders"')
    expect(webBuilderSource).not.toContain('const nextShowBorders = !activeEditor.Commands.isActive(COMPONENT_OUTLINE_COMMAND)')
    expect(webBuilderSource).not.toContain('@toggle-borders="showBorders = !showBorders"')
  })
})
