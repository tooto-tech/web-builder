<script lang="ts" setup>
import { computed } from 'vue'
import { NInputNumber, NSelect, NSlider } from 'naive-ui'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const units = computed(() => props.property.units ?? [])
const min = computed(() => props.property.min ?? 0)
const max = computed(() => props.property.max ?? 100)
const step = computed(() => props.property.step ?? 1)

const parsed = computed(() => {
  const value = props.modelValue || props.property.default || ''
  const match = value.match(/^(-?(?:\d+\.?\d*|\.\d+))\s*([a-z%]*)$/i)
  if (!match) return { value: undefined as number | undefined, unit: units.value[0] ?? '' }

  return {
    value: Number(match[1]),
    unit: match[2] || units.value[0] || '',
  }
})

const numericValue = computed(() => parsed.value.value ?? min.value)
const unitValue = computed(() => parsed.value.unit || units.value[0] || '')
const unitOptions = computed(() =>
  units.value.map(unit => ({ label: unit || '无', value: unit })),
)

const formatValue = (value: number, unit = unitValue.value) =>
  units.value.length ? `${value}${unit}` : String(value)

const updateValue = (value: number | undefined) => {
  if (value == null || Number.isNaN(value)) {
    emit('update:modelValue', '')
    return
  }

  emit('update:modelValue', formatValue(value))
}

const updateUnit = (unit: string) => {
  emit('update:modelValue', formatValue(numericValue.value, unit))
}
</script>

<template>
  <div class="wb-ctrl-slider">
    <NSlider
      class="wb-ctrl-slider__range"
      :value="numericValue"
      :min="min"
      :max="max"
      :step="step"
      :tooltip="false"
      @update:value="(value) => updateValue(Number(value))"
    />

    <div class="wb-ctrl-slider__fields">
      <NInputNumber
        class="wb-ctrl-slider__number"
        :value="numericValue"
        :min="min"
        :max="max"
        :step="step"
        button-placement="right"
        size="small"
        @update:value="(value) => updateValue(value ?? undefined)"
      />
      <NSelect
        v-if="units.length"
        class="wb-ctrl-slider__unit"
        :value="unitValue"
        :options="unitOptions"
        size="small"
        @update:value="(value) => updateUnit(String(value ?? ''))"
      />
    </div>
  </div>
</template>

<style scoped>
.wb-ctrl-slider {
  display: grid;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.wb-ctrl-slider__range {
  margin: 0 6px;
}

.wb-ctrl-slider__fields {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.wb-ctrl-slider__number {
  flex: 1 1 auto;
  min-width: 0;
}

.wb-ctrl-slider__unit {
  flex: 0 0 70px;
}
</style>
