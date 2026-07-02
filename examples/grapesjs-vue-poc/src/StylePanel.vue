<script setup lang="ts">
/**
 * PoC 样式面板：
 * - StylesProvider 验证 sectors 响应式（选中联动）
 * - 复用 admin 的 WbCtrlColor / WbCtrlSpacing（零逻辑改动），
 *   数据源 = useWbStyleManagerAdapter（基于 useEditor 实现）
 */
import { computed } from 'vue'
import { StylesProvider } from '@tootix/grapesjs-vue'
import WbCtrlColor from './vendor/components/style-controls/WbCtrlColor.vue'
import WbCtrlSpacing from './vendor/components/style-controls/WbCtrlSpacing.vue'
import { WB_STYLE_SECTOR_MAP, type WbStyleProperty } from './vendor/config/wbStyleSectors'
import { useWbStyleManagerAdapter } from './adapters/useWbStyleManagerAdapter'

const styleManager = useWbStyleManagerAdapter()

// 从 admin 真实 sector 配置取 property 定义（保真度验证）
const colorProperty: WbStyleProperty = { id: 'color', label: '文字颜色', type: 'color' }
const paddingProperty = computed<WbStyleProperty | null>(() => {
  for (const sector of Object.values(WB_STYLE_SECTOR_MAP)) {
    const hit = sector.properties.find(p => p.id === 'padding')
    if (hit) return hit
  }
  return null
})

const colorValue = computed(() => styleManager.getValue('color'))
</script>

<template>
  <div class="tw-p-3 tw-space-y-4 tw-text-sm" data-testid="style-panel">
    <div v-if="!styleManager.hasSelection.value" class="tw-text-gray-400" data-testid="no-selection">
      未选中组件
    </div>

    <template v-else>
      <div data-testid="ctrl-color">
        <div class="tw-mb-1 tw-text-xs tw-text-gray-500">{{ colorProperty.label }}</div>
        <WbCtrlColor
          :property="colorProperty"
          :model-value="colorValue"
          @update:model-value="(v: string) => styleManager.setValue('color', v)"
        />
      </div>

      <div v-if="paddingProperty" data-testid="ctrl-spacing">
        <div class="tw-mb-1 tw-text-xs tw-text-gray-500">{{ paddingProperty.label }}</div>
        <WbCtrlSpacing :property="paddingProperty" :style-manager="styleManager" />
      </div>
    </template>

    <!-- StylesProvider sectors 响应式探针 -->
    <StylesProvider v-slot="{ sectors }">
      <details class="tw-border-t tw-pt-2">
        <summary class="tw-text-xs tw-text-gray-400 tw-cursor-pointer">
          StylesProvider sectors: <span data-testid="sector-count">{{ sectors.length }}</span>
        </summary>
        <ul class="tw-text-xs tw-text-gray-500 tw-mt-1" data-testid="sector-list">
          <li v-for="s in sectors" :key="s.getId()">
            {{ s.getId() }} ({{ s.getProperties().length }} props)
          </li>
        </ul>
      </details>
    </StylesProvider>
  </div>
</template>
