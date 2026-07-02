/**
 * 压力点 1：feature-plugin（经 createGrapesPluginDescriptor 转换）能否
 * 通过 GjsEditor 的 plugins prop 注册，且执行时机早于 @ready。
 *
 * 同时给 BlockPanel 提供两个测试区块。
 */
import type { Editor } from 'grapesjs'
import { createGrapesPluginDescriptor } from '@toototech/webbuilder/core'
import type { WebBuilderFeaturePlugin, WebBuilderPluginContext } from '@toototech/webbuilder/core'

const probeFeature: WebBuilderFeaturePlugin = {
  id: 'poc-probe',
  alwaysEnabled: true,
  activateEditor: ({ editor }) => {
    const beforeReady = !(window as any).__pocReady
    console.log('[poc] probe plugin activated; before @ready?', beforeReady)
    ;(window as any).__pocProbe = { activated: true, beforeReady }

    editor.Blocks.add('poc-text', {
      label: 'PoC 文本',
      category: '基础',
      content: '<p style="padding:8px;">来自 probe 插件的文本块</p>',
    })
    editor.Blocks.add('poc-box', {
      label: 'PoC 盒子',
      category: '布局',
      content: '<div style="padding:24px; background:#eef2ff;">盒子</div>',
    })

    return () => console.log('[poc] probe plugin cleanup')
  },
}

const descriptor = createGrapesPluginDescriptor(probeFeature, (editor: Editor) => ({
  editor,
  resource: {},
  projectData: null,
  usedComponentTypes: new Set<string>(),
  capabilityIds: new Set<string>(),
  tenant: { roles: [], permissions: new Set<string>() },
  commands: {} as WebBuilderPluginContext['commands'],
  hostServices: {},
  settings: { getSnapshot: () => null, hydrate: () => {}, subscribe: () => () => {} },
  ui: { confirm: async () => true, message: { success: () => {}, warning: () => {}, info: () => {}, error: () => {} } },
  route: { getQuery: () => ({}), replaceQuery: () => {}, onBeforeLeave: () => () => {} },
  registerCleanup: () => {},
}))

/**
 * 形态 A：descriptor 对象直传。
 * 运行时 grapesjs config.plugins 接受 PluginDescriptor（已实测），
 * 但 grapesjs-vue 的 PluginTypeToLoad 类型未包含它 → 需 cast（类型面缺口，记录在案）。
 */
export const probeDescriptor = descriptor as unknown as import('@tootix/grapesjs-vue').PluginTypeToLoad

/** 形态 B：函数包装（保底方案） */
export const probeAsFunction = (editor: Editor) => descriptor.plugin(editor as never, {})

/** 压力点：插件抛错行为验证（?throwPlugin=1 时启用） */
export const throwingPlugin = (() => {
  ;(window as any).__pocThrowCaught = false
  return () => {
    throw new Error('[poc] intentional plugin failure')
  }
})()
