import type { Component } from 'vue'

import AssetsManager from './AssetsManager.vue'
import AssetsModalHost from './AssetsModalHost.vue'
import AssetsPanel from './AssetsPanel.vue'
import BlocksPanel from './BlocksPanel.vue'
import LayersPanel from './LayersPanel.vue'
import ModalHost from './ModalHost.vue'
import StylePanel from './StylePanel.vue'

const BUILTIN_PANEL_COMPONENTS: Record<string, Component> = {
  blocks: BlocksPanel,
  styles: StylePanel,
  layers: LayersPanel,
  assets: AssetsPanel,
}

export const getBuiltinPanelComponent = (panelId: string): Component | null =>
  BUILTIN_PANEL_COMPONENTS[panelId] ?? null

export { AssetsManager, AssetsModalHost, ModalHost }
