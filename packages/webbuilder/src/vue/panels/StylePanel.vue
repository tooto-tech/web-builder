<script setup lang="ts">
import { StylesProvider } from '@tootix/grapesjs-vue'

import StylePanelContent from './StylePanelContent.vue'
</script>

<template>
  <StylesProvider v-slot="{ sectors }">
    <StylePanelContent :sectors="sectors" />
  </StylesProvider>
</template>
