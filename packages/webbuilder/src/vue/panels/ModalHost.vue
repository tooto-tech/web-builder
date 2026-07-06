<script setup lang="ts">
import { ModalProvider } from '@tootix/grapesjs-vue'
import { NModal } from 'naive-ui'

const closeOnHide = (visible: boolean, close: () => void) => {
  if (!visible) close()
}
</script>

<template>
  <ModalProvider v-slot="{ open, title, content, attributes, close }">
    <NModal
      :show="open"
      :block-scroll="false"
      :mask-closable="true"
      @update:show="(visible) => closeOnHide(visible, close)"
    >
      <section class="wb-modal-host__dialog" role="dialog" aria-modal="true" v-bind="attributes">
        <header class="wb-modal-host__header">
          <component :is="title" />
          <button type="button" class="wb-modal-host__close" @click="close()">Close</button>
        </header>
        <div class="wb-modal-host__body">
          <component :is="content" />
        </div>
      </section>
    </NModal>
  </ModalProvider>
</template>

<style>
.wb-modal-host__dialog {
  width: min(720px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow: auto;
  border-radius: 6px;
  color: #111827;
  background: #fff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.24);
}

.wb-modal-host__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
}

.wb-modal-host__close {
  border: 0;
  color: #2563eb;
  background: transparent;
  font: inherit;
  font-size: 12px;
}

.wb-modal-host__body {
  padding: 16px;
}
</style>
