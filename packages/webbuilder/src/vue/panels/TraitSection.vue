<script setup lang="ts">
import { NCheckbox, NInput, NInputNumber, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { TraitsProvider } from '@tootix/grapesjs-vue'

import { FieldWrapper, WbColorPicker } from '../controls/fields'
import { normalizeTraitRows } from './adapters/useTraitRows.js'
import TraitCodeField from './trait-fields/TraitCodeField.vue'
import TraitImagePickerField from './trait-fields/TraitImagePickerField.vue'
import TraitPageLinkField from './trait-fields/TraitPageLinkField.vue'
import TraitSvgIconField from './trait-fields/TraitSvgIconField.vue'

const toSelectOptions = (
  options: Array<{ label: string, value: string }>,
): SelectOption[] =>
  options.map(option => ({
    label: option.label,
    value: option.value,
  }))
</script>

<template>
  <TraitsProvider v-slot="{ traits }">
    <section
      v-if="normalizeTraitRows(traits).length"
      class="wb-trait-section"
      data-testid="wb-trait-section"
    >
      <div class="wb-trait-section__title">Properties</div>

      <FieldWrapper
        v-for="row in normalizeTraitRows(traits)"
        :key="row.id"
        :label="row.label"
        layout="stacked"
      >
        <NInput
          v-if="row.type === 'text'"
          :value="String(row.value ?? '')"
          size="small"
          @update:value="row.setValue"
        />
        <NInputNumber
          v-else-if="row.type === 'number'"
          :value="Number(row.value || 0)"
          size="small"
          button-placement="right"
          @update:value="(value) => row.setValue(value ?? 0)"
        />
        <NSelect
          v-else-if="row.type === 'select'"
          :value="String(row.value ?? '')"
          :options="toSelectOptions(row.options)"
          size="small"
          @update:value="(value) => row.setValue(String(value ?? ''))"
        />
        <NCheckbox
          v-else-if="row.type === 'checkbox'"
          :checked="Boolean(row.value)"
          @update:checked="row.setValue"
        />
        <TraitImagePickerField
          v-else-if="row.kind === 'image'"
          :row="row"
        />
        <TraitPageLinkField
          v-else-if="row.kind === 'page-link'"
          :row="row"
        />
        <TraitCodeField
          v-else-if="row.kind === 'code'"
          :row="row"
        />
        <TraitSvgIconField
          v-else-if="row.kind === 'svg-icon'"
          :row="row"
        />
        <WbColorPicker
          v-else-if="row.kind === 'color'"
          :model-value="String(row.value ?? '')"
          @update:model-value="row.setValue"
          @clear="row.setValue('')"
        />
        <NInput
          v-else
          :value="String(row.value ?? '')"
          size="small"
          @update:value="row.setValue"
        />
      </FieldWrapper>
    </section>
  </TraitsProvider>
</template>

<style scoped>
.wb-trait-section {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px;
}

.wb-trait-section__title {
  margin-bottom: 8px;
  color: #4b5563;
  font-size: 11px;
  font-weight: 600;
}
</style>
