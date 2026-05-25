<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import type { WbStyleSector, WbStyleProperty } from '../config/wbStyleSectors'
import type { WbStyleManager } from '../composables/useWbStyleManager'
import { FieldWrapper } from './fields'
import {
  WbCtrlText,
  WbCtrlNumber,
  WbCtrlColor,
  WbCtrlSelect,
  WbCtrlFont,
  WbCtrlIconRadio,
  WbCtrlSpacing,
  WbCtrlBorderRadius,
  WbCtrlBgImage,
  WbCtrlShadow,
  WbCtrlTypography,
} from './style-controls'

// ─── Props ────────────────────────────────────────────────────────

const props = defineProps<{
  sector: WbStyleSector
  styleManager: WbStyleManager
  imageManager?: any
  grapes?: any
}>()

// ─── showWhen 条件显示 ────────────────────────────────────────────

/**
 * 判断属性是否应该显示。
 * 读取同 sector 内 showWhen.property 的当前样式值，
 * 空值时 fallback 到该属性的 default，再检查是否在 showWhen.values 中。
 */
function isPropVisible(prop: WbStyleProperty): boolean {
  if (!prop.showWhen) return true
  const { property, values } = prop.showWhen

  const currentValue = props.styleManager.getValue(property)
  const depProp = props.sector.properties.find(p => p.id === property)
  const effectiveValue = currentValue || depProp?.default || ''

  return values.includes(effectiveValue)
}

// ─── 统一的值更新处理 ─────────────────────────────────────────────

/** 空字符串 → clearValue，有值 → setValue */
function handleUpdate(propId: string, value: string): void {
  if (value === '' || value == null) {
    props.styleManager.clearValue(propId)
  } else {
    props.styleManager.setValue(propId, value)
  }
}

// ─── 清除功能 ─────────────────────────────────────────────────────

/** 判断属性是否有已设置的值（有则显示清除按钮并高亮标签） */
function canClear(prop: WbStyleProperty): boolean {
  if (prop.subProperties) {
    return Object.values(prop.subProperties).some(
      cssProp => !!props.styleManager.getValue(cssProp)
    )
  }
  return !!props.styleManager.getValue(prop.id)
}

/** 清除属性值 */
function clearProp(prop: WbStyleProperty): void {
  if (prop.subProperties) {
    Object.values(prop.subProperties).forEach(cssProp => {
      props.styleManager.clearValue(cssProp)
    })
  } else {
    props.styleManager.clearValue(prop.id)
  }
}

</script>

<template>
  <div class="wb-sector">

    <!-- 常用 sector 顶部：排版控件 -->
    <WbCtrlTypography
      v-if="sector.id === 'wb-spacing'"
      :style-manager="styleManager"
      :grapes="grapes"
    />

    <template v-for="prop in sector.properties" :key="prop.id">
        <div v-if="isPropVisible(prop)">
          <FieldWrapper
            :label="prop.label"
            layout="stacked"
            :label-color="canClear(prop) ? '#2251FF' : undefined"
          >
            <template #label-suffix>
              <button
                v-if="canClear(prop)"
                type="button"
                class="flex items-center justify-center w-3.5 h-3.5 rounded-sm hover:opacity-70 transition-opacity flex-shrink-0"
                title="清除"
                @click.stop="clearProp(prop)"
              >
                <Icon icon="lucide:x" :size="11" style="color: #2251FF" />
              </button>
            </template>
            <!-- text -->
            <WbCtrlText
              v-if="prop.type === 'text'"
              :property="prop"
              :model-value="styleManager.getValue(prop.id)"
              @update:model-value="(v) => handleUpdate(prop.id, v)"
            />

            <!-- number -->
            <WbCtrlNumber
              v-else-if="prop.type === 'number'"
              :property="prop"
              :model-value="styleManager.getValue(prop.id)"
              @update:model-value="(v) => handleUpdate(prop.id, v)"
            />

            <!-- color -->
            <WbCtrlColor
              v-else-if="prop.type === 'color'"
              :property="prop"
              :model-value="styleManager.getValue(prop.id)"
              @update:model-value="(v) => handleUpdate(prop.id, v)"
            />

            <!-- select -->
            <WbCtrlSelect
              v-else-if="prop.type === 'select'"
              :property="prop"
              :model-value="styleManager.getValue(prop.id)"
              @update:model-value="(v) => handleUpdate(prop.id, v)"
            />

            <!-- font（字体选择器，System + Google 双 tab） -->
            <WbCtrlFont
              v-else-if="prop.type === 'font'"
              :property="prop"
              :model-value="styleManager.getValue(prop.id)"
              :grapes="grapes"
              @update:model-value="(v) => handleUpdate(prop.id, v)"
            />

            <!-- icon-radio -->
            <WbCtrlIconRadio
              v-else-if="prop.type === 'icon-radio'"
              :property="prop"
              :model-value="styleManager.getValue(prop.id)"
              @update:model-value="(v) => handleUpdate(prop.id, v)"
            />

            <!-- spacing（margin / padding / border-width） -->
            <WbCtrlSpacing
              v-else-if="prop.type === 'spacing'"
              :property="prop"
              :style-manager="styleManager"
            />

            <!-- border-radius（四角圆角） -->
            <WbCtrlBorderRadius
              v-else-if="prop.type === 'border-radius'"
              :property="prop"
              :style-manager="styleManager"
            />

            <!-- bg-image（背景图片 + 图片选择器） -->
            <WbCtrlBgImage
              v-else-if="prop.type === 'bg-image'"
              :property="prop"
              :model-value="styleManager.getValue(prop.id)"
              :image-manager="imageManager"
              @update:model-value="(v) => handleUpdate(prop.id, v)"
            />

            <!-- shadow（box-shadow 多层编辑） -->
            <WbCtrlShadow
              v-else-if="prop.type === 'shadow'"
              :property="prop"
              :style-manager="styleManager"
            />

            <!-- 未知类型兜底 -->
            <div v-else class="text-xs text-gray-300 italic py-1">
              {{ prop.type }} 控件（待实现）
            </div>

          </FieldWrapper>

        </div>
    </template>
  </div>
</template>
