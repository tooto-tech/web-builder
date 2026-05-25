const openIndexedDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('gjs-web-builder', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

export const idbGet = async (key: string) => {
  const db = await openIndexedDb()
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly')
    const store = tx.objectStore('projects')
    const req = store.get(key)
    req.onsuccess = () => {
      resolve(req.result)
      db.close()
    }
    req.onerror = () => {
      reject(req.error)
      db.close()
    }
  })
}

export const idbSet = async (key: string, value: any) => {
  const db = await openIndexedDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite')
    const store = tx.objectStore('projects')
    const req = store.put(value, key)
    req.onsuccess = () => {
      resolve()
      db.close()
    }
    req.onerror = () => {
      reject(req.error)
      db.close()
    }
  })
}

export const idbRemove = async (key: string) => {
  const db = await openIndexedDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite')
    const store = tx.objectStore('projects')
    const req = store.delete(key)
    req.onsuccess = () => {
      resolve()
      db.close()
    }
    req.onerror = () => {
      reject(req.error)
      db.close()
    }
  })
}

export const getStorageKey = () => {
  const path = window.location?.pathname || 'root'
  const userId = window.localStorage.getItem('gjs-user-id') || 'guest'
  return `gjs-web-builder-${userId}-${path}`
}

export const registerIndexedDbStorage = (editor: any) => {
  if (!editor?.Storage?.add) return
  editor.Storage.add('indexeddb', {
    load: async () => {
      const data = await idbGet(getStorageKey())
      return data || {}
    },
    store: async (data: any) => {
      await idbSet(getStorageKey(), data)
    },
    remove: async () => {
      await idbRemove(getStorageKey())
    },
  })
  editor.Storage.setCurrent?.('indexeddb')
}
