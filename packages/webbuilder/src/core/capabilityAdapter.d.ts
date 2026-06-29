import type { PageResourceIdentity, TenantContext } from './featurePlugin.js';
export declare const ALL_SYSTEM_PERMISSION = "*:*:*";
export declare const WEBBUILDER_ALL_CAPABILITY = "webbuilder:*";
export declare const WEBBUILDER_INSERT_ALL_CAPABILITY = "webbuilder:insert:*";
export declare const WEBBUILDER_INSERT_CAPABILITY_PREFIX = "webbuilder:insert:";
export type StaticEntitlementMap = Record<string, readonly string[]>;
export interface WebBuilderCapabilitySnapshot {
    resource: PageResourceIdentity;
    tenant: TenantContext;
    capabilityIds: Set<string>;
}
export interface CreateWebBuilderCapabilitySnapshotOptions {
    tenant: TenantContext;
    resource?: PageResourceIdentity;
    usedComponentTypes?: Set<string>;
    entitlements?: StaticEntitlementMap;
    superAdminRoles?: readonly string[];
}
export interface WebBuilderCapabilityAdapter {
    resolve: (resource?: PageResourceIdentity, options?: {
        usedComponentTypes?: Set<string>;
    }) => WebBuilderCapabilitySnapshot;
    canInsertComponentType: (type: string, snapshot?: WebBuilderCapabilitySnapshot) => boolean;
}
export declare const createInsertCapabilityId: (type: string) => string;
export declare const createWebBuilderCapabilitySnapshot: (options: CreateWebBuilderCapabilitySnapshotOptions) => WebBuilderCapabilitySnapshot;
export declare const canInsertComponentType: (snapshot: WebBuilderCapabilitySnapshot, type: string) => boolean;
export declare const hasWebBuilderCapability: (capabilityIds: Set<string>, capabilityId: string) => boolean;
