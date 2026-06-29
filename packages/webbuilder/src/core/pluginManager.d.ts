import type { Editor } from 'grapesjs';
import type { WebBuilderCommandContext } from './commandContext.js';
import type { HostServices, HostUi, RouteAdapter, SettingsSource } from './hostServices.js';
import type { TenantContext, WebBuilderFeaturePlugin, WebBuilderPluginResolveContext } from './featurePlugin.js';
export interface WebBuilderPluginActivationContext extends WebBuilderPluginResolveContext {
    commands: WebBuilderCommandContext;
    hostServices: HostServices;
    settings: SettingsSource;
    ui: HostUi;
    route: RouteAdapter;
    tenant: TenantContext;
}
export interface WebBuilderPluginManager {
    resolve: (context: WebBuilderPluginResolveContext) => WebBuilderFeaturePlugin[];
    activateEditor: (editor: Editor, context: WebBuilderPluginActivationContext) => () => void;
    getActivationDiagnostics: () => WebBuilderPluginActivationDiagnostic[];
}
export interface WebBuilderPluginActivationDiagnostic {
    pluginId: string;
    message: string;
    error: unknown;
}
export declare function createWebBuilderPluginManager(plugins: WebBuilderFeaturePlugin[]): WebBuilderPluginManager;
