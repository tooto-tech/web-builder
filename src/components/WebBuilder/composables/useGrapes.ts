import grapesjs from 'grapesjs'
import { isRef, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, toRaw } from 'vue'

const toGrapesInitValue = (value: any): any => {
  const unwrapped = isRef(value) ? value.value : value
  const raw = toRaw(unwrapped)

  if (!raw || typeof raw !== 'object') return raw
  if (typeof HTMLElement !== 'undefined' && raw instanceof HTMLElement) return raw
  if (typeof Node !== 'undefined' && raw instanceof Node) return raw
  if (Array.isArray(raw)) return raw.map((item) => toGrapesInitValue(item))

  const proto = Object.getPrototypeOf(raw)
  if (proto !== Object.prototype && proto !== null) return raw

  return Object.fromEntries(
    Object.entries(raw).map(([key, item]) => [key, toGrapesInitValue(item)]),
  )
}

/**
 * Reactive base state and functions to manage Vue GrapesJS Composables.
 * @typedef VGCconfig
 * @property {Object} config Reactive version of the provided GrapesJS configuration object
 * @property {boolean} initialized Whether GrapesJS has been initialized
 * @property {VGCconfig~onBeforeInit} onBeforeInit Register function to be executed
 * right before GrapesJS is initialized
 * @property {VGCconfig~onInit} onInit Register function to be executed
 * right after GrapesJS is initialized
 */

/**
 * Initialize GrapesJS and make it available to the other composables
 * @exports useGrapes
 * @param {Object} config Configuration options as defined by
 * [GrapesJS]{@link https://github.com/artf/grapesjs/blob/master/src/editor/config/config.js}
 * @returns {VGCconfig}
 */
export default function useGrapes(config: Record<string, any>) {
  const beforeInit: Array<() => void> = []
  const afterInit: Array<(editor: any) => void> = []

  // Prepare object to export.
  const grapes = {
    // Cache to store reactive objects for composables
    _cache: {} as Record<string, any>,

    // Make the configuration reactive to make use of template refs to append to.
    // Some default values provided to be more inline with integrating in to Vue.
    config: reactive({
      panels: { defaults: [] },
      height: '100%',
      ...config,
    }),

    initialized: false,

    /**
     * @method onBeforeInit
     * @memberof VGCconfig
     * @inner
     * @param {Function} fn Function to register. Does not receive any parameters.
     */
    onBeforeInit(fn: () => void) {
      beforeInit.push(fn)
    },

    /**
     * @method onInit
     * @memberof VGCconfig
     * @inner
     * @param {Callback} fn Function to register. Receives the GrapesJS editor as a parameter.
     */
    onInit(fn: (editor: any) => void) {
      if (this.initialized) fn(editor)
      afterInit.push(fn)
    },
  }

  let editor: any
  // Initialize GrapesJs after Vue component has been mounted.
  onMounted(async () => {
    // Wait for all child components to mount
    await nextTick()

    for (const fn of beforeInit) {
      fn()
    }
    editor = markRaw(grapesjs.init(toGrapesInitValue(grapes.config) as any))
    grapes.initialized = true
    for (const fn of afterInit) {
      fn(editor)
    }
  })

  // Tidy up
  onBeforeUnmount(() => {
    try {
      editor?.destroy()
    } catch {
      // GrapesJS destroy can throw when Vue's unmount has already removed DOM nodes
    }
    // 清空缓存，防止组件重新挂载时读到旧的响应式状态
    grapes._cache = {}
    grapes.initialized = false
  })

  return grapes
}
