import type { Editor } from 'grapesjs';
export type GrapesPluginFn<T extends Record<string, any> = Record<string, any>> = (editor: Editor, options?: T) => void | ((context?: any) => void);
