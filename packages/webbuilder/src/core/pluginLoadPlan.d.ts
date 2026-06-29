import type { WebBuilderCapabilitySnapshot } from './capabilityAdapter.js';
import { type WebBuilderPluginSession } from './pluginSession.js';
import type { PageResourceIdentity, WebBuilderFeaturePlugin, WebBuilderPluginResolveContext } from './featurePlugin.js';
export interface WebBuilderPluginLoadPlanOptions {
    plugins: WebBuilderFeaturePlugin[];
    resource: PageResourceIdentity;
    projectData: Record<string, unknown> | null;
    resolveCapabilities: (resource: PageResourceIdentity, options: {
        usedComponentTypes: Set<string>;
    }) => WebBuilderCapabilitySnapshot;
}
export interface WebBuilderPluginLoadPlan {
    usedComponentTypes: Set<string>;
    capabilitySnapshot: WebBuilderCapabilitySnapshot;
    resolveContext: WebBuilderPluginResolveContext;
    session: WebBuilderPluginSession;
}
export declare const createWebBuilderPluginLoadPlan: (options: WebBuilderPluginLoadPlanOptions) => WebBuilderPluginLoadPlan;
