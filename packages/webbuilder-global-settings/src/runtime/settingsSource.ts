import type {
  GlobalSettingsSnapshot,
  SettingsSource,
} from '@toototech/webbuilder-core'

export type { GlobalSettingsSnapshot, SettingsSource }

export const createMemoryGlobalSettingsSource = (): SettingsSource => {
  let snapshot: GlobalSettingsSnapshot | null = null
  const listeners = new Set<(snapshot: GlobalSettingsSnapshot | null) => void>()

  return {
    getSnapshot: () => snapshot,
    hydrate(nextSnapshot) {
      snapshot = nextSnapshot
      listeners.forEach(listener => listener(snapshot))
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export const createGlobalSettingsSource = createMemoryGlobalSettingsSource
