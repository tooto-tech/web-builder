/**
 * Panel adapters convert grapesjs-vue Provider slot props into the prop shapes
 * expected by migrated WebBuilder UI components.
 *
 * Keep adapters as pure functions or thin composables so they can be tested
 * directly. Panel SFCs should stay thin: receive Provider data, call an adapter,
 * and render the migrated UI.
 */
export * from './useStyleSectors.js'
export * from './useTraitRows.js'
export * from './useBlockCatalog.js'
