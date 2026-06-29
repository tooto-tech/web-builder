import type { Editor, PluginDescriptor } from 'grapesjs';
import type { WebBuilderFeaturePlugin, WebBuilderPluginContext } from './featurePlugin.js';
export declare function createGrapesPluginDescriptor(feature: WebBuilderFeaturePlugin, contextFactory: (editor: Editor) => WebBuilderPluginContext): PluginDescriptor;
