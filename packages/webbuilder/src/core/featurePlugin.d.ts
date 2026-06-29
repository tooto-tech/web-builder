import type { Editor } from 'grapesjs';
import type { WebBuilderCommandContext } from './commandContext.js';
import type { ResourceTransactionParticipant } from './resourceTransaction.js';
import type { GlobalSettingsSnapshot, HostServices, HostUi, RouteAdapter, SettingsSource } from './hostServices.js';
export interface PageResourceIdentity {
    resourceId?: number;
    resourceKey?: string;
    resourceType?: string;
    resourceScope?: string;
    ownerType?: string;
    ownerId?: number;
}
export interface TenantContext {
    tenantId?: string | number;
    userId?: string | number;
    roles: string[];
    permissions: Set<string>;
    getAccessToken?: () => string;
    getEffectiveTenantId?: () => string | number | undefined;
}
export interface WebBuilderPluginResolveContext {
    resource: PageResourceIdentity;
    projectData: Record<string, unknown> | null;
    usedComponentTypes: Set<string>;
    capabilityIds: Set<string>;
    tenant: TenantContext;
}
export type WebBuilderPluginCleanup = () => void;
export type WebBuilderResourceMode = 'save' | 'publish' | 'lifecycle';
export interface WebBuilderPluginContext extends WebBuilderPluginResolveContext {
    editor: Editor;
    commands: WebBuilderCommandContext;
    hostServices: HostServices;
    settings: SettingsSource;
    ui: HostUi;
    route: RouteAdapter;
    resourceMode?: WebBuilderResourceMode;
    registerCleanup: (cleanup: WebBuilderPluginCleanup) => void;
}
export type WebBuilderPanelLayout = 'side' | 'full';
export interface WebBuilderPanelContribution {
    id: string;
    label: string;
    order?: number;
    icon?: string;
    layout?: WebBuilderPanelLayout;
    preserveOnSelection?: boolean;
    component?: unknown;
    props?: Record<string, unknown> | (() => Record<string, unknown>);
}
export interface WebBuilderBlock {
    id: string;
    label: string;
    category?: string;
    order?: number;
    content: unknown;
    media?: string;
    keywords?: string[];
    componentTypes?: string[];
    contexts?: string[];
    visible?: boolean;
}
export interface WebBuilderBlockPack {
    id: string;
    label?: string;
    order?: number;
    blocks: WebBuilderBlock[];
}
export interface WebBuilderBlockContributionContext extends WebBuilderPluginResolveContext {
    canInsertComponentType: (type: string) => boolean;
}
export interface WebBuilderBlockPackProvider {
    (context: WebBuilderBlockContributionContext): WebBuilderBlockPack[];
}
export interface WebBuilderResourceParticipantProvider {
    (context: WebBuilderPluginContext): ResourceTransactionParticipant[];
}
export interface WebBuilderPublisherContext {
    projectData: Record<string, unknown> | null;
    globalSettings?: GlobalSettingsSnapshot | null;
}
export interface WebBuilderPublisherAssets {
    css?: string;
    headHtml?: string;
    bodyStartHtml?: string;
    bodyEndHtml?: string;
    metadata?: Record<string, unknown>;
}
export interface WebBuilderPublisherContribution {
    id: string;
    order?: number;
    render?: (context: WebBuilderPublisherContext) => WebBuilderPublisherAssets | null | Promise<WebBuilderPublisherAssets | null>;
}
export interface WebBuilderPreviewContribution {
    canLoadPreview?: () => boolean;
    getPreviewProjectData?: () => Record<string, unknown> | null;
    hasPreview?: () => boolean;
    restorePreview?: () => Promise<void> | void;
}
export type WebBuilderPluginAction = 'save' | 'publish';
export interface WebBuilderActionSuccessContext extends WebBuilderPluginContext {
    action: WebBuilderPluginAction;
    silent?: boolean;
    projectData: Record<string, unknown> | null;
}
export type WebBuilderProjectDataHook = (context: WebBuilderPluginContext) => Promise<void> | void;
export type WebBuilderActionHook = (context: WebBuilderPluginContext) => Promise<boolean | void> | boolean | void;
export type WebBuilderActionSuccessHook = (context: WebBuilderActionSuccessContext) => Promise<void> | void;
export interface WebBuilderFeaturePlugin {
    id: string;
    label?: string;
    order?: number;
    alwaysEnabled?: boolean;
    requiredHostServices?: string[];
    loadComponentTypes?: string[];
    insertComponentTypes?: string[];
    activateWhen?: (context: WebBuilderPluginResolveContext) => boolean;
    activateEditor?: (context: WebBuilderPluginContext) => void | WebBuilderPluginCleanup;
    panels?: WebBuilderPanelContribution[];
    blockPacks?: WebBuilderBlockPackProvider[];
    resources?: WebBuilderResourceParticipantProvider[];
    preview?: WebBuilderPreviewContribution;
    beforeProjectLoad?: WebBuilderProjectDataHook;
    beforeProjectSerialize?: WebBuilderProjectDataHook;
    beforeSave?: WebBuilderActionHook;
    beforePublish?: WebBuilderActionHook;
    afterSaveSuccess?: WebBuilderActionSuccessHook;
    afterPublishSuccess?: WebBuilderActionSuccessHook;
    publisher?: WebBuilderPublisherContribution;
}
