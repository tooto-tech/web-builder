import type { Editor } from 'grapesjs'

/**
 * GrapesEditor 是 grapesjs 官方 Editor 类型的别名。
 * 用于替换注册函数中的 `editor: any`，提供类型安全与自动补全。
 * 与已有的 `import type { Editor } from 'grapesjs'` 等价，
 * 统一通过此别名导入，方便后续扩展或 mock 替换。
 */
export type GrapesEditor = Editor

export interface EditorRuntimeAdapter {
  on(event: string, handler: (...args: unknown[]) => void): void
  off?: (event: string, handler: (...args: unknown[]) => void) => void
  trigger?: (event: string, ...args: unknown[]) => void
}

export interface PublishArtifactEditorAdapter {
  getHtml(options?: unknown): string
  getCss(options?: unknown): string
  getJs(options?: unknown): string
  getConfig?: () => Record<string, unknown>
  Pages?: unknown
}

// Core editor types
export interface EditorConfig {
  container: HTMLElement | string;
  height?: string;
  width?: string;
  components?: string;
  fromElement?: boolean;
  storageManager?: StorageManagerConfig | boolean;
  styleManager?: StyleManagerConfig | boolean;
  blockManager?: BlockManagerConfig;
  layerManager?: LayerManagerConfig | boolean;
  panels?: PanelsConfig;
  deviceManager?: DeviceManagerConfig;
  canvas?: CanvasConfig;
  commands?: CommandsConfig;
  selectorManager?: SelectorManagerConfig;
  plugins?: Array<string | PluginOptions>;
  pluginsOpts?: Record<string, any>;
}

export interface StorageManagerConfig {
  type?: string;
  autosave?: boolean;
  autoload?: boolean;
  stepsBeforeSave?: number;
  options?: Record<string, any>;
  id?: string;
}

export interface StyleManagerConfig {
  sectors?: SectorConfig[];
  appendTo?: HTMLElement | string;
}

export interface SectorConfig {
  name: string;
  open?: boolean;
  properties: PropertyConfig[];
}

export interface PropertyConfig {
  name: string;
  type: string;
  property?: string;
  defaults?: string;
  options?: any[];
}

export interface BlockManagerConfig {
  appendTo?: HTMLElement | string;
  blocks?: BlockConfig[];
}

export interface BlockConfig {
  id: string;
  label: string;
  category?: string;
  content: string | Record<string, any>;
  attributes?: Record<string, any>;
}

export interface LayerManagerConfig {
  appendTo?: HTMLElement | string;
}

export interface PanelsConfig {
  defaults?: PanelConfig[];
}

export interface PanelConfig {
  id: string;
  el?: string;
  buttons?: ButtonConfig[];
  visible?: boolean;
}

export interface ButtonConfig {
  id: string;
  label?: string;
  command?: string | (() => void);
  active?: boolean;
  togglable?: boolean;
  attributes?: Record<string, any>;
}

export interface DeviceManagerConfig {
  devices?: DeviceConfig[];
}

export interface DeviceConfig {
  id?: string;
  name?: string;
  width?: string;
  height?: string;
  widthMedia?: string;
}

export interface CanvasConfig {
  styles?: string[];
  scripts?: string[];
}

export interface CommandsConfig {
  defaults?: Record<string, any>;
}

export interface SelectorManagerConfig {
  appendTo?: HTMLElement | string;
  selectors?: SelectorConfig[];
}

export interface SelectorConfig {
  name: string;
  label?: string;
  type?: number;
}

export interface PluginOptions {
  [key: string]: any;
}

// Component library types
export interface ComponentCategory {
  id: string;
  label: string;
}

export interface ComponentTemplate {
  id: string;
  label: string;
  category: string;
  content: string;
  attributes?: Record<string, any>;
  thumbnail?: string;
}

// Editor state types
export interface EditorState {
  editor: any | null;
  selectedElement: any | null;
  currentDevice: string;
  isLoading: boolean;
  blocks: BlockConfig[];
  layers: LayerItem[];
  styles: StyleState;
}

export interface LayerItem {
  id: string;
  name: string;
  level: number;
  children: LayerItem[];
}

export interface StyleState {
  typography: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    fontStyle?: string;
    color: string;
    textAlign?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textDecoration?: string;
    textTransform?: string;
    textShadowX?: string;
    textShadowY?: string;
    textShadowBlur?: string;
    textShadowColor?: string;
  };
  spacing: {
    borderRadius: number;
    padding: string;
    margin: string;
  };
  colors: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: string;
    borderStyle: string;
  };
}
