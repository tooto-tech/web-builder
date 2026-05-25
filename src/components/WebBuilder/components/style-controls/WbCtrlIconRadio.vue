<script lang="ts" setup>
import { computed } from 'vue'
import FieldIconSelect from '../fields/FieldIconSelect.vue'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const iconOptions = computed(
  () =>
    (props.property.options ?? []) as Array<{ value: any; label: string; icon?: string }>,
)
</script>

<template>
  <FieldIconSelect
    :model-value="props.modelValue"
    :options="iconOptions"
    @update:model-value="(v) => emit('update:modelValue', String(v ?? ''))"
  />
</template>
