import { markRaw, shallowReactive } from 'vue'

const toModelList = (input: any): any[] => {
  if (Array.isArray(input)) return input
  if (Array.isArray(input?.models)) return input.models
  return []
}

/**
 * The State Manager provides a reactive representation of the states available in GrapesJS.
 * @typedef StateManager
 * @memberof module:useState
 * @inner
 * @property {Object[]} all A reactive list of
 * [all States]{@link https://grapesjs.com/docs/api/state.html#state} as defined in GrapesJS.
 * @property {String} selected The active state on the current selector.
 * @property {Function} select [Change the state]{@link https://grapesjs.com/docs/api/selector_manager.html#setstate}
 * of the current selector.
 */

/**
 * Fetch and, if necessary, initiate the State Manager.
 * @exports useState
 * @param {VGCconfig} grapes As provided by useGrapes
 * @returns {module:useState~StateManager}
 */
export default function useState(grapes: any) {
  // Take state manager from cache if it already exists
  // If cache exists, return it even if GrapesJS is already initialized (hot reload scenario)
  if (grapes._cache.stateManager) {
    return grapes._cache.stateManager
  }

  // Ensure GrapesJs is not yet initialised (only check when creating new cache)
  if (grapes.initialized) {
    throw new Error(
      'useState must be executed before GrapesJs is initialised (onMount where useGrapes is executed)'
    )
  }

  // Create new state manager cache
  if (!grapes._cache.stateManager) {
    const state = (grapes._cache.stateManager = shallowReactive({
      all: [] as any[],
      selected: '',
      select: (_val: any) => {},
    }))

    grapes.onInit((editor: any) => {
      state.select = function (val: any) {
        editor.Selectors.setState(val)
      }

      const refreshStates = () => {
        const states = toModelList(editor.Selectors.getStates?.())
        state.all = states.map((item: any) => markRaw(item))
      }

      function updateState() {
        state.selected = editor.Selectors.getState()
      }

      refreshStates()
      updateState()

      editor.on('selector:state', updateState)
      editor.on('destroy', () => {
        editor.off('selector:state', updateState)
      })
    })
  }

  return grapes._cache.stateManager
}
