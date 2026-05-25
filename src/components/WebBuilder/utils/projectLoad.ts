type ProjectLoadEditor = {
  loadProjectData?: (data: Record<string, any>) => void
  UndoManager?: {
    skip?: (callback: () => void) => void
  }
}

export const waitForProjectLoadPaint = (frames = 2): Promise<void> =>
  new Promise((resolve) => {
    const tick = (remaining: number) => {
      requestAnimationFrame(() => {
        if (remaining <= 1) {
          resolve()
          return
        }
        tick(remaining - 1)
      })
    }
    tick(Math.max(1, frames))
  })

export const runAfterProjectLoadPaint = (callback: () => void): void => {
  const run = () => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(callback, { timeout: 600 })
      return
    }

    setTimeout(callback, 0)
  }

  requestAnimationFrame(() => requestAnimationFrame(run))
}

export interface LoadProjectDataOptions {
  skipUndo?: boolean
  beforeLoad?: () => void
  afterPaint?: () => void
}

export const loadProjectDataWithPaint = async (
  editor: ProjectLoadEditor,
  projectData: Record<string, any>,
  options: LoadProjectDataOptions = {},
): Promise<void> => {
  if (!editor?.loadProjectData) {
    throw new Error('EDITOR_NOT_READY')
  }

  await waitForProjectLoadPaint()
  options.beforeLoad?.()
  await waitForProjectLoadPaint()

  const load = () => {
    editor.loadProjectData?.(projectData)
  }

  if (options.skipUndo && editor.UndoManager?.skip) {
    editor.UndoManager.skip(load)
  } else {
    load()
  }

  if (options.afterPaint) {
    runAfterProjectLoadPaint(options.afterPaint)
  }
}
