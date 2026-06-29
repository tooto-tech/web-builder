import type { WebBuilderFeaturePlugin, WebBuilderPluginContext, WebBuilderActionSuccessContext } from './featurePlugin.js';
export declare const runBeforeProjectLoadHooks: (plugins: WebBuilderFeaturePlugin[], context: WebBuilderPluginContext) => Promise<void>;
export declare const runBeforeProjectSerializeHooks: (plugins: WebBuilderFeaturePlugin[], context: WebBuilderPluginContext) => Promise<void>;
export declare const runBeforeSaveHooks: (plugins: WebBuilderFeaturePlugin[], context: WebBuilderPluginContext) => Promise<boolean>;
export declare const runBeforePublishHooks: (plugins: WebBuilderFeaturePlugin[], context: WebBuilderPluginContext) => Promise<boolean>;
export declare const runAfterSaveSuccessHooks: (plugins: WebBuilderFeaturePlugin[], context: WebBuilderActionSuccessContext) => Promise<void>;
export declare const runAfterPublishSuccessHooks: (plugins: WebBuilderFeaturePlugin[], context: WebBuilderActionSuccessContext) => Promise<void>;
