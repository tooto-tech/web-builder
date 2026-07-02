<script setup lang="ts">
import grapesjs from 'grapesjs'
import type { Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'
import { ref } from 'vue'
import { GjsEditor, Canvas, WithEditor } from '@tootix/grapesjs-vue'
import StylePanel from './StylePanel.vue'
import DevicePanel from './DevicePanel.vue'
import BlockPanel from './BlockPanel.vue'
import { probeDescriptor, throwingPlugin } from './probePlugin'

const plugins = new URLSearchParams(location.search).get('throwPlugin') === '1'
  ? [probeDescriptor, throwingPlugin]
  : [probeDescriptor]

// 压力点 4：反复挂载/卸载验证 destroy
const editorMounted = ref(true)
;(window as any).__pocToggleEditor = () => { editorMounted.value = !editorMounted.value }

// 压力点 3：@update projectData
let updateCount = 0
const onUpdate = (projectData: unknown) => {
  updateCount += 1
  ;(window as any).__pocLastUpdate = { count: updateCount, projectData }
  console.log('[poc] @update #' + updateCount)
}

const options = {
  height: '100%',
  storageManager: false as const,
  panels: { defaults: [] },
  showOffsets: true,
  showOffsetsSelected: true,
  deviceManager: {
    devices: [
      { id: 'desktop', name: 'Desktop', width: '' },
      { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
      { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
    ],
  },
}

const onEditor = (editor: Editor) => {
  console.log('[poc] @editor fired')
  ;(window as any).__pocEditor = editor
}

const onReady = (editor: Editor) => {
  console.log('[poc] @ready fired, grapesjs version:', (grapesjs as any).version)
  ;(window as any).__pocReady = true
  // 放一点初始内容便于选中调试
  editor.setComponents(`
    <section style="padding:40px; text-align:center;">
      <h1 style="color:#111827;">PoC Heading</h1>
      <p style="color:#6b7280; margin-top:12px;">select me and tweak styles</p>
    </section>
  `)
}
</script>

<template>
  <GjsEditor
    v-if="editorMounted"
    :grapesjs="grapesjs"
    :options="options"
    :plugins="plugins"
    @editor="onEditor"
    @ready="onReady"
    @update="onUpdate"
  >
    <div class="tw-h-screen tw-flex tw-flex-col">
      <header class="tw-h-10 tw-flex tw-items-center tw-px-4 tw-bg-editor-panel tw-text-white tw-text-sm tw-shrink-0">
        grapesjs-vue PoC
        <WithEditor>
          <DevicePanel />
        </WithEditor>
      </header>
      <div class="tw-flex-1 tw-min-h-0 tw-flex">
        <aside class="tw-w-72 tw-border-r tw-border-gray-200 tw-overflow-y-auto tw-bg-white tw-shrink-0" data-testid="side-panel">
          <WithEditor>
            <BlockPanel />
            <StylePanel />
          </WithEditor>
        </aside>
        <main class="tw-flex-1 tw-min-w-0">
          <Canvas />
        </main>
      </div>
    </div>
  </GjsEditor>
  <div v-else class="tw-h-screen tw-flex tw-items-center tw-justify-center tw-text-gray-400" data-testid="editor-unmounted">
    editor unmounted
  </div>
</template>
