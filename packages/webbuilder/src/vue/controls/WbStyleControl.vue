<script lang="ts" setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { WbStyleProperty } from '../config/wbStyleSectors'
import type { WbStyleManager } from '../composables/useWbStyleManager'
import { FieldWrapper } from './fields'
import {
  WbCtrlText,
  WbCtrlNumber,
  WbCtrlColor,
  WbCtrlSelect,
  WbCtrlRadio,
  WbCtrlSlider,
  WbCtrlFile,
  WbCtrlFont,
  WbCtrlIconRadio,
  WbCtrlSpacing,
  WbCtrlBorderRadius,
  WbCtrlBgImage,
  WbCtrlShadow,
} from './style-controls'

defineOptions({ name: 'WbStyleControl' })

const props = withDefaults(
  defineProps<{
    property: WbStyleProperty
    styleManager: WbStyleManager
    editor?: any
    imageManager?: any
    grapes?: any
    contextProperties?: WbStyleProperty[]
    depth?: number
  }>(),
  { depth: 0 },
)

const contextProperties = computed(() => props.contextProperties ?? [])
const childProperties = computed(() => props.property.children ?? [])

const isVisible = computed(() => {
  if (!props.property.showWhen) return true

  const { property, values } = props.property.showWhen
  const currentValue = props.styleManager.getValue(property)
  const depProp = contextProperties.value.find(item => item.id === property)
  const effectiveValue = currentValue || depProp?.default || ''

  return values.includes(effectiveValue)
})

const handleUpdate = (propId: string, value: string) => {
  if (value === '' || value == null) {
    props.styleManager.clearValue(propId)
    return
  }

  props.styleManager.setValue(propId, value)
}

const canClear = (prop: WbStyleProperty): boolean => {
  if (prop.children?.length) {
    return prop.children.some(child => canClear(child))
  }

  if (prop.subProperties) {
    return Object.values(prop.subProperties).some(cssProp =>
      Boolean(props.styleManager.getValue(cssProp)),
    )
  }

  return Boolean(props.styleManager.getValue(prop.id))
}

const clearProp = (prop: WbStyleProperty) => {
  if (prop.children?.length) {
    prop.children.forEach(child => clearProp(child))
    return
  }

  if (prop.subProperties) {
    Object.values(prop.subProperties).forEach(cssProp => {
      props.styleManager.clearValue(cssProp)
    })
    return
  }

  props.styleManager.clearValue(prop.id)
}
</script>

<template>
  <div
    v-if="isVisible"
    class="wb-style-control"
    :class="{ 'wb-style-control--nested': depth > 0 }"
  >
    <FieldWrapper
      :label="property.label"
      layout="stacked"
      :label-color="canClear(property) ? '#2251FF' : undefined"
    >
      <template #label-suffix>
        <button
          v-if="canClear(property)"
          type="button"
          class="wb-style-control__clear"
          title="清除"
          @click.stop="clearProp(property)"
        >
          <Icon icon="lucide:x" :size="11" />
        </button>
      </template>

      <WbCtrlText
        v-if="property.type === 'text'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlNumber
        v-else-if="property.type === 'number' || property.type === 'integer'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlColor
        v-else-if="property.type === 'color'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlSelect
        v-else-if="property.type === 'select'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlRadio
        v-else-if="property.type === 'radio'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlSlider
        v-else-if="property.type === 'slider'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlFile
        v-else-if="property.type === 'file'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        :editor="editor"
        :image-manager="imageManager"
        :grapes="grapes"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlFont
        v-else-if="property.type === 'font'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        :grapes="grapes"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlIconRadio
        v-else-if="property.type === 'icon-radio'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlSpacing
        v-else-if="property.type === 'spacing'"
        :property="property"
        :style-manager="styleManager"
      />
      <WbCtrlBorderRadius
        v-else-if="property.type === 'border-radius'"
        :property="property"
        :style-manager="styleManager"
      />
      <WbCtrlBgImage
        v-else-if="property.type === 'bg-image'"
        :property="property"
        :model-value="styleManager.getValue(property.id)"
        :image-manager="imageManager"
        @update:model-value="(value) => handleUpdate(property.id, value)"
      />
      <WbCtrlShadow
        v-else-if="property.type === 'shadow'"
        :property="property"
        :style-manager="styleManager"
      />

      <div
        v-else-if="property.type === 'composite' || property.type === 'stack'"
        class="wb-style-control__children"
        :class="{ 'wb-style-control__children--stack': property.type === 'stack' }"
      >
        <WbStyleControl
          v-for="child in childProperties"
          :key="child.id"
          :property="child"
          :style-manager="styleManager"
          :editor="editor"
          :image-manager="imageManager"
          :grapes="grapes"
          :context-properties="childProperties"
          :depth="depth + 1"
        />
        <div v-if="!childProperties.length" class="wb-style-control__empty">
          {{ property.type }} control has no child properties.
        </div>
      </div>

      <div v-else class="wb-style-control__empty">
        Unsupported style control: {{ property.type }}
      </div>
    </FieldWrapper>
  </div>
</template>

<style scoped>
.wb-style-control {
  min-width: 0;
}

.wb-style-control--nested {
  padding-left: 8px;
  border-left: 1px solid #e5e7eb;
}

.wb-style-control__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 3px;
  padding: 0;
  color: #2251ff;
  background: transparent;
  cursor: pointer;
}

.wb-style-control__clear:hover {
  background: #eef2ff;
}

.wb-style-control__children {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.wb-style-control__children--stack {
  gap: 8px;
}

.wb-style-control__empty {
  color: #9ca3af;
  font-size: 11px;
  line-height: 16px;
}
</style>
