<script setup lang="ts">
import { computed } from 'vue'
import type { WebBuilderPanelContribution } from '../core/index.js'

interface Props {
  panels: WebBuilderPanelContribution[]
  activePanelId?: string | null
}

const props = defineProps<Props>()

const activePanelContribution = computed(() =>
  props.panels.find(panel => panel.id === props.activePanelId && panel.component) ?? null,
)

const activePanelProps = computed(() => {
  const contributionProps = activePanelContribution.value?.props
  if (typeof contributionProps === 'function') return contributionProps()
  return contributionProps ?? {}
})
</script>

<template>
  <component
    :is="activePanelContribution.component"
    v-if="activePanelContribution"
    v-bind="activePanelProps"
  />
</template>
