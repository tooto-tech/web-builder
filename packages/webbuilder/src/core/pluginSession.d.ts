import type { ResourceTransactionParticipant } from './resourceTransaction.js';
import { type WebBuilderActivePreviewContribution } from './previewContributions.js';
import type { WebBuilderBlockPack, WebBuilderFeaturePlugin, WebBuilderPanelContribution, WebBuilderPluginContext, WebBuilderPluginResolveContext } from './featurePlugin.js';
export interface WebBuilderPluginSessionOptions {
    plugins: WebBuilderFeaturePlugin[];
    resolveContext: WebBuilderPluginResolveContext;
}
export interface WebBuilderPluginSession {
    activePlugins: WebBuilderFeaturePlugin[];
    panels: WebBuilderPanelContribution[];
    previews: WebBuilderActivePreviewContribution[];
    collectBlockPacks: (canInsertComponentType: (type: string) => boolean) => WebBuilderBlockPack[];
    collectResourceParticipants: (context: WebBuilderPluginContext) => ResourceTransactionParticipant[];
}
export declare const createWebBuilderPluginSession: (options: WebBuilderPluginSessionOptions) => WebBuilderPluginSession;
