import type { PageResourceIdentity, WebBuilderPluginCleanup } from './featurePlugin.js';
export interface PageStorageService {
    getDraft: (resource: PageResourceIdentity) => Promise<unknown> | unknown;
    saveDraft: (request: Record<string, unknown>) => Promise<unknown> | unknown;
    generateCss: (request: Record<string, unknown>) => Promise<unknown> | unknown;
    getHistoryDetail: (id: number) => Promise<unknown> | unknown;
    getPagePage: (params: Record<string, unknown>) => Promise<unknown> | unknown;
}
export interface GlobalSettingsSnapshot {
    version?: string;
    hash?: string;
    colors: unknown[];
    typography: unknown;
    customCss: string;
    customCode: unknown[];
    updatedAt?: string;
}
export interface GlobalSettingsLoadContext {
    resource: PageResourceIdentity;
    tenantId?: string | number;
}
export interface GlobalSettingsSaveContext extends GlobalSettingsLoadContext {
    sessionKey?: string;
}
export interface GlobalSettingsService {
    loadDraft: (context: GlobalSettingsLoadContext) => Promise<GlobalSettingsSnapshot> | GlobalSettingsSnapshot;
    saveDraft: (snapshot: GlobalSettingsSnapshot, context: GlobalSettingsSaveContext) => Promise<GlobalSettingsSnapshot> | GlobalSettingsSnapshot;
    publish: (context: GlobalSettingsSaveContext) => Promise<GlobalSettingsSnapshot> | GlobalSettingsSnapshot;
}
export interface I18nService {
    loadBundle?: (context: unknown) => Promise<unknown> | unknown;
    saveBundle?: (context: unknown) => Promise<unknown> | unknown;
    translateEntries?: (context: unknown) => Promise<unknown> | unknown;
    autoTranslateEntries?: (context: unknown) => Promise<unknown> | unknown;
    getEnabledLanguages?: () => Promise<unknown[]> | unknown[];
    getTranslationConfig?: () => Promise<unknown> | unknown;
    getEnabledProviderConfigs?: () => Promise<unknown[]> | unknown[];
}
export interface HostServices {
    page?: PageStorageService;
    globalSettings?: GlobalSettingsService;
    i18n?: I18nService;
    media?: Record<string, unknown>;
    product?: Record<string, unknown>;
    menu?: Record<string, unknown>;
    faq?: Record<string, unknown>;
    inquiry?: Record<string, unknown>;
}
export interface HostUiMessageApi {
    success: (message: unknown) => void;
    warning: (message: unknown) => void;
    info: (message: unknown) => void;
    error: (message: unknown) => void;
}
export interface HostUiConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}
export interface HostUiPromptOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    inputValue?: string;
    inputValidator?: (value: string) => boolean | string;
}
export interface HostUi {
    confirm: (options: HostUiConfirmOptions) => Promise<boolean>;
    message: HostUiMessageApi;
    prompt?: (options: HostUiPromptOptions) => Promise<string | null>;
    openDialog?: (options: Record<string, unknown>) => unknown;
}
export interface RouteAdapter {
    getQuery: () => Record<string, unknown>;
    replaceQuery: (query: Record<string, unknown>) => Promise<void> | void;
    onBeforeLeave: (guard: () => boolean | Promise<boolean>) => WebBuilderPluginCleanup;
}
export interface SettingsSource {
    getSnapshot: () => GlobalSettingsSnapshot | null;
    hydrate: (snapshot: GlobalSettingsSnapshot) => void;
    subscribe: (listener: (snapshot: GlobalSettingsSnapshot | null) => void) => WebBuilderPluginCleanup;
}
export declare const createMemorySettingsSource: () => SettingsSource;
