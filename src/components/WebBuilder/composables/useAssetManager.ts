import { markRaw, readonly, shallowReactive } from 'vue'

const toModelList = (input: any): any[] => {
  if (Array.isArray(input)) return input
  if (Array.isArray(input?.models)) return input.models
  return []
}

/**
 * Object to manage the assets.
 * @typedef AssetManager
 * @memberof module:useAssetManager
 * @inner
 * @property {Object} assets A reactive representation of the collection of all
 * [assets]{@link https://grapesjs.com/docs/api/asset.html#asset}
 * @property {Function} add [Add a new asset]{@link https://grapesjs.com/docs/api/assets.html#add}
 * @property {Function} remove [Remove an asset]{@link https://grapesjs.com/docs/api/assets.html#remove}
 * @property {Object} modal Object to handle the modal of the asset manager
 * @property {Boolean} modal.isOpen Whether the modal should be displayed
 * @property {String[]} modal.types Array of asset types requested, eg. ['image']
 * @property {module:useAssetManager~AssetManager} modal.select A callback to select an asset.
 * @property {Function} modal.open [Open the asset modal]{@link https://grapesjs.com/docs/api/assets.html#open}
 * @property {Function} modal.close [Close the asset manager]{@link https://grapesjs.com/docs/api/assets.html#close}
 */

/**
 * @callback selectAsset
 * @memberof module:useAssetManager~AssetManager
 * @param {Object} asset The [asset]{@link https://grapesjs.com/docs/api/asset.html#asset} to select
 * @returns {Void}
 */

/**
 * Get object to manage the assets.
 * @exports useAssetManager
 * @param {VGCconfig} grapes As provided by useGrapes
 * @returns {module:useAssetManager~AssetManager}
 */
export default function useAssetManager(grapes: any) {
  // Take asset manager from cache if it already exists
  // If cache exists, return it even if GrapesJS is already initialized (hot reload scenario)
  if (grapes._cache.assetManager) {
    return readonly(grapes._cache.assetManager)
  }

  // Ensure GrapesJs is not yet initialised (only check when creating new cache)
  if (grapes.initialized) {
    throw new Error(
      'useAssetManager must be executed before GrapesJs is initialised (onMount where useGrapes is executed)'
    )
  }


  // Create new asset manager cache
  if (!grapes._cache.assetManager) {
    const am = (grapes._cache.assetManager = shallowReactive({
      assets: [] as any[],
      add: () => {},
      remove: () => {},
      modal: {
        isOpen: false,
      } as any,
    }))

    // Use custom asset manager
    if (!grapes.config.assetManager) grapes.config.assetManager = {}
    grapes.config.assetManager.custom = {
      // Store reactive reference to props on modal and indicate that is should be opened
      open(props: any) {
        am.modal.types = props.types
        am.modal.options = props.options
        am.modal.select = (asset: any) => props.select(asset._model ?? asset)
        am.modal.isOpen = true
      },
      // clear prop refrences and indicate that modal should be closed
      close() {
        am.modal.isOpen = false
        am.modal.types = []
        am.modal.options = {}
        am.modal.select = null
      },
    }

    grapes.onInit((editor: any) => {
      const toAssetRecord = (asset: any) => {
        if (!asset) return null
        const rawAsset = markRaw(asset)
        return markRaw({
          _model: rawAsset,
          cid: rawAsset.cid,
          type: rawAsset.get?.('type') ?? rawAsset.type,
          src: rawAsset.getSrc?.() ?? rawAsset.get?.('src') ?? rawAsset.src,
          filename: rawAsset.getFilename?.(),
          extension: rawAsset.getExtension?.(),
          get: rawAsset.get?.bind(rawAsset),
          getSrc: rawAsset.getSrc?.bind(rawAsset),
          remove: rawAsset.remove?.bind(rawAsset),
        })
      }

      const refreshAssets = () => {
        const assets = toModelList(editor.AssetManager.getAll?.())
        am.assets = assets
          .map((asset: any) => toAssetRecord(asset))
          .filter(Boolean) as any[]
      }

      refreshAssets()

      am.add = editor.AssetManager.add.bind(editor.AssetManager)
      am.remove = editor.AssetManager.remove.bind(editor.AssetManager)

      am.modal.open = editor.AssetManager.open.bind(editor.AssetManager)
      am.modal.close = editor.AssetManager.close.bind(editor.AssetManager)

      editor.on('asset:add', refreshAssets)
      editor.on('asset:remove', refreshAssets)
      editor.on('destroy', () => {
        editor.off('asset:add', refreshAssets)
        editor.off('asset:remove', refreshAssets)
      })
    })
  }

  return readonly(grapes._cache.assetManager)
}
