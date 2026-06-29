<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<{
  title?: string
  width?: number
  initialY?: number
  right?: number
  zIndex?: number
  panelClass?: string
  bodyClass?: string
}>(), {
  title: '',
  width: 256,
  initialY: 100,
  right: 30,
  zIndex: 30,
  panelClass: '',
  bodyClass: 'tw-h-80 tw-overflow-y-auto tw-overflow-x-hidden tw-py-1 tw-px-1',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'position-change', position: { x: number; y: number }): void
  (e: 'drag-start', position: { x: number; y: number }): void
  (e: 'drag-end', position: { x: number; y: number }): void
  (e: 'body-drag-leave', event: DragEvent): void
}>()

const panelRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)
const pos = ref({ x: 0, y: props.initialY })
const dragging = ref(false)

let dragOffset = { x: 0, y: 0 }

const overlayStyle = computed(() => ({
  zIndex: Math.max(0, props.zIndex - 10),
}))

const panelStyle = computed(() => ({
  left: `${pos.value.x}px`,
  top: `${pos.value.y}px`,
  width: `${props.width}px`,
  zIndex: props.zIndex,
}))

const clampPanelPosition = (x: number, y: number) => {
  const panelHeight = panelRef.value?.offsetHeight ?? 380
  return {
    x: Math.max(0, Math.min(window.innerWidth - props.width, x)),
    y: Math.max(0, Math.min(window.innerHeight - panelHeight, y)),
  }
}

const updateDefaultPos = () => {
  pos.value = clampPanelPosition(
    window.innerWidth - props.width - props.right,
    Math.min(pos.value.y || props.initialY, window.innerHeight - (panelRef.value?.offsetHeight ?? 380)),
  )
  emit('position-change', pos.value)
}

const onDragMove = (event: MouseEvent) => {
  if (!dragging.value) return
  pos.value = clampPanelPosition(
    event.clientX - dragOffset.x,
    event.clientY - dragOffset.y,
  )
  emit('position-change', pos.value)
}

const onDragEnd = () => {
  if (!dragging.value) return
  dragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.body.style.userSelect = ''
  emit('drag-end', pos.value)
}

const onDragStart = (event: MouseEvent) => {
  if (event.button !== 0) return

  const rect = panelRef.value?.getBoundingClientRect()
  if (!rect) return

  dragging.value = true
  dragOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.body.style.userSelect = 'none'
  emit('drag-start', pos.value)
  event.preventDefault()
}

const onBodyDragLeave = (event: DragEvent) => {
  const bodyEl = bodyRef.value
  if (!bodyEl) return
  if (!event.relatedTarget || !bodyEl.contains(event.relatedTarget as Node)) {
    emit('body-drag-leave', event)
  }
}

onMounted(() => {
  updateDefaultPos()
  window.addEventListener('resize', updateDefaultPos)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDefaultPos)
  onDragEnd()
})
</script>

<template>
  <div>
    <div
      v-if="dragging"
      class="tw-fixed tw-inset-0 tw-cursor-move"
      :style="overlayStyle"
      @mousemove="onDragMove"
      @mouseup="onDragEnd"
    ></div>

    <div
      ref="panelRef"
      class="tw-fixed tw-bg-white/80 tw-backdrop-blur-[5px] tw-border tw-rounded tw-shadow"
      :class="panelClass"
      :style="panelStyle"
    >
      <div
        class="tw-px-3 tw-py-2 tw-border-b tw-text-sm tw-font-medium tw-text-gray-700 tw-grid tw-grid-cols-[1fr_auto_1fr] tw-items-center tw-gap-2 tw-cursor-move tw-select-none"
        @mousedown="onDragStart"
      >
        <div class="tw-min-w-0 tw-justify-self-start">
          <slot name="header-start"></slot>
        </div>
        <div class="tw-min-w-0 tw-text-center">
          <slot name="title">
            <span>{{ title }}</span>
          </slot>
        </div>
        <div class="tw-min-w-0 tw-justify-self-end">
          <slot name="header-end">
            <button
              type="button"
              class="tw-size-5 tw-flex tw-items-center tw-justify-center tw-rounded hover:tw-bg-gray-50"
              aria-label="Close panel"
              @click.stop="emit('close')"
              @mousedown.stop
            >
              <Icon icon="uiw:close" class="tw-text-xs" />
            </button>
          </slot>
        </div>
      </div>

      <div
        ref="bodyRef"
        :class="bodyClass"
        @dragleave="onBodyDragLeave"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>
