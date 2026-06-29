import type { GrapesPluginFn } from './types.js';
export declare const deriveGlobalNames: (url: string) => string[];
export interface LoadPluginFromUrlOptions {
    fallbackGlobalNames?: string[];
}
export declare function loadPluginFromUrl(url: string, globalVar?: string, options?: LoadPluginFromUrlOptions): Promise<GrapesPluginFn>;
export interface LoadPluginFromCodeOptions {
    filename?: string;
    globalVar?: string;
}
export declare function loadPluginFromCode(code: string, options?: LoadPluginFromCodeOptions): Promise<GrapesPluginFn>;
