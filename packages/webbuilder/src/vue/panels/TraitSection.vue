<script setup lang="ts">
import { ElCheckbox, ElInput, ElInputNumber, ElOption, ElSelect } from 'element-plus'
import { TraitsProvider } from '@tootix/grapesjs-vue'

import { FieldWrapper, WbColorPicker } from '../controls/fields'
import { normalizeTraitRows } from './adapters/useTraitRows.js'
import TraitCodeField from './trait-fields/TraitCodeField.vue'
import TraitImagePickerField from './trait-fields/TraitImagePickerField.vue'
import TraitPageLinkField from './trait-fields/TraitPageLinkField.vue'
import TraitSvgIconField from './trait-fields/TraitSvgIconField.vue'
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
        <ElInput
          v-if="row.type === 'text'"
          :model-value="String(row.value ?? '')"
          size="small"
          @update:model-value="row.setValue"
        />
        <ElInputNumber
          v-else-if="row.type === 'number'"
          :model-value="Number(row.value || 0)"
          size="small"
          controls-position="right"
          @update:model-value="row.setValue"
        />
        <ElSelect
          v-else-if="row.type === 'select'"
          :model-value="String(row.value ?? '')"
          size="small"
          @update:model-value="row.setValue"
        >
          <ElOption
            v-for="option in row.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElCheckbox
          v-else-if="row.type === 'checkbox'"
          :model-value="Boolean(row.value)"
          @update:model-value="row.setValue"
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
        <ElInput
          v-else
          :model-value="String(row.value ?? '')"
          size="small"
          @update:model-value="row.setValue"
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
