<script setup lang="ts">
import { ModalProvider } from '@tootix/grapesjs-vue'
</script>

<template>
  <ModalProvider v-slot="{ open, title, content, attributes, close }">
    <Teleport to="body">
      <div v-if="open" class="wb-modal-host" v-bind="attributes">
        <div class="wb-modal-host__backdrop" @click="close()"></div>
        <section class="wb-modal-host__dialog" role="dialog" aria-modal="true">
          <header class="wb-modal-host__header">
            <component :is="title" />
            <button type="button" class="wb-modal-host__close" @click="close()">Close</button>
          </header>
          <div class="wb-modal-host__body">
            <component :is="content" />
          </div>
        </section>
      </div>
    </Teleport>
  </ModalProvider>
</template>

<style scoped>
.wb-modal-host {
  position: fixed;
  inset: 0;
  z-index: 2147483640;
}

.wb-modal-host__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.42);
}

.wb-modal-host__dialog {
  position: relative;
  width: min(720px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  margin: 16px auto;
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
