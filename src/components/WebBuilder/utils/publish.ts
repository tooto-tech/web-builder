export const buildPublishPayload = (editor: any) => {
  return editor.getProjectData?.() ?? editor.getComponents?.()
}
