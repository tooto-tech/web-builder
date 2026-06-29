export type WebBuilderCommandOptions = Record<string, unknown>

export type WebBuilderCommandResult = unknown

export type WebBuilderCommandRun = (
  editor: unknown,
  sender?: unknown,
  options?: WebBuilderCommandOptions
) => WebBuilderCommandResult

export interface WebBuilderCommandObject {
  run: WebBuilderCommandRun
  stop?: WebBuilderCommandRun
}

export type WebBuilderCommand = WebBuilderCommandRun | WebBuilderCommandObject

export interface WebBuilderCommandContext {
  isLoopItemTemplateResource?: () => boolean
  getCurrentResourceType?: () => string | null
  startManualLoad?: (editor: unknown) => () => void
  requestCmsPreviewRefresh?: (editor: unknown, delay?: number) => void
  requestTemplatePreviewRefresh?: (editor: unknown) => void
  renderReadonlyLayoutPreview?: () => void
  syncMountedComponentStyles?: (editor: unknown) => void
  cleanupRedundantProtectedCssRules?: (editor: unknown) => void
  pauseEditorTracking?: () => void
  resumeEditorTracking?: (markClean?: boolean) => void
  markEditorChanged?: () => void
  markEditorSaved?: () => void
  openAssetsDialogWithTarget?: (target: unknown) => void
  loadPreview?: () => Promise<void>
  restorePreview?: () => Promise<void>
  canRunCommand?: (id: string, options: WebBuilderCommandOptions) => boolean
}
