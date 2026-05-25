import { markRaw, shallowReactive } from 'vue'

const cmpEvents = [
  'change',
  'change:attributes',
  'change:tagName',
  'change:styles',
  'change:traits',
  'change:name',
]

/**
 * Object to manage the component tree.
 * @typedef Selected
 * @memberof module:useSelectedComponent
 * @inner
 * @property {Object} component A reactive representation of the
 * [selected component]{@link https://grapesjs.com/docs/api/component.html#component},
 * Where the child components, attributes and classes have also been made reactive.
 */

/**
 * Get object to manage the selected component.
 * @exports useSelectedComponent
 * @param {VGCconfig} grapes As provided by useGrapes
 * @returns {module:useSelectedComponent~Selected}
 */
export default function useSelectedComponent(grapes: any) {
  if (!grapes._cache.selectedComp) {
    const selected = (grapes._cache.selectedComp = shallowReactive({
      component: null as any,
      revision: 0,
      getRawComponent: (() => null) as () => any,
    }))

    grapes.onInit((editor: any) => {
      let rafId: number | null = null
      let currentComponent: any = null
      let currentTraits: any = null
      let currentClasses: any = null
      let currentChildren: any = null

      const componentEvents = [...cmpEvents, 'change:classes']
      const collectionEvents = ['add', 'remove', 'reset', 'update', 'change']
      const bumpRevision = () => {
        selected.revision += 1
      }

      selected.getRawComponent = () => currentComponent

      function decoupleCurrent() {
        if (currentComponent?.off) {
          componentEvents.forEach((eventName) => currentComponent.off(eventName, bumpRevision))
        }
        if (currentTraits?.off) {
          collectionEvents.forEach((eventName) => currentTraits.off(eventName, bumpRevision))
        }
        if (currentClasses?.off) {
          collectionEvents.forEach((eventName) => currentClasses.off(eventName, bumpRevision))
        }
        if (currentChildren?.off) {
          collectionEvents.forEach((eventName) => currentChildren.off(eventName, bumpRevision))
        }
        currentComponent = null
        currentTraits = null
        currentClasses = null
        currentChildren = null
      }

      function bindCurrent(comp: any) {
        if (!comp?.on) return

        currentComponent = markRaw(comp)
        currentTraits = comp.get?.('traits') ?? null
        currentClasses = comp.get?.('classes') ?? null
        currentChildren = comp.get?.('components') ?? null

        componentEvents.forEach((eventName) => currentComponent.on(eventName, bumpRevision))
        if (currentTraits?.on) {
          collectionEvents.forEach((eventName) => currentTraits.on(eventName, bumpRevision))
        }
        if (currentClasses?.on) {
          collectionEvents.forEach((eventName) => currentClasses.on(eventName, bumpRevision))
        }
        if (currentChildren?.on) {
          collectionEvents.forEach((eventName) => currentChildren.on(eventName, bumpRevision))
        }
      }

      function updateComp(comp: any) {
        if (!comp) {
          decoupleCurrent()
          selected.component = null
          bumpRevision()
          return
        }

        const currentCid = currentComponent?.cid
        const nextCid = comp?.cid
        if (currentCid && nextCid && currentCid === nextCid) {
          return
        }

        decoupleCurrent()
        bindCurrent(comp)
        selected.component = currentComponent
        bumpRevision()
      }

      editor.on('component:selected', (comp: any) => {
        if (rafId !== null) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          rafId = null
          updateComp(comp)
        })
      })

      editor.on('component:deselected', () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        if (!editor.getSelected?.()) {
          updateComp(null)
        }
      })

      editor.on('destroy', () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        updateComp(null)
      })
    })
  }

  return grapes._cache.selectedComp
}
