import type { Editor } from 'grapesjs'

export interface ComponentRegistryExecutor {
  id: string
  register: (editor: Editor) => void
}
