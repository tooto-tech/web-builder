import type { PageResourceIdentity } from './featurePlugin.js';
export type { PageResourceIdentity } from './featurePlugin.js';
export interface PageDraftRecord extends PageResourceIdentity {
    id?: number;
    resourceName?: string;
    extJson?: string;
    version?: string;
    status?: string;
    schemaJson?: string;
    htmlContentInit?: string;
    htmlContentFull?: string;
    publishStatus?: string;
    createTime?: Date | string;
    updateTime?: Date | string;
    creator?: string;
    updater?: string;
}
export interface PageSaveRequest extends PageResourceIdentity {
    resourceName?: string;
    schemaJson: string;
    baseUpdateTime?: Date | string;
    forceOverride?: boolean;
    sessionKey: string;
}
export type DraftStorageMode = 'backend' | 'indexedDb';
export interface StorageAdapter {
    mode: DraftStorageMode;
    supportsConflictOverride: boolean;
    getDraft: (resource: PageResourceIdentity) => Promise<PageDraftRecord | null>;
    saveDraft: (request: PageSaveRequest, context?: {
        currentPage?: PageDraftRecord | null;
    }) => Promise<PageDraftRecord>;
    generateCss: (request: Record<string, unknown>) => Promise<unknown>;
    getHistoryDetail: (id: number) => Promise<unknown>;
    load: (resource: PageResourceIdentity) => Promise<PageDraftRecord | null>;
    save: (request: PageSaveRequest, context?: {
        currentPage?: PageDraftRecord | null;
    }) => Promise<PageDraftRecord>;
}
export interface SharedResourceRecord extends PageResourceIdentity {
    id?: number;
    schemaJson?: string;
    updateTime?: Date | string;
}
export interface SharedResourceCreateRequest extends PageResourceIdentity {
    name: string;
    schemaJson?: string;
}
export interface SharedResourceSaveRequest extends PageSaveRequest {
}
export interface SharedResourceStorageAdapter {
    getDraft: (resource: PageResourceIdentity) => Promise<SharedResourceRecord>;
    create: (request: SharedResourceCreateRequest) => Promise<SharedResourceRecord>;
    saveDraft: (request: SharedResourceSaveRequest) => Promise<SharedResourceRecord>;
}
export interface LockAcquireOptions {
    forceTakeover?: boolean;
    immediateTakeover?: boolean;
}
export interface LockHolder extends PageResourceIdentity {
    sessionKey: string;
    userId: number;
    username: string;
    lockTime: Date | string;
    heartbeatTime: Date | string;
    isCurrentUser: boolean;
    isCurrentSession: boolean;
}
export interface HeartbeatResult {
    success: boolean;
    takenOver: boolean;
    takeoverInfo?: LockHolder;
}
export interface LockAdapter {
    acquire: (resource: PageResourceIdentity, sessionKey: string, options?: LockAcquireOptions) => Promise<LockHolder | null>;
    release: (resource: PageResourceIdentity, sessionKey: string) => Promise<unknown>;
    heartbeat: (resource: PageResourceIdentity, sessionKey: string) => Promise<HeartbeatResult>;
    releaseKeepalive?: (resource: PageResourceIdentity, sessionKey: string) => boolean;
}
export declare const normalizePageResourceIdentity: (identity?: Partial<PageResourceIdentity> | null) => PageResourceIdentity;
export declare const hasPageResourceLocator: (identity?: PageResourceIdentity | null) => boolean;
