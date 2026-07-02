<script lang="ts" setup>
withDefaults(
  defineProps<{
    /** 字段标签文字，不传则不渲染标签行 */
    label?: string
    /**
     * 布局模式
     * - stacked（默认）：标签在上，控件在下；label-end 插槽渲染在标签行右侧
     * - inline：标签在左（固定宽度），控件在右
     */
    layout?: 'stacked' | 'inline'
    /** 标签文字颜色，不传则使用默认灰色 */
    labelColor?: string
  }>(),
  { layout: 'stacked' }
)
</script>

<template>
  <div class="mb-3" :class="layout === 'inline' ? 'flex items-center gap-2' : ''">
    <!-- 标签行：stacked 模式下 label-end 插槽显示在右侧 -->
    <div
      v-if="label !== undefined || $slots['label-end'] || $slots['label-suffix']"
      class="text-[10px] flex-shrink-0"
      :class="
        layout === 'inline'
          ? 'min-w-24'
          : 'mb-1.5 flex items-center gap-1.5'
      "
    >
      <!-- label 文字 -->
      <span
        v-if="label !== undefined"
        :style="labelColor ? { color: labelColor } : {}"
        :class="!labelColor ? 'text-gray-700' : ''"
      >{{ label }}</span>
      <!-- label-suffix：紧跟 label 文字（如清除 icon） -->
      <slot name="label-suffix"></slot>
      <!-- 弹性间距，将 label-end 推到最右侧 -->
      <span v-if="$slots['label-end']" class="flex-1"></span>
      <!-- label-end：最右侧（如单位选择器） -->
      <slot name="label-end"></slot>
    </div>

    <!-- 控件内容 -->
    <slot></slot>
  </div>
</template>
