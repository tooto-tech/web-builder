<script lang="ts" setup>
import { computed } from 'vue'
import { NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

const props = withDefaults(
  defineProps<{
    property: WbStyleProperty
    modelValue: string
    teleported?: boolean
  }>(),
  { teleported: true },
)

const options = computed<SelectOption[]>(() =>
  (props.property.options ?? []).map(option => ({
    label: option.label,
    value: option.value,
  })),
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <NSelect
    size="small"
    class="w-full"
    clearable
    :to="teleported ? 'body' : false"
    :value="modelValue"
    :options="options"
    :placeholder="property.default ?? '默认'"
    @update:value="(v) => emit('update:modelValue', String(v ?? ''))"
  />
</template>
