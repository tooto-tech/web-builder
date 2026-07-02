<script lang="ts" setup>
import { computed } from 'vue'
import { NTab, NTabs } from 'naive-ui'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const options = computed(() =>
  (props.property.options ?? []).map(option => ({
    label: option.label,
    value: option.value,
  })),
)
</script>

<template>
  <NTabs
    class="wb-ctrl-radio"
    :value="modelValue || property.default || ''"
    type="segment"
    size="small"
    animated
    @update:value="(value) => emit('update:modelValue', String(value ?? ''))"
  >
    <NTab
      v-for="option in options"
      :key="option.value"
      :name="option.value"
      :tab="option.label"
    />
  </NTabs>
</template>

<style scoped>
.wb-ctrl-radio {
  width: 100%;
  min-width: 0;
}

.wb-ctrl-radio :deep(.n-tabs-tab) {
  min-width: 0;
}

.wb-ctrl-radio :deep(.n-tabs-tab__label) {
  justify-content: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
